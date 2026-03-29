'use client';

import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface HeroSectionProps {
  currentCoverage: number;
  historicalCoverage: number;
}

export default function HeroSection({ 
  currentCoverage = 25, 
  historicalCoverage = 61 
}: HeroSectionProps) {
  return (
    <section className="section-hero">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-void)]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px'
        }}
      />
      
      <div className="page-container relative z-10">


        
        {/* Main Crisis Stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <span className="text-hero stat-crisis">{historicalCoverage}%</span>
            <motion.span 
              className="text-4xl md:text-6xl text-[var(--text-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              →
            </motion.span>
            <span className="text-hero stat-crisis">{currentCoverage}%</span>
          </div>
        </motion.div>
        
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-headline text-[var(--text-secondary)] max-w-3xl mx-auto mb-6 text-center"
        >
          Pell Grant purchasing power has collapsed over 50 years<InfoTooltip text="The Pell Grant program began in 1972 as the Basic Educational Opportunity Grant. This analysis spans from 1973 to the most recent academic year using College Scorecard and NCES data. Coverage percentage is calculated as (Maximum Pell Grant ÷ Average Cost of Attendance at public 4-year institutions) × 100. Historical peak was in the mid-1970s." />
        </motion.h1>
        
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, x: "-50%" }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ 
          opacity: { delay: 1.2, duration: 0.6 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1.2 }
        }}
        className="scroll-indicator"
      >
        <span className="text-caption">Scroll to explore</span>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
}
