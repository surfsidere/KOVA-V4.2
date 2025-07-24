import { render, screen, act } from '@testing-library/react'
import { TextRotator } from './text-rotator'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}))

describe('TextRotator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the first word initially', () => {
    const words = ['word1', 'word2', 'word3']
    render(<TextRotator words={words} />)
    
    expect(screen.getByText('word1')).toBeInTheDocument()
  })

  it('renders with prefix and suffix', () => {
    const words = ['test']
    render(<TextRotator words={words} prefix="Prefix: " suffix=" :Suffix" />)
    
    expect(screen.getByText(/Prefix:/)).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText(/:Suffix/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const words = ['test']
    const { container } = render(<TextRotator words={words} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('inline-block', 'custom-class')
  })

  it('cycles through words at specified intervals', () => {
    const words = ['first', 'second', 'third']
    render(<TextRotator words={words} interval={1000} />)
    
    // Initially shows first word
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.queryByText('second')).not.toBeInTheDocument()
    
    // After 1 second, shows second word
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('second')).toBeInTheDocument()
    
    // After another 1 second, shows third word
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('third')).toBeInTheDocument()
    
    // After another 1 second, cycles back to first word
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('first')).toBeInTheDocument()
  })

  it('does not start timer for single word', () => {
    const words = ['only-word']
    render(<TextRotator words={words} />)
    
    expect(screen.getByText('only-word')).toBeInTheDocument()
    
    // Advance time and verify word hasn't changed (no cycling)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText('only-word')).toBeInTheDocument()
  })

  it('returns null for empty words array', () => {
    const { container } = render(<TextRotator words={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('cleans up timer on unmount', () => {
    const words = ['word1', 'word2']
    const { unmount } = render(<TextRotator words={words} />)
    
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('handles word array changes', () => {
    const words = ['initial']
    const { rerender } = render(<TextRotator words={words} />)
    
    expect(screen.getByText('initial')).toBeInTheDocument()
    
    // Change words array
    const newWords = ['changed', 'words']
    rerender(<TextRotator words={newWords} />)
    
    expect(screen.getByText('changed')).toBeInTheDocument()
  })

  it('restarts cycling when words array changes', () => {
    const initialWords = ['a', 'b']
    const { rerender } = render(<TextRotator words={initialWords} interval={1000} />)
    
    // Advance to second word
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('b')).toBeInTheDocument()
    
    // Change words - should show first word of new array
    const newWords = ['x', 'y', 'z']
    rerender(<TextRotator words={newWords} interval={1000} />)
    
    // Due to component re-rendering, it should show the new first word
    expect(screen.getByText('x')).toBeInTheDocument()
  })
})