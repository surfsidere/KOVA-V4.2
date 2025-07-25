"use client"

import { useEffect } from 'react'
import { initializeKOVASystem } from '@/lib'

export function SystemInitializer() {
  useEffect(() => {
    // Initialize the KOVA system
    initializeKOVASystem({
      environment: process.env.NODE_ENV as any || 'development',
      features: {
        debug: process.env.NODE_ENV === 'development',
        analytics: process.env.NODE_ENV === 'production',
        testing: true,
        accessibility: true,
        performance: true
      },
      security: {
        enableCSP: true,
        enableCORS: true,
        rateLimit: 1000
      },
      performance: {
        maxConcurrentAnimations: 25,
        memoryThreshold: 100,
        fpsTarget: 60
      }
    }).catch(error => {
      console.error('Failed to initialize KOVA system:', error)
    })
  }, [])

  return null // This component doesn't render anything
}