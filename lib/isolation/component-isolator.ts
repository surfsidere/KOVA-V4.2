/**
 * Component Isolation System
 * World-class component separation with error boundaries and lifecycle management
 */

import { SystemEventBus } from '../architecture/core-system'
import { PerformanceEngine } from '../performance/performance-engine'

export interface ComponentMetadata {
  id: string
  name: string
  version: string
  dependencies: string[]
  loadPriority: 'critical' | 'high' | 'medium' | 'low'
  size: number // estimated KB
  lazy: boolean
  preload: boolean
  cache: boolean
}

export interface ComponentState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'cached'
  error?: Error
  loadTime?: number
  renderTime?: number
  memoryUsage?: number
  retryCount: number
  lastAccessed: Date
}

export interface IsolationConfig {
  errorBoundary: boolean
  retryLimit: number
  timeout: number
  memoryLimit: number // MB
  sandboxing: boolean
  dependencies: {
    strict: boolean
    autoResolve: boolean
  }
}

export class ComponentIsolator {
  private static instance: ComponentIsolator
  private components = new Map<string, ComponentMetadata>()
  private states = new Map<string, ComponentState>()
  private instances = new Map<string, any>()
  private config: IsolationConfig
  private eventBus: SystemEventBus
  private performanceEngine: PerformanceEngine

  static getInstance(): ComponentIsolator {
    if (!ComponentIsolator.instance) {
      ComponentIsolator.instance = new ComponentIsolator()
    }
    return ComponentIsolator.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
    this.eventBus = SystemEventBus.getInstance()
    this.performanceEngine = PerformanceEngine.getInstance()
    this.setupEventHandlers()
  }

  private getDefaultConfig(): IsolationConfig {
    return {
      errorBoundary: true,
      retryLimit: 3,
      timeout: 10000,
      memoryLimit: 50,
      sandboxing: true,
      dependencies: {
        strict: true,
        autoResolve: true
      }
    }
  }

  private setupEventHandlers(): void {
    this.eventBus.on('component:mount', (data) => {
      this.handleComponentMount(data.data.component, data.data)
    })

    this.eventBus.on('component:unmount', (data) => {
      this.handleComponentUnmount(data.data.component)
    })

    this.eventBus.on('component:error', (data) => {
      this.handleComponentError(data.data.component, data.data.error)
    })
  }

  // Component Registration
  registerComponent(metadata: ComponentMetadata): void {
    // Validate metadata
    this.validateMetadata(metadata)

    // Check for conflicts
    if (this.components.has(metadata.id)) {
      const existing = this.components.get(metadata.id)!
      if (existing.version !== metadata.version) {
        console.warn(`⚠️ Version conflict for ${metadata.id}: ${existing.version} vs ${metadata.version}`)
      }
    }

    // Register component
    this.components.set(metadata.id, metadata)
    this.states.set(metadata.id, {
      status: 'idle',
      retryCount: 0,
      lastAccessed: new Date()
    })

    this.eventBus.emitSystemEvent('isolator:component-registered', {
      componentId: metadata.id,
      metadata
    })

    // Component registered successfully
  }

  private validateMetadata(metadata: ComponentMetadata): void {
    if (!metadata.id || !metadata.name || !metadata.version) {
      throw new Error('Component metadata must include id, name, and version')
    }

    if (metadata.size > 1000) {
      console.warn(`⚠️ Large component detected: ${metadata.name} (${metadata.size}KB)`)
    }

    // Validate dependencies
    if (this.config.dependencies.strict) {
      for (const dep of metadata.dependencies) {
        if (!this.components.has(dep)) {
          if (this.config.dependencies.autoResolve) {
            // Auto-resolving dependency
          } else {
            throw new Error(`Missing dependency: ${dep} for component ${metadata.id}`)
          }
        }
      }
    }
  }

  // Component Loading with Isolation
  async loadComponent<T = any>(componentId: string): Promise<T> {
    const metadata = this.getMetadata(componentId)
    const state = this.getState(componentId)

    // Return cached instance if available
    if (state.status === 'ready' && this.instances.has(componentId)) {
      state.lastAccessed = new Date()
      return this.instances.get(componentId)
    }

    // Check if already loading
    if (state.status === 'loading') {
      return this.waitForComponent(componentId)
    }

    // Start loading
    return this.performIsolatedLoad(componentId, metadata)
  }

