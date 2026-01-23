'use client';

import { useState } from 'react';

interface HeaderProps {
  usingDemo?: boolean;
}

export default function Header({ usingDemo = false }: HeaderProps) {

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-black/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* CGI Logo Block */}
            <div className="w-12 h-12 bg-[#E31937] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(227,25,55,0.3)]">
              <span className="text-white font-bold text-lg tracking-tight">CGI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Project Aegis</h1>
              <p className="text-sm text-[#5A5B5D] font-medium">University Resilience Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {usingDemo && (
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/20 font-medium tracking-wide">
                DEMO MODE
              </span>
            )}
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <span className="text-sm text-[#5A5B5D] hidden sm:block font-medium">
              Data2Diamonds Analytics
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
