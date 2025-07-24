"use client"

import { useEffect, useState } from "react"
import { usePerformance } from "@/hooks/use-performance"

interface PerformanceMonitorProps {
  enabled?: boolean
}

export const PerformanceMonitor = ({ enabled = false }: PerformanceMonitorProps) => {
  const { getMetrics } = usePerformance()
  const [metrics, setMetrics] = useState({ fps: 0, memory: 0, renderTime: 0 })

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setMetrics(getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [enabled, getMetrics])

  if (!enabled) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/80 text-white p-3 rounded-lg text-sm font-mono">
      <div className="space-y-1">
        <div className={`${metrics.fps >= 55 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          FPS: {metrics.fps}
        </div>
        <div className={`${metrics.memory <= 50 ? 'text-green-400' : metrics.memory <= 100 ? 'text-yellow-400' : 'text-red-400'}`}>
          Memory: {metrics.memory}MB
        </div>
        <div className={`${metrics.renderTime <= 16 ? 'text-green-400' : metrics.renderTime <= 33 ? 'text-yellow-400' : 'text-red-400'}`}>
          Render: {metrics.renderTime.toFixed(1)}ms
        </div>
      </div>
    </div>
  )
}