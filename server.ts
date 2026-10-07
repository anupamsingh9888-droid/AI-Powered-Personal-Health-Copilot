import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = '0.0.0.0'

// Detect dist directory
let DIST_DIR = path.join(__dirname, 'dist')
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  const altDist = path.join(__dirname, 'frontend', 'dist')
  if (fs.existsSync(altDist) && fs.existsSync(path.join(altDist, 'index.html'))) {
    DIST_DIR = altDist
  }
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
}

const server = http.createServer((req, res) => {
  // Respond immediately to health checks
  const urlPath = req.url?.split('?')[0] || '/'
  if (urlPath === '/_health' || urlPath === '/healthz' || urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
    return
  }

  let reqPath = decodeURIComponent(urlPath)
  let filePath = path.join(DIST_DIR, reqPath)

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const headers: Record<string, string> = { 'Content-Type': contentType }

      if (reqPath.startsWith('/assets/')) {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'
      } else {
        headers['Cache-Control'] = 'no-cache'
      }

      res.writeHead(200, headers)
      fs.createReadStream(filePath).pipe(res)
      return
    }

    // SPA fallback: return index.html
    const indexPath = path.join(DIST_DIR, 'index.html')
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Build index.html not found. Please build the application first.')
        return
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      })
      res.end(content)
    })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[HealthLens Server] Serving ${DIST_DIR} on http://${HOST}:${PORT}`)
})
