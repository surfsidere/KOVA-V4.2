"use client"

import React, { useMemo } from "react"
import { type MotionValue, motion, useSpring, useTransform } from "framer-motion"

interface CelestialArcProps {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  delay: number
  scale: number
  opacity: number
  zIndex: number
  parallaxStrength: number
  prefersReducedMotion?: boolean
}

// Optimized spring config for better performance
const springConfig = { stiffness: 120, damping: 25, mass: 0.8, restSpeed: 0.01 }

export const CelestialArc: React.FC<CelestialArcProps> = ({
  mouseX,
  mouseY,
  delay,
  scale,
  opacity,
  zIndex,
  parallaxStrength,
  prefersReducedMotion = false,
}) => {
  // Memoized transform functions for better performance
  const transformX = useMemo(() => (val: number) => {
    if (typeof window === "undefined") return 0
    return (val / window.innerWidth - 0.5) * 2 * parallaxStrength
  }, [parallaxStrength])
  
  const transformY = useMemo(() => (val: number) => {
    if (typeof window === "undefined") return 0
    return (val / window.innerHeight - 0.5) * 2 * parallaxStrength
  }, [parallaxStrength])

  const transformedX = useTransform(mouseX, transformX)
  const transformedY = useTransform(mouseY, transformY)

  const x = useSpring(transformedX, springConfig)
  const y = useSpring(transformedY, springConfig)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        x,
        y,
        zIndex,
        transform: `scale3d(${scale}, ${scale}, 1)`,
        willChange: "transform",
        backfaceVisibility: "hidden",
        perspective: 1000,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity, scale }}
      transition={{ delay, duration: 2, ease: "easeOut" }}
    >
      {/* Gradient layers remain the same as they are visually correct */}
      <motion.div
        className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 75% 25%, rgba(30, 58, 138, 0.5) 0%, rgba(59, 130, 246, 0.3) 25%, rgba(37, 99, 235, 0.2) 50%, transparent 70%)`,
        }}
        animate={{
          background: [
            `radial-gradient(ellipse 80% 60% at 75% 25%, rgba(30, 58, 138, 0.5) 0%, rgba(59, 130, 246, 0.3) 25%, rgba(37, 99, 235, 0.2) 50%, transparent 70%)`,
            `radial-gradient(ellipse 82% 62% at 76% 26%, rgba(30, 58, 138, 0.55) 0%, rgba(59, 130, 246, 0.35) 25%, rgba(37, 99, 235, 0.25) 50%, transparent 70%)`,
            `radial-gradient(ellipse 80% 60% at 75% 25%, rgba(30, 58, 138, 0.5) 0%, rgba(59, 130, 246, 0.3) 25%, rgba(37, 99, 235, 0.2) 50%, transparent 70%)`,
          ],
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 8, 
          repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY, 
          ease: "easeInOut" 
        }}
      />
      <motion.div
        className="absolute w-[180%] h-[180%] -top-1/2 -left-1/2"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 70% 30%, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.4) 30%, transparent 60%)`,
        }}
        animate={{
          background: [
            `radial-gradient(ellipse 70% 50% at 70% 30%, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.4) 30%, transparent 60%)`,
            `radial-gradient(ellipse 72% 52% at 71% 31%, rgba(59, 130, 246, 0.65) 0%, rgba(37, 99, 235, 0.45) 30%, transparent 60%)`,
            `radial-gradient(ellipse 70% 50% at 70% 30%, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.4) 30%, transparent 60%)`,
          ],
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 7, 
          repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY, 
          ease: "easeInOut" 
        }}
      />
      <motion.div
        className="absolute w-[160%] h-[160%] -top-1/2 -left-1/2"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 65% 35%, rgba(96, 165, 250, 0.7) 0%, rgba(59, 130, 246, 0.5) 25%, transparent 50%)`,
        }}
        animate={{
          background: [
            `radial-gradient(ellipse 60% 40% at 65% 35%, rgba(96, 165, 250, 0.7) 0%, rgba(59, 130, 246, 0.5) 25%, transparent 50%)`,
            `radial-gradient(ellipse 62% 42% at 66% 36%, rgba(96, 165, 250, 0.75) 0%, rgba(59, 130, 246, 0.55) 25%, transparent 50%)`,
            `radial-gradient(ellipse 60% 40% at 65% 35%, rgba(96, 165, 250, 0.7) 0%, rgba(59, 130, 246, 0.5) 25%, transparent 50%)`,
          ],
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 6, 
          repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY, 
          ease: "easeInOut" 
        }}
      />
    </motion.div>
  )
}
