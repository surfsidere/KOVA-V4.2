/**
 * System Orchestrator
 * Central coordination of all system components
 */

import { SystemCore, SystemEventBus, DIContainer } from './architecture/core-system'
import { SecurityManager } from './security/security-manager'
import { PerformanceEngine } from './performance/performance-engine'
import { AccessibilityEngine } from './accessibility/accessibility-engine'
import { TestRunner } from './testing/test-framework'

export interface SystemHealth {
  overall: 'excellent' | 'good' | 'warning' | 'critical'
  components: {
    core: ComponentHealth
    security: ComponentHealth
    performance: ComponentHealth
    accessibility: ComponentHealth
    testing: ComponentHealth
  }
  metrics: {
    uptime: number
    responseTime: number
    errorRate: number
    userSatisfaction: number
  }
  recommendations: string[]
}

export interface ComponentHealth {
  status: 'operational' | 'degraded' | 'failed'
  score: number // 0-100
  issues: string[]
  lastCheck: Date
}

export class SystemOrchestrator {
  private static instance: SystemOrchestrator
  private systemCore: SystemCore
  private securityManager: SecurityManager
  private performanceEngine: PerformanceEngine
  private accessibilityEngine: AccessibilityEngine
  private testRunner: TestRunner
  private isInitialized = false

  static getInstance(): SystemOrchestrator {
    if (!SystemOrchestrator.instance) {
      SystemOrchestrator.instance = new SystemOrchestrator()
    }
    return SystemOrchestrator.instance
  }

  constructor() {
    this.systemCore = SystemCore.getInstance()
    this.securityManager = SecurityManager.getInstance()
    this.performanceEngine = PerformanceEngine.getInstance()
    this.accessibilityEngine = AccessibilityEngine.getInstance()
    this.testRunner = TestRunner.getInstance()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    console.log('🚀 Initializing KOVA-V4.2 System Orchestrator...')

    try {
      // Initialize core system
      await this.systemCore.initialize({
        environment: process.env.NODE_ENV as any || 'development',
        performance: {
          maxConcurrentAnimations: 25,
          memoryThreshold: 100,
          fpsTarget: 60
        },
        security: {
          enableCSP: true,
          enableCORS: true,
          rateLimit: 1000
        },
        features: {
          debug: process.env.NODE_ENV === 'development',
          analytics: process.env.NODE_ENV === 'production',
          testing: true,
          accessibility: true,
          performance: true
        }
      })

      // Setup system monitoring
      this.setupSystemMonitoring()

      // Register system services
      this.registerServices()

      // Start health monitoring
      this.startHealthMonitoring()

      this.isInitialized = true
      console.log('✅ System Orchestrator initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize System Orchestrator:', error)
      throw error
    }
  }

  private setupSystemMonitoring(): void {
    const eventBus = SystemEventBus.getInstance()

    // Monitor system events
    eventBus.on('system:ready', () => {
      console.log('🎯 System ready for operations')
    })

    eventBus.on('performance:metric', (data) => {
      if (data.data.exceeded) {
        console.warn(`⚠️ Performance threshold exceeded: ${data.data.metric} = ${data.data.value}`)
      }
    })

    eventBus.on('security:violation', (data) => {
      console.error(`🚨 Security violation: ${data.data.event}`, data.data.data)
    })

    eventBus.on('component:error', (data) => {
      console.error(`💥 Component error: ${data.data.component}`, data.data.error)
    })
  }

  private registerServices(): void {
    const container = DIContainer.getInstance()

    // Register core services
    container.register('SystemCore', () => this.systemCore)
    container.register('SecurityManager', () => this.securityManager)
    container.register('PerformanceEngine', () => this.performanceEngine)
    container.register('AccessibilityEngine', () => this.accessibilityEngine)
    container.register('TestRunner', () => this.testRunner)

    // Register utility services
    container.register('EventBus', () => SystemEventBus.getInstance())
    container.register('Logger', () => this.createLogger())
  }

