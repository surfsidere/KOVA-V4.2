"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { cn } from '@/lib/utils'

interface PerformanceMonitorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className,
  position = 'top-right',
  compact = false,
  showAlerts = true,
  showRecommendations = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const {
    metrics,
    alerts,
    clearAlerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getRecommendations,
    getPerformanceScore,
    thresholds,
  } = usePerformanceMonitor()
  
  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITOR) {
    return null
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }
  
  const score = getPerformanceScore()
  const recommendations = getRecommendations()
  const recentAlerts = alerts.slice(-3)
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getFpsColor = (fps: number) => {
    if (fps >= thresholds.minFps) return 'text-green-400'
    if (fps >= 45) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(1)}MB`
  }
  
  const formatBattery = (level?: number) => {
    if (level === undefined) return 'N/A'
    return `${Math.round(level * 100)}%`
  }

  return (
    <motion.div
      className={cn(
        'fixed z-[9999] select-none',
        positionClasses[position],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Monitor Panel */}
      <motion.div
        className="bg-black/90 backdrop-blur-sm text-white rounded-lg border border-white/10 font-mono text-xs overflow-hidden"
        layout
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
            <span className="font-semibold">Performance</span>
            {!compact && (
              <span className={cn('font-bold', getScoreColor(score))}>
                {score.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {recentAlerts.length > 0 && showAlerts && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ↓
            </motion.div>
          </div>
        </div>

        {/* Compact View */}
        {!isExpanded && !compact && (
          <div className="px-2 pb-2 space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={getFpsColor(metrics.fps)}>{metrics.fps}</span>
            </div>
            <div className="flex justify-between">
              <span>Animations:</span>
              <span className={metrics.activeAnimations > thresholds.maxAnimations ? 'text-red-400' : 'text-green-400'}>
                {metrics.activeAnimations}/{metrics.animationCount}
              </span>
            </div>
          </div>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-3 border-t border-white/10">
                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
                    className={cn(
                      'px-2 py-1 rounded text-xs transition-colors',
                      isMonitoring 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    )}
                  >
                    {isMonitoring ? 'Stop' : 'Start'}
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    {showDetails ? 'Hide' : 'Details'}
                  </button>
                  {alerts.length > 0 && (
                    <button
                      onClick={clearAlerts}
                      className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Core Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Performance Score:</span>
                    <span className={cn('font-bold', getScoreColor(score))}>
                      {score.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex justify-between">
                      <span>FPS:</span>
                      <span className={getFpsColor(metrics.fps)}>{metrics.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg:</span>
                      <span className={getFpsColor(metrics.averageFps)}>{metrics.averageFps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Animations:</span>
                      <span className={metrics.activeAnimations > thresholds.maxAnimations ? 'text-red-400' : 'text-green-400'}>
                        {metrics.activeAnimations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{metrics.animationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className={
                        (metrics.memoryUsage / 1024 / 1024) > thresholds.warningMemoryMB ? 'text-red-400' : 'text-green-400'
                      }>
                        {formatMemory(metrics.memoryUsage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <span>{metrics.memoryLimit}MB</span>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 border-t border-white/10 pt-2"
                  >
                    <div className="text-xs font-semibold text-gray-400">Device Info</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="flex justify-between">
                        <span>CPU Cores:</span>
                        <span>{metrics.cpuCores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low-end:</span>
                        <span className={metrics.isLowEndDevice ? 'text-yellow-400' : 'text-green-400'}>
                          {metrics.isLowEndDevice ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery:</span>
                        <span className={
                          metrics.batteryLevel && metrics.batteryLevel < 0.2 ? 'text-red-400' : 'text-green-400'
                        }>
                          {formatBattery(metrics.batteryLevel)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span>{metrics.connectionType || 'N/A'}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent Alerts */}
                {showAlerts && recentAlerts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 border-t border-white/10 pt-2"
                  >
                    <div className="text-xs font-semibold text-red-400">Recent Alerts</div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {recentAlerts.map((alert, index) => (
                        <div key={index} className="text-xs">
                          <span className={cn(
                            'font-semibold',
                            alert.severity === 'high' ? 'text-red-400' :
                            alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                          )}>
                            [{alert.type.toUpperCase()}]
                          </span>
                          <span className="ml-1 text-gray-300">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Recommendations */}
                {showRecommendations && recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 border-t border-white/10 pt-2"
                  >
                    <div className="text-xs font-semibold text-blue-400">Recommendations</div>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="text-xs text-gray-300">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default PerformanceMonitor