import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const APP_VERSION = packageJson.version

// Write version to src/version.js
const versionFilePath = join(__dirname, 'src/version.js')
writeFileSync(versionFilePath, `// Read version from package.json\n// This file is generated during build to include the current version\nexport const APP_VERSION = '${APP_VERSION}';\n`)

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: true,
    https: existsSync(join(__dirname, '.dev-certs/localhost.pem'))
      ? {
          cert: join(__dirname, '.dev-certs/localhost.pem'),
          key: join(__dirname, '.dev-certs/localhost-key.pem'),
        }
      : true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from dev/external-levelpacks for editor access
      allow: ['..', 'dev/external-levelpacks']
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
