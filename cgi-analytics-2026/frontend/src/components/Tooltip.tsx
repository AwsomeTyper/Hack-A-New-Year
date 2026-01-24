'use client';

import { ReactNode, useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className="relative inline-flex items-center gap-1.5 cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <Info size={12} className="text-white/40 hover:text-white transition-colors" />
      
      {isVisible && (
        <div 
          className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-[#1a1b1f] border border-white/10 text-white text-xs p-4 rounded-xl shadow-2xl leading-relaxed pointer-events-none"
          style={{ whiteSpace: 'normal' }}
        >
          <div className="font-medium text-white/90">{content}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#1a1b1f]" />
        </div>
      )}
    </span>
  );
}
