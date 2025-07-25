/**
 * @jest-environment jsdom
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useSectionManager } from '@/hooks/use-section-manager'
import { SectionProvider } from '@/providers/SectionProvider'
import { ZLayers } from '@/types/scroll.types'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
global.IntersectionObserver = mockIntersectionObserver

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = jest.fn()

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SectionProvider>{children}</SectionProvider>
)

describe('useSectionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(
      () => useSectionManager({ id: 'test-section' }),
      { wrapper }
    )

    expect(result.current.progress).toBe(0)
    expect(result.current.isActive).toBe(false)
    expect(result.current.isVisible).toBe(false)
    expect(result.current.isIntersecting).toBe(false)
  })

  it('should register section on mount', () => {
    const mockElement = document.createElement('div')
    
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        element: mockElement,
        triggerStart: 0,
        triggerEnd: 1,
        layer: ZLayers.CONTENT_BASE
      }),
      { wrapper }
    )

    expect(result.current.registerSection).toBeDefined()
  })

  it('should handle progress updates', () => {
    const onProgressMock = jest.fn()
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        onProgress: onProgressMock
      }),
      { wrapper }
    )

    act(() => {
      // Simulate progress update
      result.current.updateProgress(0.5)
    })

    expect(result.current.progress).toBe(0.5)
  })

  it('should handle section activation', () => {
    const onEnterMock = jest.fn()
    const onLeaveMock = jest.fn()
    
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        onEnter: onEnterMock,
        onLeave: onLeaveMock
      }),
      { wrapper }
    )

    act(() => {
      result.current.setActive(true)
    })

    expect(result.current.isActive).toBe(true)

    act(() => {
      result.current.setActive(false)
    })

    expect(result.current.isActive).toBe(false)
  })

  it('should handle visibility changes', () => {
    const { result } = renderHook(
      () => useSectionManager({ id: 'test-section' }),
      { wrapper }
    )

    act(() => {
      result.current.setVisible(true)
    })

    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.setVisible(false)
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('should handle intersection changes', () => {
    const { result } = renderHook(
      () => useSectionManager({ id: 'test-section' }),
      { wrapper }
    )

    act(() => {
      result.current.setIntersecting(true)
    })

    expect(result.current.isIntersecting).toBe(true)
  })

  it('should trigger callbacks on state changes', () => {
    const onEnterMock = jest.fn()
    const onLeaveMock = jest.fn()
    const onProgressMock = jest.fn()
    
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        onEnter: onEnterMock,
        onLeave: onLeaveMock,
        onProgress: onProgressMock
      }),
      { wrapper }
    )

    act(() => {
      result.current.setActive(true)
      result.current.updateProgress(0.75)
    })

    expect(onEnterMock).toHaveBeenCalled()
    expect(onProgressMock).toHaveBeenCalledWith(0.75)

    act(() => {
      result.current.setActive(false)
    })

    expect(onLeaveMock).toHaveBeenCalled()
  })

  it('should calculate trigger points correctly', () => {
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        triggerStart: 0.2,
        triggerEnd: 0.8
      }),
      { wrapper }
    )

    expect(result.current.getTriggerRange).toBeDefined()
    
    act(() => {
      const range = result.current.getTriggerRange()
      expect(range.start).toBe(0.2)
      expect(range.end).toBe(0.8)
    })
  })

  it('should handle scroll progress within trigger range', () => {
    const onProgressMock = jest.fn()
    
    const { result } = renderHook(
      () => useSectionManager({ 
        id: 'test-section',
        triggerStart: 0.2,
        triggerEnd: 0.8,
        onProgress: onProgressMock
      }),
      { wrapper }
    )

    act(() => {
      // Simulate scroll at 50% of trigger range
      result.current.handleScrollProgress(0.5)
    })

    // Should calculate relative progress within trigger range
    expect(onProgressMock).toHaveBeenCalled()
  })

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(
      () => useSectionManager({ id: 'test-section' }),
      { wrapper }
    )

    expect(result.current).toBeDefined()

    // Should not throw on unmount
    unmount()
  })

  it('should handle element ref updates', () => {
    const { result, rerender } = renderHook(
      ({ element }) => useSectionManager({ 
        id: 'test-section',
        element
      }),
      { 
        wrapper,
        initialProps: { element: null }
      }
    )

    const mockElement = document.createElement('div')
    
    rerender({ element: mockElement })

    expect(result.current.element).toBe(mockElement)
  })

  it('should handle multiple sections in provider', () => {
    const { result: result1 } = renderHook(
      () => useSectionManager({ id: 'section-1' }),
      { wrapper }
    )

    const { result: result2 } = renderHook(
      () => useSectionManager({ id: 'section-2' }),
      { wrapper }
    )

    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
    
    // Both sections should be independent
    act(() => {
      result1.current.setActive(true)
    })

    expect(result1.current.isActive).toBe(true)
    expect(result2.current.isActive).toBe(false)
  })
})