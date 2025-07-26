#!/usr/bin/env node

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

console.log(`🚀 Traction Labs Design - KOVA V4 Starting...`)
console.log(`Environment: ${dev ? 'Development' : 'Production'}`)
console.log(`Server: ${hostname}:${port}`)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('✅ Next.js app prepared successfully')
  
  // Create HTTP/1.1 compatible server
  const server = createServer(async (req, res) => {
    try {
      // Force HTTP/1.1 headers for CodeSandbox compatibility
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Keep-Alive', 'timeout=5, max=1000')
      
      // Remove problematic headers
      res.removeHeader('Transfer-Encoding')
      
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('❌ Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Configure server for better reliability
  server.keepAliveTimeout = 5000
  server.headersTimeout = 6000
  server.timeout = 30000

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server failed to start:', err)
      throw err
    }
    console.log(`✅ Traction Labs Design server ready on http://${hostname}:${port}`)
  })

  // Enhanced error handling
  server.on('error', (err) => {
    console.error('❌ Server error:', err)
  })

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason)
    process.exit(1)
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
  console.error('❌ Failed to prepare Next.js app:', ex.stack)
  console.error('❌ This is likely the SIGBUS error returning')
  process.exit(1)
})