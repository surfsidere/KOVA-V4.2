/**
 * KOVA-V4.2 Core System Architecture
 * Enterprise-grade, scalable foundation with zero technical debt
 */

import { EventEmitter } from 'events'

// System-wide configuration
export interface SystemConfig {
  environment: 'development' | 'production' | 'test'
  performance: {
    maxConcurrentAnimations: number
    memoryThreshold: number
    fpsTarget: number
  }
  security: {
    enableCSP: boolean
    enableCORS: boolean
    rateLimit: number
  }
  features: {
    [key: string]: boolean
  }
}

// Dependency Injection Container
export class DIContainer {
  private static instance: DIContainer
  private services = new Map<string, any>()
  private factories = new Map<string, () => any>()

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer()
    }
    return DIContainer.instance
  }

  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory)
  }

  get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name)
    }

    const factory = this.factories.get(name)
    if (!factory) {
      throw new Error(`Service ${name} not registered`)
    }

    const instance = factory()
    this.services.set(name, instance)
    return instance
  }

  clear(): void {
    this.services.clear()
    this.factories.clear()
  }
}

// Event-driven architecture backbone
export class SystemEventBus extends EventEmitter {
  private static instance: SystemEventBus

  static getInstance(): SystemEventBus {
    if (!SystemEventBus.instance) {
      SystemEventBus.instance = new SystemEventBus()
    }
    return SystemEventBus.instance
  }

  // Type-safe event emission
  emitSystemEvent<T>(event: string, data: T): void {
    this.emit(event, {
      timestamp: Date.now(),
      data,
      source: 'system'
    })
  }

  // Component lifecycle events
  emitComponentEvent(component: string, lifecycle: 'mount' | 'unmount' | 'error', data?: any): void {
    this.emitSystemEvent(`component:${lifecycle}`, {
      component,
      ...data
    })
  }

  // Performance events
  emitPerformanceEvent(metric: string, value: number, threshold?: number): void {
    this.emitSystemEvent('performance:metric', {
      metric,
      value,
      threshold,
      exceeded: threshold ? value > threshold : false
    })
  }
}

// Module-based architecture system
export interface ModuleDefinition {
  name: string
  version: string
  dependencies: string[]
  exports: string[]
  config?: Record<string, any>
}

export class ModuleRegistry {
  private static instance: ModuleRegistry
  private modules = new Map<string, ModuleDefinition>()
  private loadedModules = new Set<string>()
  private loadingPromises = new Map<string, Promise<void>>()

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry()
    }
    return ModuleRegistry.instance
  }

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} already registered`)
    }
    this.modules.set(module.name, module)
  }

  async loadModule(name: string): Promise<void> {
    if (this.loadedModules.has(name)) {
      return
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!
    }

    const promise = this._loadModuleInternal(name)
    this.loadingPromises.set(name, promise)
    
    try {
      await promise
      this.loadedModules.add(name)
    } finally {
      this.loadingPromises.delete(name)
    }
  }

  private async _loadModuleInternal(name: string): Promise<void> {
    const module = this.modules.get(name)
    if (!module) {
      throw new Error(`Module ${name} not found`)
    }

    // Load dependencies first
    for (const dep of module.dependencies) {
      await this.loadModule(dep)
    }

    // Emit module loading event
    SystemEventBus.getInstance().emitSystemEvent('module:loading', { name })
    
    // Module-specific loading logic would go here
    // For now, we simulate async loading
    await new Promise(resolve => setTimeout(resolve, 10))
    
    SystemEventBus.getInstance().emitSystemEvent('module:loaded', { name })
  }

  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {}
    for (const [name, module] of this.modules) {
      graph[name] = module.dependencies
    }
    return graph
  }

  getLoadOrder(): string[] {
    // Topological sort implementation
    const graph = this.getDependencyGraph()
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []

    const visit = (node: string) => {
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected: ${node}`)
      }
      if (visited.has(node)) {
        return
      }

      visiting.add(node)
      const deps = graph[node] || []
      for (const dep of deps) {
        visit(dep)
      }
      visiting.delete(node)
      visited.add(node)
      result.push(node)
    }

    for (const node of Object.keys(graph)) {
      visit(node)
    }

    return result
  }
}

