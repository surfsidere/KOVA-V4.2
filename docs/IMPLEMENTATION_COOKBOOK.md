# 👨‍🍳 KOVA V4: Implementation Cookbook

Practical recipes and examples for implementing immersive web experiences.

## 🚀 Quick Start Recipes

### Recipe 1: Basic Immersive Page

Create a simple immersive page with multiple sections and smooth transitions.

```tsx
// pages/immersive-demo.tsx
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { ScrollTrigger } from '@/components/scroll/ScrollTrigger'
import { ParallaxLayer } from '@/components/scroll/ParallaxLayer'
import { ZLayers } from '@/types/scroll.types'

export default function ImmersiveDemoPage() {
  return (
    <main className="relative">
      {/* Hero Section with Fade Effect */}
      <ScrollSection
        id="hero"
        triggerStart={0}
        triggerEnd={0.25}
        layer={ZLayers.CONTENT_ELEVATED}
        contrast="dark"
        fadeEffect={true}
        className="h-screen bg-gradient-to-br from-purple-900 to-blue-900"
      >
        <div className="flex items-center justify-center h-full">
          <ScrollTrigger
            start={0}
            end={0.2}
            scale={{ from: 0.8, to: 1 }}
            fade={true}
          >
            <h1 className="text-6xl font-bold text-white text-center">
              Welcome to the Future
            </h1>
          </ScrollTrigger>
        </div>
      </ScrollSection>

      {/* Content Section with Parallax */}
      <ScrollSection
        id="content"
        triggerStart={0.2}
        triggerEnd={0.7}
        layer={ZLayers.CONTENT_BASE}
        contrast="light"
        scaleEffect={true}
        slideDirection="up"
        className="min-h-screen bg-white"
      >
        <ParallaxLayer speed={-0.3} direction="vertical">
          <div className="container mx-auto py-20">
            <h2 className="text-4xl font-bold mb-8">Immersive Content</h2>
            <p className="text-lg text-gray-600">
              This section demonstrates smooth scroll transitions with parallax effects.
            </p>
          </div>
        </ParallaxLayer>
      </ScrollSection>

      {/* Footer Section */}
      <ScrollSection
        id="footer"
        triggerStart={0.6}
        triggerEnd={1}
        layer={ZLayers.CONTENT_ELEVATED}
        contrast="dark"
        fadeEffect={true}
        className="h-screen bg-gradient-to-tr from-gray-900 to-black"
      >
        <div className="flex items-center justify-center h-full">
          <ScrollTrigger
            start={0.8}
            end={0.95}
            rotate={{ from: -5, to: 5 }}
            scale={{ from: 0.9, to: 1.1 }}
          >
            <h3 className="text-3xl font-thin text-white">
              Thanks for scrolling
            </h3>
          </ScrollTrigger>
        </div>
      </ScrollSection>
    </main>
  )
}
```

### Recipe 2: Product Showcase with Dynamic Theming

Create a product showcase that changes themes based on scroll position.

```tsx
// components/ProductShowcase.tsx
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { useContrast } from '@/providers/ContrastProvider'
import { ZLayers } from '@/types/scroll.types'

const products = [
  { id: 'product-1', name: 'Ethereal Pro', theme: 'dark', color: 'blue' },
  { id: 'product-2', name: 'Cosmic Elite', theme: 'light', color: 'purple' },
  { id: 'product-3', name: 'Nebula Max', theme: 'auto', color: 'emerald' },
]

export function ProductShowcase() {
  const { updateTheme } = useContrast()

  return (
    <div className="relative">
      {products.map((product, index) => (
        <ScrollSection
          key={product.id}
          id={product.id}
          triggerStart={index * 0.33}
          triggerEnd={(index + 1) * 0.33}
          layer={ZLayers.CONTENT_ELEVATED}
          contrast={product.theme as any}
          fadeEffect={true}
          scaleEffect={true}
          onEnter={() => {
            // Dynamic theme updates
            updateTheme({
              accent: product.color === 'blue' ? '#3b82f6' : 
                     product.color === 'purple' ? '#8b5cf6' : '#10b981'
            })
          }}
          className="h-screen flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-4 text-ethereal">
              {product.name}
            </h2>
            <p className="text-xl opacity-80">
              Experience the next generation
            </p>
          </div>
        </ScrollSection>
      ))}
    </div>
  )
}
```

