'use client';

import { RiskExplanation } from '@/lib/api';
import { AlertTriangle, TrendingDown, Users, GraduationCap, DollarSign } from 'lucide-react';

interface RiskExplanationCardProps {
  explanation?: RiskExplanation;
  compact?: boolean;
}

export default function RiskExplanationCard({ explanation, compact = false }: RiskExplanationCardProps) {
  if (!explanation || !explanation.factors || explanation.factors.length === 0) {
    return (
      <div className="text-xs text-cgi-gray italic">
        No specific risk factors identified.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-cgi-red" size={16} />
          <h4 className="font-semibold text-white">Risk Analysis</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cgi-gray/20 text-cgi-gray border border-cgi-gray/30">
            {explanation.summary}
          </span>
        </div>
      )}

      <div className="grid gap-2">
        {explanation.factors.map((factor, idx) => (
          <div 
            key={idx}
            className={`
              p-3 rounded-lg border flex items-start gap-3
              ${factor.severity === 'high' 
                ? 'bg-red-950/20 border-red-500/30' 
                : factor.severity === 'medium'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-blue-950/20 border-blue-500/30'}
            `}
          >
            <div className={`mt-0.5 rounded-full p-1 
              ${factor.severity === 'high' ? 'bg-red-500/20 text-red-400' 
                : factor.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-blue-500/20 text-blue-400'}`}
            >
              <RiskIcon factor={factor.factor} size={14} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-semibold text-sm
                  ${factor.severity === 'high' ? 'text-red-200' 
                    : factor.severity === 'medium' ? 'text-amber-200' 
                    : 'text-blue-200'}`}
                >
                  {factor.factor}
                </span>
                <span className="text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded text-white/70">
                  {factor.value}
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                {factor.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskIcon({ factor, size }: { factor: string; size: number }) {
  if (factor.includes('Retention')) return <Users size={size} />;
  if (factor.includes('Completion') || factor.includes('Grad')) return <GraduationCap size={size} />;
  if (factor.includes('Pell')) return <DollarSign size={size} />;
  if (factor.includes('ROI') || factor.includes('Debt')) return <TrendingDown size={size} />;
  return <AlertTriangle size={size} />;
}
