'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Brand/Mission */}
          <div className="max-w-md">
            <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]"></span>
              Project Aegis
            </h4>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
              A strategic analytics platform designed to maximize the Return on Investment of the $30B Pell Grant program. Providing data-driven foresight for federal student aid policy.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} Project Aegis Analytics
            </p>
          </div>
          
          {/* Links/Resources */}
          <div className="flex flex-col md:items-end justify-center">
             <div className="flex gap-6 text-sm text-[var(--text-muted)]">
                <Link href="/documentation" className="hover:text-[var(--text-primary)] transition-colors">Documentation</Link>
                <Link href="/documentation" className="hover:text-[var(--text-primary)] transition-colors">Methodology</Link>
                <a href="mailto:support@projectaegis.edu" className="hover:text-[var(--text-primary)] transition-colors">Support</a>
             </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span>Data sourced from</span>
            <a 
              href="https://catalog.data.gov/dataset/college-scorecard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--accent-blue)] hover:text-blue-400 transition-colors font-medium"
            >
              U.S. Department of Education
            </a>
          </div>
          <p>
            Built with <span className="text-[var(--accent-red)]">♥</span> for the CGI Business Analytics Competition
          </p>
        </div>
      </div>
    </footer>
  );
}
