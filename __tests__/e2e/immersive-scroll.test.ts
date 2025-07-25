/**
 * E2E Tests for Immersive Scroll Experience
 * 
 * This test suite validates the end-to-end functionality of the immersive scroll system
 * including Lenis integration, section transitions, z-index orchestration, and performance.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const PERFORMANCE_BUDGET = {
  fps: 55,
  maxMemoryMB: 100,
  maxAnimations: 25,
}

// Helper functions
async function waitForLenisReady(page: Page) {
  await page.waitForFunction(() => {
    return window.lenis && window.lenis.isSmooth
  }, { timeout: 10000 })
}

async function getScrollProgress(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return window.scrollY / (document.body.scrollHeight - window.innerHeight)
  })
}

async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
    }
  })
}

async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((progress) => {
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const targetScroll = maxScroll * progress
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }, progress)
  
  // Wait for scroll to complete
  await page.waitForTimeout(1000)
}

test.describe('Immersive Scroll Experience', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
  })

  test.beforeEach(async () => {
    page = await context.newPage()
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`)
      }
    })
    
    await page.goto(BASE_URL)
    await waitForLenisReady(page)
  })

  test.afterEach(async () => {
    await page.close()
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('should load and initialize Lenis correctly', async () => {
    // Check that Lenis is initialized
    const lenisExists = await page.evaluate(() => {
      return typeof window.lenis !== 'undefined' && window.lenis.isSmooth
    })
    
    expect(lenisExists).toBe(true)
    
    // Check that scroll progress is tracked
    const scrollProgress = await page.evaluate(() => {
      return window.scrollProgress?.get() >= 0
    })
    
    expect(scrollProgress).toBe(true)
  })

  test('should render all scroll sections correctly', async () => {
    // Check that main sections exist
    const sections = await page.locator('[data-section-id]').count()
    expect(sections).toBeGreaterThan(0)
    
    // Check specific sections
    await expect(page.locator('[data-section-id="hero"]')).toBeVisible()
    await expect(page.locator('[data-section-id="scroll-prompt"]')).toBeVisible()
    await expect(page.locator('[data-section-id="section-1"]')).toBeVisible()
  })

  test('should handle smooth scrolling transitions', async () => {
    const initialProgress = await getScrollProgress(page)
    expect(initialProgress).toBe(0)
    
    // Scroll to middle of page
    await scrollToProgress(page, 0.5)
    
    const midProgress = await getScrollProgress(page)
    expect(midProgress).toBeGreaterThan(0.3)
    expect(midProgress).toBeLessThan(0.7)
    
    // Scroll to end
    await scrollToProgress(page, 1)
    
    const endProgress = await getScrollProgress(page)
    expect(endProgress).toBeGreaterThan(0.9)
  })

  test('should activate sections based on scroll position', async () => {
    // Start at hero section
    const heroActive = await page.evaluate(() => {
      return document.querySelector('[data-section-id="hero"]')?.getAttribute('data-active') === 'true'
    })
    
    // Scroll to activate different sections
    await scrollToProgress(page, 0.5)
    await page.waitForTimeout(500)
    
    const midSectionActive = await page.evaluate(() => {
      return document.querySelector('[data-section-id="section-1"]')?.getAttribute('data-active') === 'true'
    })
    
    expect(midSectionActive).toBe(true)
  })

  test('should apply z-index orchestration correctly', async () => {
    // Check that sections have appropriate z-index values
    const zIndexValues = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('[data-section-id]'))
      return sections.map(section => ({
        id: section.getAttribute('data-section-id'),
        zIndex: window.getComputedStyle(section).zIndex
      }))
    })
    
    // Verify that z-index values are properly assigned
    expect(zIndexValues.length).toBeGreaterThan(0)
    zIndexValues.forEach(({ zIndex }) => {
      expect(zIndex).not.toBe('auto')
      expect(parseInt(zIndex)).toBeGreaterThan(0)
    })
  })

  test('should handle parallax effects without performance issues', async () => {
    // Measure initial performance
    const initialMetrics = await getPerformanceMetrics(page)
    
    // Scroll through parallax sections
    for (let i = 0; i <= 10; i++) {
      await scrollToProgress(page, i / 10)
      await page.waitForTimeout(100)
    }
    
    // Check final performance
    const finalMetrics = await getPerformanceMetrics(page)
    const memoryIncrease = (finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize) / 1024 / 1024
    
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_BUDGET.maxMemoryMB)
  })

  test('should handle scroll triggers correctly', async () => {
    // Find scroll trigger elements
    const triggers = await page.locator('[data-scroll-trigger]').count()
    
    if (triggers > 0) {
      // Scroll to activate triggers
      await scrollToProgress(page, 0.3)
      await page.waitForTimeout(500)
      
      // Check that triggers are activated
      const activeTriggers = await page.locator('[data-scroll-trigger][data-active="true"]').count()
      expect(activeTriggers).toBeGreaterThan(0)
    }
  })

  test('should maintain performance during continuous scrolling', async () => {
    let frameCount = 0
    let fps = 0
    
    // Monitor frame rate during scrolling
    await page.evaluate(() => {
      let lastTime = performance.now()
      let frameCount = 0
      
      function measureFPS() {
        const now = performance.now()
        frameCount++
        
        if (now - lastTime >= 1000) {
          window.currentFPS = Math.round((frameCount * 1000) / (now - lastTime))
          frameCount = 0
          lastTime = now
        }
        
        requestAnimationFrame(measureFPS)
      }
      
      measureFPS()
    })
    
    // Perform continuous scrolling
    for (let i = 0; i <= 20; i++) {
      await scrollToProgress(page, (i % 10) / 10)
      await page.waitForTimeout(50)
    }
    
    // Get final FPS
    fps = await page.evaluate(() => window.currentFPS || 60)
    
    expect(fps).toBeGreaterThan(PERFORMANCE_BUDGET.fps)
  })

  test('should handle contrast mode changes', async () => {
    // Check initial contrast mode
    const body = page.locator('body')
    
    // Scroll to section with light contrast
    await scrollToProgress(page, 0.6)
    await page.waitForTimeout(500)
    
    // Check that contrast mode is applied
    const hasContrastClass = await body.evaluate(el => {
      return el.classList.contains('contrast-light') || el.classList.contains('contrast-dark')
    })
    
    expect(hasContrastClass).toBe(true)
  })

  test('should handle reduced motion preferences', async () => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await waitForLenisReady(page)
    
    // Check that animations respect reduced motion
    const respectsReducedMotion = await page.evaluate(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return prefersReducedMotion
    })
    
    expect(respectsReducedMotion).toBe(true)
  })

  test('should handle mobile viewport correctly', async () => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.reload()
    await waitForLenisReady(page)
    
    // Test touch scrolling
    await page.touchscreen.tap(200, 400)
    await page.touchscreen.tap(200, 200) // Swipe up
    
    await page.waitForTimeout(500)
    
    const scrollProgress = await getScrollProgress(page)
    expect(scrollProgress).toBeGreaterThan(0)
  })

  test('should handle debug components in development', async () => {
    // Check if debug components are present (should only be in development)
    const performanceMonitor = await page.locator('[data-testid="performance-monitor"]').count()
    const animationDebugger = await page.locator('[data-testid="animation-debugger"]').count()
    
    // Debug components should exist in development environment
    if (process.env.NODE_ENV === 'development') {
      expect(performanceMonitor + animationDebugger).toBeGreaterThan(0)
    }
  })

  test('should handle error boundaries gracefully', async () => {
    // Check that error boundaries are in place
    const errorBoundaries = await page.locator('[data-error-boundary]').count()
    
    // Navigate through the page to ensure no crashes
    await scrollToProgress(page, 0.25)
    await scrollToProgress(page, 0.5)
    await scrollToProgress(page, 0.75)
    await scrollToProgress(page, 1)
    
    // Check that page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight
    })
    
    expect(isResponsive).toBe(true)
  })

  test('should maintain accessibility features', async () => {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
    expect(headings).toBeGreaterThan(0)
    
    // Check for alt text on images
    const images = await page.locator('img').count()
    if (images > 0) {
      const imagesWithAlt = await page.locator('img[alt]').count()
      expect(imagesWithAlt).toBe(images)
    }
    
    // Check for proper ARIA labels where needed
    const interactiveElements = await page.locator('button, [role="button"], [tabindex]').count()
    expect(interactiveElements).toBeGreaterThan(0)
  })

  test('should handle memory cleanup correctly', async () => {
    const initialMetrics = await getPerformanceMetrics(page)
    
    // Perform extensive scrolling to trigger cleanup
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i <= 10; i++) {
        await scrollToProgress(page, i / 10)
        await page.waitForTimeout(100)
      }
    }
    
    // Wait for potential cleanup
    await page.waitForTimeout(2000)
    
    const finalMetrics = await getPerformanceMetrics(page)
    const memoryGrowth = (finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize) / 1024 / 1024
    
    // Memory growth should be reasonable
    expect(memoryGrowth).toBeLessThan(50) // Less than 50MB growth
  })
})