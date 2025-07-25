"use client"

/**
 * Feature-Based Architecture System
 * Organizes application into isolated, testable modules
 */

export interface FeatureModule {
  name: string
  version: string
  dependencies: string[]
  components: string[]
  providers: string[]
  hooks: string[]
  enabled: boolean
  lazy: boolean
}

export interface FeatureConfig {
  development: boolean
  production: boolean
  testing: boolean
}

// Feature module definitions
export const FeatureModules: Record<string, FeatureModule> = {
  // Core UI System
  ui: {
    name: 'UI System',
    version: '1.0.0',
    dependencies: ['@radix-ui/react-*', 'tailwindcss'],
    components: ['Button', 'Card', 'Dialog', 'Input', 'Form'],
    providers: ['ThemeProvider'],
    hooks: ['useTheme'],
    enabled: true,
    lazy: false, // Critical - load immediately
  },
  
  // Hero & Landing
  hero: {
    name: 'Hero Section',
    version: '1.0.0',
    dependencies: ['framer-motion'],
    components: ['HeroSection', 'TextRotator'],
    providers: [],
    hooks: [],
    enabled: true,
    lazy: false, // Above fold - load immediately
  },
  
  // Immersive Scroll System
  scroll: {
    name: 'Immersive Scroll',
    version: '1.0.0',
    dependencies: ['lenis', 'framer-motion'],
    components: ['ParallaxLayer', 'ScrollSection', 'ScrollTrigger'],
    providers: ['LenisProvider', 'SectionProvider'],
    hooks: ['useLenisScroll', 'useSectionManager'],
    enabled: true,
    lazy: true, // Load after initial render
  },
  
  // Animation Coordination
  animation: {
    name: 'Animation System',
    version: '1.0.0',
    dependencies: ['framer-motion'],
    components: [],
    providers: ['AnimationProvider'],
    hooks: ['useAnimationCoordinator', 'useZIndexOrchestrator'],
    enabled: true,
    lazy: true,
  },
  
  // Performance Monitoring
  performance: {
    name: 'Performance Monitor',
    version: '1.0.0',
    dependencies: [],
    components: ['PerformanceMonitor'],
    providers: [],
    hooks: ['usePerformanceMonitor'],
    enabled: true,
    lazy: true,
  },
  
  // Debug Tools (Development Only)
  debug: {
    name: 'Debug Tools',
    version: '1.0.0',
    dependencies: [],
    components: ['AnimationDebugger', 'PerformanceMonitor'],
    providers: [],
    hooks: [],
    enabled: process.env.NODE_ENV === 'development',
    lazy: true,
  },
  
  // Testing Infrastructure
  testing: {
    name: 'Testing Framework',
    version: '1.0.0',
    dependencies: ['@testing-library/react', 'jest', 'playwright'],
    components: [],
    providers: [],
    hooks: [],
    enabled: process.env.NODE_ENV === 'test',
    lazy: false,
  },
}

export class FeatureManager {
  private static instance: FeatureManager
  private enabledFeatures = new Set<string>()
  private loadedFeatures = new Set<string>()
  
  static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager()
    }
    return FeatureManager.instance
  }
  
  constructor() {
    // Initialize enabled features based on environment
    Object.entries(FeatureModules).forEach(([key, module]) => {
      if (module.enabled) {
        this.enabledFeatures.add(key)
      }
    })
  }
  
  isFeatureEnabled(featureName: string): boolean {
    return this.enabledFeatures.has(featureName)
  }
  
  getEnabledFeatures(): FeatureModule[] {
    return Array.from(this.enabledFeatures).map(name => FeatureModules[name])
  }
  
  getCriticalFeatures(): FeatureModule[] {
    return this.getEnabledFeatures().filter(module => !module.lazy)
  }
  
  getLazyFeatures(): FeatureModule[] {
    return this.getEnabledFeatures().filter(module => module.lazy)
  }
  
  async loadFeature(featureName: string): Promise<boolean> {
    if (!this.isFeatureEnabled(featureName)) {
      console.warn(`Feature ${featureName} is not enabled`)
      return false
    }
    
    if (this.loadedFeatures.has(featureName)) {
      return true
    }
    
    try {
      const featureModule = FeatureModules[featureName]
      
      // Load feature dependencies
      await this.loadFeatureDependencies(featureModule)
      
      // Load feature components, providers, hooks
      await this.loadFeatureAssets(featureModule)
      
      this.loadedFeatures.add(featureName)
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Feature loaded: ${featureModule.name}`)
      }
      return true
      
    } catch (error) {
      console.error(`❌ Failed to load feature: ${featureName}`, error)
      return false
    }
  }
  
  private async loadFeatureDependencies(module: FeatureModule): Promise<void> {
    // In a real implementation, this would check and load dependencies
    // For now, we assume dependencies are already available
    return Promise.resolve()
  }
  
  private async loadFeatureAssets(module: FeatureModule): Promise<void> {
    // Dynamic imports for feature components would go here
    // This is handled by the ComponentRegistry for now
    return Promise.resolve()
  }
  
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {}
    
    Object.entries(FeatureModules).forEach(([name, module]) => {
      if (this.isFeatureEnabled(name)) {
        graph[name] = module.dependencies
      }
    })
    
    return graph
  }
  
  getLoadOrder(): string[] {
    // Simple topological sort based on lazy loading priority
    const critical = this.getCriticalFeatures().map(m => 
      Object.keys(FeatureModules).find(key => FeatureModules[key] === m)!
    )
    const lazy = this.getLazyFeatures().map(m => 
      Object.keys(FeatureModules).find(key => FeatureModules[key] === m)!
    )
    
    return [...critical, ...lazy]
  }
}

// Environment-based feature configuration
export function getFeatureConfig(): FeatureConfig {
  return {
    development: process.env.NODE_ENV === 'development',
    production: process.env.NODE_ENV === 'production',
    testing: process.env.NODE_ENV === 'test',
  }
}

// Feature flag system
export function useFeature(featureName: string): boolean {
  const manager = FeatureManager.getInstance()
  return manager.isFeatureEnabled(featureName)
}