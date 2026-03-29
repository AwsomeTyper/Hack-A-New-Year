'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';
import InfoTooltip from '@/components/ui/InfoTooltip';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface StateRiskEntry {
  state: string;
  count: number;
  avgRisk: number;
}

function getRiskColor(score: number): string {
  if (score >= 80) return '#E31937';
  if (score >= 60) return '#ff6b35';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#0ea5e9';
  return '#10b981';
}

export default function StateRiskChart() {
  const [stateData, setStateData] = useState<StateRiskEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/api/predict/viability?limit=200`);
        if (!res.ok) throw new Error('Failed to fetch viability');
        const data = await res.json();
        
        // Aggregate by state
        const byState: Record<string, { count: number; totalRisk: number }> = {};
        
        for (const school of data.at_risk_institutions || []) {
          const state = school['school.state'];
          if (!state) continue;
          if (!byState[state]) {
            byState[state] = { count: 0, totalRisk: 0 };
          }
          byState[state].count++;
          // Convert viability score to risk score (invert: lower viability = higher risk)
          byState[state].totalRisk += (100 - (school.viability_score || 50));
        }
        
        const aggregated = Object.entries(byState)
          .map(([state, d]) => ({
            state,
            count: d.count,
            avgRisk: d.totalRisk / d.count,
          }))
          .sort((a, b) => b.avgRisk - a.avgRisk)
          .slice(0, 15);
        
        setStateData(aggregated);
      } catch (err) {
        console.error('Failed to fetch state risk data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const criticalCount = useMemo(() => stateData.filter(s => s.avgRisk >= 70).length, [stateData]);
  const atRiskCount = useMemo(() => stateData.filter(s => s.avgRisk >= 50 && s.avgRisk < 70).length, [stateData]);
  const stableCount = useMemo(() => stateData.filter(s => s.avgRisk < 50).length, [stateData]);

  if (loading || stateData.length === 0) return null;
  
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-red)]/10 flex items-center justify-center">
              <MapPin className="text-[var(--accent-red)]" size={20} />
            </div>
            <h3 className="text-title">Risk Concentrates in a Handful of States<InfoTooltip text="Aggregated from institutional viability scores (inverted: lower viability = higher risk). Shows the 15 states with the highest average risk among at-risk institutions." /></h3>
          </div>
        </div>
      </div>
      
      {/* Bar Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={stateData} 
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 16 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              type="category" 
              dataKey="state" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              width={35}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="chart-tooltip">
                      <p className="text-title text-[var(--text-primary)]">{data.state}</p>
                      <p className="text-caption">
                        Risk Score: {data.avgRisk.toFixed(1)} • {data.count} at-risk institutions
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="avgRisk" 
              radius={[0, 4, 4, 0]}
            >
              {stateData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getRiskColor(entry.avgRisk)}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 flex gap-4">
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(227,25,55,0.1)' }}>
          <p className="text-lg font-bold" style={{ color: '#E31937' }}>
            {criticalCount}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Critical States</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
          <p className="text-lg font-bold" style={{ color: '#fbbf24' }}>
            {atRiskCount}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>At-Risk States</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <p className="text-lg font-bold" style={{ color: '#10b981' }}>
            {stableCount}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Stable States</p>
        </div>
      </div>
    </div>
  );
}
