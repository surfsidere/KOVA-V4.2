# ⚡ KOVA V4: Performance Optimization Guide

Comprehensive guide for optimizing performance in immersive web experiences.

## 🎯 Performance Targets

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **INP (Interaction to Next Paint)**: <200ms

### Animation Performance Targets
- **Frame Rate**: Consistent 60fps (16.67ms per frame)
- **Animation Budget**: <8ms per frame for JavaScript
- **Memory Usage**: <100MB for mobile, <500MB for desktop
- **Battery Impact**: Minimal (<5% additional drain)

## 🔧 Built-in Performance Features

### Automatic Optimizations

#### 1. Single RAF Loop
The system uses a single `requestAnimationFrame` loop for all animations:

```typescript
// All animations coordinate through one RAF loop
useEffect(() => {
  let isActive = true
  
  const updateAnimations = () => {
    if (!isActive) return
    
    // Update all active animations in one frame
    animations.forEach((animation, id) => {
      if (isAnimationActive(id)) {
        updateAnimation(animation)
      }
    })
    
    requestAnimationFrame(updateAnimations)
  }
  
  updateAnimations()
  return () => { isActive = false }
}, [])
```

#### 2. GPU Acceleration
Automatic `transform3d` usage for hardware acceleration:

```css
.parallax-layer {
  will-change: transform;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
```

#### 3. Animation Culling
Off-screen animations are automatically paused:

```typescript
const isAnimationActive = useCallback((animationId: string): boolean => {
  const animation = animations.get(animationId)
  if (!animation) return false
  
  // Check viewport intersection
  const element = animation.element
  return element ? isElementInViewport(element) : true
}, [animations])
```

#### 4. Memory Management
Automatic cleanup of unused animations and resources:

```typescript
// Auto-cleanup inactive animations after 30 seconds
useEffect(() => {
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    const inactiveThreshold = 30000
    
    animations.forEach((animation, id) => {
      if (!animation.isActive && (now - animation.lastUpdate) > inactiveThreshold) {
        removeAnimation(id)
      }
    })
  }, 60000)
  
  return () => clearInterval(cleanupInterval)
}, [])
```

## 🚀 Performance Modes

### 1. Smooth Mode (Default)
Best quality animations with maximum smoothness:

```typescript
const { createScrollAnimation } = useAnimationCoordinator({
  performanceMode: 'smooth',
  autoCleanup: true,
})

// Configuration
const config = {
  updateInterval: 16,    // 60fps
  springStiffness: 80,
  springDamping: 18,
  maxConcurrentAnimations: 50,
}
```

### 2. Performance Mode
Balanced performance with reduced quality:

```typescript
const { createScrollAnimation } = useAnimationCoordinator({
  performanceMode: 'performance',
  autoCleanup: true,
})

// Configuration
const config = {
  updateInterval: 33,    // 30fps
  springStiffness: 60,
  springDamping: 20,
  maxConcurrentAnimations: 25,
}
```

### 3. Battery Mode
Maximum battery conservation:

```typescript
const { createScrollAnimation } = useAnimationCoordinator({
  performanceMode: 'battery',
  autoCleanup: true,
})

// Configuration
const config = {
  updateInterval: 50,    // 20fps
  springStiffness: 40,
  springDamping: 25,
  maxConcurrentAnimations: 10,
}
```

### 4. Adaptive Mode
Automatically adjusts based on device performance:

```typescript
// Automatic performance mode detection
const getPerformanceMode = () => {
  const connection = navigator.connection
  const deviceMemory = navigator.deviceMemory
  
  if (deviceMemory && deviceMemory < 4) return 'battery'
  if (connection && connection.effectiveType === '3g') return 'performance'
  
  return 'smooth'
}
```

## 📊 Performance Monitoring

### Built-in Performance Monitor

```typescript
// hooks/use-performance-monitor.ts
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    animationCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  })
  
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const monitor = () => {
      const now = performance.now()
      frameCount++
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime))
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: performance.memory?.usedJSHeapSize || 0,
          cpuUsage: navigator.hardwareConcurrency || 1,
        }))
        
        frameCount = 0
        lastTime = now
      }
      
      requestAnimationFrame(monitor)
    }
    
    monitor()
  }, [])
  
  return metrics
}
```

### Performance Debug Component

