"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationCoordinator } from '@/hooks/use-animation-coordinator'
import { useSection } from '@/providers/SectionProvider'
import { useLenisScroll } from '@/hooks/use-lenis-scroll'
import { cn } from '@/lib/utils'

interface AnimationDebuggerProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showInactive?: boolean;
  maxItems?: number;
}

interface AnimationInfo {
  id: string;
  type: string;
  isActive: boolean;
  lastUpdate: number;
  sectionId?: string;
  properties: Record<string, any>;
}

export const AnimationDebugger: React.FC<AnimationDebuggerProps> = ({
  className,
  position = 'bottom-left',
  showInactive = false,
  maxItems = 10,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'section'>('activity')
  
  const { animations, activeAnimations, removeAnimation } = useAnimationCoordinator()
  const { sections, activeSection } = useSection()
  const { progress, velocity } = useLenisScroll()
  
  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ENABLE_ANIMATION_DEBUGGER) {
    return null
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }
  
  // Process animations for display
  const processedAnimations: AnimationInfo[] = animations.map(animation => ({
    id: animation.id,
    type: animation.type,
    isActive: animation.isActive,
    lastUpdate: animation.lastUpdate,
    sectionId: findAnimationSection(animation.id),
    properties: animation.properties,
  }))
  
  function findAnimationSection(animationId: string): string | undefined {
    for (const [sectionId, section] of sections) {
      if (section.animations.some(anim => anim.id === animationId)) {
        return sectionId
      }
    }
    return undefined
  }
  
  // Filter animations
  const filteredAnimations = processedAnimations.filter(animation => {
    if (filter === 'active') return animation.isActive
    if (filter === 'inactive') return !animation.isActive
    return true
  })
  
  // Sort animations
  const sortedAnimations = [...filteredAnimations].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.id.localeCompare(b.id)
      case 'activity':
        if (a.isActive && !b.isActive) return -1
        if (!a.isActive && b.isActive) return 1
        return b.lastUpdate - a.lastUpdate
      case 'section':
        const aSectionId = a.sectionId || 'zzz'
        const bSectionId = b.sectionId || 'zzz'
        return aSectionId.localeCompare(bSectionId)
      default:
        return 0
    }
  }).slice(0, maxItems)
  
  const getAnimationAge = (lastUpdate: number) => {
    const age = Date.now() - lastUpdate
    if (age < 1000) return `${age}ms`
    if (age < 60000) return `${(age / 1000).toFixed(1)}s`
    return `${(age / 60000).toFixed(1)}m`
  }
  
  const getAnimationColor = (animation: AnimationInfo) => {
    if (animation.isActive) {
      if (animation.sectionId === activeSection) return 'text-green-400'
      return 'text-blue-400'
    }
    return 'text-gray-500'
  }
  
  const totalMemoryEstimate = animations.length * 0.1 // Rough estimate in KB
  
  return (
    <motion.div
      className={cn(
        'fixed z-[9998] select-none max-w-sm',
        positionClasses[position],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
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
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="font-semibold">Animations</span>
            <span className="text-purple-400 font-bold">
              {activeAnimations.length}/{animations.length}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ↓
          </motion.div>
        </div>

        {/* Collapsed Summary */}
        {!isExpanded && (
          <div className="px-2 pb-2 space-y-1">
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="text-green-400">{activeAnimations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span>{totalMemoryEstimate.toFixed(1)}KB</span>
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
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {(['all', 'active', 'inactive'] as const).map(filterType => (
                      <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={cn(
                          'px-2 py-1 rounded text-xs transition-colors capitalize',
                          filter === filterType 
                            ? 'bg-purple-500/30 text-purple-300' 
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        )}
                      >
                        {filterType}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    {(['activity', 'name', 'section'] as const).map(sortType => (
                      <button
                        key={sortType}
                        onClick={() => setSortBy(sortType)}
                        className={cn(
                          'px-2 py-1 rounded text-xs transition-colors capitalize',
                          sortBy === sortType 
                            ? 'bg-blue-500/30 text-blue-300' 
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        )}
                      >
                        {sortType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1 border-t border-white/10 pt-2">
                  <div className="flex justify-between">
                    <span>Total Animations:</span>
                    <span>{animations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="text-green-400">{activeAnimations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive:</span>
                    <span className="text-gray-400">{animations.length - activeAnimations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Est:</span>
                    <span>{totalMemoryEstimate.toFixed(1)}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scroll Progress:</span>
                    <span>{(progress * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Velocity:</span>
                    <span>{velocity.get().toFixed(1)}</span>
                  </div>
                </div>

                {/* Animation List */}
                <div className="border-t border-white/10 pt-2">
                  <div className="text-xs font-semibold text-gray-400 mb-2">
                    Animation List ({sortedAnimations.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {sortedAnimations.map((animation, index) => (
                      <motion.div
                        key={animation.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className={cn('font-semibold truncate', getAnimationColor(animation))}>
                            {animation.id}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="capitalize">{animation.type}</span>
                            {animation.sectionId && (
                              <span className={cn(
                                'px-1 rounded',
                                animation.sectionId === activeSection 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              )}>
                                {animation.sectionId}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            {getAnimationAge(animation.lastUpdate)}
                          </div>
                          <button
                            onClick={() => removeAnimation(animation.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                            title="Remove animation"
                          >
                            ×
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {sortedAnimations.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        No animations found
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-white/10 pt-2">
                  <div className="text-xs font-semibold text-gray-400 mb-1">Quick Actions</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        animations.filter(a => !a.isActive).forEach(a => removeAnimation(a.id))
                      }}
                      className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Clear Inactive
                    </button>
                    <button
                      onClick={() => {
                        console.log('Animation Debug Data:', {
                          animations: animations.map(a => ({
                            id: a.id,
                            type: a.type,
                            isActive: a.isActive,
                            properties: a.properties,
                          })),
                          sections: Array.from(sections.entries()),
                          activeSection,
                          progress,
                          velocity,
                        })
                      }}
                      className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      Log Data
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default AnimationDebugger