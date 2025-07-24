#!/usr/bin/env node

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

console.log(`🚀 Traction Labs Design - KOVA V4 Starting...`)
console.log(`Environment: ${dev ? 'Development' : 'Production'}`)
console.log(`Server: ${hostname}:${port}`)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP/1.1 compatible server
  const server = createServer((req, res) => {
    try {
      // Force HTTP/1.1 headers for CodeSandbox compatibility
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Keep-Alive', 'timeout=5, max=1000')
      
      // Remove problematic headers
      res.removeHeader('Transfer-Encoding')
      
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Configure server for CodeSandbox
  server.keepAliveTimeout = 5000
  server.headersTimeout = 6000

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server failed to start:', err)
      throw err
    }
    console.log(`✅ Traction Labs Design server ready on http://${hostname}:${port}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 Shutting down server gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })
}).catch((ex) => {
  console.error('❌ Failed to start Traction Labs Design server:', ex.stack)
  process.exit(1)
})