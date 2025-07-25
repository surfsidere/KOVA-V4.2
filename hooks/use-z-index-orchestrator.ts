"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSection } from '@/providers/SectionProvider'
import { useLenisScroll } from './use-lenis-scroll'
import { ZLayers } from '@/types/scroll.types'

interface ZIndexRule {
  sectionId: string;
  layer: ZLayers;
  priority: number;
  condition?: (progress: number, velocity: number) => boolean;
}

interface ZIndexState {
  currentLayer: ZLayers;
  assignedIndex: number;
  isTransitioning: boolean;
  transitionProgress: number;
}

export const useZIndexOrchestrator = () => {
  const { sections, activeSection, getNextZIndex } = useSection()
  const { progress, velocity, isScrolling } = useLenisScroll()
  const [zIndexStates, setZIndexStates] = useState<Map<string, ZIndexState>>(new Map())
  const [globalRules, setGlobalRules] = useState<ZIndexRule[]>([])
  const transitionTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Add a z-index rule
  const addRule = useCallback((rule: ZIndexRule) => {
    setGlobalRules(prev => {
      const newRules = prev.filter(r => r.sectionId !== rule.sectionId)
      return [...newRules, rule].sort((a, b) => b.priority - a.priority)
    })
  }, [])
  
  // Remove a z-index rule
  const removeRule = useCallback((sectionId: string) => {
    setGlobalRules(prev => prev.filter(rule => rule.sectionId !== sectionId))
  }, [])
  
  // Calculate optimal z-index for a section
  const calculateZIndex = useCallback((sectionId: string): ZIndexState => {
    const section = sections.get(sectionId)
    if (!section) {
      return {
        currentLayer: ZLayers.CONTENT_BASE,
        assignedIndex: ZLayers.CONTENT_BASE,
        isTransitioning: false,
        transitionProgress: 0,
      }
    }
    
    // Find applicable rule
    const applicableRule = globalRules.find(rule => {
      if (rule.sectionId !== sectionId) return false
      if (!rule.condition) return true
      return rule.condition(progress, velocity)
    })
    
    const targetLayer = applicableRule?.layer || ZLayers.CONTENT_BASE
    const currentState = zIndexStates.get(sectionId)
    
    // Check if we need to transition to a new layer
    const needsTransition = !currentState || currentState.currentLayer !== targetLayer
    
    if (needsTransition) {
      return {
        currentLayer: targetLayer,
        assignedIndex: getNextZIndex(targetLayer),
        isTransitioning: true,
        transitionProgress: 0,
      }
    }
    
    return currentState || {
      currentLayer: targetLayer,
      assignedIndex: section.zIndex,
      isTransitioning: false,
      transitionProgress: 1,
    }
  }, [sections, globalRules, progress, velocity, zIndexStates, getNextZIndex])
  
  // Update z-index states for all sections
  const updateZIndexStates = useCallback(() => {
    const newStates = new Map<string, ZIndexState>()
    
    sections.forEach((section, sectionId) => {
      const newState = calculateZIndex(sectionId)
      newStates.set(sectionId, newState)
      
      // Apply z-index to element if available
      if (section.element) {
        section.element.style.zIndex = newState.assignedIndex.toString()
        section.element.style.setProperty('--z-layer', newState.currentLayer.toString())
        section.element.style.setProperty('--z-transition-progress', newState.transitionProgress.toString())
        
        // Add CSS classes for styling
        section.element.classList.toggle('z-transitioning', newState.isTransitioning)
        
        // Remove old layer classes and add new one
        Object.values(ZLayers).forEach(layer => {
          if (typeof layer === 'number') {
            section.element?.classList.remove(`z-layer-${layer}`)
          }
        })
        section.element.classList.add(`z-layer-${newState.currentLayer}`)
      }
    })
    
    setZIndexStates(newStates)
  }, [sections, calculateZIndex])
  
  // Handle z-index transitions
  useEffect(() => {
    if (isScrolling) {
      updateZIndexStates()
      
      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      
      // Set timeout to finish transitions
      transitionTimeoutRef.current = setTimeout(() => {
        setZIndexStates(prev => {
          const newStates = new Map(prev)
          
          newStates.forEach((state, sectionId) => {
            if (state.isTransitioning) {
              newStates.set(sectionId, {
                ...state,
                isTransitioning: false,
                transitionProgress: 1,
              })
            }
          })
          
          return newStates
        })
      }, 300) // Transition duration
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [isScrolling, updateZIndexStates])
  
  // Auto-manage z-index based on section activity
  useEffect(() => {
    if (activeSection) {
      const section = sections.get(activeSection)
      if (section) {
        // Elevate active section
        addRule({
          sectionId: activeSection,
          layer: ZLayers.CONTENT_ELEVATED,
          priority: 1000,
          condition: () => true,
        })
      }
    }
  }, [activeSection, sections, addRule])
  
  // Preset rules for common scenarios
  const createOverlayRule = useCallback((sectionId: string, priority: number = 500) => {
    addRule({
      sectionId,
      layer: ZLayers.OVERLAY,
      priority,
    })
  }, [addRule])
  
  const createHUDRule = useCallback((sectionId: string, priority: number = 600) => {
    addRule({
      sectionId,
      layer: ZLayers.HUD,
      priority,
    })
  }, [addRule])
  
  const createVelocityRule = useCallback((
    sectionId: string, 
    velocityThreshold: number = 10,
    priority: number = 300
  ) => {
    addRule({
      sectionId,
      layer: ZLayers.CONTENT_ELEVATED,
      priority,
      condition: (_, velocity) => Math.abs(velocity) > velocityThreshold,
    })
  }, [addRule])
  
  // Get z-index state for a specific section
  const getZIndexState = useCallback((sectionId: string): ZIndexState | null => {
    return zIndexStates.get(sectionId) || null
  }, [zIndexStates])
  
  // Get all sections in a specific layer
  const getSectionsInLayer = useCallback((layer: ZLayers): string[] => {
    const sectionsInLayer: string[] = []
    
    zIndexStates.forEach((state, sectionId) => {
      if (state.currentLayer === layer) {
        sectionsInLayer.push(sectionId)
      }
    })
    
    return sectionsInLayer.sort((a, b) => {
      const stateA = zIndexStates.get(a)
      const stateB = zIndexStates.get(b)
      return (stateB?.assignedIndex || 0) - (stateA?.assignedIndex || 0)
    })
  }, [zIndexStates])
  
  // Force immediate z-index update
  const forceUpdate = useCallback(() => {
    updateZIndexStates()
  }, [updateZIndexStates])
  
  return {
    // Rule management
    addRule,
    removeRule,
    
    // Preset rules
    createOverlayRule,
    createHUDRule,
    createVelocityRule,
    
    // State queries
    getZIndexState,
    getSectionsInLayer,
    zIndexStates,
    
    // Control
    forceUpdate,
  }
}