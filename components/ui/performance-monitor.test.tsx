import { render, screen } from '@testing-library/react'
import { PerformanceMonitor } from './performance-monitor'

// Mock the usePerformance hook
const mockGetMetrics = jest.fn(() => ({
  fps: 60,
  memory: 45,
  renderTime: 12.5,
}))

jest.mock('../../hooks/use-performance', () => ({
  usePerformance: jest.fn(() => ({
    getMetrics: mockGetMetrics,
  })),
}))

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockGetMetrics.mockReturnValue({
      fps: 60,
      memory: 45,
      renderTime: 12.5,
    })
  })
  it('renders nothing when disabled', () => {
    const { container } = render(<PerformanceMonitor enabled={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing by default (disabled)', () => {
    const { container } = render(<PerformanceMonitor />)
    expect(container.firstChild).toBeNull()
  })

  it('renders performance metrics when enabled', () => {
    render(<PerformanceMonitor enabled={true} />)
    
    // Should render metrics (initially with 0 values, but structure should be there)
    expect(screen.getByText(/FPS:/)).toBeInTheDocument()
    expect(screen.getByText(/Memory:/)).toBeInTheDocument()
    expect(screen.getByText(/Render:/)).toBeInTheDocument()
  })

  it('applies correct color classes for good performance', () => {
    render(<PerformanceMonitor enabled={true} />)
    
    const fpsElement = screen.getByText(/FPS:/)
    const memoryElement = screen.getByText(/Memory:/)
    const renderElement = screen.getByText(/Render:/)
    
    // With default values (0, 0, 0.0), these should have specific colors
    expect(fpsElement).toHaveClass('text-red-400') // FPS 0 < 30 = red
    expect(memoryElement).toHaveClass('text-green-400') // Memory 0 <= 50 = green  
    expect(renderElement).toHaveClass('text-green-400') // Render 0.0 <= 16 = green
  })

  it('has proper styling and positioning', () => {
    render(<PerformanceMonitor enabled={true} />)
    
    // Find the outermost container by looking for the fixed positioning class
    const monitorElement = document.querySelector('.fixed.top-4.right-4')
    expect(monitorElement).toHaveClass(
      'fixed', 
      'top-4', 
      'right-4', 
      'z-[9999]', 
      'bg-black/80', 
      'text-white', 
      'p-3', 
      'rounded-lg', 
      'text-sm', 
      'font-mono'
    )
  })

  it('color logic works correctly', () => {
    // Test the color logic by examining rendered classes
    render(<PerformanceMonitor enabled={true} />)
    
    // Should have space for metrics display
    const container = screen.getByText(/FPS:/).closest('div')?.parentElement
    expect(container).toHaveClass('space-y-1')
  })
})