import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const env = { ...process.env, PATH: "E:\\Node;" + (process.env.PATH || "") }

function run(cmd, args, cwd = root) {
  console.log("> " + cmd + " " + args.join(" "))
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8", shell: true })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return r.status ?? 1
}

if (run("node", ["scripts/export-apk-smoke2.mjs"]) !== 0) process.exit(1)

const outDir = path.join(root, "dist-apk", "tour-device-apk-project")
const project = JSON.parse(fs.readFileSync(path.join(outDir, "project.json"), "utf8"))
fs.writeFileSync(
  path.join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "ai2-tour-device",
      private: true,
      version: "1.0.0",
      scripts: { sync: "npx cap sync android", "build:apk": "cd android && .\\gradlew.bat assembleDebug" },
      dependencies: {
        "@capacitor/android": "^7.4.2",
        "@capacitor/camera": "^7.0.1",
        "@capacitor/core": "^7.4.2",
        "@capacitor/geolocation": "^7.1.4",
        "@capacitor/preferences": "^7.0.1",
      },
      devDependencies: { "@capacitor/cli": "^7.4.2" },
    },
    null,
    2,
  ),
)
fs.writeFileSync(
  path.join(outDir, "capacitor.config.json"),
  JSON.stringify({ appId: "com.ai2node.tourdevice", appName: project.name, webDir: "www" }, null, 2),
)

const mediaSrc = path.join(root, "public", "media")
const mediaDst = path.join(outDir, "www", "media")
if (fs.existsSync(mediaSrc)) fs.cpSync(mediaSrc, mediaDst, { recursive: true })

run("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${outDir}\\*' -DestinationPath '${path.join(root, "dist-apk", "tour-device-apk-project.zip")}' -Force`])

const sensors = project.screens[0].nonVisible.map((n) => n.type).filter((t) => /Sensor|Pedometer|Shake/.test(t))
console.log("Sensors(" + sensors.length + "): " + sensors.join(", "))
if (sensors.length < 10) process.exit(1)

if (run("node", ["scripts/mobile-load.mjs", outDir]) !== 0) process.exit(1)
const shell = path.join(root, "mobile-shell")
if (!fs.existsSync(path.join(shell, "node_modules")) && run("npm", ["install"], shell) !== 0) process.exit(1)
if (!fs.existsSync(path.join(shell, "android")) && run("npx", ["cap", "add", "android"], shell) !== 0) process.exit(1)
if (run("npx", ["cap", "sync", "android"], shell) !== 0) process.exit(1)

const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk"), "C:\\Android\\Sdk", "D:\\Android\\Sdk"].filter(Boolean).find((p) => fs.existsSync(p))
if (!sdk) {
  console.log("NO_SDK: export+sync OK. Install Android Studio + JDK17, then: cd mobile-shell && npm run build:apk")
  process.exit(2)
}
env.ANDROID_HOME = sdk
env.ANDROID_SDK_ROOT = sdk
if (run("npm", ["run", "build:apk"], shell) !== 0) process.exit(1)
run("npm", ["run", "copy-apk"], shell)
console.log("OK APK")
