import type { MotionValue } from "framer-motion"

/**
 * Configuration for individual celestial arc layers
 * These settings control the organic shapeshifting behavior
 */
export interface ArcConfiguration {
  /** Animation delay in seconds (creates staggered entrance effect) */
  delay: number
  /** Scale factor for the arc (creates depth layering) */
  scale: number
  /** Opacity level (0-1, controls transparency blending) */
  opacity: number
  /** Z-index for layer ordering (higher = closer to viewer) */
  zIndex: number
  /** 
   * Parallax movement strength 
   * Negative values move opposite to mouse (background layers)
   * Positive values move with mouse (foreground layers)
   */
  parallaxStrength: number
}

/**
 * Framer Motion spring physics configuration
 * Controls the natural movement behavior
 */
export interface SpringConfiguration {
  /** How quickly the animation responds (higher = more responsive) */
  stiffness: number
  /** How much the animation bounces (lower = less bouncy) */
  damping: number
  /** The weight of the animated element (affects acceleration) */
  mass: number
}

/**
 * Props for components that respond to mouse movement
 */
export interface MouseTrackingProps {
  /** X coordinate motion value for real-time mouse tracking */
  mouseX: MotionValue<number>
  /** Y coordinate motion value for real-time mouse tracking */
  mouseY: MotionValue<number>
}

/**
 * Complete props for CelestialArc component
 * Combines mouse tracking with arc configuration
 */
export interface CelestialArcProps extends MouseTrackingProps, ArcConfiguration {}

/**
 * Props for EtherealSpotlight component
 * Simple mouse tracking for cursor-following effect
 */
export interface EtherealSpotlightProps extends MouseTrackingProps {}

/**
 * Scroll-based animation values
 * Controls how the background responds to page scrolling
 */
export interface ScrollEffects {
  /** Scale transformation (grows background during scroll) */
  scale: MotionValue<number>
  /** Vertical position offset (moves background up during scroll) */
  y: MotionValue<number>
  /** Overall opacity (fades background during scroll) */
  opacity: MotionValue<number>
  /** Mask overlay opacity (dark overlay in final scroll phase) */
  maskOpacity: MotionValue<number>
}

/**
 * Mouse-based animation values
 * Controls how the background responds to cursor movement
 */
export interface MouseEffects {
  /** Real-time X coordinate of mouse cursor */
  mouseX: MotionValue<number>
  /** Real-time Y coordinate of mouse cursor */
  mouseY: MotionValue<number>
  /** Dynamic spotlight gradient that follows cursor */
  spotlightBackground: MotionValue<string>
}

/**
 * Complete animation state for the ethereal system
 * Combines all interactive and scroll-based effects
 */
export interface EtherealAnimations {
  /** Scroll-triggered effects */
  scrollEffects: ScrollEffects
  /** Mouse-triggered effects */
  mouseEffects: MouseEffects
  /** Whether the system has finished loading */
  isLoaded: boolean
}

/**
 * Color definitions for the ethereal system
 * Maintains the cosmic blue color scheme
 */
export interface EtherealColors {
  /** Deep space blue for background layers */
  primary: string
  /** Bright cosmic blue for mid-layers */
  secondary: string
  /** Light ethereal blue for foreground elements */
  accent: string
  /** Main background gradient */
  background: string
  /** Overlay mask color */
  maskOverlay: string
}

/**
 * Timing configurations for animations
 * Controls the organic, non-synchronized behavior
 */
export interface EtherealTiming {
  /** Initial system load duration */
  loadDuration: number
  /** Arc entrance animation duration */
  arcDuration: number
  /** Spotlight appearance duration */
  spotlightDuration: number
  /** Gradient morphing durations (creates organic effect) */
  morphingDurations: {
    /** Outer layer morphing speed */
    outer: number
    /** Middle layer morphing speed */
    middle: number
    /** Inner layer morphing speed */
    inner: number
  }
}

/**
 * Gradient layer definition for organic morphing
 * Each layer morphs between these states continuously
 */
export interface GradientLayer {
  /** CSS size values for the ellipse (width, height) */
  size: {
    base: [string, string]
    morph: [string, string]
  }
  /** CSS position values for the ellipse center */
  position: {
    base: [string, string]
    morph: [string, string]
  }
  /** Color values with opacity */
  colors: {
    inner: string
    middle: string
    outer: string
  }
  /** Animation duration for this layer */
  duration: number
}

/**
 * Complete ethereal system configuration
 * Allows for easy customization while preserving the organic effect
 */
export interface EtherealConfig {
  /** Arc layer configurations */
  arcConfigurations: ArcConfiguration[]
  /** Spring physics settings */
  springConfigs: {
    main: SpringConfiguration
    celestial: SpringConfiguration
  }
  /** Color scheme */
  colors: EtherealColors
  /** Animation timing */
  timing: EtherealTiming
  /** Gradient layer definitions */
  gradientLayers: GradientLayer[]
}