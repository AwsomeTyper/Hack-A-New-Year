'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-void)]/90 backdrop-blur-lg border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-14 h-14">
            <Image 
              src="/logo-transparent.png" 
              alt="Project Aegis Logo" 
              fill
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-[var(--text-primary)]" style={{ fontSize: '24px' }}>Project Aegis</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/documentation" 
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Documentation
          </Link>
        </nav>
      </div>
    </header>
  );
}
