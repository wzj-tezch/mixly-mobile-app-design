import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useProjectStore } from '@/project/store'
import { PalettePanel, ComponentTreePanel, PropertiesPanel, ProjectsPanel, AssetsPanel } from '@/app/panels'
import { MixlyTopNav } from '@/app/MixlyTopNav'
import { DesignerCanvas } from '@/designer/DesignerCanvas'
import { BlocksEditor } from '@/blocks/BlocksEditor'
import { UsageHelpDock } from '@/app/UsageHelpDock'
import { EffectDemoModal } from '@/app/EffectDemoModal'
import { AiChatPanel } from '@/app/AiChatPanel'
import { persistLocalKnowledge } from '@/ai/knowledgeBase'
import { HELP_OPEN_EVENT } from '@/app/shortcuts'
import { inspectProject, readEmbedFlags } from '@/app/embedMode'
import type { AiProject } from '@/project/types'

export default function App() {
  const init = useProjectStore((s) => s.init)
  const editorTab = useProjectStore((s) => s.editorTab)
  const leftPanel = useProjectStore((s) => s.leftPanel)
  const setLeftPanel = useProjectStore((s) => s.setLeftPanel)
  const select = useProjectStore((s) => s.select)
  const project = useProjectStore((s) => s.project)
  const designerStage = useProjectStore((s) => s.designerStage)
  const blocksViewMode = useProjectStore((s) => s.blocksViewMode)
  const [apkBusy, setApkBusy] = useState(false)
  const [apkProgress, setApkProgress] = useState<{
    message: string
    percent: number
    stage?: string
  } | null>(null)
  const [apkDone, setApkDone] = useState<{ filename: string } | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [previewOpened, setPreviewOpened] = useState(false)
  const embed = useRef(readEmbedFlags())
  const [leftW, setLeftW] = useState<number | null>(() => {
    try {
      const n = Number(localStorage.getItem('ai2-left-w'))
      if (!Number.isFinite(n)) return null
      const px = Math.round(n)
      // 旧固定默认值改为跟窗口走，不再锁死像素
      if (px === 208 || px === 216 || px === 228 || px === 252) return null
      if (px >= 168 && px <= 480) return Math.min(480, Math.max(168, px))
    } catch {
      /* ignore */
    }
    return null
  })
  const leftDrag = useRef<{ x: number; w: number } | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    if (embed.current.embed) document.body.classList.add('embed-mode')
    else document.body.classList.remove('embed-mode')
    try {
      window.parent.postMessage({ type: 'go3-ready' }, '*')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (designerStage === 'preview') {
      setPreviewOpened(true)
      try {
        window.parent.postMessage({ type: 'go3-preview-opened' }, '*')
      } catch {
        /* ignore */
      }
    }
  }, [designerStage])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      const store = useProjectStore.getState()
      if (data.type === 'go3-inspect') {
        try {
          window.parent.postMessage(inspectProject(store.project, previewOpened || store.designerStage === 'preview'), '*')
        } catch {
          /* ignore */
        }
        return
      }
      if (data.type === 'go3-export') {
        try {
          window.parent.postMessage({ type: 'go3-export-result', project: store.project }, '*')
        } catch {
          /* ignore */
        }
        return
      }
      if (data.type === 'go3-reset') {
        void store.resetLesson()
        return
      }
      if (data.type === 'go3-load') {
        if (typeof data.project === 'string' && data.project.trim()) {
          void store.loadStarter(data.project.trim())
          return
        }
        if (data.json && typeof data.json === 'object') {
          store.replaceProject(data.json as AiProject)
        }
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [previewOpened])

  useEffect(() => {
    persistLocalKnowledge()
  }, [])

  useEffect(() => {
    if (leftPanel === 'guide' || leftPanel === 'ai') setLeftPanel('palette')
  }, [leftPanel, setLeftPanel])

  useEffect(() => {
    document.title = 'Mixly 3.0 For 手机app设计'
  }, [])

  useEffect(() => {
    try {
      if (leftW == null) localStorage.removeItem('ai2-left-w')
      else localStorage.setItem('ai2-left-w', String(leftW))
    } catch {
      /* ignore */
    }
  }, [leftW])

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      const d = leftDrag.current
      if (!d) return
      setLeftW(Math.min(480, Math.max(168, Math.round(d.w + e.clientX - d.x))))
    }
    const onUp = () => {
      if (!leftDrag.current) return
      leftDrag.current = null
      document.body.classList.remove('is-resizing-left')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startLeftResize = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pane = e.currentTarget.parentElement
    const current = leftW ?? Math.round(pane?.getBoundingClientRect().width || window.innerWidth * 0.15)
    leftDrag.current = { x: e.clientX, w: current }
    document.body.classList.add('is-resizing-left')
  }

  useEffect(() => {
    const allow = (el: EventTarget | null) => {
      const t = el as HTMLElement | null
      if (!t || typeof t.closest !== 'function') return false
      if (
        t.closest('.usage-panel') ||
        t.closest('.ai-log') ||
        t.closest('.cloud-modal') ||
        t.closest('.auth-card') ||
        t.closest('.code-pane-body')
      )
        return true
      const tag = t.tagName
      const editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
      if (!editable) return false
      return !!(t.closest('.left') || t.closest('.right') || t.closest('.mixly-nav') || t.closest('.ai-dock') || t.closest('.ai-settings') || t.closest('.ai-composer'))
    }
    const onSelectStart = (e: Event) => {
      if (!allow(e.target)) e.preventDefault()
    }
    document.addEventListener('selectstart', onSelectStart)
    return () => document.removeEventListener('selectstart', onSelectStart)
  }, [])

  const closeOverlays = () => {
    setAiOpen(false)
    setDemoOpen(false)
    window.dispatchEvent(new CustomEvent(HELP_OPEN_EVENT, { detail: { open: false } }))
    if (!apkBusy) {
      setApkDone(null)
      setApkProgress(null)
    }
    select(null)
  }

  const screenName = project.screens.find((s) => s.id === project.activeScreenId)?.name ?? 'Screen1'
  const modeLabel =
    editorTab === 'designer'
      ? designerStage === 'design'
        ? '设计'
        : '预览'
      : blocksViewMode === 'blocks'
        ? '模块'
        : blocksViewMode === 'mix'
          ? '混合'
          : '代码'

  return (
    <div className={`ide${embed.current.embed ? ' embed-ide' : ''}`}>
      <MixlyTopNav
        apkBusy={apkBusy}
        onApkStart={() => {
          setApkBusy(true)
          setApkDone(null)
        }}
        onApkProgress={setApkProgress}
        onApkDone={(filename) => {
          setApkDone({ filename })
          setApkBusy(false)
        }}
        onApkError={(msg) => {
          alert(msg)
          setApkProgress(null)
          setApkBusy(false)
        }}
        onOpenDemo={() => setDemoOpen(true)}
        onToggleDemo={() => setDemoOpen((v) => !v)}
        onCloseOverlays={closeOverlays}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((v) => !v)}
      />

      <div
        className={`ide-body ${editorTab === 'blocks' ? 'blocks-mode' : 'designer-mode'}`}
        style={leftW != null ? { ['--left-w' as string]: `${leftW}px` } : undefined}
      >
        {editorTab === 'designer' && (
          <aside className="left">
            <nav className="side-tabs" aria-label="左侧面板">
              <button
                type="button"
                className={leftPanel === 'palette' ? 'active' : ''}
                title="组件 (Shift+1)"
                onClick={() => setLeftPanel('palette')}
              >
                <span className="side-tab-label">组件</span>
              </button>
              <button
                type="button"
                className={leftPanel === 'components' ? 'active' : ''}
                title="组件树 (Shift+2)"
                onClick={() => setLeftPanel('components')}
              >
                <span className="side-tab-label">结构</span>
              </button>
              <button
                type="button"
                className={leftPanel === 'assets' ? 'active' : ''}
                title="资源 (Shift+3)"
                onClick={() => setLeftPanel('assets')}
              >
                <span className="side-tab-label">资源</span>
              </button>
              <button
                type="button"
                className={leftPanel === 'projects' ? 'active' : ''}
                title="项目 (Shift+4)"
                onClick={() => setLeftPanel('projects')}
              >
                <span className="side-tab-label">项目</span>
              </button>
            </nav>
            <div className="left-body">
              {leftPanel === 'palette' && <PalettePanel />}
              {leftPanel === 'components' && <ComponentTreePanel />}
              {leftPanel === 'projects' && <ProjectsPanel />}
              {leftPanel === 'assets' && <AssetsPanel />}
            </div>
            <div
              className="left-resizer"
              role="separator"
              aria-orientation="vertical"
              aria-label="拖动调整左侧栏宽度"
              title="拖动调整宽度"
              onMouseDown={startLeftResize}
            />
          </aside>
        )}

        <main className="center">
          {editorTab === 'designer' ? <DesignerCanvas /> : <BlocksEditor />}
        </main>

        {editorTab === 'designer' && (
          <aside className="right">
            <div className="panel-heading">属性</div>
            <PropertiesPanel />
          </aside>
        )}
      </div>

      <div className="mix-footer">
        <div className="mix-footer-left">
          <span>Mixly 3.0 For 手机app设计</span>
          <span>{project.name}</span>
          <span>{screenName}</span>
        </div>
        <div className="mix-footer-right">
          <span>{editorTab === 'designer' ? '设计器' : '积木'}</span>
          <span>{modeLabel}</span>
          <span>Copyright © Mixly Team@BNU</span>
        </div>
      </div>

      {!embed.current.embed && <UsageHelpDock />}
      <div className="ai-dock" hidden={!aiOpen} aria-hidden={!aiOpen}>
        <AiChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
      {demoOpen && <EffectDemoModal onClose={() => setDemoOpen(false)} />}

      {(apkProgress || apkDone) && (
        <div className="apk-progress-backdrop" role="alertdialog" aria-busy={apkBusy} aria-live="polite">
          <div className="apk-progress-card">
            <div className="apk-progress-title">{apkDone ? 'APK 已就绪' : '正在导出 APK'}</div>
            {apkBusy && apkProgress && (
              <>
                <div className="apk-progress-steps">
                  {[
                    ['check', '检查'],
                    ['www', '生成'],
                    ['submit', '提交'],
                    ['build', '编译'],
                    ['download', '下载'],
                  ].map(([id, label]) => {
                    const order = ['check', 'www', 'submit', 'build', 'gradle', 'sync', 'cap-add', 'deps', 'prepare', 'copy', 'download', 'done']
                    const cur = apkProgress.stage || 'check'
                    const curIdx = order.indexOf(cur)
                    const stepIdx = order.indexOf(id)
                    const active =
                      id === 'build'
                        ? curIdx >= order.indexOf('submit') && curIdx < order.indexOf('download')
                        : stepIdx >= 0 && curIdx >= stepIdx
                    return (
                      <span key={id} className={`apk-step${active ? ' on' : ''}`}>
                        {label}
                      </span>
                    )
                  })}
                </div>
                <div className="apk-progress-msg">{apkProgress.message}</div>
                <div className="apk-progress-track" aria-hidden="true">
                  <div className="apk-progress-fill" style={{ width: `${apkProgress.percent}%` }} />
                </div>
                <div className="apk-progress-pct">{apkProgress.percent}%</div>
                <div className="apk-progress-hint">大约 1～2 分钟，请勿关闭页面</div>
              </>
            )}
            {apkDone && !apkBusy && (
              <>
                <div className="apk-progress-msg">
                  已保存到浏览器「下载」文件夹：
                  <br />
                  <code>{apkDone.filename}</code>
                </div>
                <div className="apk-progress-hint">可直接传到手机安装（需允许未知来源）。</div>
                <div className="apk-done-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setApkDone(null)
                      setApkProgress(null)
                    }}
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
