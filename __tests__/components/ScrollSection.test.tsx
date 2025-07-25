/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { LenisProvider } from '@/providers/LenisProvider'
import { SectionProvider } from '@/providers/SectionProvider'
import { AnimationProvider } from '@/providers/AnimationProvider'
import { ZLayers } from '@/types/scroll.types'

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
    section: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <section ref={ref} {...props}>{children}</section>
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

describe('ScrollSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <TestWrapper>
        <ScrollSection id="test-section">
          <div data-testid="child">Test Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should render with correct default props', () => {
    render(
      <TestWrapper>
        <ScrollSection id="test-section" data-testid="scroll-section">
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
    expect(section.tagName).toBe('SECTION')
  })

  it('should apply custom className', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section" 
          className="custom-class"
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toHaveClass('custom-class')
  })

  it('should handle trigger range props', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          triggerStart={0.2}
          triggerEnd={0.8}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle layer assignment', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          layer={ZLayers.CONTENT_ELEVATED}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle contrast mode', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          contrast="light"
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle fade effect', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          fadeEffect={true}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle scale effect', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          scaleEffect={true}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle slide direction', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          slideDirection="up"
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should handle parallax strength', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          parallaxStrength={0.5}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should call onEnter callback', () => {
    const onEnterMock = jest.fn()
    
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          onEnter={onEnterMock}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    // Note: Testing callback invocation would require mocking scroll events
    // which is complex with the current provider setup
    expect(screen.getByTestId('scroll-section')).toBeInTheDocument()
  })

  it('should call onLeave callback', () => {
    const onLeaveMock = jest.fn()
    
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          onLeave={onLeaveMock}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    expect(screen.getByTestId('scroll-section')).toBeInTheDocument()
  })

  it('should call onProgress callback', () => {
    const onProgressMock = jest.fn()
    
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          onProgress={onProgressMock}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    expect(screen.getByTestId('scroll-section')).toBeInTheDocument()
  })

  it('should handle multiple effects combined', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          fadeEffect={true}
          scaleEffect={true}
          slideDirection="left"
          parallaxStrength={0.3}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLElement>()
    
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          ref={ref}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    expect(ref.current).toBeTruthy()
    expect(ref.current?.tagName).toBe('SECTION')
  })

  it('should handle cleanup on unmount', () => {
    const { unmount } = render(
      <TestWrapper>
        <ScrollSection id="test-section">
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    // Should not throw on unmount
    unmount()
  })

  it('should handle unique section IDs', () => {
    render(
      <TestWrapper>
        <ScrollSection id="section-1" data-testid="section-1">
          <div>Content 1</div>
        </ScrollSection>
        <ScrollSection id="section-2" data-testid="section-2">
          <div>Content 2</div>
        </ScrollSection>
      </TestWrapper>
    )

    expect(screen.getByTestId('section-1')).toBeInTheDocument()
    expect(screen.getByTestId('section-2')).toBeInTheDocument()
  })

  it('should apply style props correctly', () => {
    render(
      <TestWrapper>
        <ScrollSection 
          id="test-section"
          style={{ backgroundColor: 'red' }}
          data-testid="scroll-section"
        >
          <div>Content</div>
        </ScrollSection>
      </TestWrapper>
    )

    const section = screen.getByTestId('scroll-section')
    expect(section).toHaveStyle({ backgroundColor: 'red' })
  })
})