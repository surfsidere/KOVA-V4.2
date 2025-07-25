# 🔧 KOVA V4: API Reference Guide

Complete API reference for the Immersive Web Experience system.

## 📚 Core Hooks

### useLenisScroll

Provides smooth scroll integration with enhanced state management.

```typescript
const {
  scrollY,           // MotionValue<number> - Current scroll position
  scrollProgress,    // MotionValue<number> - Scroll progress (0-1)
  velocity,          // MotionValue<number> - Current scroll velocity
  isScrolling,       // boolean - Is currently scrolling
  direction,         // 'up' | 'down' - Scroll direction
  progress,          // number - Current scroll progress
  scrollTo,          // Function - Scroll to target
  createTransform,   // Function - Create progress-based transform
  createScrollTransform, // Function - Create scroll-based transform
  createVelocityTransform, // Function - Create velocity-based transform
  isReady,           // boolean - Lenis ready state
} = useLenisScroll(options?)
```

**Options**:
```typescript
interface LenisScrollOptions {
  spring?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
  onScroll?: (data: {
    scroll: number;
    progress: number;
    velocity: number;
    direction: 'up' | 'down';
  }) => void;
  throttle?: number; // ms, default: 16 (~60fps)
}
```

### useSectionManager

Manages section registration, progress tracking, and viewport detection.

```typescript
const {
  isActive,          // boolean - Section is currently active
  sectionProgress,   // number - Progress within section (0-1)
  isInViewport,      // boolean - Section is in viewport
  registerElement,   // Function - Register DOM element
  element,           // HTMLElement | null - Registered element
  getVisibilityData, // Function - Get detailed visibility info
  scrollToSection,   // Function - Scroll to this section
  updateConfig,      // Function - Update section configuration
  section,           // Section - Section object
} = useSectionManager(config)
```

**Config**:
```typescript
interface SectionConfig {
  id: string;
  triggerStart: number;    // 0-1 scroll progress
  triggerEnd: number;      // 0-1 scroll progress
  zIndex?: number;
  animations?: Animation[];
  contrast?: ContrastMode;
  onEnter?: () => void;
  onLeave?: () => void;
  onProgress?: (progress: number) => void;
}
```

### useZIndexOrchestrator

Dynamic z-index management with intelligent layering.

```typescript
const {
  addRule,           // Function - Add z-index rule
  removeRule,        // Function - Remove z-index rule
  createOverlayRule, // Function - Create overlay rule
  createHUDRule,     // Function - Create HUD rule
  createVelocityRule, // Function - Create velocity-based rule
  getZIndexState,    // Function - Get section z-index state
  getSectionsInLayer, // Function - Get sections in layer
  zIndexStates,      // Map<string, ZIndexState> - All states
  forceUpdate,       // Function - Force immediate update
} = useZIndexOrchestrator()
```

**Z-Index Rules**:
```typescript
interface ZIndexRule {
  sectionId: string;
  layer: ZLayers;
  priority: number;
  condition?: (progress: number, velocity: number) => boolean;
}
```

### useAnimationCoordinator

Performance-optimized animation coordination with shared RAF loop.

```typescript
const {
  createScrollAnimation,   // Function - Create scroll-based animation
  createVelocityAnimation, // Function - Create velocity-based animation
  createSpringAnimation,   // Function - Create spring animation
  createParallaxAnimation, // Function - Create parallax animation
  removeAnimation,         // Function - Remove animation
  getAnimation,           // Function - Get animation by ID
  animations,             // Animation[] - All animations
  activeAnimations,       // Animation[] - Currently active animations
  progress,               // number - Current scroll progress
  velocity,               // number - Current scroll velocity
} = useAnimationCoordinator(options?)
```

**Options**:
```typescript
interface AnimationCoordinatorOptions {
  sectionId?: string;
  autoCleanup?: boolean;
  performanceMode?: 'smooth' | 'performance' | 'battery';
}
```

### useContrast

Dynamic theming and color coordination.

```typescript
const {
  contrastState,      // ContrastState - Current contrast state
  setContrastMode,    // Function - Set contrast mode
  interpolateColors,  // Function - Interpolate between colors
  updateTheme,        // Function - Update theme properties
  registerColorTransition, // Function - Register color transition
} = useContrast()
```

**Contrast State**:
```typescript
interface ContrastState {
  mode: ContrastMode;        // 'light' | 'dark' | 'auto'
  theme: ColorTheme;         // Current color theme
  transitionProgress: number; // Transition progress (0-1)
  isTransitioning: boolean;  // Is currently transitioning
}
```

### useParallax

Custom parallax implementation hook.

```typescript
const { x, y, progress } = useParallax(
  speed = 0.5,
  direction = 'vertical' // 'vertical' | 'horizontal' | 'both'
)
```

