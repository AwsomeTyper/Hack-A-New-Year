'use client';

import { useMemo } from 'react';
import { MapPin } from 'lucide-react';

interface School {
  id: number;
  'school.name': string;
  'school.state': string;
  resilience_risk_index?: number;
}

interface GeoMapProps {
  schools: School[];
}

// Simplified US state paths (based on actual geography)
const US_STATE_PATHS: Record<string, string> = {
  WA: "M78,28 L118,18 L128,48 L88,58 Z",
  OR: "M68,58 L118,48 L128,98 L78,108 Z",
  CA: "M58,98 L88,88 L98,178 L48,198 Z",
  NV: "M88,88 L118,78 L128,148 L98,168 Z",
  ID: "M118,38 L148,28 L163,108 L128,118 Z",
  MT: "M148,28 L218,18 L228,68 L158,78 Z",
  WY: "M158,78 L228,68 L238,118 L168,128 Z",
  UT: "M118,118 L158,108 L168,168 L128,178 Z",
  CO: "M168,128 L238,118 L248,168 L178,178 Z",
  AZ: "M98,168 L148,158 L158,228 L108,238 Z",
  NM: "M158,168 L218,158 L228,228 L168,238 Z",
  ND: "M238,28 L298,18 L308,58 L248,68 Z",
  SD: "M238,68 L298,58 L308,108 L248,118 Z",
  NE: "M248,118 L318,108 L328,148 L258,158 Z",
  KS: "M258,158 L328,148 L338,198 L268,208 Z",
  OK: "M268,208 L338,198 L358,248 L278,258 Z",
  TX: "M238,238 L318,218 L358,328 L268,358 L228,308 Z",
  MN: "M328,38 L378,28 L388,98 L338,108 Z",
  IA: "M338,108 L388,98 L398,148 L348,158 Z",
  MO: "M358,158 L408,148 L418,208 L368,218 Z",
  AR: "M378,218 L418,208 L428,258 L388,268 Z",
  LA: "M388,268 L428,258 L448,318 L408,328 Z",
  WI: "M378,48 L418,38 L433,98 L388,108 Z",
  IL: "M398,108 L433,98 L448,178 L408,188 Z",
  MI: "M418,38 L478,18 L498,88 L448,108 Z",
  IN: "M438,108 L468,98 L478,168 L448,178 Z",
  OH: "M478,98 L518,88 L528,158 L488,168 Z",
  KY: "M448,178 L518,168 L528,208 L458,218 Z",
  TN: "M438,218 L528,208 L538,248 L448,258 Z",
  MS: "M418,258 L448,248 L458,318 L428,328 Z",
  AL: "M458,258 L488,248 L498,328 L468,338 Z",
  GA: "M498,248 L538,238 L558,318 L518,328 Z",
  FL: "M518,318 L568,298 L598,398 L548,418 L508,378 Z",
  SC: "M538,238 L578,228 L588,278 L548,288 Z",
  NC: "M528,208 L598,188 L608,238 L538,248 Z",
  VA: "M538,178 L598,158 L618,208 L558,218 Z",
  WV: "M528,158 L558,148 L573,198 L538,208 Z",
  PA: "M538,108 L598,88 L618,148 L558,158 Z",
  NY: "M558,58 L628,28 L658,108 L588,128 Z",
  VT: "M608,38 L628,28 L638,68 L618,78 Z",
  NH: "M628,38 L648,28 L658,78 L638,88 Z",
  ME: "M648,18 L688,8 L698,78 L658,88 Z",
  MA: "M638,88 L678,78 L688,108 L648,118 Z",
  RI: "M678,108 L698,98 L708,128 L688,138 Z",
  CT: "M658,118 L688,108 L698,138 L668,148 Z",
  NJ: "M608,128 L638,118 L648,168 L618,178 Z",
  DE: "M618,168 L638,158 L648,198 L628,208 Z",
  MD: "M588,178 L628,168 L638,208 L598,218 Z",
};

