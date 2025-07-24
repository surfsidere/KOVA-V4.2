import { render, screen, fireEvent } from '@testing-library/react'
import { EtherealDepth } from './ethereal-depth'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, onMouseMove, ...props }: any) => (
      <div 
        className={className} 
        style={style} 
        onMouseMove={onMouseMove}
        data-testid="motion-div"
        {...props}
      >
        {children}
      </div>
    ),
  },
  useMotionValue: jest.fn(() => ({
    get: () => 0,
    set: jest.fn(),
    on: jest.fn(),
    clearListeners: jest.fn(),
    destroy: jest.fn(),
  })),
  useSpring: jest.fn((value) => value),
  useTransform: jest.fn((value, transform) => {
    if (Array.isArray(value)) {
      return { get: () => 'mocked-transform', set: jest.fn() }
    }
    return value
  }),
  useScroll: jest.fn(() => ({
    scrollYProgress: {
      get: () => 0,
      set: jest.fn(),
      on: jest.fn(),
      clearListeners: jest.fn(),
      destroy: jest.fn(),
    }
  })),
}))

// Mock CelestialArc component
jest.mock('./celestial-arc', () => ({
  CelestialArc: ({ delay, scale, opacity, zIndex }: any) => (
    <div data-testid="celestial-arc" data-delay={delay} data-scale={scale} data-opacity={opacity} data-zindex={zIndex} />
  ),
}))

// Mock EtherealSpotlight component
jest.mock('./ethereal-spotlight', () => ({
  EtherealSpotlight: ({ mouseX, mouseY }: any) => (
    <div data-testid="ethereal-spotlight" />
  ),
}))

// Mock useReducedMotion hook
jest.mock('../../hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}))

describe('EtherealDepth', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })

    // Clear all mocks
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<EtherealDepth />)
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4) // Main + inner + spotlight + mask divs
  })

  it('renders all celestial arcs', () => {
    render(<EtherealDepth />)
    const celestialArcs = screen.getAllByTestId('celestial-arc')
    expect(celestialArcs).toHaveLength(4) // Should have 4 celestial arcs
  })

  it('applies correct container classes', () => {
    render(<EtherealDepth />)
    const containers = screen.getAllByTestId('motion-div')
    const mainContainer = containers[0]
    
    expect(mainContainer).toHaveClass(
      'fixed',
      'top-0', 
      'left-0',
      'w-full',
      'h-screen',
      'overflow-hidden'
    )
  })

  it('handles mouse movement', () => {
    render(<EtherealDepth />)
    const containers = screen.getAllByTestId('motion-div')
    const mainContainer = containers[0]
    
    // Simulate mouse movement
    fireEvent.mouseMove(mainContainer, {
      clientX: 100,
      clientY: 200,
    })

    // Component should handle the event without crashing
    expect(mainContainer).toBeInTheDocument()
  })

  it('celestial arcs have correct properties', () => {
    render(<EtherealDepth />)
    const celestialArcs = screen.getAllByTestId('celestial-arc')
    
    // Check that each arc has the expected attributes
    celestialArcs.forEach((arc, index) => {
      expect(arc).toHaveAttribute('data-delay')
      expect(arc).toHaveAttribute('data-scale')
      expect(arc).toHaveAttribute('data-opacity')
      expect(arc).toHaveAttribute('data-zindex')
    })
  })

  it('handles reduced motion preference', () => {
    const { useReducedMotion } = require('../../hooks/use-reduced-motion')
    useReducedMotion.mockReturnValue(true)

    render(<EtherealDepth />)
    expect(screen.getAllByTestId('celestial-arc')).toHaveLength(4)
  })

  it('applies performance optimizations', () => {
    render(<EtherealDepth />)
    const containers = screen.getAllByTestId('motion-div')
    const mainContainer = containers[0]
    
    // Check for performance-related styles
    const style = mainContainer.style
    expect(style.willChange).toBe('transform')
  })
})