## 🎨 Components

### ScrollSection

Enhanced section wrapper with built-in effects and lifecycle management.

```typescript
interface ScrollSectionProps {
  id: string;
  triggerStart: number;
  triggerEnd: number;
  children: React.ReactNode;
  className?: string;
  zIndex?: number;
  layer?: ZLayers;
  contrast?: ContrastMode;
  animations?: Animation[];
  onEnter?: () => void;
  onLeave?: () => void;
  onProgress?: (progress: number) => void;
  parallaxStrength?: number;
  fadeEffect?: boolean;
  scaleEffect?: boolean;
  slideDirection?: 'up' | 'down' | 'left' | 'right';
  style?: React.CSSProperties;
}
```

**Ref Interface**:
```typescript
interface ScrollSectionRef {
  element: HTMLElement | null;
  scrollToSection: () => void;
  getSectionProgress: () => number;
  isActive: boolean;
}
```

### ScrollTrigger

Scroll-triggered animations with precise control.

```typescript
interface ScrollTriggerProps {
  children: React.ReactNode;
  start?: number | string;     // 'top' | 'center' | 'bottom' | 0-1
  end?: number | string;       // 'top' | 'center' | 'bottom' | 0-1
  scrub?: boolean | number;    // Link to scroll position
  pin?: boolean;               // Pin element during scroll
  markers?: boolean;           // Show debug markers
  onEnter?: () => void;
  onLeave?: () => void;
  onUpdate?: (progress: number) => void;
  className?: string;
  animation?: {
    from: Record<string, any>;
    to: Record<string, any>;
    ease?: string;
  };
  parallax?: {
    strength: number;
    direction?: 'vertical' | 'horizontal';
  };
  fade?: boolean;
  scale?: {
    from: number;
    to: number;
  };
  rotate?: {
    from: number;
    to: number;
  };
  translate?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
}
```

### ParallaxLayer

Multi-dimensional parallax effects with performance optimization.

```typescript
interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;              // -1 to 1 parallax multiplier
  direction?: 'vertical' | 'horizontal' | 'both';
  offset?: number;             // Initial offset
  className?: string;
  style?: React.CSSProperties;
  easing?: 'linear' | 'smooth' | 'spring';
  bounds?: {                   // Parallax boundaries
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  disabled?: boolean;          // Disable parallax
  debugMode?: boolean;         // Show debug information
  onProgressChange?: (progress: number, offset: number) => void;
}
```

**Preset Components**:
```typescript
// Predefined parallax configurations
<ParallaxBackground />   // speed: -0.5, direction: vertical
<ParallaxForeground />   // speed: 0.3, direction: vertical
<ParallaxFloat />        // speed: 0.2, direction: both, easing: spring
```

## 🏗️ Providers

### LenisProvider

Central scroll coordination provider.

```typescript
interface ScrollProviderProps {
  children: React.ReactNode;
  options?: {
    smooth: boolean;
    lerp: number;
    duration: number;
    easing: (t: number) => number;
    direction: 'vertical' | 'horizontal';
    gestureDirection: 'vertical' | 'horizontal' | 'both';
    smoothTouch: boolean;
    touchMultiplier: number;
  };
}
```

### SectionProvider

Section management and registration provider.

```typescript
interface SectionContextValue {
  sections: Map<string, Section>;
  activeSection: string | null;
  registerSection: (section: Section) => void;
  unregisterSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  getSectionByProgress: (progress: number) => Section | null;
  setActiveSection: (sectionId: string) => void;
  getNextZIndex: (layer: ZLayers) => number;
}
```

### AnimationProvider

Animation coordination provider.

```typescript
interface AnimationContextValue {
  timeline: AnimationTimeline;
  registerAnimation: (animation: Animation) => void;
  unregisterAnimation: (animationId: string) => void;
  getAnimation: (animationId: string) => Animation | undefined;
  updateAnimation: (animationId: string, updates: Partial<Animation>) => void;
  createScrollTransform: (inputRange: number[], outputRange: any[]) => any;
  createVelocityTransform: (multiplier?: number) => any;
  isAnimationActive: (animationId: string) => boolean;
}
```

### ContrastProvider

Dynamic theming provider.

```typescript
interface ContrastContextValue {
  contrastState: ContrastState;
  setContrastMode: (mode: ContrastMode) => void;
  interpolateColors: (from: string, to: string, progress: number) => string;
  updateTheme: (updates: Partial<ColorTheme>) => void;
  registerColorTransition: (sectionId: string, fromTheme: ColorTheme, toTheme: ColorTheme) => void;
}
```

## 📊 Type Definitions

### Core Types

