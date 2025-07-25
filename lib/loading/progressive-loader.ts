/**
 * Progressive Loading Engine
 * World-class loading strategy: current section displays while next preloads
 */

import { ComponentIsolator } from '../isolation/component-isolator'
import { PerformanceEngine } from '../performance/performance-engine'
import { SystemEventBus } from '../architecture/core-system'

export interface SectionMetadata {
  id: string
  name: string
  route: string
  priority: 'critical' | 'above-fold' | 'below-fold' | 'lazy'
  dependencies: string[]
  preloadTrigger: 'immediate' | 'viewport' | 'interaction' | 'idle'
  estimatedSize: number // KB
  renderComplexity: 'low' | 'medium' | 'high'
  cacheStrategy: 'memory' | 'disk' | 'network' | 'none'
}

export interface LoadingState {
  current: string | null
  loading: Set<string>
  loaded: Set<string>
  failed: Set<string>
  preloading: Set<string>
  cached: Set<string>
}

export interface ProgressiveConfig {
  preloadDistance: number // How many sections ahead to preload
  viewportThreshold: number // Intersection observer threshold
  idleTimeout: number // Timeout for idle preloading
  concurrentLoads: number // Max simultaneous loads
  priorityBudget: {
    critical: number // KB budget for critical resources
    aboveFold: number
    belowFold: number
  }
  caching: {
    maxMemoryMB: number
    maxDiskMB: number
    ttlMinutes: number
  }
}

export class ProgressiveLoader {
  private static instance: ProgressiveLoader
  private sections = new Map<string, SectionMetadata>()
  private loadingState: LoadingState
  private config: ProgressiveConfig
  private intersectionObserver?: IntersectionObserver
  private mutationObserver?: MutationObserver
  private componentIsolator: ComponentIsolator
  private performanceEngine: PerformanceEngine
  private eventBus: SystemEventBus
  private loadQueue: Array<{ sectionId: string; priority: number }>
  private loadingPromises = new Map<string, Promise<any>>()

  static getInstance(): ProgressiveLoader {
    if (!ProgressiveLoader.instance) {
      ProgressiveLoader.instance = new ProgressiveLoader()
    }
    return ProgressiveLoader.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
    this.loadingState = {
      current: null,
      loading: new Set(),
      loaded: new Set(),
      failed: new Set(),
      preloading: new Set(),
      cached: new Set()
    }
    this.loadQueue = []
    this.componentIsolator = ComponentIsolator.getInstance()
    this.performanceEngine = PerformanceEngine.getInstance()
    this.eventBus = SystemEventBus.getInstance()
    
    this.initialize()
  }

  private getDefaultConfig(): ProgressiveConfig {
    return {
      preloadDistance: 2,
      viewportThreshold: 0.1,
      idleTimeout: 2000,
      concurrentLoads: 3,
      priorityBudget: {
        critical: 500, // 500KB for critical resources
        aboveFold: 1000, // 1MB for above-fold
        belowFold: 2000 // 2MB for below-fold
      },
      caching: {
        maxMemoryMB: 100,
        maxDiskMB: 500,
        ttlMinutes: 60
      }
    }
  }

  private initialize(): void {
    this.setupIntersectionObserver()
    this.setupMutationObserver()
    this.setupEventHandlers()
    this.startLoadQueue()
    
    console.log('🚀 Progressive Loader initialized')
  }

  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const sectionId = entry.target.getAttribute('data-section-id')
          if (!sectionId) return

