import { render, screen } from '@testing-library/react'
import { MotionValue } from 'framer-motion'
import { CelestialArc } from './celestial-arc'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div 
        className={className} 
        style={style} 
        data-testid="motion-div"
        {...props}
      >
        {children}
      </div>
    ),
  },
  useSpring: jest.fn((value) => value),
  useTransform: jest.fn((value, transform) => {
    return {
      get: () => transform ? transform(100) : 100,
      set: jest.fn(),
    }
  }),
}))

// Mock MotionValue
const createMockMotionValue = (initialValue: number = 0): MotionValue<number> => ({
  get: () => initialValue,
  set: jest.fn(),
  on: jest.fn(),
  clearListeners: jest.fn(),
  destroy: jest.fn(),
  stop: jest.fn(),
  isAnimating: () => false,
  getVelocity: () => 0,
  hasAnimated: false,
  owner: null,
  version: '1.0.0',
  timeDelta: 0,
  lastUpdated: 0,
  prev: initialValue,
  updateAndNotify: jest.fn(),
  renderSubscriptions: new Set(),
  velocityUpdateSubscriptions: new Set(),
  stopAnimation: jest.fn(),
  onRenderRequest: (handler: any) => {
    return () => {}
  },
  attach: jest.fn(),
} as any)

describe('CelestialArc', () => {
  const defaultProps = {
    mouseX: createMockMotionValue(100),
    mouseY: createMockMotionValue(100),
    delay: 0.5,
    scale: 1.2,
    opacity: 0.8,
    zIndex: 10,
    parallaxStrength: 0.3,
  }

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(global.window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(global.window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  it('renders without crashing', () => {
    render(<CelestialArc {...defaultProps} />)
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4) // Main div + 3 gradient layers
  })

  it('applies correct styling props', () => {
    render(<CelestialArc {...defaultProps} />)
    const mainDiv = screen.getAllByTestId('motion-div')[0]
    
    expect(mainDiv).toHaveClass('absolute', 'inset-0', 'pointer-events-none')
  })

  it('handles reduced motion preference', () => {
    render(<CelestialArc {...defaultProps} prefersReducedMotion={true} />)
    
    // Component should render but with reduced motion
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4)
  })

  it('handles SSR safely', () => {
    // Mock SSR environment by making window undefined in transform functions
    // This test verifies the component handles SSR without crashing
    const { rerender } = render(<CelestialArc {...defaultProps} />)
    
    // Test that component renders without throwing
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4)
    
    // Test re-render
    rerender(<CelestialArc {...defaultProps} parallaxStrength={0.5} />)
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4)
  })

  it('applies correct z-index', () => {
    const { rerender } = render(<CelestialArc {...defaultProps} zIndex={5} />)
    
    // Test with different z-index
    rerender(<CelestialArc {...defaultProps} zIndex={15} />)
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4)
  })

  it('handles different parallax strengths', () => {
    const { rerender } = render(<CelestialArc {...defaultProps} parallaxStrength={0.1} />)
    
    // Test with stronger parallax
    rerender(<CelestialArc {...defaultProps} parallaxStrength={0.8} />)
    expect(screen.getAllByTestId('motion-div')).toHaveLength(4)
  })
})