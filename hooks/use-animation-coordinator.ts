"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion'
import { useAnimation } from '@/providers/AnimationProvider'
import { useLenisScroll } from './use-lenis-scroll'
import { useSectionManager } from './use-section-manager'
import { Animation } from '@/types/scroll.types'

interface AnimationCoordinatorOptions {
  sectionId?: string;
  autoCleanup?: boolean;
  performanceMode?: 'smooth' | 'performance' | 'battery';
}

interface CoordinatedAnimation extends Animation {
  motionValue: MotionValue<any>;
  isActive: boolean;
  lastUpdate: number;
}

export const useAnimationCoordinator = (options: AnimationCoordinatorOptions = {}) => {
  const { 
    registerAnimation, 
    unregisterAnimation, 
    createScrollTransform, 
    createVelocityTransform,
    isAnimationActive 
  } = useAnimation()
  
  const { progress, velocity, createTransform } = useLenisScroll({
    throttle: options.performanceMode === 'performance' ? 33 : 16 // 30fps vs 60fps
  })
  
  const [animations, setAnimations] = useState<Map<string, CoordinatedAnimation>>(new Map())
  const rafRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)
  
  // Performance configurations
  const performanceConfig = {
    smooth: { updateInterval: 16, springStiffness: 80, springDamping: 18 },
    performance: { updateInterval: 33, springStiffness: 60, springDamping: 20 },
    battery: { updateInterval: 50, springStiffness: 40, springDamping: 25 },
  }
  
  const config = performanceConfig[options.performanceMode || 'smooth']
  
  // Create scroll-based animation
  const createScrollAnimation = useCallback((
    id: string,
    inputRange: number[],
    outputRange: any[],
    animationOptions?: Partial<Animation>
  ) => {
    const motionValue = useMotionValue(outputRange[0])
    const transform = createTransform(inputRange, outputRange)
    
    const animation: CoordinatedAnimation = {
      id,
      type: 'slide',
      duration: 1,
      easing: 'easeInOut',
      properties: { inputRange, outputRange },
      motionValue,
      isActive: false,
      lastUpdate: 0,
      ...animationOptions,
    }
    
    // Register animation
    registerAnimation(animation)
    setAnimations(prev => new Map(prev).set(id, animation))
    
    // Update motion value based on scroll progress
    useEffect(() => {
      const unsubscribe = transform.onChange((value) => {
        animation.motionValue.set(value)
        animation.lastUpdate = Date.now()
      })
      
      return unsubscribe
    }, [transform])
    
    return {
      motionValue,
      animation,
      remove: () => removeAnimation(id),
    }
  }, [createTransform, registerAnimation])
  
  // Create velocity-based animation
  const createVelocityAnimation = useCallback((
    id: string,
    multiplier: number = 1,
    animationOptions?: Partial<Animation>
  ) => {
    const motionValue = useMotionValue(0)
    const velocityTransform = createVelocityTransform(multiplier)
    
    const animation: CoordinatedAnimation = {
      id,
      type: 'slide',
      duration: 0.5,
      easing: 'easeOut',
      properties: { multiplier },
      motionValue,
      isActive: false,
      lastUpdate: 0,
      ...animationOptions,
    }
    
    registerAnimation(animation)
    setAnimations(prev => new Map(prev).set(id, animation))
    
    useEffect(() => {
      const unsubscribe = velocityTransform.onChange((value) => {
        animation.motionValue.set(value)
        animation.lastUpdate = Date.now()
      })
      
      return unsubscribe
    }, [velocityTransform])
    
    return {
      motionValue,
      animation,
      remove: () => removeAnimation(id),
    }
  }, [createVelocityTransform, registerAnimation])
  
  // Create spring-animated value
  const createSpringAnimation = useCallback((
    id: string,
    initialValue: any = 0,
    springOptions?: {
      stiffness?: number;
      damping?: number;
      mass?: number;
    }
  ) => {
    const sourceValue = useMotionValue(initialValue)
    const springValue = useSpring(sourceValue, {
      stiffness: config.springStiffness,
      damping: config.springDamping,
      mass: 0.4,
      ...springOptions,
    })
    
    const animation: CoordinatedAnimation = {
      id,
      type: 'fade',
      duration: 0.8,
      easing: 'spring',
      properties: { initialValue, springOptions },
      motionValue: springValue,
      isActive: false,
      lastUpdate: 0,
    }
    
    registerAnimation(animation)
    setAnimations(prev => new Map(prev).set(id, animation))
    
    return {
      motionValue: springValue,
      sourceValue,
      animation,
      remove: () => removeAnimation(id),
      update: (newValue: any) => sourceValue.set(newValue),
    }
  }, [config.springStiffness, config.springDamping, registerAnimation])
  
  // Create parallax animation
  const createParallaxAnimation = useCallback((
    id: string,
    strength: number = 0.5,
    direction: 'vertical' | 'horizontal' = 'vertical'
  ) => {
    const motionValue = useMotionValue(0)
    
    const animation: CoordinatedAnimation = {
      id,
      type: 'slide',
      duration: 0,
      easing: 'linear',
      properties: { strength, direction },
      motionValue,
      isActive: false,
      lastUpdate: 0,
    }
    
    registerAnimation(animation)
    setAnimations(prev => new Map(prev).set(id, animation))
    
    // Update parallax based on scroll
    useEffect(() => {
      const updateParallax = () => {
        const scrollValue = progress * window.innerHeight
        const parallaxValue = direction === 'vertical' 
          ? scrollValue * strength 
          : scrollValue * strength * 0.5
        
        motionValue.set(parallaxValue)
        animation.lastUpdate = Date.now()
      }
      
      const unsubscribe = createTransform([0, 1], [0, 1]).onChange(updateParallax)
      return unsubscribe
    }, [progress, strength, direction, motionValue, createTransform])
    
    return {
      motionValue,
      animation,
      remove: () => removeAnimation(id),
    }
  }, [progress, createTransform, registerAnimation])
  
  // Remove animation
  const removeAnimation = useCallback((id: string) => {
    unregisterAnimation(id)
    setAnimations(prev => {
      const newAnimations = new Map(prev)
      newAnimations.delete(id)
      return newAnimations
    })
  }, [unregisterAnimation])
  
  // Get animation by ID
  const getAnimation = useCallback((id: string) => {
    return animations.get(id)
  }, [animations])
  
  // Update animation active states
  useEffect(() => {
    const updateAnimationStates = () => {
      const now = Date.now()
      
      // Skip update if too recent (performance optimization)
      if (now - lastUpdateRef.current < config.updateInterval) {
        return
      }
      
      setAnimations(prev => {
        const newAnimations = new Map(prev)
        
        newAnimations.forEach((animation, id) => {
          const wasActive = animation.isActive
          const isActive = options.sectionId ? 
            isAnimationActive(id) : 
            true // Global animations are always active
          
          if (wasActive !== isActive) {
            newAnimations.set(id, { ...animation, isActive })
          }
        })
        
        return newAnimations
      })
      
      lastUpdateRef.current = now
    }
    
    // Start RAF loop
    const animate = () => {
      updateAnimationStates()
      rafRef.current = requestAnimationFrame(animate)
    }
    
    rafRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [config.updateInterval, options.sectionId, isAnimationActive])
  
  // Auto-cleanup inactive animations
  useEffect(() => {
    if (!options.autoCleanup) return
    
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const inactiveThreshold = 30000 // 30 seconds
      
      setAnimations(prev => {
        const newAnimations = new Map(prev)
        
        newAnimations.forEach((animation, id) => {
          if (!animation.isActive && (now - animation.lastUpdate) > inactiveThreshold) {
            newAnimations.delete(id)
            unregisterAnimation(id)
          }
        })
        
        return newAnimations
      })
    }, 60000) // Check every minute
    
    return () => clearInterval(cleanupInterval)
  }, [options.autoCleanup, unregisterAnimation])
  
  // Cleanup all animations on unmount
  useEffect(() => {
    return () => {
      animations.forEach((_, id) => {
        unregisterAnimation(id)
      })
    }
  }, [animations, unregisterAnimation])
  
  return {
    // Animation creators
    createScrollAnimation,
    createVelocityAnimation,
    createSpringAnimation,
    createParallaxAnimation,
    
    // Animation management
    removeAnimation,
    getAnimation,
    
    // State
    animations: Array.from(animations.values()),
    activeAnimations: Array.from(animations.values()).filter(a => a.isActive),
    
    // Utilities
    progress,
    velocity,
  }
}