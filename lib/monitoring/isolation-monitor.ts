/**
 * Component Isolation Monitor
 * Comprehensive monitoring and observability for component isolation system
 */

import { ComponentIsolator, ComponentState } from '../isolation/component-isolator'
import { ProgressiveLoader, LoadingState } from '../loading/progressive-loader'
import { SecureLoader } from '../security/secure-loader'
import { SystemEventBus } from '../architecture/core-system'
import { PerformanceEngine } from '../performance/performance-engine'

export interface MonitoringMetrics {
  timestamp: Date
  components: {
    total: number
    loaded: number
    loading: number
    failed: number
    cached: number
    memoryUsage: number
    averageLoadTime: number
  }
  sections: {
    total: number
    loaded: number
    loading: number
    preloading: number
    failed: number
    cached: number
  }
  security: {
    violations: number
    blockedLoads: number
    trustedOrigins: number
    criticalViolations: number
  }
  performance: {
    fps: number
    memoryPressure: number
    networkLatency: number
    errorRate: number
  }
  system: {
    uptime: number
    eventCount: number
    activeConnections: number
    resourceUtilization: number
  }
}

export interface Alert {
  id: string
  type: 'performance' | 'security' | 'error' | 'resource' | 'availability'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata: any
}

export interface MonitoringConfig {
  metrics: {
    collectionInterval: number
    retentionHours: number
    batchSize: number
  }
  alerts: {
    enabled: boolean
    thresholds: {
      errorRate: number
      memoryUsage: number
      loadTime: number
      securityViolations: number
    }
    cooldownMinutes: number
  }
  dashboard: {
    enabled: boolean
    refreshInterval: number
    maxDataPoints: number
  }
  logging: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
    destinations: ('console' | 'remote' | 'storage')[]
  }
}

export class IsolationMonitor {
  private static instance: IsolationMonitor
  private componentIsolator: ComponentIsolator
  private progressiveLoader: ProgressiveLoader
  private secureLoader: SecureLoader
  private eventBus: SystemEventBus
  private performanceEngine: PerformanceEngine
  private config: MonitoringConfig
  private metrics: MonitoringMetrics[] = []
  private alerts: Map<string, Alert> = new Map()
  private metricsInterval?: NodeJS.Timeout
  private startTime = Date.now()
  private eventCounters = new Map<string, number>()
  private lastAlerts = new Map<string, number>()

  static getInstance(): IsolationMonitor {
    if (!IsolationMonitor.instance) {
      IsolationMonitor.instance = new IsolationMonitor()
    }
    return IsolationMonitor.instance
  }

