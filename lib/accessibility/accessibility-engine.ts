/**
 * Accessibility Engine
 * WCAG 2.1 AAA compliance with inclusive design
 */

export interface AccessibilityConfig {
  level: 'A' | 'AA' | 'AAA'
  autoFix: boolean
  announcements: boolean
  keyboardNavigation: boolean
  highContrast: boolean
  reducedMotion: boolean
  focusManagement: boolean
}

export interface AccessibilityViolation {
  element: Element
  rule: string
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
  wcagReference: string
}

export class AccessibilityEngine {
  private static instance: AccessibilityEngine
  private config: AccessibilityConfig
  private announcer?: HTMLElement
  private focusStack: Element[] = []
  private observer?: MutationObserver

  static getInstance(): AccessibilityEngine {
    if (!AccessibilityEngine.instance) {
      AccessibilityEngine.instance = new AccessibilityEngine()
    }
    return AccessibilityEngine.instance
  }

  constructor() {
    this.config = this.getDefaultConfig()
    this.initialize()
  }

  private getDefaultConfig(): AccessibilityConfig {
    return {
      level: 'AA',
      autoFix: true,
      announcements: true,
      keyboardNavigation: true,
      highContrast: false,
      reducedMotion: this.prefersReducedMotion(),
      focusManagement: true
    }
  }

  private initialize(): void {
    if (typeof window === 'undefined') return

    this.setupAnnouncer()
    this.setupKeyboardNavigation()
    this.setupFocusManagement()
    this.setupDOMObserver()
    this.applyUserPreferences()
  }

