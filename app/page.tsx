import { EtherealDepth } from "@/components/ui/ethereal-depth"
import { HeroSection } from "@/components/ui/hero-section"
import { CodeSandboxErrorBoundary } from "@/components/ui/codesandbox-error-boundary"
import { ScrollSection } from "@/components/scroll/ScrollSection"
import { ScrollTrigger } from "@/components/scroll/ScrollTrigger"
import { ParallaxLayer } from "@/components/scroll/ParallaxLayer"
import { PerformanceMonitor } from "@/components/debug/PerformanceMonitor"
import { AnimationDebugger } from "@/components/debug/AnimationDebugger"
import { ZLayers } from "@/types/scroll.types"

export default function Home() {
  return (
    <main className="relative bg-[#020010]">
      {/* Background ethereal depth - always visible */}
      <CodeSandboxErrorBoundary>
        <EtherealDepth />
      </CodeSandboxErrorBoundary>
      
      {/* Hero Section - Elevated layer */}
      <ScrollSection
        id="hero"
        triggerStart={0}
        triggerEnd={0.3}
        layer={ZLayers.CONTENT_ELEVATED}
        contrast="dark"
        fadeEffect={true}
        onEnter={() => console.log('Hero section entered')}
        onLeave={() => console.log('Hero section left')}
        className="relative z-10"
      >
        <CodeSandboxErrorBoundary>
          <HeroSection language="es" />
        </CodeSandboxErrorBoundary>
      </ScrollSection>

      {/* Scroll to explore - with parallax */}
      <ScrollSection
        id="scroll-prompt"
        triggerStart={0.2}
        triggerEnd={0.5}
        layer={ZLayers.CONTENT_BASE}
        contrast="dark"
        fadeEffect={true}
        slideDirection="up"
        parallaxStrength={0.3}
        className="relative z-20"
      >
        <div className="h-screen flex items-center justify-center pointer-events-none">
          <ScrollTrigger
            start={0.25}
            end={0.45}
            fade={true}
            scale={{ from: 0.8, to: 1.2 }}
            rotate={{ from: -5, to: 5 }}
          >
            <h2 className="text-4xl font-thin text-white/80 text-center">
              Scroll to explore
            </h2>
          </ScrollTrigger>
        </div>
      </ScrollSection>

      {/* Demo content sections */}
      <ScrollSection
        id="section-1"
        triggerStart={0.4}
        triggerEnd={0.7}
        layer={ZLayers.CONTENT_ELEVATED}
        contrast="light"
        fadeEffect={true}
        scaleEffect={true}
        onProgress={(progress) => {
          if (progress > 0.5) {
            // Change background color or theme
          }
        }}
        className="relative z-30"
      >
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <ParallaxLayer speed={-0.2} direction="vertical">
            <div className="text-center p-8">
              <h2 className="text-6xl font-bold text-white mb-4">
                Immersive Experience
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Experience smooth Lenis animations combined with intelligent z-index management 
                and dynamic section transitions.
              </p>
            </div>
          </ParallaxLayer>
        </div>
      </ScrollSection>

      <ScrollSection
        id="section-2"
        triggerStart={0.6}
        triggerEnd={0.9}
        layer={ZLayers.CONTENT_BASE}
        contrast="dark"
        fadeEffect={true}
        slideDirection="left"
        parallaxStrength={-0.1}
        className="relative z-25"
      >
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-900/20 to-cyan-900/20">
          <ScrollTrigger
            start={0.65}
            end={0.85}
            animation={{
              from: { opacity: 0, scale: 0.5, rotateY: -90 },
              to: { opacity: 1, scale: 1, rotateY: 0 }
            }}
            scrub={true}
          >
            <div className="text-center p-8">
              <h2 className="text-6xl font-bold text-white mb-4">
                Advanced Parallax
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Multi-layered parallax effects with performance optimization and 
                reduced motion support for accessibility.
              </p>
            </div>
          </ScrollTrigger>
        </div>
      </ScrollSection>

      <ScrollSection
        id="section-3"
        triggerStart={0.8}
        triggerEnd={1.0}
        layer={ZLayers.CONTENT_ELEVATED}
        contrast="light"
        fadeEffect={true}
        scaleEffect={true}
        onEnter={() => console.log('Final section reached')}
        className="relative z-40"
      >
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-rose-900/20 to-orange-900/20">
          <ParallaxLayer speed={0.3} direction="both" easing="spring">
            <div className="text-center p-8">
              <h2 className="text-6xl font-bold text-white mb-4">
                Dynamic Layers
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Intelligent z-index orchestration creates seamless narrative transitions 
                with changing contrast and immersive depth.
              </p>
              <ScrollTrigger
                start={0.85}
                end={0.95}
                scale={{ from: 0.8, to: 1.1 }}
                fade={true}
              >
                <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">
                  Explore More
                </button>
              </ScrollTrigger>
            </div>
          </ParallaxLayer>
        </div>
      </ScrollSection>

      {/* Debug Components - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <PerformanceMonitor 
            position="top-right"
            showAlerts={true}
            showRecommendations={true}
          />
          <AnimationDebugger 
            position="bottom-left"
            showInactive={true}
            maxItems={15}
          />
        </>
      )}
    </main>
  )
}
