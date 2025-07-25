"use client"

import { useEffect, useCallback, useRef, useState } from 'react'
import { useSection } from '@/providers/SectionProvider'
import { useLenisScroll } from './use-lenis-scroll'
import { Section, ZLayers, ContrastMode, Animation } from '@/types/scroll.types'

interface SectionConfig {
  id: string;
  triggerStart: number;
  triggerEnd: number;
  zIndex?: number;
  animations?: Animation[];
  contrast?: ContrastMode;
  onEnter?: () => void;
  onLeave?: () => void;
  onProgress?: (progress: number) => void;
}

export const useSectionManager = (config: SectionConfig) => {
  const { 
    registerSection, 
    unregisterSection, 
    updateSection, 
    activeSection, 
    getNextZIndex 
  } = useSection()
  
  const { progress, isReady } = useLenisScroll()
  const [isActive, setIsActive] = useState(false)
  const [sectionProgress, setSectionProgress] = useState(0)
  const elementRef = useRef<HTMLElement | null>(null)
  const hasEnteredRef = useRef(false)
  
  // Create section object
  const section: Section = {
    id: config.id,
    triggerStart: config.triggerStart,
    triggerEnd: config.triggerEnd,
    zIndex: config.zIndex || getNextZIndex(ZLayers.CONTENT_BASE),
    animations: config.animations || [],
    contrast: config.contrast || 'auto',
    isActive: false,
    element: elementRef.current || undefined,
  }
  
  // Register section on mount
  useEffect(() => {
    if (isReady) {
      registerSection(section)
    }
    
    return () => {
      unregisterSection(config.id)
    }
  }, [isReady, registerSection, unregisterSection, config.id])
  
  // Update section when element ref changes
  useEffect(() => {
    if (elementRef.current) {
      updateSection(config.id, { element: elementRef.current })
    }
  }, [elementRef.current, updateSection, config.id])
  
  // Monitor section progress and trigger callbacks
  useEffect(() => {
    const currentProgress = progress
    const isInRange = currentProgress >= config.triggerStart && currentProgress <= config.triggerEnd
    const wasActive = isActive
    
    if (isInRange) {
      // Calculate section-specific progress (0-1 within section bounds)
      const range = config.triggerEnd - config.triggerStart
      const sectionProg = range > 0 ? (currentProgress - config.triggerStart) / range : 0
      const clampedProgress = Math.max(0, Math.min(1, sectionProg))
      
      setSectionProgress(clampedProgress)
      
      // Call progress callback
      config.onProgress?.(clampedProgress)
      
      // Handle section enter
      if (!wasActive && !hasEnteredRef.current) {
        setIsActive(true)
        hasEnteredRef.current = true
        config.onEnter?.()
      }
    } else {
      // Handle section leave
      if (wasActive || hasEnteredRef.current) {
        setIsActive(false)
        hasEnteredRef.current = false
        setSectionProgress(0)
        config.onLeave?.()
      }
    }
  }, [progress, config.triggerStart, config.triggerEnd, isActive, config.onEnter, config.onLeave, config.onProgress])
  
  // Update section active state in provider
  useEffect(() => {
    updateSection(config.id, { isActive })
  }, [isActive, updateSection, config.id])
  
  // Element registration function
  const registerElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element
    
    if (element) {
      // Add data attributes for debugging and styling
      element.setAttribute('data-section-id', config.id)
      element.setAttribute('data-section-active', isActive.toString())
      element.style.setProperty('--section-progress', sectionProgress.toString())
      element.style.setProperty('--section-z-index', section.zIndex.toString())
    }
  }, [config.id, isActive, sectionProgress, section.zIndex])
  
  // Get section visibility and intersection data
  const getVisibilityData = useCallback(() => {
    if (!elementRef.current) return null
    
    const rect = elementRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    
    return {
      isVisible: rect.bottom > 0 && rect.top < viewport.height,
      isFullyVisible: rect.top >= 0 && rect.bottom <= viewport.height,
      visibleHeight: Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0)),
      visibilityRatio: rect.height > 0 ? Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0)) / rect.height : 0,
      distanceFromTop: rect.top,
      distanceFromBottom: viewport.height - rect.bottom,
    }
  }, [])
  
  // Smooth scroll to this section
  const scrollToSection = useCallback((options?: {
    offset?: number;
    duration?: number;
    easing?: (t: number) => number;
  }) => {
    if (!elementRef.current) return
    
    const { scrollTo } = useLenisScroll()
    scrollTo(elementRef.current, options)
  }, [])
  
  // Update section configuration
  const updateConfig = useCallback((updates: Partial<SectionConfig>) => {
    updateSection(config.id, {
      triggerStart: updates.triggerStart ?? config.triggerStart,
      triggerEnd: updates.triggerEnd ?? config.triggerEnd,
      zIndex: updates.zIndex ?? section.zIndex,
      animations: updates.animations ?? config.animations,
      contrast: updates.contrast ?? config.contrast,
    })
  }, [updateSection, config, section.zIndex])
  
  return {
    // State
    isActive,
    sectionProgress,
    isInViewport: activeSection === config.id,
    
    // Element registration
    registerElement,
    element: elementRef.current,
    
    // Data and utilities
    getVisibilityData,
    scrollToSection,
    updateConfig,
    
    // Section properties
    section,
  }
}