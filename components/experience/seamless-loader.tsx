"use client"

/**
 * Seamless Loading Experience
 * Premium UX with smooth transitions, intelligent preloading, and accessibility
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressiveLoader } from '@/lib/loading/progressive-loader'
import { ComponentIsolator } from '@/lib/isolation/component-isolator'
import { SystemEventBus } from '@/lib/architecture/core-system'

interface SeamlessLoaderProps {
  children: React.ReactNode
  sectionId: string
  priority?: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
  loadingComponent?: React.ComponentType<LoadingProps>
  errorComponent?: React.ComponentType<ErrorProps>
  className?: string
}

interface LoadingProps {
  progress: number
  stage: string
  estimated: number
}

interface ErrorProps {
  error: Error
  retry: () => void
  canRetry: boolean
}

interface LoadingState {
  isLoading: boolean
  isError: boolean
  progress: number
  stage: string
  error: Error | null
  estimated: number
}

// Default Loading Component with Premium Animation
const DefaultLoadingComponent: React.FC<LoadingProps> = ({ progress, stage, estimated }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
    {/* Progress Ring */}
    <div className="relative w-16 h-16 mb-4">
      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 28}`}
          strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
          className="text-blue-500 transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>
    </div>

    {/* Stage Indicator */}
    <div className="text-center">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
        {stage}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {estimated > 0 && `~${(estimated / 1000).toFixed(1)}s remaining`}
      </p>
    </div>

    {/* Skeleton Shimmer */}
    <div className="w-full max-w-md mt-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-3 w-3"></div>
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Default Error Component
const DefaultErrorComponent: React.FC<ErrorProps> = ({ error, retry, canRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
    <div className="w-16 h-16 mb-4 text-red-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      Loading Failed
    </h3>
    
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
      {error.message || 'Something went wrong while loading this section.'}
    </p>
    
    {canRetry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Try Again
      </button>
    )}
  </div>
)

export const SeamlessLoader: React.FC<SeamlessLoaderProps> = ({
  children,
  sectionId,
  priority = 'below-fold',
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isError: false,
    progress: 0,
    stage: 'Initializing...',
    error: null,
    estimated: 0
  })

  const sectionRef = useRef<HTMLDivElement>(null)
  const progressiveLoader = useRef(ProgressiveLoader.getInstance())
  const componentIsolator = useRef(ComponentIsolator.getInstance())
  const eventBus = useRef(SystemEventBus.getInstance())
  const retryCount = useRef(0)

  // Loading progress tracking
  const updateProgress = useCallback((progress: number, stage: string, estimated: number = 0) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      stage,
      estimated
    }))
  }, [])

  // Initialize section loading
  useEffect(() => {
    const initializeSection = async () => {
      try {
        // Register section with progressive loader
        progressiveLoader.current.registerSection({
          id: sectionId,
          name: sectionId,
          route: window.location.pathname,
          priority,
          dependencies: [],
          preloadTrigger: priority === 'critical' ? 'immediate' : 'viewport',
          estimatedSize: 100, // Default estimate
          renderComplexity: 'medium',
          cacheStrategy: 'memory'
        })

        updateProgress(10, 'Registering section...')

        // Setup event listeners for progress tracking
        const handleLoadingProgress = (data: any) => {
          if (data.data.sectionId === sectionId) {
            updateProgress(50, 'Loading dependencies...')
          }
        }

        const handleSectionLoaded = (data: any) => {
          if (data.data.sectionId === sectionId) {
            updateProgress(90, 'Rendering...')
            setTimeout(() => {
              setLoadingState(prev => ({
                ...prev,
                isLoading: false,
                progress: 100,
                stage: 'Complete'
              }))
            }, 200)
          }
        }

        const handleSectionFailed = (data: any) => {
          if (data.data.sectionId === sectionId) {
            setLoadingState(prev => ({
              ...prev,
              isLoading: false,
              isError: true,
              error: new Error(data.data.error)
            }))
          }
        }

        eventBus.current.on('loader:section-loading', handleLoadingProgress)
        eventBus.current.on('loader:section-loaded', handleSectionLoaded)
        eventBus.current.on('loader:section-failed', handleSectionFailed)

        // Start loading
        updateProgress(20, 'Starting load...')
        await progressiveLoader.current.loadSection(sectionId)

        // Cleanup
        return () => {
          eventBus.current.off('loader:section-loading', handleLoadingProgress)
          eventBus.current.off('loader:section-loaded', handleSectionLoaded)
          eventBus.current.off('loader:section-failed', handleSectionFailed)
        }

      } catch (error) {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          error: error as Error
        }))
      }
    }

    initializeSection()
  }, [sectionId, priority, updateProgress])

  // Intersection observer for viewport-based loading
  useEffect(() => {
    if (!sectionRef.current) return

    // Register with progressive loader's intersection observer
    progressiveLoader.current.observeSection(sectionRef.current)

    // Add section ID to element for tracking
    sectionRef.current.setAttribute('data-section-id', sectionId)
  }, [sectionId])

  // Retry function
  const handleRetry = useCallback(async () => {
    retryCount.current += 1
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      progress: 0,
      stage: 'Retrying...',
      error: null
    }))

    try {
      await progressiveLoader.current.loadSection(sectionId, { force: true })
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error as Error
      }))
    }
  }, [sectionId])

  // Smooth transitions
  const containerVariants = {
    loading: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    loaded: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    error: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }

  const contentVariants = {
    enter: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 1.05,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  }

  return (
    <div
      ref={sectionRef}
      className={`seamless-loader-container ${className}`}
      data-section-id={sectionId}
      data-priority={priority}
    >
      <AnimatePresence mode="wait">
        {loadingState.isLoading && (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="loading"
            animate="loading"
            exit="exit"
            className="seamless-loader-loading"
          >
            <LoadingComponent
              progress={loadingState.progress}
              stage={loadingState.stage}
              estimated={loadingState.estimated}
            />
          </motion.div>
        )}

        {loadingState.isError && (
          <motion.div
            key="error"
            variants={containerVariants}
            initial="error"
            animate="error"
            exit="exit"
            className="seamless-loader-error"
          >
            <ErrorComponent
              error={loadingState.error!}
              retry={handleRetry}
              canRetry={retryCount.current < 3}
            />
          </motion.div>
        )}

        {!loadingState.isLoading && !loadingState.isError && (
          <motion.div
            key="content"
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="seamless-loader-content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Higher-order component for easy section wrapping
export function withSeamlessLoading<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    sectionId: string
    priority?: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
    loadingComponent?: React.ComponentType<LoadingProps>
    errorComponent?: React.ComponentType<ErrorProps>
  }
) {
  const WrappedComponent = (props: T) => (
    <SeamlessLoader
      sectionId={options.sectionId}
      priority={options.priority}
      loadingComponent={options.loadingComponent}
      errorComponent={options.errorComponent}
    >
      <Component {...props} />
    </SeamlessLoader>
  )

  WrappedComponent.displayName = `withSeamlessLoading(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for programmatic loading control
export function useSeamlessLoading(sectionId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const progressiveLoader = useRef(ProgressiveLoader.getInstance())

  const loadSection = useCallback(async (options?: { preload?: boolean; force?: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      await progressiveLoader.current.loadSection(sectionId, options)
      setIsLoading(false)
    } catch (err) {
      setError(err as Error)
      setIsLoading(false)
    }
  }, [sectionId])

  const preloadSection = useCallback(() => {
    return loadSection({ preload: true })
  }, [loadSection])

  const reloadSection = useCallback(() => {
    return loadSection({ force: true })
  }, [loadSection])

  return {
    isLoading,
    error,
    loadSection,
    preloadSection,
    reloadSection
  }
}

// Section boundary component for automatic registration
export const SectionBoundary: React.FC<{
  id: string
  name: string
  priority?: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
  children: React.ReactNode
  className?: string
}> = ({ id, name, priority = 'below-fold', children, className = '' }) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const progressiveLoader = useRef(ProgressiveLoader.getInstance())

  useEffect(() => {
    // Auto-register section
    progressiveLoader.current.registerSection({
      id,
      name,
      route: window.location.pathname,
      priority,
      dependencies: [],
      preloadTrigger: priority === 'critical' ? 'immediate' : 'viewport',
      estimatedSize: 100,
      renderComplexity: 'medium',
      cacheStrategy: 'memory'
    })

    // Setup intersection observer
    if (sectionRef.current) {
      progressiveLoader.current.observeSection(sectionRef.current)
    }
  }, [id, name, priority])

  return (
    <section
      ref={sectionRef}
      data-section-id={id}
      data-section-name={name}
      data-priority={priority}
      className={`section-boundary ${className}`}
    >
      {children}
    </section>
  )
}