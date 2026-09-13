import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCAL_API = path.join(ROOT, 'server', 'mobile-app-cloud-api.cjs')
const BASE = process.env.BT_BASE || 'https://43.136.86.147:15433'
const ENTRY = process.env.BT_ENTRY || '/b48b7f56/'
const USER = process.env.BT_USER || 'mixly'
const PASS = process.env.BT_PASS || ''
const REMOTE_DIR = '/www/wwwroot/go3.mixly.cn/mobile-app-cloud'
const REMOTE_FILE = `${REMOTE_DIR}/mobile-app-cloud-api.cjs`

if (!PASS) {
  console.error('缺少 BT_PASS')
  process.exit(1)
}
if (!fs.existsSync(LOCAL_API)) {
  console.error('没有本地 cloud-api')
  process.exit(1)
}

const cookies = new Map()
let requestToken = ''

function cookieHeader() {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

function absorbSetCookie(arr) {
  for (const raw of arr || []) {
    const first = String(raw).split(';')[0]
    const i = first.indexOf('=')
    if (i > 0) cookies.set(first.slice(0, i).trim(), first.slice(i + 1).trim())
  }
}

function request(method, urlStr, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr)
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        Cookie: cookieHeader(),
        ...headers,
      },
      rejectUnauthorized: false,
    }
    if (body) opts.headers['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body)
    const req = https.request(opts, (res) => {
      absorbSetCookie(res.headers['set-cookie'])
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function md5(s) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex')
}

function toPem(raw) {
  const decoded = String(raw).replace(/\\n/g, '\n').replace(/&#10;/g, '\n').replace(/&amp;/g, '&')
  const b64 = decoded
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
  const lines = b64.match(/.{1,64}/g) || []
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`
}

function rsaEncrypt(pem, text) {
  return crypto
    .publicEncrypt({ key: toPem(pem), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(String(text), 'utf8'))
    .toString('base64')
}

function formBody(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&')
}

async function login() {
  const page = await request('GET', BASE + ENTRY)
  const token = page.text.match(/vite_public_login_token\s*=\s*"([^"]+)"/)?.[1]
  const pem = page.text.match(/vite_public_encryption\s*=\s*"([^"]+)"/)?.[1]
  const username = rsaEncrypt(pem, md5(md5(USER + token)))
  const password = rsaEncrypt(pem, md5(`${md5(PASS)}_bt.cn`))
  const res = await request('POST', BASE + '/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BASE,
      Referer: BASE + ENTRY,
    },
    body: formBody({ username, password, safe_mode: '1' }),
  })
  const data = JSON.parse(res.text)
  if (!data.status) throw new Error(`登录失败: ${data.msg}`)
}

async function session() {
  await login()
  const home = await request('GET', BASE + '/')
  requestToken = home.text.match(/vite_public_request_token\s*=\s*"([^"]+)"/)?.[1] || ''
  if (!requestToken) throw new Error('没有 request token')
  cookies.set('request_token', requestToken)
}

async function postAction(pathname, fields) {
  const res = await request('POST', BASE + pathname, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: BASE,
      Referer: BASE + '/',
      'X-Requested-With': 'XMLHttpRequest',
      'x-http-token': requestToken,
    },
    body: formBody(fields),
  })
  try {
    return JSON.parse(res.text)
  } catch {
    return { raw: res.text.slice(0, 400) }
  }
}

function extractBody(res) {
  if (!res) return ''
  if (typeof res.data === 'string') return res.data
  if (typeof res.body === 'string') return res.body
  if (res.data && typeof res.data.data === 'string') return res.data.data
  return ''
}

function buildMultipart(fields, fileField, filename, fileBuf) {
  const boundary = '----BtBound' + crypto.randomBytes(8).toString('hex')
  const chunks = []
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`))
  }
  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ),
  )
  chunks.push(fileBuf)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`))
  return { boundary, body: Buffer.concat(chunks) }
}

async function uploadFile(dirPath, filename, fileBuf) {
  const attempts = [
    ['blob', { f_path: dirPath, f_name: filename, f_size: String(fileBuf.length), f_start: '0' }],
    ['zunfile', { f_path: dirPath }],
  ]
  let last = ''
  for (const [fileField, extra] of attempts) {
    const { boundary, body } = buildMultipart(extra, fileField, filename, fileBuf)
    const res = await request('POST', BASE + '/files?action=upload', {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Origin: BASE,
        Referer: BASE + '/',
        'X-Requested-With': 'XMLHttpRequest',
        'x-http-token': requestToken,
      },
      body,
    })
    let data = null
    try {
      data = JSON.parse(res.text)
    } catch {
      /* ignore */
    }
    if (data && data.status !== false) return { ok: true, via: fileField, data, raw: res.text }
    if (res.status === 200 && /true|成功|ok/i.test(res.text) && !/false/i.test(res.text)) {
      return { ok: true, via: fileField, data, raw: res.text }
    }
    last = `${fileField} ${res.status} ${(res.text || '').slice(0, 180)}`
  }
  return { ok: false, raw: last }
}

async function execShell(cmd) {
  const tries = [
    ['/ajax?action=ExecShell', { shell: cmd }],
    ['/files?action=Exec', { shell: cmd }],
    ['/crontab?action=StartTask', {}],
  ]
  for (const [api, fields] of tries) {
    if (api.includes('crontab')) continue
    const res = await postAction(api, fields)
    if (res && (res.status !== false || res.msg || res.raw)) return { api, res }
  }
  return null
}

await session()
console.log('已登录宝塔')

for (const p of [`${REMOTE_DIR}/server.js`, `${REMOTE_DIR}/start.sh`, `${REMOTE_DIR}/run.log`]) {
  const res = await postAction('/files?action=GetFileBody', { path: p })
  const body = extractBody(res)
  console.log('\n====', p, body ? `${body.length} chars` : res.msg)
  console.log((body || '').slice(0, 800))
}

const buf = fs.readFileSync(LOCAL_API)
const up = await uploadFile(REMOTE_DIR, 'mobile-app-cloud-api.cjs', buf)
console.log('\nupload api', buf.length, up.ok, up.via || '', (up.raw || '').slice(0, 160))
if (!up.ok) throw new Error('上传 cloud-api 失败')

const check = await postAction('/files?action=GetFileBody', { path: REMOTE_FILE })
const remote = extractBody(check)
console.log('remote SHARE_MS', remote.includes('SHARE_MS'), 'purgeExpiredShares', remote.includes('purgeExpiredShares'), remote.length)

const restart = await execShell(`bash ${REMOTE_DIR}/start.sh`)
console.log('restart', JSON.stringify(restart).slice(0, 400))
