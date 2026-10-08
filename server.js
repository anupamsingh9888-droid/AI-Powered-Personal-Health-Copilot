import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(
  process.env.APP_PORT ||
  process.env.DEFAULT_APP_PORT ||
  (process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : '3000'),
  10
)
const HOST = '0.0.0.0'

function getDistDir() {
  const candidates = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'frontend', 'dist'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'frontend', 'dist'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate
    }
  }
  return path.join(__dirname, 'dist')
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

const server = http.createServer((req, res) => {
  const method = req.method || 'GET'
  const urlPath = req.url?.split('?')[0] || '/'

  // Health check endpoints for Cloud Run & container orchestrators
  if (urlPath === '/_health' || urlPath === '/healthz' || urlPath === '/health' || urlPath === '/status') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    })
    res.end(method === 'HEAD' ? undefined : 'OK')
    return
  }

  const distDir = getDistDir()
  const reqPath = decodeURIComponent(urlPath)
  let filePath = path.join(distDir, reqPath)

  // Security guard against path traversal
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const isStaticAsset = reqPath.startsWith('/assets/') || ext === '.js' || ext === '.css'
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': isStaticAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
      }

      res.writeHead(200, headers)
      if (method === 'HEAD') {
        res.end()
      } else {
        fs.createReadStream(filePath).pipe(res)
      }
      return
    }

    // SPA fallback: return index.html for all non-file routes
    const indexPath = path.join(distDir, 'index.html')
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Build artifacts not found. Please verify npm run build.')
        return
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      })
      res.end(method === 'HEAD' ? undefined : content)
    })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[HealthLens Server] Serving on http://${HOST}:${PORT}`)
})

// Graceful shutdown on termination signals from Cloud Run
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0)
  })
})
