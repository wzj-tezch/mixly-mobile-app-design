import { COMPONENT_REGISTRY } from '@/components/registry'
import { METHOD_BLOCK_COMPONENT, isKnownEvent, resolveMethodBlock } from './knowledgeBase'
import type { AiGenAction, AiGenLogic, AiGenNode, AiGenScreen, AiGenSpec } from './prompts'

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'boolean') return v ? 'true' : 'false'
  }
  return ''
}

function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (v && typeof v === 'object') return [v]
  return []
}

const TYPE_ALIAS: Record<string, string> = (() => {
  const map: Record<string, string> = {
    text: 'Label',
    textview: 'Label',
    input: 'TextBox',
    column: 'VerticalArrangement',
    row: 'HorizontalArrangement',
    vertical: 'VerticalArrangement',
    horizontal: 'HorizontalArrangement',
    img: 'Image',
    toggle: 'Switch',
  }
  for (const [type, meta] of Object.entries(COMPONENT_REGISTRY)) {
    map[type.toLowerCase()] = type
    map[type.toLowerCase().replace(/[\s_\-]+/g, '')] = type
    map[meta.label] = type
  }
  return map
})()

export function resolveComponentType(raw: unknown): string {
  const t = pickStr(raw)
  if (!t) return 'Label'
  if (COMPONENT_REGISTRY[t]) return t
  if (TYPE_ALIAS[t]) return TYPE_ALIAS[t]
  const compact = t.toLowerCase().replace(/[\s_\-]+/g, '')
  if (TYPE_ALIAS[compact]) return TYPE_ALIAS[compact]
  const hit = Object.keys(COMPONENT_REGISTRY).find(
    (k) => k.toLowerCase() === t.toLowerCase() || k.toLowerCase() === compact,
  )
  return hit || 'Label'
}

function normalizeEvent(raw: unknown): string {
  const s = pickStr(raw) || 'Click'
  const map: Record<string, string> = {
    click: 'Click',
    longclick: 'LongClick',
    changed: 'Changed',
    timer: 'Timer',
    aftertimeset: 'AfterTimeSet',
    afterdateset: 'AfterDateSet',
    gotresult: 'GotResult',
    finished: 'Finished',
    rolled: 'Rolled',
    touched: 'Touched',
    positionchanged: 'PositionChanged',
    alarmfired: 'AlarmFired',
    reminderfired: 'ReminderFired',
    afterscan: 'AfterScan',
    afterchecking: 'AfterChecking',
    calculated: 'Calculated',
    afterfetch: 'AfterFetch',
    headingchanged: 'HeadingChanged',
    numberchanged: 'NumberChanged',
    callstarted: 'CallStarted',
  }
  const mapped = map[s.toLowerCase().replace(/[\s_]/g, '')] || s
  return isKnownEvent(mapped) ? mapped : mapped
}

function normalizeOp(raw: unknown): AiGenAction['op'] | '' {
  const original = pickStr(raw)
  const s = original.toLowerCase().replace(/[\s_\-]/g, '')
  if (['set', 'setproperty', 'setprop', 'update', 'assign', 'settext'].includes(s)) return 'set'
  if (['alert', 'notify', 'showalert', 'toast', 'notifieralert', 'showmessage'].includes(s)) return 'alert'
  if (['celebrate', 'confetti'].includes(s)) return 'celebrate'
  if (['openscreen', 'openscr', 'navigate', 'goto', 'open'].includes(s)) return 'openScreen'
  if (['closescreen', 'close'].includes(s)) return 'closeScreen'
  if (['method', 'call', 'invoke'].includes(s)) return 'method'
  if (resolveMethodBlock(original)) return 'method'
  return ''
}

