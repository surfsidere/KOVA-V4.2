"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSectionManager } from '@/hooks/use-section-manager'
import { useZIndexOrchestrator } from '@/hooks/use-z-index-orchestrator'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'
import { ContrastMode, Animation, ZLayers } from '@/types/scroll.types'
import { cn } from '@/lib/utils'

interface ScrollSectionProps {
  id: string;
  triggerStart: number;
  triggerEnd: number;
  children: React.ReactNode;
  className?: string;
  zIndex?: number;
  layer?: ZLayers;
  contrast?: ContrastMode;
  animations?: Animation[];
  onEnter?: () => void;
  onLeave?: () => void;
  onProgress?: (progress: number) => void;
  parallaxStrength?: number;
  fadeEffect?: boolean;
  scaleEffect?: boolean;
  slideDirection?: 'up' | 'down' | 'left' | 'right';
  style?: React.CSSProperties;
}

export interface ScrollSectionRef {
  element: HTMLElement | null;
  scrollToSection: () => void;
  getSectionProgress: () => number;
  isActive: boolean;
}

export const ScrollSection = forwardRef<ScrollSectionRef, ScrollSectionProps>(({
  id,
  triggerStart,
  triggerEnd,
  children,
  className,
  zIndex,
  layer = ZLayers.CONTENT_BASE,
  contrast = 'auto',
  animations = [],
  onEnter,
  onLeave,
  onProgress,
  parallaxStrength = 0,
  fadeEffect = false,
  scaleEffect = false,
  slideDirection,
  style,
  ...props
}, ref) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // Hooks for section management
  const {
    isActive,
    sectionProgress,
    registerElement,
    scrollToSection,
    section,
  } = useSectionManager({
    id,
    triggerStart,
    triggerEnd,
    zIndex,
    animations,
    contrast,
    onEnter,
    onLeave,
    onProgress,
  })
  
  const { addRule, getZIndexState } = useZIndexOrchestrator()
  const { 
    createScrollAnimation, 
    createParallaxAnimation,
    createSpringAnimation 
  } = useAnimationCoordinator({
    sectionId: id,
    autoCleanup: true,
  })
  
  // Register element with section manager
  useEffect(() => {
    if (sectionRef.current) {
      registerElement(sectionRef.current)
    }
  }, [registerElement])
  
  // Set up z-index rules
  useEffect(() => {
    if (layer !== ZLayers.CONTENT_BASE) {
      addRule({
        sectionId: id,
        layer,
        priority: zIndex || 100,
      })
    }
  }, [id, layer, zIndex, addRule])
  
  // Create section animations
  const fadeAnimation = fadeEffect ? 
    createScrollAnimation(
      `${id}-fade`,
      [triggerStart, triggerStart + 0.1, triggerEnd - 0.1, triggerEnd],
      [0, 1, 1, 0]
    ) : null
  
  const scaleAnimation = scaleEffect ?
    createScrollAnimation(
      `${id}-scale`,
      [triggerStart, triggerStart + 0.2, triggerEnd - 0.2, triggerEnd],
      [0.8, 1, 1, 0.8]
    ) : null
  
  const parallaxAnimation = parallaxStrength !== 0 ?
    createParallaxAnimation(`${id}-parallax`, parallaxStrength) : null
  
  // Slide animation based on direction
  const slideAnimation = slideDirection ?
    createScrollAnimation(
      `${id}-slide`,
      [triggerStart, triggerStart + 0.3, triggerEnd - 0.3, triggerEnd],
      slideDirection === 'up' ? [50, 0, 0, -50] :
      slideDirection === 'down' ? [-50, 0, 0, 50] :
      slideDirection === 'left' ? [50, 0, 0, -50] :
      [-50, 0, 0, 50]
    ) : null
  
  // Spring animation for smooth transitions
  const springAnimation = createSpringAnimation(`${id}-spring`, isActive ? 1 : 0)
  
  // Update spring animation based on active state
  useEffect(() => {
    springAnimation.update(isActive ? 1 : 0)
  }, [isActive, springAnimation])
  
  // Imperative handle for ref
  useImperativeHandle(ref, () => ({
    element: sectionRef.current,
    scrollToSection,
    getSectionProgress: () => sectionProgress,
    isActive,
  }), [sectionProgress, isActive, scrollToSection])
  
  // Calculate dynamic styles
  const dynamicStyles: React.CSSProperties = {
    ...style,
    zIndex: getZIndexState(id)?.assignedIndex || zIndex || 'auto',
    opacity: fadeAnimation?.motionValue.get() ?? 1,
    transform: [
      scaleAnimation ? `scale(${scaleAnimation.motionValue.get()})` : '',
      parallaxAnimation ? `translate3d(0, ${parallaxAnimation.motionValue.get()}px, 0)` : '',
      slideAnimation ? 
        (slideDirection === 'left' || slideDirection === 'right' ? 
          `translateX(${slideAnimation.motionValue.get()}px)` :
          `translateY(${slideAnimation.motionValue.get()}px)`) : '',
    ].filter(Boolean).join(' ') || undefined,
    willChange: 'transform, opacity',
  }
  
  // CSS custom properties for section state
  const cssProperties = {
    '--section-progress': sectionProgress,
    '--section-active': isActive ? 1 : 0,
    '--section-trigger-start': triggerStart,
    '--section-trigger-end': triggerEnd,
    '--section-z-index': getZIndexState(id)?.assignedIndex || zIndex || 0,
  } as React.CSSProperties
  
  return (
    <motion.div
      ref={sectionRef}
      className={cn(
        'scroll-section',
        `scroll-section-${id}`,
        `contrast-${contrast}`,
        {
          'scroll-section-active': isActive,
          'scroll-section-transitioning': getZIndexState(id)?.isTransitioning,
          [`z-layer-${layer}`]: true,
        },
        className
      )}
      style={{
        ...dynamicStyles,
        ...cssProperties,
      }}
      data-section-id={id}
      data-section-active={isActive}
      data-section-progress={sectionProgress}
      data-trigger-start={triggerStart}
      data-trigger-end={triggerEnd}
      data-contrast={contrast}
      initial={{ opacity: fadeEffect ? 0 : 1 }}
      animate={{ 
        opacity: fadeEffect ? (fadeAnimation?.motionValue || 1) : 1,
        scale: scaleEffect ? (scaleAnimation?.motionValue || 1) : 1,
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

ScrollSection.displayName = 'ScrollSection'

export default ScrollSection