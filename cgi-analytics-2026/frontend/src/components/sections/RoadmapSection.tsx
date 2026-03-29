'use client';

import { motion } from 'motion/react';
import { TrendingDown, Users, Crosshair } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <TrendingDown size={48} />,
    label: 'Why the Promise Broke',
    color: 'var(--accent-red)',
  },
  {
    number: '02',
    icon: <Users size={48} />,
    label: "Who\u2019s Being Left Behind",
    color: 'var(--accent-amber)',
  },
  {
    number: '03',
    icon: <Crosshair size={48} />,
    label: 'How to Restore the Promise',
    color: 'var(--accent-emerald)',
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="w-full min-h-screen flex items-center justify-center bg-[var(--bg-surface)] border-t border-b border-[var(--border-subtle)]">
      <div className="page-container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: 'var(--text-primary)' }}
        >
          The Story
        </motion.h2>

        <div className="flex items-center justify-center gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="flex flex-col items-center text-center px-12"
              >
                {/* Icon */}
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6"
                  style={{
                    background: `color-mix(in srgb, ${step.color} 15%, transparent)`,
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>

                {/* Step Number */}
                <span
                  className="font-mono font-bold mb-3"
                  style={{ color: step.color, fontSize: '28px' }}
                >
                  {step.number}
                </span>

                {/* Label */}
                <h3
                  className="font-semibold text-[var(--text-primary)]"
                  style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.2, maxWidth: '300px' }}
                >
                  {step.label}
                </h3>
              </motion.div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.2 + 0.3 }}
                  className="origin-left"
                  style={{
                    height: '3px',
                    width: '80px',
                    background: `linear-gradient(to right, ${steps[idx].color}, ${steps[idx + 1].color})`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
