import { EtherealDepth } from "@/components/ui/ethereal-depth"
import { HeroSection } from "@/components/ui/hero-section"
import { CodeSandboxErrorBoundary } from "@/components/ui/codesandbox-error-boundary"

export default function Home() {
  return (
    <main className="relative bg-[#020010]">
      <CodeSandboxErrorBoundary>
        <EtherealDepth />
      </CodeSandboxErrorBoundary>
      <div className="relative z-10">
        <CodeSandboxErrorBoundary>
          <HeroSection language="es" />
        </CodeSandboxErrorBoundary>
        <div className="h-screen flex items-center justify-center pointer-events-none">
          <h2 className="text-4xl font-thin text-white/80">Scroll to explore</h2>
        </div>
      </div>
    </main>
  )
}