```typescript
// components/PerformanceDebug.tsx
export function PerformanceDebug() {
  const metrics = usePerformanceMonitor()
  const { animations, activeAnimations } = useAnimationCoordinator()
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm z-[9999]">
      <div>FPS: <span className={metrics.fps < 55 ? 'text-red-400' : 'text-green-400'}>{metrics.fps}</span></div>
      <div>Animations: {activeAnimations.length}/{animations.length}</div>
      <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
      <div>CPU Cores: {metrics.cpuUsage}</div>
    </div>
  )
}
```

## 🎨 Optimization Strategies

### 1. Animation Optimization

#### Prefer Transforms Over Layout Properties
```typescript
// ✅ Good - Uses transform (GPU accelerated)
const parallaxAnimation = useTransform(scrollProgress, [0, 1], [0, -100])

// ❌ Bad - Triggers layout
const badAnimation = useTransform(scrollProgress, [0, 1], [0, 100])
// Then setting element.style.top = badAnimation.get() + 'px'
```

#### Use `will-change` Sparingly
```typescript
// Automatic will-change management
useEffect(() => {
  if (element && isAnimating) {
    element.style.willChange = 'transform'
  } else if (element) {
    element.style.willChange = 'auto'
  }
}, [element, isAnimating])
```

#### Batch DOM Updates
```typescript
// ✅ Good - Batch updates
const updateElements = useCallback(() => {
  requestAnimationFrame(() => {
    elements.forEach(element => {
      element.style.transform = `translateY(${getOffset(element)}px)`
    })
  })
}, [elements])

// ❌ Bad - Multiple RAF calls
elements.forEach(element => {
  requestAnimationFrame(() => {
    element.style.transform = `translateY(${getOffset(element)}px)`
  })
})
```

### 2. Scroll Performance

#### Throttle Scroll Events
```typescript
// Built-in throttling in useLenisScroll
const { scrollProgress } = useLenisScroll({
  throttle: 16, // ~60fps
  onScroll: debounce((data) => {
    // Heavy computation here
  }, 100)
})
```

#### Use Intersection Observer
```typescript
// Automatic viewport detection
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const sectionId = entry.target.getAttribute('data-section-id')
        if (entry.isIntersecting) {
          activateSection(sectionId)
        } else {
          deactivateSection(sectionId)
        }
      })
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  )
  
  sections.forEach(section => observer.observe(section.element))
  return () => observer.disconnect()
}, [sections])
```

### 3. Memory Optimization

#### Implement Object Pooling
```typescript
// Animation object pool to reduce GC pressure
class AnimationPool {
  private pool: Animation[] = []
  
  acquire(): Animation {
    return this.pool.pop() || this.createNew()
  }
  
  release(animation: Animation) {
    animation.reset()
    this.pool.push(animation)
  }
  
  private createNew(): Animation {
    return new Animation()
  }
}
```

#### Lazy Load Animations
```typescript
// Load animations only when needed
const useLazyAnimation = (sectionId: string) => {
  const [animation, setAnimation] = useState<Animation | null>(null)
  const { isActive } = useSectionManager({ id: sectionId })
  
  useEffect(() => {
    if (isActive && !animation) {
      import('./animations/complexAnimation').then(({ createAnimation }) => {
        setAnimation(createAnimation(sectionId))
      })
    }
  }, [isActive, animation, sectionId])
  
  return animation
}
```

### 4. Bundle Optimization

#### Code Splitting
```typescript
// Lazy load heavy animation components
const ParallaxLayer = lazy(() => import('@/components/scroll/ParallaxLayer'))
const ScrollTrigger = lazy(() => import('@/components/scroll/ScrollTrigger'))

// Usage with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <ParallaxLayer speed={0.5}>
    <ScrollTrigger fade={true}>
      <HeavyContent />
    </ScrollTrigger>
  </ParallaxLayer>
</Suspense>
```

#### Tree Shaking
```typescript
// ✅ Good - Import only what you need
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { ScrollSection } from '@/components/scroll/ScrollSection'

// ❌ Bad - Imports entire library
import * as ScrollComponents from '@/components/scroll'
```

## 📱 Device-Specific Optimizations

### Mobile Optimizations

#### Reduce Animation Complexity
```typescript
const isMobile = useMediaQuery('(max-width: 768px)')

const animationConfig = {
  performanceMode: isMobile ? 'battery' : 'smooth',
  parallaxStrength: isMobile ? 0.1 : 0.5,
  enableComplexEffects: !isMobile,
}
```

