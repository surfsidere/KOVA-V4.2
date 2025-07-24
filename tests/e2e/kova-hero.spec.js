// Traction Labs Design - KOVA V4 E2E Tests
// Testing the hero section and ethereal depth components

const { test, expect } = require('@playwright/test');

test.describe('KOVA V4 - Ethereal Depth Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the KOVA V4 application
    await page.goto('/');
  });

  test('should load the hero section with changing text', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main title is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for the Spanish title prefix
    await expect(page.locator('text=La nueva generación de beneficios:')).toBeVisible();
    
    // Check that dynamic words are present (any one of the rotating words)
    const dynamicWords = ['relevantes.', 'digitales.', 'personalizados.'];
    let foundWord = false;
    
    for (const word of dynamicWords) {
      const wordElement = page.locator(`text=${word}`);
      if (await wordElement.isVisible()) {
        foundWord = true;
        break;
      }
    }
    
    expect(foundWord).toBe(true);
  });

  test('should have text glow effect on changing words', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find any of the dynamic words and check for glow styles
    const dynamicTextElement = page.locator('[style*="text-shadow"]').first();
    await expect(dynamicTextElement).toBeVisible();
    
    // Check that the element has glow effect styles
    const styles = await dynamicTextElement.getAttribute('style');
    expect(styles).toContain('text-shadow');
  });

  test('should display introduction text', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for the introduction paragraph
    const introText = 'El futuro de la lealtad es la personalización';
    await expect(page.locator(`text=${introText}`)).toBeVisible();
  });

  test('should have ethereal background elements', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page has the dark ethereal background
    const backgroundElement = page.locator('[style*="background"]').first();
    await expect(backgroundElement).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the hero section is still visible and properly sized
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    
    // Check that text is readable on mobile
    const mainTitle = page.locator('h1');
    await expect(mainTitle).toBeVisible();
  });

  test('should have scroll indicator', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for scroll indicator text
    await expect(page.locator('text=Desplázate para explorar')).toBeVisible();
  });
});