function normalizeAction(raw: unknown): AiGenAction | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const opRaw = o.op ?? o.action ?? o.type
  let op = normalizeOp(opRaw)
  const component = pickStr(o.component, o.target, o.name, o.componentName)
  const prop = pickStr(o.prop, o.property, o.field, o.attr) || 'Text'
  const screen = pickStr(o.screen, o.screenName, o.to, o.targetScreen)
  const message = pickStr(o.message, o.msg, o.text, o.alert)
  const tag = pickStr(o.tag, o.key)
  const url = pickStr(o.url, o.href)
  let block = pickStr(o.block, o.method, o.func)
  if (!block && resolveMethodBlock(pickStr(opRaw))) block = pickStr(opRaw)
  let value: string | number | boolean = ''
  if (typeof o.value === 'boolean' || (typeof o.value === 'number' && Number.isFinite(o.value))) {
    value = o.value
  } else {
    value = pickStr(o.value, o.text, message)
  }

  if (!op) {
    if (component && (o.value !== undefined || o.prop || o.property)) op = 'set'
    else if (message) op = 'alert'
    else if (screen) op = 'openScreen'
    else if (block) op = 'method'
    else return null
  }

  if (op === 'set') {
    if (!component) return null
    return { op, component, prop, value }
  }
  if (op === 'alert') {
    return { op, component: component || 'Notifier1', message: message || pickStr(o.value) || '提示' }
  }
  if (op === 'celebrate') {
    return { op, component: component || 'Celebration1' }
  }
  if (op === 'openScreen') {
    const dest = screen || component
    if (!dest) return null
    return { op, screen: dest }
  }
  if (op === 'closeScreen') {
    return { op }
  }
  if (op === 'method') {
    const resolved = resolveMethodBlock(block, component)
    if (!component || !resolved) return null
    return {
      op,
      component,
      block: resolved,
      message: message || undefined,
      tag: tag || undefined,
      url: url || undefined,
      value: value === '' ? undefined : value,
    }
  }
  return null
}

function normalizeLogic(raw: unknown): AiGenLogic | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const actions = asArray(o.actions ?? o.action ?? o.do)
    .map(normalizeAction)
    .filter((a): a is AiGenAction => Boolean(a))
  const fromAction = actions
    .map((a) => ('component' in a ? a.component : ''))
    .find((n) => n)
  const component = pickStr(o.component, o.target, o.name, o.componentName) || fromAction || ''
  if (!component) return null
  return {
    component,
    event: normalizeEvent(o.event ?? o.evt ?? o.when),
    actions,
  }
}

function normalizeNode(raw: unknown, seq: { n: number }): AiGenNode | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const type = resolveComponentType(o.type ?? o.componentType ?? o.widget ?? o.kind)
  const name = pickStr(o.name, o.id, o.component) || `${type}${++seq.n}`
  const props: Record<string, unknown> =
    o.props && typeof o.props === 'object' && !Array.isArray(o.props)
      ? { ...(o.props as Record<string, unknown>) }
      : {}
  for (const [k, v] of Object.entries(o)) {
    if (['type', 'name', 'id', 'children', 'props', 'componentType', 'widget', 'kind', 'tree', 'components'].includes(k)) {
      continue
    }
    if (!(k in props)) props[k] = v
  }
  const children = asArray(o.children ?? o.tree ?? o.components)
    .map((c) => normalizeNode(c, seq))
    .filter((n): n is AiGenNode => Boolean(n))
  return { type, name, props, children }
}

function collectNames(n: AiGenNode, into: Set<string>) {
  into.add(n.name)
  for (const c of n.children ?? []) collectNames(c, into)
}

function ensureExtras(screen: AiGenScreen): AiGenScreen {
  const names = new Set<string>()
  for (const n of screen.tree) collectNames(n, names)
  const tree = [...screen.tree]
  const nonVisible = [...(screen.nonVisible ?? [])]
  for (const nv of nonVisible) names.add(nv.name)

  const addComp = (type: string, name: string, visible: boolean, props: Record<string, unknown> = {}) => {
    if (names.has(name)) return
    if (visible) tree.push({ type, name, props })
    else nonVisible.push({ type, name, props })
    names.add(name)
  }

  for (const logic of screen.logic ?? []) {
    if (/timer/i.test(logic.event)) addComp('Clock', logic.component, false, { TimerEnabled: false, TimerInterval: 1000 })
    for (const a of logic.actions) {
      if (a.op === 'alert') addComp('Notifier', a.component, false)
      if (a.op === 'celebrate') addComp('Celebration', a.component, false)
      if (a.op === 'method') {
        const hint = METHOD_BLOCK_COMPONENT[a.block]
        if (hint) addComp(hint.type, a.component, hint.visible)
      }
    }
  }
  return { ...screen, tree, nonVisible }
}

