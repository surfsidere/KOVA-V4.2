"use client"

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import { Section, ZLayers, ContrastMode } from '@/types/scroll.types'
import { useLenis } from './LenisProvider'

interface SectionContextValue {
  sections: Map<string, Section>;
  activeSection: string | null;
  registerSection: (section: Section) => void;
  unregisterSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  getSectionByProgress: (progress: number) => Section | null;
  setActiveSection: (sectionId: string) => void;
  getNextZIndex: (layer: ZLayers) => number;
}

const SectionContext = createContext<SectionContextValue | null>(null)

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scrollState, updateScrollState } = useLenis()
  const [sections, setSections] = useState<Map<string, Section>>(new Map())
  const [activeSection, setActiveSectionState] = useState<string | null>(null)
  const zIndexCounters = useRef<Map<ZLayers, number>>(new Map())
  const intersectionObserver = useRef<IntersectionObserver | null>(null)

  // Initialize z-index counters
  useEffect(() => {
    Object.values(ZLayers).forEach(layer => {
      if (typeof layer === 'number') {
        zIndexCounters.current.set(layer, layer)
      }
    })
  }, [])

  // Generate next z-index for a given layer
  const getNextZIndex = useCallback((layer: ZLayers): number => {
    const current = zIndexCounters.current.get(layer) || layer
    const next = current + 1
    zIndexCounters.current.set(layer, next)
    return next
  }, [])

  // Register a new section
  const registerSection = useCallback((section: Section) => {
    setSections(prev => {
      const newSections = new Map(prev)
      
      // Ensure unique z-index within layer
      if (!section.zIndex) {
        const baseLayer = section.zIndex >= ZLayers.CONTENT_ELEVATED 
          ? ZLayers.CONTENT_ELEVATED 
          : ZLayers.CONTENT_BASE
        section.zIndex = getNextZIndex(baseLayer)
      }
      
      newSections.set(section.id, section)
      return newSections
    })
  }, [getNextZIndex])

  // Unregister a section
  const unregisterSection = useCallback((sectionId: string) => {
    setSections(prev => {
      const newSections = new Map(prev)
      newSections.delete(sectionId)
      return newSections
    })
  }, [])

  // Update section properties
  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    setSections(prev => {
      const newSections = new Map(prev)
      const section = newSections.get(sectionId)
      
      if (section) {
        newSections.set(sectionId, { ...section, ...updates })
      }
      
      return newSections
    })
  }, [])

  // Get section by scroll progress
  const getSectionByProgress = useCallback((progress: number): Section | null => {
    for (const section of sections.values()) {
      if (progress >= section.triggerStart && progress <= section.triggerEnd) {
        return section
      }
    }
    return null
  }, [sections])

  // Set active section and update global state
  const setActiveSection = useCallback((sectionId: string) => {
    setActiveSectionState(sectionId)
    updateScrollState({ activeSection: sectionId })
    
    // Update section active states
    setSections(prev => {
      const newSections = new Map(prev)
      
      newSections.forEach((section, id) => {
        newSections.set(id, { 
          ...section, 
          isActive: id === sectionId 
        })
      })
      
      return newSections
    })
  }, [updateScrollState])

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const sectionId = entry.target.getAttribute('data-section-id')
          
          if (sectionId && entry.isIntersecting) {
            const section = sections.get(sectionId)
            
            if (section && entry.intersectionRatio > 0.5) {
              setActiveSection(sectionId)
            }
          }
        })
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    return () => {
      intersectionObserver.current?.disconnect()
    }
  }, [sections, setActiveSection])

  // Auto-detect active section based on scroll progress
  useEffect(() => {
    const currentSection = getSectionByProgress(scrollState.progress)
    
    if (currentSection && currentSection.id !== activeSection) {
      setActiveSection(currentSection.id)
    }
  }, [scrollState.progress, getSectionByProgress, activeSection, setActiveSection])

  // Observe section elements when they're registered
  useEffect(() => {
    sections.forEach(section => {
      if (section.element && intersectionObserver.current) {
        section.element.setAttribute('data-section-id', section.id)
        intersectionObserver.current.observe(section.element)
      }
    })

    return () => {
      intersectionObserver.current?.disconnect()
    }
  }, [sections])

  const contextValue: SectionContextValue = {
    sections,
    activeSection,
    registerSection,
    unregisterSection,
    updateSection,
    getSectionByProgress,
    setActiveSection,
    getNextZIndex,
  }

  return (
    <SectionContext.Provider value={contextValue}>
      {children}
    </SectionContext.Provider>
  )
}

export const useSection = () => {
  const context = useContext(SectionContext)
  if (!context) {
    throw new Error('useSection must be used within a SectionProvider')
  }
  return context
}

export default SectionProvider