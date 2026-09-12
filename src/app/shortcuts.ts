export type CommandId =
  | 'newProject'
  | 'openProject'
  | 'saveProject'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'deleteSelected'
  | 'closeOverlays'
  | 'openHelp'
  | 'searchPalette'
  | 'addScreen'
  | 'deleteScreen'
  | 'prevScreen'
  | 'nextScreen'
  | 'goDesigner'
  | 'goBlocks'
  | 'goMix'
  | 'goCode'
  | 'togglePreview'
  | 'toggleDemo'
  | 'toggleAi'
  | 'exportWeb'
  | 'exportApk'
  | 'goHome'
  | 'leftPalette'
  | 'leftTree'
  | 'leftAssets'
  | 'leftProjects'
  | 'toggleSettings'
  | 'toggleFooter'

export type ShortcutRow = {
  keys: string
  action: string
  command: CommandId
}

export const APP_SHORTCUTS: ShortcutRow[] = [
  { keys: 'Ctrl + N', action: '新建项目', command: 'newProject' },
  { keys: 'Ctrl + O', action: '打开项目（导入文件）', command: 'openProject' },
  { keys: 'Ctrl + S', action: '保存项目', command: 'saveProject' },
  { keys: 'Ctrl + Z', action: '撤销', command: 'undo' },
  { keys: 'Ctrl + Y', action: '重做', command: 'redo' },
  { keys: 'Ctrl + Shift + Z', action: '重做', command: 'redo' },
  { keys: 'Ctrl + X', action: '剪切所选组件', command: 'cut' },
  { keys: 'Ctrl + C', action: '复制所选组件', command: 'copy' },
  { keys: 'Ctrl + V', action: '粘贴组件', command: 'paste' },
  { keys: 'Delete', action: '删除所选组件', command: 'deleteSelected' },
  { keys: 'Esc', action: '关闭弹窗 / 取消选中', command: 'closeOverlays' },
  { keys: 'F1', action: '打开帮助（含快捷键）', command: 'openHelp' },
  { keys: 'Ctrl + H', action: '打开帮助', command: 'openHelp' },
  { keys: 'Ctrl + F', action: '搜索组件（左侧组件栏）', command: 'searchPalette' },
  { keys: 'Ctrl + ,', action: '打开设置', command: 'toggleSettings' },
  { keys: 'Shift + A', action: '添加屏幕', command: 'addScreen' },
  { keys: 'X', action: '删除当前屏幕（需确认）', command: 'deleteScreen' },
  { keys: 'PageUp', action: '上一个屏幕', command: 'prevScreen' },
  { keys: 'PageDown', action: '下一个屏幕', command: 'nextScreen' },
  { keys: '1', action: '设计器', command: 'goDesigner' },
  { keys: '2', action: '模块', command: 'goBlocks' },
  { keys: '3', action: '混合', command: 'goMix' },
  { keys: '4', action: '代码', command: 'goCode' },
  { keys: 'Shift + 1', action: '左侧 · 组件', command: 'leftPalette' },
  { keys: 'Shift + 2', action: '左侧 · 结构', command: 'leftTree' },
  { keys: 'Shift + 3', action: '左侧 · 资源', command: 'leftAssets' },
  { keys: 'Shift + 4', action: '左侧 · 项目', command: 'leftProjects' },
  { keys: 'Tab', action: '设计 ↔ 预览', command: 'togglePreview' },
  { keys: 'Shift + Space', action: '效果演示', command: 'toggleDemo' },
  { keys: 'N', action: '打开 / 关闭 AI', command: 'toggleAi' },
  { keys: 'Ctrl + Shift + S', action: '导出 ZIP', command: 'exportWeb' },
  { keys: 'Ctrl + Shift + E', action: '导出 APK', command: 'exportApk' },
]

export const HELP_OPEN_EVENT = 'ai2-open-help'
export const COMMAND_RUN_EVENT = 'ai2-run-command'

export function dispatchCommand(id: CommandId) {
  window.dispatchEvent(new CustomEvent(COMMAND_RUN_EVENT, { detail: { id } }))
}

export function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t) return false
  if (typeof t.closest === 'function') {
    if (t.closest('[hidden], [aria-hidden="true"]')) return false
    if (t.closest('.blocklyWidgetDiv, .blocklyDropdownDiv, .blocklyMenu, .blocklyHtmlInput')) return true
  }
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const field = t as HTMLInputElement
    if (field.readOnly || field.disabled) return false
    return true
  }
  return tag === 'SELECT' || t.isContentEditable
}

function closestEl(el: EventTarget | null, sel: string) {
  const t = el as HTMLElement | null
  return !!(t && typeof t.closest === 'function' && t.closest(sel))
}

/** 积木画布 / 工具箱：单键留给 Blockly，不要误删屏幕或弹出 AI */
export function isBlocklySurface(el: EventTarget | null) {
  return closestEl(el, '.blocklySvg, .injectionDiv, .blocklyToolboxDiv, .blocklyFlyout, .center .code-pane-body')
}

