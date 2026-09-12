import { buildToolbox } from '@/blocks/ai2Blocks'
import { CATEGORY_META, COMPONENT_REGISTRY, PALETTE_ORDER } from '@/components/registry'
import { EVENT_ZH, METHOD_ZH } from '@/components/componentHelp'

const LS_KEY = 'ai2-node-local-kb-v1'

const GENERIC_BLOCKS = new Set([
  'component_event',
  'component_set_property',
  'component_get_property',
  'control_open_screen',
  'control_close_screen',
  'controls_if',
  'controls_ifelse',
  'controls_repeat_ext',
  'controls_whileUntil',
  'controls_for',
  'controls_flow_statements',
  'math_number',
  'math_arithmetic',
  'math_single',
  'math_round',
  'math_modulo',
  'math_constrain',
  'math_random_int',
  'math_random_float',
  'logic_compare',
  'logic_operation',
  'logic_negate',
  'logic_boolean',
  'logic_null',
  'logic_ternary',
  'text',
  'text_empty',
  'text_newline',
  'text_join',
  'text_append',
  'text_length',
  'text_isEmpty',
  'text_indexOf',
  'text_charAt',
  'text_getSubstring',
  'text_changeCase',
  'text_trim',
  'lists_create_empty',
  'lists_create_with',
  'lists_repeat',
  'lists_length',
  'lists_isEmpty',
  'lists_indexOf',
  'lists_getIndex',
  'lists_setIndex',
  'lists_getSublist',
  'lists_split',
  'lists_sort',
  'colour_picker',
  'colour_random',
  'colour_rgb',
  'colour_blend',
  'controls_forEach',
  'controls_wait',
  'controls_wait_seconds',
  'math_trig',
  'math_constant',
  'math_number_property',
  'math_on_list',
  'math_atan2',
  'math_map',
  'convert_tonumber',
  'convert_tostring',
  'text_count',
  'text_replace',
  'text_reverse',
  'text_ask',
  'lists_reverse',
  'datetime_now',
  'datetime_format',
  'datetime_part',
  'datetime_make',
  'datetime_add',
  'datetime_diff',
  'datetime_parse',
  'json_get',
  'json_parse',
  'json_stringify',
  'json_set',
  'util_open_url',
  'util_keep_awake',
  'util_brightness',
  'util_volume',
  'util_beep',
])

const VALUE_ONLY_BLOCKS = new Set(['clock_system_time', 'tinydb_get'])

/** 组件方法名 / 中文 / 别名 → 工具箱积木 id */
const METHOD_TO_BLOCK: Record<string, string> = {
  ShowAlert: 'notifier_alert',
  ShowMessageDialog: 'notifier_message',
  ShowChooseDialog: 'notifier_choose',
  StoreValue: 'tinydb_store',
  ClearTag: 'tinydb_clear_tag',
  ClearAll: 'tinydb_clear_all',
  TakePicture: 'camera_take_picture',
  Play: 'sound_play',
  Speak: 'tts_speak',
  GetText: 'speech_get_text',
  ShareMessage: 'sharing_share',
  StartActivity: 'activity_start',
  MakePhoneCall: 'phone_call',
  Get: 'web_get',
  Clear: 'canvas_clear',
  MoveTo: 'sprite_move_to',
  GoToUrl: 'webviewer_goto',
  SetElementsFromString: 'listview_set_elements',
  Roll: 'dice_roll',
  Refresh: 'qr_refresh',
  Celebrate: 'celebrate',
  Flip: 'coin_flip',
  Next: 'traffic_next',
  AddScore: 'score_add',
  ResetScore: 'score_reset',
  Ask: 'fortune_ask',
  Vibrate: 'vibrate',
  Copy: 'clipboard_copy',
  Paste: 'clipboard_paste',
  NextInt: 'random_next_int',
  SaveFile: 'file_save',
  Open: 'gallery_open',
  OpenMultiple: 'file_pick_multi',
  SaveNote: 'note_save',
  LoadNote: 'note_load',
  DeleteNote: 'note_delete',
  ListNotes: 'note_list',
  ClearAllNotes: 'note_clear_all',
  OpenFolder: 'folder_pick',
  SearchInFolder: 'folder_search',
  SearchLines: 'workshop_search',
  ReplaceAll: 'workshop_replace',
  WordStats: 'workshop_stats',
  SortLines: 'workshop_sort',
  UniqueLines: 'workshop_unique',
  ReverseLines: 'workshop_reverse',
  ShuffleLines: 'workshop_shuffle',
  CsvColumn: 'workshop_csv_col',
  Reset: 'pedometer_reset',
  Arm: 'alarm_arm',
  Cancel: 'alarm_cancel',
  GoToday: 'calendar_today',
  ShiftMonth: 'calendar_shift',
  SendMessage: 'sms_send',
  Notify: 'notify_show',
  Scan: 'barcode_scan',
  GoTo: 'map_goto',
  Fetch: 'weather_fetch',
  Evaluate: 'calc_eval',
  Press: 'calc_press',
  ClearDone: 'todo_clear_done',
  MarkDate: 'calendar_mark',
  Snooze: 'alarm_snooze',
  MyLocation: 'map_mylocation',
  Search: 'contact_search',
  Call: 'dial_call',
  Backspace: 'dial_backspace',
}

