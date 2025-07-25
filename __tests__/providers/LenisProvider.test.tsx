/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { LenisProvider, useLenis } from '@/providers/LenisProvider'

// Mock Lenis
const mockLenis = {
  scrollTo: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  destroy: jest.fn(),
  raf: jest.fn(),
  isSmooth: true,
  scroll: 0,
  velocity: 0,
  direction: 1,
}

jest.mock('@studio-freight/lenis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockLenis),
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
  frame: {
    update: jest.fn((callback, keepAlive) => {
      if (keepAlive) {
        // Simulate frame updates
        setTimeout(() => callback({ timestamp: Date.now() }), 16)
      }
    }),
    cancelSync: {
      update: jest.fn(),
    },
  },
}))

// Mock performance and RAF
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = jest.fn()

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
})

// Mock matchMedia for reduced motion
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

// Test component that uses the Lenis context
const TestComponent = () => {
  const { lenis, scrollProgress, isReady } = useLenis()
  
  return (
    <div>
      <div data-testid="lenis-instance">{lenis ? 'present' : 'null'}</div>
      <div data-testid="scroll-progress">{scrollProgress.get()}</div>
      <div data-testid="is-ready">{isReady ? 'ready' : 'not-ready'}</div>
    </div>
  )
}

describe('LenisProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <LenisProvider>
        <div data-testid="child">Test Child</div>
      </LenisProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide Lenis context to children', async () => {
    render(
      <LenisProvider options={{ smooth: true }}>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('lenis-instance')).toHaveTextContent('present')
    })
  })

  it('should initialize with default options', async () => {
    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('lenis-instance')).toHaveTextContent('present')
    })
  })

  it('should respect custom options', async () => {
    const customOptions = {
      smooth: true,
      lerp: 0.05,
      duration: 2,
    }

    render(
      <LenisProvider options={customOptions}>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('lenis-instance')).toHaveTextContent('present')
    })
  })

  it('should handle reduced motion preference', () => {
    // Mock reduced motion preference
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

    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    // Should still render but with reduced functionality
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide scroll progress motion value', async () => {
    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('scroll-progress')).toBeInTheDocument()
    })
  })

  it('should set ready state correctly', async () => {
    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-ready')).toHaveTextContent('ready')
    })
  })

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    unmount()

    expect(mockLenis.destroy).toHaveBeenCalled()
  })

  it('should handle scroll events', async () => {
    const onScrollMock = jest.fn()
    
    // Mock Lenis to trigger scroll event
    const mockLenisWithScroll = {
      ...mockLenis,
      on: jest.fn((event, callback) => {
        if (event === 'scroll') {
          // Simulate scroll event
          setTimeout(() => callback({ scroll: 100, velocity: 5, direction: 1 }), 50)
        }
      }),
    }

    jest.mocked(require('@studio-freight/lenis').default).mockImplementation(() => mockLenisWithScroll)

    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    await waitFor(() => {
      expect(mockLenisWithScroll.on).toHaveBeenCalledWith('scroll', expect.any(Function))
    })
  })

  it('should throw error when useLenis is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useLenis must be used within a LenisProvider')

    console.error = originalError
  })

  it('should handle disabled state', () => {
    render(
      <LenisProvider disabled>
        <TestComponent />
      </LenisProvider>
    )

    // Should render but with disabled functionality
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should update scroll progress during animation frame', async () => {
    const { frame } = require('framer-motion')
    
    render(
      <LenisProvider>
        <TestComponent />
      </LenisProvider>
    )

    // Verify frame.update was called
    expect(frame.update).toHaveBeenCalled()
  })
})