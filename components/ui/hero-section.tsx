"use client"

import React from "react"
import { motion } from "framer-motion"
import { TextRotator } from "./text-rotator"

interface HeroSectionProps {
  language?: 'es' | 'en'
}

const heroContent = {
  es: {
    titlePrefix: "La nueva generación de beneficios:",
    dynamicWords: ["relevantes.", "digitales.", "personalizados."],
    introduction: "El futuro de la lealtad es la personalización: nuestra plataforma une a bancos, fintechs y programas de lealtad con las marcas digitales líderes, usando 20 años de experiencia para construir un ecosistema donde cada usuario elige su propia definición de valor.",
    opportunityTitle: "La Oportunidad:",
    opportunityText: "Las asistencias tradicionales se han quedado atrás. Sus ofertas genéricas y procesos confusos no generan valor ni conexión, perdiendo relevancia frente a las necesidades del usuario moderno.",
    solutionTitle: "La Solución:",
    solutionText: "Más conexión. Más uso. Más valor."
  },
  en: {
    titlePrefix: "The New Era of Loyalty Is",
    dynamicWords: ["relevant.", "digital.", "personalized."],
    introduction: "The future of loyalty is a choice. Our platform connects banks, fintechs, and loyalty programs with leading digital brands, building on 20 years of experience to create an ecosystem where every user defines what value means to them.",
    opportunityTitle: "The Opportunity:",
    opportunityText: "The old model of loyalty is broken. Traditional assistance programs with their generic offers and confusing processes no longer create connection, losing all relevance to the modern user.",
    solutionTitle: "The Solution:",
    solutionText: "More Connection. More Engagement. More Value."
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export const HeroSection: React.FC<HeroSectionProps> = ({ language = 'es' }) => {
  const content = heroContent[language]

  return (
    <section className="relative min-h-screen flex items-center justify-center text-white z-10">
      <motion.div
        className="max-w-6xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Main Title with Dynamic Text */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-thin tracking-wide leading-tight">
            <span className="text-white/90 block mb-4">
              {content.titlePrefix}
            </span>
            <TextRotator
              words={content.dynamicWords}
              interval={3000}
              className="font-light"
              glowEffect={true}
              glowColor="#FFFACD"
              glowIntensity={0.8}
            />
          </h1>
        </motion.div>

        {/* Introduction */}
        <motion.div
          className="mb-16"
          variants={itemVariants}
        >
          <p className="text-lg md:text-xl lg:text-2xl text-blue-200/80 font-light leading-relaxed max-w-5xl mx-auto">
            {content.introduction}
          </p>
        </motion.div>

        {/* Opportunity and Solution Grid */}
        <motion.div
          className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto"
          variants={itemVariants}
        >
          {/* The Opportunity */}
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-medium text-white/90 mb-4 tracking-wide">
              {content.opportunityTitle}
            </h2>
            <p className="text-base md:text-lg text-white/70 leading-relaxed">
              {content.opportunityText}
            </p>
          </div>

          {/* The Solution */}
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-medium text-white/90 mb-4 tracking-wide">
              {content.solutionTitle}
            </h2>
            <p className="text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 font-medium leading-relaxed">
              {content.solutionText}
            </p>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          variants={itemVariants}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="text-sm text-white/50 font-light tracking-wider">
              {language === 'es' ? 'Desplázate para explorar' : 'Scroll to explore'}
            </div>
            <motion.div
              className="w-0.5 h-8 bg-gradient-to-b from-blue-400 to-transparent"
              animate={{ scaleY: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}