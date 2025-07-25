"use client"

/**
 * System Dashboard Component
 * Real-time dashboard for component isolation system monitoring and analysis
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SystemAnalyzer, SystemAnalysisReport, PerformanceBenchmark, SystemRecommendation } from '@/lib/analysis/system-analyzer'
import { IsolationMonitor, MonitoringMetrics, Alert } from '@/lib/monitoring/isolation-monitor'
import { TestRunner, useTestRunner } from '@/lib/testing/test-runner'

interface SystemDashboardProps {
  autoRefresh?: boolean
  refreshInterval?: number
  showDetails?: boolean
  className?: string
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
  showDetails = true,
  className = ''
}) => {
  const [analysisReport, setAnalysisReport] = useState<SystemAnalysisReport | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<MonitoringMetrics | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([])
  const [recommendations, setRecommendations] = useState<SystemRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'security' | 'tests' | 'recommendations'>('overview')
  
  const systemAnalyzer = useRef(SystemAnalyzer.getInstance())
  const monitor = useRef(IsolationMonitor.getInstance())
  const { runAllTests, isRunning: isTestRunning } = useTestRunner()

  const refreshData = useCallback(async () => {
    try {
      // Get current metrics
      const metrics = monitor.current.getLatestMetrics()
      setCurrentMetrics(metrics)

      // Get active alerts
      const alerts = monitor.current.getActiveAlerts()
      setActiveAlerts(alerts)

      // Get benchmarks
      const currentBenchmarks = systemAnalyzer.current.getPerformanceBenchmarks()
      setBenchmarks(currentBenchmarks)
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    }
  }, [])

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const report = await systemAnalyzer.current.performComprehensiveAnalysis()
      setAnalysisReport(report)
      
      const recs = systemAnalyzer.current.generateRecommendations(report)
      setRecommendations(recs)
      
      await refreshData()
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [refreshData])

  useEffect(() => {
    // Initial data load
    refreshData()
    runAnalysis()

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refreshData, runAnalysis])

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
    if (score >= 75) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
    if (score >= 40) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
      case 'low': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <span className="text-green-500 text-2xl">🌟</span>
      case 'good':
        return <span className="text-blue-500 text-2xl">✅</span>
      case 'fair':
        return <span className="text-yellow-500 text-2xl">⚠️</span>
      case 'poor':
        return <span className="text-orange-500 text-2xl">⚡</span>
      case 'critical':
        return <span className="text-red-500 text-2xl">🚨</span>
      default:
        return <span className="text-gray-500 text-2xl">❓</span>
    }
  }

  const formatNumber = (num: number, decimals: number = 1) => {
    return Number(num).toFixed(decimals)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className={`system-dashboard bg-white dark:bg-gray-900 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                System Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Component Isolation System Monitoring & Analysis
              </p>
            </div>
            
            {analysisReport && (
              <div className="flex items-center space-x-3">
                {getStatusIcon(analysisReport.overallHealth.status)}
                <div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(analysisReport.overallHealth.score)}`}>
                    {analysisReport.overallHealth.status.toUpperCase()} ({analysisReport.overallHealth.score}/100)
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last analyzed: {new Date(analysisReport.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
            
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-500">🚨</span>
              <span className="font-medium text-red-800 dark:text-red-200">
                {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm text-red-700 dark:text-red-300">
                  • {alert.title}
                </div>
              ))}
              {activeAlerts.length > 3 && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  +{activeAlerts.length - 3} more alerts
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'tests', label: 'Tests', icon: '🧪' },
            { id: 'recommendations', label: 'Recommendations', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics Grid */}
              {currentMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Components</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {currentMetrics.components.loaded}/{currentMetrics.components.total}
                        </p>
                      </div>
                      <div className="text-blue-500 text-2xl">🧩</div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {currentMetrics.components.failed} failed, {formatBytes(currentMetrics.components.memoryUsage * 1024 * 1024)} memory
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Sections</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {currentMetrics.sections.loaded}/{currentMetrics.sections.total}
                        </p>
                      </div>
                      <div className="text-green-500 text-2xl">📖</div>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {currentMetrics.sections.cached} cached, {currentMetrics.sections.preloading} preloading
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Performance</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {formatNumber(currentMetrics.performance.fps)} FPS
                        </p>
                      </div>
                      <div className="text-purple-500 text-2xl">⚡</div>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {formatNumber(currentMetrics.performance.errorRate)}% error rate
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Security</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {currentMetrics.security.violations}
                        </p>
                      </div>
                      <div className="text-red-500 text-2xl">🛡️</div>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {currentMetrics.security.criticalViolations} critical violations
                    </p>
                  </div>
                </div>
              )}

              {/* System Health Summary */}
              {analysisReport && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    System Health Summary
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Components</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Memory Efficiency</span>
                          <span className="text-sm font-medium">{analysisReport.components.memoryEfficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Load Optimization</span>
                          <span className="text-sm font-medium">{analysisReport.components.loadTimeOptimization}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Error Resilience</span>
                          <span className="text-sm font-medium">{analysisReport.components.errorResilience}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Loading</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Preload Efficiency</span>
                          <span className="text-sm font-medium">{analysisReport.sections.preloadEfficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
                          <span className="text-sm font-medium">{analysisReport.sections.cacheHitRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Latency</span>
                          <span className="text-sm font-medium">{analysisReport.sections.loadingLatency}ms</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">System</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                          <span className="text-sm font-medium">{analysisReport.reliability.uptime}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Throughput</span>
                          <span className="text-sm font-medium">{analysisReport.performance.throughput} ops/sec</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Growth Ready</span>
                          <span className="text-sm font-medium">{analysisReport.scalability.growthReadiness}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Performance Benchmarks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Performance Benchmarks
                </h3>
                
                <div className="space-y-3">
                  {benchmarks.map((benchmark, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {benchmark.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Target: {benchmark.target}{benchmark.unit}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${benchmark.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNumber(benchmark.actual)}{benchmark.unit}
                        </div>
                        <div className="text-sm">
                          {benchmark.passed ? '✅ Passed' : '❌ Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Analysis */}
              {analysisReport && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Bottlenecks & Opportunities
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Bottlenecks</h5>
                      <div className="space-y-2">
                        {analysisReport.performance.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className="text-sm text-gray-700 dark:text-gray-300 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            • {bottleneck}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Optimization Opportunities</h5>
                      <div className="space-y-2">
                        {analysisReport.performance.optimizationOpportunities.map((opportunity, index) => (
                          <div key={index} className="text-sm text-gray-700 dark:text-gray-300 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            • {opportunity}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'security' && analysisReport && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Violations</h4>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {analysisReport.security.violationsDetected}
                  </div>
                  <div className={`text-sm mt-1 ${getSeverityColor(analysisReport.security.threatLevel)} px-2 py-1 rounded-full inline-block`}>
                    {analysisReport.security.threatLevel} threat
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Compliance</h4>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {analysisReport.security.complianceScore}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Security score
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Vulnerabilities</h4>
                  <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {analysisReport.security.vulnerabilities.length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Types detected
                  </div>
                </div>
              </div>

              {analysisReport.security.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Detected Vulnerabilities
                  </h4>
                  
                  <div className="space-y-2">
                    {analysisReport.security.vulnerabilities.map((vuln, index) => (
                      <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <span className="font-medium text-orange-800 dark:text-orange-200">
                          {vuln.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TestRunner
                showDetails={showDetails}
                onTestComplete={(report) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Tests completed:', report)
                  }
                }}
              />
            </motion.div>
          )}

          {selectedTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {rec.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(rec.priority)}`}>
                              {rec.priority}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          <div>Effort: {rec.effort}</div>
                          <div>Timeline: {rec.timeline}</div>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {rec.description}
                      </p>

                      <div className="mb-4">
                        <strong className="text-gray-900 dark:text-gray-100">Impact:</strong>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {rec.impact}
                        </p>
                      </div>

                      <div>
                        <strong className="text-gray-900 dark:text-gray-100">Implementation Steps:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {rec.implementation.map((step, index) => (
                            <li key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Recommendations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your system is performing well! Run a new analysis to get updated recommendations.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}