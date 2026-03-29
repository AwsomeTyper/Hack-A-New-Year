'use client';

import { useState, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const iconRef = useRef<SVGSVGElement>(null);

  const show = useCallback(() => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
    setVisible(true);
  }, []);

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <Info
        ref={iconRef}
        size={14}
        className="text-[var(--text-muted)] cursor-help hover:text-[var(--text-secondary)] transition-colors"
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
      />
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  left: coords.x,
                  top: coords.y,
                  transform: 'translate(-50%, -100%)',
                  marginTop: -8,
                }}
                className="w-56 px-3 py-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg z-[9999] pointer-events-none leading-relaxed"
              >
                {text}
              </motion.span>
            )}
          </AnimatePresence>,
          document.body
        )}
    </span>
  );
}
