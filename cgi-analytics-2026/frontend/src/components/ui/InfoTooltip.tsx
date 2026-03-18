'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <Info
        size={14}
        className="text-[var(--text-muted)] cursor-help hover:text-[var(--text-secondary)] transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      />
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg z-50 pointer-events-none leading-relaxed"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
