import crypto from 'node:crypto'
import https from 'node:https'

const BASE = process.env.BT_BASE || 'https://43.136.86.147:15433'
const ENTRY = process.env.BT_ENTRY || '/b48b7f56/'
const USER = process.env.BT_USER || 'mixly'
const PASS = process.env.BT_PASS || ''
const CSP =
  process.env.GO3_FRAME_ANCESTORS ||
  "frame-ancestors 'self' http://localhost:5174 http://127.0.0.1:5174"
const CSP_LINE = `    add_header Content-Security-Policy "${CSP}";`

if (!PASS) {
  console.error('缺少 BT_PASS')
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
        resolve({ status: res.statusCode, headers: res.headers, text: buf.toString('utf8') })
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

function extractBody(res) {
  const d = res.data
  if (!d) return ''
  if (typeof d.data === 'string') return d.data
  if (typeof d.body === 'string') return d.body
  if (d.data && typeof d.data.data === 'string') return d.data.data
  return ''
}

function ensureCsp(conf) {
  if (/frame-ancestors/i.test(conf)) {
    return { changed: false, text: conf, reason: 'already has frame-ancestors' }
  }
  let next = conf.replace(/^\s*add_header\s+X-Frame-Options\s+[^;]+;\s*\n?/gim, '')
  const sslIdx = next.search(/#SSL-END|#error_page\s+404|access_log\s/)
  if (sslIdx >= 0) {
    next = `${next.slice(0, sslIdx)}${CSP_LINE}\n${next.slice(sslIdx)}`
    return { changed: true, text: next, reason: 'inserted before SSL-END/log' }
  }
  const lastServer = next.lastIndexOf('}')
  if (lastServer >= 0) {
    next = `${next.slice(0, lastServer)}${CSP_LINE}\n${next.slice(lastServer)}`
    return { changed: true, text: next, reason: 'inserted before last }' }
  }
  throw new Error('nginx 配置里找不到可插入位置')
}

async function main() {
  await session()
  console.log('已登录宝塔')

  const candidates = [
    '/www/server/panel/vhost/nginx/html_go3.mixly.cn.conf',
    '/www/server/panel/vhost/nginx/go3.mixly.cn.conf',
  ]

  let pathUsed = ''
  let body = ''
  let encoding = 'utf-8'
  for (const p of candidates) {
    const res = await postAction('/files?action=GetFileBody', { path: p })
    const text = extractBody(res)
    console.log('read', p, res.data?.status, text ? `${text.length} chars` : (res.data?.msg || res.raw?.slice(0, 120)))
    if (text.includes('server')) {
      pathUsed = p
      body = text
      encoding = res.data?.encoding || 'utf-8'
      break
    }
  }

  if (!body) {
    throw new Error('读不到 go3.mixly.cn 的 nginx 配置')
  }

  const cspHits = body.split(/\r?\n/).filter((line) => /frame-ancestors|X-Frame-Options|Content-Security-Policy/i.test(line))
  console.log('headers', cspHits.join(' | ') || '(none)')
  const patched = ensureCsp(body)
  console.log(patched.reason)
  if (!patched.changed) {
    console.log('无需改配置')
    return
  }

  const save = await postAction('/files?action=SaveFileBody', {
    path: pathUsed,
    data: patched.text,
    encoding,
  })
  console.log('save', save.data?.status, save.data?.msg || save.raw?.slice(0, 200))
  if (save.data && save.data.status === false) throw new Error('保存配置失败')

  const reload = await postAction('/system?action=ServiceAdmin', { name: 'nginx', type: 'reload' })
  console.log('reload', reload.data?.status, reload.data?.msg || reload.raw?.slice(0, 200))
}

await main()
