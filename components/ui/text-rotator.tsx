"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TextRotatorProps {
  words: string[]
  interval?: number
  className?: string
  prefix?: string
  suffix?: string
}

export const TextRotator: React.FC<TextRotatorProps> = ({
  words,
  interval = 3000,
  className = "",
  prefix = "",
  suffix = ""
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

  return (
    <span className={`inline-block ${className}`}>
      {prefix}
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="inline-block"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
      {suffix}
    </span>
  )
}