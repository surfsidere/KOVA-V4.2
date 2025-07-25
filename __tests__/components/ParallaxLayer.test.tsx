/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ParallaxLayer } from '@/components/scroll/ParallaxLayer'
import { LenisProvider } from '@/providers/LenisProvider'
import { SectionProvider } from '@/providers/SectionProvider'
import { AnimationProvider } from '@/providers/AnimationProvider'

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
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
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
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

// Mock matchMedia
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LenisProvider>
    <SectionProvider>
      <AnimationProvider>
        {children}
      </AnimationProvider>
    </SectionProvider>
  </LenisProvider>
)

describe('ParallaxLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5}>
          <div data-testid="child">Test Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should handle speed prop', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.8} data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle negative speed', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={-0.3} data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle direction prop - vertical', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} direction="vertical" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle direction prop - horizontal', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} direction="horizontal" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle direction prop - both', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} direction="both" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle easing prop - linear', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} easing="linear" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle easing prop - ease', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} easing="ease" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle easing prop - spring', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0.5} easing="spring" data-testid="parallax">
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle bounds prop', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          bounds={{ min: -100, max: 100 }}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle offset prop', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          offset={50}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle disabled prop', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          disabled={true}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          className="custom-parallax"
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toHaveClass('custom-parallax')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          ref={ref}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    expect(ref.current).toBeTruthy()
    expect(ref.current?.tagName).toBe('DIV')
  })

  it('should handle multiple parallax layers with different speeds', () => {
    render(
      <TestWrapper>
        <div>
          <ParallaxLayer speed={0.2} data-testid="slow-parallax">
            <div>Slow content</div>
          </ParallaxLayer>
          <ParallaxLayer speed={0.8} data-testid="fast-parallax">
            <div>Fast content</div>
          </ParallaxLayer>
        </div>
      </TestWrapper>
    )

    expect(screen.getByTestId('slow-parallax')).toBeInTheDocument()
    expect(screen.getByTestId('fast-parallax')).toBeInTheDocument()
  })

  it('should handle velocity enhancement', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          enhanceVelocity={true}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle different ranges', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5} 
          range={[0.2, 0.8]}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle cleanup on unmount', () => {
    const { unmount } = render(
      <TestWrapper>
        <ParallaxLayer speed={0.5}>
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    // Should not throw on unmount
    unmount()
  })

  it('should handle style props correctly', () => {
    render(
      <TestWrapper>
        <ParallaxLayer 
          speed={0.5}
          style={{ backgroundColor: 'green' }}
          data-testid="parallax"
        >
          <div>Content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toHaveStyle({ backgroundColor: 'green' })
  })

  it('should handle zero speed', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={0} data-testid="parallax">
          <div>Static content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })

  it('should handle extreme speed values', () => {
    render(
      <TestWrapper>
        <ParallaxLayer speed={2.0} data-testid="parallax">
          <div>Very fast content</div>
        </ParallaxLayer>
      </TestWrapper>
    )

    const parallax = screen.getByTestId('parallax')
    expect(parallax).toBeInTheDocument()
  })
})