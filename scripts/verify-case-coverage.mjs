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

try {
  const { CASE_CATALOG, ALL_COMPONENT_COVERAGE } = await server.ssrLoadModule('/src/project/caseCatalog.ts')
  const { createTemplate } = await server.ssrLoadModule('/src/project/templates.ts')
  const { PALETTE_ORDER } = await server.ssrLoadModule('/src/components/registry.ts')

  const levelCount = {}
  for (const c of CASE_CATALOG) {
    levelCount[c.level] = (levelCount[c.level] || 0) + 1
  }
  console.log('levels', levelCount)
  console.log('total cases', CASE_CATALOG.length)

  const expected = { 简单: 9, 中等: 12, 难: 9, 拓展: 6, 娱乐: 3 }
  const levelOk = Object.entries(expected).every(([k, v]) => levelCount[k] === v)
  if (!levelOk || CASE_CATALOG.length !== 39) {
    console.error('FAIL level ratio — expected', expected, 'got', levelCount, 'total', CASE_CATALOG.length)
    process.exitCode = 1
  }

  function collect(node, set) {
    set.add(node.type)
    for (const c of node.children || []) collect(c, set)
  }

  function typesInProject(p) {
    const set = new Set()
    for (const s of p.screens) {
      collect(s.root, set)
      for (const n of s.nonVisible || []) set.add(n.type)
    }
    return set
  }

  const counts = new Map()
  for (const t of PALETTE_ORDER) counts.set(t, 0)

  for (const item of CASE_CATALOG) {
    const project = createTemplate(item.id)
    for (const t of typesInProject(project)) {
      if (counts.has(t)) counts.set(t, (counts.get(t) || 0) + 1)
    }
  }

  const weak = []
  for (const t of PALETTE_ORDER) {
    const n = counts.get(t) || 0
    if (n < 3) weak.push({ type: t, n })
  }

  console.log('coverage weak (<3):', weak)

  const covExtra = ALL_COMPONENT_COVERAGE.filter((t) => !PALETTE_ORDER.includes(t))
  const covMiss = PALETTE_ORDER.filter((t) => !ALL_COMPONENT_COVERAGE.includes(t))
  if (covExtra.length || covMiss.length) {
    console.warn('ALL_COMPONENT_COVERAGE drift', { covExtra, covMiss })
  }

  if (weak.length) {
    console.error('FAIL: each component must appear in ≥3 cases')
    process.exitCode = 1
  } else if (!process.exitCode) {
    console.log('OK: 39 cases, level ratio, every palette component ≥3')
  }
} finally {
  await server.close()
}

process.exit(process.exitCode || 0)
