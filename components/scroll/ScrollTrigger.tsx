"use client"

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'
import { cn } from '@/lib/utils'

interface ScrollTriggerProps {
  children: React.ReactNode;
  start?: number | string; // scroll position to start (0-1 or 'top', 'center', 'bottom')
  end?: number | string;   // scroll position to end
  scrub?: boolean | number; // Link animation to scroll position
  pin?: boolean;           // Pin element during scroll
  markers?: boolean;       // Show debug markers
  onEnter?: () => void;
  onLeave?: () => void;
  onUpdate?: (progress: number) => void;
  className?: string;
  animation?: {
    from: Record<string, any>;
    to: Record<string, any>;
    ease?: string;
  };
  parallax?: {
    strength: number;
    direction?: 'vertical' | 'horizontal';
  };
  fade?: boolean;
  scale?: {
    from: number;
    to: number;
  };
  rotate?: {
    from: number;
    to: number;
  };
  translate?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
}

export const ScrollTrigger: React.FC<ScrollTriggerProps> = ({
  children,
  start = 0,
  end = 1,
  scrub = false,
  pin = false,
  markers = false,
  onEnter,
  onLeave,
  onUpdate,
  className,
  animation,
  parallax,
  fade = false,
  scale,
  rotate,
  translate,
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [progress, setProgress] = useState(0)
  const hasTriggered = useRef(false)
  
  const { progress: scrollProgress } = useLenisScroll()
  const { createScrollAnimation, createParallaxAnimation } = useAnimationCoordinator({
    autoCleanup: true,
  })
  
  // Convert string positions to numbers
  const normalizePosition = useCallback((pos: number | string): number => {
    if (typeof pos === 'number') return pos
    
    switch (pos) {
      case 'top': return 0
      case 'center': return 0.5
      case 'bottom': return 1
      default: return 0
    }
  }, [])
  
  const startPos = normalizePosition(start)
  const endPos = normalizePosition(end)
  
  // Create animations based on props
  const triggerAnimations = useRef<Map<string, any>>(new Map())
  
  // Initialize animations
  useEffect(() => {
    const animationId = `trigger-${Math.random().toString(36).substr(2, 9)}`
    
    // Fade animation
    if (fade) {
      const fadeAnim = createScrollAnimation(
        `${animationId}-fade`,
        [startPos, startPos + 0.1, endPos - 0.1, endPos],
        [0, 1, 1, 0]
      )
      triggerAnimations.current.set('fade', fadeAnim)
    }
    
    // Scale animation
    if (scale) {
      const scaleAnim = createScrollAnimation(
        `${animationId}-scale`,
        [startPos, endPos],
        [scale.from, scale.to]
      )
      triggerAnimations.current.set('scale', scaleAnim)
    }
    
    // Rotate animation
    if (rotate) {
      const rotateAnim = createScrollAnimation(
        `${animationId}-rotate`,
        [startPos, endPos],
        [rotate.from, rotate.to]
      )
      triggerAnimations.current.set('rotate', rotateAnim)
    }
    
    // Translate animations
    if (translate?.x) {
      const translateXAnim = createScrollAnimation(
        `${animationId}-translateX`,
        [startPos, endPos],
        translate.x
      )
      triggerAnimations.current.set('translateX', translateXAnim)
    }
    
    if (translate?.y) {
      const translateYAnim = createScrollAnimation(
        `${animationId}-translateY`,
        [startPos, endPos],
        translate.y
      )
      triggerAnimations.current.set('translateY', translateYAnim)
    }
    
    if (translate?.z) {
      const translateZAnim = createScrollAnimation(
        `${animationId}-translateZ`,
        [startPos, endPos],
        translate.z
      )
      triggerAnimations.current.set('translateZ', translateZAnim)
    }
    
    // Parallax animation
    if (parallax) {
      const parallaxAnim = createParallaxAnimation(
        `${animationId}-parallax`,
        parallax.strength,
        parallax.direction
      )
      triggerAnimations.current.set('parallax', parallaxAnim)
    }
    
    // Custom animation
    if (animation) {
      // Create custom animation based on from/to properties
      Object.keys(animation.from).forEach(property => {
        const customAnim = createScrollAnimation(
          `${animationId}-${property}`,
          [startPos, endPos],
          [animation.from[property], animation.to[property]]
        )
        triggerAnimations.current.set(property, customAnim)
      })
    }
    
    return () => {
      // Cleanup animations - capture current value to avoid stale closure
      const currentAnimations = triggerAnimations.current
      if (currentAnimations) {
        currentAnimations.clear()
      }
    }
  }, [startPos, endPos, fade, scale, rotate, translate, parallax, animation, createScrollAnimation, createParallaxAnimation])
  
  // Monitor scroll progress and trigger callbacks
  useEffect(() => {
    const currentProgress = scrollProgress
    const isCurrentlyInView = currentProgress >= startPos && currentProgress <= endPos
    const triggerProgress = endPos > startPos ? 
      Math.max(0, Math.min(1, (currentProgress - startPos) / (endPos - startPos))) : 0
    
    // Update progress
    setProgress(triggerProgress)
    onUpdate?.(triggerProgress)
    
    // Handle enter/leave callbacks
    if (isCurrentlyInView !== isInView) {
      setIsInView(isCurrentlyInView)
      
      if (isCurrentlyInView && !hasTriggered.current) {
        hasTriggered.current = true
        onEnter?.()
      } else if (!isCurrentlyInView && hasTriggered.current) {
        hasTriggered.current = false
        onLeave?.()
      }
    }
  }, [scrollProgress, startPos, endPos, isInView, onEnter, onLeave, onUpdate])
  
  // Calculate transform values
  const getTransformValue = useCallback(() => {
    const transforms: string[] = []
    
    // Get values from animations
    const fadeValue = triggerAnimations.current.get('fade')?.motionValue.get() ?? 1
    const scaleValue = triggerAnimations.current.get('scale')?.motionValue.get() ?? 1
    const rotateValue = triggerAnimations.current.get('rotate')?.motionValue.get() ?? 0
    const translateXValue = triggerAnimations.current.get('translateX')?.motionValue.get() ?? 0
    const translateYValue = triggerAnimations.current.get('translateY')?.motionValue.get() ?? 0
    const translateZValue = triggerAnimations.current.get('translateZ')?.motionValue.get() ?? 0
    const parallaxValue = triggerAnimations.current.get('parallax')?.motionValue.get() ?? 0
    
    // Build transform string
    if (translateXValue !== 0 || translateYValue !== 0 || translateZValue !== 0 || parallaxValue !== 0) {
      transforms.push(`translate3d(${translateXValue}px, ${translateYValue + parallaxValue}px, ${translateZValue}px)`)
    }
    
    if (scaleValue !== 1) {
      transforms.push(`scale(${scaleValue})`)
    }
    
    if (rotateValue !== 0) {
      transforms.push(`rotate(${rotateValue}deg)`)
    }
    
    // Add custom animation transforms
    if (animation) {
      Object.keys(animation.from).forEach(property => {
        if (!['opacity', 'scale', 'rotate', 'x', 'y', 'z'].includes(property)) {
          const value = triggerAnimations.current.get(property)?.motionValue.get()
          if (value !== undefined) {
            transforms.push(`${property}(${value})`)
          }
        }
      })
    }
    
    return transforms.join(' ') || 'none'
  }, [animation])
  
  // Pin element styles
  const pinStyles = pin ? {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: `${getTransformValue()} translate(-50%, -50%)`,
    zIndex: 1000,
  } : {}
  
  // Debug markers
  const DebugMarkers = markers && (
    <>
      <div 
        className="fixed left-0 w-full h-px bg-green-500 z-50 pointer-events-none"
        style={{ top: `${startPos * 100}%` }}
      >
        <span className="absolute left-2 -top-4 text-xs text-green-500 bg-black px-1">
          Start: {startPos}
        </span>
      </div>
      <div 
        className="fixed left-0 w-full h-px bg-red-500 z-50 pointer-events-none"
        style={{ top: `${endPos * 100}%` }}
      >
        <span className="absolute left-2 -top-4 text-xs text-red-500 bg-black px-1">
          End: {endPos}
        </span>
      </div>
    </>
  )
  
  return (
    <>
      {DebugMarkers}
      <motion.div
        ref={elementRef}
        className={cn(
          'scroll-trigger',
          {
            'scroll-trigger-active': isInView,
            'scroll-trigger-pinned': pin,
          },
          className
        )}
        style={{
          ...pinStyles,
          opacity: fade ? (triggerAnimations.current.get('fade')?.motionValue.get() ?? 1) : 1,
          transform: pin ? pinStyles.transform : getTransformValue(),
          willChange: 'transform, opacity',
          ...(!pin && {
            '--scroll-progress': progress,
            '--scroll-in-view': isInView ? 1 : 0,
          }),
        }}
        data-scroll-trigger
        data-start={startPos}
        data-end={endPos}
        data-progress={progress}
        data-in-view={isInView}
      >
        {children}
      </motion.div>
    </>
  )
}

export default ScrollTrigger