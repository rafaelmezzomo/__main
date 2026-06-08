import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const parentDir = path.resolve(__dirname, '..')

// Middleware to serve files from parent __main dir
function serveParentFiles() {
  return {
    name: 'serve-parent-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const paths = ['/changelog.md', '/projects.json']
        const prefixes = ['/plannings/']

        const shouldServe = paths.includes(req.url) || prefixes.some(p => req.url.startsWith(p))
        if (!shouldServe) return next()

        const filePath = path.join(parentDir, req.url)
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath)
          const types = { '.json': 'application/json', '.md': 'text/plain' }
          res.setHeader('Content-Type', types[ext] || 'text/plain')
          fs.createReadStream(filePath).pipe(res)
        } else {
          res.statusCode = 404
          res.end('Not found')
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), serveParentFiles()],
  server: {
    port: 4000,
  },
})
