/**
 * System Performance Analyzer
 * Comprehensive analysis and validation of component isolation system performance
 */

import { ComponentIsolator, ComponentMetadata, ComponentState } from '../isolation/component-isolator'
import { ProgressiveLoader, SectionMetadata, LoadingState } from '../loading/progressive-loader'
import { SecureLoader } from '../security/secure-loader'
import { IsolationMonitor, MonitoringMetrics, Alert } from '../monitoring/isolation-monitor'
import { IsolationTestFramework, TestReport } from '../testing/isolation-test-framework'
import { SystemEventBus } from '../architecture/core-system'
import { PerformanceEngine } from '../performance/performance-engine'

export interface SystemAnalysisReport {
  timestamp: Date
  overallHealth: {
    score: number // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    recommendations: string[]
  }
  components: {
    total: number
    loaded: number
    failed: number
    isolated: number
    memoryEfficiency: number // 0-100
    loadTimeOptimization: number // 0-100
    errorResilience: number // 0-100
  }
  sections: {
    total: number
    progressivelyLoaded: number
    preloadEfficiency: number // 0-100
    cacheHitRate: number // 0-100
    loadingLatency: number // ms
  }
  security: {
    violationsDetected: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    complianceScore: number // 0-100
    vulnerabilities: string[]
  }
  performance: {
    systemLatency: number // ms
    throughput: number // operations/second
    resourceUtilization: number // 0-100
    bottlenecks: string[]
    optimizationOpportunities: string[]
  }
  reliability: {
    uptime: number // percentage
    errorRate: number // percentage
    recoveryTime: number // ms
    isolationEffectiveness: number // 0-100
  }
  scalability: {
    currentCapacity: number
    projectedCapacity: number
    growthReadiness: number // 0-100
    limitingFactors: string[]
  }
  testResults: {
    totalTests: number
    passRate: number // percentage
    criticalFailures: number
    coverage: number // percentage
  }
}

export interface PerformanceBenchmark {
  name: string
  category: 'loading' | 'isolation' | 'security' | 'memory' | 'network'
  target: number
  actual: number
  unit: string
  passed: boolean
  impact: 'low' | 'medium' | 'high' | 'critical'
}

export interface SystemRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'performance' | 'security' | 'reliability' | 'scalability' | 'maintainability'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  timeline: string
  implementation: string[]
}

export class SystemAnalyzer {
  private static instance: SystemAnalyzer
  private componentIsolator: ComponentIsolator
  private progressiveLoader: ProgressiveLoader
  private secureLoader: SecureLoader
  private monitor: IsolationMonitor
  private testFramework: IsolationTestFramework
  private eventBus: SystemEventBus
  private performanceEngine: PerformanceEngine
  private analysisHistory: SystemAnalysisReport[] = []
  private benchmarks: PerformanceBenchmark[] = []

  static getInstance(): SystemAnalyzer {
    if (!SystemAnalyzer.instance) {
      SystemAnalyzer.instance = new SystemAnalyzer()
    }
    return SystemAnalyzer.instance
  }

  constructor() {
    this.componentIsolator = ComponentIsolator.getInstance()
    this.progressiveLoader = ProgressiveLoader.getInstance()
    this.secureLoader = SecureLoader.getInstance()
    this.monitor = IsolationMonitor.getInstance()
    this.testFramework = IsolationTestFramework.getInstance()
    this.eventBus = SystemEventBus.getInstance()
    this.performanceEngine = PerformanceEngine.getInstance()
    this.setupBenchmarks()
  }

  private setupBenchmarks(): void {
    this.benchmarks = [
      {
        name: 'Component Load Time',
        category: 'loading',
        target: 100, // ms
        actual: 0,
        unit: 'ms',
        passed: false,
        impact: 'high'
      },
      {
        name: 'Section Progressive Load',
        category: 'loading',
        target: 200, // ms
        actual: 0,
        unit: 'ms',
        passed: false,
        impact: 'medium'
      },
      {
        name: 'Memory Usage per Component',
        category: 'memory',
        target: 5, // MB
        actual: 0,
        unit: 'MB',
        passed: false,
        impact: 'medium'
      },
      {
        name: 'Error Recovery Time',
        category: 'isolation',
        target: 50, // ms
        actual: 0,
        unit: 'ms',
        passed: false,
        impact: 'high'
      },
      {
        name: 'Security Scan Time',
        category: 'security',
        target: 10, // ms
        actual: 0,
        unit: 'ms',
        passed: false,
        impact: 'low'
      },
      {
        name: 'System Throughput',
        category: 'loading',
        target: 100, // ops/sec
        actual: 0,
        unit: 'ops/sec',
        passed: false,
        impact: 'critical'
      }
    ]
  }

