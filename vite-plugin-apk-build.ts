import type { Plugin, Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

type Job = {
  id: string
  status: 'queued' | 'running' | 'done' | 'error'
  name: string
  outName?: string
  apkPath?: string
  appId?: string
  error?: string
  logFile: string
  wwwDir: string
  startedAt: number
  childPid?: number
}

const jobs = new Map<string, Job>()
let activeJobId: string | null = null

const PROGRESS_FILE = path.join(os.tmpdir(), 'ai2-apk-progress.json')

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function readProgress(): { stage?: string; message?: string; percent?: number } | null {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return null
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) as {
      stage?: string
      message?: string
      percent?: number
    }
  } catch {
    return null
  }
}

function explainWinExit(code: number | null): string {
  if (code === null || code === undefined) return ''
  const u = code < 0 ? code + 0x100000000 : code
  if (u === 0xc0000409) return '（Node 中文路径崩溃：请用 E:\\ai2-node\\scripts 启动）'
  if (u === 0xc0000005) return '（访问冲突：请关闭占用文件的程序后重试）'
  return ''
}

function ensureAsciiBuilder(repoRoot: string): string {
  const asciiDir = 'E:\\ai2-node\\scripts'
  const asciiScript = path.join(asciiDir, 'build-apk-from-www.mjs')
  const src = path.join(repoRoot, 'scripts', 'build-apk-from-www.mjs')
  fs.mkdirSync(asciiDir, { recursive: true })
  fs.copyFileSync(src, asciiScript)
  return asciiScript
}

function startJob(repoRoot: string, job: Job, appId: string | undefined, resultFile: string) {
  job.status = 'running'
  activeJobId = job.id
  try {
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify({ stage: 'start', message: '启动打包进程…', percent: 24, updatedAt: Date.now() }),
      'utf8',
    )
  } catch {
    /* ignore */
  }

  const script = ensureAsciiBuilder(repoRoot)
  const nodeExe = fs.existsSync('E:\\Node\\node.exe') ? 'E:\\Node\\node.exe' : process.execPath
  const logFd = fs.openSync(job.logFile, 'a')
  const child = spawn(
    nodeExe,
    [script, '--www', job.wwwDir, '--name', job.name, ...(appId ? ['--app-id', appId] : []), '--result', resultFile],
    {
      cwd: 'E:\\ai2-node',
      env: { ...process.env, PATH: `E:\\Node;${process.env.PATH || ''}` },
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
      shell: false,
    },
  )
  job.childPid = child.pid

  const closeLog = () => {
    try {
      fs.closeSync(logFd)
    } catch {
      /* already closed */
    }
  }

  child.on('error', (err) => {
    closeLog()
    job.status = 'error'
    job.error = String(err)
    if (activeJobId === job.id) activeJobId = null
  })

  child.on('exit', (code) => {
    closeLog()
    try {
      if (code === 0 && fs.existsSync(resultFile)) {
        const r = JSON.parse(fs.readFileSync(resultFile, 'utf8')) as {
          apkPath: string
          outName: string
          appId: string
        }
        job.status = 'done'
        job.apkPath = r.apkPath
        job.outName = r.outName
        job.appId = r.appId
      } else {
        const log = fs.existsSync(job.logFile) ? fs.readFileSync(job.logFile, 'utf8').slice(-4000) : ''
        job.status = 'error'
        job.error = `打包失败（退出码 ${code}）${explainWinExit(code)}\n${log}`
      }
    } catch (e) {
      job.status = 'error'
      job.error = e instanceof Error ? e.message : String(e)
    } finally {
      if (activeJobId === job.id) activeJobId = null
    }
  })
}

