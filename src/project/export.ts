import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { AiProject } from '@/project/types'
import { BUILTIN_MEDIA } from '@/project/builtinMedia'
import { buildStandaloneDocument } from '@/runtime/previewDoc'
import { buildProjectScreenCodes } from '@/blocks/codegen'

function buildScreenCodes(project: AiProject): Record<string, string> {
  return buildProjectScreenCodes(project)
}

function appIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="22" fill="#009688"/><path fill="#fff" d="M24 84c0-22 5-42 18-42 7 0 12 8 16 22 4-16 11-26 22-26 16 0 22 16 24 42H90c-2-18-5-28-12-28-8 0-12 12-16 28H48c-3-16-6-28-11-28-5 0-7 10-7 22v6H24z"/><path fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" d="M32 100c14 12 50 12 64 0"/></svg>`
}

function pwaManifest(project: AiProject): string {
  return JSON.stringify(
    {
      name: project.name,
      short_name: project.name.slice(0, 12),
      start_url: './index.html',
      display: 'standalone',
      background_color: '#eef6f4',
      theme_color: '#009688',
      icons: [{ src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    null,
    2,
  )
}

const LEGACY_PNG = ['photo.png', 'sprite.png', 'avatar.png', 'banner.png', 'poster.png']
const BUILTIN_MEDIA_FILES = [
  ...new Set([
    ...Object.values(BUILTIN_MEDIA).map((p) => p.replace('./media/', '')),
    ...LEGACY_PNG,
  ]),
]

const SW_JS = `const CACHE='ai2-export-v5';
const MEDIA=${JSON.stringify(BUILTIN_MEDIA_FILES.map((n) => `./media/${n}`))};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./','./index.html','./manifest.webmanifest','./icon.svg'].concat(MEDIA)).catch(()=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon.svg']))));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});`

async function packBuiltinMedia(folder: JSZip) {
  const media = folder.folder('media')!
  for (const name of BUILTIN_MEDIA_FILES) {
    try {
      const res = await fetch(`./media/${name}`)
      if (!res.ok) continue
      media.file(name, await res.arrayBuffer())
    } catch {
      /* optional */
    }
  }
}

function capacitorAppId(project: AiProject): string {
  const idSuffix = project.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase() || 'app'
  return `com.ai2node.s${idSuffix}`
}

function downloadFileName(project: AiProject): string {
  const id = capacitorAppId(project).replace(/^com\.ai2node\./, '')
  return `ai2-${id}-debug.apk`
}

function wwwTextFiles(project: AiProject, html: string): Record<string, string> {
  return {
    'index.html': html,
    'manifest.webmanifest': pwaManifest(project),
    'sw.js': SW_JS,
    'icon.svg': appIconSvg(),
    'project.json': JSON.stringify(project, null, 2),
  }
}

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename)
}

/** 浏览器 / 静态托管用的 PWA zip */
export async function exportProjectZip(project: AiProject) {
  const zip = new JSZip()
  const html = buildStandaloneDocument(project, buildScreenCodes(project))
  zip.file('index.html', html)
  zip.file('manifest.webmanifest', pwaManifest(project))
  zip.file('sw.js', SW_JS)
  zip.file('icon.svg', appIconSvg())
  zip.file('project.json', JSON.stringify(project, null, 2))
  await packBuiltinMedia(zip)
  zip.file(
    'README.txt',
    `解压后双击 index.html，用浏览器打开就是手机 App。\n电脑上会显示手机外框；手机打开则全屏。\n不需要安装、也不需要联网。\n`,
  )
  const blob = await zip.generateAsync({ type: 'blob' })
  const safe = (project.name || 'ai2-app').replace(/[^\w\u4e00-\u9fff-]+/g, '-').slice(0, 40)
  saveAs(blob, `${safe || 'ai2-app'}-pwa.zip`)
}

export type ApkProgress = {
  message: string
  percent: number
  stage?: string
}

export type ApkExportResult = {
  filename: string
  appId: string
}

/**
 * 本机一键打 APK（需 npm run dev + E:\\ai2-build-env + E:\\ai2-node\\mobile-shell）。
 * 成功后仅触发浏览器下载一份。
 */
export async function exportApk(
  project: AiProject,
  onProgress?: (p: ApkProgress) => void,
): Promise<ApkExportResult> {
  const report = (message: string, percent: number, stage?: string) =>
    onProgress?.({ message, percent: Math.max(0, Math.min(100, Math.round(percent))), stage })
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  report('检查本机构建服务…', 3, 'check')
  let statusRes: Response
  try {
    statusRes = await fetch('/api/apk-status')
  } catch {
    throw new Error('无法连接构建服务。请确认已 npm run dev，地址为 http://localhost:5173')
  }
  if (!statusRes.ok) throw new Error('构建服务不可用。')
  const st = (await statusRes.json()) as { ok?: boolean; busy?: boolean }
  if (!st.ok) {
    throw new Error('未检测到 E:\\ai2-build-env 或 E:\\ai2-node\\mobile-shell。')
  }
  if (st.busy) {
    throw new Error('已有打包任务进行中，请等待完成后再试。')
  }

  report('生成网页资源…', 10, 'www')
  const html = buildStandaloneDocument(project, buildScreenCodes(project))
  const files = wwwTextFiles(project, html)
  const appId = capacitorAppId(project)
  const preferredName = downloadFileName(project)

  report('提交打包任务…', 18, 'submit')
  let startRes: Response
  try {
    startRes = await fetch('/api/build-apk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: project.name, appId, files }),
    })
  } catch {
    throw new Error('提交失败（服务可能已断开）。请重新 npm run dev 后再试。')
  }

  if (startRes.status === 409) {
    const err = (await startRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || '已有打包任务进行中')
  }
  if (!startRes.ok) {
    let detail = ''
    try {
      detail = ((await startRes.json()) as { error?: string }).error || ''
    } catch {
      detail = await startRes.text()
    }
    throw new Error(detail || `提交失败 HTTP ${startRes.status}`)
  }

  const { jobId } = (await startRes.json()) as { jobId: string }
  if (!jobId) throw new Error('服务器未返回 jobId')

  const deadline = Date.now() + 12 * 60 * 1000
  while (Date.now() < deadline) {
    await sleep(1200)
    let poll: Response
    try {
      poll = await fetch(`/api/build-apk/${jobId}/status`)
    } catch {
      throw new Error('无法查询打包进度。请重新 npm run dev 后再试。')
    }
    if (!poll.ok) throw new Error(await poll.text())

    const info = (await poll.json()) as {
      status: string
      outName?: string
      appId?: string
      error?: string
      elapsedMs?: number
      stage?: string
      stageMessage?: string
      stagePercent?: number
    }
    const sec = Math.round((info.elapsedMs || 0) / 1000)

    if (info.status === 'running' || info.status === 'queued') {
      const pct =
        typeof info.stagePercent === 'number'
          ? Math.max(20, Math.min(94, info.stagePercent))
          : 20 + Math.min(74, (sec / 100) * 74)
      const msg = info.stageMessage || `正在打包… 已用时 ${sec}s`
      report(`${msg}（${sec}s）`, pct, info.stage || 'build')
      continue
    }

    if (info.status === 'error') {
      throw new Error((info.error || '打包失败').slice(0, 2000))
    }

    if (info.status === 'done') {
      report('浏览器下载中…', 96, 'download')
      const dl = await fetch(`/api/build-apk/${jobId}/download`)
      if (!dl.ok) throw new Error('下载 APK 失败')
      const blob = await dl.blob()
      const headerName = dl.headers.get('X-Apk-Name')
      const filename = (headerName || info.outName || preferredName).replace(/[^\w.-]+/g, '_')
      downloadBlob(blob, filename)
      report(`已下载 ${filename}`, 100, 'done')
      return {
        filename,
        appId: info.appId || appId,
      }
    }

    throw new Error(`未知任务状态: ${info.status}`)
  }

  throw new Error('打包超时。请检查 Gradle 是否卡住后重试。')
}

/** @deprecated 使用 exportApk */
export async function exportApkProjectZip(project: AiProject) {
  return exportApk(project)
}

export async function importProjectJsonOrZip(file: File): Promise<AiProject> {
  if (file.name.endsWith('.json') || file.type === 'application/json') {
    const text = await file.text()
    return JSON.parse(text) as AiProject
  }
  const zip = await JSZip.loadAsync(file)
  const entry = zip.file('project.json') || zip.file('www/project.json')
  if (!entry) throw new Error('压缩包中缺少 project.json')
  const text = await entry.async('string')
  return JSON.parse(text) as AiProject
}
