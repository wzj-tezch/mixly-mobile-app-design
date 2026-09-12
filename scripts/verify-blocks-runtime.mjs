import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { getGeneratedCodeFromXml } = await server.ssrLoadModule('/src/blocks/codegen.ts')
  const { createTemplate } = await server.ssrLoadModule('/src/project/templates.ts')

  const previewSrc = fs.readFileSync(path.join(root, 'src/runtime/previewDoc.ts'), 'utf8')
  const badAuto =
    /type === 'Dice'[\s\S]{0,120}diceRoll\(name\)/.test(previewSrc) ||
    /type === 'CoinFlip'[\s\S]{0,120}coinFlip\(name\)/.test(previewSrc) ||
    /type === 'FortuneBall'[\s\S]{0,120}fortuneAsk\(name\)/.test(previewSrc) ||
    /type === 'TrafficLight'[\s\S]{0,120}trafficNext\(name\)/.test(previewSrc)
  if (badAuto) {
    console.error('FAIL: previewDoc still auto-invokes fun methods on click')
    process.exitCode = 1
  } else {
    console.log('OK: previewDoc fun components only fire Click')
  }

  const party = createTemplate('party_box')
  const code = getGeneratedCodeFromXml(party.screens[0].blocksXml)
  const need = ['rt.on(', 'Dice1', 'Click', 'diceRoll', 'coinFlip', 'fortuneAsk']
  const missing = need.filter((s) => !code.includes(s))
  if (missing.length) {
    console.error('FAIL: party_box generated code missing', missing)
    console.log('code snippet:\n', code.slice(0, 800))
    process.exitCode = 1
  } else {
    console.log('OK: party_box Click→method codegen present')
  }

  const empty = getGeneratedCodeFromXml('')
  if (empty !== '') {
    console.error('FAIL: empty xml should generate empty code')
    process.exitCode = 1
  }

  const broken = getGeneratedCodeFromXml('<xml><block type="no_such_block_xyz"></block></xml>')
  // may be empty or partial; must not throw — already caught
  console.log('broken xml codegen length', broken.length)

  const noBlocks = createTemplate('party_box', { withBlocks: false })
  const noCode = getGeneratedCodeFromXml(noBlocks.screens[0].blocksXml || '')
  if (noCode.includes('diceRoll')) {
    console.error('FAIL: 自己搭建 mode still has diceRoll in generated code')
    process.exitCode = 1
  } else {
    console.log('OK: 自己搭建 has no diceRoll in codegen')
  }

  if (!process.exitCode) console.log('OK: blocks-driven preview checks passed')
} finally {
  await server.close()
}
process.exit(process.exitCode || 0)