function attachApkApi(middlewares: Connect.Server, repoRoot: string) {
  middlewares.use(async (req, res, next) => {
    const url = req.url?.split('?')[0] || ''

    if (url === '/api/apk-status' && req.method === 'GET') {
      const ok =
        fs.existsSync('E:\\ai2-build-env\\jdk-21\\bin\\java.exe') &&
        fs.existsSync('E:\\ai2-node\\mobile-shell')
      sendJson(res, 200, {
        ok,
        shell: 'E:\\ai2-node\\mobile-shell',
        env: 'E:\\ai2-build-env',
        busy: Boolean(activeJobId),
        activeJobId,
      })
      return
    }

    if (url === '/api/build-apk' && req.method === 'POST') {
      try {
        if (activeJobId) {
          const cur = jobs.get(activeJobId)
          if (cur && (cur.status === 'running' || cur.status === 'queued')) {
            sendJson(res, 409, { error: '已有打包任务进行中，请等待完成后再试。', jobId: activeJobId })
            return
          }
        }

        const body = (await readJsonBody(req)) as {
          name?: string
          appId?: string
          files?: Record<string, string>
        }
        const name = body.name || 'AI2学生作品'
        const files = body.files || {}
        if (!files['index.html']) {
          sendJson(res, 400, { error: '缺少 files.index.html' })
          return
        }

        const id = `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
        const jobDir = path.join(os.tmpdir(), 'ai2-apk-jobs', id)
        const wwwDir = path.join(jobDir, 'www')
        fs.rmSync(jobDir, { recursive: true, force: true })
        fs.mkdirSync(wwwDir, { recursive: true })
        for (const [rel, content] of Object.entries(files)) {
          if (rel.includes('..') || path.isAbsolute(rel)) continue
          const dest = path.join(wwwDir, rel.replace(/\//g, path.sep))
          fs.mkdirSync(path.dirname(dest), { recursive: true })
          fs.writeFileSync(dest, content, 'utf8')
        }

        const job: Job = {
          id,
          status: 'queued',
          name,
          logFile: path.join(jobDir, 'build.log'),
          wwwDir,
          startedAt: Date.now(),
        }
        jobs.set(id, job)
        startJob(repoRoot, job, body.appId, path.join(jobDir, 'result.json'))
        sendJson(res, 202, { jobId: id })
      } catch (e) {
        sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) })
      }
      return
    }

    const stMatch = url.match(/^\/api\/build-apk\/([^/]+)\/status$/)
    if (stMatch && req.method === 'GET') {
      const job = jobs.get(stMatch[1])
      if (!job) {
        sendJson(res, 404, { error: '任务不存在（可能已重启开发服务器）。' })
        return
      }
      const progress = readProgress()
      sendJson(res, 200, {
        jobId: job.id,
        status: job.status,
        outName: job.outName,
        appId: job.appId,
        error: job.error,
        elapsedMs: Date.now() - job.startedAt,
        stage: progress?.stage,
        stageMessage: progress?.message,
        stagePercent: progress?.percent,
      })
      return
    }

    const dlMatch = url.match(/^\/api\/build-apk\/([^/]+)\/download$/)
    if (dlMatch && req.method === 'GET') {
      const job = jobs.get(dlMatch[1])
      if (!job || job.status !== 'done' || !job.apkPath || !fs.existsSync(job.apkPath)) {
        sendJson(res, 404, { error: 'APK 尚未就绪' })
        return
      }
      const buf = fs.readFileSync(job.apkPath)
      const outName = (job.outName || 'app-debug.apk').replace(/[^\w.-]+/g, '_')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/vnd.android.package-archive')
      res.setHeader('Content-Disposition', `attachment; filename="${outName}"`)
      res.setHeader('X-Apk-Name', outName)
      res.setHeader('Content-Length', String(buf.length))
      res.end(buf)
      return
    }

    next()
  })
}

/** 本机一键打 APK：异步子进程，不阻塞 Vite */
export function apkBuildPlugin(repoRoot: string): Plugin {
  return {
    name: 'ai2-apk-build',
    configureServer(server) {
      attachApkApi(server.middlewares, repoRoot)
    },
    configurePreviewServer(server) {
      attachApkApi(server.middlewares, repoRoot)
    },
  }
}