## 🎨 Advanced Visual Effects

### Recipe 3: Floating Elements with Physics

Create floating elements that respond to scroll velocity.

```tsx
// components/FloatingElements.tsx
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { motion } from 'framer-motion'

export function FloatingElements() {
  const { velocity } = useLenisScroll()
  const { createVelocityAnimation, createParallaxAnimation } = useAnimationCoordinator()

  // Create floating animations
  const float1 = createParallaxAnimation('float-1', 0.2, 'both')
  const float2 = createParallaxAnimation('float-2', -0.15, 'vertical')
  const velocityShake = createVelocityAnimation('shake', 0.5)

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Floating orb 1 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"
        style={{
          x: float1?.motionValue,
          y: float1?.motionValue,
          rotate: velocityShake?.motionValue,
        }}
      />

      {/* Floating orb 2 */}
      <motion.div
        className="absolute top-3/4 right-1/3 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl"
        style={{
          y: float2?.motionValue,
          scale: useTransform(velocity, [-50, 0, 50], [0.8, 1, 1.2]),
        }}
      />

      {/* Velocity-responsive particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            left: `${10 + i * 8}%`,
            top: `${20 + i * 6}%`,
            y: createParallaxAnimation(`particle-${i}`, 0.1 * i)?.motionValue,
            opacity: useTransform(velocity, [0, 20], [0.4, 1]),
          }}
        />
      ))}
    </div>
  )
}
```

### Recipe 4: Magnetic Cursor Effect

Create a magnetic cursor that follows scroll and mouse movement.

```tsx
// components/MagneticCursor.tsx
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'

export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const { velocity } = useLenisScroll()
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)
  
  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX - 8)
      mouseY.set(e.clientY - 8)
    }
    
    window.addEventListener('mousemove', updateCursor)
    return () => window.removeEventListener('mousemove', updateCursor)
  }, [mouseX, mouseY])

  return (
    <motion.div
      ref={cursorRef}
      className="fixed w-4 h-4 pointer-events-none z-50 mix-blend-difference"
      style={{
        x: cursorX,
        y: cursorY,
        scale: useTransform(velocity, [-20, 0, 20], [0.5, 1, 2]),
      }}
    >
      <div className="w-full h-full bg-white rounded-full" />
    </motion.div>
  )
}
```

## 🎬 Narrative Storytelling

### Recipe 5: Story-driven Scroll Experience

Create a narrative experience that unfolds with scroll.

