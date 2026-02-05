'use client';

import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, Shield, FileText } from 'lucide-react';

export default function ImpactSection() {
  const insights = [
    {
      icon: <Lightbulb className="text-[var(--accent-amber)]" size={24} />,
      title: "Index to Actual Costs",
      description: "Pell Grants should be indexed to public tuition rates, not just inflation, restoring their original economic power."
    },
    {
      icon: <TrendingUp className="text-[var(--accent-emerald)]" size={24} />,
      title: "Risk-Sharing Model",
      description: "Require universities to repay a portion of federal aid if students drop out or default—incentivizing completion over enrollment."
    },
    {
      icon: <Shield className="text-[var(--accent-blue)]" size={24} />,
      title: "Flexible Distribution",
      description: "Front-load aid and provide emergency micro-grants when students face financial shocks that threaten persistence."
    }
  ];

  return (
    <section id="impact" className="section bg-[var(--bg-surface)]">
      <div className="container container-narrow">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-label text-[var(--accent-blue)] mb-4 block">THE PATH FORWARD</span>
          <h2 className="text-section mb-4">Policy Recommendations</h2>
          <p className="text-body max-w-2xl mx-auto">
            The data reveals three evidence-based strategies to transform Pell Grants 
            from access vouchers into completion investments.
          </p>
        </motion.div>

        {/* Insights Grid */}
        <div className="space-y-6 mb-16">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="card flex gap-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                {insight.icon}
              </div>
              <div>
                <h3 className="text-title mb-2">{insight.title}</h3>
                <p className="text-body">{insight.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Caution Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="card card-glass border-l-4 border-l-[var(--accent-amber)] mb-16"
        >
          <h3 className="text-title text-[var(--accent-amber)] mb-3">The &ldquo;Creaming&rdquo; Risk</h3>
          <p className="text-body">
            Any performance-based reform must guard against <strong className="text-[var(--text-primary)]">&ldquo;creaming&rdquo;</strong>—where 
            schools stop admitting high-risk students to protect their metrics. Effective policy must 
            hold institutions accountable while <em>expanding</em> access for first-generation and low-income students.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-body mb-6">
            This analysis uses real data from the U.S. Department of Education College Scorecard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://collegescorecard.ed.gov/data/" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <FileText size={18} />
              View Data Source
            </a>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn btn-ghost"
            >
              Back to Top
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24 pt-8 border-t border-[var(--border-subtle)] text-center"
        >
          <p className="text-caption">
            Project Aegis • CGI Hackathon 2026 • Pell Grant ROI Analytics
          </p>
        </motion.footer>
      </div>
    </section>
  );
}
