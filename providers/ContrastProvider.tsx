"use client"

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useSection } from './SectionProvider'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { ContrastMode } from '@/types/scroll.types'

interface ColorTheme {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
  ring: string;
}

interface ContrastState {
  mode: ContrastMode;
  theme: ColorTheme;
  transitionProgress: number;
  isTransitioning: boolean;
}

interface ContrastContextValue {
  contrastState: ContrastState;
  setContrastMode: (mode: ContrastMode) => void;
  interpolateColors: (from: string, to: string, progress: number) => string;
  updateTheme: (updates: Partial<ColorTheme>) => void;
  registerColorTransition: (sectionId: string, fromTheme: ColorTheme, toTheme: ColorTheme) => void;
}

const ContrastContext = createContext<ContrastContextValue | null>(null)

// Predefined color themes
const colorThemes: Record<ContrastMode, ColorTheme> = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    accent: '#3b82f6',
    muted: '#f3f4f6',
    border: '#e5e7eb',
    ring: '#3b82f6',
  },
  dark: {
    background: '#020010',
    foreground: '#ffffff',
    accent: '#60a5fa',
    muted: '#1f2937',
    border: '#374151',
    ring: '#60a5fa',
  },
  auto: {
    background: '#0a0a23',
    foreground: '#ffffff',
    accent: '#8b5cf6',
    muted: '#1e1b4b',
    border: '#3730a3',
    ring: '#8b5cf6',
  },
}

export const ContrastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeSection, sections } = useSection()
  const { progress } = useLenisScroll()
  const [contrastState, setContrastState] = useState<ContrastState>({
    mode: 'dark',
    theme: colorThemes.dark,
    transitionProgress: 1,
    isTransitioning: false,
  })
  
  // Motion values for smooth color transitions
  const themeProgress = useMotionValue(0)
  const smoothProgress = useSpring(themeProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.5,
  })
  
  // Color interpolation utility
  const interpolateColors = useCallback((from: string, to: string, progress: number): string => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : { r: 0, g: 0, b: 0 }
    }
    
    // Convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
    }
    
    const fromRgb = hexToRgb(from)
    const toRgb = hexToRgb(to)
    
    const interpolatedRgb = {
      r: fromRgb.r + (toRgb.r - fromRgb.r) * progress,
      g: fromRgb.g + (toRgb.g - fromRgb.g) * progress,
      b: fromRgb.b + (toRgb.b - fromRgb.b) * progress,
    }
    
    return rgbToHex(interpolatedRgb.r, interpolatedRgb.g, interpolatedRgb.b)
  }, [])
  
  // Set contrast mode
  const setContrastMode = useCallback((mode: ContrastMode) => {
    const newTheme = colorThemes[mode]
    
    setContrastState(prev => ({
      ...prev,
      mode,
      theme: newTheme,
      isTransitioning: true,
      transitionProgress: 0,
    }))
    
    // Animate transition
    themeProgress.set(0)
    themeProgress.set(1)
    
    // Mark transition as complete after animation
    setTimeout(() => {
      setContrastState(prev => ({
        ...prev,
        isTransitioning: false,
        transitionProgress: 1,
      }))
    }, 600)
  }, [themeProgress])
  
  // Update theme properties
  const updateTheme = useCallback((updates: Partial<ColorTheme>) => {
    setContrastState(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
    }))
  }, [])
  
  // Register color transitions between sections
  const registerColorTransition = useCallback((
    sectionId: string,
    fromTheme: ColorTheme,
    toTheme: ColorTheme
  ) => {
    // This would register section-specific color transitions
    // Implementation depends on specific section management needs
  }, [])
  
  // Auto-detect contrast mode based on active section
  useEffect(() => {
    if (activeSection) {
      const section = sections.get(activeSection)
      if (section && section.contrast !== contrastState.mode) {
        setContrastMode(section.contrast)
      }
    }
  }, [activeSection, sections, contrastState.mode, setContrastMode])
  
  // Create dynamic CSS custom properties
  const cssVariables = useTransform(
    smoothProgress,
    [0, 1],
    [
      {
        '--background': contrastState.theme.background,
        '--foreground': contrastState.theme.foreground,
        '--accent': contrastState.theme.accent,
        '--muted': contrastState.theme.muted,
        '--border': contrastState.theme.border,
        '--ring': contrastState.theme.ring,
        '--contrast-mode': contrastState.mode,
        '--transition-progress': contrastState.transitionProgress,
      },
      {
        '--background': contrastState.theme.background,
        '--foreground': contrastState.theme.foreground,
        '--accent': contrastState.theme.accent,
        '--muted': contrastState.theme.muted,
        '--border': contrastState.theme.border,
        '--ring': contrastState.theme.ring,
        '--contrast-mode': contrastState.mode,
        '--transition-progress': contrastState.transitionProgress,
      },
    ]
  )
  
  // Apply CSS variables to document root
  useEffect(() => {
    const updateCSSVariables = (variables: Record<string, any>) => {
      Object.entries(variables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value.toString())
      })
    }
    
    const unsubscribe = cssVariables.onChange(updateCSSVariables)
    
    // Set initial values
    updateCSSVariables({
      '--background': contrastState.theme.background,
      '--foreground': contrastState.theme.foreground,
      '--accent': contrastState.theme.accent,
      '--muted': contrastState.theme.muted,
      '--border': contrastState.theme.border,
      '--ring': contrastState.theme.ring,
      '--contrast-mode': contrastState.mode,
      '--transition-progress': contrastState.transitionProgress,
    })
    
    return unsubscribe
  }, [cssVariables, contrastState])
  
  // Add contrast classes to body
  useEffect(() => {
    const body = document.body
    body.classList.remove('contrast-light', 'contrast-dark', 'contrast-auto')
    body.classList.add(`contrast-${contrastState.mode}`)
    
    if (contrastState.isTransitioning) {
      body.classList.add('contrast-transitioning')
    } else {
      body.classList.remove('contrast-transitioning')
    }
    
    return () => {
      body.classList.remove('contrast-light', 'contrast-dark', 'contrast-auto', 'contrast-transitioning')
    }
  }, [contrastState.mode, contrastState.isTransitioning])
  
  const contextValue: ContrastContextValue = {
    contrastState,
    setContrastMode,
    interpolateColors,
    updateTheme,
    registerColorTransition,
  }
  
  return (
    <ContrastContext.Provider value={contextValue}>
      {children}
    </ContrastContext.Provider>
  )
}

export const useContrast = () => {
  const context = useContext(ContrastContext)
  if (!context) {
    throw new Error('useContrast must be used within a ContrastProvider')
  }
  return context
}

// Hook for section-based contrast management
export const useSectionContrast = (sectionId: string) => {
  const { contrastState, setContrastMode } = useContrast()
  const { sections } = useSection()
  
  const setSectionContrast = useCallback((mode: ContrastMode) => {
    const section = sections.get(sectionId)
    if (section) {
      setContrastMode(mode)
    }
  }, [sectionId, sections, setContrastMode])
  
  return {
    currentMode: contrastState.mode,
    isTransitioning: contrastState.isTransitioning,
    setSectionContrast,
    theme: contrastState.theme,
  }
}

export default ContrastProvider