"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion"
import { CelestialArc } from "./celestial-arc"
import { EtherealSpotlight } from "./ethereal-spotlight"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

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
  const prefersReducedMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Optimized scroll transforms with better spring configs
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.5]), scrollSpringConfig)
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -200]), scrollSpringConfig)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]), scrollSpringConfig)
  const maskOpacity = useSpring(useTransform(scrollYProgress, [0.8, 1], [0, 1]), scrollSpringConfig)

  const spotlightBackground = useTransform<number[], string>(
    [mouseX, mouseY],
    ([latestX, latestY]) =>
      `radial-gradient(circle at ${latestX}px ${latestY}px, rgba(59, 130, 246, 0.1) 0%, transparent 300px)`,
  )

  useEffect(() => {
    setIsLoaded(true)
    // Throttled mouse tracking for better performance
    let ticking = false
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mouseX.set(e.clientX)
          mouseY.set(e.clientY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

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
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      >
        {arcConfigurations.map((config) => (
          <CelestialArc 
            key={config.zIndex} 
            mouseX={mouseX} 
            mouseY={mouseY} 
            prefersReducedMotion={prefersReducedMotion}
            {...config} 
          />
        ))}

        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: spotlightBackground, willChange: "background" }}
        />

        {isLoaded && <EtherealSpotlight mouseX={mouseX} mouseY={mouseY} />}

        <motion.div
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: "rgba(2, 0, 16, 0.9)",
            opacity: maskOpacity,
            willChange: "opacity",
          }}
        />
        <div className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-t from-black/50 to-transparent" />
      </motion.div>
    </motion.div>
  )
}
