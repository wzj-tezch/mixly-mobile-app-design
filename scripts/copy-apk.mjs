#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const candidates = [
  path.join(root, 'mobile-shell', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
]
const outDir = path.join(root, 'dist-apk')
fs.mkdirSync(outDir, { recursive: true })

let found = false
for (const apk of candidates) {
  if (fs.existsSync(apk)) {
    const dest = path.join(outDir, 'app-debug.apk')
    fs.copyFileSync(apk, dest)
    console.log('已复制:', dest)
    found = true
  }
}
if (!found) {
  console.error('未找到 APK。请先在 mobile-shell 执行: npx cap sync android && npm run build:apk')
  process.exit(1)
}
