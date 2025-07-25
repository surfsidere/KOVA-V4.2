/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ScrollTrigger } from '@/components/scroll/ScrollTrigger'
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

describe('ScrollTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <TestWrapper>
        <ScrollTrigger start={0} end={1}>
          <div data-testid="child">Test Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should handle fade effect', () => {
    render(
      <TestWrapper>
        <ScrollTrigger start={0} end={1} fade={true} data-testid="trigger">
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle scale animation', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          scale={{ from: 0.8, to: 1.2 }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle rotate animation', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          rotate={{ from: -10, to: 10 }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle translate animation', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          translate={{ x: { from: -100, to: 100 }, y: { from: 0, to: 50 } }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle custom animation', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          animation={{
            from: { opacity: 0, scale: 0.5 },
            to: { opacity: 1, scale: 1 }
          }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle scrub mode', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          scrub={true}
          fade={true}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle trigger callbacks', () => {
    const onEnterMock = jest.fn()
    const onLeaveMock = jest.fn()
    
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          onEnter={onEnterMock}
          onLeave={onLeaveMock}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle once trigger', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          once={true}
          fade={true}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should handle multiple animations combined', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          fade={true}
          scale={{ from: 0.8, to: 1.2 }}
          rotate={{ from: -5, to: 5 }}
          translate={{ x: { from: -50, to: 50 } }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          className="custom-trigger"
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toHaveClass('custom-trigger')
  })

  it('should handle debug mode', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          debug={true}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1} 
          ref={ref}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    expect(ref.current).toBeTruthy()
    expect(ref.current?.tagName).toBe('DIV')
  })

  it('should handle different trigger ranges', () => {
    render(
      <TestWrapper>
        <div>
          <ScrollTrigger start={0} end={0.3} data-testid="trigger-1">
            <div>Early trigger</div>
          </ScrollTrigger>
          <ScrollTrigger start={0.7} end={1} data-testid="trigger-2">
            <div>Late trigger</div>
          </ScrollTrigger>
        </div>
      </TestWrapper>
    )

    expect(screen.getByTestId('trigger-1')).toBeInTheDocument()
    expect(screen.getByTestId('trigger-2')).toBeInTheDocument()
  })

  it('should handle cleanup on unmount', () => {
    const { unmount } = render(
      <TestWrapper>
        <ScrollTrigger start={0} end={1}>
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    // Should not throw on unmount
    unmount()
  })

  it('should handle style props correctly', () => {
    render(
      <TestWrapper>
        <ScrollTrigger 
          start={0} 
          end={1}
          style={{ backgroundColor: 'blue' }}
          data-testid="trigger"
        >
          <div>Content</div>
        </ScrollTrigger>
      </TestWrapper>
    )

    const trigger = screen.getByTestId('trigger')
    expect(trigger).toHaveStyle({ backgroundColor: 'blue' })
  })
})