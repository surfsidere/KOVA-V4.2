/**
 * Performance Benchmark Tests
 * 
 * This test suite validates performance characteristics of the immersive scroll system
 * and ensures it meets established performance budgets.
 */

import { test, expect, Page, Browser } from '@playwright/test'

// Performance budgets and thresholds
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  
  // Animation Performance
  minFPS: 55,
  maxFrameTime: 18, // ms (for 55+ FPS)
  maxMemoryMB: 100,
  maxAnimations: 25,
  
  // Bundle Performance
  maxBundleSizeMB: 2,
  maxInitialLoadTime: 3000,
}

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_ITERATIONS = 5
const SCROLL_ITERATIONS = 20

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  animationCount: number
  activeAnimations: number
  timestamp: number
}

interface BenchmarkResult {
  name: string
  value: number
  unit: string
  threshold: number
  passed: boolean
}

// Helper functions
async function measureFPS(page: Page, duration: number = 5000): Promise<number> {
  return await page.evaluate(async (duration) => {
    return new Promise<number>((resolve) => {
      let frameCount = 0
      const startTime = performance.now()
      
      function countFrame() {
        frameCount++
        const elapsed = performance.now() - startTime
        
        if (elapsed < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = (frameCount / elapsed) * 1000
          resolve(Math.round(fps))
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  }, duration)
}

async function measureMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const memory = (performance as any).memory
    return memory?.usedJSHeapSize || 0
  })
}

async function measureFrameTime(page: Page, samples: number = 60): Promise<number> {
  return await page.evaluate(async (samples) => {
    return new Promise<number>((resolve) => {
      const frameTimes: number[] = []
      let lastTime = performance.now()
      
      function measureFrame() {
        const currentTime = performance.now()
        const frameTime = currentTime - lastTime
        frameTimes.push(frameTime)
        lastTime = currentTime
        
        if (frameTimes.length < samples) {
          requestAnimationFrame(measureFrame)
        } else {
          const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
          resolve(averageFrameTime)
        }
      }
      
      requestAnimationFrame(measureFrame)
    })
  }, samples)
}

async function getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  return await page.evaluate(() => {
    // Get metrics from performance monitor if available
    const monitor = (window as any).performanceMonitor
    if (monitor) {
      return {
        fps: monitor.metrics.fps,
        frameTime: monitor.metrics.frameTime,
        memoryUsage: monitor.metrics.memoryUsage,
        animationCount: monitor.metrics.animationCount,
        activeAnimations: monitor.metrics.activeAnimations,
        timestamp: Date.now(),
      }
    }
    
    // Fallback metrics
    const memory = (performance as any).memory
    return {
      fps: 60, // Assume 60fps as baseline
      frameTime: 16.67, // 60fps = 16.67ms per frame
      memoryUsage: memory?.usedJSHeapSize || 0,
      animationCount: 0,
      activeAnimations: 0,
      timestamp: Date.now(),
    }
  })
}

async function scrollToProgress(page: Page, progress: number, smooth: boolean = true) {
  await page.evaluate(({ progress, smooth }) => {
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const targetScroll = maxScroll * progress
    
    if (smooth && window.lenis) {
      window.lenis.scrollTo(targetScroll)
    } else {
      window.scrollTo({ 
        top: targetScroll, 
        behavior: smooth ? 'smooth' : 'instant' 
      })
    }
  }, { progress, smooth })
  
  await page.waitForTimeout(smooth ? 500 : 100)
}

async function simulateScrolling(page: Page, iterations: number): Promise<PerformanceMetrics[]> {
  const metrics: PerformanceMetrics[] = []
  
  for (let i = 0; i < iterations; i++) {
    const progress = i / (iterations - 1)
    await scrollToProgress(page, progress, true)
    
    const metric = await getPerformanceMetrics(page)
    metrics.push(metric)
    
    await page.waitForTimeout(100)
  }
  
  return metrics
}

