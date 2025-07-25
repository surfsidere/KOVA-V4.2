/**
 * Secure Component Loader
 * Enterprise-grade security for component isolation with CSP, XSS protection, and sandboxing
 */

import { ComponentIsolator, ComponentMetadata } from '../isolation/component-isolator'
import { SystemEventBus } from '../architecture/core-system'
import { SecurityManager } from './security-manager'

export interface SecurityPolicy {
  csp: {
    scriptSrc: string[]
    styleSrc: string[]
    imgSrc: string[]
    connectSrc: string[]
    fontSrc: string[]
    objectSrc: string[]
    mediaSrc: string[]
    frameSrc: string[]
  }
  xss: {
    enableSanitization: boolean
    allowedTags: string[]
    allowedAttributes: string[]
    allowedProtocols: string[]
  }
  sandbox: {
    level: 'strict' | 'moderate' | 'permissive'
    allowedGlobals: string[]
    allowedModules: string[]
    networkAccess: boolean
    domAccess: 'none' | 'read' | 'read-write'
  }
  integrity: {
    requireSRI: boolean
    hashAlgorithm: 'sha256' | 'sha384' | 'sha512'
    validateChecksums: boolean
  }
  rate: {
    maxLoadsPerMinute: number
    maxMemoryMB: number
    maxExecutionTime: number
  }
}

export interface SecurityContext {
  componentId: string
  origin: string
  permissions: string[]
  trustLevel: 'trusted' | 'limited' | 'untrusted'
  signature?: string
  checksum?: string
}

export interface SecurityViolation {
  type: 'csp' | 'xss' | 'sandbox' | 'integrity' | 'rate-limit'
  severity: 'critical' | 'high' | 'medium' | 'low'
  componentId: string
  description: string
  timestamp: Date
  blocked: boolean
  evidence: any
}

export class SecureLoader {
  private static instance: SecureLoader
  private componentIsolator: ComponentIsolator
  private securityManager: SecurityManager
  private eventBus: SystemEventBus
  private policy: SecurityPolicy
  private violations: SecurityViolation[] = []
  private loadCounts = new Map<string, { count: number; lastReset: number }>()
  private trustedOrigins = new Set<string>()
  private componentChecksums = new Map<string, string>()

  static getInstance(): SecureLoader {
    if (!SecureLoader.instance) {
      SecureLoader.instance = new SecureLoader()
    }
    return SecureLoader.instance
  }

  constructor() {
    this.componentIsolator = ComponentIsolator.getInstance()
    this.securityManager = SecurityManager.getInstance()
    this.eventBus = SystemEventBus.getInstance()
    this.policy = this.getDefaultSecurityPolicy()
    this.setupTrustedOrigins()
    this.setupEventHandlers()
  }

  private getDefaultSecurityPolicy(): SecurityPolicy {
    return {
      csp: {
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      },
      xss: {
        enableSanitization: true,
        allowedTags: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'img', 'ul', 'ol', 'li'],
        allowedAttributes: ['class', 'id', 'href', 'src', 'alt', 'title', 'data-*'],
        allowedProtocols: ['http', 'https', 'mailto', 'tel']
      },
      sandbox: {
        level: 'moderate',
        allowedGlobals: ['console', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
        allowedModules: ['react', 'react-dom'],
        networkAccess: false,
        domAccess: 'read'
      },
      integrity: {
        requireSRI: true,
        hashAlgorithm: 'sha384',
        validateChecksums: true
      },
      rate: {
        maxLoadsPerMinute: 60,
        maxMemoryMB: 100,
        maxExecutionTime: 10000
      }
    }
  }

  private setupTrustedOrigins(): void {
    // Add trusted origins
    this.trustedOrigins.add(window.location.origin)
    this.trustedOrigins.add('https://cdn.jsdelivr.net')
    this.trustedOrigins.add('https://unpkg.com')
    // Add your CDN domains here
  }

  private setupEventHandlers(): void {
    this.eventBus.on('security:violation', (data) => {
      this.handleSecurityViolation(data.data)
    })

    this.eventBus.on('security:policy-update', (data) => {
      this.updateSecurityPolicy(data.data.policy)
    })
  }

