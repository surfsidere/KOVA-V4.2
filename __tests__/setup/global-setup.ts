/**
 * Playwright Global Setup
 * Configure the test environment before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...')
  
  // Create a browser instance for setup tasks
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the development server to be ready
    const baseURL = process.env.BASE_URL || 'http://localhost:3000'
    console.log(`📡 Checking if server is ready at ${baseURL}`)
    
    let retries = 30
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: 5000 })
        console.log('✅ Server is ready!')
        break
      } catch (error) {
        retries--
        if (retries === 0) {
          throw new Error(`Server not ready after 30 attempts: ${error}`)
        }
        console.log(`⏳ Server not ready, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Verify that essential components are working
    console.log('🔍 Verifying essential components...')
    
    // Check that Lenis initializes
    await page.waitForFunction(() => {
      return window.lenis && typeof window.lenis.scrollTo === 'function'
    }, { timeout: 10000 })
    
    // Check that React app is mounted
    await page.waitForSelector('main', { timeout: 10000 })
    
    // Check that CSS is loaded
    const hasStyles = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body)
      return computedStyle.margin !== '' || computedStyle.padding !== ''
    })
    
    if (!hasStyles) {
      console.warn('⚠️ CSS may not be fully loaded')
    }
    
    console.log('✅ Essential components verified!')
    
    // Store any global state if needed
    process.env.SETUP_COMPLETE = 'true'
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('🎉 Playwright global setup complete!')
}

export default globalSetup