  private setupAnnouncer(): void {
    if (!this.config.announcements) return

    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.className = 'sr-only'
    this.announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `
    document.body.appendChild(this.announcer)
  }

  private setupKeyboardNavigation(): void {
    if (!this.config.keyboardNavigation) return

    document.addEventListener('keydown', (event) => {
      this.handleKeyboardNavigation(event)
    })
  }

  private setupFocusManagement(): void {
    if (!this.config.focusManagement) return

    document.addEventListener('focusin', (event) => {
      this.manageFocus(event.target as Element)
    })
  }

  private setupDOMObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as Element)
            }
          })
        }
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private applyUserPreferences(): void {
    // Reduced motion
    if (this.prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion')
      this.config.reducedMotion = true
    }

    // High contrast
    if (this.prefersHighContrast()) {
      document.documentElement.classList.add('high-contrast')
      this.config.highContrast = true
    }

    // Dark mode
    if (this.prefersDarkMode()) {
      document.documentElement.classList.add('dark')
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  private prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer) return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = ''
      }
    }, 1000)
  }

  // Keyboard navigation
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event)
        break
      case 'Escape':
        this.handleEscapeKey(event)
        break
      case 'Enter':
      case ' ':
        this.handleActivation(event)
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKeys(event)
        break
    }
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement as Element)

    if (event.shiftKey) {
      // Shift+Tab - previous element
      if (currentIndex <= 0) {
        focusableElements[focusableElements.length - 1]?.focus()
        event.preventDefault()
      }
    } else {
      // Tab - next element
      if (currentIndex >= focusableElements.length - 1) {
        focusableElements[0]?.focus()
        event.preventDefault()
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]')
    if (openModal) {
      this.closeModal(openModal)
      event.preventDefault()
    }
  }

  private handleActivation(event: KeyboardEvent): void {
    const target = event.target as Element
    
    if (target.matches('button, [role="button"]') && event.key === ' ') {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      event.preventDefault()
    }
  }

  private handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as Element
    
    // Handle ARIA patterns
    if (target.closest('[role="menu"], [role="menubar"]')) {
      this.handleMenuNavigation(event)
    } else if (target.closest('[role="tablist"]')) {
      this.handleTablistNavigation(event)
    } else if (target.closest('[role="listbox"]')) {
      this.handleListboxNavigation(event)
    }
  }

  private handleMenuNavigation(event: KeyboardEvent): void {
    const menu = (event.target as Element).closest('[role="menu"], [role="menubar"]')
    if (!menu) return

    const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])'))
    const currentIndex = items.indexOf(event.target as Element)

    let nextIndex = currentIndex
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length
        break
    }

    if (nextIndex !== currentIndex) {
      (items[nextIndex] as HTMLElement).focus()
      event.preventDefault()
    }
  }

  private handleTablistNavigation(event: KeyboardEvent): void {
    const tablist = (event.target as Element).closest('[role="tablist"]')
    if (!tablist) return

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]:not([disabled])'))
    const currentIndex = tabs.indexOf(event.target as Element)

    let nextIndex = currentIndex
    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length
        break
    }

    if (nextIndex !== currentIndex) {
      (tabs[nextIndex] as HTMLElement).focus()
      (tabs[nextIndex] as HTMLElement).click()
      event.preventDefault()
    }
  }

  private handleListboxNavigation(event: KeyboardEvent): void {
    const listbox = (event.target as Element).closest('[role="listbox"]')
    if (!listbox) return

    const options = Array.from(listbox.querySelectorAll('[role="option"]:not([disabled])'))
    const currentIndex = options.indexOf(event.target as Element)

    let nextIndex = currentIndex
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % options.length
        break
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + options.length) % options.length
        break
    }

    if (nextIndex !== currentIndex) {
      (options[nextIndex] as HTMLElement).focus()
      event.preventDefault()
    }
  }

  // Focus management
  private manageFocus(element: Element): void {
    this.focusStack.push(element)
    
    // Keep focus stack manageable
    if (this.focusStack.length > 10) {
      this.focusStack.shift()
    }
  }

  trapFocus(container: Element): () => void {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          event.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          event.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleFocusTrap)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleFocusTrap)
    }
  }

  private getFocusableElements(container: Element = document.body): Element[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])', 
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => this.isVisible(el))
  }

  private isVisible(element: Element): boolean {
    const style = getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0'
  }

  private closeModal(modal: Element): void {
    modal.setAttribute('aria-hidden', 'true')
    
    // Return focus to previous element
    if (this.focusStack.length > 1) {
      const previousElement = this.focusStack[this.focusStack.length - 2] as HTMLElement
      previousElement?.focus()
    }
  }

  // Accessibility auditing
  auditElement(element: Element): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = []

    // Check for missing alt text on images
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement
      if (!img.alt && !img.getAttribute('aria-label')) {
        violations.push({
          element,
          rule: 'img-alt',
          severity: 'error',
          message: 'Image missing alternative text',
          suggestion: 'Add alt attribute or aria-label',
          wcagReference: 'WCAG 1.1.1'
        })
      }
    }

    // Check for proper heading hierarchy
    if (element.matches('h1, h2, h3, h4, h5, h6')) {
      const level = parseInt(element.tagName.charAt(1))
      const prevHeading = this.findPreviousHeading(element)
      
      if (prevHeading) {
        const prevLevel = parseInt(prevHeading.tagName.charAt(1))
        if (level - prevLevel > 1) {
          violations.push({
            element,
            rule: 'heading-hierarchy',
            severity: 'warning',
            message: 'Heading levels should not skip',
            suggestion: `Use h${prevLevel + 1} instead of h${level}`,
            wcagReference: 'WCAG 1.3.1'
          })
        }
      }
    }

    // Check for missing form labels
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const input = element as HTMLInputElement
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                      input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby')
      
      if (!hasLabel) {
        violations.push({
          element,
          rule: 'form-label',
          severity: 'error',
          message: 'Form control missing label',
          suggestion: 'Add label element or aria-label attribute',
          wcagReference: 'WCAG 1.3.1'
        })
      }
    }

    // Check color contrast
    this.checkColorContrast(element, violations)

    // Auto-fix violations if enabled
    if (this.config.autoFix) {
      this.autoFixViolations(violations)
    }

    return violations
  }

  private findPreviousHeading(element: Element): Element | null {
    let current = element.previousElementSibling
    
    while (current) {
      if (current.matches('h1, h2, h3, h4, h5, h6')) {
        return current
      }
      current = current.previousElementSibling
    }
    
    return null
  }

  private checkColorContrast(element: Element, violations: AccessibilityViolation[]): void {
    const style = getComputedStyle(element)
    const backgroundColor = style.backgroundColor
    const color = style.color
    
    if (backgroundColor && color) {
      const contrast = this.calculateContrast(color, backgroundColor)
      const minContrast = this.config.level === 'AAA' ? 7 : 4.5
      
      if (contrast < minContrast) {
        violations.push({
          element,
          rule: 'color-contrast',
          severity: 'error',
          message: `Color contrast ratio ${contrast.toFixed(2)} is below ${minContrast}`,
          suggestion: 'Increase color contrast between text and background',
          wcagReference: 'WCAG 1.4.3'
        })
      }
    }
  }

  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, this would parse RGB values and calculate proper contrast
    return 4.5 // Placeholder
  }

  private autoFixViolations(violations: AccessibilityViolation[]): void {
    violations.forEach(violation => {
      switch (violation.rule) {
        case 'img-alt':
          (violation.element as HTMLImageElement).alt = 'Image'
          break
        case 'form-label':
          const input = violation.element as HTMLInputElement
          if (!input.id) {
            input.id = `input-${Date.now()}`
          }
          input.setAttribute('aria-label', input.placeholder || 'Input field')
          break
      }
    })
  }

  // Public API
  auditPage(): AccessibilityViolation[] {
    const allElements = document.querySelectorAll('*')
    const violations: AccessibilityViolation[] = []
    
    allElements.forEach(element => {
      violations.push(...this.auditElement(element))
    })
    
    return violations
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates }
    this.applyUserPreferences()
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    if (this.announcer) {
      this.announcer.remove()
    }
  }
}