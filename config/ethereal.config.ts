import type { 
  ArcConfiguration, 
  SpringConfiguration, 
  EtherealColors, 
  EtherealTiming,
  GradientLayer,
  EtherealConfig 
} from "../types/ethereal.types"

/**
 * 🌌 ETHEREAL DEPTH SYSTEM CONFIGURATION
 * 
 * ⚠️ IMPORTANT: These values create the organic shapeshifting effect.
 * Modifying the timing values or parallax strengths may break the natural feel.
 * 
 * The magic comes from:
 * - Different animation durations (6s, 7s, 8s) that never synchronize
 * - Carefully tuned parallax strengths for depth perception
 * - Specific spring physics for natural movement
 */

/**
 * Arc layer configurations - Controls the depth and movement behavior
 * 
 * Each arc has a different scale, opacity, and parallax strength to create
 * a convincing 3D depth effect. The parallax strengths are carefully tuned:
 * - Negative values move opposite to mouse (background layers)
 * - Positive values move with mouse (foreground layers)
 */
export const ARC_CONFIGURATIONS: ArcConfiguration[] = [
  { 
    delay: 0,     // No delay - appears immediately
    scale: 1.2,   // Largest scale - background layer
    opacity: 0.3, // Most transparent - subtle background
    zIndex: 10,   // Lowest z-index - back layer
    parallaxStrength: -15  // Strong opposite movement - far background
  },
  { 
    delay: 0.3,   // 300ms delay - staggered entrance
    scale: 1.0,   // Normal scale - mid-background
    opacity: 0.5, // Medium transparency
    zIndex: 20,   // Second layer
    parallaxStrength: -8   // Medium opposite movement - mid background
  },
  { 
    delay: 0.6,   // 600ms delay - further staggered
    scale: 0.8,   // Smaller scale - mid-foreground
    opacity: 0.7, // More opaque - more visible
    zIndex: 30,   // Third layer
    parallaxStrength: -3   // Light opposite movement - near background
  },
  { 
    delay: 0.9,   // 900ms delay - final entrance
    scale: 0.6,   // Smallest scale - foreground accent
    opacity: 0.4, // Medium transparency - accent layer
    zIndex: 40,   // Highest z-index - front layer
    parallaxStrength: 5    // Positive movement - moves with mouse
  },
] as const

/**
 * Spring physics configurations - Controls natural movement feel
 * 
 * Different components use different spring settings for varied responsiveness:
 * - Main container: Slower, more stable (for scroll effects)
 * - Celestial arcs: Faster, more responsive (for mouse tracking)
 */
export const SPRING_CONFIGS = {
  /** Main container spring - Used for scroll-based animations */
  main: {
    stiffness: 100,  // Moderate responsiveness
    damping: 20,     // Light damping for smooth movement
    mass: 0.5        // Light mass for gentle feel
  },
  
  /** Celestial arc spring - Used for mouse tracking */
  celestial: {
    stiffness: 150,  // High responsiveness for mouse tracking
    damping: 30,     // Medium damping for controlled movement
    mass: 1          // Normal mass for balanced feel
  }
} as const satisfies { main: SpringConfiguration; celestial: SpringConfiguration }

/**
 * Color scheme - Cosmic blue palette
 * 
 * These colors create the ethereal, cosmic atmosphere:
 * - Deep space blues for background
 * - Bright cosmic blues for mid-layers
 * - Light ethereal blues for highlights
 */
export const ETHEREAL_COLORS: EtherealColors = {
  primary: "rgba(30, 58, 138, 0.5)",    // Deep space blue
  secondary: "rgba(59, 130, 246, 0.3)",  // Bright cosmic blue
  accent: "rgba(96, 165, 250, 0.7)",     // Light ethereal blue
  background: "linear-gradient(135deg, #020010 0%, #0a0a23 50%, #020010 100%)",
  maskOverlay: "rgba(2, 0, 16, 0.9)"     // Dark overlay for scroll effects
} as const

/**
 * Animation timing - Creates the organic, living feel
 * 
 * ⚠️ CRITICAL: The different morphing durations (6s, 7s, 8s) are key to the
 * organic effect. They ensure the layers never synchronize, creating
 * natural variation and preventing repetitive patterns.
 */
