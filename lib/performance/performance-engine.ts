/**
 * High-Performance Engine
 * Sub-100ms operations with intelligent resource management
 */

import { SystemEventBus, ResourceManager } from '../architecture/core-system'

export interface PerformanceConfig {
  monitoring: {
    enabled: boolean
    sampleRate: number
    metricsBuffer: number
  }
  thresholds: {
    fpsMin: number
    memoryMax: number // MB
    renderTime: number // ms
    bundleSize: number // KB
  }
  optimization: {
    lazyLoading: boolean
    codesplitting: boolean
    preloading: boolean
    imageOptimization: boolean
  }
  caching: {
    enabled: boolean
    maxAge: number
    maxEntries: number
  }
}

export interface PerformanceMetrics {
  fps: number
  averageFps: number
  memoryUsage: number
  renderTime: number
  bundleSize: number
  cacheHitRate: number
  timestamp: number
}

export class PerformanceEngine {
  private static instance: PerformanceEngine
  private config: PerformanceConfig
  private metrics: PerformanceMetrics[] = []
  private observer?: PerformanceObserver
  private animationFrameId?: number
  private lastFrameTime = 0
  private frameCount = 0
  private cache = new Map<string, CacheEntry>()

  static getInstance(): PerformanceEngine {
    if (!PerformanceEngine.instance) {
      PerformanceEngine.instance = new PerformanceEngine()
    }
    return PerformanceEngine.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
    this.initializeMonitoring()
  }

  private getDefaultConfig(): PerformanceConfig {
    return {
      monitoring: {
        enabled: true,
        sampleRate: 1000, // Sample every second
        metricsBuffer: 100 // Keep last 100 samples
      },
      thresholds: {
        fpsMin: 55,
        memoryMax: 100,
        renderTime: 16.67, // 60fps = 16.67ms per frame
        bundleSize: 500
      },
      optimization: {
        lazyLoading: true,
        codesplitting: true,
        preloading: true,
        imageOptimization: true
      },
      caching: {
        enabled: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
        maxEntries: 1000
      }
    }
  }

