/**
 * 手机app设计 — 课堂账号 / 云工程 / 只读发布
 * Mixly Express 与 Vite Connect 共用。数据在 Mixly 目录 mobile-app-cloud-data/
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const os = require('os')
const { spawn, execSync } = require('child_process')

const COOKIE = 'ai2_session'
const SESSION_MS = 30 * 24 * 60 * 60 * 1000
const SHARE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const USERNAME_RE = /^[\u4e00-\u9fffA-Za-z0-9_]{2,20}$/

function resolveDataDir() {
  if (process.env.MIXLY_CLOUD_DATA) return process.env.MIXLY_CLOUD_DATA
  const candidates = [
    path.resolve(__dirname, '../../mixly3-master-fresh/mobile-app-cloud-data'),
    'D:\\桌面\\mixly3-master-fresh\\mobile-app-cloud-data',
    path.resolve(__dirname, '../mobile-app-cloud-data'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(path.dirname(c))) return c
  }
  return candidates[0]
}

function resolveMediaDir() {
  if (process.env.MIXLY_MEDIA_DIR) return process.env.MIXLY_MEDIA_DIR
  const candidates = [
    path.resolve(__dirname, '../../mixly3-master-fresh/mobile-app-design/media'),
    'D:\\桌面\\mixly3-master-fresh\\mobile-app-design\\media',
    path.resolve(__dirname, '../public/media'),
    path.resolve(__dirname, '../dist/media'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function atomicWrite(file, text) {
  ensureDir(path.dirname(file))
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, file)
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function dataPaths() {
  const root = resolveDataDir()
  ensureDir(root)
  ensureDir(path.join(root, 'projects'))
  ensureDir(path.join(root, 'shares'))
  return {
    root,
    users: path.join(root, 'users.json'),
    sessions: path.join(root, 'sessions.json'),
    projects: path.join(root, 'projects'),
    shares: path.join(root, 'shares'),
  }
}

function loadUsers() {
  const data = readJson(dataPaths().users, { users: [] })
  return Array.isArray(data.users) ? data.users : []
}

function saveUsers(users) {
  atomicWrite(dataPaths().users, JSON.stringify({ users }, null, 2))
}

function loadSessions() {
  const data = readJson(dataPaths().sessions, { sessions: [] })
  const now = Date.now()
  const sessions = (Array.isArray(data.sessions) ? data.sessions : []).filter((s) => s && s.expiresAt > now)
  return sessions
}

function saveSessions(sessions) {
  atomicWrite(dataPaths().sessions, JSON.stringify({ sessions }, null, 2))
}

function parseCookies(header) {
  const out = {}
  String(header || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=')
      if (i < 0) return
      const k = part.slice(0, i).trim()
      const v = part.slice(i + 1).trim()
      if (k) out[k] = decodeURIComponent(v)
    })
  return out
}

function getToken(req) {
  const cookies = parseCookies(req.headers && req.headers.cookie)
  if (cookies[COOKIE]) return cookies[COOKIE]
  const auth = (req.headers && req.headers.authorization) || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  return ''
}

function publicUser(u) {
  return { id: u.id, username: u.username }
}

function currentUser(req) {
  const token = getToken(req)
  if (!token) return null
  const sessions = loadSessions()
  const sess = sessions.find((s) => s.token === token)
  if (!sess) return null
  const user = loadUsers().find((u) => u.id === sess.userId)
  return user || null
}

function setSessionCookie(res, token, maxAgeSec) {
  const parts = [`${COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (maxAgeSec <= 0) parts.push('Max-Age=0')
  else parts.push(`Max-Age=${maxAgeSec}`)
  res.setHeader('Set-Cookie', parts.join('; '))
}

function sendJson(res, status, data) {
  if (res.headersSent) return
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function sendText(res, status, text, type) {
  if (res.headersSent) return
  res.statusCode = status
  res.setHeader('Content-Type', (type || 'text/plain; charset=utf-8'))
  res.end(text)
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`
}

function newShareId() {
  let id = ''
  for (let i = 0; i < 6; i++) id += SHARE_CHARS[crypto.randomInt(SHARE_CHARS.length)]
  return id
}

function userProjectDir(userId) {
  const dir = path.join(dataPaths().projects, safeSeg(userId))
  ensureDir(dir)
  return dir
}

function safeSeg(seg) {
  const s = String(seg || '')
  if (!s || s.includes('..') || s.includes('/') || s.includes('\\') || s.includes('\0')) {
    throw new Error('无效编号')
  }
  return s
}

function projectFile(userId, projectId) {
  return path.join(userProjectDir(userId), `${safeSeg(projectId)}.json`)
}

function readUserProject(userId, projectId) {
  const file = projectFile(userId, projectId)
  if (!fs.existsSync(file)) return null
  return readJson(file, null)
}

function writeUserProject(userId, project) {
  atomicWrite(projectFile(userId, project.id), JSON.stringify(project))
}

function listUserProjects(userId) {
  const dir = userProjectDir(userId)
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => {
      const p = readJson(path.join(dir, n), null)
      if (!p || !p.id) return null
      return { id: p.id, name: p.name || '未命名', updatedAt: p.updatedAt || 0, shareId: p.shareId || undefined }
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

function shareDir(shareId) {
  return path.join(dataPaths().shares, safeSeg(shareId))
}

function findShareMeta(shareId) {
  const metaFile = path.join(shareDir(shareId), 'meta.json')
  if (!fs.existsSync(metaFile)) return null
  return readJson(metaFile, null)
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body.__raw)) {
    return req.body
  }
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function requireUser(req, res) {
  const user = currentUser(req)
  if (!user) {
    sendJson(res, 401, { error: '请先登录' })
    return null
  }
  return user
}

function normalizeUsername(name) {
  return String(name || '').trim()
}

async function handleRegister(req, res) {
  const body = await readBody(req)
  const username = normalizeUsername(body.username)
  const password = String(body.password || '')
  if (!USERNAME_RE.test(username)) {
    sendJson(res, 400, { error: '用户名为 2～20 个字，可用中文、字母、数字和下划线' })
    return
  }
  if (password.length < 4 || password.length > 64) {
    sendJson(res, 400, { error: '密码为 4～64 个字符' })
    return
  }
  const users = loadUsers()
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    sendJson(res, 409, { error: '该用户名已被注册' })
    return
  }
  const salt = crypto.randomBytes(16).toString('hex')
  const user = {
    id: newId('u'),
    username,
    salt,
    hash: hashPassword(password, salt),
    createdAt: Date.now(),
  }
  users.push(user)
  saveUsers(users)
  issueSession(res, user)
}

async function handleLogin(req, res) {
  const body = await readBody(req)
  const username = normalizeUsername(body.username)
  const password = String(body.password || '')
  const user = loadUsers().find((u) => u.username.toLowerCase() === username.toLowerCase())
  if (!user) {
    sendJson(res, 401, { error: '用户名或密码不对' })
    return
  }
  const hash = hashPassword(password, user.salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(user.hash, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    sendJson(res, 401, { error: '用户名或密码不对' })
    return
  }
  issueSession(res, user)
}

function issueSession(res, user) {
  const sessions = loadSessions()
  const token = crypto.randomBytes(24).toString('hex')
  sessions.push({
    token,
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_MS,
  })
  saveSessions(sessions)
  setSessionCookie(res, token, Math.floor(SESSION_MS / 1000))
  sendJson(res, 200, { user: publicUser(user) })
}

function handleLogout(req, res) {
  const token = getToken(req)
  if (token) {
    saveSessions(loadSessions().filter((s) => s.token !== token))
  }
  setSessionCookie(res, '', 0)
  sendJson(res, 200, { ok: true })
}

function handleMe(req, res) {
  const user = currentUser(req)
  sendJson(res, 200, { user: user ? publicUser(user) : null })
}

function handleListProjects(req, res) {
  const user = requireUser(req, res)
  if (!user) return
  sendJson(res, 200, { projects: listUserProjects(user.id) })
}

function handleGetProject(req, res, projectId) {
  const user = requireUser(req, res)
  if (!user) return
  const p = readUserProject(user.id, projectId)
  if (!p) {
    sendJson(res, 404, { error: '云端没有这个工程' })
    return
  }
  sendJson(res, 200, { project: p })
}

async function handlePutProject(req, res) {
  const user = requireUser(req, res)
  if (!user) return
  const body = await readBody(req)
  const project = body.project || body
  if (!project || typeof project !== 'object' || !project.id || !Array.isArray(project.screens)) {
    sendJson(res, 400, { error: '工程数据不完整' })
    return
  }
  const existing = readUserProject(user.id, project.id)
  const next = {
    ...project,
    name: String(project.name || '未命名').slice(0, 80),
    updatedAt: Date.now(),
    shareId: project.shareId || (existing && existing.shareId) || undefined,
  }
  writeUserProject(user.id, next)
  sendJson(res, 200, {
    ok: true,
    project: { id: next.id, name: next.name, updatedAt: next.updatedAt, shareId: next.shareId },
  })
}

function handleDeleteProject(req, res, projectId) {
  const user = requireUser(req, res)
  if (!user) return
  const file = projectFile(user.id, projectId)
  if (!fs.existsSync(file)) {
    sendJson(res, 404, { error: '云端没有这个工程' })
    return
  }
  const existing = readUserProject(user.id, projectId)
  fs.unlinkSync(file)
  if (existing && existing.shareId) {
    try {
      fs.rmSync(shareDir(existing.shareId), { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }
  sendJson(res, 200, { ok: true })
}

const CF_ORIGIN_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i
const tunnelState = {
  proc: null,
  origin: '',
  starting: null,
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseTrycloudflareOrigin(text) {
  const m = String(text || '').match(CF_ORIGIN_RE)
  return m ? m[0].replace(/\/+$/, '') : ''
}

function originFile() {
  return path.join(dataPaths().root, 'public-origin.json')
}

function cloudflaredLogFile() {
  return path.join(dataPaths().root, 'cloudflared.log')
}

function findCloudflared() {
  const names = ['cloudflared.exe', 'cloudflared']
  const dirs = [
    path.resolve(__dirname, '../../mixly3-master-fresh/tools'),
    'D:\\桌面\\mixly3-master-fresh\\tools',
    path.resolve(__dirname, '../tools'),
    path.resolve(__dirname, '../../tools'),
  ]
  for (const dir of dirs) {
    for (const name of names) {
      const file = path.join(dir, name)
      if (fs.existsSync(file)) return file
    }
  }
  return ''
}

function isCloudflaredProcessRunning() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('tasklist /FI "IMAGENAME eq cloudflared.exe" /NH', {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 4000,
      })
      return /cloudflared\.exe/i.test(out)
    }
    execSync('pgrep -x cloudflared', { stdio: 'ignore', timeout: 4000 })
    return true
  } catch {
    return false
  }
}

function isCloudflaredPid(pid) {
  const n = Number(pid)
  if (!Number.isFinite(n) || n <= 0) return false
  try {
    if (process.platform === 'win32') {
      const out = execSync(`tasklist /FI "PID eq ${Math.floor(n)}" /NH`, {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 4000,
      })
      return /cloudflared/i.test(out)
    }
    process.kill(n, 0)
    return true
  } catch {
    return false
  }
}

function readSavedOrigin() {
  const data = readJson(originFile(), {})
  const origin = parseTrycloudflareOrigin(data && data.origin)
  if (!origin) return ''
  if (data.pid && isCloudflaredPid(data.pid)) return origin
  if (isCloudflaredProcessRunning()) return origin
  return ''
}

function saveOrigin(origin, pid) {
  atomicWrite(
    originFile(),
    JSON.stringify(
      {
        origin,
        pid: pid || null,
        updatedAt: Date.now(),
      },
      null,
      2,
    ),
  )
}

function parseOriginFromLog() {
  const files = [cloudflaredLogFile()]
  try {
    const bin = findCloudflared()
    if (bin) files.push(path.join(path.dirname(bin), 'cloudflared.log'))
  } catch {
    /* ignore */
  }
  for (const file of files) {
    try {
      if (!fs.existsSync(file)) continue
      const text = fs.readFileSync(file, 'utf8')
      const matches = String(text).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi)
      if (matches && matches.length) return matches[matches.length - 1].replace(/\/+$/, '')
    } catch {
      /* ignore */
    }
  }
  return ''
}

