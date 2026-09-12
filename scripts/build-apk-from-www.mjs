#!/usr/bin/env node
/**
 * 将 www 写入 E:\ai2-node\mobile-shell 并打 Debug APK（必须在纯英文路径下执行）。
 *
 *   E:\Node\node.exe E:\ai2-node\scripts\build-apk-from-www.mjs --www <dir> --name <name> [--app-id <id>] [--result out.json]
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const BUILD_ENV = 'E:\\ai2-build-env'
export const SHELL_ROOT = 'E:\\ai2-node\\mobile-shell'
const PROGRESS_FILE = path.join(os.tmpdir(), 'ai2-apk-progress.json')

function envWithToolchain() {
  const javaHome = path.join(BUILD_ENV, 'jdk-21')
  const sdk = path.join(BUILD_ENV, 'sdk')
  return {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: sdk,
    ANDROID_SDK_ROOT: sdk,
    PATH: [path.join(javaHome, 'bin'), path.join(sdk, 'platform-tools'), 'E:\\Node', process.env.PATH || ''].join(';'),
  }
}

function run(cmd, args, cwd, env) {
  // Windows: use cmd.exe /c with quoted command to avoid shell:true deprecation + injection
  const line = [cmd, ...args].map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')
  const r = spawnSync('cmd.exe', ['/d', '/s', '/c', line], {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
  })
  return {
    status: r.status ?? (r.signal ? 1 : 0),
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    error: r.error,
  }
}

function writeProgress(stage, message, percent) {
  try {
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify({ stage, message, percent, updatedAt: Date.now() }),
      'utf8',
    )
  } catch {
    /* ignore */
  }
}

function ensureShellReady(env, log) {
  if (!fs.existsSync(SHELL_ROOT)) {
    throw new Error(`缺少壳工程 ${SHELL_ROOT}`)
  }
  if (!fs.existsSync(path.join(BUILD_ENV, 'jdk-21', 'bin', 'java.exe'))) {
    throw new Error(`缺少 JDK：${BUILD_ENV}\\jdk-21`)
  }
  if (!fs.existsSync(path.join(BUILD_ENV, 'sdk', 'platforms'))) {
    throw new Error(`缺少 Android SDK：${BUILD_ENV}\\sdk`)
  }
  if (!fs.existsSync(path.join(SHELL_ROOT, 'node_modules'))) {
    log('npm install (mobile-shell)...')
    writeProgress('deps', '安装 mobile-shell 依赖…', 28)
    const r = run('npm', ['install'], SHELL_ROOT, env)
    if (r.status !== 0) throw new Error('mobile-shell npm install 失败\n' + r.stderr + r.stdout)
  }
  if (!fs.existsSync(path.join(SHELL_ROOT, 'android'))) {
    log('cap add android...')
    writeProgress('cap-add', '初始化 Android 工程…', 32)
    const r = run('npx', ['cap', 'add', 'android'], SHELL_ROOT, env)
    if (r.status !== 0) throw new Error('cap add android 失败\n' + r.stderr + r.stdout)
  }
}

function writeLocalProps() {
  const android = path.join(SHELL_ROOT, 'android')
  fs.writeFileSync(path.join(android, 'local.properties'), 'sdk.dir=E:\\\\ai2-build-env\\\\sdk\n')
  const gp = path.join(android, 'gradle.properties')
  let text = fs.existsSync(gp) ? fs.readFileSync(gp, 'utf8') : ''
  if (!/overridePathCheck/.test(text)) {
    text += '\nandroid.overridePathCheck=true\n'
    fs.writeFileSync(gp, text)
  }
}

function copyBuiltinMedia(wwwDir) {
  const candidates = [
    path.join('E:\\ai2-node', 'public', 'media'),
    path.join(path.resolve(__dirname, '..'), 'public', 'media'),
  ]
  const mediaDst = path.join(wwwDir, 'media')
  for (const src of candidates) {
    if (fs.existsSync(src)) {
      fs.mkdirSync(mediaDst, { recursive: true })
      fs.cpSync(src, mediaDst, { recursive: true })
      return
    }
  }
}

function clearDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return
  }
  for (const name of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, name), { recursive: true, force: true })
  }
}

