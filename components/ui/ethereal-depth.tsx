"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion"
import { CelestialArc } from "./celestial-arc"
import { EtherealSpotlight } from "./ethereal-spotlight"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLenisScroll } from "@/hooks/use-lenis-scroll"
import { useAnimationCoordinator } from "@/hooks/use-animation-coordinator"
import { ParallaxLayer } from "@/components/scroll/ParallaxLayer"

const arcConfigurations = [
  { delay: 0, scale: 1.2, opacity: 0.3, zIndex: 10, parallaxStrength: -15 },
  { delay: 0.3, scale: 1.0, opacity: 0.5, zIndex: 20, parallaxStrength: -8 },
  { delay: 0.6, scale: 0.8, opacity: 0.7, zIndex: 30, parallaxStrength: -3 },
  { delay: 0.9, scale: 0.6, opacity: 0.4, zIndex: 40, parallaxStrength: 5 },
]

// Optimized spring configs for different use cases
const scrollSpringConfig = { stiffness: 80, damping: 18, mass: 0.4, restSpeed: 0.01 }
const mouseSpringConfig = { stiffness: 60, damping: 15, mass: 0.3, restSpeed: 0.01 }

export const EtherealDepth: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Use Lenis scroll integration instead of native useScroll
  const { scrollProgress, createScrollTransform, isReady } = useLenisScroll({
    onScroll: (data) => {
      // Scroll data handled internally by animation coordinator
    }
  })

  // Create animation coordinator for enhanced effects
  const { createParallaxAnimation, createSpringAnimation } = useAnimationCoordinator({
    sectionId: 'ethereal-depth',
    autoCleanup: true,
    performanceMode: prefersReducedMotion ? 'battery' : 'smooth'
  })

  // Enhanced scroll transforms using Lenis
  const scale = createScrollTransform([0, 1], [1, 1.5])
  const y = createScrollTransform([0, 1], [0, -200])
  const opacity = createScrollTransform([0, 0.5, 1], [1, 0.8, 0])
  const maskOpacity = createScrollTransform([0.8, 1], [0, 1])

  const spotlightBackground = useTransform<number[], string>(
    [mouseX, mouseY],
    ([latestX, latestY]) =>
      `radial-gradient(circle at ${latestX}px ${latestY}px, rgba(59, 130, 246, 0.1) 0%, transparent 300px)`,
  )

  useEffect(() => {
    setIsClient(true)
    setIsLoaded(true)
    
    // Safer mouse tracking with CodeSandbox compatibility
    let ticking = false
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking && !prefersReducedMotion) {
        requestAnimationFrame(() => {
          try {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
          } catch (error) {
            // Mouse tracking error handled silently
          }
          ticking = false
        })
        ticking = true
      }
    }

    // Check if we're in a safe environment for mouse tracking
    if (typeof window !== 'undefined' && !prefersReducedMotion) {
      try {
        window.addEventListener("mousemove", handleMouseMove, { passive: true })
        return () => {
          try {
            window.removeEventListener("mousemove", handleMouseMove)
          } catch (error) {
            // Mouse listener cleanup error handled silently
          }
        }
      } catch (error) {
        // Mouse tracking initialization error handled silently
      }
    }
  }, [mouseX, mouseY, prefersReducedMotion])

  return (
    <motion.div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #020010 0%, #0a0a23 50%, #020010 100%)",
        perspective: "1000px",
        scale,
        opacity,
        y,
        willChange: "transform",
        zIndex: 0, // Ensure background layer
      }}
      data-ethereal-depth
      data-lenis-ready={isReady}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      >
        {/* Enhanced parallax celestial arcs */}
        {isClient && isReady && arcConfigurations.map((config, index) => (
          <ParallaxLayer
            key={config.zIndex}
            speed={config.parallaxStrength * 0.01}
            direction="vertical"
            easing="smooth"
            className="absolute inset-0"
          >
            <CelestialArc 
              mouseX={mouseX} 
              mouseY={mouseY} 
              prefersReducedMotion={prefersReducedMotion}
              {...config} 
            />
          </ParallaxLayer>
        ))}

        {/* Enhanced spotlight with parallax */}
        {isClient && isReady && (
          <ParallaxLayer
            speed={-0.1}
            direction="both"
            easing="spring"
            className="absolute inset-0"
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: spotlightBackground, willChange: "background" }}
            />
          </ParallaxLayer>
        )}

        {/* Main spotlight effect */}
        {isClient && isLoaded && isReady && (
          <ParallaxLayer
            speed={0.2}
            direction="vertical"
            easing="smooth"
            className="absolute inset-0"
          >
            <EtherealSpotlight mouseX={mouseX} mouseY={mouseY} />
          </ParallaxLayer>
        )}

        {/* Scroll-based mask overlay */}
        <motion.div
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: "rgba(2, 0, 16, 0.9)",
            opacity: maskOpacity,
            willChange: "opacity",
          }}
        />
        
        {/* Static gradient overlay */}
        <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-t from-black/50 to-transparent" />
      </motion.div>
    </motion.div>
  )
}
