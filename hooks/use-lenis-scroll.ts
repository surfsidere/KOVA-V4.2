"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useLenis } from '@/providers/LenisProvider'
import { useReducedMotion } from './use-reduced-motion'

interface LenisScrollOptions {
  spring?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
  onScroll?: (data: {
    scroll: number;
    progress: number;
    velocity: number;
    direction: 'up' | 'down';
  }) => void;
  throttle?: number;
}

export const useLenisScroll = (options: LenisScrollOptions = {}) => {
  const { lenis, scrollState, isReady } = useLenis()
  const prefersReducedMotion = useReducedMotion()
  const lastCallTime = useRef(0)
  
  // Default spring configuration
  const springConfig = {
    stiffness: 80,
    damping: 18,
    mass: 0.4,
    ...options.spring
  }
  
  // Motion values for smooth animations
  const scrollY = useMotionValue(0)
  const scrollProgress = useMotionValue(0)
  const velocity = useMotionValue(0)
  
  // Spring-animated values
  const smoothScrollY = useSpring(scrollY, springConfig)
  const smoothProgress = useSpring(scrollProgress, springConfig)
  const smoothVelocity = useSpring(velocity, springConfig)
  
  // Throttled scroll callback
  const throttledCallback = useCallback((data: any) => {
    const now = Date.now()
    const throttleTime = options.throttle || 16 // ~60fps
    
    if (now - lastCallTime.current >= throttleTime) {
      options.onScroll?.(data)
      lastCallTime.current = now
    }
  }, [options.onScroll, options.throttle])
  
  // Update motion values when scroll state changes
  useEffect(() => {
    if (!isReady || !lenis) return
    
    const updateValues = () => {
      const currentScroll = lenis.scroll || 0
      const limit = lenis.limit || 1
      const currentVelocity = lenis.velocity || 0
      const progress = limit > 0 ? currentScroll / limit : 0
      
      // Update motion values
      scrollY.set(currentScroll)
      scrollProgress.set(progress)
      velocity.set(currentVelocity)
      
      // Call throttled callback
      if (options.onScroll) {
        throttledCallback({
          scroll: currentScroll,
          progress,
          velocity: currentVelocity,
          direction: currentVelocity > 0 ? 'down' : 'up'
        })
      }
    }
    
    // Listen to scroll events
    lenis.on('scroll', updateValues)
    
    return () => {
      lenis.off('scroll', updateValues)
    }
  }, [isReady, lenis, scrollY, scrollProgress, velocity, throttledCallback, options.onScroll])
  
  // Scroll to function with enhanced options
  const scrollTo = useCallback((target: string | number | Element, scrollOptions?: any) => {
    if (!lenis) return
    
    // Create easing function at runtime to avoid serialization
    const runtimeEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    
    const defaultOptions = {
      offset: 0,
      duration: 1.2,
      easing: runtimeEasing,
      immediate: prefersReducedMotion,
      ...scrollOptions
    }
    
    lenis.scrollTo(target, defaultOptions)
  }, [lenis, prefersReducedMotion])
  
  // Create transform functions
  const createTransform = useCallback((inputRange: number[], outputRange: any[]) => {
    return useTransform(smoothProgress, inputRange, outputRange)
  }, [smoothProgress])
  
  const createScrollTransform = useCallback((inputRange: number[], outputRange: any[]) => {
    return useTransform(smoothScrollY, inputRange, outputRange)
  }, [smoothScrollY])
  
  const createVelocityTransform = useCallback((multiplier: number = 1) => {
    return useTransform(smoothVelocity, (vel) => vel * multiplier)
  }, [smoothVelocity])
  
  return {
    // Raw values
    scrollY: smoothScrollY,
    scrollProgress: smoothProgress,
    velocity: smoothVelocity,
    
    // Scroll state
    isScrolling: scrollState.isScrolling,
    direction: scrollState.direction,
    progress: scrollState.progress,
    
    // Control functions
    scrollTo,
    
    // Transform creators
    createTransform,
    createScrollTransform,
    createVelocityTransform,
    
    // Ready state
    isReady,
  }
}