```tsx
// components/StoryScroll.tsx
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { ScrollTrigger } from '@/components/scroll/ScrollTrigger'
import { ParallaxLayer } from '@/components/scroll/ParallaxLayer'
import { ZLayers } from '@/types/scroll.types'

const storyBeats = [
  {
    id: 'prologue',
    title: 'In the beginning...',
    content: 'The digital realm was formless and void.',
    theme: 'dark',
    background: 'from-black to-gray-900'
  },
  {
    id: 'awakening',
    title: 'Then came the light',
    content: 'Data began to flow, patterns emerged.',
    theme: 'auto',
    background: 'from-blue-900 to-purple-900'
  },
  {
    id: 'evolution',
    title: 'Evolution accelerated',
    content: 'Intelligence sparked across networks.',
    theme: 'light',
    background: 'from-white to-blue-50'
  },
  {
    id: 'transcendence',
    title: 'Transcendence achieved',
    content: 'The boundary between digital and physical dissolved.',
    theme: 'dark',
    background: 'from-purple-900 to-pink-900'
  }
]

export function StoryScroll() {
  return (
    <div className="relative">
      {storyBeats.map((beat, index) => (
        <ScrollSection
          key={beat.id}
          id={beat.id}
          triggerStart={index * 0.25}
          triggerEnd={(index + 1) * 0.25}
          layer={index % 2 === 0 ? ZLayers.CONTENT_BASE : ZLayers.CONTENT_ELEVATED}
          contrast={beat.theme as any}
          fadeEffect={true}
          slideDirection={index % 2 === 0 ? 'up' : 'down'}
          onEnter={() => console.log(`Chapter ${index + 1}: ${beat.title}`)}
          className={`min-h-screen bg-gradient-to-br ${beat.background}`}
        >
          <div className="flex items-center justify-center h-screen">
            <div className="text-center max-w-4xl px-8">
              <ParallaxLayer speed={0.2} direction="vertical">
                <ScrollTrigger
                  start={index * 0.25}
                  end={index * 0.25 + 0.1}
                  fade={true}
                  translate={{ y: [50, 0] }}
                >
                  <h2 className="text-6xl font-bold mb-8 text-ethereal">
                    {beat.title}
                  </h2>
                </ScrollTrigger>
              </ParallaxLayer>
              
              <ParallaxLayer speed={-0.1} direction="vertical">
                <ScrollTrigger
                  start={index * 0.25 + 0.05}
                  end={index * 0.25 + 0.15}
                  fade={true}
                  scale={{ from: 0.8, to: 1 }}
                >
                  <p className="text-2xl opacity-80">
                    {beat.content}
                  </p>
                </ScrollTrigger>
              </ParallaxLayer>
            </div>
          </div>
        </ScrollSection>
      ))}
    </div>
  )
}
```

### Recipe 6: Interactive Timeline

Create an interactive timeline with scroll-triggered reveals.

