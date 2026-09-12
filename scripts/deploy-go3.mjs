import crypto from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const BASE = process.env.BT_BASE || 'https://43.136.86.147:15433'
const ENTRY = process.env.BT_ENTRY || '/b48b7f56/'
const USER = process.env.BT_USER || 'mixly'
const PASS = process.env.BT_PASS || ''
const SITE = '/www/wwwroot/go3.mixly.cn'
const REMOTE_DIR = `${SITE}/mobile-app-design`

if (!PASS) {
  console.error('缺少 BT_PASS')
  process.exit(1)
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('没有 dist/index.html，请先 npm run build')
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
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        resolve({ status: res.statusCode, headers: res.headers, body: buf, text: buf.toString('utf8') })
      })
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
  if (page.status !== 200 || !page.text.includes('vite_public_login_token')) {
    throw new Error(`登录页失败 HTTP ${page.status}`)
  }
  const token = page.text.match(/vite_public_login_token\s*=\s*"([^"]+)"/)?.[1]
  const pem = page.text.match(/vite_public_encryption\s*=\s*"([^"]+)"/)?.[1]
  if (!token || !pem) throw new Error('登录页没有 token/公钥')
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
  return data
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
    return { http: res.status, data: JSON.parse(res.text), raw: res.text }
  } catch {
    return { http: res.status, data: null, raw: res.text }
  }
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

function walkFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walkFiles(p, acc)
    else acc.push(p)
  }
  return acc
}

function stageFresh() {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
  const needed = new Set(['index.html'])
  for (const m of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) needed.add(m[1].replace(/\\/g, '/'))
  for (const rel of ['favicon.ico', 'favicon.svg', 'icon.svg', 'icons.svg', 'manifest.webmanifest', 'mixly-192.png', 'mixly.ico']) {
    if (fs.existsSync(path.join(DIST, rel))) needed.add(rel)
  }
  for (const p of walkFiles(path.join(DIST, 'media'))) {
    needed.add(path.relative(DIST, p).replace(/\\/g, '/'))
  }

  const stage = path.join(process.env.TEMP || ROOT, 'mad-go3-stage')
  fs.rmSync(stage, { recursive: true, force: true })
  for (const rel of needed) {
    const src = path.join(DIST, rel)
    if (!fs.existsSync(src)) continue
    const dest = path.join(stage, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
  return stage
}

function makeZip() {
  const stage = stageFresh()
  const zipPath = path.join(process.env.TEMP || ROOT, 'mobile-app-design-go3.zip')
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
  const tar = spawnSync('tar.exe', ['-a', '-cf', zipPath, '-C', stage, '.'], { encoding: 'utf8' })
  if (tar.status !== 0) throw new Error(`打包失败: ${tar.stderr || tar.stdout}`)
  return { zipPath, size: fs.statSync(zipPath).size, stage }
}

async function uploadTree(localDir, remoteDir) {
  await postAction('/files?action=CreateDir', { path: remoteDir })
  for (const name of fs.readdirSync(localDir)) {
    const src = path.join(localDir, name)
    const dest = `${remoteDir}/${name}`
    if (fs.statSync(src).isDirectory()) {
      await uploadTree(src, dest)
      continue
    }
    const buf = fs.readFileSync(src)
    const up = await uploadFile(remoteDir, name, buf)
    console.log('file', dest, buf.length, up.ok ? 'ok' : up.raw)
    if (!up.ok) throw new Error(`上传失败 ${dest}`)
  }
}

async function deploy() {
  await session()
  console.log('已登录宝塔')
  const { zipPath, size, stage } = makeZip()
  console.log('zip', size)
  const zipBuf = fs.readFileSync(zipPath)
  const up = await uploadFile(SITE, 'mobile-app-design.zip', zipBuf)
  console.log('upload zip', up.ok, up.via || '', (up.raw || '').slice(0, 160))
  if (up.ok) {
    await postAction('/files?action=CreateDir', { path: REMOTE_DIR })
    const uz = await postAction('/files?action=UnZip', {
      sfile: `${SITE}/mobile-app-design.zip`,
      dfile: REMOTE_DIR,
      type: 'zip',
      coding: 'UTF-8',
      password: '',
    })
    console.log('unzip', uz.data?.status, uz.data?.msg || (uz.raw || '').slice(0, 200))
    if (uz.data && uz.data.status === false) throw new Error('解压失败')
  } else {
    console.log('改为一件件上传')
    await uploadTree(stage, REMOTE_DIR)
  }

  const check = await postAction('/files?action=GetFileBody', { path: `${REMOTE_DIR}/index.html` })
  const html = check.data?.data || check.data?.body || ''
  const js = String(html).match(/assets\/index-[^"]+\.js/)?.[0] || ''
  console.log('remote index.js', js || '(未读到)')
}

await deploy()
