'use client';

interface HeaderProps {
  usingDemo?: boolean;
}

export default function Header({ usingDemo = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0b0d]/95 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-[#E31937] to-[#b01229] rounded-lg flex items-center justify-center shadow-lg shadow-[#E31937]/20">
                <span className="text-white font-bold text-sm tracking-tight">A</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-2 border-[#0a0b0d]"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold text-white tracking-tight leading-tight">Project Aegis</h1>
              <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Resilience Analytics</p>
            </div>
          </div>

          {/* Center: Navigation (optional placeholder) */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="#" className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Dashboard</a>
            <a href="/documentation" className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Documentation</a>
          </nav>
          
          {/* Right: Status */}
          <div className="flex items-center gap-3">
            {usingDemo && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold uppercase tracking-wider">
                Demo
              </span>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Data</span>
            </div>
          </div>
          
        </div>
      </div>
    </header>
  );
}
