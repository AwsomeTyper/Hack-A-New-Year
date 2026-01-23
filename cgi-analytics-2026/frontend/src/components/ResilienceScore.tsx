'use client';

import { getRiskLabel } from '@/lib/api';
import { AlertTriangle, TrendingDown, Shield } from 'lucide-react';

interface ResilienceScoreProps {
  score: number;
  schoolName?: string;
}

export default function ResilienceScore({ score, schoolName }: ResilienceScoreProps) {
  const risk = getRiskLabel(score);
  
  // For resilience, invert the risk score (lower risk = higher resilience)
  const resilienceScore = Math.round(100 - score);
  
  return (
    <div className="card col-span-4 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-cgi-gray uppercase tracking-wide">
            Resilience Score
          </h3>
          {schoolName && (
            <p className="text-xs text-white/50 mt-1">{schoolName}</p>
          )}
        </div>
        <div className={`risk-indicator ${risk.class}`}>
          {score >= 60 ? <AlertTriangle size={14} /> : <Shield size={14} />}
          {risk.label} Risk
        </div>
      </div>
      
      <div className="flex items-end gap-4">
        <div 
          className="kpi-value"
          style={{ color: risk.color }}
        >
          {resilienceScore}
        </div>
        <div className="pb-2 flex items-center gap-1 text-sm text-white/50">
          <span>/100</span>
          {score >= 60 && (
            <TrendingDown size={16} className="text-red-500 ml-2" />
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${resilienceScore}%`,
            backgroundColor: risk.color 
          }}
        />
      </div>
      
      <p className="mt-3 text-xs text-white/50">
        {score >= 70 
          ? 'Immediate intervention recommended. High vulnerability to demographic shifts.'
          : score >= 50
          ? 'Moderate risk. Strategic planning needed for 2026+ sustainability.'
          : 'Stable position. Continue monitoring key metrics.'
        }
      </p>
    </div>
  );
}