  constructor() {
    this.componentIsolator = ComponentIsolator.getInstance()
    this.progressiveLoader = ProgressiveLoader.getInstance()
    this.secureLoader = SecureLoader.getInstance()
    this.eventBus = SystemEventBus.getInstance()
    this.performanceEngine = PerformanceEngine.getInstance()
    this.config = this.getDefaultConfig()
    this.setupEventHandlers()
    this.startMonitoring()
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      metrics: {
        collectionInterval: 5000, // 5 seconds
        retentionHours: 24,
        batchSize: 100
      },
      alerts: {
        enabled: true,
        thresholds: {
          errorRate: 5, // 5% error rate
          memoryUsage: 80, // 80% memory usage
          loadTime: 3000, // 3 seconds load time
          securityViolations: 3 // 3 violations per hour
        },
        cooldownMinutes: 5 // 5 minute cooldown between same alerts
      },
      dashboard: {
        enabled: true,
        refreshInterval: 1000, // 1 second
        maxDataPoints: 300 // 5 minutes at 1 second intervals
      },
      logging: {
        enabled: true,
        level: 'info',
        destinations: ['console']
      }
    }
  }

  private setupEventHandlers(): void {
    // Component events
    this.eventBus.on('isolator:component-registered', () => {
      this.incrementCounter('component-registered')
    })

    this.eventBus.on('isolator:component-loaded', () => {
      this.incrementCounter('component-loaded')
    })

    this.eventBus.on('isolator:component-failed', () => {
      this.incrementCounter('component-failed')
    })

    // Loading events
    this.eventBus.on('loader:section-loaded', () => {
      this.incrementCounter('section-loaded')
    })

    this.eventBus.on('loader:section-failed', () => {
      this.incrementCounter('section-failed')
    })

    // Security events
    this.eventBus.on('security:violation', (data) => {
      this.incrementCounter('security-violation')
      this.handleSecurityViolation(data.data)
    })

    // Performance events
    this.eventBus.on('performance:fps-drop', (data) => {
      this.handlePerformanceAlert('fps-drop', data.data)
    })

    this.eventBus.on('performance:memory-pressure', (data) => {
      this.handlePerformanceAlert('memory-pressure', data.data)
    })

    // Error events
    this.eventBus.on('error-boundary:component-error', (data) => {
      this.incrementCounter('component-error')
      this.handleComponentError(data.data)
    })
  }

  private startMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }

    this.metricsInterval = setInterval(() => {
      this.collectMetrics()
    }, this.config.metrics.collectionInterval)

    // Isolation monitoring started
  }

  private collectMetrics(): void {
    const now = new Date()
    
    // Collect component metrics
    const isolationReport = this.componentIsolator.getIsolationReport()
    const allComponents = this.componentIsolator.getAllComponents()
    const loadingComponents = allComponents.filter(c => c.state.status === 'loading').length
    const failedComponents = allComponents.filter(c => c.state.status === 'error').length
    const cachedComponents = allComponents.filter(c => c.metadata.cache).length

    // Collect loading metrics
    const loadingState = this.progressiveLoader.getLoadingState()
    const loadingReport = this.progressiveLoader.getLoadingReport()

    // Collect security metrics
    const securityReport = this.secureLoader.getSecurityReport()

    // Collect performance metrics
    const performanceReport = this.performanceEngine.getPerformanceReport()

    const metrics: MonitoringMetrics = {
      timestamp: now,
      components: {
        total: isolationReport.totalComponents,
        loaded: isolationReport.loadedComponents,
        loading: loadingComponents,
        failed: isolationReport.erroredComponents,
        cached: cachedComponents,
        memoryUsage: isolationReport.memoryUsage,
        averageLoadTime: isolationReport.averageLoadTime
      },
      sections: {
        total: loadingReport.totalSections,
        loaded: loadingState.loaded.size,
        loading: loadingState.loading.size,
        preloading: loadingState.preloading.size,
        failed: loadingState.failed.size,
        cached: loadingState.cached.size
      },
      security: {
        violations: securityReport.statistics.totalViolations,
        blockedLoads: securityReport.statistics.blockedLoads,
        trustedOrigins: securityReport.trustedOrigins.length,
        criticalViolations: securityReport.violations.filter(v => v.severity === 'critical').length
      },
      performance: {
        fps: performanceReport.currentFPS,
        memoryPressure: performanceReport.memoryUsage,
        networkLatency: this.measureNetworkLatency(),
        errorRate: this.calculateErrorRate()
      },
      system: {
        uptime: Date.now() - this.startTime,
        eventCount: this.getTotalEventCount(),
        activeConnections: this.getActiveConnections(),
        resourceUtilization: this.calculateResourceUtilization()
      }
    }

    this.metrics.push(metrics)
    this.trimMetrics()

    // Check for alert conditions
    if (this.config.alerts.enabled) {
      this.checkAlertConditions(metrics)
    }

    // Emit metrics event
    this.eventBus.emitSystemEvent('monitoring:metrics-collected', metrics)

    this.log('debug', 'Metrics collected', { 
      components: metrics.components.total,
      sections: metrics.sections.total,
      memoryUsage: metrics.components.memoryUsage
    })
  }

  private trimMetrics(): void {
    const maxAge = this.config.metrics.retentionHours * 60 * 60 * 1000
    const cutoff = Date.now() - maxAge
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff)
  }

  private checkAlertConditions(metrics: MonitoringMetrics): void {
    const now = Date.now()
    const cooldown = this.config.alerts.cooldownMinutes * 60 * 1000

    // Check error rate
    if (metrics.performance.errorRate > this.config.alerts.thresholds.errorRate) {
      const alertKey = 'high-error-rate'
      const lastAlert = this.lastAlerts.get(alertKey) || 0
      
      if (now - lastAlert > cooldown) {
        this.createAlert({
          type: 'error',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `Error rate is ${metrics.performance.errorRate.toFixed(2)}%, exceeding threshold of ${this.config.alerts.thresholds.errorRate}%`,
          metadata: { errorRate: metrics.performance.errorRate, threshold: this.config.alerts.thresholds.errorRate }
        })
        this.lastAlerts.set(alertKey, now)
      }
    }

    // Check memory usage
    if (metrics.components.memoryUsage > this.config.alerts.thresholds.memoryUsage) {
      const alertKey = 'high-memory-usage'
      const lastAlert = this.lastAlerts.get(alertKey) || 0
      
      if (now - lastAlert > cooldown) {
        this.createAlert({
          type: 'resource',
          severity: 'medium',
          title: 'High Memory Usage',
          description: `Memory usage is ${metrics.components.memoryUsage.toFixed(2)}MB, exceeding threshold of ${this.config.alerts.thresholds.memoryUsage}MB`,
          metadata: { memoryUsage: metrics.components.memoryUsage, threshold: this.config.alerts.thresholds.memoryUsage }
        })
        this.lastAlerts.set(alertKey, now)
      }
    }

    // Check average load time
    if (metrics.components.averageLoadTime > this.config.alerts.thresholds.loadTime) {
      const alertKey = 'slow-load-time'
      const lastAlert = this.lastAlerts.get(alertKey) || 0
      
      if (now - lastAlert > cooldown) {
        this.createAlert({
          type: 'performance',
          severity: 'medium',
          title: 'Slow Component Load Times',
          description: `Average load time is ${metrics.components.averageLoadTime.toFixed(2)}ms, exceeding threshold of ${this.config.alerts.thresholds.loadTime}ms`,
          metadata: { loadTime: metrics.components.averageLoadTime, threshold: this.config.alerts.thresholds.loadTime }
        })
        this.lastAlerts.set(alertKey, now)
      }
    }

    // Check security violations
    if (metrics.security.criticalViolations > this.config.alerts.thresholds.securityViolations) {
      const alertKey = 'critical-security-violations'
      const lastAlert = this.lastAlerts.get(alertKey) || 0
      
      if (now - lastAlert > cooldown) {
        this.createAlert({
          type: 'security',
          severity: 'critical',
          title: 'Critical Security Violations',
          description: `${metrics.security.criticalViolations} critical security violations detected, exceeding threshold of ${this.config.alerts.thresholds.securityViolations}`,
          metadata: { violations: metrics.security.criticalViolations, threshold: this.config.alerts.thresholds.securityViolations }
        })
        this.lastAlerts.set(alertKey, now)
      }
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    }

    this.alerts.set(alert.id, alert)

    // Emit alert event
    this.eventBus.emitSystemEvent('monitoring:alert-created', alert)

    this.log('warn', `Alert created: ${alert.title}`, alert)

    console.warn(`🚨 Alert: ${alert.title} - ${alert.description}`)
  }

  private handleSecurityViolation(violation: any): void {
    if (violation.severity === 'critical') {
      this.createAlert({
        type: 'security',
        severity: 'critical',
        title: 'Critical Security Violation',
        description: `Critical security violation in component ${violation.componentId}: ${violation.description}`,
        metadata: violation
      })
    }
  }

  private handlePerformanceAlert(type: string, data: any): void {
    this.createAlert({
      type: 'performance',
      severity: type === 'memory-pressure' ? 'high' : 'medium',
      title: `Performance Issue: ${type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      description: `Performance degradation detected: ${JSON.stringify(data)}`,
      metadata: { type, data }
    })
  }

  private handleComponentError(errorData: any): void {
    this.createAlert({
      type: 'error',
      severity: 'medium',
      title: 'Component Error',
      description: `Error in component ${errorData.componentId}: ${errorData.error}`,
      metadata: errorData
    })
  }

  private incrementCounter(event: string): void {
    const count = this.eventCounters.get(event) || 0
    this.eventCounters.set(event, count + 1)
  }

  private measureNetworkLatency(): number {
    // Simplified network latency measurement
    // In production, this would ping a known endpoint
    return Math.random() * 100 + 50 // 50-150ms simulated
  }

  private calculateErrorRate(): number {
    const errorEvents = ['component-failed', 'section-failed', 'component-error']
    const totalEvents = ['component-loaded', 'section-loaded', 'component-registered']
    
    const errors = errorEvents.reduce((sum, event) => sum + (this.eventCounters.get(event) || 0), 0)
    const total = totalEvents.reduce((sum, event) => sum + (this.eventCounters.get(event) || 0), 0)
    
    return total > 0 ? (errors / total) * 100 : 0
  }

  private getTotalEventCount(): number {
    return Array.from(this.eventCounters.values()).reduce((sum, count) => sum + count, 0)
  }

  private getActiveConnections(): number {
    // Simplified - in production, this would track actual connections
    return Math.floor(Math.random() * 10) + 1
  }

  private calculateResourceUtilization(): number {
    const metrics = this.getLatestMetrics()
    if (!metrics) return 0

    // Composite score based on memory, load times, and error rates
    const memoryScore = Math.min(metrics.components.memoryUsage / 100, 1) * 100
    const performanceScore = Math.min(metrics.components.averageLoadTime / 5000, 1) * 100
    const errorScore = Math.min(metrics.performance.errorRate / 10, 1) * 100

    return (memoryScore + performanceScore + errorScore) / 3
  }

  private log(level: string, message: string, data?: any): void {
    if (!this.config.logging.enabled) return

    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 }
    const currentLevel = logLevels[this.config.logging.level]
    const messageLevel = logLevels[level as keyof typeof logLevels]

    if (messageLevel < currentLevel) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      system: 'isolation-monitor'
    }

    if (this.config.logging.destinations.includes('console')) {
      // Console logging disabled in production - use remote logging
    }

    // Additional destinations would be implemented here
  }

  // Public API
  getLatestMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  getMetricsHistory(hours: number = 1): MonitoringMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff)
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values())
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      
      this.eventBus.emitSystemEvent('monitoring:alert-resolved', alert)
      this.log('info', `Alert resolved: ${alert.title}`, { alertId })
      
      return true
    }
    return false
  }

  getDashboardData(): {
    currentMetrics: MonitoringMetrics | null
    recentMetrics: MonitoringMetrics[]
    activeAlerts: Alert[]
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical'
      score: number
      issues: string[]
    }
  } {
    const currentMetrics = this.getLatestMetrics()
    const recentMetrics = this.getMetricsHistory(0.25) // Last 15 minutes
    const activeAlerts = this.getActiveAlerts()

    // Calculate system health
    let healthScore = 100
    const issues: string[] = []

    if (currentMetrics) {
      // Deduct points for various issues
      if (currentMetrics.performance.errorRate > 5) {
        healthScore -= 20
        issues.push('High error rate')
      }
      
      if (currentMetrics.components.memoryUsage > 80) {
        healthScore -= 15
        issues.push('High memory usage')
      }
      
      if (currentMetrics.components.averageLoadTime > 3000) {
        healthScore -= 10
        issues.push('Slow load times')
      }
      
      if (currentMetrics.security.criticalViolations > 0) {
        healthScore -= 25
        issues.push('Critical security violations')
      }
      
      if (currentMetrics.components.failed > 0) {
        healthScore -= currentMetrics.components.failed * 5
        issues.push('Failed components')
      }
    }

    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'

    return {
      currentMetrics,
      recentMetrics,
      activeAlerts,
      systemHealth: {
        status,
        score: Math.max(0, healthScore),
        issues
      }
    }
  }

  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...updates }
    
    // Restart monitoring with new interval if changed
    if (updates.metrics?.collectionInterval) {
      this.startMonitoring()
    }
    
    this.eventBus.emitSystemEvent('monitoring:config-updated', this.config)
    this.log('info', 'Monitoring configuration updated', updates)
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportMetricsCSV()
    }
    
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      alerts: Array.from(this.alerts.values()),
      eventCounters: Object.fromEntries(this.eventCounters)
    }, null, 2)
  }

  private exportMetricsCSV(): string {
    const headers = [
      'timestamp', 'components_total', 'components_loaded', 'components_failed',
      'sections_total', 'sections_loaded', 'memory_usage', 'error_rate', 'load_time'
    ]
    
    const rows = this.metrics.map(m => [
      m.timestamp.toISOString(),
      m.components.total,
      m.components.loaded,
      m.components.failed,
      m.sections.total,
      m.sections.loaded,
      m.components.memoryUsage,
      m.performance.errorRate,
      m.components.averageLoadTime
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  clearHistory(): void {
    this.metrics = []
    this.alerts.clear()
    this.eventCounters.clear()
    this.lastAlerts.clear()
    
    this.log('info', 'Monitoring history cleared')
  }

  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    this.clearHistory()
    // Isolation monitor destroyed
  }
}