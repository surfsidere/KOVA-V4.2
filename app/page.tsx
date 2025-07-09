import { EtherealDepth } from "@/components/ui/ethereal-depth"

export default function Home() {
  return (
    <main className="relative bg-[#020010]">
      <EtherealDepth />
      <div className="relative z-10 h-[200vh] text-white">
        <div className="h-screen flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-6xl font-thin text-white/90 mb-4 tracking-wider">ETHEREAL DEPTH</h1>
            <p className="text-xl text-blue-200/70 font-light tracking-wide">Navigate the cosmic void</p>
          </div>
        </div>
        <div className="h-screen flex items-center justify-center pointer-events-none">
          <h2 className="text-4xl font-thin text-white/80">Scroll to explore</h2>
        </div>
      </div>
    </main>
  )
}
