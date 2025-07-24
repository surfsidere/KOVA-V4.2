import { renderHook } from '@testing-library/react'
import { useReducedMotion } from './use-reduced-motion'

describe('useReducedMotion', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
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
  })

  it('returns false when prefers-reduced-motion is not set', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion is set to reduce', () => {
    // Mock matchMedia to return matches: true
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('handles environment without matchMedia support', () => {
    // Remove matchMedia from window
    const originalMatchMedia = window.matchMedia
    delete (window as any).matchMedia

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    // Restore matchMedia
    window.matchMedia = originalMatchMedia
  })

  it('calls matchMedia with correct query', () => {
    const mockMatchMedia = jest.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })
    
    window.matchMedia = mockMatchMedia

    renderHook(() => useReducedMotion())
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })
})