function normalizeScreen(raw: unknown, index: number): AiGenScreen {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const seq = { n: 0 }
  const tree = asArray(o.tree ?? o.components ?? o.children ?? o.widgets)
    .map((n) => normalizeNode(n, seq))
    .filter((n): n is AiGenNode => Boolean(n))
  const nonVisible = asArray(o.nonVisible ?? o.nonvisible ?? o.hidden)
    .map((n) => normalizeNode(n, seq))
    .filter((n): n is AiGenNode => Boolean(n))
    .map((n) => ({ type: n.type, name: n.name, props: n.props }))
  const logic = asArray(o.logic ?? o.events ?? o.blocks)
    .map(normalizeLogic)
    .filter((l): l is AiGenLogic => Boolean(l))
  const name = pickStr(o.name, o.id, o.screen) || `Screen${index + 1}`
  const screen: AiGenScreen = {
    name,
    title: pickStr(o.title, o.Title) || name,
    backgroundColor: pickStr(o.backgroundColor, o.BackgroundColor) || '#f8f9fa',
    tree: tree.length ? tree : [{ type: 'Label', name: 'Hint1', props: { Text: '请补充界面', FontSize: 16 } }],
    nonVisible,
    logic,
    script: pickStr(o.script, o.code, o.javascript) || undefined,
  }
  return ensureExtras(screen)
}

