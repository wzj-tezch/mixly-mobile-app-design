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

const issues = []
const origWarn = console.warn
const warns = []
console.warn = (...args) => {
  warns.push(args.map(String).join(' '))
  origWarn(...args)
}

try {
  const { CASE_CATALOG } = await server.ssrLoadModule('/src/project/caseCatalog.ts')
  const { createTemplate } = await server.ssrLoadModule('/src/project/templates.ts')
  const { getGeneratedCodeFromXml } = await server.ssrLoadModule('/src/blocks/codegen.ts')
  const { getMeta } = await server.ssrLoadModule('/src/components/registry.ts')

  function collect(node, comps) {
    comps.push({ name: node.name, type: node.type })
    for (const c of node.children || []) collect(c, comps)
  }

  for (const item of CASE_CATALOG) {
    const project = createTemplate(item.id)
    for (const screen of project.screens) {
      const comps = []
      collect(screen.root, comps)
      for (const n of screen.nonVisible || []) comps.push({ name: n.name, type: n.type })
      const nameSet = new Set(comps.map((c) => c.name))
      const byName = Object.fromEntries(comps.map((c) => [c.name, c.type]))
      const xml = screen.blocksXml || ''
      warns.length = 0
      const code = getGeneratedCodeFromXml(xml)

      for (const w of warns) {
        if (/unavailable option|Invalid block|non-existent input|Failed to load/.test(w)) {
          issues.push({ id: item.id, screen: screen.name, kind: 'codegen_warn', detail: w.slice(0, 200) })
        }
      }

      if (xml.trim() && !code.trim()) {
        issues.push({ id: item.id, screen: screen.name, kind: 'codegen_empty', detail: 'xml present but code empty' })
      }

      for (const m of xml.matchAll(/<field name="COMPONENT">([^<]+)<\/field>/g)) {
        if (!nameSet.has(m[1])) {
          issues.push({ id: item.id, screen: screen.name, kind: 'missing_component', detail: m[1] })
        }
      }

      for (const m of xml.matchAll(
        /<field name="COMPONENT">([^<]+)<\/field>\s*<field name="EVENT">([^<]+)<\/field>/g,
      )) {
        const [, name, event] = m
        const type = byName[name]
        if (!type) continue
        const meta = getMeta(type)
        if (meta.events?.length && !meta.events.includes(event)) {
          issues.push({
            id: item.id,
            screen: screen.name,
            kind: 'bad_event',
            detail: `${name}(${type}).${event} not in [${meta.events.join(',')}]`,
          })
        }
      }

      if (xml.includes('<statement name="ELSE">') && !/<mutation[^>]*else=/.test(xml)) {
        issues.push({ id: item.id, screen: screen.name, kind: 'if_else_mutation', detail: 'ELSE without mutation' })
      }

      // critical interactive cases must generate expected calls
      const expect = {
        mood_bulb: ['setProp', 'LightBulb1', 'On'],
        coin_luck: ['coinFlip'],
        charge_dash: ["setProp('ProgressBar1', 'Progress'"],
        tap_frenzy: ['ScoreLabel', 'celebrate'],
        rps_duel: ['diceRoll', 'celebrate'],
        pet_care: ['dbStore'],
        share_cheer: ['clipboardCopy', 'shareMessage'],
        reaction_timer: ['stopwatchStart', 'stopwatchPause'],
        party_box: ['diceRoll', 'coinFlip', 'fortuneAsk'],
        fortune_show: ['fortuneAsk', 'ttsSpeak', 'shareMessage'],
        camera: ['takePicture'],
        name_picker: ['randomNextInt'],
      }
      if (expect[item.id]) {
        for (const frag of expect[item.id]) {
          if (frag === 'Submitted') {
            if (!code.includes("'Submitted'")) {
              issues.push({ id: item.id, screen: screen.name, kind: 'missing_codegen', detail: "expected rt.on Submitted" })
            }
            continue
          }
          if (!code.includes(frag)) {
            issues.push({ id: item.id, screen: screen.name, kind: 'missing_codegen', detail: `expected ${frag}` })
          }
        }
      }
      if (item.id === 'camera' && !/takePicture\('Camera1','PhotoImage'\)/.test(code)) {
        issues.push({ id: item.id, screen: screen.name, kind: 'missing_codegen', detail: code.slice(0, 120) })
      }
    }
  }

  const byKind = {}
  for (const i of issues) {
    byKind[i.kind] = (byKind[i.kind] || 0) + 1
  }
  console.log(JSON.stringify({ total: issues.length, byKind, issues }, null, 2))
  process.exitCode = issues.length ? 1 : 0
} finally {
  console.warn = origWarn
  await server.close()
}
process.exit(process.exitCode || 0)
