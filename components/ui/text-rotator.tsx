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

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, interval)

    return () => clearInterval(timer)
  }, [words, interval])

  if (!words.length) return null

  const glowStyle = glowEffect ? {
    color: glowColor,
    textShadow: `
      0 0 ${20 * glowIntensity}px ${glowColor},
      0 0 ${40 * glowIntensity}px ${glowColor},
      0 0 ${60 * glowIntensity}px ${glowColor},
      0 0 ${80 * glowIntensity}px ${glowColor}
    `,
    filter: `brightness(${1 + 0.2 * glowIntensity})`
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