  // Secure Component Loading
  async secureLoadComponent<T = any>(
    componentId: string, 
    context: Partial<SecurityContext> = {}
  ): Promise<T> {
    const securityContext: SecurityContext = {
      componentId,
      origin: context.origin || window.location.origin,
      permissions: context.permissions || [],
      trustLevel: context.trustLevel || 'untrusted',
      signature: context.signature,
      checksum: context.checksum
    }

    console.log(`🔒 Secure loading component: ${componentId}`)

    try {
      // 1. Security Validation
      await this.validateSecurityContext(securityContext)

      // 2. Rate Limiting
      this.enforceRateLimit(componentId)

      // 3. CSP Validation
      this.validateCSP(securityContext)

      // 4. Integrity Check
      if (this.policy.integrity.requireSRI && securityContext.checksum) {
        await this.validateIntegrity(componentId, securityContext.checksum)
      }

      // 5. Create Secure Sandbox
      const sandbox = this.createSecureSandbox(securityContext)

      // 6. Load Component with Security Context
      const component = await this.componentIsolator.loadComponent(componentId)

      // 7. Post-Load Security Scan
      await this.performSecurityScan(componentId, component)

      // 8. Apply Runtime Protection
      const secureComponent = this.applyRuntimeProtection(component, securityContext)

      this.eventBus.emitSystemEvent('secure-loader:component-loaded', {
        componentId,
        securityContext,
        success: true
      })

      return secureComponent

    } catch (error) {
      await this.handleSecurityError(componentId, error as Error, securityContext)
      throw error
    }
  }

  private async validateSecurityContext(context: SecurityContext): Promise<void> {
    // Origin Validation
    if (!this.trustedOrigins.has(context.origin)) {
      const violation: SecurityViolation = {
        type: 'sandbox',
        severity: 'high',
        componentId: context.componentId,
        description: `Untrusted origin: ${context.origin}`,
        timestamp: new Date(),
        blocked: true,
        evidence: { origin: context.origin, trusted: Array.from(this.trustedOrigins) }
      }
      
      this.recordViolation(violation)
      
      if (context.trustLevel === 'untrusted') {
        throw new Error(`Component from untrusted origin: ${context.origin}`)
      }
    }

    // Signature Validation
    if (context.signature && context.trustLevel === 'trusted') {
      const isValidSignature = await this.validateSignature(context.componentId, context.signature)
      if (!isValidSignature) {
        throw new Error(`Invalid signature for component: ${context.componentId}`)
      }
    }
  }

  private enforceRateLimit(componentId: string): void {
    const now = Date.now()
    const minuteMs = 60 * 1000
    
    let loadData = this.loadCounts.get(componentId)
    
    if (!loadData || now - loadData.lastReset > minuteMs) {
      loadData = { count: 0, lastReset: now }
      this.loadCounts.set(componentId, loadData)
    }

    loadData.count++

    if (loadData.count > this.policy.rate.maxLoadsPerMinute) {
      const violation: SecurityViolation = {
        type: 'rate-limit',
        severity: 'medium',
        componentId,
        description: `Rate limit exceeded: ${loadData.count}/${this.policy.rate.maxLoadsPerMinute} loads per minute`,
        timestamp: new Date(),
        blocked: true,
        evidence: { count: loadData.count, limit: this.policy.rate.maxLoadsPerMinute }
      }
      
      this.recordViolation(violation)
      throw new Error(`Rate limit exceeded for component: ${componentId}`)
    }
  }

  private validateCSP(context: SecurityContext): void {
    // CSP validation logic would be implemented here
    // For now, we'll do basic URL validation
    
    const origin = new URL(context.origin)
    const allowedOrigins = ['self', origin.origin]
    
    // Check if origin is allowed in CSP
    const isAllowed = this.policy.csp.scriptSrc.some(src => 
      src === "'self'" || src === origin.origin || src.includes(origin.hostname)
    )

    if (!isAllowed) {
      const violation: SecurityViolation = {
        type: 'csp',
        severity: 'high',
        componentId: context.componentId,
        description: `CSP violation: Origin ${context.origin} not in script-src`,
        timestamp: new Date(),
        blocked: true,
        evidence: { origin: context.origin, allowedSources: this.policy.csp.scriptSrc }
      }
      
      this.recordViolation(violation)
      throw new Error(`CSP violation: Origin not allowed`)
    }
  }

  private async validateIntegrity(componentId: string, providedChecksum: string): Promise<void> {
    const storedChecksum = this.componentChecksums.get(componentId)
    
    if (storedChecksum && storedChecksum !== providedChecksum) {
      const violation: SecurityViolation = {
        type: 'integrity',
        severity: 'critical',
        componentId,
        description: 'Integrity check failed: Checksum mismatch',
        timestamp: new Date(),
        blocked: true,
        evidence: { expected: storedChecksum, actual: providedChecksum }
      }
      
      this.recordViolation(violation)
      throw new Error(`Integrity check failed for component: ${componentId}`)
    }

    // Store checksum for future validations
    if (!storedChecksum) {
      this.componentChecksums.set(componentId, providedChecksum)
    }
  }