/** 方法积木默认对应的组件类型（生成时若界面里没有就补上） */
export const METHOD_BLOCK_COMPONENT: Record<string, { type: string; visible: boolean }> = {
  notifier_alert: { type: 'Notifier', visible: false },
  notifier_message: { type: 'Notifier', visible: false },
  notifier_choose: { type: 'Notifier', visible: false },
  tinydb_store: { type: 'TinyDB', visible: false },
  tinydb_clear_tag: { type: 'TinyDB', visible: false },
  tinydb_clear_all: { type: 'TinyDB', visible: false },
  webdb_store: { type: 'TinyWebDB', visible: false },
  webdb_get: { type: 'TinyWebDB', visible: false },
  camera_take_picture: { type: 'Camera', visible: false },
  sound_play: { type: 'Sound', visible: false },
  player_start: { type: 'Player', visible: false },
  player_pause: { type: 'Player', visible: false },
  player_stop: { type: 'Player', visible: false },
  tts_speak: { type: 'TextToSpeech', visible: false },
  speech_get_text: { type: 'SpeechRecognizer', visible: false },
  sharing_share: { type: 'Sharing', visible: false },
  activity_start: { type: 'ActivityStarter', visible: false },
  phone_call: { type: 'PhoneCall', visible: false },
  web_get: { type: 'Web', visible: false },
  canvas_clear: { type: 'Canvas', visible: true },
  canvas_draw_line: { type: 'Canvas', visible: true },
  canvas_draw_circle: { type: 'Canvas', visible: true },
  sprite_move_to: { type: 'ImageSprite', visible: true },
  sprite_random_move: { type: 'ImageSprite', visible: true },
  webviewer_goto: { type: 'WebViewer', visible: true },
  listview_set_elements: { type: 'ListView', visible: true },
  dice_roll: { type: 'Dice', visible: true },
  countdown_start: { type: 'Countdown', visible: true },
  countdown_pause: { type: 'Countdown', visible: true },
  countdown_reset: { type: 'Countdown', visible: true },
  stopwatch_start: { type: 'Stopwatch', visible: true },
  stopwatch_pause: { type: 'Stopwatch', visible: true },
  stopwatch_reset: { type: 'Stopwatch', visible: true },
  qr_refresh: { type: 'QRCode', visible: true },
  celebrate: { type: 'Celebration', visible: false },
  coin_flip: { type: 'CoinFlip', visible: true },
  traffic_next: { type: 'TrafficLight', visible: true },
  score_add: { type: 'ScoreBoard', visible: true },
  score_reset: { type: 'ScoreBoard', visible: true },
  fortune_ask: { type: 'FortuneBall', visible: true },
  vibrate: { type: 'Vibrator', visible: false },
  clipboard_copy: { type: 'Clipboard', visible: false },
  clipboard_paste: { type: 'Clipboard', visible: false },
  random_next_int: { type: 'RandomHelper', visible: false },
  file_save: { type: 'FileSaver', visible: false },
  gallery_open: { type: 'GalleryPicker', visible: false },
  note_save: { type: 'NotePad', visible: false },
  note_load: { type: 'NotePad', visible: false },
  note_delete: { type: 'NotePad', visible: false },
  note_list: { type: 'NotePad', visible: false },
  note_clear_all: { type: 'NotePad', visible: false },
  file_pick: { type: 'FilePicker', visible: false },
  file_pick_multi: { type: 'FilePicker', visible: false },
  folder_pick: { type: 'FolderPicker', visible: false },
  folder_search: { type: 'FolderPicker', visible: false },
  workshop_search: { type: 'TextWorkshop', visible: false },
  workshop_replace: { type: 'TextWorkshop', visible: false },
  workshop_stats: { type: 'TextWorkshop', visible: false },
  workshop_sort: { type: 'TextWorkshop', visible: false },
  workshop_unique: { type: 'TextWorkshop', visible: false },
  workshop_reverse: { type: 'TextWorkshop', visible: false },
  workshop_shuffle: { type: 'TextWorkshop', visible: false },
  workshop_csv_col: { type: 'TextWorkshop', visible: false },
  pedometer_reset: { type: 'Pedometer', visible: false },
  alarm_arm: { type: 'Alarm', visible: true },
  alarm_cancel: { type: 'Alarm', visible: true },
  reminder_arm: { type: 'Reminder', visible: true },
  reminder_cancel: { type: 'Reminder', visible: true },
  calendar_today: { type: 'CalendarView', visible: true },
  calendar_shift: { type: 'CalendarView', visible: true },
  calendar_mark: { type: 'CalendarView', visible: true },
  sms_send: { type: 'Texting', visible: false },
  email_send: { type: 'Emailer', visible: false },
  flashlight_on: { type: 'Flashlight', visible: false },
  flashlight_off: { type: 'Flashlight', visible: false },
  notify_show: { type: 'DeviceNotify', visible: false },
  recorder_start: { type: 'SoundRecorder', visible: false },
  recorder_stop: { type: 'SoundRecorder', visible: false },
  barcode_scan: { type: 'BarcodeScanner', visible: false },
  map_goto: { type: 'MapView', visible: true },
  contact_add: { type: 'ContactList', visible: true },
  todo_add: { type: 'TodoList', visible: true },
  todo_clear_done: { type: 'TodoList', visible: true },
  calc_eval: { type: 'CalculatorPad', visible: true },
  calc_clear: { type: 'CalculatorPad', visible: true },
  calc_press: { type: 'CalculatorPad', visible: true },
  weather_fetch: { type: 'WeatherBox', visible: true },
  alarm_snooze: { type: 'Alarm', visible: true },
  reminder_snooze: { type: 'Reminder', visible: true },
  map_mylocation: { type: 'MapView', visible: true },
  contact_search: { type: 'ContactList', visible: true },
  dial_press: { type: 'DialPad', visible: true },
  dial_call: { type: 'DialPad', visible: true },
  dial_clear: { type: 'DialPad', visible: true },
  dial_backspace: { type: 'DialPad', visible: true },
}