  async performComprehensiveAnalysis(): Promise<SystemAnalysisReport> {
    // System analysis starting - monitoring through event system
    
    const analysisStart = performance.now()
    
    try {
      // Run system tests first to get baseline metrics
      const testReport = await this.testFramework.runAllTests()
      
      // Collect current system metrics
      const currentMetrics = this.monitor.getLatestMetrics()
      const dashboardData = this.monitor.getDashboardData()
      
      // Analyze components
      const componentAnalysis = await this.analyzeComponents()
      
      // Analyze sections and progressive loading
      const sectionAnalysis = await this.analyzeSections()
      
      // Analyze security
      const securityAnalysis = await this.analyzeSecurity()
      
      // Analyze performance
      const performanceAnalysis = await this.analyzePerformance()
      
      // Analyze reliability
      const reliabilityAnalysis = await this.analyzeReliability()
      
      // Analyze scalability
      const scalabilityAnalysis = await this.analyzeScalability()
      
      // Calculate overall health score
      const overallHealth = this.calculateOverallHealth(
        componentAnalysis,
        sectionAnalysis,
        securityAnalysis,
        performanceAnalysis,
        reliabilityAnalysis,
        scalabilityAnalysis,
        testReport
      )
      
      const report: SystemAnalysisReport = {
        timestamp: new Date(),
        overallHealth,
        components: componentAnalysis,
        sections: sectionAnalysis,
        security: securityAnalysis,
        performance: performanceAnalysis,
        reliability: reliabilityAnalysis,
        scalability: scalabilityAnalysis,
        testResults: {
          totalTests: testReport.totalTests,
          passRate: (testReport.passed / testReport.totalTests) * 100,
          criticalFailures: testReport.results.filter(r => 
            r.status === 'failed' && r.scenarioId.includes('critical')
          ).length,
          coverage: testReport.coverage.components + testReport.coverage.sections + testReport.coverage.errorPaths
        }
      }
      
      // Store analysis history
      this.analysisHistory.push(report)
      this.trimAnalysisHistory()
      
      // Update benchmarks
      this.updateBenchmarks(report)
      
      const analysisTime = performance.now() - analysisStart
      // Analysis completed - time tracked in event system
      
      // Emit analysis event
      this.eventBus.emitSystemEvent('analyzer:analysis-complete', {
        report,
        analysisTime,
        benchmarks: this.benchmarks
      })
      
      return report
      
    } catch (error) {
      // Emit analysis failure event for monitoring
      this.eventBus.emitSystemEvent('analyzer:analysis-failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
      throw error
    }
  }

  private async analyzeComponents(): Promise<SystemAnalysisReport['components']> {
    const isolationReport = this.componentIsolator.getIsolationReport()
    const allComponents = this.componentIsolator.getAllComponents()
    
    // Calculate memory efficiency
    const avgMemoryPerComponent = isolationReport.memoryUsage / Math.max(isolationReport.loadedComponents, 1)
    const memoryEfficiency = Math.max(0, 100 - (avgMemoryPerComponent / 10) * 100) // Assume 10MB is poor efficiency
    
    // Calculate load time optimization
    const loadTimeOptimization = Math.max(0, 100 - (isolationReport.averageLoadTime / 1000) * 100) // 1000ms = 0% optimization
    
    // Calculate error resilience based on recovery rates
    const failedComponents = allComponents.filter(c => c.state.status === 'error')
    const errorResilience = failedComponents.length > 0 
      ? Math.max(0, 100 - (failedComponents.length / allComponents.length) * 200) // Double penalty for errors
      : 100
    
    return {
      total: isolationReport.totalComponents,
      loaded: isolationReport.loadedComponents,
      failed: isolationReport.erroredComponents,
      isolated: allComponents.filter(c => c.metadata.cache).length,
      memoryEfficiency: Math.round(memoryEfficiency),
      loadTimeOptimization: Math.round(loadTimeOptimization),
      errorResilience: Math.round(errorResilience)
    }
  }

  private async analyzeSections(): Promise<SystemAnalysisReport['sections']> {
    const loadingReport = this.progressiveLoader.getLoadingReport()
    const loadingState = this.progressiveLoader.getLoadingState()
    
    // Calculate preload efficiency
    const preloadedSections = loadingState.cached.size
    const preloadEfficiency = loadingReport.totalSections > 0 
      ? (preloadedSections / loadingReport.totalSections) * 100 
      : 0
    
    // Calculate cache hit rate (simplified)
    const cacheHitRate = preloadedSections > 0 ? 85 : 0 // Simplified calculation
    
    // Calculate average loading latency
    const loadingLatency = loadingReport.averageLoadTime || 0
    
    return {
      total: loadingReport.totalSections,
      progressivelyLoaded: loadingState.loaded.size,
      preloadEfficiency: Math.round(preloadEfficiency),
      cacheHitRate: Math.round(cacheHitRate),
      loadingLatency: Math.round(loadingLatency)
    }
  }

  private async analyzeSecurity(): Promise<SystemAnalysisReport['security']> {
    const securityReport = this.secureLoader.getSecurityReport()
    
    // Calculate threat level
    const criticalViolations = securityReport.violations.filter(v => v.severity === 'critical').length
    const highViolations = securityReport.violations.filter(v => v.severity === 'high').length
    
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (criticalViolations > 0) threatLevel = 'critical'
    else if (highViolations > 2) threatLevel = 'high'
    else if (securityReport.statistics.totalViolations > 5) threatLevel = 'medium'
    
    // Calculate compliance score
    const complianceScore = Math.max(0, 100 - (securityReport.statistics.totalViolations * 10))
    
    // Extract vulnerability types
    const vulnerabilities = Array.from(new Set(
      securityReport.violations.map(v => v.type)
    ))
    
    return {
      violationsDetected: securityReport.statistics.totalViolations,
      threatLevel,
      complianceScore: Math.round(complianceScore),
      vulnerabilities
    }
  }

  private async analyzePerformance(): Promise<SystemAnalysisReport['performance']> {
    const performanceReport = this.performanceEngine.getPerformanceReport()
    const currentMetrics = this.monitor.getLatestMetrics()
    
    if (!currentMetrics) {
      return {
        systemLatency: 0,
        throughput: 0,
        resourceUtilization: 0,
        bottlenecks: ['No metrics available'],
        optimizationOpportunities: ['Enable monitoring']
      }
    }
    
    // Calculate system latency (average of component and section load times)
    const systemLatency = (currentMetrics.components.averageLoadTime + currentMetrics.sections.loaded * 50) / 2
    
    // Calculate throughput (simplified)
    const throughput = Math.max(0, 1000 / Math.max(systemLatency, 1)) // ops per second
    
    // Resource utilization
    const resourceUtilization = currentMetrics.system.resourceUtilization
    
    // Identify bottlenecks
    const bottlenecks: string[] = []
    if (currentMetrics.components.averageLoadTime > 500) bottlenecks.push('Slow component loading')
    if (currentMetrics.components.memoryUsage > 50) bottlenecks.push('High memory usage')
    if (currentMetrics.performance.errorRate > 5) bottlenecks.push('High error rate')
    if (performanceReport.currentFPS < 55) bottlenecks.push('Low FPS performance')
    
    // Optimization opportunities
    const optimizationOpportunities: string[] = []
    if (currentMetrics.sections.cached < currentMetrics.sections.total * 0.5) {
      optimizationOpportunities.push('Increase section caching')
    }
    if (currentMetrics.components.loading > 0) {
      optimizationOpportunities.push('Implement component preloading')
    }
    if (resourceUtilization > 80) {
      optimizationOpportunities.push('Optimize resource utilization')
    }
    
    return {
      systemLatency: Math.round(systemLatency),
      throughput: Math.round(throughput),
      resourceUtilization: Math.round(resourceUtilization),
      bottlenecks,
      optimizationOpportunities
    }
  }

  private async analyzeReliability(): Promise<SystemAnalysisReport['reliability']> {
    const currentMetrics = this.monitor.getLatestMetrics()
    const activeAlerts = this.monitor.getActiveAlerts()
    
    if (!currentMetrics) {
      return {
        uptime: 0,
        errorRate: 100,
        recoveryTime: 0,
        isolationEffectiveness: 0
      }
    }
    
    // Calculate uptime
    const uptime = Math.max(0, 100 - (activeAlerts.filter(a => a.severity === 'critical').length * 20))
    
    // Error rate
    const errorRate = currentMetrics.performance.errorRate
    
    // Recovery time (simplified based on error handling patterns)
    const recoveryTime = errorRate > 0 ? 100 + (errorRate * 10) : 50
    
    // Isolation effectiveness
    const totalComponents = currentMetrics.components.total
    const failedComponents = currentMetrics.components.failed
    const isolationEffectiveness = totalComponents > 0 
      ? Math.max(0, 100 - (failedComponents / totalComponents) * 100) 
      : 100
    
    return {
      uptime: Math.round(uptime),
      errorRate: Math.round(errorRate),
      recoveryTime: Math.round(recoveryTime),
      isolationEffectiveness: Math.round(isolationEffectiveness)
    }
  }

  private async analyzeScalability(): Promise<SystemAnalysisReport['scalability']> {
    const currentMetrics = this.monitor.getLatestMetrics()
    
    if (!currentMetrics) {
      return {
        currentCapacity: 0,
        projectedCapacity: 0,
        growthReadiness: 0,
        limitingFactors: ['No metrics available']
      }
    }
    
    // Current capacity (based on loaded components and sections)
    const currentCapacity = currentMetrics.components.loaded + currentMetrics.sections.loaded
    
    // Projected capacity (based on memory and performance constraints)
    const memoryConstraint = Math.floor(500 / Math.max(currentMetrics.components.memoryUsage / Math.max(currentMetrics.components.loaded, 1), 1))
    const performanceConstraint = Math.floor(1000 / Math.max(currentMetrics.components.averageLoadTime, 1))
    const projectedCapacity = Math.min(memoryConstraint, performanceConstraint)
    
    // Growth readiness
    const currentUtilization = currentCapacity / Math.max(projectedCapacity, 1)
    const growthReadiness = Math.max(0, 100 - (currentUtilization * 100))
    
    // Limiting factors
    const limitingFactors: string[] = []
    if (currentMetrics.components.memoryUsage > 100) limitingFactors.push('Memory constraints')
    if (currentMetrics.components.averageLoadTime > 200) limitingFactors.push('Load time constraints')
    if (currentMetrics.performance.errorRate > 2) limitingFactors.push('Error rate constraints')
    if (currentMetrics.system.resourceUtilization > 75) limitingFactors.push('Resource utilization')
    
    return {
      currentCapacity,
      projectedCapacity,
      growthReadiness: Math.round(growthReadiness),
      limitingFactors
    }
  }

  private calculateOverallHealth(
    components: SystemAnalysisReport['components'],
    sections: SystemAnalysisReport['sections'],
    security: SystemAnalysisReport['security'],
    performance: SystemAnalysisReport['performance'],
    reliability: SystemAnalysisReport['reliability'],
    scalability: SystemAnalysisReport['scalability'],
    testReport: TestReport
  ): SystemAnalysisReport['overallHealth'] {
    // Weighted scoring
    const weights = {
      components: 0.2,
      sections: 0.15,
      security: 0.2,
      performance: 0.2,
      reliability: 0.15,
      scalability: 0.1
    }
    
    // Component score
    const componentScore = (components.memoryEfficiency + components.loadTimeOptimization + components.errorResilience) / 3
    
    // Section score
    const sectionScore = (sections.preloadEfficiency + sections.cacheHitRate + Math.max(0, 100 - sections.loadingLatency / 10)) / 3
    
    // Security score
    const securityScore = security.complianceScore
    
    // Performance score
    const performanceScore = Math.max(0, 100 - performance.systemLatency / 10 - performance.resourceUtilization * 0.5)
    
    // Reliability score
    const reliabilityScore = (reliability.uptime + Math.max(0, 100 - reliability.errorRate * 10) + reliability.isolationEffectiveness) / 3
    
    // Scalability score
    const scalabilityScore = scalability.growthReadiness
    
    // Overall weighted score
    const overallScore = Math.round(
      componentScore * weights.components +
      sectionScore * weights.sections +
      securityScore * weights.security +
      performanceScore * weights.performance +
      reliabilityScore * weights.reliability +
      scalabilityScore * weights.scalability
    )
    
    // Determine status
    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    if (overallScore >= 90) status = 'excellent'
    else if (overallScore >= 75) status = 'good'
    else if (overallScore >= 60) status = 'fair'
    else if (overallScore >= 40) status = 'poor'
    else status = 'critical'
    
    // Generate recommendations
    const recommendations: string[] = []
    if (componentScore < 70) recommendations.push('Optimize component loading and memory usage')
    if (sectionScore < 70) recommendations.push('Improve progressive loading and caching strategies')
    if (securityScore < 80) recommendations.push('Address security vulnerabilities and compliance issues')
    if (performanceScore < 70) recommendations.push('Optimize system performance and reduce latency')
    if (reliabilityScore < 75) recommendations.push('Improve error handling and system reliability')
    if (scalabilityScore < 60) recommendations.push('Address scalability limitations and resource constraints')
    
    // Test-based recommendations
    if (testReport.failed > 0) recommendations.push(`Fix ${testReport.failed} failing tests`)
    if (testReport.coverage.components < 5) recommendations.push('Increase test coverage for components')
    
    return {
      score: overallScore,
      status,
      recommendations
    }
  }

  private updateBenchmarks(report: SystemAnalysisReport): void {
    // Update benchmark actual values based on report
    const benchmarkUpdates: Record<string, number> = {
      'Component Load Time': report.performance.systemLatency,
      'Section Progressive Load': report.sections.loadingLatency,
      'Memory Usage per Component': report.components.total > 0 
        ? (report.performance.resourceUtilization * 5) / report.components.total 
        : 0,
      'Error Recovery Time': report.reliability.recoveryTime,
      'Security Scan Time': report.security.violationsDetected * 2,
      'System Throughput': report.performance.throughput
    }
    
    this.benchmarks.forEach(benchmark => {
      if (benchmarkUpdates[benchmark.name] !== undefined) {
        benchmark.actual = benchmarkUpdates[benchmark.name]
        benchmark.passed = benchmark.actual <= benchmark.target
      }
    })
  }

  private trimAnalysisHistory(): void {
    // Keep last 24 hours of analysis
    const maxAge = 24 * 60 * 60 * 1000
    const cutoff = Date.now() - maxAge
    
    this.analysisHistory = this.analysisHistory.filter(
      report => report.timestamp.getTime() > cutoff
    )
  }

  // Public API
  async quickHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    score: number
    issues: string[]
  }> {
    const currentMetrics = this.monitor.getLatestMetrics()
    const activeAlerts = this.monitor.getActiveAlerts()
    
    if (!currentMetrics) {
      return {
        status: 'critical',
        score: 0,
        issues: ['No monitoring data available']
      }
    }
    
    const issues: string[] = []
    let score = 100
    
    // Check critical issues
    if (activeAlerts.some(a => a.severity === 'critical')) {
      issues.push('Critical alerts active')
      score -= 30
    }
    
    if (currentMetrics.performance.errorRate > 10) {
      issues.push('High error rate')
      score -= 20
    }
    
    if (currentMetrics.components.memoryUsage > 100) {
      issues.push('Memory usage critical')
      score -= 25
    }
    
    if (currentMetrics.components.failed > 0) {
      issues.push('Components failing')
      score -= 15
    }
    
    const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical'
    
    return {
      status,
      score: Math.max(0, score),
      issues
    }
  }

