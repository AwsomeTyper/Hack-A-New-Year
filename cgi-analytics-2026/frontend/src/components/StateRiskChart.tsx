'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';

interface School {
  id: number;
  'school.name': string;
  'school.state': string;
  resilience_risk_index?: number;
}

interface StateRiskChartProps {
  schools: School[];
}

function getRiskColor(score: number): string {
  if (score >= 80) return '#E31937';
  if (score >= 60) return '#ff6b35';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#0ea5e9';
  return '#10b981';
}

export default function StateRiskChart({ schools }: StateRiskChartProps) {
  // Aggregate by state
  const stateData = useMemo(() => {
    const byState: Record<string, { count: number; totalRisk: number; avgRisk: number }> = {};
    
    schools.forEach(school => {
      const state = school['school.state'];
      if (!state) return;
      
      if (!byState[state]) {
        byState[state] = { count: 0, totalRisk: 0, avgRisk: 0 };
      }
      
      byState[state].count++;
      byState[state].totalRisk += school.resilience_risk_index || 50;
    });
    
    // Calculate averages and convert to array
    return Object.entries(byState)
      .map(([state, data]) => ({
        state,
        count: data.count,
        avgRisk: data.totalRisk / data.count,
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 15); // Top 15 riskiest states
  }, [schools]);
  
  return (
    <div className="card col-span-6 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Risk by State
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Top 15 highest-risk states (avg Resilience Risk Index)
          </p>
        </div>
        <MapPin size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
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
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis 
              type="category" 
              dataKey="state" 
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              width={35}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ 
                      background: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      padding: '8px 12px'
                    }}>
                      <p style={{ color: 'white', fontWeight: 600 }}>{data.state}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                        Risk: {data.avgRisk.toFixed(1)} • {data.count} schools
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
            {stateData.filter(s => s.avgRisk >= 70).length}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Critical States</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
          <p className="text-lg font-bold" style={{ color: '#fbbf24' }}>
            {stateData.filter(s => s.avgRisk >= 50 && s.avgRisk < 70).length}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>At-Risk States</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <p className="text-lg font-bold" style={{ color: '#10b981' }}>
            {stateData.filter(s => s.avgRisk < 50).length}
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Stable States</p>
        </div>
      </div>
    </div>
  );
}
