'use client';

import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

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
      
      <div className="container relative z-10">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="text-label text-[var(--accent-red)]">PROJECT AEGIS</span>
        </motion.div>
        
        {/* Main Crisis Stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 text-center"
        >
          <div className="flex items-baseline justify-center gap-4 md:gap-8">
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
          className="text-headline text-[var(--text-secondary)] max-w-3xl mx-auto mb-6"
        >
          Pell Grant purchasing power has collapsed over 50 years
        </motion.h1>
        
        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-body max-w-2xl mx-auto mb-12"
        >
          What once covered {historicalCoverage}% of public university costs now covers just {currentCoverage}%. 
          This dashboard reveals the evidence—and the path to transforming federal investment 
          from <span className="text-[var(--text-primary)]">access vouchers</span> into{' '}
          <span className="text-[var(--accent-emerald)]">completion investments</span>.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button 
            className="btn btn-primary"
            onClick={() => {
              document.getElementById('evidence')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See the Evidence
            <ChevronDown size={18} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              document.getElementById('optimizer')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Solutions
          </button>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="scroll-indicator"
      >
        <span className="text-caption">Scroll to explore</span>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
}