export type LocalKbComponent = {
  type: string
  label: string
  category: string
  visible: boolean
  events: string[]
  methods: string[]
  props: string[]
}

export type LocalKb = {
  builtAt: number
  source: 'local-registry+toolbox'
  components: LocalKbComponent[]
  toolbox: Array<{ category: string; blocks: string[] }>
  methodBlocks: string[]
  events: string[]
  props: string[]
}

type ToolboxJson = {
  contents?: Array<{ name?: string; contents?: Array<{ type?: string }>; custom?: string }>
}

function collectToolbox() {
  const toolbox = buildToolbox() as ToolboxJson
  const categories: Array<{ category: string; blocks: string[] }> = []
  const all: string[] = []
  for (const cat of toolbox.contents || []) {
    const blocks = (cat.contents || []).map((b) => b.type).filter((t): t is string => Boolean(t))
    categories.push({ category: cat.name || cat.custom || '其他', blocks })
    all.push(...blocks)
  }
  return { categories, all }
}

export function compileLocalKnowledge(): LocalKb {
  const { categories, all } = collectToolbox()
  const methodBlocks = all.filter((t) => !GENERIC_BLOCKS.has(t) && !VALUE_ONLY_BLOCKS.has(t))
  const components: LocalKbComponent[] = PALETTE_ORDER.filter((type) => COMPONENT_REGISTRY[type]).map((type) => {
    const meta = COMPONENT_REGISTRY[type]
    return {
      type,
      label: meta.label,
      category: CATEGORY_META[meta.category]?.label || meta.category,
      visible: meta.isVisible,
      events: [...meta.events],
      methods: [...meta.methods],
      props: meta.fields.map((f) => f.key),
    }
  })
  const events = [...new Set(components.flatMap((c) => c.events))].sort()
  const props = [...new Set(components.flatMap((c) => c.props))].sort()
  return {
    builtAt: Date.now(),
    source: 'local-registry+toolbox',
    components,
    toolbox: categories,
    methodBlocks,
    events,
    props,
  }
}

export function persistLocalKnowledge(): LocalKb {
  const kb = compileLocalKnowledge()
  cached = kb
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(kb))
  } catch {
    /* quota */
  }
  return kb
}

let cached: LocalKb | null = null

export function getLocalKnowledge(): LocalKb {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalKb
      if (parsed?.components?.length && parsed?.methodBlocks?.length) {
        cached = parsed
        return parsed
      }
    }
  } catch {
    /* rebuild */
  }
  cached = persistLocalKnowledge()
  return cached
}

export function isKnownComponentType(type: string) {
  return Boolean(COMPONENT_REGISTRY[type])
}

export function allComponentTypes(): string[] {
  return Object.keys(COMPONENT_REGISTRY)
}

