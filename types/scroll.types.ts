// Core types for immersive scroll system
export interface ScrollState {
  progress: number;          // 0-1 total scroll progress
  velocity: number;          // scroll velocity
  direction: 'up' | 'down';  // scroll direction
  activeSection: string;     // current section ID
  isScrolling: boolean;      // scroll activity state
}

export interface Section {
  id: string;
  zIndex: number;
  triggerStart: number;      // Scroll % to start transition
  triggerEnd: number;        // Scroll % to complete transition
  animations: Animation[];   // Section-specific animations
  contrast: ContrastMode;    // Light/dark mode for this section
  isActive: boolean;         // Current section state
  element?: HTMLElement;     // DOM reference
}

export interface Animation {
  id: string;
  type: 'fade' | 'slide' | 'scale' | 'mask' | 'color';
  duration: number;
  easing: string;
  properties: Record<string, any>;
}

export type ContrastMode = 'light' | 'dark' | 'auto';

export enum ZLayers {
  BACKGROUND = 0,         // Ethereal depth background
  CONTENT_BASE = 100,     // Base content sections
  CONTENT_ELEVATED = 200, // Elevated narrative sections
  OVERLAY = 300,          // Overlays and modals
  HUD = 400,              // UI elements, navigation
  DEBUG = 9999            // Development tools
}

export interface AnimationTimeline {
  scrollProgress: number;   // From Lenis
  sectionProgress: number;  // Section-specific progress
  globalVelocity: number;   // Scroll velocity
  animations: Map<string, Animation>; // Registered animations
}

export interface LenisInstance {
  scrollTo: (target: string | number, options?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  destroy: () => void;
  raf: (time: number) => void;
  resize: () => void;
  start: () => void;
  stop: () => void;
}

export interface ScrollProviderProps {
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