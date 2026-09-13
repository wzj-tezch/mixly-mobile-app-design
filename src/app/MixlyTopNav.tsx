import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/project/store'
import { exportProjectZip, exportApk, importProjectJsonOrZip } from '@/project/export'
import type { BlocksViewMode } from '@/project/types'
import { MixlyIcon } from '@/app/MixlyIcons'
import {
  matchShortcut,
  isDesignerOnlyCommand,
  HELP_OPEN_EVENT,
  COMMAND_RUN_EVENT,
  type CommandId,
} from '@/app/shortcuts'
import { useAuthStore } from '@/auth/session'
import {
  preferredShareUrl,
  publishCloudProject,
  unpublishCloudProject,
  type ShareLinks,
} from '@/auth/cloudClient'
import { AuthModal } from '@/app/AuthModal'
import { PublishDialog } from '@/app/PublishDialog'
import { ENABLE_APK, ENABLE_CLOUD, ENABLE_SHARE, SHOW_MIXLY_HOME } from '@/app/features'
import { readEmbedFlags } from '@/app/embedMode'
import { buildStandaloneDocument } from '@/runtime/previewDoc'
import { buildProjectScreenCodes } from '@/blocks/codegen'
import { confirmSetAdvancedMode } from '@/runtime/scriptSandbox'

type MenuId = 'file' | 'settings' | null

type ApkProgress = {
  message: string
  percent: number
  stage?: string
}