```typescript
interface ScrollState {
  progress: number;          // 0-1 total scroll progress
  velocity: number;          // scroll velocity
  direction: 'up' | 'down';  // scroll direction
  activeSection: string;     // current section ID
  isScrolling: boolean;      // scroll activity state
}

interface Section {
  id: string;
  zIndex: number;
  triggerStart: number;      // Scroll % to start transition
  triggerEnd: number;        // Scroll % to complete transition
  animations: Animation[];   // Section-specific animations
  contrast: ContrastMode;    // Light/dark mode for this section
  isActive: boolean;         // Current section state
  element?: HTMLElement;     // DOM reference
}

interface Animation {
  id: string;
  type: 'fade' | 'slide' | 'scale' | 'mask' | 'color';
  duration: number;
  easing: string;
  properties: Record<string, any>;
}

type ContrastMode = 'light' | 'dark' | 'auto';

enum ZLayers {
  BACKGROUND = 0,         // Ethereal depth background
  CONTENT_BASE = 100,     // Base content sections
  CONTENT_ELEVATED = 200, // Elevated narrative sections
  OVERLAY = 300,          // Overlays and modals
  HUD = 400,              // UI elements, navigation
  DEBUG = 9999            // Development tools
}
```

### Animation Types

```typescript
interface AnimationTimeline {
  scrollProgress: number;   // From Lenis
  sectionProgress: number;  // Section-specific progress
  globalVelocity: number;   // Scroll velocity
  animations: Map<string, Animation>; // Registered animations
}

interface CoordinatedAnimation extends Animation {
  motionValue: MotionValue<any>;
  isActive: boolean;
  lastUpdate: number;
}
```

### Theme Types

```typescript
interface ColorTheme {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
  ring: string;
}

interface ZIndexState {
  currentLayer: ZLayers;
  assignedIndex: number;
  isTransitioning: boolean;
  transitionProgress: number;
}
```

## 🔧 Utility Functions

### Animation Helpers

```typescript
// Create scroll-based animation
const fadeAnimation = createScrollAnimation(
  'fade-in',
  [0, 0.3, 0.7, 1],    // Input range (scroll progress)
  [0, 1, 1, 0]         // Output range (opacity)
)

// Create velocity-based animation
const velocityAnimation = createVelocityAnimation(
  'velocity-shake',
  2.0                   // Velocity multiplier
)

// Create parallax animation
const parallaxAnimation = createParallaxAnimation(
  'hero-parallax',
  0.5,                  // Parallax strength
  'vertical'            // Direction
)
```

### Z-Index Management

```typescript
// Add custom z-index rules
addRule({
  sectionId: 'modal-section',
  layer: ZLayers.OVERLAY,
  priority: 1000,
  condition: (progress, velocity) => velocity > 5 // High velocity
})

// Preset rule creators
createOverlayRule('popup-section', 800)
createHUDRule('navigation', 900)
createVelocityRule('dynamic-section', 10, 500)
```

### Color Manipulation

```typescript
// Interpolate between colors
const interpolatedColor = interpolateColors('#000000', '#ffffff', 0.5)
// Returns: '#808080'

// Update theme dynamically
updateTheme({
  accent: '#ff6b6b',
  background: '#1a1a1a'
})
```

## 🎯 Advanced Usage

### Custom Animation Creation

```typescript
function useCustomParallax(strength: number = 0.5) {
  const { progress } = useLenisScroll()
  const y = useMotionValue(0)
  
  useEffect(() => {
    const updateY = () => {
      const offset = progress * window.innerHeight * strength
      y.set(offset)
    }
    
    const unsubscribe = progress.onChange(updateY)
    return unsubscribe
  }, [progress, strength, y])
  
  return { y, progress }
}
```

### Section Orchestration

```typescript
function useMultiSectionAnimation() {
  const { activeSection, sections } = useSection()
  const { createScrollAnimation } = useAnimationCoordinator()
  
  useEffect(() => {
    sections.forEach((section, id) => {
      if (section.isActive) {
        // Create section-specific animations
        createScrollAnimation(
          `${id}-entrance`,
          [section.triggerStart, section.triggerStart + 0.1],
          [0, 1]
        )
      }
    })
  }, [activeSection, sections, createScrollAnimation])
}
```

### Performance Monitoring

```typescript
function usePerformanceMonitor() {
  const { animations } = useAnimationCoordinator()
  
  useEffect(() => {
    const monitor = () => {
      const activeCount = animations.filter(a => a.isActive).length
      
      if (activeCount > 10) {
        console.warn('High animation count:', activeCount)
      }
    }
    
    const interval = setInterval(monitor, 1000)
    return () => clearInterval(interval)
  }, [animations])
}
```

This API reference provides comprehensive coverage of all available hooks, components, and utilities in the KOVA V4 Immersive Web Experience system.