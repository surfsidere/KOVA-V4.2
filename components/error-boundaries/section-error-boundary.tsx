"use client"

/**
 * Section Error Boundary
 * Specialized error boundary for progressive loading sections
 */

import React from 'react'
import { ComponentErrorBoundary, ErrorFallbackProps } from './component-error-boundary'
import { ProgressiveLoader } from '@/lib/loading/progressive-loader'
import { motion } from 'framer-motion'

interface SectionErrorBoundaryProps {
  children: React.ReactNode
  sectionId: string
  sectionName: string
  priority: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
  onSectionError?: (sectionId: string, error: Error) => void
  fallbackComponent?: React.ComponentType<SectionErrorFallbackProps>
  className?: string
}

interface SectionErrorFallbackProps extends ErrorFallbackProps {
  sectionId: string
  sectionName: string
  priority: string
  reloadSection: () => void
}

const DefaultSectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  error,
  retry,
  recover,
  reloadSection,
  canRetry,
  sectionId,
  sectionName,
  priority
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'above-fold': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'below-fold': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'lazy': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'above-fold':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`section-error-boundary p-6 border-2 rounded-xl ${getPriorityColor(priority)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getPriorityIcon(priority)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Section Loading Failed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sectionName} ({sectionId})
            </p>
          </div>
        </div>
        
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
          {priority} priority
        </div>
      </div>

      {/* Error Message */}
      <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Error:</strong> {error.message}
        </p>
        
        {priority === 'critical' && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded border-l-4 border-red-500">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ This is a critical section. Page functionality may be affected.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canRetry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
          >
            Retry Load
          </button>
        )}
        
        <button
          onClick={reloadSection}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium"
        >
          Reload Section
        </button>
        
        <button
          onClick={recover}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
        >
          Reset
        </button>
        
        {priority !== 'critical' && (
          <button
            onClick={() => {
              // Hide this section and continue
              const element = document.querySelector(`[data-section-id="${sectionId}"]`)
              if (element) {
                (element as HTMLElement).style.display = 'none'
              }
            }}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 text-sm font-medium"
          >
            Skip Section
          </button>
        )}
      </div>
    </motion.div>
  )
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({
  children,
  sectionId,
  sectionName,
  priority,
  onSectionError,
  fallbackComponent: FallbackComponent = DefaultSectionErrorFallback,
  className
}) => {
  const progressiveLoader = React.useRef(ProgressiveLoader.getInstance())

  const handleSectionError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`🚨 Section error: ${sectionName} (${sectionId})`, { error, errorInfo })
    
    // Notify progressive loader about section failure
    progressiveLoader.current.unloadSection(sectionId)
    
    // Call user-provided error handler
    if (onSectionError) {
      onSectionError(sectionId, error)
    }
  }, [sectionId, sectionName, onSectionError])

  const handleReloadSection = React.useCallback(async () => {
    try {
      await progressiveLoader.current.loadSection(sectionId, { force: true })
    } catch (error) {
      console.error(`Failed to reload section: ${sectionId}`, error)
    }
  }, [sectionId])

  const customFallback = React.useCallback((props: ErrorFallbackProps) => (
    <FallbackComponent
      {...props}
      sectionId={sectionId}
      sectionName={sectionName}
      priority={priority}
      reloadSection={handleReloadSection}
    />
  ), [sectionId, sectionName, priority, handleReloadSection, FallbackComponent])

  return (
    <ComponentErrorBoundary
      componentId={sectionId}
      isolationLevel={priority === 'critical' ? 'strict' : 'moderate'}
      recoveryStrategy="retry"
      onError={handleSectionError}
      fallback={customFallback}
      maxRetries={priority === 'critical' ? 5 : 3}
      className={className}
    >
      {children}
    </ComponentErrorBoundary>
  )
}

// HOC for automatic section error boundary wrapping
export function withSectionErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    sectionId: string
    sectionName: string
    priority: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
    fallback?: React.ComponentType<SectionErrorFallbackProps>
  }
) {
  const WrappedComponent = (props: T) => (
    <SectionErrorBoundary
      sectionId={options.sectionId}
      sectionName={options.sectionName}
      priority={options.priority}
      fallbackComponent={options.fallback}
    >
      <Component {...props} />
    </SectionErrorBoundary>
  )

  WrappedComponent.displayName = `withSectionErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}