  private createLogger() {
    return {
      info: (message: string, data?: any) => {
        console.log(`ℹ️ ${message}`, data || '')
      },
      warn: (message: string, data?: any) => {
        console.warn(`⚠️ ${message}`, data || '')
      },
      error: (message: string, error?: any) => {
        console.error(`❌ ${message}`, error || '')
      },
      debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`🐛 ${message}`, data || '')
        }
      }
    }
  }

  private startHealthMonitoring(): void {
    // Check system health every 30 seconds
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('Health check failed:', error)
      })
    }, 30000)

    // Initial health check
    setTimeout(() => {
      this.performHealthCheck()
    }, 5000)
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const health: SystemHealth = {
      overall: 'excellent',
      components: {
        core: await this.checkCoreHealth(),
        security: await this.checkSecurityHealth(),
        performance: await this.checkPerformanceHealth(),
        accessibility: await this.checkAccessibilityHealth(),
        testing: await this.checkTestingHealth()
      },
      metrics: {
        uptime: this.getUptime(),
        responseTime: await this.measureResponseTime(),
        errorRate: this.calculateErrorRate(),
        userSatisfaction: this.calculateUserSatisfaction()
      },
      recommendations: []
    }

    // Calculate overall health
    const componentScores = Object.values(health.components).map(c => c.score)
    const averageScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length

    if (averageScore >= 90) {
      health.overall = 'excellent'
    } else if (averageScore >= 75) {
      health.overall = 'good'
    } else if (averageScore >= 50) {
      health.overall = 'warning'
    } else {
      health.overall = 'critical'
    }

    // Generate recommendations
    health.recommendations = this.generateRecommendations(health)

    // Log health status
    this.logHealthStatus(health)

    return health
  }

  private async checkCoreHealth(): Promise<ComponentHealth> {
    const issues: string[] = []
    let score = 100

    try {
      // Check if system is initialized
      if (!this.systemCore.isInitialized()) {
        issues.push('System core not initialized')
        score -= 50
      }

      // Check configuration
      const config = this.systemCore.getConfig()
      if (!config.features.testing) {
        issues.push('Testing features disabled')
        score -= 10
      }

      return {
        status: score >= 50 ? 'operational' : 'failed',
        score,
        issues,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'failed',
        score: 0,
        issues: [`Core system error: ${error.message}`],
        lastCheck: new Date()
      }
    }
  }

  private async checkSecurityHealth(): Promise<ComponentHealth> {
    const issues: string[] = []
    let score = 100

    try {
      const config = this.securityManager.getConfig()
      
      // Check CSP
      if (!config.csp.enabled) {
        issues.push('Content Security Policy disabled')
        score -= 20
      }

      // Check CORS
      if (!config.cors.enabled) {
        issues.push('CORS protection disabled')
        score -= 15
      }

      // Check rate limiting
      if (!config.rateLimit.enabled) {
        issues.push('Rate limiting disabled')
        score -= 15
      }

      // Check security metrics
      const metrics = this.securityManager.getSecurityMetrics()
      if (metrics.totalViolations > 100) {
        issues.push('High number of security violations')
        score -= 20
      }

      return {
        status: score >= 50 ? 'operational' : 'degraded',
        score,
        issues,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'failed',
        score: 0,
        issues: [`Security system error: ${error.message}`],
        lastCheck: new Date()
      }
    }
  }

  private async checkPerformanceHealth(): Promise<ComponentHealth> {
    const issues: string[] = []
    let score = 100

    try {
      const metrics = this.performanceEngine.getMetrics()
      
      // Check FPS
      if (metrics.fps < 55) {
        issues.push(`Low FPS: ${metrics.fps}`)
        score -= 20
      }

      // Check memory usage
      if (metrics.memoryUsage > 100) {
        issues.push(`High memory usage: ${metrics.memoryUsage}MB`)
        score -= 25
      }

      // Check render time
      if (metrics.renderTime > 16.67) {
        issues.push(`Slow render time: ${metrics.renderTime}ms`)
        score -= 15
      }

      return {
        status: score >= 50 ? 'operational' : 'degraded',
        score,
        issues,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'failed',
        score: 0,
        issues: [`Performance system error: ${error.message}`],
        lastCheck: new Date()
      }
    }
  }

  private async checkAccessibilityHealth(): Promise<ComponentHealth> {
    const issues: string[] = []
    let score = 100

    try {
      // Check if accessibility engine is running
      const config = this.accessibilityEngine.getConfig()
      
      if (!config.keyboardNavigation) {
        issues.push('Keyboard navigation disabled')
        score -= 20
      }

      if (!config.announcements) {
        issues.push('Screen reader announcements disabled')
        score -= 15
      }

      if (config.level !== 'AA' && config.level !== 'AAA') {
        issues.push('WCAG compliance level too low')
        score -= 25
      }

      return {
        status: score >= 50 ? 'operational' : 'degraded',
        score,
        issues,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'failed',
        score: 0,
        issues: [`Accessibility system error: ${error.message}`],
        lastCheck: new Date()
      }
    }
  }

  private async checkTestingHealth(): Promise<ComponentHealth> {
    const issues: string[] = []
    const score = 100

    try {
      // For now, assume testing is healthy if no crashes
      // In a real implementation, this would check test results
      
      return {
        status: 'operational',
        score,
        issues,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'failed',
        score: 0,
        issues: [`Testing system error: ${error.message}`],
        lastCheck: new Date()
      }
    }
  }

  private getUptime(): number {
    if (typeof process !== 'undefined') {
      return process.uptime()
    }
    return 0
  }

  private async measureResponseTime(): Promise<number> {
    const start = Date.now()
    // Simulate a simple operation
    await new Promise(resolve => setTimeout(resolve, 1))
    return Date.now() - start
  }

  private calculateErrorRate(): number {
    // In a real implementation, this would track actual errors
    return 0.1 // 0.1% error rate
  }

  private calculateUserSatisfaction(): number {
    // In a real implementation, this would be based on user feedback
    return 85 // 85% satisfaction
  }

  private generateRecommendations(health: SystemHealth): string[] {
    const recommendations: string[] = []

    if (health.overall === 'critical') {
      recommendations.push('🚨 System requires immediate attention')
    }

    // Component-specific recommendations
    Object.entries(health.components).forEach(([component, componentHealth]) => {
      if (componentHealth.status === 'failed') {
        recommendations.push(`🔧 Fix critical issues in ${component}`)
      } else if (componentHealth.status === 'degraded') {
        recommendations.push(`⚠️ Optimize ${component} performance`)
      }
    })

    // Metric-based recommendations
    if (health.metrics.responseTime > 100) {
      recommendations.push('⚡ Improve system response time')
    }

    if (health.metrics.errorRate > 1) {
      recommendations.push('🐛 Reduce system error rate')
    }

    if (health.metrics.userSatisfaction < 80) {
      recommendations.push('😊 Focus on user experience improvements')
    }

    return recommendations
  }

  private logHealthStatus(health: SystemHealth): void {
    const emoji = {
      excellent: '🟢',
      good: '🟡',
      warning: '🟠',
      critical: '🔴'
    }

    console.log(`${emoji[health.overall]} System Health: ${health.overall.toUpperCase()}`)
    
    if (health.recommendations.length > 0) {
      console.log('📋 Recommendations:')
      health.recommendations.forEach(rec => console.log(`  ${rec}`))
    }
  }

  // Public API
  async getSystemHealth(): Promise<SystemHealth> {
    return this.performHealthCheck()
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down System Orchestrator...')
    
    this.performanceEngine.destroy()
    this.accessibilityEngine.destroy()
    await this.systemCore.shutdown()
    
    this.isInitialized = false
    console.log('✅ System Orchestrator shutdown complete')
  }

  isSystemHealthy(): boolean {
    return this.isInitialized && this.systemCore.isInitialized()
  }
}

// Export singleton instance
export const systemOrchestrator = SystemOrchestrator.getInstance()

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  systemOrchestrator.initialize().catch(error => {
    console.error('Failed to auto-initialize system:', error)
  })
}