          if (entry.isIntersecting) {
            this.handleSectionVisible(sectionId, entry.intersectionRatio)
          } else {
            this.handleSectionHidden(sectionId)
          }
        })
      },
      {
        rootMargin: '50px 0px 200px 0px', // Preload when 200px before entering viewport
        threshold: [0, this.config.viewportThreshold, 0.5, 1.0]
      }
    )
  }

  private setupMutationObserver(): void {
    if (typeof window === 'undefined' || !('MutationObserver' in window)) {
      return
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const sectionId = element.getAttribute?.('data-section-id')
            if (sectionId) {
              this.observeSection(element)
            }
          }
        })
      })
    })

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private setupEventHandlers(): void {
    this.eventBus.on('router:navigation', (data) => {
      this.handleNavigation(data.data.to, data.data.from)
    })

    this.eventBus.on('user:idle', () => {
      this.handleUserIdle()
    })

    this.eventBus.on('performance:budget-exceeded', (data) => {
      this.handleBudgetExceeded(data.data.budget, data.data.usage)
    })

    // Network status monitoring
    if (typeof window !== 'undefined' && 'navigator' in window && 'connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', () => {
        this.handleNetworkChange(connection.effectiveType)
      })
    }
  }

  private startLoadQueue(): void {
    setInterval(() => {
      this.processLoadQueue()
    }, 100) // Process queue every 100ms
  }

  // Section Registration
  registerSection(metadata: SectionMetadata): void {
    this.validateSectionMetadata(metadata)
    this.sections.set(metadata.id, metadata)
    
    console.log(`📋 Section registered: ${metadata.name} (${metadata.id})`)
    
    // Auto-register with component isolator
    this.componentIsolator.registerComponent({
      id: metadata.id,
      name: metadata.name,
      version: '1.0.0',
      dependencies: metadata.dependencies,
      loadPriority: this.mapPriorityToComponent(metadata.priority),
      size: metadata.estimatedSize,
      lazy: metadata.priority !== 'critical',
      preload: metadata.preloadTrigger === 'immediate',
      cache: metadata.cacheStrategy !== 'none'
    })

    // Start immediate preloading for critical sections
    if (metadata.priority === 'critical' || metadata.preloadTrigger === 'immediate') {
      this.queueLoad(metadata.id, this.getPriorityScore(metadata.priority))
    }
  }

  private validateSectionMetadata(metadata: SectionMetadata): void {
    if (!metadata.id || !metadata.name || !metadata.route) {
      throw new Error('Section metadata must include id, name, and route')
    }

    if (metadata.estimatedSize > 1000) {
      console.warn(`⚠️ Large section detected: ${metadata.name} (${metadata.estimatedSize}KB)`)
    }

    // Validate budget constraints
    const budgetLimit = this.config.priorityBudget[metadata.priority] || this.config.priorityBudget.belowFold
    if (metadata.estimatedSize > budgetLimit) {
      console.warn(`💰 Section exceeds budget: ${metadata.name} (${metadata.estimatedSize}KB > ${budgetLimit}KB)`)
    }
  }

  private mapPriorityToComponent(priority: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping = {
      'critical': 'critical' as const,
      'above-fold': 'high' as const,
      'below-fold': 'medium' as const,
      'lazy': 'low' as const
    }
    return mapping[priority as keyof typeof mapping] || 'medium'
  }

  private getPriorityScore(priority: string): number {
    const scores = {
      'critical': 1000,
      'above-fold': 100,
      'below-fold': 10,
      'lazy': 1
    }
    return scores[priority as keyof typeof scores] || 1
  }

  // Progressive Loading Logic
  async loadSection(sectionId: string, options: { preload?: boolean; force?: boolean } = {}): Promise<any> {
    const metadata = this.sections.get(sectionId)
    if (!metadata) {
      throw new Error(`Section not found: ${sectionId}`)
    }

    // Check if already loaded
    if (this.loadingState.loaded.has(sectionId) && !options.force) {
      return this.getLoadedSection(sectionId)
    }

    // Check if already loading
    if (this.loadingPromises.has(sectionId)) {
      return this.loadingPromises.get(sectionId)
    }

    // Start loading process
    const loadPromise = this.performProgressiveLoad(sectionId, metadata, options)
    this.loadingPromises.set(sectionId, loadPromise)

    try {
      const result = await loadPromise
      this.loadingPromises.delete(sectionId)
      return result
    } catch (error) {
      this.loadingPromises.delete(sectionId)
      throw error
    }
  }

  private async performProgressiveLoad(
    sectionId: string, 
    metadata: SectionMetadata, 
    options: { preload?: boolean; force?: boolean }
  ): Promise<any> {
    const startTime = performance.now()
    const isPreload = options.preload || false

    try {
      // Update state
      if (isPreload) {
        this.loadingState.preloading.add(sectionId)
      } else {
        this.loadingState.loading.add(sectionId)
        this.loadingState.current = sectionId
      }

      // Emit loading start event
      this.eventBus.emitSystemEvent('loader:section-loading', {
        sectionId,
        metadata,
        isPreload,
        startTime
      })

      // Check resource budget
      await this.checkResourceBudget(metadata)

      // Load dependencies first
      await this.loadDependencies(metadata.dependencies)

      // Perform the actual load using component isolator
      const section = await this.componentIsolator.loadComponent(sectionId)

      // Post-load processing
      await this.postProcessSection(sectionId, section, metadata)

      // Update state
      this.loadingState.loaded.add(sectionId)
      this.loadingState.loading.delete(sectionId)
      this.loadingState.preloading.delete(sectionId)

      // Cache if needed
      if (metadata.cacheStrategy !== 'none') {
        this.cacheSection(sectionId, section, metadata.cacheStrategy)
      }

      const loadTime = performance.now() - startTime
      
      // Emit success event
      this.eventBus.emitSystemEvent('loader:section-loaded', {
        sectionId,
        loadTime,
        isPreload,
        memoryUsage: await this.measureSectionMemory(sectionId)
      })

      console.log(`${isPreload ? '⚡' : '✅'} Section ${isPreload ? 'preloaded' : 'loaded'}: ${metadata.name} (${loadTime.toFixed(2)}ms)`)

      // Trigger next section preloading
      if (!isPreload) {
        this.scheduleNextPreloads(sectionId)
      }

      return section

    } catch (error) {
      // Handle loading error
      this.loadingState.failed.add(sectionId)
      this.loadingState.loading.delete(sectionId)
      this.loadingState.preloading.delete(sectionId)

      console.error(`❌ Section load failed: ${metadata.name}`, error)

      this.eventBus.emitSystemEvent('loader:section-failed', {
        sectionId,
        error: error.message,
        isPreload
      })

      throw error
    }
  }

  private async checkResourceBudget(metadata: SectionMetadata): Promise<void> {
    const currentBudget = this.calculateCurrentBudgetUsage(metadata.priority)
    const budgetLimit = this.config.priorityBudget[metadata.priority]

    if (currentBudget + metadata.estimatedSize > budgetLimit) {
      // Try to free up resources
      await this.freeUpResources(metadata.priority, metadata.estimatedSize)
    }
  }

  private calculateCurrentBudgetUsage(priority: string): number {
    let usage = 0
    
    for (const [sectionId, sectionMetadata] of this.sections) {
      if (sectionMetadata.priority === priority && this.loadingState.loaded.has(sectionId)) {
        usage += sectionMetadata.estimatedSize
      }
    }
    
    return usage
  }

  private async freeUpResources(priority: string, neededSize: number): Promise<void> {
    const candidates = Array.from(this.loadingState.loaded)
      .map(id => ({ id, metadata: this.sections.get(id)! }))
      .filter(item => item.metadata.priority === priority)
      .sort((a, b) => {
        // Sort by last access time (LRU)
        const stateA = this.componentIsolator.getComponentState(a.id)
        const stateB = this.componentIsolator.getComponentState(b.id)
        return stateA.lastAccessed.getTime() - stateB.lastAccessed.getTime()
      })

    let freedSize = 0
    for (const candidate of candidates) {
      if (freedSize >= neededSize) break

      this.unloadSection(candidate.id)
      freedSize += candidate.metadata.estimatedSize
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    const loadPromises = dependencies.map(async (depId) => {
      if (!this.loadingState.loaded.has(depId)) {
        return this.loadSection(depId, { preload: true })
      }
    })

    await Promise.all(loadPromises)
  }

  private async postProcessSection(sectionId: string, section: any, metadata: SectionMetadata): Promise<void> {
    // Post-processing based on render complexity
    if (metadata.renderComplexity === 'high') {
      // Implement lazy rendering for complex sections
      await this.setupLazyRendering(sectionId, section)
    }

    // Setup section observers
    this.setupSectionObserver(sectionId)
  }

  private async setupLazyRendering(sectionId: string, section: any): Promise<void> {
    // Implement progressive rendering for complex sections
    if (typeof section.enableProgressiveRendering === 'function') {
      await section.enableProgressiveRendering()
    }
  }

  private setupSectionObserver(sectionId: string): void {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`)
    if (element && this.intersectionObserver) {
      this.intersectionObserver.observe(element)
    }
  }

  private async measureSectionMemory(sectionId: string): Promise<number> {
    const state = this.componentIsolator.getComponentState(sectionId)
    return state.memoryUsage || 0
  }

  private cacheSection(sectionId: string, section: any, strategy: string): void {
    this.loadingState.cached.add(sectionId)
    
    // Implement caching based on strategy
    switch (strategy) {
      case 'memory':
        this.cacheInMemory(sectionId, section)
        break
      case 'disk':
        this.cacheToDisk(sectionId, section)
        break
      case 'network':
        this.cacheToNetwork(sectionId, section)
        break
    }
  }

  private cacheInMemory(sectionId: string, section: any): void {
    // Memory caching is handled by component isolator
    console.log(`💾 Section cached in memory: ${sectionId}`)
  }

  private cacheToDisk(sectionId: string, section: any): void {
    if ('serviceWorker' in navigator) {
      // Use service worker for disk caching
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({
          type: 'CACHE_SECTION',
          sectionId,
          data: JSON.stringify(section)
        })
      })
    }
  }

  private cacheToNetwork(sectionId: string, section: any): void {
    // Network caching (CDN, etc.)
    // Implementation would depend on your CDN/caching strategy
    console.log(`🌐 Section cached to network: ${sectionId}`)
  }

  private scheduleNextPreloads(currentSectionId: string): void {
    const nextSections = this.getNextSections(currentSectionId, this.config.preloadDistance)
    
    nextSections.forEach(sectionId => {
      if (!this.loadingState.loaded.has(sectionId) && !this.loadingState.preloading.has(sectionId)) {
        const metadata = this.sections.get(sectionId)!
        this.queueLoad(sectionId, this.getPriorityScore(metadata.priority), true)
      }
    })
  }

  private getNextSections(currentSectionId: string, distance: number): string[] {
    // This would be implemented based on your routing/navigation logic
    // For now, return empty array
    return []
  }

  // Event Handlers
  private handleSectionVisible(sectionId: string, intersectionRatio: number): void {
    const metadata = this.sections.get(sectionId)
    if (!metadata) return

    // Trigger loading based on intersection ratio
    if (intersectionRatio >= this.config.viewportThreshold) {
      if (metadata.preloadTrigger === 'viewport') {
        this.queueLoad(sectionId, this.getPriorityScore(metadata.priority))
      }
    }

    // Update current section
    if (intersectionRatio > 0.5) {
      this.loadingState.current = sectionId
      this.eventBus.emitSystemEvent('loader:section-active', { sectionId })
    }
  }

  private handleSectionHidden(sectionId: string): void {
    // Section no longer visible - could trigger cleanup
    this.eventBus.emitSystemEvent('loader:section-inactive', { sectionId })
  }

  private handleNavigation(to: string, from: string): void {
    // Handle route-based section loading
    const targetSection = Array.from(this.sections.values()).find(s => s.route === to)
    if (targetSection) {
      this.queueLoad(targetSection.id, 1000) // High priority for navigation
    }
  }

  private handleUserIdle(): void {
    // Trigger idle preloading
    const idleCandidates = Array.from(this.sections.entries())
      .filter(([id, metadata]) => 
        metadata.preloadTrigger === 'idle' && 
        !this.loadingState.loaded.has(id) &&
        !this.loadingState.preloading.has(id)
      )
      .map(([id, metadata]) => ({ id, priority: this.getPriorityScore(metadata.priority) }))

    idleCandidates.forEach(({ id, priority }) => {
      this.queueLoad(id, priority, true)
    })
  }

  private handleBudgetExceeded(budget: string, usage: number): void {
    console.warn(`💰 Budget exceeded: ${budget} (${usage}KB)`)
    // Implement budget management strategies
  }

  private handleNetworkChange(effectiveType: string): void {
    // Adjust loading strategy based on network conditions
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.config.concurrentLoads = 1
      this.config.preloadDistance = 1
    } else if (effectiveType === '3g') {
      this.config.concurrentLoads = 2
      this.config.preloadDistance = 1
    } else {
      this.config.concurrentLoads = 3
      this.config.preloadDistance = 2
    }
  }

  // Load Queue Management
  private queueLoad(sectionId: string, priority: number, isPreload: boolean = false): void {
    this.loadQueue.push({ sectionId, priority })
    this.loadQueue.sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
  }

  private processLoadQueue(): void {
    const activeLoads = this.loadingState.loading.size + this.loadingState.preloading.size
    
    if (activeLoads >= this.config.concurrentLoads || this.loadQueue.length === 0) {
      return
    }

    const nextLoad = this.loadQueue.shift()
    if (nextLoad) {
      this.loadSection(nextLoad.sectionId, { preload: true }).catch(error => {
        console.error(`Queue load failed: ${nextLoad.sectionId}`, error)
      })
    }
  }

  // Public API
  observeSection(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element)
    }
  }

  unloadSection(sectionId: string): void {
    this.componentIsolator.unloadComponent(sectionId)
    this.loadingState.loaded.delete(sectionId)
    this.loadingState.cached.delete(sectionId)
    
    console.log(`🗑️ Section unloaded: ${sectionId}`)
  }

  preloadNextSections(count: number = this.config.preloadDistance): void {
    const currentSection = this.loadingState.current
    if (currentSection) {
      this.scheduleNextPreloads(currentSection)
    }
  }

  getLoadingState(): LoadingState {
    return {
      current: this.loadingState.current,
      loading: new Set(this.loadingState.loading),
      loaded: new Set(this.loadingState.loaded),
      failed: new Set(this.loadingState.failed),
      preloading: new Set(this.loadingState.preloading),
      cached: new Set(this.loadingState.cached)
    }
  }

  getLoadingReport(): {
    totalSections: number
    loadedSections: number
    failedSections: number
    cachedSections: number
    memoryUsage: number
    averageLoadTime: number
  } {
    const isolationReport = this.componentIsolator.getIsolationReport()
    
    return {
      totalSections: this.sections.size,
      loadedSections: this.loadingState.loaded.size,
      failedSections: this.loadingState.failed.size,
      cachedSections: this.loadingState.cached.size,
      memoryUsage: isolationReport.memoryUsage,
      averageLoadTime: isolationReport.averageLoadTime
    }
  }

  private getLoadedSection(sectionId: string): any {
    return this.componentIsolator.getComponentState(sectionId)
  }

  updateConfig(updates: Partial<ProgressiveConfig>): void {
    this.config = { ...this.config, ...updates }
    
    this.eventBus.emitSystemEvent('loader:config-updated', {
      config: this.config
    })
  }

  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }

    this.loadQueue.length = 0
    this.loadingPromises.clear()
    
    console.log('🗑️ Progressive Loader destroyed')
  }
}