function valueXml(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return `<block type="logic_boolean"><field name="BOOL">${value ? 'TRUE' : 'FALSE'}</field></block>`
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<block type="math_number"><field name="NUM">${value}</field></block>`
  }
  return `<block type="text"><field name="TEXT">${esc(value)}</field></block>`
}

function methodXml(a: Extract<AiGenAction, { op: 'method' }>): string {
  const block = resolveMethodBlock(a.block, a.component)
  if (!block || !a.component) return ''
  const comp = `<field name="COMPONENT">${esc(a.component)}</field>`
  const extra: string[] = []
  const num = (name: string, fallback: number) => {
    const n = typeof a.value === 'number' && Number.isFinite(a.value) ? a.value : fallback
    extra.push(`<value name="${name}"><block type="math_number"><field name="NUM">${n}</field></block></value>`)
  }
  const text = (name: string, fallback: string) => {
    extra.push(`<value name="${name}">${valueXml(fallback)}</value>`)
  }
  if (block === 'score_add') num('DELTA', typeof a.value === 'number' ? a.value : 1)
  else if (block === 'vibrate') num('MS', typeof a.value === 'number' ? a.value : 200)
  else if (block === 'notifier_alert' || block === 'tts_speak' || block === 'sharing_share') {
    text('MESSAGE', a.message || String(a.value || '提示'))
  } else if (block === 'notifier_message') {
    text('MESSAGE', a.message || String(a.value || '提示'))
    text('TITLE', '提示')
    text('BUTTON', '确定')
  } else if (block === 'tinydb_store' || block === 'webdb_store') {
    text('TAG', a.tag || 'key')
    extra.push(`<value name="VALUE">${valueXml(a.value ?? '')}</value>`)
  } else if (block === 'tinydb_clear_tag') text('TAG', a.tag || 'key')
  else if (block === 'webviewer_goto' || block === 'activity_start' || block === 'web_get') {
    text('URL', a.url || String(a.value || 'https://'))
  } else if (block === 'phone_call') text('NUMBER', String(a.value || a.message || ''))
  else if (block === 'clipboard_copy') text('TEXT', a.message || String(a.value || ''))
  else if (block === 'listview_set_elements') text('ELEMENTS', String(a.value || ''))
  else if (block === 'note_save') {
    text('TITLE', a.tag || '笔记')
    text('CONTENT', String(a.value || a.message || ''))
  } else if (block === 'note_load' || block === 'note_delete') text('TITLE', a.tag || String(a.value || '笔记'))
  else if (block === 'file_save') {
    extra.push(`<value name="CONTENT">${valueXml(a.value ?? a.message ?? '')}</value>`)
    text('NAME', a.tag || 'notes.txt')
  } else if (block === 'random_next_int') {
    extra.push(`<value name="MIN"><block type="math_number"><field name="NUM">1</field></block></value>`)
    extra.push(`<value name="MAX"><block type="math_number"><field name="NUM">6</field></block></value>`)
  }
  return `<block type="${esc(block)}">${comp}${extra.join('')}</block>`
}

function actionXml(a: AiGenAction): string {
  switch (a.op) {
    case 'set':
      if (!a.component || !a.prop) return ''
      return `<block type="component_set_property">
        <field name="COMPONENT">${esc(a.component)}</field>
        <field name="PROP">${esc(a.prop)}</field>
        <value name="VALUE">${valueXml(a.value)}</value>
      </block>`
    case 'alert':
      return `<block type="notifier_alert">
        <field name="COMPONENT">${esc(a.component || 'Notifier1')}</field>
        <value name="MESSAGE"><block type="text"><field name="TEXT">${esc(a.message || '')}</field></block></value>
      </block>`
    case 'celebrate':
      return `<block type="celebrate"><field name="COMPONENT">${esc(a.component || 'Celebration1')}</field></block>`
    case 'openScreen':
      if (!a.screen) return ''
      return `<block type="control_open_screen"><field name="SCREEN">${esc(a.screen)}</field></block>`
    case 'closeScreen':
      return `<block type="control_close_screen"></block>`
    case 'method':
      return methodXml(a)
    default:
      return ''
  }
}

/** 把若干 statement 积木用 next 串起来 */
function chainStatements(xmlParts: string[]): string {
  const parts = xmlParts.filter(Boolean)
  if (!parts.length) return ''
  let out = parts[parts.length - 1]
  for (let i = parts.length - 2; i >= 0; i--) {
    out = String(parts[i]).replace(/<\/block>\s*$/, `<next>${out}</next></block>`)
  }
  return out
}

function logicEventXml(logic: AiGenLogic, x: number, y: number): string {
  if (!logic?.component) return ''
  const body = chainStatements((logic.actions ?? []).map(actionXml))
  return `<block type="component_event" x="${x}" y="${y}">
    <field name="COMPONENT">${esc(logic.component)}</field>
    <field name="EVENT">${esc(logic.event || 'Click')}</field>
    <statement name="DO">${body}</statement>
  </block>`
}

export function logicToBlocksXml(logic: AiGenLogic[] | undefined): string {
  if (!logic?.length) {
    return `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`
  }
  const chunks = logic.map((l, i) => logicEventXml(l, 20, 20 + i * 160)).filter(Boolean)
  return `<xml xmlns="https://developers.google.com/blockly/xml">\n${chunks.join('\n')}\n</xml>`
}

/** 从模型原文中抽出 JSON */
export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1].trim() : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('未找到 JSON 对象，请重试或换模型')
  const slice = candidate.slice(start, end + 1)
  try {
    return JSON.parse(slice) as unknown
  } catch {
    const repaired = slice.replace(/,\s*([}\]])/g, '$1')
    return JSON.parse(repaired) as unknown
  }
}

export function assertAiGenSpec(data: unknown): AiGenSpec {
  if (!data || typeof data !== 'object') throw new Error('AI 返回不是对象')
  const o = data as Record<string, unknown>
  const name = pickStr(o.name, o.title, o.projectName) || 'AI 生成项目'
  const screensRaw = asArray(o.screens ?? o.Screens)
  if (!screensRaw.length) throw new Error('缺少 screens 数组')
  return { name, screens: screensRaw.map((s, i) => normalizeScreen(s, i)) }
}