```tsx
// components/InteractiveTimeline.tsx
import { useState } from 'react'
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { ScrollTrigger } from '@/components/scroll/ScrollTrigger'
import { useSectionManager } from '@/hooks/use-section-manager'

interface TimelineEvent {
  year: string
  title: string
  description: string
  icon: string
}

const events: TimelineEvent[] = [
  { year: '2020', title: 'Genesis', description: 'The idea was born', icon: '🌱' },
  { year: '2021', title: 'Growth', description: 'Development began', icon: '🚀' },
  { year: '2022', title: 'Launch', description: 'First public release', icon: '🎉' },
  { year: '2023', title: 'Scale', description: 'Global expansion', icon: '🌍' },
  { year: '2024', title: 'Future', description: 'Next generation', icon: '✨' },
]

export function InteractiveTimeline() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null)

  return (
    <div className="relative py-20">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-20">Our Journey</h2>
        
        {/* Timeline line */}
        <div className="absolute left-1/2 top-40 bottom-20 w-1 bg-gray-300 transform -translate-x-1/2" />
        
        {events.map((event, index) => (
          <ScrollSection
            key={event.year}
            id={`timeline-${event.year}`}
            triggerStart={index * 0.2}
            triggerEnd={(index + 1) * 0.2}
            onEnter={() => setActiveEvent(event.year)}
            onLeave={() => setActiveEvent(null)}
            className="relative mb-20"
          >
            <ScrollTrigger
              start={index * 0.2}
              end={index * 0.2 + 0.1}
              translate={{ 
                x: index % 2 === 0 ? [-100, 0] : [100, 0] 
              }}
              fade={true}
            >
              <div className={`flex items-center ${
                index % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}>
                <div className={`w-1/2 ${
                  index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'
                }`}>
                  <div className={`inline-block p-6 rounded-lg transition-all duration-300 ${
                    activeEvent === event.year 
                      ? 'bg-blue-500 text-white scale-110' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="text-4xl mb-2">{event.icon}</div>
                    <h3 className="text-2xl font-bold mb-2">{event.year}</h3>
                    <h4 className="text-xl font-semibold mb-2">{event.title}</h4>
                    <p className="text-sm">{event.description}</p>
                  </div>
                </div>
              </div>
            </ScrollTrigger>

            {/* Timeline dot */}
            <ScrollTrigger
              start={index * 0.2}
              end={index * 0.2 + 0.05}
              scale={{ from: 0, to: 1 }}
            >
              <div className="absolute left-1/2 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />
            </ScrollTrigger>
          </ScrollSection>
        ))}
      </div>
    </div>
  )
}
```

## 🎮 Interactive Elements

### Recipe 7: Scroll-controlled Animation

Create animations that are directly controlled by scroll position.

```tsx
// components/ScrollControlledAnimation.tsx
import { motion } from 'framer-motion'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { useTransform } from 'framer-motion'

export function ScrollControlledAnimation() {
  const { scrollProgress } = useLenisScroll()
  
  // Create scroll-based transforms
  const rotateX = useTransform(scrollProgress, [0, 1], [0, 360])
  const scale = useTransform(scrollProgress, [0, 0.5, 1], [1, 2, 1])
  const opacity = useTransform(scrollProgress, [0, 0.2, 0.8, 1], [1, 0.5, 0.5, 1])
  const background = useTransform(
    scrollProgress,
    [0, 0.33, 0.66, 1],
    ['#000000', '#ff0000', '#00ff00', '#0000ff']
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        className="w-32 h-32 rounded-lg"
        style={{
          rotateX,
          scale,
          opacity,
          background,
        }}
      />
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <motion.div
          className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-blue-500"
            style={{
              width: useTransform(scrollProgress, [0, 1], ['0%', '100%'])
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
```

### Recipe 8: Velocity-responsive Effects

Create effects that respond to scroll velocity.

```tsx
// components/VelocityEffects.tsx
import { motion, useTransform } from 'framer-motion'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'

export function VelocityEffects() {
  const { velocity } = useLenisScroll()
  const { createVelocityAnimation } = useAnimationCoordinator()

  // Velocity-based transforms
  const blur = useTransform(velocity, [-50, 0, 50], [10, 0, 10])
  const skew = useTransform(velocity, [-100, 0, 100], [-5, 0, 5])
  const trail = createVelocityAnimation('trail', 2)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Speed lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-px bg-white/20"
          style={{
            top: `${i * 5}%`,
            scaleX: useTransform(velocity, [0, 50], [0, 1]),
            x: useTransform(velocity, [0, 50], ['100%', '-100%']),
          }}
        />
      ))}

      {/* Velocity blur overlay */}
      <motion.div
        className="absolute inset-0 bg-black/10"
        style={{
          filter: `blur(${blur}px)`,
          opacity: useTransform(velocity, [0, 20], [0, 0.3]),
        }}
      />

      {/* Skew effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        style={{
          skewY: skew,
          opacity: useTransform(velocity, [0, 30], [0, 1]),
        }}
      />

      {/* Velocity indicator */}
      <div className="absolute top-10 right-10 bg-black/50 text-white p-4 rounded-lg">
        <motion.div
          style={{
            scale: useTransform(velocity, [0, 50], [1, 1.5]),
          }}
        >
          Velocity: {Math.round(velocity)}
        </motion.div>
      </div>
    </div>
  )
}
```

## 🔧 Performance Optimization

### Recipe 9: Optimized Large Section Grid

Handle many sections efficiently with performance optimizations.

```tsx
// components/OptimizedSectionGrid.tsx
import { useMemo } from 'react'
import { ScrollSection } from '@/components/scroll/ScrollSection'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'

interface GridItem {
  id: string
  title: string
  content: string
  color: string
}

const GRID_SIZE = 50 // Large number of sections

export function OptimizedSectionGrid() {
  const { removeAnimation } = useAnimationCoordinator({
    autoCleanup: true,
    performanceMode: 'performance', // Optimize for performance
  })

  // Memoize grid items
  const gridItems = useMemo(() => 
    Array.from({ length: GRID_SIZE }, (_, i) => ({
      id: `item-${i}`,
      title: `Section ${i + 1}`,
      content: `This is content for section ${i + 1}`,
      color: `hsl(${(i * 360) / GRID_SIZE}, 70%, 50%)`
    })), []
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      {gridItems.map((item, index) => (
        <ScrollSection
          key={item.id}
          id={item.id}
          triggerStart={index * 0.01}
          triggerEnd={(index + 1) * 0.01}
          fadeEffect={true}
          onEnter={() => {
            // Cleanup distant animations
            if (index > 10) {
              removeAnimation(`item-${index - 10}-fade`)
            }
          }}
          className="h-64 rounded-lg p-6 flex items-center justify-center text-white"
          style={{ backgroundColor: item.color }}
        >
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-sm opacity-80">{item.content}</p>
          </div>
        </ScrollSection>
      ))}
    </div>
  )
}
```

### Recipe 10: Memory-conscious Infinite Scroll

Implement infinite scroll with memory management.

```tsx
// components/InfiniteScrollList.tsx
import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '@/components/scroll/ScrollTrigger'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'

interface ListItem {
  id: string
  title: string
  content: string
}

const BUFFER_SIZE = 20 // Items to keep in memory
const BATCH_SIZE = 10  // Items to load per batch

export function InfiniteScrollList() {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const { progress } = useLenisScroll()

  // Load more items
  const loadMore = async () => {
    if (loadingRef.current) return
    
    loadingRef.current = true
    setLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    const newItems = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      id: `item-${items.length + i}`,
      title: `Item ${items.length + i + 1}`,
      content: `Content for item ${items.length + i + 1}`
    }))

    setItems(prev => {
      const updated = [...prev, ...newItems]
      
      // Memory management: keep only recent items
      if (updated.length > BUFFER_SIZE) {
        return updated.slice(-BUFFER_SIZE)
      }
      
      return updated
    })

    setLoading(false)
    loadingRef.current = false
  }

  // Load initial items
  useEffect(() => {
    loadMore()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-8">
      {items.map((item, index) => (
        <ScrollTrigger
          key={item.id}
          start={(index * 0.1) / items.length}
          end={((index + 1) * 0.1) / items.length}
          fade={true}
          translate={{ y: [20, 0] }}
        >
          <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.content}</p>
          </div>
        </ScrollTrigger>
      ))}

      {/* Load more trigger */}
      <ScrollTrigger
        start={0.9}
        end={1}
        onEnter={loadMore}
      >
        <div className="text-center py-8">
          {loading ? (
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          ) : (
            <p className="text-gray-500">Scroll for more...</p>
          )}
        </div>
      </ScrollTrigger>
    </div>
  )
}
```

## 🎯 Tips and Best Practices

### Performance Tips

1. **Use `performanceMode`**: Set appropriate performance modes based on content complexity
2. **Batch animations**: Group related animations together
3. **Cleanup unused animations**: Use `autoCleanup: true` for automatic memory management
4. **Throttle callbacks**: Use the built-in throttling for scroll callbacks
5. **Optimize transforms**: Prefer `transform3d` for GPU acceleration

### Accessibility Guidelines

1. **Respect reduced motion**: The system automatically handles `prefers-reduced-motion`
2. **Maintain focus management**: Ensure interactive elements remain accessible
3. **Provide fallbacks**: Always have a non-animated fallback
4. **Use semantic markup**: Don't sacrifice semantics for visual effects

### Development Workflow

1. **Start simple**: Begin with basic ScrollSections, add effects incrementally
2. **Use debug mode**: Enable debug markers during development
3. **Test performance**: Monitor animation counts and performance
4. **Progressive enhancement**: Build core functionality first, add immersive effects after

### Common Patterns

1. **Hero → Content → Footer**: Classic three-section layout
2. **Story-driven**: Sequential narrative sections with theme changes
3. **Product showcase**: Grid-based sections with dynamic theming
4. **Portfolio**: Project sections with parallax and effects
5. **Landing page**: Hero with multiple feature sections

This cookbook provides practical, copy-paste examples for implementing immersive web experiences with the KOVA V4 system.