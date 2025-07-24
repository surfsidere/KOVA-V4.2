import { EtherealDepth } from "@/components/ui/ethereal-depth"
import { HeroSection } from "@/components/ui/hero-section"
import { ErrorBoundary } from "@/components/ui/error-boundary"

export default function Home() {
  return (
    <main className="relative bg-[#020010]">
      <ErrorBoundary>
        <EtherealDepth />
      </ErrorBoundary>
      <div className="relative z-10">
        <ErrorBoundary>
          <HeroSection language="es" />
        </ErrorBoundary>
        <div className="h-screen flex items-center justify-center pointer-events-none">
          <h2 className="text-4xl font-thin text-white/80">Scroll to explore</h2>
        </div>
      </div>
    </main>
  )
}
