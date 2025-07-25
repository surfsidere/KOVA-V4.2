"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { frame } from 'framer-motion'
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

export const LenisProvider: React.FC<ScrollProviderProps> = ({ 
  children, 
  options = {
    smooth: true,
    lerp: 0.1,
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smoothTouch: false,
    touchMultiplier: 2,
  }
}) => {
  const lenisRef = useRef<LenisRef>(null)
  const [isReady, setIsReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
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
    
    const defaultOptions = {
      offset: 0,
      duration: options.duration,
      easing: options.easing,
      immediate: prefersReducedMotion,
      ...scrollOptions
    }
    
    lenisRef.current.lenis.scrollTo(target, defaultOptions)
  }, [options.duration, options.easing, prefersReducedMotion])

  // Custom RAF integration with Framer Motion
  useEffect(() => {
    let isScrolling = false
    let scrollTimeout: NodeJS.Timeout
    
    function update(data: { timestamp: number }) {
      const time = data.timestamp
      const lenis = lenisRef.current?.lenis
      
      if (lenis) {
        lenis.raf(time)
        
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
    }

    frame.update(update, true)
    setIsReady(true)

    return () => {
      frame.cancelUpdate(update)
      clearTimeout(scrollTimeout)
    }
  }, [updateScrollState])

  // Enhanced options with reduced motion support
  const lenisOptions = {
    ...options,
    autoRaf: false,
    smooth: prefersReducedMotion ? false : options.smooth,
    lerp: prefersReducedMotion ? 1 : options.lerp,
  }

  const contextValue: LenisContextValue = {
    lenis: lenisRef.current?.lenis || null,
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

export const useLenis = () => {
  const context = useContext(LenisContext)
  if (!context) {
    throw new Error('useLenis must be used within a LenisProvider')
  }
  return context
}

export default LenisProvider