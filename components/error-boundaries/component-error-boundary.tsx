"use client"

/**
 * Component Error Boundary
 * Production-grade error isolation with recovery strategies
 */

import React, { Component, ReactNode } from 'react'
import { ComponentIsolator } from '@/lib/isolation/component-isolator'
import { SystemEventBus } from '@/lib/architecture/core-system'
import { motion, AnimatePresence } from 'framer-motion'

interface ComponentErrorBoundaryProps {
  children: ReactNode
  componentId: string
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolationLevel: 'strict' | 'moderate' | 'minimal'
  recoveryStrategy: 'retry' | 'fallback' | 'reload' | 'isolate'
  maxRetries?: number
  className?: string
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  retry: () => void
  recover: () => void
  canRetry: boolean
  isolationLevel: string
  componentId: string
}

interface ComponentErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
  retryCount: number
  isolated: boolean
  recoveryAttempts: number
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  private componentIsolator: ComponentIsolator
  private eventBus: SystemEventBus
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isolated: false,
      recoveryAttempts: 0
    }

    this.componentIsolator = ComponentIsolator.getInstance()
    this.eventBus = SystemEventBus.getInstance()
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentId, onError, isolationLevel, recoveryStrategy } = this.props

    // Update state with error details
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1
    })

    // Emit error event
    this.eventBus.emitSystemEvent('error-boundary:component-error', {
      componentId,
      error: error.message,
      errorInfo,
      isolationLevel,
      recoveryStrategy,
      stack: error.stack
    })

    // Log error details
    console.error(`🚨 Component Error Boundary triggered: ${componentId}`, {
      error,
      errorInfo,
      isolationLevel,
      componentStack: errorInfo.componentStack
    })

    // Apply isolation strategy
    this.applyIsolationStrategy(error, errorInfo)

    // Execute recovery strategy
    this.executeRecoveryStrategy(error, errorInfo)

    // Call user-provided error handler
    if (onError) {
      onError(error, errorInfo)
    }
  }

  private applyIsolationStrategy(error: Error, errorInfo: React.ErrorInfo): void {
    const { isolationLevel, componentId } = this.props

    switch (isolationLevel) {
      case 'strict':
        // Complete isolation - stop all component interactions
        this.setState({ isolated: true })
        this.componentIsolator.unloadComponent(componentId)
        this.eventBus.emitSystemEvent('isolator:component-quarantined', {
          componentId,
          reason: 'strict-isolation',
          error: error.message
        })
        break

      case 'moderate':
        // Partial isolation - limit interactions but keep component
        this.eventBus.emitSystemEvent('isolator:component-limited', {
          componentId,
          limitations: ['no-state-updates', 'no-event-propagation'],
          error: error.message
        })
        break

      case 'minimal':
        // Log only - no isolation
        this.eventBus.emitSystemEvent('isolator:component-monitored', {
          componentId,
          error: error.message
        })
        break
    }
  }

  private executeRecoveryStrategy(error: Error, errorInfo: React.ErrorInfo): void {
    const { recoveryStrategy, maxRetries = 3 } = this.props

    switch (recoveryStrategy) {
      case 'retry':
        if (this.state.retryCount < maxRetries) {
          this.scheduleRetry()
        } else {
          this.fallbackToAlternativeStrategy()
        }
        break

      case 'fallback':
        // Use fallback component immediately
        break

      case 'reload':
        if (this.state.recoveryAttempts < 1) {
          this.reloadComponent()
        }
        break

      case 'isolate':
        this.setState({ isolated: true })
        break
    }
  }

  private scheduleRetry(): void {
    const retryDelay = Math.pow(2, this.state.retryCount) * 1000 // Exponential backoff

    this.retryTimeout = setTimeout(() => {
      console.log(`🔄 Retrying component: ${this.props.componentId} (${this.state.retryCount}/${this.props.maxRetries})`)
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      })
    }, retryDelay)
  }

  private fallbackToAlternativeStrategy(): void {
    console.warn(`⚠️ Max retries reached for ${this.props.componentId}, falling back to isolation`)
    this.setState({ isolated: true })
  }

  private reloadComponent(): void {
    const { componentId } = this.props

    this.setState({ recoveryAttempts: this.state.recoveryAttempts + 1 })

    // Attempt component reload through isolator
    this.componentIsolator.unloadComponent(componentId)
    setTimeout(() => {
      this.componentIsolator.loadComponent(componentId).then(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null
        })
      }).catch((reloadError) => {
        console.error(`❌ Component reload failed: ${componentId}`, reloadError)
        this.setState({ isolated: true })
      })
    }, 1000)
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry()
    }
  }

  private handleRecover = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isolated: false,
      retryCount: 0,
      recoveryAttempts: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  render() {
    const { hasError, error, errorInfo, isolated } = this.state
    const { children, fallback: FallbackComponent, componentId, isolationLevel, maxRetries = 3 } = this.props

    if (hasError && error) {
      const ErrorFallback = FallbackComponent || DefaultErrorFallback

      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`error-boundary ${isolated ? 'isolated' : ''} ${this.props.className || ''}`}
            data-component-id={componentId}
            data-isolation-level={isolationLevel}
          >
            <ErrorFallback
              error={error}
              errorInfo={errorInfo!}
              retry={this.handleRetry}
              recover={this.handleRecover}
              canRetry={this.state.retryCount < maxRetries}
              isolationLevel={isolationLevel}
              componentId={componentId}
            />
          </motion.div>
        </AnimatePresence>
      )
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={this.props.className}
          data-component-id={componentId}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  retry,
  recover,
  canRetry,
  isolationLevel,
  componentId
}) => {
  const getIsolationBadgeColor = (level: string) => {
    switch (level) {
      case 'strict': return 'bg-red-500'
      case 'moderate': return 'bg-yellow-500'
      case 'minimal': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="error-fallback p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Component Error
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              {componentId}
            </p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getIsolationBadgeColor(isolationLevel)}`}>
          {isolationLevel} isolation
        </div>
      </div>

      {/* Error Details */}
      <div className="mb-4">
        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
          <strong>Error:</strong> {error.message}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
              View Error Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200 overflow-auto max-h-32">
              {error.stack}
            </pre>
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-800 dark:text-red-200 overflow-auto max-h-32">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        {canRetry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry Component
          </button>
        )}
        
        <button
          onClick={recover}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset & Recover
        </button>
      </div>
    </div>
  )
}

// HOC for automatic error boundary wrapping
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    componentId: string
    isolationLevel?: 'strict' | 'moderate' | 'minimal'
    recoveryStrategy?: 'retry' | 'fallback' | 'reload' | 'isolate'
    fallback?: React.ComponentType<ErrorFallbackProps>
    maxRetries?: number
  }
) {
  const WrappedComponent = (props: T) => (
    <ComponentErrorBoundary
      componentId={options.componentId}
      isolationLevel={options.isolationLevel || 'moderate'}
      recoveryStrategy={options.recoveryStrategy || 'retry'}
      fallback={options.fallback}
      maxRetries={options.maxRetries || 3}
    >
      <Component {...props} />
    </ComponentErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error boundary state
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}