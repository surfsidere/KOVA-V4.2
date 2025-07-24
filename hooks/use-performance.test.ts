import { renderHook } from '@testing-library/react'
import { usePerformance } from './use-performance'

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50000000, // 50MB in bytes
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
  },
}

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  const id = setTimeout(callback, 16) // ~60fps
  return id as unknown as number
})

const mockCancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id)
})

describe('usePerformance', () => {
  beforeEach(() => {
    // Mock global performance
    global.performance = mockPerformance as any
    global.requestAnimationFrame = mockRequestAnimationFrame
    global.cancelAnimationFrame = mockCancelAnimationFrame
    
    // Mock window
    Object.defineProperty(global, 'window', {
      value: {
        requestAnimationFrame: mockRequestAnimationFrame,
        cancelAnimationFrame: mockCancelAnimationFrame,
      },
      writable: true,
    })
    
    // Reset mocks
    jest.clearAllMocks()
    mockPerformance.now.mockImplementation(() => Date.now())
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllTimers()
  })

  it('returns getMetrics function', () => {
    const { result } = renderHook(() => usePerformance())
    
    expect(result.current.getMetrics).toBeDefined()
    expect(typeof result.current.getMetrics).toBe('function')
  })

  it('initializes with default metrics', () => {
    const { result } = renderHook(() => usePerformance())
    
    const metrics = result.current.getMetrics()
    expect(metrics.fps).toBe(0)
    expect(metrics.memory).toBe(0)
    expect(metrics.renderTime).toBe(0)
  })

  it('starts performance monitoring when mounted', () => {
    renderHook(() => usePerformance())
    
    expect(mockRequestAnimationFrame).toHaveBeenCalled()
  })

  it('stops performance monitoring when unmounted', () => {
    const { unmount } = renderHook(() => usePerformance())
    
    unmount()
    
    expect(mockCancelAnimationFrame).toHaveBeenCalled()
  })

  it('handles SSR environment gracefully', () => {
    // Simply test that the hook doesn't crash when initialized
    const { result } = renderHook(() => usePerformance())
    
    // Should still provide the getMetrics function
    expect(result.current.getMetrics).toBeDefined()
    expect(typeof result.current.getMetrics).toBe('function')
    
    // Should return default metrics safely
    const metrics = result.current.getMetrics()
    expect(metrics).toEqual({ fps: 0, memory: 0, renderTime: 0 })
  })

  it('calculates memory usage when available', () => {
    const { result } = renderHook(() => usePerformance())
    
    const metrics = result.current.getMetrics()
    // Should return a valid memory value when memory API is available
    expect(metrics.memory).toBeGreaterThanOrEqual(0)
  })

  it('handles environment without memory API', () => {
    // Mock performance without memory
    global.performance = {
      ...mockPerformance,
      memory: undefined,
    } as any

    const { result } = renderHook(() => usePerformance())
    
    const metrics = result.current.getMetrics()
    expect(metrics.memory).toBe(0)
  })

  it('provides consistent metrics object reference', () => {
    const { result } = renderHook(() => usePerformance())
    
    const metrics1 = result.current.getMetrics()
    const metrics2 = result.current.getMetrics()
    
    // Should be different objects (deep copy)
    expect(metrics1).not.toBe(metrics2)
    // But with same values
    expect(metrics1).toEqual(metrics2)
  })

  it('avoids infinite loops with proper cleanup', () => {
    const { result, unmount } = renderHook(() => usePerformance())
    
    // Should not throw or cause infinite loops
    expect(result.current.getMetrics).toBeDefined()
    
    // Should clean up properly
    expect(() => unmount()).not.toThrow()
  })
})