  private initializeMonitoring(): void {
    if (!this.config.monitoring.enabled || typeof window === 'undefined') {
      return
    }

    // FPS monitoring
    this.startFPSMonitoring()

    // Performance Observer for detailed metrics
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        this.processPerformanceEntries(list.getEntries())
      })

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
      } catch (error) {
        console.warn('Performance monitoring not fully supported', error)
      }
    }

    // Memory monitoring
    this.startMemoryMonitoring()
  }

  private startFPSMonitoring(): void {
    const measureFPS = (currentTime: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = currentTime
      }

      const deltaTime = currentTime - this.lastFrameTime
      this.frameCount++

      if (deltaTime >= 1000) { // Calculate FPS every second
        const fps = Math.round((this.frameCount * 1000) / deltaTime)
        this.updateFPSMetrics(fps)
        
        this.frameCount = 0
        this.lastFrameTime = currentTime
      }

      this.animationFrameId = requestAnimationFrame(measureFPS)
    }

    this.animationFrameId = requestAnimationFrame(measureFPS)
  }

  private updateFPSMetrics(fps: number): void {
    const eventBus = SystemEventBus.getInstance()
    
    if (fps < this.config.thresholds.fpsMin) {
      eventBus.emitPerformanceEvent('fps_low', fps, this.config.thresholds.fpsMin)
    }

    this.addMetricSample({ fps })
  }

  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      return
    }

    setInterval(() => {
      const memory = (performance as any).memory
      const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024)
      
      if (memoryUsageMB > this.config.thresholds.memoryMax) {
        SystemEventBus.getInstance().emitPerformanceEvent(
          'memory_high', 
          memoryUsageMB, 
          this.config.thresholds.memoryMax
        )
      }

      this.addMetricSample({ memoryUsage: memoryUsageMB })
    }, this.config.monitoring.sampleRate)
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    for (const entry of entries) {
      if (entry.entryType === 'measure') {
        this.processMeasureEntry(entry as PerformanceMeasure)
      } else if (entry.entryType === 'resource') {
        this.processResourceEntry(entry as PerformanceResourceTiming)
      }
    }
  }

  private processMeasureEntry(entry: PerformanceMeasure): void {
    if (entry.duration > this.config.thresholds.renderTime) {
      SystemEventBus.getInstance().emitPerformanceEvent(
        'render_slow',
        entry.duration,
        this.config.thresholds.renderTime
      )
    }

    this.addMetricSample({ renderTime: entry.duration })
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const sizeKB = entry.transferSize / 1024
    
    if (sizeKB > this.config.thresholds.bundleSize) {
      SystemEventBus.getInstance().emitPerformanceEvent(
        'bundle_large',
        sizeKB,
        this.config.thresholds.bundleSize
      )
    }
  }

  private addMetricSample(sample: Partial<PerformanceMetrics>): void {
    const timestamp = Date.now()
    const currentMetrics = this.getCurrentMetrics()
    
    const newMetrics: PerformanceMetrics = {
      ...currentMetrics,
      ...sample,
      timestamp
    }

    this.metrics.push(newMetrics)

    // Keep buffer size manageable
    if (this.metrics.length > this.config.monitoring.metricsBuffer) {
      this.metrics.shift()
    }
  }

  private getCurrentMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        fps: 60,
        averageFps: 60,
        memoryUsage: 0,
        renderTime: 0,
        bundleSize: 0,
        cacheHitRate: 0,
        timestamp: Date.now()
      }
    }

    const latest = this.metrics[this.metrics.length - 1]
    const averageFps = this.metrics.reduce((sum, m) => sum + m.fps, 0) / this.metrics.length

    return {
      ...latest,
      averageFps: Math.round(averageFps)
    }
  }

  // Smart caching system
  setCache<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.caching.enabled) {
      return
    }

    const expiresAt = Date.now() + (ttl || this.config.caching.maxAge)
    
    this.cache.set(key, {
      value,
      expiresAt,
      accessCount: 0,
      createdAt: Date.now()
    })

    // Clean up old entries
    this.cleanupCache()
  }

  getCache<T>(key: string): T | null {
    if (!this.config.caching.enabled) {
      return null
    }

    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    entry.accessCount++
    return entry.value as T
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.config.caching.maxEntries) {
      return
    }

    // Remove expired entries first
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }

    // If still over limit, remove least recently used
    if (this.cache.size > this.config.caching.maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount)
      
      const toRemove = entries.slice(0, entries.length - this.config.caching.maxEntries)
      for (const [key] of toRemove) {
        this.cache.delete(key)
      }
    }
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    const currentMetrics = this.getCurrentMetrics()

    if (currentMetrics.fps < this.config.thresholds.fpsMin) {
      suggestions.push({
        type: 'fps',
        severity: 'high',
        message: `FPS is ${currentMetrics.fps}, below target of ${this.config.thresholds.fpsMin}`,
        actions: [
          'Reduce concurrent animations',
          'Enable frame rate limiting',
          'Optimize render-heavy components'
        ]
      })
    }

    if (currentMetrics.memoryUsage > this.config.thresholds.memoryMax) {
      suggestions.push({
        type: 'memory',
        severity: 'high',
        message: `Memory usage is ${currentMetrics.memoryUsage.toFixed(1)}MB, above limit of ${this.config.thresholds.memoryMax}MB`,
        actions: [
          'Implement component cleanup',
          'Reduce image sizes',
          'Enable garbage collection optimization'
        ]
      })
    }

    if (currentMetrics.renderTime > this.config.thresholds.renderTime) {
      suggestions.push({
        type: 'render',
        severity: 'medium',
        message: `Average render time is ${currentMetrics.renderTime.toFixed(2)}ms, above target of ${this.config.thresholds.renderTime}ms`,
        actions: [
          'Implement virtual scrolling',
          'Use React.memo for expensive components',
          'Optimize re-render patterns'
        ]
      })
    }

    return suggestions
  }

  // Resource preloading
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): Promise<void> {
    if (!this.config.optimization.preloading) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      
      switch (type) {
        case 'script':
          link.as = 'script'
          break
        case 'style':
          link.as = 'style'
          break
        case 'image':
          link.as = 'image'
          break
        case 'fetch':
          link.as = 'fetch'
          link.crossOrigin = 'anonymous'
          break
      }

      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to preload: ${url}`))
      
      document.head.appendChild(link)
    })
  }

  // Performance measurement utilities
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`)
    }
  }

  endMeasure(name: string): number | null {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const entries = performance.getEntriesByName(name, 'measure')
      return entries.length > 0 ? entries[entries.length - 1].duration : null
    }
    return null
  }

  // Get current performance state
  getMetrics(): PerformanceMetrics {
    return this.getCurrentMetrics()
  }

  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates }
    SystemEventBus.getInstance().emitSystemEvent('performance:config-updated', updates)
  }

  // Cleanup
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    
    if (this.observer) {
      this.observer.disconnect()
    }

    this.cache.clear()
    this.metrics.length = 0
  }
}

// Type definitions
interface CacheEntry {
  value: any
  expiresAt: number
  accessCount: number
  createdAt: number
}

export interface OptimizationSuggestion {
  type: 'fps' | 'memory' | 'render' | 'bundle'
  severity: 'low' | 'medium' | 'high'
  message: string
  actions: string[]
}