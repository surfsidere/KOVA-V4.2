"use client"

import type React from "react"
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { CelestialArc } from "./celestial-arc"
import { EtherealSpotlight } from "./ethereal-spotlight"

const arcConfigurations = [
  { delay: 0, scale: 1.2, opacity: 0.3, zIndex: 10, parallaxStrength: -15 },
  { delay: 0.3, scale: 1.0, opacity: 0.5, zIndex: 20, parallaxStrength: -8 },
  { delay: 0.6, scale: 0.8, opacity: 0.7, zIndex: 30, parallaxStrength: -3 },
  { delay: 0.9, scale: 0.6, opacity: 0.4, zIndex: 40, parallaxStrength: 5 },
]

const springConfig = { stiffness: 100, damping: 20, mass: 0.5 }

export const EtherealDepth: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.5]), springConfig)
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, -200]), springConfig)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]), springConfig)
  const maskOpacity = useSpring(useTransform(scrollYProgress, [0.8, 1], [0, 1]), springConfig)

  const spotlightBackground = useTransform<number[], string>(
    [mouseX, mouseY],
    ([latestX, latestY]) =>
      `radial-gradient(circle at ${latestX}px ${latestY}px, rgba(59, 130, 246, 0.1) 0%, transparent 300px)`,
  )

  useEffect(() => {
    setIsLoaded(true)
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
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
        willChange: "transform, opacity",
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
          <CelestialArc key={config.zIndex} mouseX={mouseX} mouseY={mouseY} {...config} />
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
