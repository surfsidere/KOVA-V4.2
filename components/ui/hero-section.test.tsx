import { render, screen } from '@testing-library/react'
import { HeroSection } from './hero-section'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock TextRotator component
jest.mock('./text-rotator', () => ({
  TextRotator: ({ words, className }: any) => (
    <span className={className} data-testid="text-rotator">
      {words[0]}
    </span>
  ),
}))

describe('HeroSection', () => {
  describe('Spanish content', () => {
    it('renders Spanish content by default', () => {
      render(<HeroSection />)
      
      expect(screen.getByText('La nueva generación de beneficios:')).toBeInTheDocument()
      expect(screen.getByText(/El futuro de la lealtad es la personalización/)).toBeInTheDocument()
      expect(screen.getByText('La Oportunidad:')).toBeInTheDocument()
      expect(screen.getByText('La Solución:')).toBeInTheDocument()
    })

    it('renders Spanish content when explicitly set', () => {
      render(<HeroSection language="es" />)
      
      expect(screen.getByText('La nueva generación de beneficios:')).toBeInTheDocument()
      expect(screen.getByText('Más conexión. Más uso. Más valor.')).toBeInTheDocument()
      expect(screen.getByText('Desplázate para explorar')).toBeInTheDocument()
    })

    it('displays Spanish dynamic words in TextRotator', () => {
      render(<HeroSection language="es" />)
      
      const textRotator = screen.getByTestId('text-rotator')
      expect(textRotator).toHaveTextContent('relevantes.')
    })
  })

  describe('English content', () => {
    it('renders English content when language is set to en', () => {
      render(<HeroSection language="en" />)
      
      expect(screen.getByText('The New Era of Loyalty Is')).toBeInTheDocument()
      expect(screen.getByText(/The future of loyalty is a choice/)).toBeInTheDocument()
      expect(screen.getByText('The Opportunity:')).toBeInTheDocument()
      expect(screen.getByText('The Solution:')).toBeInTheDocument()
    })

    it('renders English solution text', () => {
      render(<HeroSection language="en" />)
      
      expect(screen.getByText('More Connection. More Engagement. More Value.')).toBeInTheDocument()
      expect(screen.getByText('Scroll to explore')).toBeInTheDocument()
    })

    it('displays English dynamic words in TextRotator', () => {
      render(<HeroSection language="en" />)
      
      const textRotator = screen.getByTestId('text-rotator')
      expect(textRotator).toHaveTextContent('relevant.')
    })
  })

  describe('Structure and styling', () => {
    it('has proper semantic structure', () => {
      render(<HeroSection />)
      
      // Should have main heading
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
      
      // Should have section headings
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings).toHaveLength(2) // "La Oportunidad" and "La Solución"
    })

    it('applies gradient styling to dynamic text', () => {
      render(<HeroSection />)
      
      const textRotator = screen.getByTestId('text-rotator')
      expect(textRotator).toHaveClass('text-transparent', 'bg-clip-text', 'bg-gradient-to-r')
    })

    it('has responsive design classes', () => {
      render(<HeroSection />)
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveClass('text-4xl', 'md:text-6xl', 'lg:text-7xl')
    })

    it('contains scroll indicator', () => {
      render(<HeroSection language="es" />)
      
      expect(screen.getByText('Desplázate para explorar')).toBeInTheDocument()
    })
  })

  describe('Content accuracy', () => {
    it('displays correct Spanish opportunity text', () => {
      render(<HeroSection language="es" />)
      
      expect(screen.getByText(/Las asistencias tradicionales se han quedado atrás/)).toBeInTheDocument()
    })

    it('displays correct English opportunity text', () => {
      render(<HeroSection language="en" />)
      
      expect(screen.getByText(/The old model of loyalty is broken/)).toBeInTheDocument()
    })

    it('maintains consistent branding message across languages', () => {
      const { rerender } = render(<HeroSection language="es" />)
      expect(screen.getByText(/20 años de experiencia/)).toBeInTheDocument()
      
      rerender(<HeroSection language="en" />)
      expect(screen.getByText(/20 years of experience/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HeroSection />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })
      
      expect(h1).toBeInTheDocument()
      expect(h2s).toHaveLength(2)
    })

    it('has readable text contrast classes', () => {
      render(<HeroSection />)
      
      // Check for proper opacity classes for readability
      expect(screen.getByText(/El futuro de la lealtad/)).toHaveClass('text-blue-200/80')
    })
  })
})