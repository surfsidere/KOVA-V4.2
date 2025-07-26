"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { ScrollState, ScrollProviderProps, LenisInstance } from '@/types/scroll.types'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface LenisContextValue {
  lenis: LenisInstance | null;
  scrollState: ScrollState;
  isReady: boolean;
  scrollTo: (target: string | number, options?: any) => void;
  updateScrollState: (state: Partial<ScrollState>) => void;
}

const LenisContext = createContext<LenisContextValue | null>(null)

// Dynamically import ReactLenis to avoid SSG serialization issues
const ReactLenis = dynamic(
  () => import('lenis/react').then(mod => ({ default: mod.ReactLenis })),
  { 
    ssr: false,
    loading: () => <div style={{ display: 'contents' }} />
  }
)

// Client-only LenisProvider implementation
const LenisProviderClient: React.FC<ScrollProviderProps> = ({ 
  children, 
  options
}) => {
  const lenisRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  // Create simple easing function without serialization issues
  const simpleEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  
  const defaultOptions = {
    smooth: true,
    lerp: 0.1,
    duration: 1.2,
    easing: simpleEasing,
    direction: 'vertical' as const,
    gestureDirection: 'vertical' as const,
    smoothTouch: false,
    touchMultiplier: 2,
    ...options
  }
  
  const [scrollState, setScrollState] = useState<ScrollState>({
    progress: 0,
    velocity: 0,
    direction: 'down',
    activeSection: '',
    isScrolling: false,
  })

  // Enhanced scroll state management
  const updateScrollState = useCallback((newState: Partial<ScrollState>) => {
    setScrollState(prev => ({ ...prev, ...newState }))
  }, [])

  // Scroll to function with enhanced options
  const scrollTo = useCallback((target: string | number, scrollOptions?: any) => {
    if (!lenisRef.current?.lenis) return
    
    const scrollToOptions = {
      offset: 0,
      duration: defaultOptions.duration,
      easing: defaultOptions.easing,
      immediate: prefersReducedMotion,
      ...scrollOptions
    }
    
    lenisRef.current.lenis.scrollTo(target, scrollToOptions)
  }, [defaultOptions.duration, defaultOptions.easing, prefersReducedMotion])

  // Custom RAF integration
  useEffect(() => {
    let isScrolling = false
    let scrollTimeout: NodeJS.Timeout
    let animationId: number
    
    function update() {
      const lenis = lenisRef.current?.lenis
      
      if (lenis) {
        lenis.raf(Date.now())
        
        // Enhanced scroll state tracking
        const currentScroll = lenis.scroll || 0
        const limit = lenis.limit || 1
        const velocity = lenis.velocity || 0
        const progress = limit > 0 ? currentScroll / limit : 0
        
        // Detect scroll activity
        if (!isScrolling && Math.abs(velocity) > 0.1) {
          isScrolling = true
          updateScrollState({ isScrolling: true })
        }
        
        // Clear scroll timeout
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          isScrolling = false
          updateScrollState({ isScrolling: false })
        }, 150)
        
        // Update scroll state
        updateScrollState({
          progress: Math.max(0, Math.min(1, progress)),
          velocity,
          direction: velocity > 0 ? 'down' : 'up',
        })
      }
      
      animationId = requestAnimationFrame(update)
    }

    animationId = requestAnimationFrame(update)
    setIsReady(true)

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(scrollTimeout)
    }
  }, [updateScrollState])

  // Enhanced options with reduced motion support
  const lenisOptions = {
    ...defaultOptions,
    autoRaf: false,
    smooth: prefersReducedMotion ? false : defaultOptions.smooth,
    lerp: prefersReducedMotion ? 1 : defaultOptions.lerp,
  }

  const contextValue: LenisContextValue = {
    lenis: lenisRef.current?.lenis as LenisInstance | null,
    scrollState,
    isReady,
    scrollTo,
    updateScrollState,
  }

  return (
    <LenisContext.Provider value={contextValue}>
      <ReactLenis 
        root 
        ref={lenisRef} 
        options={lenisOptions}
      >
        {children}
      </ReactLenis>
    </LenisContext.Provider>
  )
}

// Main LenisProvider that renders client-only
export const LenisProvider: React.FC<ScrollProviderProps> = ({ children, options }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Provide a basic context during SSR
    const fallbackContext: LenisContextValue = {
      lenis: null,
      scrollState: {
        progress: 0,
        velocity: 0,
        direction: 'down',
        activeSection: '',
        isScrolling: false,
      },
      isReady: false,
      scrollTo: () => {},
      updateScrollState: () => {},
    }

    return (
      <LenisContext.Provider value={fallbackContext}>
        {children}
      </LenisContext.Provider>
    )
  }

  return <LenisProviderClient options={options}>{children}</LenisProviderClient>
}

export const useLenis = () => {
  const context = useContext(LenisContext)
  if (!context) {
    throw new Error('useLenis must be used within a LenisProvider')
  }
  return context
}

export default LenisProvider