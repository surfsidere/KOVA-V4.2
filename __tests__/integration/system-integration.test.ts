/**
 * System Integration Tests
 * End-to-end validation of core systems
 */

import { TestCase, Assert, TestSuiteBuilder, IntegrationTestHelper } from '../../lib/testing/test-framework'
import { SystemCore } from '../../lib/architecture/core-system'
import { SecurityManager } from '../../lib/security/security-manager'
import { PerformanceEngine } from '../../lib/performance/performance-engine'

class SystemInitializationTest extends TestCase {
  constructor() {
    super('System Core initializes successfully', 'integration')
  }

  async setup(): Promise<void> {
    await IntegrationTestHelper.setupTestEnvironment()
  }

  async execute(): Promise<void> {
    const system = SystemCore.getInstance()
    
    Assert.isDefined(system, 'System core should be initialized')
    Assert.isTrue(system.isInitialized(), 'System should be initialized')
    
    const config = system.getConfig()
    Assert.equals(config.environment, 'test', 'Should be in test environment')
    Assert.isTrue(config.features.testing, 'Testing features should be enabled')
  }

  async teardown(): Promise<void> {
    await IntegrationTestHelper.teardownTestEnvironment()
  }
}

class SecurityManagerIntegrationTest extends TestCase {
  constructor() {
    super('Security Manager integrates with system', 'integration')
  }

  async execute(): Promise<void> {
    const security = SecurityManager.getInstance()
    
    // Test CSP header generation
    const cspHeader = security.generateCSPHeader()
    Assert.isTrue(cspHeader.includes("default-src 'self'"), 'CSP should include default-src')
    
    // Test input validation
    const validation = security.validateInput('test@example.com', {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 50
    })
    Assert.isTrue(validation.isValid, 'Valid email should pass validation')
    
    // Test threat detection
    const threat = security.detectThreat('<script>alert("xss")</script>')
    Assert.isTrue(threat.isThreat, 'XSS attempt should be detected as threat')
    Assert.equals(threat.threatType, 'XSS', 'Should identify as XSS threat')
  }
}

class PerformanceEngineIntegrationTest extends TestCase {
  constructor() {
    super('Performance Engine monitors system health', 'integration')
  }

  async execute(): Promise<void> {
    const performance = PerformanceEngine.getInstance()
    
    // Test metrics collection
    const metrics = performance.getMetrics()
    Assert.isDefined(metrics.fps, 'FPS should be tracked')
    Assert.isDefined(metrics.memoryUsage, 'Memory usage should be tracked')
    Assert.isDefined(metrics.timestamp, 'Metrics should have timestamp')
    
    // Test caching system
    performance.setCache('test-key', { data: 'test-value' })
    const cached = performance.getCache('test-key')
    Assert.deepEquals(cached, { data: 'test-value' }, 'Cache should store and retrieve data')
    
    // Test performance measurement
    performance.startMeasure('test-operation')
    await new Promise(resolve => setTimeout(resolve, 10))
    const duration = performance.endMeasure('test-operation')
    Assert.isTrue(duration !== null && duration >= 10, 'Should measure operation duration')
  }
}

class CrossSystemIntegrationTest extends TestCase {
  constructor() {
    super('Systems communicate through event bus', 'integration')
  }

  async execute(): Promise<void> {
    let eventReceived = false
    let eventData: any = null
    
    // Subscribe to system events
    const { SystemEventBus } = await import('../../lib/architecture/core-system')
    const eventBus = SystemEventBus.getInstance()
    
    eventBus.once('test-event', (data) => {
      eventReceived = true
      eventData = data
    })
    
    // Emit test event
    eventBus.emitSystemEvent('test-event', { message: 'integration-test' })
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 50))
    
    Assert.isTrue(eventReceived, 'Event should be received')
    Assert.equals(eventData.data.message, 'integration-test', 'Event data should be preserved')
  }
}

// Run integration test suite
export async function runIntegrationTests(): Promise<void> {
  const results = await new TestSuiteBuilder()
    .addTest(new SystemInitializationTest())
    .addTest(new SecurityManagerIntegrationTest())
    .addTest(new PerformanceEngineIntegrationTest())
    .addTest(new CrossSystemIntegrationTest())
    .withTimeout(10000)
    .withRetries(2)
    .parallel(true)
    .run()
  
  const failed = results.filter(r => r.status === 'failed')
  if (failed.length > 0) {
    console.error('❌ Integration tests failed:', failed)
    throw new Error(`${failed.length} integration tests failed`)
  }
  
  console.log('✅ All integration tests passed!')
}