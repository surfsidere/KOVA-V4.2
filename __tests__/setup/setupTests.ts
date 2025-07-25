/**
 * Jest Test Setup
 * Global test configuration and mocks for the immersive scroll system
 */

import React from 'react'
import '@testing-library/jest-dom'

// Mock Lenis globally
jest.mock('@studio-freight/lenis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    scrollTo: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
    raf: jest.fn(),
    isSmooth: true,
    scroll: 0,
    velocity: 0,
    direction: 1,
  })),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    section: ({ children, ...props }: any) => React.createElement('section', props, children),
  },
  motionValue: jest.fn(() => ({
    get: jest.fn(() => 0),
    set: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),
  useMotionValue: jest.fn(() => ({
    get: jest.fn(() => 0),
    set: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),
  useTransform: jest.fn(() => ({
    get: jest.fn(() => 0),
    set: jest.fn(),
  })),
  frame: {
    update: jest.fn(),
    cancelSync: {
      update: jest.fn(),
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
})

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
})

Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((cb) => {
    setTimeout(cb, 16)
    return 1
  }),
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    },
  },
})

// Mock Next.js specific features
jest.mock('next/dynamic', () => (fn: any) => {
  const DynamicComponent = (props: any) => {
    const Component = fn()
    return React.createElement(Component, props)
  }
  DynamicComponent.displayName = 'DynamicComponent'
  return DynamicComponent
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', props),
}))

// Mock CSS imports
jest.mock('*.css', () => ({}))
jest.mock('*.scss', () => ({}))
jest.mock('*.sass', () => ({}))

// Global test utilities
global.mockScrollTo = (progress: number) => {
  const maxScroll = document.body.scrollHeight - window.innerHeight
  const targetScroll = maxScroll * progress
  Object.defineProperty(window, 'scrollY', { value: targetScroll, writable: true })
  
  // Trigger scroll event
  window.dispatchEvent(new Event('scroll'))
}

global.mockLenisScroll = (data: { scroll: number; velocity: number; direction: number }) => {
  // Mock Lenis scroll event
  const mockLenis = require('@studio-freight/lenis').default
  const callbacks: any[] = []
  
  mockLenis.mockImplementation(() => ({
    scrollTo: jest.fn(),
    on: jest.fn((event, callback) => {
      if (event === 'scroll') {
        callbacks.push(callback)
      }
    }),
    off: jest.fn(),
    destroy: jest.fn(),
    raf: jest.fn(),
    isSmooth: true,
    scroll: data.scroll,
    velocity: data.velocity,
    direction: data.direction,
  }))
  
  // Trigger callbacks
  callbacks.forEach(callback => callback(data))
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

// Setup console warnings/errors
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})