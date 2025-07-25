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
    color: glowColor,
    opacity: 0.8,
    textShadow: `
      0 0 ${15 * glowIntensity}px ${glowColor}99,
      0 0 ${30 * glowIntensity}px ${glowColor}66,
      0 0 ${45 * glowIntensity}px ${glowColor}33,
      0 0 ${60 * glowIntensity}px ${glowColor}1A
    `,
    filter: `brightness(${1 + 0.1 * glowIntensity})`,
    background: `radial-gradient(ellipse at center, ${glowColor}1A 0%, transparent 70%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text'
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