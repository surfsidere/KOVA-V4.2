/**
 * @jest-environment jsdom
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { LenisProvider } from '@/providers/LenisProvider'
import { motionValue } from 'framer-motion'

// Mock Lenis
jest.mock('@studio-freight/lenis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    scrollTo: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
    raf: jest.fn(),
    isSmooth: true,
  })),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
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
  useTransform: jest.fn((source, input, output) => ({
    get: jest.fn(() => output[0]),
    set: jest.fn(),
  })),
  frame: {
    update: jest.fn(),
    cancelSync: {
      update: jest.fn(),
    },
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = jest.fn()

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LenisProvider options={{ smooth: true }}>{children}</LenisProvider>
)

describe('useLenisScroll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default scroll state', () => {
    const { result } = renderHook(() => useLenisScroll(), { wrapper })

    expect(result.current.scrollProgress).toBeDefined()
    expect(result.current.velocity).toBe(0)
    expect(result.current.direction).toBe('down')
    expect(result.current.isScrolling).toBe(false)
    expect(result.current.isReady).toBe(false)
  })

  it('should provide scroll transform creators', () => {
    const { result } = renderHook(() => useLenisScroll(), { wrapper })

    expect(result.current.createScrollTransform).toBeDefined()
    expect(typeof result.current.createScrollTransform).toBe('function')
  })

  it('should handle scroll callbacks', () => {
    const onScrollMock = jest.fn()
    const { result } = renderHook(
      () => useLenisScroll({ onScroll: onScrollMock }),
      { wrapper }
    )

    // Should not throw
    expect(result.current).toBeDefined()
  })

  it('should create scroll transforms correctly', () => {
    const { result } = renderHook(() => useLenisScroll(), { wrapper })

    act(() => {
      const transform = result.current.createScrollTransform([0, 1], [0, 100])
      expect(transform).toBeDefined()
    })
  })

  it('should handle scroll to functionality', () => {
    const { result } = renderHook(() => useLenisScroll(), { wrapper })

    act(() => {
      result.current.scrollTo(100)
    })

    // Should not throw
    expect(result.current.scrollTo).toBeDefined()
  })

  it('should handle element scrolling', () => {
    const { result } = renderHook(() => useLenisScroll(), { wrapper })
    const mockElement = document.createElement('div')

    act(() => {
      result.current.scrollToElement(mockElement)
    })

    // Should not throw
    expect(result.current.scrollToElement).toBeDefined()
  })

  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const { result } = renderHook(() => useLenisScroll(), { wrapper })

    // Should still initialize but with reduced functionality
    expect(result.current).toBeDefined()
  })

  it('should handle cleanup properly', () => {
    const { result, unmount } = renderHook(() => useLenisScroll(), { wrapper })

    expect(result.current).toBeDefined()

    // Should not throw on unmount
    unmount()
  })
})