/**
 * Playwright Global Teardown
 * Cleanup after all E2E tests are complete
 */

import { FullConfig } from '@playwright/test'
import { promises as fs } from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...')
  
  try {
    // Clean up test artifacts if needed
    const testResultsDir = path.join(process.cwd(), 'test-results')
    
    // Check if test results directory exists
    try {
      await fs.access(testResultsDir)
      console.log('📁 Test results directory exists')
      
      // You could add cleanup logic here if needed
      // For example, archiving old test results or uploading to CI/CD
      
    } catch (error) {
      console.log('📁 No test results directory found (this is normal)')
    }
    
    // Generate performance summary if performance tests were run
    try {
      const perfResults = path.join(testResultsDir, 'performance-summary.json')
      const perfData = {
        timestamp: new Date().toISOString(),
        summary: 'Performance tests completed',
        // Add more performance data here if available
      }
      
      await fs.writeFile(perfResults, JSON.stringify(perfData, null, 2))
      console.log('📊 Performance summary generated')
    } catch (error) {
      // Not critical if this fails
      console.log('📊 Performance summary not generated (this is normal)')
    }
    
    // Log completion
    console.log('✅ Test artifacts processed')
    
    // Clear environment variables
    delete process.env.SETUP_COMPLETE
    
  } catch (error) {
    console.error('❌ Global teardown error:', error)
    // Don't throw - teardown errors shouldn't fail the test suite
  }
  
  console.log('🎉 Playwright global teardown complete!')
}

export default globalTeardown