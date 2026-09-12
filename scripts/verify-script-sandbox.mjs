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

const ok = (name, cond) => {
  if (cond) console.log('OK:', name)
  else {
    console.error('FAIL:', name)
    process.exitCode = 1
  }
}

try {
  const { validateAdvancedScript } = await server.ssrLoadModule('/src/runtime/scriptSandbox.ts')

  const allow = `rt.on('Button1', 'Click', function () { rt.alert('你好'); });`
  ok('合法脚本通过', validateAdvancedScript(allow).ok === true)

  const attacks = [
    ['eval', 'eval("1")'],
    ['Function', 'Function("return 1")()'],
    ['window', 'window.alert(1)'],
    ['document', 'document.body'],
    ['fetch', 'fetch("https://example.com")'],
    ['constructor ident', '({}).constructor.constructor("return 1")()'],
    ['concat constructor', "var k='cons'+'tructor'; ({})[k]"],
    ['template constructor', '({ })[`cons${""}tructor`]'],
    ['array join constructor', "var k=['cons','tructor'].join(''); k"],
    ['__proto__', 'var o={__proto__:{x:1}}'],
    ['javascript url', "rt.openUrl('javascript:alert(1)')"],
    ['fromCharCode', 'String.fromCharCode(99,111,110)'],
    ['getPrototypeOf', 'Object.getPrototypeOf(rt)'],
    ['import', 'import("https://x")'],
    ['script tag', 'rt.alert("</script><script>alert(1)</script>")'],
    ['null byte', 'rt.alert(1)\0window'],
  ]

  for (const [name, code] of attacks) {
    const r = validateAdvancedScript(code)
    ok('拒绝 ' + name, r.ok === false)
    if (r.ok) console.error('  leaked:', JSON.stringify(code))
  }

  const previewSrc = (await import('node:fs')).readFileSync(
    path.join(root, 'src/runtime/previewDoc.ts'),
    'utf8',
  )
  ok('导出 JSON 使用 jsonForScript', previewSrc.includes('jsonForScript(payload)') && previewSrc.includes('jsonForScript(byName)'))
  const sandboxSrc = (await import('node:fs')).readFileSync(
    path.join(root, 'src/runtime/scriptSandbox.ts'),
    'utf8',
  )
  ok('沙箱锁定 async/generator', sandboxSrc.includes('async function(){}') && sandboxSrc.includes('function*(){}'))
  ok('openUrl 限制 http', previewSrc.includes('只能打开 http/https'))
} finally {
  await server.close()
}

if (process.exitCode) process.exit(process.exitCode)
else console.log('script sandbox checks passed')