export const ETHEREAL_TIMING: EtherealTiming = {
  loadDuration: 1.5,      // System fade-in time
  arcDuration: 2,         // Arc entrance animation time
  spotlightDuration: 1,   // Spotlight appearance time
  
  /** 
   * Morphing durations - CRITICAL for organic effect
   * Different durations prevent synchronization
   */
  morphingDurations: {
    outer: 8,   // Slowest morphing - creates base rhythm
    middle: 7,  // Medium morphing - adds variation
    inner: 6    // Fastest morphing - creates details
  }
} as const

/**
 * Gradient layer definitions - The heart of the shapeshifting effect
 * 
 * Each layer morphs between two states continuously:
 * - Size changes create breathing effect
 * - Position changes create shifting effect
 * - Different durations prevent synchronization
 */
export const GRADIENT_LAYERS: GradientLayer[] = [
  {
    // Outer layer - largest, slowest changing
    size: {
      base: ["80%", "60%"],
      morph: ["82%", "62%"]
    },
    position: {
      base: ["75%", "25%"],
      morph: ["76%", "26%"]
    },
    colors: {
      inner: "rgba(30, 58, 138, 0.5)",
      middle: "rgba(59, 130, 246, 0.3)",
      outer: "rgba(37, 99, 235, 0.2)"
    },
    duration: 8  // Slowest morphing
  },
  {
    // Middle layer - medium size and speed
    size: {
      base: ["70%", "50%"],
      morph: ["72%", "52%"]
    },
    position: {
      base: ["70%", "30%"],
      morph: ["71%", "31%"]
    },
    colors: {
      inner: "rgba(59, 130, 246, 0.6)",
      middle: "rgba(37, 99, 235, 0.4)",
      outer: "transparent"
    },
    duration: 7  // Medium morphing
  },
  {
    // Inner layer - smallest, fastest changing
    size: {
      base: ["60%", "40%"],
      morph: ["62%", "42%"]
    },
    position: {
      base: ["65%", "35%"],
      morph: ["66%", "36%"]
    },
    colors: {
      inner: "rgba(96, 165, 250, 0.7)",
      middle: "rgba(59, 130, 246, 0.5)",
      outer: "transparent"
    },
    duration: 6  // Fastest morphing
  }
] as const

/**
 * Spotlight configuration - Mouse-following gradient
 */
export const SPOTLIGHT_CONFIG = {
  size: 400,  // Diameter in pixels
  blur: "1px",
  blendMode: "screen" as const,
  gradient: "radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.08) 25%, transparent 60%)"
} as const

/**
 * Dynamic spotlight gradient function
 * Creates the real-time mouse-following effect
 */
export const createSpotlightGradient = (x: number, y: number): string =>
  `radial-gradient(circle at ${x}px ${y}px, rgba(59, 130, 246, 0.1) 0%, transparent 300px)`

/**
 * Complete ethereal system configuration
 * Combines all settings into a single configuration object
 */
export const ETHEREAL_CONFIG: EtherealConfig = {
  arcConfigurations: ARC_CONFIGURATIONS,
  springConfigs: SPRING_CONFIGS,
  colors: ETHEREAL_COLORS,
  timing: ETHEREAL_TIMING,
  gradientLayers: GRADIENT_LAYERS
} as const

/**
 * 🎯 CUSTOMIZATION GUIDELINES
 * 
 * Safe to modify:
 * ✅ Colors (change the cosmic blue theme)
 * ✅ Load duration (how fast system appears)
 * ✅ Spotlight settings (cursor following effect)
 * ✅ Scale values (overall size of layers)
 * ✅ Opacity values (transparency of layers)
 * 
 * Modify with caution:
 * ⚠️ Parallax strengths (affects depth perception)
 * ⚠️ Spring stiffness/damping (affects movement feel)
 * ⚠️ Z-index order (affects layer stacking)
 * 
 * DO NOT modify (will break organic effect):
 * ❌ Morphing durations (6s, 7s, 8s) - creates organic variation
 * ❌ Delay timings (creates staggered entrance)
 * ❌ Gradient morphing ranges (creates natural breathing)
 */