export function isHelpSurface(el: EventTarget | null) {
  return closestEl(el, '.usage-panel')
}

/** Tab 切设计/预览：不抢走顶栏、左右栏、弹层里的焦点移动 */
export function isDesignerStageTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null
  if (!t || t === document.body || t === document.documentElement) return true
  if (closestEl(t, '.mixly-nav, .left, .right, .usage-panel, .ai-dock, .mixly-menu-drop, .demo-backdrop, .auth-card, .cloud-modal')) {
    return false
  }
  return closestEl(t, '.designer-stage, .phone-screen, .designer-wrap, .center')
}

export function matchShortcut(e: KeyboardEvent): CommandId | null {
  const key = e.key.toLowerCase()
  const ctrl = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const alt = e.altKey
  const typing = isTypingTarget(e.target)

  if (e.key === 'Escape') return 'closeOverlays'
  if (e.key === 'F1') return 'openHelp'
  if (ctrl && key === 'h' && !shift && !alt) return 'openHelp'
  if (typing) {
    const tag = (e.target as HTMLElement | null)?.tagName
    if ((e.key === 'PageUp' || e.key === 'PageDown') && tag !== 'TEXTAREA') {
      return e.key === 'PageUp' ? 'prevScreen' : 'nextScreen'
    }
    return null
  }
  const blockly = isBlocklySurface(e.target)
  const help = isHelpSurface(e.target)
  if (ctrl && key === 'f' && !shift && !alt) return 'searchPalette'
  if (ctrl && key === 'n' && !shift) return 'newProject'
  if (ctrl && key === 'o' && !shift) return 'openProject'
  if (ctrl && key === 's' && shift) return 'exportWeb'
  if (ctrl && key === 's' && !shift) return 'saveProject'
  if (ctrl && key === 'e' && shift) return 'exportApk'
  if (ctrl && key === 'z' && !shift) return 'undo'
  if (ctrl && (key === 'y' || (key === 'z' && shift))) return 'redo'
  if (ctrl && key === 'x' && !shift) return 'cut'
  if (ctrl && key === 'c' && !shift) return 'copy'
  if (ctrl && key === 'v' && !shift) return 'paste'
  if (ctrl && e.key === ',') return 'toggleSettings'
  if (e.key === 'Delete' && !ctrl && !alt && !shift) return 'deleteSelected'
  if (ctrl || alt) return null

  if (e.key === 'PageUp') return 'prevScreen'
  if (e.key === 'PageDown') return 'nextScreen'
  if (help) return null

  if (shift && e.code === 'Space') return 'toggleDemo'
  if (!blockly) {
    if (shift && key === 'a') return 'addScreen'
    if (shift && (e.code === 'Digit1' || e.code === 'Numpad1')) return 'leftPalette'
    if (shift && (e.code === 'Digit2' || e.code === 'Numpad2')) return 'leftTree'
    if (shift && (e.code === 'Digit3' || e.code === 'Numpad3')) return 'leftAssets'
    if (shift && (e.code === 'Digit4' || e.code === 'Numpad4')) return 'leftProjects'
    if (key === 'x' && !shift) return 'deleteScreen'
    if (key === 'n' && !shift) return 'toggleAi'
  }

  if (!shift && (e.code === 'Digit1' || e.code === 'Numpad1')) return 'goDesigner'
  if (!shift && (e.code === 'Digit2' || e.code === 'Numpad2')) return 'goBlocks'
  if (!shift && (e.code === 'Digit3' || e.code === 'Numpad3')) return 'goMix'
  if (!shift && (e.code === 'Digit4' || e.code === 'Numpad4')) return 'goCode'
  if (e.key === 'Tab' && !shift) {
    if (blockly) return null
    if (
      closestEl(
        e.target,
        '.mixly-nav, .left, .right, .usage-panel, .usage-fab, .ai-dock, .mix-footer, .demo-backdrop, .pane-toolbar, .stage-tabs',
      )
    ) {
      return null
    }
    return 'togglePreview'
  }
  return null
}

const DESIGNER_ONLY: CommandId[] = ['cut', 'copy', 'paste', 'deleteSelected', 'togglePreview']

const NAV_COMMANDS: CommandId[] = [
  'goDesigner',
  'goBlocks',
  'goMix',
  'goCode',
  'togglePreview',
  'leftPalette',
  'leftTree',
  'leftAssets',
  'leftProjects',
  'searchPalette',
  'addScreen',
  'deleteScreen',
  'prevScreen',
  'nextScreen',
  'goHome',
]

export function isDesignerOnlyCommand(id: CommandId) {
  return DESIGNER_ONLY.includes(id)
}

export function isNavCommand(id: CommandId) {
  return NAV_COMMANDS.includes(id)
}
