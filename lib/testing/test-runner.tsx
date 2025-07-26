"use client"

/**
 * Test Runner Component
 * Interactive test runner for component isolation system
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { IsolationTestFramework, TestResult, TestReport, TestScenario } from './isolation-test-framework'
import { motion, AnimatePresence } from 'framer-motion'

interface TestRunnerProps {
  autoRun?: boolean
  showDetails?: boolean
  onTestComplete?: (report: TestReport) => void
  className?: string
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  autoRun = false,
  showDetails = true,
  onTestComplete,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [report, setReport] = useState<TestReport | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const testFramework = useRef(IsolationTestFramework.getInstance())

  const handleRunAllTests = useCallback(async () => {
    setIsRunning(true)
    setCurrentTest('')
    setReport(null)

    try {
      const testReport = await testFramework.current.runAllTests()
      setReport(testReport)
      
      if (onTestComplete) {
        onTestComplete(testReport)
      }
    } catch (error) {
      console.error('Test run failed:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest('')
    }
  }, [onTestComplete])

  useEffect(() => {
    if (autoRun) {
      handleRunAllTests()
    }
  }, [autoRun, handleRunAllTests])

  const handleRunSpecificTest = useCallback(async (scenarioId: string) => {
    if (!scenarioId) return

    setIsRunning(true)
    setCurrentTest(scenarioId)

    try {
      const result = await testFramework.current.runSpecificTest(scenarioId)
      
      // Create a mini report for single test
      const miniReport: TestReport = {
        timestamp: new Date(),
        duration: result.duration,
        totalTests: 1,
        passed: result.status === 'passed' ? 1 : 0,
        failed: result.status === 'failed' ? 1 : 0,
        skipped: result.status === 'skipped' ? 1 : 0,
        coverage: { components: 0, sections: 0, errorPaths: 0 },
        results: [result],
        recommendations: []
      }
      
      setReport(miniReport)
    } catch (error) {
      console.error('Single test failed:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest('')
    }
  }, [])

  const scenarios = testFramework.current.getTestScenarios()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <span className="text-green-500">✅</span>
      case 'failed':
        return <span className="text-red-500">❌</span>
      case 'skipped':
        return <span className="text-yellow-500">⏭️</span>
      case 'timeout':
        return <span className="text-orange-500">⏱️</span>
      default:
        return <span className="text-gray-500">⚪</span>
    }
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'isolation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'loading':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'error-handling':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'performance':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'integration':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
    }
  }

  return (
    <div className={`test-runner bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Component Isolation Test Runner
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive testing for component isolation and progressive loading
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRunAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Running Status */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {currentTest ? `Running: ${currentTest}` : 'Running all tests...'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Please wait while we test the isolation system
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Scenarios */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Test Scenarios
        </h3>
        
        <div className="grid gap-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(scenario.category)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(scenario.severity)}`}>
                    {scenario.severity}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {scenario.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {scenario.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleRunSpecificTest(scenario.id)}
                disabled={isRunning}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Test Report Summary
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {report.totalTests}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {report.passed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {report.failed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.skipped}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Duration:</strong> {report.duration.toFixed(2)}ms |{' '}
                <strong>Components:</strong> {report.coverage.components} |{' '}
                <strong>Sections:</strong> {report.coverage.sections}
              </div>
            </div>

            {/* Detailed Results */}
            {showDetails && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Detailed Results
                </h3>
                
                <div className="space-y-3">
                  {report.results.map((result) => {
                    const scenario = scenarios.find(s => s.id === result.scenarioId)
                    
                    return (
                      <div
                        key={result.scenarioId}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {scenario?.name || result.scenarioId}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {result.duration.toFixed(2)}ms
                              </p>
                            </div>
                          </div>
                          
                          {scenario && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(scenario.severity)}`}>
                              {scenario.severity}
                            </span>
                          )}
                        </div>
                        
                        {result.error && (
                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                        
                        {result.metrics && Object.keys(result.metrics).length > 0 && (
                          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-sm">
                            <strong>Metrics:</strong>{' '}
                            {Object.entries(result.metrics)
                              .filter(([_, value]) => value !== undefined)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Recommendations
                </h3>
                
                <div className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        💡 {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for programmatic test running
export function useTestRunner() {
  const testFramework = useRef(IsolationTestFramework.getInstance())
  const [isRunning, setIsRunning] = useState(false)
  const [report, setReport] = useState<TestReport | null>(null)

  const runAllTests = useCallback(async () => {
    setIsRunning(true)
    try {
      const testReport = await testFramework.current.runAllTests()
      setReport(testReport)
      return testReport
    } finally {
      setIsRunning(false)
    }
  }, [])

  const runSpecificTest = useCallback(async (scenarioId: string) => {
    setIsRunning(true)
    try {
      const result = await testFramework.current.runSpecificTest(scenarioId)
      return result
    } finally {
      setIsRunning(false)
    }
  }, [])

  return {
    isRunning,
    report,
    runAllTests,
    runSpecificTest,
    scenarios: testFramework.current.getTestScenarios()
  }
}