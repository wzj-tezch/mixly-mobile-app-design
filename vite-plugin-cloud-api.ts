import type { Plugin } from 'vite'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function cloudApiPlugin(): Plugin {
  const cloud = require('./server/mobile-app-cloud-api.cjs') as {
    attachConnect: (middlewares: unknown) => void
  }
  return {
    name: 'ai2-cloud-api',
    configureServer(server) {
      cloud.attachConnect(server.middlewares)
    },
    configurePreviewServer(server) {
      cloud.attachConnect(server.middlewares)
    },
  }
}