export function resolveMethodBlock(raw: string, componentHint = ''): string {
  const s = String(raw || '').trim()
  if (!s) return ''
  const kb = getLocalKnowledge()
  if (kb.methodBlocks.includes(s)) return s
  const compact = s.toLowerCase().replace(/[\s_\-]+/g, '')
  const hit = kb.methodBlocks.find((b) => b.replace(/_/g, '') === compact || b === compact)
  if (hit) return hit
  const mapped = METHOD_TO_BLOCK[s] || METHOD_TO_BLOCK[s.replace(/[\s_\-]/g, '')]
  if (mapped && kb.methodBlocks.includes(mapped)) {
    if (mapped === 'tinydb_store' && /web/i.test(componentHint)) return 'webdb_store'
    if (s === 'Start' || s === 'Pause' || s === 'Reset' || s === 'Stop') {
      if (/countdown/i.test(componentHint)) return `countdown_${s.toLowerCase()}`
      if (/stopwatch/i.test(componentHint)) return `stopwatch_${s.toLowerCase()}`
      if (/player|video/i.test(componentHint)) return s === 'Start' ? 'player_start' : s === 'Pause' ? 'player_pause' : 'player_stop'
      if (/pedometer|步/i.test(componentHint) && s === 'Reset') return 'pedometer_reset'
      if (/record|录音/i.test(componentHint) && s === 'Start') return 'recorder_start'
      if (/record|录音/i.test(componentHint) && s === 'Stop') return 'recorder_stop'
    }
    if ((s === 'Arm' || s === 'Cancel') && /remind|日程/i.test(componentHint)) {
      return s === 'Arm' ? 'reminder_arm' : 'reminder_cancel'
    }
    if (s === 'Snooze' && /remind|日程/i.test(componentHint)) return 'reminder_snooze'
    if (s === 'Press' && /dial|拨号/i.test(componentHint)) return 'dial_press'
    if (s === 'Add' && /todo|待办/i.test(componentHint)) return 'todo_add'
    if (s === 'Add' && /contact|通讯/i.test(componentHint)) return 'contact_add'
    if (s === 'Send' && /email|mail|邮件/i.test(componentHint)) return 'email_send'
    if ((s === 'On' || s === 'Off') && /flash|手电/i.test(componentHint)) {
      return s === 'On' ? 'flashlight_on' : 'flashlight_off'
    }
    return mapped
  }
  return ''
}

export function isKnownEvent(event: string) {
  const kb = getLocalKnowledge()
  if (kb.events.includes(event)) return true
  return Object.prototype.hasOwnProperty.call(EVENT_ZH, event)
}

export function isKnownProp(prop: string, componentType?: string) {
  if (componentType && COMPONENT_REGISTRY[componentType]) {
    return COMPONENT_REGISTRY[componentType].fields.some((f) => f.key === prop)
  }
  return getLocalKnowledge().props.includes(prop)
}

export function buildAiCatalogPrompt(kb: LocalKb = getLocalKnowledge()): string {
  const visible = kb.components.filter((c) => c.visible)
  const hidden = kb.components.filter((c) => !c.visible)
  const line = (c: LocalKbComponent) => {
    const ev = c.events.length ? `事件:${c.events.join(',')}` : '事件:无'
    const pr = c.props.length ? `属性:${c.props.join(',')}` : ''
    const md = c.methods.length ? `方法:${c.methods.map((m) => METHOD_ZH[m] || m).join(',')}` : ''
    return `${c.type}(${c.label}) ${[ev, pr, md].filter(Boolean).join(' ')}`
  }
  const byCat = (list: LocalKbComponent[]) => {
    const groups = new Map<string, LocalKbComponent[]>()
    for (const c of list) {
      const arr = groups.get(c.category) || []
      arr.push(c)
      groups.set(c.category, arr)
    }
    return [...groups.entries()]
      .map(([cat, items]) => `【${cat}】\n${items.map(line).join('\n')}`)
      .join('\n')
  }
  const toolboxLines = kb.toolbox
    .map((t) => `${t.category}: ${t.blocks.length ? t.blocks.join(', ') : '(变量/函数分类)'}`)
    .join('\n')

  return `## 本地知识库（由本软件组件库+积木工具箱自动生成，禁止发明这里没有的东西）
生成 App 时：type 只能用下列组件英文名；event 只能用该组件的事件；set 的 prop 只能用该组件属性；method.block 只能用「方法积木」列表。

### 可见组件
${byCat(visible)}

### 非可见组件
${byCat(hidden)}

### 积木工具箱（模块页真实积木 id）
${toolboxLines}

### 方法积木 method.block（只能用这些 id）
${kb.methodBlocks.join(', ')}

actions.op 只能是：set / alert / celebrate / openScreen / closeScreen / method
组件 name 用 Hint1、StartBtn、Clock1 这种好认的英文。`
}
