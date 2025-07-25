"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TextRotatorProps {
  words: string[]
  interval?: number
  className?: string
  prefix?: string
  suffix?: string
  glowEffect?: boolean
  glowColor?: string
  glowIntensity?: number
}

export const TextRotator: React.FC<TextRotatorProps> = ({
  words,
  interval = 3000,
  className = "",
  prefix = "",
  suffix = "",
  glowEffect = false,
  glowColor = "#FFF9E1",
  glowIntensity = 1
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return

    // Reset index when words change
    setCurrentIndex(0)

    let timer: NodeJS.Timeout | null = null
    
    try {
      timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
      }, interval)
    } catch (error) {
      console.warn('Text rotation timer error:', error)
    }

    return () => {
      if (timer) {
        try {
          clearInterval(timer)
        } catch (error) {
          console.warn('Error clearing text rotation timer:', error)
        }
      }
    }
  }, [words, interval])

  if (!words.length) return null

  const glowStyle = glowEffect ? {
    // Force solid pale yellow text color with high specificity
    color: `${glowColor} !important`,
    // Ensure no transparency
    opacity: '1 !important',
    // Remove any background clipping that might cause outline effect
    backgroundClip: 'initial !important',
    WebkitBackgroundClip: 'initial !important',
    // Solid glow effect with layered shadows
    textShadow: `
      0 0 ${4 * glowIntensity}px ${glowColor},
      0 0 ${8 * glowIntensity}px ${glowColor},
      0 0 ${12 * glowIntensity}px ${glowColor}E6,
      0 0 ${16 * glowIntensity}px ${glowColor}CC,
      0 0 ${20 * glowIntensity}px ${glowColor}99,
      0 0 ${24 * glowIntensity}px ${glowColor}66
    `,
    // Enhanced glow with filter effects
    filter: `brightness(${1 + 0.2 * glowIntensity}) saturate(${1 + 0.15 * glowIntensity}) drop-shadow(0 0 ${6 * glowIntensity}px ${glowColor}80)`,
    fontWeight: '300',
    // Ensure solid text rendering
    WebkitTextFillColor: glowColor,
    WebkitTextStroke: 'initial'
  } : {}

  return (
    <span className={`inline-block ${className}`}>
      {prefix}
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="inline-block"
          style={glowStyle}
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
      {suffix}
    </span>
  )
}