// Resource management system
export class ResourceManager {
  private static instance: ResourceManager
  private resources = new Map<string, any>()
  private resourceUsage = new Map<string, number>()
  private cleanupTasks = new Map<string, () => void>()

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  allocate<T>(name: string, factory: () => T, cleanup?: () => void): T {
    if (this.resources.has(name)) {
      this.resourceUsage.set(name, (this.resourceUsage.get(name) || 0) + 1)
      return this.resources.get(name)
    }

    const resource = factory()
    this.resources.set(name, resource)
    this.resourceUsage.set(name, 1)
    
    if (cleanup) {
      this.cleanupTasks.set(name, cleanup)
    }

    return resource
  }

  release(name: string): void {
    const usage = this.resourceUsage.get(name) || 0
    if (usage <= 1) {
      const cleanup = this.cleanupTasks.get(name)
      if (cleanup) {
        cleanup()
      }
      this.resources.delete(name)
      this.resourceUsage.delete(name)
      this.cleanupTasks.delete(name)
    } else {
      this.resourceUsage.set(name, usage - 1)
    }
  }

  getResourceUsage(): Record<string, number> {
    return Object.fromEntries(this.resourceUsage)
  }

  cleanup(): void {
    for (const [name, cleanup] of this.cleanupTasks) {
      cleanup()
    }
    this.resources.clear()
    this.resourceUsage.clear()
    this.cleanupTasks.clear()
  }
}

// System initialization
export class SystemCore {
  private static instance: SystemCore
  private config: SystemConfig
  private initialized = false

  static getInstance(): SystemCore {
    if (!SystemCore.instance) {
      SystemCore.instance = new SystemCore()
    }
    return SystemCore.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): SystemConfig {
    return {
      environment: (process.env.NODE_ENV as any) || 'development',
      performance: {
        maxConcurrentAnimations: 25,
        memoryThreshold: 100, // MB
        fpsTarget: 60
      },
      security: {
        enableCSP: true,
        enableCORS: true,
        rateLimit: 1000 // requests per minute
      },
      features: {
        debug: process.env.NODE_ENV === 'development',
        analytics: process.env.NODE_ENV === 'production',
        testing: process.env.NODE_ENV === 'test'
      }
    }
  }

  async initialize(customConfig?: Partial<SystemConfig>): Promise<void> {
    if (this.initialized) {
      return
    }

    // Merge configuration
    this.config = { ...this.config, ...customConfig }

    // Initialize subsystems
    const eventBus = SystemEventBus.getInstance()
    const moduleRegistry = ModuleRegistry.getInstance()
    const resourceManager = ResourceManager.getInstance()

    // Register core modules
    this.registerCoreModules(moduleRegistry)

    // Load modules in dependency order
    const loadOrder = moduleRegistry.getLoadOrder()
    for (const moduleName of loadOrder) {
      await moduleRegistry.loadModule(moduleName)
    }

    // System ready
    this.initialized = true
    eventBus.emitSystemEvent('system:ready', { config: this.config })
  }

  private registerCoreModules(registry: ModuleRegistry): void {
    // Core system modules
    registry.register({
      name: 'core',
      version: '1.0.0',
      dependencies: [],
      exports: ['SystemCore', 'DIContainer', 'SystemEventBus']
    })

    registry.register({
      name: 'ui',
      version: '1.0.0',
      dependencies: ['core'],
      exports: ['Button', 'Card', 'Dialog', 'Form']
    })

    registry.register({
      name: 'animation',
      version: '1.0.0',
      dependencies: ['core', 'ui'],
      exports: ['AnimationProvider', 'useAnimation']
    })

    registry.register({
      name: 'scroll',
      version: '1.0.0',
      dependencies: ['core', 'animation'],
      exports: ['LenisProvider', 'ScrollSection', 'ParallaxLayer']
    })

    registry.register({
      name: 'performance',
      version: '1.0.0',
      dependencies: ['core'],
      exports: ['PerformanceMonitor', 'usePerformance']
    })
  }

  getConfig(): SystemConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<SystemConfig>): void {
    this.config = { ...this.config, ...updates }
    SystemEventBus.getInstance().emitSystemEvent('system:config-updated', updates)
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    const eventBus = SystemEventBus.getInstance()
    const resourceManager = ResourceManager.getInstance()

    eventBus.emitSystemEvent('system:shutdown', {})
    resourceManager.cleanup()
    
    this.initialized = false
  }
}