function originFromForwarded(req) {
  if (process.env.MIXLY_PUBLIC_ORIGIN) {
    return String(process.env.MIXLY_PUBLIC_ORIGIN).replace(/\/+$/, '')
  }
  const xfHost = String((req.headers && req.headers['x-forwarded-host']) || '')
    .split(',')[0]
    .trim()
  const hostRaw = xfHost || String((req.headers && req.headers.host) || '')
  const host = hostRaw.split(':')[0].trim().toLowerCase()
  if (!host) return ''
  if (/^[a-z0-9-]+\.trycloudflare\.com$/.test(host)) return `https://${host}`
  if (host === '127.0.0.1' || host === 'localhost' || host.endsWith('.local')) return ''
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return ''
  const xfProto = String((req.headers && req.headers['x-forwarded-proto']) || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
  const proto = xfProto === 'http' || xfProto === 'https' ? xfProto : 'https'
  return `${proto}://${host}`
}

function localListenPort(req) {
  const p = req && req.socket && req.socket.localPort
  if (Number.isFinite(p) && p > 0) return p
  return 65234
}

function lanOrigins(port) {
  const out = []
  const nets = os.networkInterfaces()
  Object.keys(nets).forEach((name) => {
    ;(nets[name] || []).forEach((net) => {
      const v4 = net.family === 'IPv4' || net.family === 4
      if (v4 && !net.internal && net.address) out.push(`http://${net.address}:${port}`)
    })
  })
  return out
}

function startTunnel(targetUrl) {
  if (tunnelState.origin) return Promise.resolve({ origin: tunnelState.origin, error: '' })
  if (tunnelState.starting) return tunnelState.starting
  const bin = findCloudflared()
  if (!bin) {
    return Promise.resolve({ origin: '', error: '本机没有公网隧道程序（tools/cloudflared.exe）' })
  }

  tunnelState.starting = new Promise((resolve) => {
    let settled = false
    const finish = (origin, error) => {
      if (settled) return
      settled = true
      resolve({ origin: origin || '', error: error || '' })
    }

    let buf = ''
    let proc
    try {
      proc = spawn(bin, ['tunnel', '--url', targetUrl, '--protocol', 'http2', '--no-autoupdate'], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (e) {
      finish('', e instanceof Error ? e.message : String(e))
      return
    }
    tunnelState.proc = proc

    const onData = (chunk) => {
      const s = chunk.toString()
      try {
        fs.appendFileSync(cloudflaredLogFile(), s)
      } catch {
        /* ignore */
      }
      buf += s
      if (buf.length > 24000) buf = buf.slice(-10000)
      const origin = parseTrycloudflareOrigin(buf)
      if (origin) {
        tunnelState.origin = origin
        saveOrigin(origin, proc.pid)
        finish(origin, '')
      }
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.on('error', (e) => {
      tunnelState.proc = null
      finish('', e instanceof Error ? e.message : String(e))
    })
    proc.on('exit', () => {
      tunnelState.proc = null
      tunnelState.origin = ''
      finish('', '公网隧道已退出')
    })
    setTimeout(() => {
      finish(tunnelState.origin, tunnelState.origin ? '' : '公网链接开通较慢，请再点一次发布')
    }, 28000)
  }).finally(() => {
    tunnelState.starting = null
  })

  return tunnelState.starting
}

async function ensurePublicOrigin(req) {
  const fromReq = originFromForwarded(req)
  if (fromReq) return { origin: fromReq, error: '' }
  if (process.env.MIXLY_PUBLIC_ORIGIN) {
    return { origin: String(process.env.MIXLY_PUBLIC_ORIGIN).replace(/\/+$/, ''), error: '' }
  }
  if (tunnelState.origin) return { origin: tunnelState.origin, error: '' }

  const saved = readSavedOrigin()
  if (saved) {
    tunnelState.origin = saved
    return { origin: saved, error: '' }
  }

  const logged = parseOriginFromLog()
  if (logged && isCloudflaredProcessRunning()) {
    tunnelState.origin = logged
    saveOrigin(logged, null)
    return { origin: logged, error: '' }
  }

  if (isCloudflaredProcessRunning() && fs.existsSync(cloudflaredLogFile())) {
    const deadline = Date.now() + 12000
    while (Date.now() < deadline) {
      const origin = parseOriginFromLog()
      if (origin) {
        tunnelState.origin = origin
        saveOrigin(origin, null)
        return { origin: origin, error: '' }
      }
      await sleep(400)
    }
  }

  const port = localListenPort(req)
  return startTunnel(`http://127.0.0.1:${port}`)
}

function buildShareLinks(req, shareId, tunnel) {
  const sharePath = `/s/${shareId}/`
  const port = localListenPort(req)
  const publicOrigin = (tunnel && tunnel.origin) || originFromForwarded(req) || ''
  return {
    shareId,
    path: sharePath,
    publicUrl: publicOrigin ? `${publicOrigin}${sharePath}` : '',
    lanUrls: lanOrigins(port).map((o) => `${o}${sharePath}`),
    localUrl: `http://127.0.0.1:${port}${sharePath}`,
    tunnelError: publicOrigin ? '' : (tunnel && tunnel.error) || '',
  }
}

async function handleShareOrigin(req, res) {
  const user = requireUser(req, res)
  if (!user) return
  const tunnel = await ensurePublicOrigin(req)
  const port = localListenPort(req)
  const publicOrigin = tunnel.origin || originFromForwarded(req) || ''
  sendJson(res, 200, {
    publicOrigin,
    lanOrigins: lanOrigins(port),
    localOrigin: `http://127.0.0.1:${port}`,
    tunnelError: publicOrigin ? '' : tunnel.error || '',
  })
}

async function handlePublish(req, res) {
  const user = requireUser(req, res)
  if (!user) return
  const body = await readBody(req)
  const projectId = String(body.projectId || '')
  const html = String(body.html || '')
  if (!projectId || !html.includes('<html')) {
    sendJson(res, 400, { error: '缺少工程或成品页面' })
    return
  }
  if (Buffer.byteLength(html, 'utf8') > 12 * 1024 * 1024) {
    sendJson(res, 413, { error: '成品页面过大' })
    return
  }
  let project = readUserProject(user.id, projectId)
  if (!project) {
    sendJson(res, 404, { error: '请先云保存，再发布' })
    return
  }
  let shareId = project.shareId
  if (shareId) {
    const meta = findShareMeta(shareId)
    if (meta && meta.userId && meta.userId !== user.id) shareId = ''
  }
  if (!shareId) {
    do {
      shareId = newShareId()
    } while (fs.existsSync(shareDir(shareId)))
  }
  const dir = shareDir(shareId)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
  const meta = {
    shareId,
    projectId,
    userId: user.id,
    name: project.name || body.name || '未命名',
    updatedAt: Date.now(),
  }
  atomicWrite(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
  project = { ...project, shareId, updatedAt: Date.now() }
  writeUserProject(user.id, project)
  const tunnel = await ensurePublicOrigin(req)
  sendJson(res, 200, buildShareLinks(req, shareId, tunnel))
}

async function handleUnpublish(req, res) {
  const user = requireUser(req, res)
  if (!user) return
  const body = await readBody(req)
  const projectId = String(body.projectId || '')
  const project = readUserProject(user.id, projectId)
  if (!project) {
    sendJson(res, 404, { error: '云端没有这个工程' })
    return
  }
  if (project.shareId) {
    try {
      fs.rmSync(shareDir(project.shareId), { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    delete project.shareId
    project.updatedAt = Date.now()
    writeUserProject(user.id, project)
  }
  sendJson(res, 200, { ok: true })
}

function handleSharePage(req, res, shareId) {
  let dir
  try {
    dir = shareDir(shareId)
  } catch {
    sendText(res, 404, '链接无效')
    return
  }
  const file = path.join(dir, 'index.html')
  if (!fs.existsSync(file)) {
    sendText(res, 404, '链接无效或已取消发布')
    return
  }
  sendText(res, 200, fs.readFileSync(file, 'utf8'), 'text/html; charset=utf-8')
}

function handleShareMedia(req, res, filename) {
  const media = resolveMediaDir()
  const name = path.basename(filename)
  if (!media || name !== filename || name.includes('..')) {
    sendText(res, 404, 'not found')
    return
  }
  const file = path.join(media, name)
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    sendText(res, 404, 'not found')
    return
  }
  const ext = path.extname(name).toLowerCase()
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  }
  res.statusCode = 200
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}

function pathnameOf(req) {
  const raw = req.url || '/'
  try {
    return decodeURIComponent(raw.split('?')[0])
  } catch {
    return raw.split('?')[0]
  }
}

/** Vite / 裸 Node：处理 /api/auth|/api/cloud 与 /s/:id，未匹配返回 false */
async function handleRaw(req, res) {
  const url = pathnameOf(req)
  const method = req.method || 'GET'

  const shareBare = url.match(/^\/s\/([a-z0-9]{4,12})$/)
  if (shareBare && method === 'GET') {
    res.statusCode = 302
    res.setHeader('Location', `/s/${shareBare[1]}/`)
    res.end()
    return true
  }
  const sharePage = url.match(/^\/s\/([a-z0-9]{4,12})\/$/)
  if (sharePage && method === 'GET') {
    handleSharePage(req, res, sharePage[1])
    return true
  }
  const shareIndex = url.match(/^\/s\/([a-z0-9]{4,12})\/index\.html$/)
  if (shareIndex && method === 'GET') {
    handleSharePage(req, res, shareIndex[1])
    return true
  }
  const shareMedia = url.match(/^\/s\/([a-z0-9]{4,12})\/media\/([^/]+)$/)
  if (shareMedia && method === 'GET') {
    handleShareMedia(req, res, shareMedia[2])
    return true
  }

  if (url === '/api/auth/register' && method === 'POST') {
    await handleRegister(req, res)
    return true
  }
  if (url === '/api/auth/login' && method === 'POST') {
    await handleLogin(req, res)
    return true
  }
  if (url === '/api/auth/logout' && method === 'POST') {
    handleLogout(req, res)
    return true
  }
  if (url === '/api/auth/me' && method === 'GET') {
    handleMe(req, res)
    return true
  }
  if (url === '/api/cloud/projects' && method === 'GET') {
    handleListProjects(req, res)
    return true
  }
  if (url === '/api/cloud/projects' && method === 'PUT') {
    await handlePutProject(req, res)
    return true
  }
  const one = url.match(/^\/api\/cloud\/projects\/([^/]+)$/)
  if (one && method === 'GET') {
    handleGetProject(req, res, decodeURIComponent(one[1]))
    return true
  }
  if (one && method === 'DELETE') {
    handleDeleteProject(req, res, decodeURIComponent(one[1]))
    return true
  }
  if (url === '/api/cloud/publish' && method === 'POST') {
    await handlePublish(req, res)
    return true
  }
  if (url === '/api/cloud/share-origin' && method === 'GET') {
    await handleShareOrigin(req, res)
    return true
  }
  if (url === '/api/cloud/unpublish' && method === 'POST') {
    await handleUnpublish(req, res)
    return true
  }
  if (url === '/api/ai-chat' && method === 'GET') {
    sendJson(res, 200, { ok: true, proxy: true })
    return true
  }
  if (url === '/api/ai-chat' && method === 'POST') {
    await handleAiChat(req, res)
    return true
  }
  return false
}

function normalizeChatCompletionsUrl(raw) {
  let u = String(raw || '').trim().replace(/^['"“”‘’]+|['"“”‘’]+$/g, '')
  if (!u) u = 'https://api.deepseek.com'
  let query = ''
  const q = u.indexOf('?')
  if (q >= 0) {
    query = u.slice(q)
    u = u.slice(0, q)
  }
  u = u.replace(/\/+$/, '')
  if (/\/chat\/completions$/i.test(u)) return u + query
  if (/\/v\d+$/i.test(u) || /\/compatible-mode\/v\d+$/i.test(u) || /\/openai\/v\d+$/i.test(u)) {
    return `${u}/chat/completions${query}`
  }
  return `${u}/v1/chat/completions${query}`
}

function extractTextPart(v) {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (v && typeof v.text === 'string' && v.text.trim()) return v.text.trim()
  return ''
}

function extractChatContent(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim()
  const choice = data.choices && data.choices[0]
  if (!choice) return typeof data.content === 'string' ? data.content.trim() : ''
  if (typeof choice.text === 'string' && choice.text.trim()) return choice.text.trim()
  const msg = choice.message || {}
  if (typeof msg.content === 'string' && msg.content.trim()) return msg.content.trim()
  if (Array.isArray(msg.content)) {
    const parts = msg.content.map(extractTextPart).filter(Boolean)
    if (parts.length) return parts.join('\n')
  }
  if (typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) {
    return msg.reasoning_content.trim()
  }
  return typeof data.content === 'string' ? data.content.trim() : ''
}

function explainUpstreamError(err, url) {
  const msg = err instanceof Error ? err.message : String(err)
  const name = err && err.name ? String(err.name) : ''
  if (name === 'TimeoutError' || /aborted|timeout/i.test(msg)) {
    return '模型响应超时（已等 2 分钟）。请检查网络或换一个模型。'
  }
  if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
    return `找不到接口主机。请核对地址是否写对：${url}`
  }
  if (/ECONNREFUSED/i.test(msg)) {
    return `接口拒绝连接：${url}`
  }
  if (/certificate|CERT|SSL|UNABLE_TO_VERIFY/i.test(msg)) {
    return '接口证书校验失败。请确认地址是 https 且有效。'
  }
  if (/Failed to parse URL|Invalid URL/i.test(msg)) {
    return `接口地址无效：${url}`
  }
  return `无法连接模型接口（${msg}）。当前请求：${url}`
}

async function handleAiChat(req, res) {
  if (typeof fetch !== 'function') {
    sendJson(res, 500, { error: '当前 Node 版本过旧，不支持 fetch。请升级到 Node 18 以上。' })
    return
  }
  let body
  try {
    body = await readBody(req)
  } catch {
    sendJson(res, 400, { error: '请求体不是合法 JSON' })
    return
  }
  const model = String(body.model || '').trim()
  const apiKey = String(body.apiKey || '').trim().replace(/^Bearer\s+/i, '').replace(/[\u200b\u200c\u200d\ufeff]/g, '')
  const rawMessages = body.messages
  if (!apiKey) {
    sendJson(res, 400, { error: '请填写 API 密钥' })
    return
  }
  if (!model) {
    sendJson(res, 400, { error: '请填写模型名，例如 deepseek-chat' })
    return
  }
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    sendJson(res, 400, { error: '消息为空' })
    return
  }

  const mapped = rawMessages.map((m) => ({
    role: m && ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
    content: String((m && m.content) || '').slice(0, 80000),
  }))
  const system = mapped.filter((m) => m.role === 'system').slice(0, 2)
  const rest = mapped.filter((m) => m.role !== 'system').slice(-28)
  const messages = [...system, ...rest]

  const url = normalizeChatCompletionsUrl(body.baseUrl)
  if (!/^https?:\/\//i.test(url)) {
    sendJson(res, 400, { error: '接口地址必须以 http:// 或 https:// 开头' })
    return
  }

  const payload = {
    model,
    stream: false,
    messages,
  }
  const skipTemp = /reasoner|thinking|^o[1-4]/i.test(model)
  if (!skipTemp && typeof body.temperature === 'number' && Number.isFinite(body.temperature)) {
    payload.temperature = body.temperature
  }

  let upstream
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 120000)
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
  } catch (err) {
    sendJson(res, 502, { error: explainUpstreamError(err, url) })
    return
  } finally {
    clearTimeout(timer)
  }

  const raw = await upstream.text()
  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    const snippet = raw.replace(/\s+/g, ' ').slice(0, 180)
    sendJson(res, 502, {
      error: `接口没有返回 JSON（HTTP ${upstream.status}）。${snippet || '空响应'}`,
    })
    return
  }

  if (!upstream.ok) {
    const fromApi =
      (data && data.error && (data.error.message || data.error)) ||
      (data && (data.message || data.msg)) ||
      raw.slice(0, 240)
    const hint =
      upstream.status === 401 || upstream.status === 403
        ? '密钥无效，或该密钥无权使用此模型。'
        : upstream.status === 404
          ? '接口地址或模型名不对（常见是少写/多写了 /v1）。'
          : upstream.status === 429
            ? '调用太频繁或额度用完。'
            : `HTTP ${upstream.status}`
    sendJson(res, 502, { error: `${hint} ${String(fromApi).slice(0, 300)}` })
    return
  }

  const content = extractChatContent(data)
  if (!content) {
    sendJson(res, 502, { error: '模型返回成功，但正文为空。请核对模型名，或换一个对话模型。' })
    return
  }
  sendJson(res, 200, { content })
}

function attachConnect(middlewares) {
  middlewares.use(async (req, res, next) => {
    try {
      const handled = await handleRaw(req, res)
      if (!handled) next()
    } catch (e) {
      sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) })
    }
  })
}

function mount(app) {
  attachConnect(app)
}

module.exports = {
  mount,
  attachConnect,
  handleRaw,
  resolveDataDir,
}
