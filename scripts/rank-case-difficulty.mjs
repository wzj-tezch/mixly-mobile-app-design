/**
 * Multi-factor difficulty ranking for classroom cases.
 */
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
})

const BASIC = new Set([
  'component_event',
  'component_set_property',
  'component_get_property',
  'text',
  'math_number',
  'math_arithmetic',
  'logic_compare',
  'controls_if',
  'text_join',
  'logic_boolean',
  'logic_negate',
  'logic_operation',
  'math_round',
  'math_single',
])

const ADVANCED_CONCEPTS = {
  math_modulo: 3,
  dice_roll: 1,
  coin_flip: 1,
  celebrate: 1,
  score_add: 1,
  countdown_start: 2,
  stopwatch_start: 2,
  tinydb_store: 3,
  tinydb_get: 3,
  note_save: 2,
  note_load: 2,
  clipboard_copy: 2,
  share_message: 2,
  tts_speak: 2,
  fortune_ask: 1,
  traffic_next: 1,
  random_next_int: 2,
  text_search_lines: 3,
  take_picture: 2,
  open_another_screen: 4,
  close_screen: 3,
}

function collect(node, comps = []) {
  comps.push(node.type)
  for (const c of node.children || []) collect(c, comps)
  return comps
}

try {
  const { CASE_CATALOG } = await server.ssrLoadModule('/src/project/caseCatalog.ts')
  const { createTemplate } = await server.ssrLoadModule('/src/project/templates.ts')
  const { getGeneratedCodeFromXml } = await server.ssrLoadModule('/src/blocks/codegen.ts')

  const rows = []
  for (const item of CASE_CATALOG) {
    const p = createTemplate(item.id)
    let xmlLen = 0
    let events = 0
    let ifs = 0
    let elseifs = 0
    let codeLines = 0
    const comps = new Set()
    const methods = new Set()
    let conceptScore = 0

    for (const s of p.screens) {
      const xml = s.blocksXml || ''
      xmlLen += xml.length
      events += (xml.match(/component_event/g) || []).length
      ifs += (xml.match(/controls_if/g) || []).length
      elseifs += (xml.match(/elseif="/g) || []).length
      const code = getGeneratedCodeFromXml(xml)
      codeLines += code.split('\n').filter((l) => l.trim()).length
      for (const t of collect(s.root)) comps.add(t)
      for (const n of s.nonVisible || []) comps.add(n.type)
      for (const m of xml.matchAll(/<block type="([^"]+)"/g)) {
        const t = m[1]
        if (!BASIC.has(t)) methods.add(t)
        if (ADVANCED_CONCEPTS[t]) conceptScore += ADVANCED_CONCEPTS[t]
      }
    }

    const screens = p.screens.length
    // Multi-angle score:
    // - events / branching / XML size / codegen lines
    // - multi-screen & component breadth
    // - specialty method / concept weight
    // Tour / catalog-style projects get exploration bonus (many comps, thin logic)
    const isTour = item.id.startsWith('tour_')
    const score =
      events * 3 +
      ifs * 5 +
      elseifs * 4 +
      Math.round(xmlLen / 350) +
      Math.round(codeLines / 4) +
      screens * 8 +
      Math.round(comps.size / 2) +
      methods.size * 2 +
      conceptScore +
      (isTour ? 6 : 0)

    rows.push({
      id: item.id,
      level: item.level,
      label: item.label,
      minutes: item.minutes || 0,
      screens,
      events,
      ifs,
      elseifs,
      xmlLen,
      codeLines,
      comps: comps.size,
      methods: [...methods].sort().join('|'),
      conceptScore,
      score,
    })
  }

  rows.sort((a, b) => a.score - b.score)
  console.log(
    [
      'rank',
      'id',
      'cur',
      'score',
      'ev',
      'if',
      'ei',
      'scr',
      'xml',
      'ln',
      'cp',
      'cx',
      'min',
      'label',
    ].join('\t'),
  )
  rows.forEach((r, i) => {
    console.log(
      [
        i + 1,
        r.id,
        r.level,
        r.score,
        r.events,
        r.ifs,
        r.elseifs,
        r.screens,
        r.xmlLen,
        r.codeLines,
        r.comps,
        r.conceptScore,
        r.minutes,
        r.label,
      ].join('\t'),
    )
  })

  console.log('\n--- suggested buckets (keep 9/12/6; tours+camera stay 拓展; party stay 娱乐) ---')
  const fixedTour = rows.filter((r) => r.id.startsWith('tour_') || r.id === 'camera')
  const fixedFun = rows.filter((r) => ['party_box', 'fortune_show', 'mini_arcade'].includes(r.id))
  const rest = rows.filter(
    (r) => !fixedTour.includes(r) && !fixedFun.includes(r),
  )
  const simple = rest.slice(0, 9)
  const medium = rest.slice(9, 21)
  const hard = rest.slice(21)
  console.log('简单', simple.map((r) => r.id).join(', '))
  console.log('中等', medium.map((r) => r.id).join(', '))
  console.log('难', hard.map((r) => r.id).join(', '))
  console.log('拓展', fixedTour.map((r) => r.id).join(', '))
  console.log('娱乐', fixedFun.map((r) => r.id).join(', '))
} finally {
  await server.close()
}
