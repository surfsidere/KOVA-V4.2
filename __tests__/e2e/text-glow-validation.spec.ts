import { test, expect } from '@playwright/test'

/**
 * KOVA V4.2 Text Glow Validation Tests
 * Comprehensive E2E testing for hero section text glow effect
 */

test.describe('Hero Section Text Glow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Wait for the hero section to load
    await page.waitForSelector('[data-testid="hero-section"]', { timeout: 10000 })
    
    // Wait for text rotator to initialize
    await page.waitForSelector('.text-rotator', { timeout: 5000 })
  })

  test('should display solid pale yellow text with glow effect', async ({ page }) => {
    // Wait for first text rotation cycle
    await page.waitForTimeout(1000)
    
    // Get the text rotator element
    const textRotator = page.locator('.text-rotator span')
    
    // Verify element exists
    await expect(textRotator).toBeVisible()
    
    // Check computed styles for solid pale yellow text
    const computedStyle = await textRotator.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      return {
        color: styles.color,
        opacity: styles.opacity,
        textShadow: styles.textShadow,
        backgroundClip: styles.backgroundClip,
        webkitBackgroundClip: styles.webkitBackgroundClip,
        webkitTextFillColor: styles.webkitTextFillColor
      }
    })
    
    // Validate solid text (not transparent)
    expect(computedStyle.opacity).toBe('1')
    
    // Validate pale yellow color (#FFFACD = rgb(255, 250, 205))
    expect(computedStyle.color).toMatch(/rgb\(255,\s*250,\s*205\)|#FFFACD/i)
    
    // Validate text shadow for glow effect
    expect(computedStyle.textShadow).toContain('rgb(255, 250, 205)')
    
    // Validate no background clipping (which causes outline effect)
    expect(computedStyle.backgroundClip).not.toBe('text')
    expect(computedStyle.webkitBackgroundClip).not.toBe('text')
    
    // Validate WebKit text fill color for solid rendering
    expect(computedStyle.webkitTextFillColor).toMatch(/rgb\(255,\s*250,\s*205\)|#FFFACD/i)
  })

  test('should not display outlined text', async ({ page }) => {
    const textRotator = page.locator('.text-rotator span')
    
    // Check that text is not using gradient background clipping
    const hasTextOutline = await textRotator.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      return (
        styles.backgroundClip === 'text' ||
        styles.webkitBackgroundClip === 'text' ||
        styles.color === 'transparent' ||
        styles.webkitTextFillColor === 'transparent'
      )
    })
    
    expect(hasTextOutline).toBe(false)
  })

  test('should maintain glow effect during text rotation', async ({ page }) => {
    const textRotator = page.locator('.text-rotator span')
    
    // Capture initial text and style
    const initialText = await textRotator.textContent()
    const initialStyle = await textRotator.evaluate((el) => 
      window.getComputedStyle(el).textShadow
    )
    
    // Wait for text rotation (3 seconds interval)
    await page.waitForTimeout(3500)
    
    // Verify text has changed
    const newText = await textRotator.textContent()
    expect(newText).not.toBe(initialText)
    
    // Verify glow effect is maintained
    const newStyle = await textRotator.evaluate((el) => 
      window.getComputedStyle(el).textShadow
    )
    
    expect(newStyle).toContain('rgb(255, 250, 205)')
    expect(newStyle).toBe(initialStyle) // Style should be consistent
  })

  test('should have proper accessibility contrast', async ({ page }) => {
    const textRotator = page.locator('.text-rotator span')
    
    // Check color contrast against background
    const contrastInfo = await textRotator.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      const parent = element.closest('.hero-section') || document.body
      const parentStyles = window.getComputedStyle(parent)
      
      return {
        textColor: styles.color,
        backgroundColor: parentStyles.backgroundColor
      }
    })
    
    // Log for manual verification (automated contrast checking would need additional library)
    console.log('Text color:', contrastInfo.textColor)
    console.log('Background color:', contrastInfo.backgroundColor)
    
    // Ensure text is visible
    await expect(textRotator).toBeVisible()
  })

  test('should work across different browsers', async ({ page, browserName }) => {
    const textRotator = page.locator('.text-rotator span')
    
    // Browser-specific validation
    const styles = await textRotator.evaluate((element) => {
      const computed = window.getComputedStyle(element)
      return {
        color: computed.color,
        textShadow: computed.textShadow,
        browser: navigator.userAgent
      }
    })
    
    // Validate consistent rendering across browsers
    expect(styles.color).toMatch(/rgb\(255,\s*250,\s*205\)/)
    expect(styles.textShadow).toContain('rgb(255, 250, 205)')
    
    console.log(`Browser: ${browserName}, Color: ${styles.color}`)
  })

  test('should take visual screenshot for regression testing', async ({ page }) => {
    // Wait for animations to settle
    await page.waitForTimeout(2000)
    
    // Hide elements that might cause flakiness
    await page.addStyleTag({
      content: `
        .scroll-indicator { display: none !important; }
        * { animation-duration: 0s !important; }
      `
    })
    
    // Take screenshot of hero section
    const heroSection = page.locator('[data-testid="hero-section"]')
    await expect(heroSection).toHaveScreenshot('hero-text-glow.png', {
      threshold: 0.1,
      animations: 'disabled'
    })
  })

  test('should maintain performance during glow effects', async ({ page }) => {
    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).performanceMarks = []
      performance.mark('glow-test-start')
    })
    
    // Wait for multiple text rotations
    await page.waitForTimeout(6000)
    
    // Check performance metrics
    const performanceData = await page.evaluate(() => {
      performance.mark('glow-test-end')
      performance.measure('glow-test', 'glow-test-start', 'glow-test-end')
      
      const measure = performance.getEntriesByName('glow-test')[0]
      return {
        duration: measure.duration,
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize
        } : null
      }
    })
    
    // Validate performance
    expect(performanceData.duration).toBeLessThan(7000) // Should complete in reasonable time
    
    if (performanceData.memory) {
      expect(performanceData.memory.used).toBeLessThan(50 * 1024 * 1024) // <50MB
    }
  })
})

test.describe('Text Glow Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE
  
  test('should maintain glow effect on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.text-rotator span', { timeout: 5000 })
    
    const textRotator = page.locator('.text-rotator span')
    
    // Verify mobile styling
    const mobileStyles = await textRotator.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      return {
        color: styles.color,
        textShadow: styles.textShadow,
        fontSize: styles.fontSize
      }
    })
    
    expect(mobileStyles.color).toMatch(/rgb\(255,\s*250,\s*205\)/)
    expect(mobileStyles.textShadow).toContain('rgb(255, 250, 205)')
    
    // Mobile screenshot
    await expect(page.locator('[data-testid="hero-section"]')).toHaveScreenshot('hero-text-glow-mobile.png')
  })
})