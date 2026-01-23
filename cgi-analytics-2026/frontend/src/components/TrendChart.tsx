'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface TrendChartProps {
  years: number[];
  enrollment: number[];
  revenue: number[];
}

export default function TrendChart({ years, enrollment, revenue }: TrendChartProps) {
  // Combine data for Recharts
  const data = years.map((year, i) => ({
    year,
    enrollment: enrollment[i],
    revenue: revenue[i] / 1_000_000_000, // Convert to billions
  }));
  
  // Calculate year-over-year changes
  const enrollmentChange = enrollment.length > 1 
    ? ((enrollment[enrollment.length - 1] - enrollment[0]) / enrollment[0]) * 100
    : 0;
  
  return (
    <div className="card col-span-8 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-cgi-gray uppercase tracking-wide">
            Enrollment & Revenue Trends
          </h3>
          <p className="text-xs text-white/50 mt-1">
            National aggregate view • Bachelor&apos;s degree-granting institutions
          </p>
        </div>
        
        {/* Warning Badge for 2026 */}
        <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-xs font-medium border border-red-500/30">
          <AlertTriangle size={14} />
          Demographic Cliff: 2026
        </div>
      </div>
      
      {/* Trend Summary */}
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#005288]" />
          <span className="text-sm text-white/70">Enrollment</span>
          <span className={`text-sm font-medium ${enrollmentChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {enrollmentChange < 0 ? <TrendingDown size={14} className="inline" /> : null}
            {enrollmentChange.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#E31937]" />
          <span className="text-sm text-white/70">Revenue ($ Billions)</span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickFormatter={(v) => `$${v.toFixed(0)}B`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 8, 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                backgroundColor: 'rgba(30,30,40,0.95)',
                color: '#fff'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'enrollment') {
                  return [`${(value / 1_000_000).toFixed(2)}M students`, 'Enrollment'];
                }
                return [`$${value.toFixed(1)}B`, 'Revenue'];
              }}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="enrollment" 
              stroke="#005288" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#005288' }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="#E31937" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#E31937' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="mt-3 text-xs text-white/50 text-center">
        Note: Revenue increases from tuition hikes are masking underlying enrollment decline. 
        This strategy becomes unsustainable when the demographic cliff hits in 2026.
      </p>
    </div>
  );
}
