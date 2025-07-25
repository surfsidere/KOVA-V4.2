"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAnimationCoordinator } from './use-animation-coordinator'

interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  frameTime: number;
  animationCount: number;
  activeAnimations: number;
  memoryUsage: number;
  memoryLimit: number;
  cpuCores: number;
  isLowEndDevice: boolean;
  batteryLevel?: number;
  connectionType?: string;
  timestamp: number;
}

interface PerformanceThresholds {
  minFps: number;
  maxAnimations: number;
  maxMemoryMB: number;
  warningMemoryMB: number;
}

interface PerformanceAlert {
  type: 'fps' | 'memory' | 'animations' | 'battery';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFps: 55,
  maxAnimations: 25,
  maxMemoryMB: 100,
  warningMemoryMB: 75,
}

export function usePerformanceMonitor(
  thresholds: Partial<PerformanceThresholds> = {},
  enableAlerts: boolean = true
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    averageFps: 60,
    frameTime: 16.67,
    animationCount: 0,
    activeAnimations: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    cpuCores: 1,
    isLowEndDevice: false,
    timestamp: Date.now(),
  })
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const fpsHistoryRef = useRef<number[]>([])
  const rafIdRef = useRef<number>()
  
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  
  const { animations, activeAnimations } = useAnimationCoordinator()
  
  // Device capability detection
  const detectDeviceCapabilities = useCallback((): {
    memoryLimit: number;
    cpuCores: number;
    isLowEndDevice: boolean;
  } => {
    const memory = (navigator as any).deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const connection = (navigator as any).connection
    
    const isLowEnd = (
      memory < 4 ||
      cores < 4 ||
      (connection && ['slow-2g', '2g', '3g'].includes(connection.effectiveType))
    )
    
    return {
      memoryLimit: memory * 1024, // Convert GB to MB
      cpuCores: cores,
      isLowEndDevice: isLowEnd,
    }
  }, [])
  
  // Get battery information
  const getBatteryInfo = useCallback(async (): Promise<number | undefined> => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery()
        return battery.level
      }
    } catch (error) {
      // Battery API not available
    }
    return undefined
  }, [])
  
  // Get connection information
  const getConnectionInfo = useCallback((): string | undefined => {
    const connection = (navigator as any).connection
    return connection?.effectiveType
  }, [])
  
  // Create performance alert
  const createAlert = useCallback((
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ) => {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now(),
    }
    
    setAlerts(prev => [...prev.slice(-9), alert]) // Keep last 10 alerts
    
    if (enableAlerts) {
      console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]:`, message, {
        value,
        threshold,
        type,
      })
    }
  }, [enableAlerts])
  
  // Check performance thresholds
  const checkThresholds = useCallback((currentMetrics: PerformanceMetrics) => {
    // FPS threshold
    if (currentMetrics.fps < finalThresholds.minFps) {
      const severity = currentMetrics.fps < 45 ? 'high' : 
                     currentMetrics.fps < 50 ? 'medium' : 'low'
      createAlert(
        'fps',
        severity,
        `Low FPS detected: ${currentMetrics.fps}fps`,
        currentMetrics.fps,
        finalThresholds.minFps
      )
    }
    
    // Memory threshold
    const memoryMB = currentMetrics.memoryUsage / 1024 / 1024
    if (memoryMB > finalThresholds.warningMemoryMB) {
      const severity = memoryMB > finalThresholds.maxMemoryMB ? 'high' : 'medium'
      createAlert(
        'memory',
        severity,
        `High memory usage: ${memoryMB.toFixed(1)}MB`,
        memoryMB,
        finalThresholds.warningMemoryMB
      )
    }
    
    // Animation count threshold
    if (currentMetrics.activeAnimations > finalThresholds.maxAnimations) {
      const severity = currentMetrics.activeAnimations > finalThresholds.maxAnimations * 1.5 ? 'high' : 'medium'
      createAlert(
        'animations',
        severity,
        `Too many active animations: ${currentMetrics.activeAnimations}`,
        currentMetrics.activeAnimations,
        finalThresholds.maxAnimations
      )
    }
    
    // Battery threshold (if available)
    if (currentMetrics.batteryLevel && currentMetrics.batteryLevel < 0.2) {
      createAlert(
        'battery',
        'medium',
        `Low battery: ${Math.round(currentMetrics.batteryLevel * 100)}%`,
        currentMetrics.batteryLevel * 100,
        20
      )
    }
  }, [finalThresholds, createAlert])
  
  // Performance monitoring RAF loop
  const monitorPerformance = useCallback(() => {
    const now = performance.now()
    frameCountRef.current++
    
    // Calculate FPS every second
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      const frameTime = (now - lastTimeRef.current) / frameCountRef.current
      
      // Update FPS history for average calculation
      fpsHistoryRef.current.push(fps)
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift()
      }
      
      const averageFps = Math.round(
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
      )
      
      // Get memory usage
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0
      
      // Get device capabilities
      const deviceInfo = detectDeviceCapabilities()
      
      // Create metrics object
      const newMetrics: PerformanceMetrics = {
        fps,
        averageFps,
        frameTime,
        animationCount: animations.length,
        activeAnimations: activeAnimations.length,
        memoryUsage,
        memoryLimit: deviceInfo.memoryLimit,
        cpuCores: deviceInfo.cpuCores,
        isLowEndDevice: deviceInfo.isLowEndDevice,
        connectionType: getConnectionInfo(),
        timestamp: now,
      }
      
      // Get battery info asynchronously
      getBatteryInfo().then(batteryLevel => {
        if (batteryLevel !== undefined) {
          newMetrics.batteryLevel = batteryLevel
        }
        
        setMetrics(newMetrics)
        checkThresholds(newMetrics)
      })
      
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
    
    if (isMonitoring) {
      rafIdRef.current = requestAnimationFrame(monitorPerformance)
    }
  }, [isMonitoring, animations, activeAnimations, detectDeviceCapabilities, getBatteryInfo, getConnectionInfo, checkThresholds])
  
  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true)
      frameCountRef.current = 0
      lastTimeRef.current = performance.now()
      fpsHistoryRef.current = []
    }
  }, [isMonitoring])
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [])
  
  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])
  
  // Get performance recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = []
    
    if (metrics.fps < finalThresholds.minFps) {
      recommendations.push('Consider reducing animation complexity or enabling performance mode')
    }
    
    if (metrics.activeAnimations > finalThresholds.maxAnimations) {
      recommendations.push('Too many active animations - consider animation culling')
    }
    
    const memoryMB = metrics.memoryUsage / 1024 / 1024
    if (memoryMB > finalThresholds.warningMemoryMB) {
      recommendations.push('High memory usage - enable automatic cleanup')
    }
    
    if (metrics.isLowEndDevice) {
      recommendations.push('Low-end device detected - consider battery performance mode')
    }
    
    if (metrics.batteryLevel && metrics.batteryLevel < 0.3) {
      recommendations.push('Low battery - consider reducing animation frequency')
    }
    
    return recommendations
  }, [metrics, finalThresholds])
  
  // Performance score calculation
  const getPerformanceScore = useCallback((): number => {
    let score = 100
    
    // FPS penalty
    const fpsPenalty = Math.max(0, (finalThresholds.minFps - metrics.fps) * 2)
    score -= fpsPenalty
    
    // Memory penalty
    const memoryMB = metrics.memoryUsage / 1024 / 1024
    const memoryPenalty = Math.max(0, (memoryMB - finalThresholds.warningMemoryMB) * 2)
    score -= memoryPenalty
    
    // Animation penalty
    const animationPenalty = Math.max(0, (metrics.activeAnimations - finalThresholds.maxAnimations))
    score -= animationPenalty
    
    return Math.max(0, Math.min(100, score))
  }, [metrics, finalThresholds])
  
  // Auto-start monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startMonitoring()
    }
    
    return () => {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring])
  
  // Monitor RAF loop
  useEffect(() => {
    if (isMonitoring) {
      rafIdRef.current = requestAnimationFrame(monitorPerformance)
    }
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isMonitoring, monitorPerformance])
  
  return {
    // Current metrics
    metrics,
    
    // Alerts
    alerts,
    clearAlerts,
    
    // Control
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    
    // Analysis
    getRecommendations,
    getPerformanceScore,
    
    // Thresholds
    thresholds: finalThresholds,
  }
}