// State centers for labels
const STATE_CENTERS: Record<string, [number, number]> = {
  WA: [98, 38], OR: [93, 78], CA: [73, 148], NV: [108, 118], ID: [138, 73],
  MT: [188, 43], WY: [198, 98], UT: [143, 143], CO: [208, 148], AZ: [128, 198],
  NM: [193, 198], ND: [268, 43], SD: [268, 88], NE: [288, 133], KS: [298, 178],
  OK: [308, 228], TX: [293, 288], MN: [358, 63], IA: [368, 128], MO: [388, 178],
  AR: [403, 238], LA: [418, 293], WI: [403, 68], IL: [423, 143], MI: [458, 63],
  IN: [458, 138], OH: [503, 128], KY: [488, 193], TN: [488, 233], MS: [438, 288],
  AL: [478, 293], GA: [528, 278], FL: [548, 358], SC: [563, 258], NC: [568, 223],
  VA: [578, 188], WV: [553, 178], PA: [578, 128], NY: [608, 78], VT: [623, 53],
  NH: [643, 53], ME: [668, 48], MA: [663, 93], RI: [688, 118], CT: [678, 133],
  NJ: [628, 148], DE: [633, 183], MD: [613, 193],
};

function getRiskColor(score: number): string {
  if (score >= 80) return '#E31937';
  if (score >= 60) return '#ff6b35';
  if (score >= 40) return '#fbbf24';
  if (score >= 20) return '#0ea5e9';
  return '#10b981';
}

export default function GeoMap({ schools }: GeoMapProps) {
  // Aggregate schools by state
  const stateData = useMemo(() => {
    const byState: Record<string, { count: number; avgRisk: number }> = {};
    
    schools.forEach(school => {
      const state = school['school.state'];
      if (!state || !US_STATE_PATHS[state]) return;
      
      if (!byState[state]) {
        byState[state] = { count: 0, avgRisk: 0 };
      }
      
      byState[state].count++;
      byState[state].avgRisk += school.resilience_risk_index || 50;
    });
    
    Object.keys(byState).forEach(state => {
      byState[state].avgRisk = byState[state].avgRisk / byState[state].count;
    });
    
    return byState;
  }, [schools]);
  
  return (
    <div className="card col-span-6 animate-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Geographic Risk Distribution
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Hover states for details
          </p>
        </div>
        <MapPin size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
      </div>
      
      {/* US Map SVG */}
      <div className="relative rounded-xl overflow-hidden" style={{ 
        background: 'linear-gradient(180deg, rgba(0,40,70,0.4) 0%, rgba(0,20,40,0.6) 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <svg viewBox="30 0 700 430" className="w-full h-56">
          {/* State shapes */}
          {Object.entries(US_STATE_PATHS).map(([stateCode, path]) => {
            const data = stateData[stateCode];
            const avgRisk = data?.avgRisk || 50;
            const fillColor = data ? getRiskColor(avgRisk) : 'rgba(255,255,255,0.08)';
            
            return (
              <path
                key={stateCode}
                d={path}
                fill={fillColor}
                fillOpacity={data ? 0.75 : 0.2}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                className="transition-all duration-200 hover:brightness-125 cursor-pointer"
              >
                <title>
                  {stateCode}: {data ? `${data.count} schools, Risk: ${avgRisk.toFixed(0)}` : 'No data'}
                </title>
              </path>
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs px-3 py-2 rounded-lg" 
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: '#10b981' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: '#fbbf24' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: '#E31937' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>High</span>
          </div>
        </div>
      </div>
      
      {/* Top Risk States */}
      <div className="mt-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Highest Risk States
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stateData)
            .sort((a, b) => b[1].avgRisk - a[1].avgRisk)
            .slice(0, 5)
            .map(([state, data]) => (
              <span 
                key={state}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ 
                  background: `${getRiskColor(data.avgRisk)}20`,
                  color: getRiskColor(data.avgRisk),
                  border: `1px solid ${getRiskColor(data.avgRisk)}40`
                }}
              >
                {state}: {data.avgRisk.toFixed(0)}
              </span>
            ))
          }
        </div>
      </div>
    </div>
  );
}
