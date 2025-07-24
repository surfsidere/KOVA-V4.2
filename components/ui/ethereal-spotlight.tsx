"use client"

import type React from "react"
import { type MotionValue, motion } from "framer-motion"

interface EtherealSpotlightProps {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}

export const EtherealSpotlight: React.FC<EtherealSpotlightProps> = ({ mouseX, mouseY }) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        // Use motion values directly for transform for max performance
        translateX: mouseX,
        translateY: mouseY,
        // Offset by -50% to center the spotlight on the cursor
        x: "-50%",
        y: "-50%",
        transform: "translate3d(0, 0, 0)",
        width: 400,
        height: 400,
        background: `radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, rgba(59, 130, 246, 0.08) 25%, transparent 60%)`,
        borderRadius: "50%",
        filter: "blur(1px)",
        mixBlendMode: "screen",
        zIndex: 50,
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  )
}