#### Touch Optimization
```typescript
// Optimize for touch devices
const touchConfig = {
  smoothTouch: false,        // Disable for better performance
  touchMultiplier: 1.5,      // Reduce sensitivity
  preventDefaultTouches: true, // Prevent conflicts
}
```

### Low-End Device Detection
```typescript
const isLowEndDevice = () => {
  const memory = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  const connection = navigator.connection
  
  return (
    (memory && memory < 4) ||
    (cores && cores < 4) ||
    (connection && connection.effectiveType === '3g')
  )
}

// Adjust performance based on device
const performanceMode = isLowEndDevice() ? 'battery' : 'smooth'
```

## 🛠️ Development Tools

### Performance Profiler Component
```typescript
// components/PerformanceProfiler.tsx
export function PerformanceProfiler({ children }: { children: React.ReactNode }) {
  const [profiling, setProfiling] = useState(false)
  const [profile, setProfile] = useState<PerformanceProfile | null>(null)
  
  const startProfiling = () => {
    performance.mark('profile-start')
    setProfiling(true)
  }
  
  const stopProfiling = () => {
    performance.mark('profile-end')
    performance.measure('profile-duration', 'profile-start', 'profile-end')
    
    const entries = performance.getEntriesByType('measure')
    const duration = entries[entries.length - 1].duration
    
    setProfile({
      duration,
      timestamp: Date.now(),
      memory: performance.memory?.usedJSHeapSize || 0,
    })
    
    setProfiling(false)
  }
  
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg">
          <button onClick={profiling ? stopProfiling : startProfiling}>
            {profiling ? 'Stop Profiling' : 'Start Profiling'}
          </button>
          {profile && (
            <div className="mt-2 text-sm">
              <div>Duration: {profile.duration.toFixed(2)}ms</div>
              <div>Memory: {(profile.memory / 1024 / 1024).toFixed(1)}MB</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
```

### Animation Debugger
```typescript
// hooks/use-animation-debugger.ts
export function useAnimationDebugger() {
  const { animations } = useAnimationCoordinator()
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    const logAnimations = () => {
      const active = animations.filter(a => a.isActive)
      const inactive = animations.filter(a => !a.isActive)
      
      console.group('🎬 Animation Debug')
      console.log(`Active: ${active.length}`, active.map(a => a.id))
      console.log(`Inactive: ${inactive.length}`, inactive.map(a => a.id))
      console.groupEnd()
    }
    
    const interval = setInterval(logAnimations, 5000)
    return () => clearInterval(interval)
  }, [animations])
}
```

## 🚨 Performance Warnings

### Automatic Performance Warnings
```typescript
// Built-in performance monitoring with warnings
useEffect(() => {
  const checkPerformance = () => {
    const activeAnimations = animations.filter(a => a.isActive).length
    const memoryUsage = performance.memory?.usedJSHeapSize || 0
    
    if (activeAnimations > 20) {
      console.warn(`⚠️ High animation count: ${activeAnimations}`)
    }
    
    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      console.warn(`⚠️ High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`)
    }
  }
  
  const interval = setInterval(checkPerformance, 10000)
  return () => clearInterval(interval)
}, [animations])
```

## 📈 Performance Best Practices

### Do's
1. ✅ Use transform properties for animations
2. ✅ Implement proper cleanup in useEffect
3. ✅ Use Intersection Observer for viewport detection
4. ✅ Throttle scroll events
5. ✅ Enable automatic animation cleanup
6. ✅ Use appropriate performance modes
7. ✅ Monitor performance in development
8. ✅ Respect user preferences (reduced motion)

### Don'ts
1. ❌ Animate layout properties (top, left, width, height)
2. ❌ Create multiple RAF loops
3. ❌ Ignore memory cleanup
4. ❌ Use high-frequency scroll listeners
5. ❌ Animate many elements simultaneously without culling
6. ❌ Use complex CSS selectors in animation styles
7. ❌ Ignore device capabilities
8. ❌ Force animations on low-end devices

### Performance Checklist

Before deploying:
- [ ] All animations use transform properties
- [ ] Performance monitoring enabled in development
- [ ] Appropriate performance modes configured
- [ ] Memory cleanup implemented
- [ ] Mobile optimizations applied
- [ ] Reduced motion support verified
- [ ] Core Web Vitals targets met
- [ ] Bundle size optimized

This performance guide ensures your immersive web experiences run smoothly across all devices and network conditions.