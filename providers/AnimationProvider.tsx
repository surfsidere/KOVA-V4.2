"use client"

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Animation, AnimationTimeline } from '@/types/scroll.types'
import { useLenis } from './LenisProvider'
import { useSection } from './SectionProvider'

interface AnimationContextValue {
  timeline: AnimationTimeline;
  registerAnimation: (animation: Animation) => void;
  unregisterAnimation: (animationId: string) => void;
  getAnimation: (animationId: string) => Animation | undefined;
  updateAnimation: (animationId: string, updates: Partial<Animation>) => void;
  createScrollTransform: (inputRange: number[], outputRange: any[]) => any;
  createVelocityTransform: (multiplier?: number) => any;
  isAnimationActive: (animationId: string) => boolean;
}

const AnimationContext = createContext<AnimationContextValue | null>(null)

// Optimized spring configurations
const springConfigs = {
  smooth: { stiffness: 80, damping: 18, mass: 0.4, restSpeed: 0.01 },
  responsive: { stiffness: 120, damping: 20, mass: 0.3, restSpeed: 0.01 },
  slow: { stiffness: 40, damping: 25, mass: 0.8, restSpeed: 0.005 },
  bouncy: { stiffness: 200, damping: 12, mass: 0.2, restSpeed: 0.02 },
}

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scrollState, lenis } = useLenis()
  const { activeSection, sections } = useSection()
  const [animations, setAnimations] = useState<Map<string, Animation>>(new Map())
  
  // Motion values for global animation coordination
  const scrollProgress = useMotionValue(0)
  const sectionProgress = useMotionValue(0)
  const globalVelocity = useMotionValue(0)
  
  // Spring-animated values for smooth transitions
  const smoothScrollProgress = useSpring(scrollProgress, springConfigs.smooth)
  const smoothSectionProgress = useSpring(sectionProgress, springConfigs.responsive)
  const smoothVelocity = useSpring(globalVelocity, springConfigs.smooth)

  // Animation timeline state
  const timeline: AnimationTimeline = {
    scrollProgress: scrollState.progress,
    sectionProgress: 0, // Will be calculated based on active section
    globalVelocity: scrollState.velocity,
    animations,
  }

  // Register animation
  const registerAnimation = useCallback((animation: Animation) => {
    setAnimations(prev => new Map(prev).set(animation.id, animation))
  }, [])

  // Unregister animation
  const unregisterAnimation = useCallback((animationId: string) => {
    setAnimations(prev => {
      const newAnimations = new Map(prev)
      newAnimations.delete(animationId)
      return newAnimations
    })
  }, [])

  // Get animation by ID
  const getAnimation = useCallback((animationId: string): Animation | undefined => {
    return animations.get(animationId)
  }, [animations])

  // Update animation properties
  const updateAnimation = useCallback((animationId: string, updates: Partial<Animation>) => {
    setAnimations(prev => {
      const newAnimations = new Map(prev)
      const animation = newAnimations.get(animationId)
      
      if (animation) {
        newAnimations.set(animationId, { ...animation, ...updates })
      }
      
      return newAnimations
    })
  }, [])

  // Create scroll-based transform
  const createScrollTransform = useCallback((inputRange: number[], outputRange: any[]) => {
    return useTransform(smoothScrollProgress, inputRange, outputRange)
  }, [smoothScrollProgress])

  // Create velocity-based transform
  const createVelocityTransform = useCallback((multiplier: number = 1) => {
    return useTransform(smoothVelocity, (velocity) => velocity * multiplier)
  }, [smoothVelocity])

  // Check if animation is currently active
  const isAnimationActive = useCallback((animationId: string): boolean => {
    const animation = animations.get(animationId)
    if (!animation) return false
    
    // Check if animation should be active based on current section and scroll progress
    const currentSection = activeSection ? sections.get(activeSection) : null
    
    if (!currentSection) return false
    
    // Animation is active if we're in the right section and scroll range
    return currentSection.animations.some(anim => anim.id === animationId) &&
           scrollState.progress >= currentSection.triggerStart &&
           scrollState.progress <= currentSection.triggerEnd
  }, [animations, activeSection, sections, scrollState.progress])

  // Update motion values when scroll state changes
  useEffect(() => {
    scrollProgress.set(scrollState.progress)
    globalVelocity.set(scrollState.velocity)
    
    // Calculate section-specific progress
    if (activeSection) {
      const section = sections.get(activeSection)
      if (section) {
        const sectionRange = section.triggerEnd - section.triggerStart
        const sectionScrollProgress = sectionRange > 0 
          ? (scrollState.progress - section.triggerStart) / sectionRange 
          : 0
        
        sectionProgress.set(Math.max(0, Math.min(1, sectionScrollProgress)))
      }
    }
  }, [scrollState.progress, scrollState.velocity, activeSection, sections, scrollProgress, globalVelocity, sectionProgress])

  // Performance optimization: cleanup unused animations
  useEffect(() => {
    const cleanup = () => {
      setAnimations(prev => {
        const newAnimations = new Map()
        
        // Keep only animations that are referenced by current sections
        prev.forEach((animation, id) => {
          const isReferenced = Array.from(sections.values()).some(section =>
            section.animations.some(anim => anim.id === id)
          )
          
          if (isReferenced) {
            newAnimations.set(id, animation)
          }
        })
        
        return newAnimations
      })
    }

    // Run cleanup every 30 seconds
    const intervalId = setInterval(cleanup, 30000)
    
    return () => clearInterval(intervalId)
  }, [sections])

  // Enhanced RAF coordination with error handling
  useEffect(() => {
    let isActive = true
    
    const updateAnimations = () => {
      if (!isActive) return
      
      try {
        // Update timeline state
        timeline.scrollProgress = scrollState.progress
        timeline.globalVelocity = scrollState.velocity
        
        // Process active animations
        animations.forEach((animation, id) => {
          if (isAnimationActive(id)) {
            // Animation processing logic here
            // This is where specific animation updates would be handled
          }
        })
      } catch (error) {
        console.warn('Animation update error:', error)
      }
      
      requestAnimationFrame(updateAnimations)
    }
    
    updateAnimations()
    
    return () => {
      isActive = false
    }
  }, [scrollState, animations, activeSection, isAnimationActive])

  const contextValue: AnimationContextValue = {
    timeline,
    registerAnimation,
    unregisterAnimation,
    getAnimation,
    updateAnimation,
    createScrollTransform,
    createVelocityTransform,
    isAnimationActive,
  }

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  )
}

export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}

export default AnimationProvider