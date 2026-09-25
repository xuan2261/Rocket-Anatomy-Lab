import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.env.ROCKET_PUBLIC_ROOT
  ? fs.realpathSync(process.env.ROCKET_PUBLIC_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
if (!fs.statSync(root).isDirectory()) throw new Error('Invalid public root')
const port = Number(process.env.PORT || process.argv[2] || 4174)
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
])

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
  const file = path.resolve(root, relative)
  if (file !== path.resolve(root, 'index.html') && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      response.writeHead(404).end('Not found')
      return
    }
    response.writeHead(200, { 'content-type': mime.get(path.extname(file)) ?? 'application/octet-stream' })
    response.end(body)
  })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving static files from: ${root}`)
  console.log(`Rocket Anatomy Lab: http://127.0.0.1:${port}`)
  console.log('Press Ctrl+C to stop.')
})