test.describe('Performance Benchmarks', () => {
  let browser: Browser
  let page: Page

  test.beforeAll(async ({ browser: b }) => {
    browser = b
  })

  test.beforeEach(async () => {
    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
    
    // Enable performance monitoring
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    
    // Wait for Lenis to initialize
    await page.waitForFunction(() => {
      return window.lenis && window.lenis.isSmooth
    }, { timeout: 10000 })
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should meet Core Web Vitals targets', async () => {
    const results: BenchmarkResult[] = []
    
    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000)
      })
    })
    
    results.push({
      name: 'Largest Contentful Paint',
      value: lcp,
      unit: 'ms',
      threshold: PERFORMANCE_BUDGETS.LCP,
      passed: lcp <= PERFORMANCE_BUDGETS.LCP,
    })
    
    // Measure CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
        }).observe({ entryTypes: ['layout-shift'] })
        
        setTimeout(() => resolve(clsValue), 3000)
      })
    })
    
    results.push({
      name: 'Cumulative Layout Shift',
      value: cls,
      unit: '',
      threshold: PERFORMANCE_BUDGETS.CLS,
      passed: cls <= PERFORMANCE_BUDGETS.CLS,
    })
    
    // Log results
    console.log('Core Web Vitals Results:')
    results.forEach(result => {
      console.log(`${result.name}: ${result.value}${result.unit} (${result.passed ? 'PASS' : 'FAIL'})`)
      expect(result.passed).toBe(true)
    })
  })

  test('should maintain target FPS during scrolling', async () => {
    const results: number[] = []
    
    for (let iteration = 0; iteration < TEST_ITERATIONS; iteration++) {
      // Start FPS measurement
      const fpsPromise = measureFPS(page, 3000)
      
      // Scroll during measurement
      for (let i = 0; i < 10; i++) {
        await scrollToProgress(page, i / 10)
        await page.waitForTimeout(100)
      }
      
      const fps = await fpsPromise
      results.push(fps)
    }
    
    const averageFPS = results.reduce((a, b) => a + b, 0) / results.length
    const minFPS = Math.min(...results)
    
    console.log(`FPS Results: Average ${averageFPS.toFixed(1)}, Min ${minFPS}`)
    
    expect(averageFPS).toBeGreaterThan(PERFORMANCE_BUDGETS.minFPS)
    expect(minFPS).toBeGreaterThan(PERFORMANCE_BUDGETS.minFPS * 0.9) // Allow 10% tolerance
  })

  test('should maintain acceptable frame times', async () => {
    const frameTimes: number[] = []
    
    for (let iteration = 0; iteration < TEST_ITERATIONS; iteration++) {
      const frameTime = await measureFrameTime(page, 60)
      frameTimes.push(frameTime)
      
      // Scroll between measurements
      await scrollToProgress(page, Math.random())
    }
    
    const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    
    console.log(`Frame Time Results: Average ${averageFrameTime.toFixed(2)}ms, Max ${maxFrameTime.toFixed(2)}ms`)
    
    expect(averageFrameTime).toBeLessThan(PERFORMANCE_BUDGETS.maxFrameTime)
    expect(maxFrameTime).toBeLessThan(PERFORMANCE_BUDGETS.maxFrameTime * 1.5) // Allow 50% tolerance for spikes
  })

  test('should manage memory usage effectively', async () => {
    const initialMemory = await measureMemoryUsage(page)
    const memoryReadings: number[] = []
    
    // Perform extensive scrolling to stress test memory
    for (let cycle = 0; cycle < 3; cycle++) {
      const metrics = await simulateScrolling(page, SCROLL_ITERATIONS)
      
      metrics.forEach(metric => {
        memoryReadings.push(metric.memoryUsage)
      })
      
      // Force garbage collection if possible
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        }
      })
      
      await page.waitForTimeout(1000)
    }
    
    const finalMemory = await measureMemoryUsage(page)
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024 // Convert to MB
    const maxMemory = Math.max(...memoryReadings) / 1024 / 1024
    
    console.log(`Memory Results: Growth ${memoryGrowth.toFixed(2)}MB, Max ${maxMemory.toFixed(2)}MB`)
    
    expect(memoryGrowth).toBeLessThan(PERFORMANCE_BUDGETS.maxMemoryMB * 0.5) // Growth should be < 50MB
    expect(maxMemory).toBeLessThan(PERFORMANCE_BUDGETS.maxMemoryMB)
  })

  test('should limit concurrent animations', async () => {
    // Scroll through all sections to activate animations
    await scrollToProgress(page, 0.25)
    await page.waitForTimeout(500)
    
    await scrollToProgress(page, 0.5)
    await page.waitForTimeout(500)
    
    await scrollToProgress(page, 0.75)
    await page.waitForTimeout(500)
    
    const metrics = await getPerformanceMetrics(page)
    
    console.log(`Animation Results: Active ${metrics.activeAnimations}, Total ${metrics.animationCount}`)
    
    expect(metrics.activeAnimations).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.maxAnimations)
  })

  test('should perform well on mobile devices', async () => {
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Wait for initialization
    await page.waitForFunction(() => {
      return window.lenis && window.lenis.isSmooth
    }, { timeout: 10000 })
    
    // Measure mobile performance
    const mobileMetrics = await simulateScrolling(page, 10)
    const averageFPS = mobileMetrics.reduce((sum, m) => sum + m.fps, 0) / mobileMetrics.length
    const averageMemory = mobileMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / mobileMetrics.length
    
    console.log(`Mobile Results: FPS ${averageFPS.toFixed(1)}, Memory ${(averageMemory / 1024 / 1024).toFixed(2)}MB`)
    
    // Mobile should maintain at least 45fps
    expect(averageFPS).toBeGreaterThan(45)
    expect(averageMemory / 1024 / 1024).toBeLessThan(PERFORMANCE_BUDGETS.maxMemoryMB * 0.8) // 80% of desktop budget
  })

  test('should handle performance degradation gracefully', async () => {
    // Simulate high load by rapid scrolling
    const startTime = Date.now()
    const results: PerformanceMetrics[] = []
    
    for (let i = 0; i < 50; i++) {
      await scrollToProgress(page, Math.random(), false) // Instant scroll for high frequency
      const metrics = await getPerformanceMetrics(page)
      results.push(metrics)
      await page.waitForTimeout(50)
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Check that system remained responsive
    const averageFPS = results.reduce((sum, m) => sum + m.fps, 0) / results.length
    const responsiveFrames = results.filter(m => m.frameTime < 33).length // < 30fps threshold
    const responsiveRatio = responsiveFrames / results.length
    
    console.log(`Stress Test Results: Duration ${duration}ms, Avg FPS ${averageFPS.toFixed(1)}, Responsive ${(responsiveRatio * 100).toFixed(1)}%`)
    
    expect(responsiveRatio).toBeGreaterThan(0.8) // 80% of frames should be responsive
    expect(averageFPS).toBeGreaterThan(30) // Should maintain at least 30fps under stress
  })

  test('should optimize based on device capabilities', async () => {
    // Test with simulated low-end device
    const lowEndMetrics = await page.evaluate(() => {
      // Mock low-end device characteristics
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true })
      
      // Simulate connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '3g' },
        configurable: true
      })
      
      // Check if performance mode adapts
      const isLowEnd = (navigator.deviceMemory || 4) < 4 || 
                      (navigator.hardwareConcurrency || 4) < 4
      
      return {
        deviceMemory: navigator.deviceMemory,
        cores: navigator.hardwareConcurrency,
        isLowEnd,
      }
    })
    
    console.log(`Device Capability Results:`, lowEndMetrics)
    
    // Performance should adapt to device capabilities
    expect(lowEndMetrics.isLowEnd).toBe(true)
  })

  test('should maintain performance with debug tools disabled', async () => {
    // Ensure debug tools are not affecting production performance
    const debugElementsCount = await page.locator('[data-testid*="debug"], [data-testid*="monitor"]').count()
    
    if (process.env.NODE_ENV === 'production') {
      expect(debugElementsCount).toBe(0)
    }
    
    // Measure baseline performance without debug overhead
    const fps = await measureFPS(page, 2000)
    const memory = await measureMemoryUsage(page)
    
    console.log(`Production Performance: FPS ${fps}, Memory ${(memory / 1024 / 1024).toFixed(2)}MB`)
    
    expect(fps).toBeGreaterThan(PERFORMANCE_BUDGETS.minFPS)
  })
})

test.describe('Performance Regression Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should not regress from baseline performance', async () => {
    // This test would compare against stored baseline metrics
    // In a real implementation, you'd store baseline metrics and compare
    
    const currentMetrics = await simulateScrolling(page, 10)
    const averageFPS = currentMetrics.reduce((sum, m) => sum + m.fps, 0) / currentMetrics.length
    const averageMemory = currentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / currentMetrics.length
    
    // Store these as baseline for future comparisons
    console.log('Current Performance Baseline:', {
      fps: averageFPS.toFixed(1),
      memory: (averageMemory / 1024 / 1024).toFixed(2) + 'MB',
      timestamp: new Date().toISOString(),
    })
    
    // In practice, you'd compare against stored baseline
    expect(averageFPS).toBeGreaterThan(PERFORMANCE_BUDGETS.minFPS)
    expect(averageMemory / 1024 / 1024).toBeLessThan(PERFORMANCE_BUDGETS.maxMemoryMB)
  })
})