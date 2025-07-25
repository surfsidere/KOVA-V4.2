/**
 * Component Isolation Utilities
 * Helper functions and utilities for clean, maintainable isolation code
 */

import { ComponentMetadata, ComponentState } from '../isolation/component-isolator'
import { SectionMetadata, LoadingState } from '../loading/progressive-loader'

// ================================
// Type Guards and Validators
// ================================

export function isValidComponentId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id)
}

export function isValidComponentMetadata(metadata: unknown): metadata is ComponentMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'id' in metadata &&
    'name' in metadata &&
    'version' in metadata &&
    isValidComponentId((metadata as any).id)
  )
}

export function isComponentLoaded(state: ComponentState): boolean {
  return state.status === 'ready'
}

export function isComponentLoading(state: ComponentState): boolean {
  return state.status === 'loading'
}

export function isComponentFailed(state: ComponentState): boolean {
  return state.status === 'error'
}

export function isSectionMetadata(metadata: unknown): metadata is SectionMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'id' in metadata &&
    'name' in metadata &&
    'route' in metadata &&
    'priority' in metadata
  )
}

// ================================
// Performance Utilities
// ================================

export class PerformanceTracker {
  private static measurements = new Map<string, number>()
  
  static startMeasure(key: string): void {
    this.measurements.set(key, performance.now())
  }
  
  static endMeasure(key: string): number {
    const start = this.measurements.get(key)
    if (!start) {
      console.warn(`No start measurement found for: ${key}`)
      return 0
    }
    
    const duration = performance.now() - start
    this.measurements.delete(key)
    return duration
  }
  
  static measure<T>(key: string, fn: () => T): T {
    this.startMeasure(key)
    try {
      const result = fn()
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${key}: ${this.endMeasure(key).toFixed(2)}ms`)
      } else {
        this.endMeasure(key)
      }
      return result
    } catch (error) {
      this.endMeasure(key)
      throw error
    }
  }
  
  static async measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(key)
    try {
      const result = await fn()
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${key}: ${this.endMeasure(key).toFixed(2)}ms`)
      } else {
        this.endMeasure(key)
      }
      return result
    } catch (error) {
      this.endMeasure(key)
      throw error
    }
  }
}

// ================================
// Memory Management Utilities
// ================================

export class MemoryManager {
  private static readonly WARNING_THRESHOLD = 50 // MB
  private static readonly CRITICAL_THRESHOLD = 100 // MB
  
