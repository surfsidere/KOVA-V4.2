/**
 * Enterprise Security Manager
 * Zero-trust architecture with comprehensive protection
 */

import { SystemEventBus } from '../architecture/core-system'

export interface SecurityConfig {
  csp: {
    enabled: boolean
    directives: Record<string, string[]>
  }
  cors: {
    enabled: boolean
    origins: string[]
    credentials: boolean
  }
  rateLimit: {
    enabled: boolean
    windowMs: number
    maxRequests: number
  }
  headers: {
    hsts: boolean
    nosniff: boolean
    xssProtection: boolean
    frameOptions: string
  }
  validation: {
    strictMode: boolean
    sanitizeInputs: boolean
  }
}

export class SecurityManager {
  private static instance: SecurityManager
  private config: SecurityConfig
  private violations = new Map<string, number>()
  private blockedIPs = new Set<string>()

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"]
        }
      },
      cors: {
        enabled: true,
        origins: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: false
      },
      rateLimit: {
        enabled: true,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100
      },
      headers: {
        hsts: true,
        nosniff: true,
        xssProtection: true,
        frameOptions: 'DENY'
      },
      validation: {
        strictMode: process.env.NODE_ENV === 'production',
        sanitizeInputs: true
      }
    }
  }

  // Content Security Policy generation
  generateCSPHeader(): string {
    if (!this.config.csp.enabled) {
      return ''
    }

    const directives = Object.entries(this.config.csp.directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ')

    return directives
  }

  // Security headers for HTTP responses
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    if (this.config.csp.enabled) {
      headers['Content-Security-Policy'] = this.generateCSPHeader()
    }

    if (this.config.headers.hsts) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    }

    if (this.config.headers.nosniff) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    if (this.config.headers.xssProtection) {
      headers['X-XSS-Protection'] = '1; mode=block'
    }

    if (this.config.headers.frameOptions) {
      headers['X-Frame-Options'] = this.config.headers.frameOptions
    }

    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

    return headers
  }

  // Input validation and sanitization
  validateInput(input: any, schema: ValidationSchema): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      sanitized: input
    }

    try {
      // Type validation
      if (schema.type && typeof input !== schema.type) {
        result.isValid = false
        result.errors.push(`Expected ${schema.type}, got ${typeof input}`)
      }

      // Length validation
      if (schema.maxLength && typeof input === 'string' && input.length > schema.maxLength) {
        result.isValid = false
        result.errors.push(`Input too long. Max: ${schema.maxLength}`)
      }

      if (schema.minLength && typeof input === 'string' && input.length < schema.minLength) {
        result.isValid = false
        result.errors.push(`Input too short. Min: ${schema.minLength}`)
      }

      // Pattern validation
      if (schema.pattern && typeof input === 'string' && !schema.pattern.test(input)) {
        result.isValid = false
        result.errors.push('Input format invalid')
      }

      // Sanitization
      if (this.config.validation.sanitizeInputs && typeof input === 'string') {
        result.sanitized = this.sanitizeString(input)
      }

      // Custom validation
      if (schema.customValidator) {
        const customResult = schema.customValidator(input)
        if (!customResult.isValid) {
          result.isValid = false
          result.errors.push(...customResult.errors)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push('Validation error occurred')
      this.logSecurityEvent('validation_error', { error: error.message })
    }

    return result
  }

  // String sanitization
  private sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  // Rate limiting
  checkRateLimit(identifier: string): RateLimitResult {
    if (!this.config.rateLimit.enabled) {
      return { allowed: true, remaining: Infinity, resetTime: 0 }
    }

    const now = Date.now()
    const key = `${identifier}:${Math.floor(now / this.config.rateLimit.windowMs)}`
    const current = this.violations.get(key) || 0

    if (current >= this.config.rateLimit.maxRequests) {
      this.logSecurityEvent('rate_limit_exceeded', { identifier, requests: current })
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil(now / this.config.rateLimit.windowMs) * this.config.rateLimit.windowMs
      }
    }

    this.violations.set(key, current + 1)
    return {
      allowed: true,
      remaining: this.config.rateLimit.maxRequests - current - 1,
      resetTime: Math.ceil(now / this.config.rateLimit.windowMs) * this.config.rateLimit.windowMs
    }
  }

  // Security event logging
  private logSecurityEvent(event: string, data: any): void {
    const eventBus = SystemEventBus.getInstance()
    eventBus.emitSystemEvent('security:violation', {
      event,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getEventSeverity(event)
    })

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Security Event: ${event}`, data)
    }
  }

  private getEventSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'validation_error': 'medium',
      'rate_limit_exceeded': 'high',
      'csp_violation': 'high',
      'xss_attempt': 'critical',
      'injection_attempt': 'critical'
    }
    return severityMap[event] || 'low'
  }

  // Threat detection
  detectThreat(input: string): ThreatDetectionResult {
    const threats: ThreatPattern[] = [
      {
        name: 'XSS',
        pattern: /<script|javascript:|onload=|onerror=/i,
        severity: 'critical'
      },
      {
        name: 'SQL Injection',
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)|('.*--)|(\bUNION\b)/i,
        severity: 'critical'
      },
      {
        name: 'Path Traversal',
        pattern: /\.\.[\/\\]/,
        severity: 'high'
      },
      {
        name: 'Command Injection',
        pattern: /[;&|`$()]/,
        severity: 'high'
      }
    ]

    for (const threat of threats) {
      if (threat.pattern.test(input)) {
        this.logSecurityEvent('threat_detected', {
          threat: threat.name,
          severity: threat.severity,
          input: input.substring(0, 100) // Log only first 100 chars
        })
        
        return {
          isThreat: true,
          threatType: threat.name,
          severity: threat.severity,
          blocked: true
        }
      }
    }

    return {
      isThreat: false,
      threatType: null,
      severity: 'low',
      blocked: false
    }
  }

  // Configuration updates
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates }
    this.logSecurityEvent('config_updated', updates)
  }

  getConfig(): SecurityConfig {
    return { ...this.config }
  }

  // Security metrics
  getSecurityMetrics(): SecurityMetrics {
    const violationCounts = Array.from(this.violations.values()).reduce((sum, count) => sum + count, 0)
    
    return {
      totalViolations: violationCounts,
      blockedIPs: this.blockedIPs.size,
      rateLimit: {
        enabled: this.config.rateLimit.enabled,
        maxRequests: this.config.rateLimit.maxRequests,
        windowMs: this.config.rateLimit.windowMs
      },
      cspEnabled: this.config.csp.enabled,
      lastUpdated: new Date().toISOString()
    }
  }
}

// Type definitions
export interface ValidationSchema {
  type?: string
  maxLength?: number
  minLength?: number
  pattern?: RegExp
  customValidator?: (input: any) => { isValid: boolean; errors: string[] }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized: any
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export interface ThreatPattern {
  name: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ThreatDetectionResult {
  isThreat: boolean
  threatType: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  blocked: boolean
}

export interface SecurityMetrics {
  totalViolations: number
  blockedIPs: number
  rateLimit: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
  cspEnabled: boolean
  lastUpdated: string
}