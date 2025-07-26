"use client"

import React, { useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'
import { cn } from '@/lib/utils'

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;              // Parallax speed multiplier (-1 to 1)
  direction?: 'vertical' | 'horizontal' | 'both';
  offset?: number;             // Initial offset
  className?: string;
  style?: React.CSSProperties;
  easing?: 'linear' | 'smooth' | 'spring';
  bounds?: {                   // Limit parallax within bounds
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  disabled?: boolean;          // Disable parallax
  debugMode?: boolean;         // Show debug information
  onProgressChange?: (progress: number, offset: number) => void;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.5,
  direction = 'vertical',
  offset = 0,
  className,
  style,
  easing = 'smooth',
  bounds,
  disabled = false,
  debugMode = false,
  onProgressChange,
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const { progress, velocity, scrollProgress } = useLenisScroll()
  const { createParallaxAnimation } = useAnimationCoordinator()
  
  // Motion values for smooth animations
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Spring configurations based on easing
  const springConfigs = {
    linear: { stiffness: 100, damping: 30, mass: 0.1 },
    smooth: { stiffness: 80, damping: 18, mass: 0.4 },
    spring: { stiffness: 60, damping: 15, mass: 0.8 },
  }
  
  // Create spring-animated values (always call hooks)
  const springXAnimated = useSpring(x, springConfigs[easing] || springConfigs.linear)
  const springYAnimated = useSpring(y, springConfigs[easing] || springConfigs.linear)
  
  // Use animated values only when easing is not linear
  const springX = easing !== 'linear' ? springXAnimated : x
  const springY = easing !== 'linear' ? springYAnimated : y
  
  // Calculate parallax offset
  const calculateParallaxOffset = useCallback((scrollProgress: number): { x: number; y: number } => {
    if (disabled) return { x: 0, y: 0 }
    
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
    
    let offsetX = 0
    let offsetY = 0
    
    // Calculate base offset
    const scrollDistance = scrollProgress * viewportHeight
    const parallaxDistance = scrollDistance * speed
    
    // Apply direction
    if (direction === 'vertical' || direction === 'both') {
      offsetY = parallaxDistance + offset
    }
    
    if (direction === 'horizontal' || direction === 'both') {
      offsetX = parallaxDistance * 0.5 + (offset * 0.5) // Reduce horizontal impact
    }
    
    // Apply bounds if specified
    if (bounds) {
      if (bounds.top !== undefined) offsetY = Math.max(bounds.top, offsetY)
      if (bounds.bottom !== undefined) offsetY = Math.min(bounds.bottom, offsetY)
      if (bounds.left !== undefined) offsetX = Math.max(bounds.left, offsetX)
      if (bounds.right !== undefined) offsetX = Math.min(bounds.right, offsetX)
    }
    
    return { x: offsetX, y: offsetY }
  }, [disabled, speed, direction, offset, bounds])
  
  // Update parallax position
  useEffect(() => {
    const updateParallax = () => {
      const { x: offsetX, y: offsetY } = calculateParallaxOffset(progress)
      
      x.set(offsetX)
      y.set(offsetY)
      
      // Call progress callback
      onProgressChange?.(progress, Math.sqrt(offsetX * offsetX + offsetY * offsetY))
    }
    
    updateParallax()
  }, [progress, calculateParallaxOffset, x, y, onProgressChange])
  
  // Velocity-based enhancement
  const velocityMultiplier = useTransform(
    velocity,
    [-50, 0, 50],
    [0.8, 1, 1.2]
  )
  
  // Enhanced transform with velocity
  const enhancedX = useTransform(
    [springX, velocityMultiplier],
    ([xVal, velMult]: number[]) => xVal * velMult
  )
  
  const enhancedY = useTransform(
    [springY, velocityMultiplier],
    ([yVal, velMult]: number[]) => yVal * velMult
  )
  
  // Performance optimization: Use will-change appropriately
  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current
      
      if (!disabled && Math.abs(speed) > 0.01) {
        element.style.willChange = 'transform'
      } else {
        element.style.willChange = 'auto'
      }
      
      return () => {
        element.style.willChange = 'auto'
      }
    }
  }, [disabled, speed])
  
  // Debug information
  const debugInfo = debugMode && (
    <div className="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Speed: {speed}</div>
      <div>Direction: {direction}</div>
      <div>Progress: {progress.toFixed(3)}</div>
      <div>X: {springX.get().toFixed(1)}px</div>
      <div>Y: {springY.get().toFixed(1)}px</div>
      <div>Velocity: {velocity.get().toFixed(2)}</div>
      <div>Disabled: {disabled.toString()}</div>
    </div>
  )
  
  return (
    <motion.div
      ref={elementRef}
      className={cn(
        'parallax-layer',
        {
          'parallax-disabled': disabled,
          [`parallax-${direction}`]: direction,
          [`parallax-${easing}`]: easing,
        },
        className
      )}
      style={{
        ...style,
        transform: disabled ? 'none' : undefined,
        backfaceVisibility: 'hidden', // Improve performance
        perspective: 1000,
      }}
      animate={{
        x: disabled ? 0 : enhancedX,
        y: disabled ? 0 : enhancedY,
      }}
      transition={{
        type: easing === 'spring' ? 'spring' : 'tween',
        ease: easing === 'linear' ? 'linear' : [0.25, 0.1, 0.25, 1],
        duration: easing === 'linear' ? 0 : 0.6,
      }}
      data-parallax-speed={speed}
      data-parallax-direction={direction}
      data-parallax-disabled={disabled}
    >
      {debugInfo}
      {children}
    </motion.div>
  )
}

// Preset parallax components for common use cases
export const ParallaxBackground: React.FC<Omit<ParallaxLayerProps, 'speed' | 'direction'>> = (props) => (
  <ParallaxLayer speed={-0.5} direction="vertical" {...props} />
)

export const ParallaxForeground: React.FC<Omit<ParallaxLayerProps, 'speed' | 'direction'>> = (props) => (
  <ParallaxLayer speed={0.3} direction="vertical" {...props} />
)

export const ParallaxFloat: React.FC<Omit<ParallaxLayerProps, 'speed' | 'direction' | 'easing'>> = (props) => (
  <ParallaxLayer speed={0.2} direction="both" easing="spring" {...props} />
)

// Hook for custom parallax implementations
export const useParallax = (speed: number = 0.5, direction: 'vertical' | 'horizontal' | 'both' = 'vertical') => {
  const { progress } = useLenisScroll()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  useEffect(() => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000
    const scrollDistance = progress * viewportHeight
    const parallaxDistance = scrollDistance * speed
    
    if (direction === 'vertical' || direction === 'both') {
      y.set(parallaxDistance)
    }
    
    if (direction === 'horizontal' || direction === 'both') {
      x.set(parallaxDistance * 0.5)
    }
  }, [progress, speed, direction, x, y])
  
  return { x, y, progress }
}

export default ParallaxLayer