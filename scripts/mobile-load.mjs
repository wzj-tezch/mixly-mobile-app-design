#!/usr/bin/env node
/**
 * 将「导出 APK 工程」解压目录（或含 index.html 的文件夹）同步到 mobile-shell/www
 * 用法: node scripts/mobile-load.mjs <exportDir>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const shellWww = path.join(root, 'mobile-shell', 'www')
const src = process.argv[2]

if (!src) {
  console.error('用法: node scripts/mobile-load.mjs <导出目录或含 index.html 的文件夹>')
  process.exit(1)
}

const abs = path.resolve(src)
const wwwSrc = fs.existsSync(path.join(abs, 'www', 'index.html'))
  ? path.join(abs, 'www')
  : fs.existsSync(path.join(abs, 'index.html'))
    ? abs
    : null

if (!wwwSrc) {
  console.error('未找到 index.html（期望 .../www/index.html 或目录下直接有 index.html）')
  process.exit(1)
}

const srcIndex = path.join(wwwSrc, 'index.html')
const srcSize = fs.statSync(srcIndex).size
fs.rmSync(shellWww, { recursive: true, force: true })
fs.mkdirSync(shellWww, { recursive: true })
fs.cpSync(wwwSrc, shellWww, { recursive: true })
const dstSize = fs.statSync(path.join(shellWww, 'index.html')).size
if (dstSize !== srcSize) {
  console.error(`同步异常: 源 index.html ${srcSize} 字节，目标 ${dstSize} 字节`)
  process.exit(1)
}
console.log(`已同步到 mobile-shell/www（index.html ${dstSize} 字节）`)
console.log('下一步: cd mobile-shell && npx cap sync android && npm run build:apk')