  static getCurrentMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }
  
  static checkMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const usage = this.getCurrentMemoryUsage()
    
    if (usage > this.CRITICAL_THRESHOLD) return 'critical'
    if (usage > this.WARNING_THRESHOLD) return 'high'
    if (usage > this.WARNING_THRESHOLD * 0.7) return 'medium'
    return 'low'
  }
  
  static forceGarbageCollection(): void {
    // Force garbage collection if available (mainly for development)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }
  
  static createMemoryPressureMonitor(callback: (pressure: string) => void): () => void {
    const interval = setInterval(() => {
      const pressure = this.checkMemoryPressure()
      callback(pressure)
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }
}

// ================================
// Error Handling Utilities
// ================================

export class ErrorAnalyzer {
  private static errorPatterns = new Map<string, RegExp>([
    ['network', /network|fetch|xhr|timeout|connection/i],
    ['memory', /memory|heap|allocation|out of memory/i],
    ['security', /security|csp|cors|permission|unauthorized/i],
    ['syntax', /syntax|parse|unexpected token|invalid/i],
    ['dependency', /dependency|module|import|require|not found/i],
    ['timeout', /timeout|timed out|deadline|expired/i]
  ])
  
  static categorizeError(error: Error): string {
    const message = error.message.toLowerCase()
    
    for (const [category, pattern] of this.errorPatterns) {
      if (pattern.test(message)) {
        return category
      }
    }
    
    return 'unknown'
  }
  
  static getSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const category = this.categorizeError(error)
    
    switch (category) {
      case 'security': return 'critical'
      case 'memory': return 'high'
      case 'network': return 'medium'
      case 'dependency': return 'medium'
      case 'timeout': return 'medium'
      case 'syntax': return 'low'
      default: return 'low'
    }
  }
  
  static createRecoveryStrategy(error: Error): {
    action: 'retry' | 'fallback' | 'reload' | 'isolate'
    delay: number
    maxAttempts: number
  } {
    const category = this.categorizeError(error)
    
    switch (category) {
      case 'network':
        return { action: 'retry', delay: 1000, maxAttempts: 3 }
      case 'timeout':
        return { action: 'retry', delay: 2000, maxAttempts: 2 }
      case 'memory':
        return { action: 'reload', delay: 0, maxAttempts: 1 }
      case 'security':
        return { action: 'isolate', delay: 0, maxAttempts: 0 }
      case 'dependency':
        return { action: 'fallback', delay: 500, maxAttempts: 1 }
      default:
        return { action: 'retry', delay: 1000, maxAttempts: 2 }
    }
  }
  
  static formatErrorForLogging(error: Error, context?: any): {
    message: string
    category: string
    severity: string
    stack: string
    context: any
    timestamp: string
  } {
    return {
      message: error.message,
      category: this.categorizeError(error),
      severity: this.getSeverity(error),
      stack: error.stack || '',
      context: context || {},
      timestamp: new Date().toISOString()
    }
  }
}

// ================================
// Component Lifecycle Utilities
// ================================

type LifecycleEvent = 
  | 'beforeRegister'
  | 'afterRegister' 
  | 'beforeLoad'
  | 'afterLoad'
  | 'beforeUnload'
  | 'afterUnload'
  | 'onError'

export class LifecycleManager {
  private static readonly LIFECYCLE_EVENTS = [
    'beforeRegister',
    'afterRegister',
    'beforeLoad',
    'afterLoad',
    'beforeUnload',
    'afterUnload',
    'onError'
  ] as const
  
  private callbacks = new Map<string, Array<(componentId: string, data?: any) => void>>()
  
  on(event: LifecycleEvent, callback: (componentId: string, data?: any) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }
  
  off(event: LifecycleEvent, callback: (componentId: string, data?: any) => void): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  emit(event: LifecycleEvent, componentId: string, data?: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(componentId, data)
        } catch (error) {
          console.error(`Error in lifecycle callback for ${event}:`, error)
        }
      })
    }
  }
  
  async emitAsync(event: LifecycleEvent, componentId: string, data?: any): Promise<void> {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      await Promise.all(
        callbacks.map(async callback => {
          try {
            await callback(componentId, data)
          } catch (error) {
            console.error(`Error in async lifecycle callback for ${event}:`, error)
          }
        })
      )
    }
  }
  
  clear(): void {
    this.callbacks.clear()
  }
}

// ================================
// Caching Utilities
// ================================

export class ComponentCache {
  private cache = new Map<string, {
    data: any
    timestamp: number
    ttl: number
    hits: number
  }>()
  
  set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hits: 0
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.hits++
    return entry.data
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
  
  getStats(): {
    size: number
    totalHits: number
    averageAge: number
  } {
    const now = Date.now()
    let totalHits = 0
    let totalAge = 0
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      totalAge += now - entry.timestamp
    }
    
    return {
      size: this.cache.size,
      totalHits,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    }
  }
  
  // LRU eviction
  evictLRU(maxSize: number): void {
    if (this.cache.size <= maxSize) return
    
    const entries = Array.from(this.cache.entries())
    entries.sort(([,a], [,b]) => a.hits - b.hits) // Sort by hits (ascending)
    
    const toRemove = entries.slice(0, this.cache.size - maxSize)
    toRemove.forEach(([key]) => this.cache.delete(key))
  }
}

// ================================
// Batch Processing Utilities
// ================================

export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: Error) => void }> = []
  private processing = false
  
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delayMs: number = 100
  ) {}
  
  async process(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject })
      this.scheduleProcessing()
    })
  }
  
  private scheduleProcessing(): void {
    if (this.processing) return
    
    setTimeout(() => {
      this.processBatch()
    }, this.delayMs)
  }
  
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    try {
      const batch = this.queue.splice(0, this.batchSize)
      const items = batch.map(b => b.item)
      
      const results = await this.processor(items)
      
      batch.forEach((b, index) => {
        if (results[index] !== undefined) {
          b.resolve(results[index])
        } else {
          b.reject(new Error(`No result for item at index ${index}`))
        }
      })
    } catch (error) {
      // Reject all items in the batch
      const batch = this.queue.splice(0, this.batchSize)
      batch.forEach(b => b.reject(error as Error))
    } finally {
      this.processing = false
      
      // Process next batch if there are more items
      if (this.queue.length > 0) {
        this.scheduleProcessing()
      }
    }
  }
  
  getQueueSize(): number {
    return this.queue.length
  }
  
  clear(): void {
    this.queue.forEach(b => b.reject(new Error('Queue cleared')))
    this.queue = []
  }
}

