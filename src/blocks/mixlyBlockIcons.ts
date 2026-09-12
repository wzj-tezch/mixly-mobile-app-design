/** Mixly toolbox category icons — reuse official mark PNGs, generate only if missing. */

function dataUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function mixOutline(inner: string, stroke: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

function generated(inner: string) {
  return {
    normal: dataUrl(mixOutline(inner, '#5c6bc0')),
    selected: dataUrl(mixOutline(inner, '#ffffff')),
  }
}

const MARK = `${import.meta.env.BASE_URL}media/mark/`

function mixlyPng(normal: string, selected: string) {
  return { normal: `${MARK}${normal}`, selected: `${MARK}${selected}` }
}

export const MIX_CAT_ICONS: Record<string, { normal: string; selected: string }> = {
  catEvent: mixlyPng('event.png', 'event2.png'),
  catProp: mixlyPng('property.png', 'property2.png'),
  catCtrl: mixlyPng('ctrl.png', 'ctrl2.png'),
  catMath: mixlyPng('math.png', 'math2.png'),
  catLogic: mixlyPng('logic.png', 'logic2.png'),
  catText: mixlyPng('text.png', 'text2.png'),
  catList: mixlyPng('list3.png', 'list4.png'),
  catVar: mixlyPng('var.png', 'var2.png'),
  catFunc: mixlyPng('func.png', 'func2.png'),
  catUi: mixlyPng('monitor.png', 'monitor2.png'),
  catMedia: mixlyPng('music.png', 'music2.png'),
  catColour: generated(
    `<circle cx="9" cy="10" r="4"/><circle cx="15" cy="10" r="4"/><circle cx="12" cy="15.2" r="4"/>`,
  ),
  catNotify: generated(
    `<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>`,
  ),
  catNotes: mixlyPng('file.png', 'file2.png'),
  catWorkshop: mixlyPng('factory3.png', 'factory4.png'),
  catStorage: mixlyPng('store.png', 'store2.png'),
  catFun: mixlyPng('game.png', 'game2.png'),
  catTools: mixlyPng('tool.png', 'tool2.png'),
  catTime: generated(
    `<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`,
  ),
  catPhone: generated(
    `<rect x="8" y="3" width="8" height="18" rx="1.5"/><circle cx="12" cy="18.2" r="0.8"/>`,
  ),
}

export const MIX_CAT_IDS = [
  'catEvent',
  'catProp',
  'catCtrl',
  'catMath',
  'catLogic',
  'catText',
  'catList',
  'catVar',
  'catFunc',
  'catUi',
  'catMedia',
  'catColour',
  'catNotify',
  'catNotes',
  'catWorkshop',
  'catStorage',
  'catFun',
  'catTools',
  'catTime',
  'catPhone',
] as const

export function mixlyCategoryCssConfig(id: string) {
  return {
    row: `blocklyToolboxCategory blocklyTreeRow ${id}`,
    rowcontentcontainer: 'blocklyTreeRowContentContainer',
    icon: `blocklyToolboxCategoryIcon blocklyTreeIcon ${id}-icon`,
    label: 'blocklyToolboxCategoryLabel blocklyTreeLabel',
    selected: 'blocklyToolboxSelected blocklyTreeSelected',
  }
}

export function injectMixlyToolboxIconCss() {
  if (typeof document === 'undefined') return
  const el = document.getElementById('mix-cat-icons') ?? document.createElement('style')
  el.id = 'mix-cat-icons'
  const rules = Object.entries(MIX_CAT_ICONS)
    .map(
      ([id, ic]) => `
.${id}-icon,
#${id} .blocklyTreeIcon,
#${id} .blocklyToolboxCategoryIcon {
  background-image: url("${ic.normal}") !important;
  background-color: transparent !important;
  visibility: visible !important;
}
.${id}.blocklyTreeSelected .blocklyTreeIcon,
.${id}.blocklyToolboxSelected .blocklyToolboxCategoryIcon,
#${id} .blocklyTreeSelected .blocklyTreeIcon,
#${id} .blocklyToolboxSelected .blocklyToolboxCategoryIcon,
.${id}.blocklyTreeSelected .${id}-icon,
.${id}.blocklyToolboxSelected .${id}-icon {
  background-image: url("${ic.selected}") !important;
}
`,
    )
    .join('')
  el.textContent = rules
  if (!el.parentNode) document.head.appendChild(el)
}

export function applyMixlyBlockFrontIcons() {
  injectMixlyToolboxIconCss()
}
