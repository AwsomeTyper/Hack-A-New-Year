'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Brand/Mission */}
          <div className="max-w-md">
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E31937]"></span>
              Project Aegis
            </h4>
            <p className="text-sm text-[#5A5B5D] leading-relaxed mb-4">
              A strategic analytics platform designed to protect higher education institutions from the 2026 Demographic Cliff. Providing data-driven foresight for institutional survival.
            </p>
            <p className="text-xs text-[#5A5B5D]">
              &copy; {new Date().getFullYear()} CGI. All rights reserved.
            </p>
          </div>
          
          {/* Links/Resources */}
          <div className="flex flex-col md:items-end justify-center">
             <div className="flex gap-6 text-sm text-[#5A5B5D]">
                <Link href="/documentation" className="hover:text-white transition-colors">Documentation</Link>
                <a href="#" className="hover:text-white transition-colors">Methodology</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
             </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5A5B5D]">
          <div className="flex items-center gap-2">
            <span>Data sourced from</span>
            <a 
              href="https://catalog.data.gov/dataset/college-scorecard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#005288] hover:text-blue-400 transition-colors font-medium"
            >
              U.S. Department of Education
            </a>
          </div>
          <p>
            Built with <span className="text-[#E31937]">♥</span> for the CGI Business Analytics Competition
          </p>
        </div>
      </div>
    </footer>
  );
}