// ================================
// Dependency Resolution Utilities
// ================================

export class DependencyResolver {
  static resolveDependencyOrder(components: ComponentMetadata[]): ComponentMetadata[] {
    const resolved: ComponentMetadata[] = []
    const resolving = new Set<string>()
    const visited = new Set<string>()
    
    const componentMap = new Map(components.map(c => [c.id, c]))
    
    function visit(componentId: string): void {
      if (visited.has(componentId)) return
      if (resolving.has(componentId)) {
        throw new Error(`Circular dependency detected: ${componentId}`)
      }
      
      resolving.add(componentId)
      
      const component = componentMap.get(componentId)
      if (!component) {
        throw new Error(`Component not found: ${componentId}`)
      }
      
      // Visit dependencies first
      component.dependencies.forEach(depId => {
        visit(depId)
      })
      
      resolving.delete(componentId)
      visited.add(componentId)
      resolved.push(component)
    }
    
    components.forEach(component => {
      if (!visited.has(component.id)) {
        visit(component.id)
      }
    })
    
    return resolved
  }
  
  static findCircularDependencies(components: ComponentMetadata[]): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const componentMap = new Map(components.map(c => [c.id, c]))
    
    function dfs(componentId: string, path: string[]): void {
      if (recursionStack.has(componentId)) {
        // Found a cycle
        const cycleStart = path.indexOf(componentId)
        cycles.push(path.slice(cycleStart))
        return
      }
      
      if (visited.has(componentId)) return
      
      visited.add(componentId)
      recursionStack.add(componentId)
      
      const component = componentMap.get(componentId)
      if (component) {
        component.dependencies.forEach(depId => {
          dfs(depId, [...path, componentId])
        })
      }
      
      recursionStack.delete(componentId)
    }
    
    components.forEach(component => {
      if (!visited.has(component.id)) {
        dfs(component.id, [])
      }
    })
    
    return cycles
  }
}

// ================================
// Configuration Utilities
// ================================

export class ConfigurationManager {
  private static config = new Map<string, any>()
  
  static set(key: string, value: any): void {
    this.config.set(key, value)
  }
  
  static get<T>(key: string, defaultValue?: T): T {
    return this.config.get(key) ?? defaultValue
  }
  
  static has(key: string): boolean {
    return this.config.has(key)
  }
  
  static getAll(): Record<string, any> {
    return Object.fromEntries(this.config.entries())
  }
  
  static merge(newConfig: Record<string, any>): void {
    Object.entries(newConfig).forEach(([key, value]) => {
      this.config.set(key, value)
    })
  }
  
  static clear(): void {
    this.config.clear()
  }
  
  // Environment-specific configurations
  static setEnvironment(env: 'development' | 'production' | 'test'): void {
    this.set('environment', env)
    
    // Set environment-specific defaults
    switch (env) {
      case 'development':
        this.merge({
          'debug.enabled': true,
          'monitoring.verbose': true,
          'security.strict': false,
          'performance.optimize': false
        })
        break
        
      case 'production':
        this.merge({
          'debug.enabled': false,
          'monitoring.verbose': false,
          'security.strict': true,
          'performance.optimize': true
        })
        break
        
      case 'test':
        this.merge({
          'debug.enabled': true,
          'monitoring.verbose': false,
          'security.strict': false,
          'performance.optimize': false
        })
        break
    }
  }
  
  static isDevelopment(): boolean {
    return this.get('environment') === 'development'
  }
  
  static isProduction(): boolean {
    return this.get('environment') === 'production'
  }
  
  static isTest(): boolean {
    return this.get('environment') === 'test'
  }
}

// ================================
// Export All Utilities
// ================================

export const IsolationUtils = {
  // Type Guards
  isValidComponentId,
  isValidComponentMetadata,
  isComponentLoaded,
  isComponentLoading,
  isComponentFailed,
  isSectionMetadata,
  
  // Performance
  PerformanceTracker,
  
  // Memory Management
  MemoryManager,
  
  // Error Handling
  ErrorAnalyzer,
  
  // Lifecycle
  LifecycleManager,
  
  // Caching
  ComponentCache,
  
  // Batch Processing
  BatchProcessor,
  
  // Dependency Resolution
  DependencyResolver,
  
  // Configuration
  ConfigurationManager
}