  private async performIsolatedLoad<T>(componentId: string, metadata: ComponentMetadata): Promise<T> {
    const state = this.getState(componentId)
    const startTime = Date.now()

    try {
      // Set loading state
      this.updateState(componentId, { status: 'loading' })
      
      this.eventBus.emitComponentEvent(componentId, 'mount', { 
        loadStart: startTime,
        attempt: state.retryCount + 1
      })

      // Load dependencies first
      await this.loadDependencies(metadata.dependencies)

      // Create isolated sandbox
      const sandbox = this.config.sandboxing ? this.createSandbox(componentId) : globalThis

      // Perform actual component loading with timeout
      const component = await Promise.race([
        this.loadComponentInternal(componentId, sandbox),
        this.createTimeout(this.config.timeout, componentId)
      ])

      // Measure performance
      const loadTime = Date.now() - startTime
      const memoryUsage = await this.measureMemoryUsage(componentId)

      // Update state
      this.updateState(componentId, {
        status: 'ready',
        loadTime,
        memoryUsage,
        lastAccessed: new Date()
      })

      // Cache instance
      this.instances.set(componentId, component)

      // Emit success event
      this.eventBus.emitComponentEvent(componentId, 'mount', {
        success: true,
        loadTime,
        memoryUsage
      })

      // Performance tracking
      this.performanceEngine.startMeasure(`component-render-${componentId}`)

      // Component loaded successfully

      return component

    } catch (error) {
      await this.handleLoadError(componentId, error as Error)
      throw error
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(dep => {
      if (this.components.has(dep)) {
        return this.loadComponent(dep)
      } else if (this.config.dependencies.autoResolve) {
        return this.autoResolveDependency(dep)
      } else {
        throw new Error(`Dependency not found: ${dep}`)
      }
    })

    await Promise.all(loadPromises)
  }

  private async autoResolveDependency(dependencyId: string): Promise<any> {
    // Auto-resolution logic - in real implementation, this would
    // check npm registry, CDN, or other component sources
    // Auto-resolving dependency
    
    // Simulate dependency resolution
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Register and load the resolved dependency
    this.registerComponent({
      id: dependencyId,
      name: dependencyId,
      version: '1.0.0',
      dependencies: [],
      loadPriority: 'medium',
      size: 10,
      lazy: true,
      preload: false,
      cache: true
    })

    return this.loadComponent(dependencyId)
  }

  private createSandbox(componentId: string): any {
    // Create isolated execution context
    const sandbox = {
      console: {
        log: (...args: any[]) => {}, // Sandboxed console disabled
        warn: (...args: any[]) => {}, // Sandboxed console disabled  
        error: (...args: any[]) => {} // Sandboxed console disabled
      },
      performance: {
        now: () => performance.now(),
        mark: (name: string) => performance.mark(`${componentId}-${name}`),
        measure: (name: string, start: string, end: string) => 
          performance.measure(`${componentId}-${name}`, `${componentId}-${start}`, `${componentId}-${end}`)
      },
      // Add other safe globals as needed
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      requestAnimationFrame,
      cancelAnimationFrame
    }

    return sandbox
  }

  private async loadComponentInternal(componentId: string, sandbox: any): Promise<any> {
    // This would be the actual component loading logic
    // For demonstration, we'll simulate component loading
    
    const metadata = this.getMetadata(componentId)
    
    // Simulate loading based on component size
    const loadDelay = Math.min(metadata.size * 2, 1000) // Max 1 second
    await new Promise(resolve => setTimeout(resolve, loadDelay))

    // Create mock component instance
    const component = {
      id: componentId,
      name: metadata.name,
      version: metadata.version,
      render: () => `<div>Component: ${metadata.name}</div>`,
      destroy: () => {
        this.eventBus.emitComponentEvent(componentId, 'unmount', {})
      },
      sandbox
    }

    return component
  }

  private createTimeout(timeout: number, componentId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Component load timeout: ${componentId} (${timeout}ms)`))
      }, timeout)
    })
  }

  private async measureMemoryUsage(componentId: string): Promise<number> {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  private async handleLoadError(componentId: string, error: Error): Promise<void> {
    const state = this.getState(componentId)
    const newRetryCount = state.retryCount + 1

    this.updateState(componentId, {
      status: 'error',
      error,
      retryCount: newRetryCount
    })

    this.eventBus.emitComponentEvent(componentId, 'error', {
      error: error.message,
      retryCount: newRetryCount,
      canRetry: newRetryCount < this.config.retryLimit
    })

    // Component load failed - error handled by event system

    // Auto-retry if within limit
    if (newRetryCount < this.config.retryLimit) {
      // Retrying component load
      
      // Exponential backoff
      const delay = Math.pow(2, newRetryCount) * 1000
      setTimeout(() => {
        this.loadComponent(componentId).catch(() => {
          // Final retry failed
        })
      }, delay)
    }
  }

  private async waitForComponent(componentId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const state = this.getState(componentId)
        
        if (state.status === 'ready') {
          clearInterval(checkInterval)
          resolve(this.instances.get(componentId))
        } else if (state.status === 'error') {
          clearInterval(checkInterval)
          reject(state.error)
        }
      }, 100)

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error(`Timeout waiting for component: ${componentId}`))
      }, 30000)
    })
  }

  // Component Lifecycle
  private handleComponentMount(componentId: string, data: any): void {
    // Component mounted successfully
    
    // Start render time measurement
    this.performanceEngine.startMeasure(`component-render-${componentId}`)
  }

  private handleComponentUnmount(componentId: string): void {
    // Component unmounted successfully

    // End render time measurement
    const renderTime = this.performanceEngine.endMeasure(`component-render-${componentId}`)
    
    if (renderTime) {
      this.updateState(componentId, { renderTime })
    }

    // Cleanup if not cached
    const metadata = this.getMetadata(componentId)
    if (!metadata.cache) {
      this.instances.delete(componentId)
      this.updateState(componentId, { status: 'idle' })
    }
  }

  private handleComponentError(componentId: string, error: Error): void {
    // Component error - handled by isolation system
    
    this.updateState(componentId, {
      status: 'error',
      error
    })

    // Isolate the error - don't let it propagate
    this.eventBus.emitSystemEvent('isolator:component-isolated', {
      componentId,
      error: error.message,
      isolated: true
    })
  }

  // Utility Methods
  private getMetadata(componentId: string): ComponentMetadata {
    const metadata = this.components.get(componentId)
    if (!metadata) {
      throw new Error(`Component not registered: ${componentId}`)
    }
    return metadata
  }

  private getState(componentId: string): ComponentState {
    const state = this.states.get(componentId)
    if (!state) {
      throw new Error(`Component state not found: ${componentId}`)
    }
    return state
  }

  private updateState(componentId: string, updates: Partial<ComponentState>): void {
    const currentState = this.getState(componentId)
    const newState = { ...currentState, ...updates }
    this.states.set(componentId, newState)

    this.eventBus.emitSystemEvent('isolator:state-updated', {
      componentId,
      state: newState
    })
  }

  // Public API
  getComponentState(componentId: string): ComponentState {
    return { ...this.getState(componentId) }
  }

  getComponentMetadata(componentId: string): ComponentMetadata {
    return { ...this.getMetadata(componentId) }
  }

  getAllComponents(): { id: string; metadata: ComponentMetadata; state: ComponentState }[] {
    return Array.from(this.components.keys()).map(id => ({
      id,
      metadata: this.getMetadata(id),
      state: this.getState(id)
    }))
  }

  preloadComponent(componentId: string): Promise<void> {
    const metadata = this.getMetadata(componentId)
    if (metadata.preload) {
      return this.loadComponent(componentId).then(() => {})
    }
    return Promise.resolve()
  }

  unloadComponent(componentId: string): void {
    const instance = this.instances.get(componentId)
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy()
    }
    
    this.instances.delete(componentId)
    this.updateState(componentId, { status: 'idle' })
    
    // Component unloaded successfully
  }

  getIsolationReport(): {
    totalComponents: number
    loadedComponents: number
    erroredComponents: number
    memoryUsage: number
    averageLoadTime: number
  } {
    const allStates = Array.from(this.states.values())
    const loadedStates = allStates.filter(s => s.status === 'ready')
    const erroredStates = allStates.filter(s => s.status === 'error')
    
    const totalMemory = loadedStates.reduce((sum, s) => sum + (s.memoryUsage || 0), 0)
    const totalLoadTime = loadedStates.reduce((sum, s) => sum + (s.loadTime || 0), 0)
    const avgLoadTime = loadedStates.length > 0 ? totalLoadTime / loadedStates.length : 0

    return {
      totalComponents: this.components.size,
      loadedComponents: loadedStates.length,
      erroredComponents: erroredStates.length,
      memoryUsage: totalMemory,
      averageLoadTime: avgLoadTime
    }
  }

  updateConfig(updates: Partial<IsolationConfig>): void {
    this.config = { ...this.config, ...updates }
    
    this.eventBus.emitSystemEvent('isolator:config-updated', {
      config: this.config
    })
  }

  destroy(): void {
    // Cleanup all components
    for (const componentId of this.instances.keys()) {
      this.unloadComponent(componentId)
    }

    this.components.clear()
    this.states.clear()
    this.instances.clear()

    // Component Isolator destroyed
  }
}