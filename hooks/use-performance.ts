"use client"

import { useCallback, useEffect, useRef } from "react"

interface PerformanceMetrics {
  fps: number
  memory: number
  renderTime: number
}

export const usePerformance = () => {
  const metricsRef = useRef<PerformanceMetrics>({ fps: 0, memory: 0, renderTime: 0 })
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const isRunningRef = useRef(false)

  useEffect(() => {
    // Initialize only once
    if (typeof window === 'undefined' || isRunningRef.current) return
    
    lastTimeRef.current = performance.now()
    isRunningRef.current = true

    const measurePerformance = () => {
      if (!isRunningRef.current) return

      const now = performance.now()
      frameCountRef.current++

      // Calculate FPS every second
      if (now - lastTimeRef.current >= 1000) {
        metricsRef.current.fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      // Measure memory (if available) - throttle to avoid performance impact
      if ('memory' in performance && frameCountRef.current % 60 === 0) {
        const memoryInfo = (performance as any).memory
        metricsRef.current.memory = Math.round(memoryInfo.usedJSHeapSize / 1048576) // MB
      }

      // Simple render time approximation
      const renderStart = performance.now()
      setTimeout(() => {
        if (isRunningRef.current) {
          metricsRef.current.renderTime = performance.now() - renderStart
        }
      }, 0)

      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(measurePerformance)
      }
    }

    animationFrameRef.current = requestAnimationFrame(measurePerformance)

    return () => {
      isRunningRef.current = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, []) // Empty dependencies - run only once

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), [])

  return { getMetrics }
}