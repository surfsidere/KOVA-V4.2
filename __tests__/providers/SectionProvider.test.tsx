/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { SectionProvider, useSection } from '@/providers/SectionProvider'
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

// Test component that uses the Section context
const TestComponent = () => {
  const { 
    sections, 
    activeSection, 
    registerSection, 
    unregisterSection, 
    updateSectionProgress 
  } = useSection()
  
  const handleRegister = () => {
    registerSection({
      id: 'test-section',
      element: document.createElement('div'),
      triggerStart: 0,
      triggerEnd: 1,
      layer: ZLayers.CONTENT_BASE,
      animations: [],
    })
  }

  const handleUnregister = () => {
    unregisterSection('test-section')
  }

  const handleUpdateProgress = () => {
    updateSectionProgress('test-section', 0.5)
  }
  
  return (
    <div>
      <div data-testid="sections-count">{sections.size}</div>
      <div data-testid="active-section">{activeSection || 'none'}</div>
      <button data-testid="register-btn" onClick={handleRegister}>
        Register Section
      </button>
      <button data-testid="unregister-btn" onClick={handleUnregister}>
        Unregister Section
      </button>
      <button data-testid="update-progress-btn" onClick={handleUpdateProgress}>
        Update Progress
      </button>
    </div>
  )
}

describe('SectionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    render(
      <SectionProvider>
        <div data-testid="child">Test Child</div>
      </SectionProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide section context to children', () => {
    render(
      <SectionProvider>
        <TestComponent />
      </SectionProvider>
    )

    expect(screen.getByTestId('sections-count')).toHaveTextContent('0')
    expect(screen.getByTestId('active-section')).toHaveTextContent('none')
  })

  it('should register sections correctly', async () => {
    render(
      <SectionProvider>
        <TestComponent />
      </SectionProvider>
    )

    const registerBtn = screen.getByTestId('register-btn')
    
    act(() => {
      registerBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('sections-count')).toHaveTextContent('1')
    })
  })

  it('should unregister sections correctly', async () => {
    render(
      <SectionProvider>
        <TestComponent />
      </SectionProvider>
    )

    const registerBtn = screen.getByTestId('register-btn')
    const unregisterBtn = screen.getByTestId('unregister-btn')
    
    // First register a section
    act(() => {
      registerBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('sections-count')).toHaveTextContent('1')
    })

    // Then unregister it
    act(() => {
      unregisterBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('sections-count')).toHaveTextContent('0')
    })
  })

  it('should update section progress', async () => {
    render(
      <SectionProvider>
        <TestComponent />
      </SectionProvider>
    )

    const registerBtn = screen.getByTestId('register-btn')
    const updateProgressBtn = screen.getByTestId('update-progress-btn')
    
    // First register a section
    act(() => {
      registerBtn.click()
    })

    // Then update its progress
    act(() => {
      updateProgressBtn.click()
    })

    // Should not throw any errors
    await waitFor(() => {
      expect(screen.getByTestId('sections-count')).toHaveTextContent('1')
    })
  })

  it('should assign z-index automatically', async () => {
    const TestComponentWithZIndex = () => {
      const { sections, registerSection } = useSection()
      
      const handleRegister = () => {
        registerSection({
          id: 'test-section-z',
          element: document.createElement('div'),
          triggerStart: 0,
          triggerEnd: 1,
          layer: ZLayers.CONTENT_BASE,
          animations: [],
          // No zIndex specified - should be auto-assigned
        })
      }

      const section = sections.get('test-section-z')
      
      return (
        <div>
          <div data-testid="section-z-index">{section?.zIndex || 'none'}</div>
          <button data-testid="register-z-btn" onClick={handleRegister}>
            Register Section
          </button>
        </div>
      )
    }

    render(
      <SectionProvider>
        <TestComponentWithZIndex />
      </SectionProvider>
    )

    const registerBtn = screen.getByTestId('register-z-btn')
    
    act(() => {
      registerBtn.click()
    })

    await waitFor(() => {
      const zIndex = screen.getByTestId('section-z-index').textContent
      expect(zIndex).not.toBe('none')
      expect(Number(zIndex)).toBeGreaterThan(0)
    })
  })

  it('should handle multiple sections with different layers', async () => {
    const MultiSectionComponent = () => {
      const { sections, registerSection } = useSection()
      
      const handleRegisterBase = () => {
        registerSection({
          id: 'base-section',
          element: document.createElement('div'),
          triggerStart: 0,
          triggerEnd: 1,
          layer: ZLayers.CONTENT_BASE,
          animations: [],
        })
      }

      const handleRegisterElevated = () => {
        registerSection({
          id: 'elevated-section',
          element: document.createElement('div'),
          triggerStart: 0,
          triggerEnd: 1,
          layer: ZLayers.CONTENT_ELEVATED,
          animations: [],
        })
      }
      
      return (
        <div>
          <div data-testid="multi-sections-count">{sections.size}</div>
          <button data-testid="register-base-btn" onClick={handleRegisterBase}>
            Register Base
          </button>
          <button data-testid="register-elevated-btn" onClick={handleRegisterElevated}>
            Register Elevated
          </button>
        </div>
      )
    }

    render(
      <SectionProvider>
        <MultiSectionComponent />
      </SectionProvider>
    )

    const registerBaseBtn = screen.getByTestId('register-base-btn')
    const registerElevatedBtn = screen.getByTestId('register-elevated-btn')
    
    act(() => {
      registerBaseBtn.click()
      registerElevatedBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('multi-sections-count')).toHaveTextContent('2')
    })
  })

  it('should set active section correctly', async () => {
    const ActiveSectionComponent = () => {
      const { activeSection, setActiveSection, registerSection } = useSection()
      
      const handleRegister = () => {
        registerSection({
          id: 'active-test-section',
          element: document.createElement('div'),
          triggerStart: 0,
          triggerEnd: 1,
          layer: ZLayers.CONTENT_BASE,
          animations: [],
        })
      }

      const handleSetActive = () => {
        setActiveSection('active-test-section')
      }
      
      return (
        <div>
          <div data-testid="current-active">{activeSection || 'none'}</div>
          <button data-testid="register-active-btn" onClick={handleRegister}>
            Register Section
          </button>
          <button data-testid="set-active-btn" onClick={handleSetActive}>
            Set Active
          </button>
        </div>
      )
    }

    render(
      <SectionProvider>
        <ActiveSectionComponent />
      </SectionProvider>
    )

    const registerBtn = screen.getByTestId('register-active-btn')
    const setActiveBtn = screen.getByTestId('set-active-btn')
    
    act(() => {
      registerBtn.click()
    })

    act(() => {
      setActiveBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('current-active')).toHaveTextContent('active-test-section')
    })
  })

  it('should throw error when useSection is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useSection must be used within a SectionProvider')

    console.error = originalError
  })

  it('should handle section cleanup on unmount', () => {
    const { unmount } = render(
      <SectionProvider>
        <TestComponent />
      </SectionProvider>
    )

    // Should not throw on unmount
    unmount()
  })
})