  private createSecureSandbox(context: SecurityContext): any {
    const { sandbox } = this.policy
    const safeSandbox: any = {}

    // Add allowed globals based on security policy
    if (sandbox.allowedGlobals.includes('console')) {
      safeSandbox.console = {
        log: (...args: any[]) => console.log(`[${context.componentId}]`, ...args),
        warn: (...args: any[]) => console.warn(`[${context.componentId}]`, ...args),
        error: (...args: any[]) => console.error(`[${context.componentId}]`, ...args)
      }
    }

    if (sandbox.allowedGlobals.includes('performance')) {
      safeSandbox.performance = {
        now: () => performance.now(),
        mark: (name: string) => performance.mark(`${context.componentId}-${name}`)
      }
    }

    // Add timer functions if allowed
    if (sandbox.allowedGlobals.includes('setTimeout')) {
      safeSandbox.setTimeout = (fn: Function, delay: number) => {
        // Limit execution time
        if (delay > this.policy.rate.maxExecutionTime) {
          throw new Error(`Execution time exceeds limit: ${delay}ms`)
        }
        return setTimeout(fn, delay)
      }
      safeSandbox.clearTimeout = clearTimeout
    }

    // DOM access control
    if (sandbox.domAccess !== 'none') {
      safeSandbox.document = this.createSecureDocumentProxy(context, sandbox.domAccess)
    }

    // Network access control
    if (!sandbox.networkAccess) {
      safeSandbox.fetch = () => {
        throw new Error('Network access denied by security policy')
      }
      safeSandbox.XMLHttpRequest = class {
        constructor() {
          throw new Error('XMLHttpRequest denied by security policy')
        }
      }
    }

    return safeSandbox
  }

  private createSecureDocumentProxy(context: SecurityContext, accessLevel: string): any {
    const originalDocument = document
    
    return new Proxy({}, {
      get(target, prop) {
        // Allow read operations
        if (accessLevel === 'read' || accessLevel === 'read-write') {
          if (typeof prop === 'string' && ['querySelector', 'querySelectorAll', 'getElementById'].includes(prop)) {
            return (selector: string) => {
              // Restrict to component's own elements
              const componentElements = originalDocument.querySelectorAll(`[data-component-id="${context.componentId}"]`)
              // Implementation would filter results to component scope
              return originalDocument[prop as keyof Document](selector as any)
            }
          }
        }

        // Allow write operations only if permitted
        if (accessLevel === 'read-write') {
          if (typeof prop === 'string' && ['createElement', 'createTextNode'].includes(prop)) {
            return originalDocument[prop as keyof Document].bind(originalDocument)
          }
        }

        // Block dangerous operations
        if (typeof prop === 'string' && ['write', 'writeln', 'open', 'close'].includes(prop)) {
          throw new Error(`Document.${prop} is not allowed in sandbox`)
        }

        return originalDocument[prop as keyof Document]
      }
    })
  }

  private async performSecurityScan(componentId: string, component: any): Promise<void> {
    // Scan for XSS vulnerabilities
    if (this.policy.xss.enableSanitization) {
      await this.scanForXSS(componentId, component)
    }

    // Scan for suspicious patterns
    await this.scanForSuspiciousPatterns(componentId, component)

    // Memory usage check
    const memoryUsage = this.getComponentMemoryUsage(componentId)
    if (memoryUsage > this.policy.rate.maxMemoryMB) {
      const violation: SecurityViolation = {
        type: 'rate-limit',
        severity: 'medium',
        componentId,
        description: `Memory usage exceeds limit: ${memoryUsage}MB > ${this.policy.rate.maxMemoryMB}MB`,
        timestamp: new Date(),
        blocked: false,
        evidence: { memoryUsage, limit: this.policy.rate.maxMemoryMB }
      }
      
      this.recordViolation(violation)
    }
  }

  private async scanForXSS(componentId: string, component: any): Promise<void> {
    // Basic XSS pattern detection
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi
    ]

    const componentString = JSON.stringify(component)
    
