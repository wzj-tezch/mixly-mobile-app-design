import { useCallback, useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly'
import 'blockly/blocks'
import {
  buildToolbox,
  workspaceToXml,
  xmlToWorkspace,
  workspaceToCode,
  setBlocklyNameContext,
} from './ai2Blocks'
import { ensureAi2BlocksRegistered } from './codegen'
import { applyBlocklyZhHans } from './locale'
import { mixlyBlocklyTheme } from './blocklyTheme'
import { useProjectStore, collectNames } from '@/project/store'
import { validateAdvancedScript } from '@/runtime/scriptSandbox'

export function BlocksEditor() {
  const hostRef = useRef<HTMLDivElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const project = useProjectStore((s) => s.project)
  const screen = project.screens.find((x) => x.id === project.activeScreenId) ?? project.screens[0]
  const setBlocksXml = useProjectStore((s) => s.setBlocksXml)
  const setScreenScript = useProjectStore((s) => s.setScreenScript)
  const advancedMode = Boolean(project.advancedMode)
  const blocksSyncKey = useProjectStore((s) => s.blocksSyncKey)
  const blocksViewMode = useProjectStore((s) => s.blocksViewMode)
  const setWorkspaceHistory = useProjectStore((s) => s.setWorkspaceHistory)
  const activeScreenId = project.activeScreenId
  const saveTimer = useRef<number | null>(null)
  const applyingSync = useRef(false)
  const refreshRef = useRef<(ws: Blockly.WorkspaceSvg) => void>(() => {})
  const [generatedCode, setGeneratedCode] = useState('')
  const [codePanePct, setCodePanePct] = useState(42)
  const [dragging, setDragging] = useState(false)
  const [scriptDraft, setScriptDraft] = useState(screen.scriptCode || '')
  const scriptTimer = useRef<number | null>(null)
  const scriptDraftRef = useRef(scriptDraft)
  scriptDraftRef.current = scriptDraft

  useEffect(() => {
    setScriptDraft(screen.scriptCode || '')
  }, [activeScreenId, screen.scriptCode])

  useEffect(() => {
    return () => {
      if (scriptTimer.current) window.clearTimeout(scriptTimer.current)
      const v = scriptDraftRef.current
      const st = useProjectStore.getState()
      const sc = st.project.screens.find((s) => s.id === st.project.activeScreenId)
      if (st.project.advancedMode && sc && (sc.scriptCode || '') !== v) st.setScreenScript(v)
    }
  }, [])

  const scriptCheck = advancedMode ? validateAdvancedScript(scriptDraft) : { ok: true as const }

  const refreshCodeAndMeta = useCallback((ws: Blockly.WorkspaceSvg) => {
    setGeneratedCode(workspaceToCode(ws))
    setWorkspaceHistory({
      canUndo: ws.getUndoStack().length > 0,
      canRedo: ws.getRedoStack().length > 0,
      undo: () => {
        ws.undo(false)
        refreshRef.current(ws)
      },
      redo: () => {
        ws.undo(true)
        refreshRef.current(ws)
      },
    })
  }, [setWorkspaceHistory])
  refreshRef.current = refreshCodeAndMeta

  useEffect(() => {
    applyBlocklyZhHans()
    ensureAi2BlocksRegistered()
    if (!hostRef.current) return

    const names = collectNames(screen).filter((n) => n !== 'ScreenRoot')
    setBlocklyNameContext(
      names,
      project.screens.map((s) => s.name),
    )

    const workspace = Blockly.inject(hostRef.current, {
      toolbox: buildToolbox(),
      trashcan: true,
      media: './media/blockly/',
      sounds: false,
      zoom: { controls: true, wheel: true },
      grid: { spacing: 20, length: 3, colour: '#c9d8d4', snap: true },
      renderer: 'geras',
      theme: mixlyBlocklyTheme,
    })
    workspace.getInjectionDiv().classList.add('classic-theme')
    workspaceRef.current = workspace
    xmlToWorkspace(workspace, screen.blocksXml)
    refreshCodeAndMeta(workspace)

    const onChange = (e: Blockly.Events.Abstract) => {
      if (applyingSync.current) return
      if (e.isUiEvent) {
        setWorkspaceHistory({
          canUndo: workspace.getUndoStack().length > 0,
          canRedo: workspace.getRedoStack().length > 0,
          undo: () => {
            workspace.undo(false)
            refreshRef.current(workspace)
          },
          redo: () => {
            workspace.undo(true)
            refreshRef.current(workspace)
          },
        })
        return
      }
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        const xml = workspaceToXml(workspace)
        setBlocksXml(xml)
        refreshCodeAndMeta(workspace)
      }, 400)
    }
    workspace.addChangeListener(onChange)

    const resize = () => Blockly.svgResize(workspace)
    window.addEventListener('resize', resize)
    setTimeout(resize, 50)

    return () => {
      window.removeEventListener('resize', resize)
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      workspace.dispose()
      workspaceRef.current = null
      setWorkspaceHistory({ canUndo: false, canRedo: false, undo: null, redo: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreenId])

  useEffect(() => {
    setBlocklyNameContext(
      collectNames(screen).filter((n) => n !== 'ScreenRoot'),
      project.screens.map((s) => s.name),
    )
  }, [screen, project.screens])

  useEffect(() => {
    const ws = workspaceRef.current
    if (!ws || blocksSyncKey === 0) return
    applyingSync.current = true
    setBlocklyNameContext(
      collectNames(screen).filter((n) => n !== 'ScreenRoot'),
      project.screens.map((s) => s.name),
    )
    xmlToWorkspace(ws, screen.blocksXml)
    refreshCodeAndMeta(ws)
    queueMicrotask(() => {
      applyingSync.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksSyncKey])

  useEffect(() => {
    const ws = workspaceRef.current
    if (!ws) return
    const t = window.setTimeout(() => Blockly.svgResize(ws), 40)
    return () => window.clearTimeout(t)
  }, [blocksViewMode, codePanePct])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      const el = splitRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const fromRight = rect.right - e.clientX
      const pct = Math.min(70, Math.max(18, (fromRight / rect.width) * 100))
      setCodePanePct(pct)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  return (
    <div className="blocks-editor">
      {advancedMode && (
        <div className="adv-script-banner">
          高级模式已开：预览、导出、发布只跑本页脚本，不跑积木。脚本只能调用 rt。积木仍保留。
        </div>
      )}
      <div
        ref={splitRef}
        className={`blocks-split mode-${blocksViewMode}`}
        style={
          blocksViewMode === 'mix'
            ? ({ ['--code-pane-w' as string]: `${codePanePct}%` } as React.CSSProperties)
            : undefined
        }
      >
        <div className="blocks-pane blockly-side">
          <div ref={hostRef} className="blockly-host" />
        </div>
        <div
          className={`blocks-splitter${dragging ? ' dragging' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          title="拖拽调整宽度"
        />
        <div className="blocks-pane code-side">
          <div className={`code-pane-header${advancedMode ? ' advanced' : ''}`}>
            {advancedMode ? '高级脚本（可编辑 · 预览不跑积木）' : '生成代码（只读）'}
          </div>
          {advancedMode && !scriptCheck.ok && <div className="code-pane-warn">{scriptCheck.reason}</div>}
          <textarea
            className="code-pane-body"
            readOnly={!advancedMode}
            value={advancedMode ? scriptDraft : generatedCode || '// 暂无积木逻辑'}
            spellCheck={false}
            placeholder={
              advancedMode
                ? "rt.on('Button1', 'Click', function () {\n  rt.alert('你好');\n});"
                : undefined
            }
            onChange={
              advancedMode
                ? (e) => {
                    const v = e.target.value
                    setScriptDraft(v)
                    if (scriptTimer.current) window.clearTimeout(scriptTimer.current)
                    scriptTimer.current = window.setTimeout(() => setScreenScript(v), 200)
                  }
                : undefined
            }
            onBlur={
              advancedMode
                ? () => {
                    if (scriptTimer.current) window.clearTimeout(scriptTimer.current)
                    setScreenScript(scriptDraftRef.current)
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}