/**
 * @param {{ wwwDir: string, name: string, appId?: string, onLog?: (s: string) => void }} opts
 */
export function buildApkFromWww(opts) {
  const log = opts.onLog || ((s) => console.log(s))
  const name = opts.name || 'AI2学生作品'
  const idSuffix =
    String(opts.appId || name)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-8)
      .toLowerCase() || 'app'
  const appId = opts.appId?.startsWith('com.') ? opts.appId : `com.ai2node.s${idSuffix}`
  const env = envWithToolchain()

  writeProgress('prepare', '检查构建环境…', 26)
  ensureShellReady(env, log)

  const wwwDest = path.join(SHELL_ROOT, 'www')
  log('写入 www...')
  writeProgress('www', '写入网页资源…', 35)
  clearDir(wwwDest)
  fs.cpSync(opts.wwwDir, wwwDest, { recursive: true })
  copyBuiltinMedia(wwwDest)

  fs.writeFileSync(
    path.join(SHELL_ROOT, 'capacitor.config.json'),
    JSON.stringify(
      {
        appId,
        appName: String(name).slice(0, 30) || 'AI2学生作品',
        webDir: 'www',
        server: { androidScheme: 'https' },
        android: { allowMixedContent: true },
        plugins: {
          Camera: { permissions: ['camera', 'photos'] },
          Geolocation: { permissions: ['location'] },
        },
      },
      null,
      2,
    ),
  )
  writeLocalProps()

  log('cap sync android...')
  writeProgress('sync', '同步 Capacitor（cap sync）…', 45)
  const sync = run('npx', ['cap', 'sync', 'android'], SHELL_ROOT, env)
  if (sync.status !== 0) throw new Error('cap sync 失败\n' + sync.stderr + sync.stdout)

  log('gradlew assembleDebug...')
  writeProgress('gradle', 'Gradle 编译 APK（较慢）…', 55)
  const gradle = run('npm', ['run', 'build:apk'], SHELL_ROOT, env)
  if (gradle.status !== 0) throw new Error('assembleDebug 失败\n' + gradle.stderr + gradle.stdout)

  const built = path.join(SHELL_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  if (!fs.existsSync(built)) throw new Error('未找到生成的 APK: ' + built)

  writeProgress('finish', '准备下载…', 92)
  const outName = `ai2-${idSuffix}-debug.apk`
  const meta = {
    apkPath: built,
    outName,
    appId,
    appName: name,
    size: fs.statSync(built).size,
    builtAt: new Date().toISOString(),
  }
  writeProgress('done', `完成 ${outName}`, 100)
  log(`OK ${built}`)
  return meta
}

function parseArgs(argv) {
  const out = { www: '', name: 'AI2学生作品', appId: '', result: '' }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--www') out.www = argv[++i]
    else if (argv[i] === '--name') out.name = argv[++i]
    else if (argv[i] === '--app-id') out.appId = argv[++i]
    else if (argv[i] === '--result') out.result = argv[++i]
  }
  return out
}

function explainExit(code) {
  // Windows NTSTATUS often comes through as signed 32-bit
  const u = code < 0 ? code + 0x100000000 : code
  if (u === 0xc0000409) return 'Node 在中文路径下崩溃。请确认脚本从 E:\\ai2-node\\scripts 启动。'
  if (u === 0xc0000005) return '进程访问冲突。请关闭占用 android/www 的程序后重试。'
  return ''
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2))
  if (!args.www) {
    console.error('用法: node build-apk-from-www.mjs --www <dir> --name <name> [--result out.json]')
    process.exit(1)
  }
  try {
    const r = buildApkFromWww({
      wwwDir: path.resolve(args.www),
      name: args.name,
      appId: args.appId || undefined,
    })
    console.log(JSON.stringify(r))
    if (args.result) {
      fs.mkdirSync(path.dirname(path.resolve(args.result)), { recursive: true })
      fs.writeFileSync(path.resolve(args.result), JSON.stringify(r), 'utf8')
    }
  } catch (e) {
    writeProgress('error', String(e?.message || e), 0)
    console.error(String(e?.stack || e))
    process.exit(1)
  }
}

export { explainExit, PROGRESS_FILE }
