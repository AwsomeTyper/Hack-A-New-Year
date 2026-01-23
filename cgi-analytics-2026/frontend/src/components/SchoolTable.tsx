'use client';

import { useState } from 'react';
import { School, formatPercent, getRiskLabel } from '@/lib/api';
import { Building2, MapPin, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import RiskExplanationCard from './RiskExplanationCard';
import Tooltip from './Tooltip';

interface SchoolTableProps {
  schools: School[];
  title?: string;
}

export default function SchoolTable({ schools, title = "High-Risk Institutions" }: SchoolTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="card col-span-6 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-cgi-gray uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Sorted by resilience risk index
          </p>
        </div>
        <Building2 size={20} className="text-white/40" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 font-medium text-cgi-gray w-8"></th>
              <th className="text-left py-2 font-medium text-cgi-gray">Institution</th>
              <th className="text-right py-2 font-medium text-cgi-gray">
                <Tooltip content="Resilience Risk Index (0-100): A weighted composite score of retention rates, completion rates, and Pell grant dependency. Higher score = Higher vulnerability.">
                  Risk
                </Tooltip>
              </th>
              <th className="text-right py-2 font-medium text-cgi-gray hidden sm:table-cell">Students</th>
              <th className="text-right py-2 font-medium text-cgi-gray hidden sm:table-cell">
                <Tooltip content="Retention Rate: The percentage of first-time, full-time students who return to the same institution for their second year.">
                  Retention
                </Tooltip>
              </th>
              <th className="text-right py-2 font-medium text-cgi-gray hidden md:table-cell">
                <Tooltip content="Value Add Ratio: A proprietary metric comparing post-graduate median earnings to average student debt load, normalized by state cost-of-living.">
                  Value Add
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {schools.slice(0, 8).map((school) => {
              const risk = getRiskLabel(school.resilience_risk_index);
              const isExpanded = expandedId === school.id;
              
              return (
                <>
                  <tr 
                    key={school.id} 
                    onClick={() => toggleExpand(school.id)}
                    className={`
                      border-b border-white/5 cursor-pointer transition-colors
                      ${isExpanded ? 'bg-white/5' : 'hover:bg-white/5'}
                    `}
                  >
                    <td className="py-3 text-center">
                      {isExpanded ? <ChevronUp size={14} className="text-cgi-gray" /> : <ChevronDown size={14} className="text-cgi-gray" />}
                    </td>
                    <td className="py-3">
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: risk.color }}
                        />
                        <div>
                          <p className="font-medium text-white truncate max-w-[180px] sm:max-w-[200px]">
                            {school['school.name']}
                          </p>
                          <p className="text-xs text-white/40 flex items-center gap-1">
                            <MapPin size={10} />
                            {school['school.city']}, {school['school.state']}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span 
                        className="font-mono font-semibold"
                        style={{ color: risk.color }}
                      >
                        {school.resilience_risk_index?.toFixed(0) ?? 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell font-mono text-white/70">
                      {school.student_size?.toLocaleString() ?? 'N/A'}
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {school.retention_rate && school.retention_rate < 0.65 ? (
                          <TrendingDown size={12} className="text-red-500" />
                        ) : school.retention_rate && school.retention_rate > 0.8 ? (
                          <TrendingUp size={12} className="text-green-500" />
                        ) : null}
                        <span className="font-mono">
                          {school.retention_rate 
                            ? formatPercent(school.retention_rate)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono hidden md:table-cell">
                      {school.value_add_ratio 
                        ? school.value_add_ratio.toFixed(2)
                        : 'N/A'
                      }
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-white/5 border-b border-white/10">
                      <td colSpan={6} className="p-4">
                        <RiskExplanationCard explanation={school.risk_explanation} compact />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {schools.length > 8 && (
        <p className="text-xs text-white/40 text-center mt-3">
          Showing 8 of {schools.length} institutions
        </p>
      )}
    </div>
  );
}
