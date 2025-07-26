"use client"

import { lazy, ComponentType } from 'react'

/**
 * Component Isolation & Lazy Loading System
 * Provides isolated loading of components with error boundaries
 */

interface ComponentLoaderOptions {
  fallback?: ComponentType
  errorBoundary?: ComponentType
  preload?: boolean
}

export function createLazyComponent<T = {}>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: ComponentLoaderOptions = {}
) {
  const LazyComponent = lazy(componentImport)
  
  // Optional preloading for critical components
  if (options.preload) {
    // Preload after initial render
    setTimeout(() => {
      componentImport().catch(() => {
        // Silently handle preload failures
      })
    }, 100)
  }
  
  return LazyComponent
}

// Feature-based component organization
export const FeatureComponents = {
  // UI System Components (Critical - Load Immediately)
  Button: () => import('../components/ui/button'),
  Card: () => import('../components/ui/card'),
  Dialog: () => import('../components/ui/dialog'),
  
  // Navigation Components (High Priority)
  HeroSection: () => import('../components/ui/hero-section'),
  TextRotator: () => import('../components/ui/text-rotator'),
  
  // Animation System (Medium Priority)
  ParallaxLayer: () => import('../components/scroll/ParallaxLayer'),
  ScrollSection: () => import('../components/scroll/ScrollSection'),
  ScrollTrigger: () => import('../components/scroll/ScrollTrigger'),
  
  // Debug Components (Development Only)
  AnimationDebugger: () => import('../components/debug/AnimationDebugger'),
  PerformanceMonitor: () => import('../components/debug/PerformanceMonitor'),
  
  // Chart Components (Low Priority - Heavy)
  Chart: () => import('../components/ui/chart'),
  
  // Form Components (On-Demand)
  Form: () => import('../components/ui/form'),
  Input: () => import('../components/ui/input'),
  Textarea: () => import('../components/ui/textarea'),
}

// Component registry for dynamic loading
export class ComponentRegistry {
  private static instance: ComponentRegistry
  private components = new Map<string, ComponentType>()
  private loading = new Set<string>()
  
  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry()
    }
    return ComponentRegistry.instance
  }
  
  async loadComponent(name: keyof typeof FeatureComponents): Promise<ComponentType> {
    if (this.components.has(name)) {
      return this.components.get(name)!
    }
    
    if (this.loading.has(name)) {
      // Wait for existing load
      return new Promise((resolve) => {
        const check = () => {
          if (this.components.has(name)) {
            resolve(this.components.get(name)!)
          } else {
            setTimeout(check, 10)
          }
        }
        check()
      })
    }
    
    this.loading.add(name)
    
    try {
      const componentModule = await FeatureComponents[name]()
      const component = componentModule.default
      this.components.set(name, component)
      this.loading.delete(name)
      return component
    } catch (error) {
      this.loading.delete(name)
      throw new Error(`Failed to load component: ${name}`)
    }
  }
  
  preloadComponents(names: (keyof typeof FeatureComponents)[]): Promise<void[]> {
    return Promise.all(
      names.map(name => 
        this.loadComponent(name).catch(() => {
          // Failed to preload component - silent failure for production
        })
      )
    )
  }
}

// Critical component preloader
export function preloadCriticalComponents() {
  const registry = ComponentRegistry.getInstance()
  
  // Preload essential components
  registry.preloadComponents([
    'Button',
    'Card', 
    'HeroSection',
    'TextRotator'
  ])
}