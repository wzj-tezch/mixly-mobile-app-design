import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { apkBuildPlugin } from './vite-plugin-apk-build.ts'
import { cloudApiPlugin } from './vite-plugin-cloud-api.ts'

export default defineConfig({
  plugins: [react(), apkBuildPlugin(path.resolve(__dirname)), cloudApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: './',
  server: {
    // 打包 APK 可能超过 2 分钟
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' http://localhost:5174 http://127.0.0.1:5174",
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' http://localhost:5174 http://127.0.0.1:5174",
    },
  },
})
