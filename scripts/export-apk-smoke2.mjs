import { createServer } from "vite"
import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
console.log("hi", root)
const server = await createServer({
  configFile: path.join(root, "vite.config.ts"),
  root,
  server: { middlewareMode: true },
  appType: "custom",
})
try {
  const { createTemplate } = await server.ssrLoadModule("/src/project/templates.ts")
  const { buildStandaloneDocument } = await server.ssrLoadModule("/src/runtime/previewDoc.ts")
  const { getGeneratedCodeFromXml } = await server.ssrLoadModule("/src/blocks/codegen.ts")
  const project = createTemplate("tour_device")
  const screenCodes = {}
  for (const sc of project.screens) screenCodes[sc.name] = getGeneratedCodeFromXml(sc.blocksXml)
  const html = buildStandaloneDocument(project, screenCodes)
  const outDir = path.join(root, "dist-apk", "tour-device-apk-project")
  fs.mkdirSync(path.join(outDir, "www"), { recursive: true })
  fs.writeFileSync(path.join(outDir, "www", "index.html"), html, "utf8")
  fs.writeFileSync(path.join(outDir, "project.json"), JSON.stringify(project, null, 2), "utf8")
  console.log("ok", html.length, project.screens[0].nonVisible.length)
} finally {
  await server.close()
}