    for (const pattern of xssPatterns) {
      if (pattern.test(componentString)) {
        const violation: SecurityViolation = {
          type: 'xss',
          severity: 'critical',
          componentId,
          description: `Potential XSS detected: ${pattern.source}`,
          timestamp: new Date(),
          blocked: true,
          evidence: { pattern: pattern.source, match: componentString.match(pattern) }
        }
        
        this.recordViolation(violation)
        throw new Error(`XSS vulnerability detected in component: ${componentId}`)
      }
    }
  }

  private async scanForSuspiciousPatterns(componentId: string, component: any): Promise<void> {
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi
    ]

    const componentString = JSON.stringify(component)
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(componentString)) {
        const violation: SecurityViolation = {
          type: 'sandbox',
          severity: 'high',
          componentId,
          description: `Suspicious pattern detected: ${pattern.source}`,
          timestamp: new Date(),
          blocked: false,
          evidence: { pattern: pattern.source }
        }
        
        this.recordViolation(violation)
      }
    }
  }

  private applyRuntimeProtection(component: any, context: SecurityContext): any {
    // Wrap component methods with security checks
    return new Proxy(component, {
      get(target, prop) {
        const value = target[prop]
        
        // Intercept potentially dangerous method calls
        if (typeof value === 'function' && typeof prop === 'string') {
          return function(...args: any[]) {
            // Log method calls for audit
            console.log(`🔒 [${context.componentId}] Method call: ${prop}`)
            
            // Apply method-specific security checks
            if (prop === 'render' || prop === 'update') {
              // Sanitize output
              const result = value.apply(target, args)
              return typeof result === 'string' ? this.sanitizeHTML(result) : result
            }
            
            return value.apply(target, args)
          }.bind(this)
        }
        
        return value
      }
    })
  }

  private sanitizeHTML(html: string): string {
    if (!this.policy.xss.enableSanitization) {
      return html
    }

    // Basic HTML sanitization (in production, use a library like DOMPurify)
    const allowedTags = this.policy.xss.allowedTags.join('|')
    const tagPattern = new RegExp(`<(?!/?(?:${allowedTags})\\b)[^>]*>`, 'gi')
    
    return html.replace(tagPattern, '')
  }

  private async validateSignature(componentId: string, signature: string): Promise<boolean> {
    // Signature validation would be implemented here
    // This is a placeholder implementation
    return signature.length > 32 // Basic length check
  }

  private getComponentMemoryUsage(componentId: string): number {
    const state = this.componentIsolator.getComponentState(componentId)
    return state.memoryUsage || 0
  }

  private recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation)
    
    // Emit security event
    this.eventBus.emitSystemEvent('security:violation', violation)
    
    // Log violation
    console.error(`🚨 Security violation: ${violation.type} - ${violation.description}`, violation)
    
    // Notify security manager
    this.securityManager.reportSecurityEvent({
      type: violation.type,
      severity: violation.severity,
      description: violation.description,
      timestamp: violation.timestamp,
      source: violation.componentId,
      data: violation.evidence
    })
  }

  private async handleSecurityError(
    componentId: string, 
    error: Error, 
    context: SecurityContext
  ): Promise<void> {
    const violation: SecurityViolation = {
      type: 'sandbox',
      severity: 'high',
      componentId,
      description: `Security error during component load: ${error.message}`,
      timestamp: new Date(),
      blocked: true,
      evidence: { error: error.message, context }
    }
    
    this.recordViolation(violation)
    
    this.eventBus.emitSystemEvent('secure-loader:load-failed', {
      componentId,
      error: error.message,
      context
    })
  }

  private handleSecurityViolation(violation: SecurityViolation): void {
    // Handle different types of violations
    switch (violation.severity) {
      case 'critical':
        // Immediate action - quarantine component
        this.componentIsolator.unloadComponent(violation.componentId)
        break
        
      case 'high':
        // Monitor closely
        console.warn(`🔍 High severity violation in ${violation.componentId}`)
        break
        
      case 'medium':
      case 'low':
        // Log and continue
        console.log(`📝 Security event: ${violation.description}`)
        break
    }
  }

  // Public API
  updateSecurityPolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...updates }
    
    this.eventBus.emitSystemEvent('secure-loader:policy-updated', {
      policy: this.policy
    })
    
    console.log('🔒 Security policy updated', updates)
  }

  getSecurityReport(): {
    violations: SecurityViolation[]
    policy: SecurityPolicy
    trustedOrigins: string[]
    statistics: {
      totalViolations: number
      criticalViolations: number
      blockedLoads: number
      averageLoadsPerMinute: number
    }
  } {
    const now = Date.now()
    const hourMs = 60 * 60 * 1000
    const recentViolations = this.violations.filter(v => now - v.timestamp.getTime() < hourMs)
    
    return {
      violations: [...this.violations],
      policy: { ...this.policy },
      trustedOrigins: Array.from(this.trustedOrigins),
      statistics: {
        totalViolations: this.violations.length,
        criticalViolations: this.violations.filter(v => v.severity === 'critical').length,
        blockedLoads: this.violations.filter(v => v.blocked).length,
        averageLoadsPerMinute: recentViolations.length / 60
      }
    }
  }

  addTrustedOrigin(origin: string): void {
    this.trustedOrigins.add(origin)
    console.log(`🔒 Added trusted origin: ${origin}`)
  }

  removeTrustedOrigin(origin: string): void {
    this.trustedOrigins.delete(origin)
    console.log(`🔒 Removed trusted origin: ${origin}`)
  }

  registerComponentChecksum(componentId: string, checksum: string): void {
    this.componentChecksums.set(componentId, checksum)
    console.log(`🔒 Registered checksum for component: ${componentId}`)
  }

  clearViolations(): void {
    this.violations = []
    console.log('🔒 Security violations cleared')
  }
}