export function MixlyTopNav({
  apkBusy,
  onApkStart,
  onApkProgress,
  onApkDone,
  onApkError,
  onOpenDemo,
  onToggleDemo,
  onCloseOverlays,
  aiOpen,
  onToggleAi,
}: {
  apkBusy: boolean
  onApkStart: () => void
  onApkProgress: (p: ApkProgress) => void
  onApkDone: (filename: string) => void
  onApkError: (msg: string) => void
  onOpenDemo: () => void
  onToggleDemo: () => void
  onCloseOverlays: () => void
  aiOpen: boolean
  onToggleAi: () => void
}) {
  const project = useProjectStore((s) => s.project)
  const editorTab = useProjectStore((s) => s.editorTab)
  const blocksViewMode = useProjectStore((s) => s.blocksViewMode)
  const setEditorTab = useProjectStore((s) => s.setEditorTab)
  const setBlocksViewMode = useProjectStore((s) => s.setBlocksViewMode)
  const persist = useProjectStore((s) => s.persist)
  const resetLesson = useProjectStore((s) => s.resetLesson)
  const saveStudentCopy = useProjectStore((s) => s.saveStudentCopy)
  const embed = readEmbedFlags().embed
  const saveToCloud = useProjectStore((s) => s.saveToCloud)
  const setShareId = useProjectStore((s) => s.setShareId)
  const refreshCloudList = useProjectStore((s) => s.refreshCloudList)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const setAdvancedMode = useProjectStore((s) => s.setAdvancedMode)
  const newProject = useProjectStore((s) => s.newProject)
  const replaceProject = useProjectStore((s) => s.replaceProject)
  const addScreen = useProjectStore((s) => s.addScreen)
  const deleteScreen = useProjectStore((s) => s.deleteScreen)
  const switchScreen = useProjectStore((s) => s.switchScreen)
  const cycleScreen = useProjectStore((s) => s.cycleScreen)
  const toggleDesignerStage = useProjectStore((s) => s.toggleDesignerStage)
  const setLeftPanel = useProjectStore((s) => s.setLeftPanel)
  const copySelected = useProjectStore((s) => s.copySelected)
  const cutSelected = useProjectStore((s) => s.cutSelected)
  const pasteClipboard = useProjectStore((s) => s.pasteClipboard)
  const deleteSelected = useProjectStore((s) => s.deleteSelected)
  const select = useProjectStore((s) => s.select)
  const canDesignerUndo = useProjectStore((s) => s.canDesignerUndo)
  const canDesignerRedo = useProjectStore((s) => s.canDesignerRedo)
  const canWorkspaceUndo = useProjectStore((s) => s.canWorkspaceUndo)
  const canWorkspaceRedo = useProjectStore((s) => s.canWorkspaceRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const canUndo = editorTab === 'blocks' ? canWorkspaceUndo : canDesignerUndo
  const canRedo = editorTab === 'blocks' ? canWorkspaceRedo : canDesignerRedo
  const fileRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLElement | null>(null)
  const [openMenu, setOpenMenu] = useState<MenuId>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishShareId, setPublishShareId] = useState<string | null>(null)
  const [shareLinks, setShareLinks] = useState<ShareLinks | null>(null)
  const user = useAuthStore((s) => s.user)
  const refreshAuth = useAuthStore((s) => s.refresh)
  const logout = useAuthStore((s) => s.logout)
  const homeHref = new URL('../index.html', window.location.href).href
  const mixlyMark = `${import.meta.env.BASE_URL}mixly.ico`
  const mixlyBrand = (
    <>
      <img className="mixly-home-mark" src={mixlyMark} alt="" />
      Mixly
    </>
  )

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!ENABLE_CLOUD) return
    void refreshAuth().then(() => refreshCloudList())
  }, [refreshAuth, refreshCloudList])

  const confirmDeleteScreen = () => {
    if (project.screens.length <= 1) return
    const name = project.screens.find((s) => s.id === project.activeScreenId)?.name ?? ''
    if (confirm(`删除屏幕「${name}」？可用撤销恢复。`)) {
      deleteScreen(project.activeScreenId)
    }
  }

  const goDesigner = () => setEditorTab('designer')
  const goBlocks = (mode: BlocksViewMode) => {
    setBlocksViewMode(mode)
    setEditorTab('blocks')
  }

  const revealLeft = (panel: 'palette' | 'components' | 'assets' | 'projects') => {
    setLeftPanel(panel)
  }

  const focusPaletteSearch = () => {
    setLeftPanel('palette')
    window.setTimeout(() => {
      const el = document.querySelector('.palette-search') as HTMLInputElement | null
      el?.focus()
      el?.select()
    }, 40)
  }

  const goHome = () => {
    window.location.href = homeHref
  }

  const runCloudSave = () => {
    void (async () => {
      try {
        await saveToCloud()
      } catch (e) {
        alert(String(e).replace(/^Error:\s*/, ''))
      }
    })()
  }

  const runPublish = () => {
    void (async () => {
      setPublishOpen(true)
      setPublishBusy(true)
      setPublishError('')
      setPublishShareId(project.shareId || null)
      try {
        await saveToCloud()
        const latest = useProjectStore.getState().project
        const screenCodes = buildProjectScreenCodes(latest)
        const html = buildStandaloneDocument(latest, screenCodes)
        const links = await publishCloudProject(latest.id, html, latest.name)
        setShareId(links.shareId)
        setPublishShareId(links.shareId)
        setShareLinks(links)
        await refreshCloudList()
      } catch (e) {
        setPublishError(String(e).replace(/^Error:\s*/, ''))
      } finally {
        setPublishBusy(false)
      }
    })()
  }

  const copyShareUrl = () => {
    const id = publishShareId || project.shareId
    if (!id) return
    const url = preferredShareUrl(id, shareLinks)
    void navigator.clipboard.writeText(url).catch(() => {
      window.prompt('复制下面的链接', url)
    })
  }

  const runUnpublish = () => {
    void (async () => {
      try {
        await unpublishCloudProject(project.id)
        setShareId(undefined)
        setPublishShareId(null)
        setShareLinks(null)
        await refreshCloudList()
      } catch (e) {
        setPublishError(String(e).replace(/^Error:\s*/, ''))
      }
    })()
  }

  const runExportApk = () => {
    void (async () => {
      onApkStart()
      onApkProgress({ message: '准备中…', percent: 1, stage: 'check' })
      try {
        const result = await exportApk(project, onApkProgress)
        onApkProgress({ message: `已下载：${result.filename}`, percent: 100, stage: 'done' })
        onApkDone(result.filename)
      } catch (err) {
        onApkError(String(err).replace(/^Error:\s*/, ''))
      }
    })()
  }

  const runCommand = (id: CommandId) => {
    const state = useProjectStore.getState()
    switch (id) {
      case 'newProject':
        void newProject()
        return
      case 'openProject':
        fileRef.current?.click()
        return
      case 'saveProject':
        void persist()
        return
      case 'undo':
        undo()
        return
      case 'redo':
        redo()
        return
      case 'cut':
        cutSelected()
        return
      case 'copy':
        copySelected()
        return
      case 'paste':
        pasteClipboard()
        return
      case 'deleteSelected':
        if (state.selectedId) deleteSelected()
        return
      case 'closeOverlays':
        setOpenMenu(null)
        select(null)
        onCloseOverlays()
        return
      case 'openHelp':
        window.dispatchEvent(new CustomEvent(HELP_OPEN_EVENT, { detail: { open: true, tab: 'keys' } }))
        return
      case 'searchPalette':
        focusPaletteSearch()
        return
      case 'addScreen':
        addScreen()
        return
      case 'deleteScreen':
        confirmDeleteScreen()
        return
      case 'prevScreen':
        cycleScreen(-1)
        return
      case 'nextScreen':
        cycleScreen(1)
        return
      case 'goDesigner':
        goDesigner()
        return
      case 'goBlocks':
        goBlocks('blocks')
        return
      case 'goMix':
        goBlocks('mix')
        return
      case 'goCode':
        goBlocks('code')
        return
      case 'togglePreview':
        toggleDesignerStage()
        return
      case 'toggleDemo':
        onToggleDemo()
        return
      case 'toggleAi':
        onToggleAi()
        return
      case 'exportWeb':
        void exportProjectZip(project)
        return
      case 'exportApk':
        if (ENABLE_APK && !apkBusy) runExportApk()
        return
      case 'goHome':
        if (SHOW_MIXLY_HOME) goHome()
        return
      case 'leftPalette':
        revealLeft('palette')
        return
      case 'leftTree':
        revealLeft('components')
        return
      case 'leftAssets':
        revealLeft('assets')
        return
      case 'leftProjects':
        revealLeft('projects')
        return
      case 'toggleSettings':
        setOpenMenu((m) => {
          const next = m === 'settings' ? null : 'settings'
          if (next === 'settings') {
            window.setTimeout(() => {
              const el = barRef.current?.querySelector('.settings-drop input') as HTMLInputElement | null
              el?.focus()
              el?.select()
            }, 40)
          }
          return next
        })
        return
      case 'toggleFooter':
        document.body.classList.toggle('mixly-hide-footer')
        return
    }
  }

  const cmdRef = useRef(runCommand)
  cmdRef.current = runCommand

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const id = matchShortcut(e)
      if (!id) return
      if (isDesignerOnlyCommand(id) && useProjectStore.getState().editorTab !== 'designer') return
      e.preventDefault()
      e.stopPropagation()
      cmdRef.current(id)
    }
    const onCmd = (e: Event) => {
      const id = (e as CustomEvent<{ id?: CommandId }>).detail?.id
      if (!id) return
      if (isDesignerOnlyCommand(id) && useProjectStore.getState().editorTab !== 'designer') return
      cmdRef.current(id)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener(COMMAND_RUN_EVENT, onCmd)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener(COMMAND_RUN_EVENT, onCmd)
    }
  }, [])

  const centerModes: {
    id: 'designer' | BlocksViewMode
    label: string
    icon: 'window' | 'puzzle' | 'cube' | 'code'
    onClick: () => void
    active: boolean
    shortcut: string
  }[] = [
    { id: 'designer', label: '设计器', icon: 'window', onClick: goDesigner, active: editorTab === 'designer', shortcut: '1' },
    { id: 'blocks', label: '模块', icon: 'puzzle', onClick: () => goBlocks('blocks'), active: editorTab === 'blocks' && blocksViewMode === 'blocks', shortcut: '2' },
    { id: 'mix', label: '混合', icon: 'cube', onClick: () => goBlocks('mix'), active: editorTab === 'blocks' && blocksViewMode === 'mix', shortcut: '3' },
    { id: 'code', label: '代码', icon: 'code', onClick: () => goBlocks('code'), active: editorTab === 'blocks' && blocksViewMode === 'code', shortcut: '4' },
  ]

  return (
    <header className="mixly-nav" ref={barRef}>
      <div className="mixly-nav-left">
        {SHOW_MIXLY_HOME && !embed ? (
          <a className="mixly-nav-item mixly-home" href={homeHref} title="返回 Mixly 主页">
            {mixlyBrand}
          </a>
        ) : (
          <span className="mixly-brand" title="Mixly 3.0 For 手机app设计">
            {mixlyBrand}
          </span>
        )}
        <button type="button" className="mixly-nav-item" disabled={!canUndo} onClick={() => undo()} title="撤销 (Ctrl+Z)">
          <MixlyIcon name="ccw" />
          <span className="mixly-nav-text">撤销</span>
        </button>
        <button type="button" className="mixly-nav-item" disabled={!canRedo} onClick={() => redo()} title="重做 (Ctrl+Y)">
          <MixlyIcon name="cw" />
          <span className="mixly-nav-text">重做</span>
        </button>
        <button type="button" className="mixly-nav-item" onClick={() => runCommand('addScreen')} title="添加屏幕 (Shift+A)">
          <MixlyIcon name="plus" />
          <span className="mixly-nav-text">添加屏幕</span>
        </button>
        <button
          type="button"
          className="mixly-nav-item"
          disabled={project.screens.length <= 1}
          onClick={confirmDeleteScreen}
          title="删除当前屏幕 (X)"
        >
          <MixlyIcon name="minus" />
          <span className="mixly-nav-text">删除屏幕</span>
        </button>
        <button
          type="button"
          className="mixly-nav-item"
          onClick={() => void exportProjectZip(project)}
          title="导出 ZIP (Ctrl+Shift+S)：解压后双击 index.html，本地就是手机 App"
        >
          <MixlyIcon name="doc" />
          <span className="mixly-nav-text">导出ZIP</span>
        </button>
        {ENABLE_APK && !embed && (
          <button type="button" className="mixly-nav-item" disabled={apkBusy} onClick={runExportApk} title="导出 APK (Ctrl+Shift+E)">
            <MixlyIcon name="upload" />
            <span className="mixly-nav-text">{apkBusy ? '打包中…' : '导出APK'}</span>
          </button>
        )}
      </div>

      <div className="mixly-nav-center">
        <div className="mixly-mode-group" role="tablist" aria-label="编辑模式">
          {centerModes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.active}
              className={m.active ? 'active' : ''}
              onClick={m.onClick}
              title={`${m.label} (${m.shortcut})`}
            >
              <MixlyIcon name={m.icon} />
              <span className="mixly-nav-text">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mixly-nav-right">
        {!embed && (
        <button type="button" className="mixly-nav-item" onClick={onOpenDemo} title="效果演示 (Shift+Space)">
          <MixlyIcon name="play" />
          <span className="mixly-nav-text">效果演示</span>
        </button>
        )}
        {(embed || project.starterSnapshot || project.starterLabel) && (
          <>
            <button
              type="button"
              className="mixly-nav-item"
              disabled={!project.starterSnapshot && !project.sourceTemplate && !project.starterLabel}
              title="重置回载入时的初始工程"
              onClick={() => void resetLesson()}
            >
              <span className="mixly-nav-text">重置</span>
            </button>
            <button
              type="button"
              className="mixly-nav-item"
              title="另存为学生副本，不覆盖课模板"
              onClick={() => void saveStudentCopy()}
            >
              <span className="mixly-nav-text">另存副本</span>
            </button>
          </>
        )}
        <select
          className="mixly-nav-select"
          value={project.activeScreenId}
          onChange={(e) => switchScreen(e.target.value)}
          title="当前屏幕 (PageUp / PageDown)"
        >
          {project.screens.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="mixly-menu">
          <button
            type="button"
            className={`mixly-nav-item${openMenu === 'file' ? ' open' : ''}`}
            title="文件"
            onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
          >
            <span className="mixly-nav-text">文件</span>
            <MixlyIcon name="down" className={openMenu === 'file' ? 'menu-shown' : ''} />
          </button>
          {openMenu === 'file' && (
            <div className="mixly-menu-drop">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  runCommand('newProject')
                }}
              >
                <MixlyIcon name="doc-new" />
                <span>新建</span>
                <span className="hot-key">Ctrl+N</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  runCommand('openProject')
                }}
              >
                <MixlyIcon name="folder" />
                <span>打开</span>
                <span className="hot-key">Ctrl+O</span>
              </button>
              <div className="mixly-menu-sep" />
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  runCommand('saveProject')
                }}
              >
                <MixlyIcon name="floppy" />
                <span>保存</span>
                <span className="hot-key">Ctrl+S</span>
              </button>
              <div className="mixly-menu-sep" />
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  runCommand('toggleDemo')
                }}
              >
                <MixlyIcon name="play" />
                <span>效果演示</span>
                <span className="hot-key">Shift+Space</span>
              </button>
              <div className="mixly-menu-sep" />
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  runCommand('exportWeb')
                }}
              >
                <MixlyIcon name="doc" />
                <span>导出 ZIP</span>
                <span className="hot-key">Ctrl+Shift+S</span>
              </button>
              {ENABLE_APK && (
                <button
                  type="button"
                  disabled={apkBusy}
                  onClick={() => {
                    setOpenMenu(null)
                    runCommand('exportApk')
                  }}
                >
                  <MixlyIcon name="upload" />
                  <span>导出 APK</span>
                  <span className="hot-key">Ctrl+Shift+E</span>
                </button>
              )}
              {ENABLE_CLOUD && user && (
                <>
                  <div className="mixly-menu-sep" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null)
                      runCloudSave()
                    }}
                  >
                    <MixlyIcon name="floppy" />
                    <span>云保存</span>
                  </button>
                  {ENABLE_SHARE && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null)
                        runPublish()
                      }}
                    >
                      <MixlyIcon name="doc" />
                      <span>发布</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mixly-menu">
          <button
            type="button"
            className={`mixly-nav-item${openMenu === 'settings' ? ' open' : ''}`}
            title="设置 (Ctrl+,)"
            onClick={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')}
          >
            <span className="mixly-nav-text">设置</span>
            <MixlyIcon name="down" className={openMenu === 'settings' ? 'menu-shown' : ''} />
          </button>
          {openMenu === 'settings' && (
            <div className="mixly-menu-drop settings-drop">
              <label>
                项目名称
                <input value={project.name} onChange={(e) => setProjectName(e.target.value)} />
              </label>
              <label className="adv-mode-row">
                <input
                  type="checkbox"
                  checked={Boolean(project.advancedMode)}
                  onChange={() => {
                    const next = !project.advancedMode
                    if (!confirmSetAdvancedMode(next)) return
                    setAdvancedMode(next)
                    if (next) {
                      setBlocksViewMode('code')
                      setEditorTab('blocks')
                    }
                    setOpenMenu(null)
                  }}
                />
                高级模式（脚本运行，不跑积木）
              </label>
              <p className="adv-mode-hint">默认关闭。开启后预览/导出只跑代码页脚本，且脚本只能用 rt。</p>
            </div>
          )}
        </div>

        {!embed && (
        <button
          type="button"
          className={`mixly-nav-item${aiOpen ? ' open' : ''}`}
          title="AI 助手 (N)"
          onClick={() => {
            setOpenMenu(null)
            onToggleAi()
          }}
        >
          <MixlyIcon name="comment" />
          <span className="mixly-nav-text">AI</span>
        </button>
        )}

        {!embed && ENABLE_CLOUD &&
          (user ? (
            <>
              <span className="mixly-nav-user" title={user.username}>
                {user.username}
              </span>
              <button
                type="button"
                className="mixly-nav-item"
                title="退出登录"
                onClick={() => {
                  void logout().then(() => refreshCloudList())
                }}
              >
                <span className="mixly-nav-text">退出</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mixly-nav-item"
              title="登录后可云保存"
              onClick={() => setAuthOpen(true)}
            >
              <span className="mixly-nav-text">登录</span>
            </button>
          ))}

        <button
          type="button"
          className="mixly-nav-item mixly-nav-icon-btn"
          title="显示/隐藏状态栏"
          onClick={() => document.body.classList.toggle('mixly-hide-footer')}
        >
          <MixlyIcon name="panel" />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.zip"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try {
            const p = await importProjectJsonOrZip(f)
            replaceProject(p)
          } catch (err) {
            alert(String(err))
          }
          e.target.value = ''
        }}
      />
      {ENABLE_CLOUD && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
      {ENABLE_SHARE && (
        <PublishDialog
          open={publishOpen}
          shareId={publishShareId}
          links={shareLinks}
          error={publishError}
          busy={publishBusy}
          onClose={() => setPublishOpen(false)}
          onCopy={copyShareUrl}
          onUnpublish={runUnpublish}
        />
      )}
    </header>
  )
}