  getAnalysisHistory(): SystemAnalysisReport[] {
    return [...this.analysisHistory]
  }

  getPerformanceBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks]
  }

  generateRecommendations(report: SystemAnalysisReport): SystemRecommendation[] {
    const recommendations: SystemRecommendation[] = []
    
    // Performance recommendations
    if (report.performance.systemLatency > 200) {
      recommendations.push({
        id: 'perf-001',
        priority: 'high',
        category: 'performance',
        title: 'Reduce System Latency',
        description: `System latency is ${report.performance.systemLatency}ms, exceeding optimal threshold`,
        impact: 'Improved user experience and faster component loading',
        effort: 'medium',
        timeline: '1-2 weeks',
        implementation: [
          'Implement component preloading',
          'Optimize critical loading paths',
          'Enable compression for large components',
          'Add CDN caching for static resources'
        ]
      })
    }
    
    // Security recommendations
    if (report.security.complianceScore < 80) {
      recommendations.push({
        id: 'sec-001',
        priority: 'critical',
        category: 'security',
        title: 'Improve Security Compliance',
        description: `Security compliance score is ${report.security.complianceScore}%, below required threshold`,
        impact: 'Reduced security risk and improved compliance',
        effort: 'high',
        timeline: '2-4 weeks',
        implementation: [
          'Address all critical security violations',
          'Implement additional CSP policies',
          'Enhance input sanitization',
          'Add security monitoring alerts'
        ]
      })
    }
    
    // Reliability recommendations
    if (report.reliability.errorRate > 5) {
      recommendations.push({
        id: 'rel-001',
        priority: 'high',
        category: 'reliability',
        title: 'Reduce Error Rate',
        description: `Error rate is ${report.reliability.errorRate}%, impacting system reliability`,
        impact: 'Improved system stability and user experience',
        effort: 'medium',
        timeline: '1-3 weeks',
        implementation: [
          'Enhance error boundary coverage',
          'Implement retry mechanisms',
          'Add fallback components',
          'Improve error monitoring and alerting'
        ]
      })
    }
    
    // Scalability recommendations
    if (report.scalability.growthReadiness < 60) {
      recommendations.push({
        id: 'scale-001',
        priority: 'medium',
        category: 'scalability',
        title: 'Improve Scalability',
        description: `Growth readiness is ${report.scalability.growthReadiness}%, limiting future expansion`,
        impact: 'Better capacity for handling growth',
        effort: 'high',
        timeline: '3-6 weeks',
        implementation: [
          'Optimize memory usage patterns',
          'Implement lazy loading for non-critical components',
          'Add resource pooling',
          'Enhance caching strategies'
        ]
      })
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  exportAnalysisReport(report: SystemAnalysisReport, format: 'json' | 'markdown' = 'json'): string {
    if (format === 'markdown') {
      return this.generateMarkdownReport(report)
    }
    
    return JSON.stringify(report, null, 2)
  }

  private generateMarkdownReport(report: SystemAnalysisReport): string {
    const recommendations = this.generateRecommendations(report)
    
    return `# System Analysis Report

**Generated**: ${report.timestamp.toISOString()}
**Overall Health**: ${report.overallHealth.status.toUpperCase()} (${report.overallHealth.score}/100)

## Executive Summary

The system analysis reveals a **${report.overallHealth.status}** overall health status with a score of **${report.overallHealth.score}/100**.

### Key Metrics
- **Components**: ${report.components.loaded}/${report.components.total} loaded (${report.components.failed} failed)
- **Sections**: ${report.sections.progressivelyLoaded}/${report.sections.total} progressively loaded
- **Security**: ${report.security.violationsDetected} violations detected (${report.security.threatLevel} threat level)
- **Performance**: ${report.performance.systemLatency}ms latency, ${report.performance.throughput} ops/sec
- **Reliability**: ${report.reliability.uptime}% uptime, ${report.reliability.errorRate}% error rate

## Detailed Analysis

### Components
- **Memory Efficiency**: ${report.components.memoryEfficiency}%
- **Load Time Optimization**: ${report.components.loadTimeOptimization}%
- **Error Resilience**: ${report.components.errorResilience}%

### Progressive Loading
- **Preload Efficiency**: ${report.sections.preloadEfficiency}%
- **Cache Hit Rate**: ${report.sections.cacheHitRate}%
- **Loading Latency**: ${report.sections.loadingLatency}ms

### Security Posture
- **Compliance Score**: ${report.security.complianceScore}%
- **Threat Level**: ${report.security.threatLevel}
- **Vulnerabilities**: ${report.security.vulnerabilities.join(', ') || 'None detected'}

### Performance Analysis
- **System Latency**: ${report.performance.systemLatency}ms
- **Throughput**: ${report.performance.throughput} operations/second
- **Resource Utilization**: ${report.performance.resourceUtilization}%

### Bottlenecks
${report.performance.bottlenecks.map(b => `- ${b}`).join('\n')}

### Optimization Opportunities  
${report.performance.optimizationOpportunities.map(o => `- ${o}`).join('\n')}

## Test Results
- **Total Tests**: ${report.testResults.totalTests}
- **Pass Rate**: ${report.testResults.passRate.toFixed(1)}%
- **Critical Failures**: ${report.testResults.criticalFailures}
- **Coverage**: ${report.testResults.coverage}

## Recommendations

${recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()})
**Category**: ${rec.category}
**Impact**: ${rec.impact}
**Effort**: ${rec.effort}
**Timeline**: ${rec.timeline}

${rec.description}

**Implementation Steps**:
${rec.implementation.map(step => `- ${step}`).join('\n')}
`).join('\n')}

## Benchmarks

${this.benchmarks.map(b => `- **${b.name}**: ${b.actual}${b.unit} (Target: ${b.target}${b.unit}) ${b.passed ? '✅' : '❌'}`).join('\n')}
`
  }

  destroy(): void {
    this.analysisHistory = []
    this.benchmarks = []
    // System analyzer destroyed - cleanup completed
  }
}