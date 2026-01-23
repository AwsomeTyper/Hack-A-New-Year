'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RiskDistributionProps {
  bins: string[];
  counts: number[];
}

const RISK_COLORS = {
  'Very Low': '#28a745',
  'Low': '#005288',
  'Medium': '#ffc107',
  'High': '#ff6b35',
  'Critical': '#E31937',
};

export default function RiskDistribution({ bins, counts }: RiskDistributionProps) {
  const data = bins.map((bin, i) => ({
    category: bin,
    count: counts[i],
    color: RISK_COLORS[bin as keyof typeof RISK_COLORS] || '#5A5B5D',
  }));
  
  const total = counts.reduce((a, b) => a + b, 0);
  const highRiskCount = (counts[3] || 0) + (counts[4] || 0); // High + Critical
  const highRiskPercent = total > 0 ? ((highRiskCount / total) * 100).toFixed(1) : 0;
  
  return (
    <div className="card col-span-6 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-cgi-gray uppercase tracking-wide">
            Risk Distribution
          </h3>
          <p className="text-xs text-white/50 mt-1">
            {total.toLocaleString()} institutions analyzed
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-cgi-red">{highRiskPercent}%</p>
          <p className="text-xs text-cgi-gray">High/Critical Risk</p>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 8, 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                backgroundColor: 'rgba(30,30,40,0.95)',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value.toLocaleString()} schools`, 'Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
