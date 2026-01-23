
'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent, OptimizationResult } from '@/lib/api';
import { Play, DollarSign, GraduationCap, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import RiskExplanationCard from './RiskExplanationCard';

interface ScenarioPlannerProps {
  onOptimize?: (budget: number, sat: number, pell: number) => Promise<void>;
  result?: OptimizationResult | null;
  loading?: boolean;
}

export default function ScenarioPlanner({ onOptimize, result, loading }: ScenarioPlannerProps) {
  const [budget, setBudget] = useState(5_000_000);
  const [targetSat, setTargetSat] = useState(1100);
  const [pellMinimum, setPellMinimum] = useState(40);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedAllocId, setExpandedAllocId] = useState<number | null>(null);
  
  const handleOptimize = () => {
    onOptimize?.(budget, targetSat, pellMinimum / 100);
  };

  const toggleAllocExpand = (id: number) => {
    setExpandedAllocId(expandedAllocId === id ? null : id);
  };
  
  return (
    <div className="card col-span-12 animate-in border-l-4 border-l-cgi-red">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-cgi-red" />
            Pell Grant Allocator
          </h3>
          <p className="text-sm text-cgi-gray mt-1 max-w-2xl">
            Optimizes <strong>Additional Intervention Pilot Funding</strong> (surplus allocations), not the base federal block grant. 
            Identifies high-need institutions where supplemental funding will maximise retention ROI.
          </p>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={loading}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-base shadow-lg shadow-cgi-red/20"
        >
          <Play size={18} />
          {loading ? 'Optimizing Allocation...' : 'Run Allocation Model'}
        </button>
      </div>
      
      {/* Primary Controls */}
      <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Budget Slider (Main Control) */}
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-base font-semibold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-green-400" />
                Intervention Pilot Budget
              </label>
              <span className="text-xl font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded border border-green-400/20">
                {formatCurrency(budget)}
              </span>
            </div>
            <input
              type="range"
              min={1_000_000}
              max={50_000_000}
              step={1_000_000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-green-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-cgi-gray mt-2 font-mono">
              <span>$1M</span>
              <span>$25M</span>
              <span>$50M</span>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-cgi-gray hover:text-white flex items-center gap-2 transition-colors"
            >
              {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
             <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2 text-cgi-gray">
                  <GraduationCap size={16} className="text-cgi-blue" />
                  Min. SAT Average (Filter)
                </label>
                <span className="font-mono text-cgi-blue">{targetSat}</span>
              </div>
              <input
                type="range"
                min={900}
                max={1400}
                step={25}
                value={targetSat}
                onChange={(e) => setTargetSat(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cgi-blue"
              />
              <p className="text-xs text-cgi-gray mt-1">Excludes schools with SAT below threshold (if reported)</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2 text-cgi-gray">
                  <Users size={16} className="text-orange-400" />
                  Min. Pell Allocation %
                </label>
                <span className="font-mono text-orange-400">{pellMinimum}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={80}
                step={5}
                value={pellMinimum}
                onChange={(e) => setPellMinimum(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
              <p className="text-xs text-cgi-gray mt-1">Minimum % of budget reserved for high-Pell schools</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Results Panel */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-cgi-dark-light p-4 rounded-xl border border-white/5">
              <p className="text-xs uppercase tracking-wide text-cgi-gray mb-1">Schools Funded</p>
              <p className="text-2xl font-bold text-white">
                {result.schools_funded ?? '0'}
              </p>
            </div>
            <div className="bg-cgi-dark-light p-4 rounded-xl border border-white/5">
              <p className="text-xs uppercase tracking-wide text-cgi-gray mb-1">Students Impacted</p>
              <p className="text-2xl font-bold text-cgi-blue">
                {result.students_impacted?.toLocaleString() ?? '0'}
              </p>
            </div>
            <div className="bg-cgi-dark-light p-4 rounded-xl border border-white/5 bg-red-950/20 border-red-500/20">
              <p className="text-xs uppercase tracking-wide text-red-200 mb-1">Retained (Projected)</p>
              <p className="text-2xl font-bold text-red-400">
                +{result.additional_retained?.toLocaleString() ?? '0'}
              </p>
            </div>
            <div className="bg-cgi-dark-light p-4 rounded-xl border border-white/5">
              <p className="text-xs uppercase tracking-wide text-cgi-gray mb-1">Pell Allocation</p>
              <p className="text-2xl font-bold text-yellow-400">
                {result.pell_percentage != null ? formatPercent(result.pell_percentage) : '0%'}
              </p>
            </div>
          </div>
          
          {/* Allocation Details Table */}
          {result.allocations && result.allocations.length > 0 && (
            <div className="bg-cgi-dark-light rounded-xl overflow-hidden border border-white/10">
              <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h4 className="font-semibold text-white">Recommended Allocations</h4>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/20">
                  Top 20 ROI Opportunities
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-cgi-gray">
                    <tr>
                      <th className="px-6 py-3 text-left w-8"></th>
                      <th className="px-6 py-3 text-left">Institution</th>
                      <th className="px-6 py-3 text-right">Total Grant</th>
                      <th className="px-6 py-3 text-right">Proj. ROI</th>
                      <th className="px-6 py-3 text-right">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.allocations.map((alloc, idx) => {
                      const isExpanded = expandedAllocId === idx;
                      return (
                        <>
                          <tr 
                            key={idx} 
                            onClick={() => toggleAllocExpand(idx)}
                            className={`
                              cursor-pointer transition-colors
                              ${isExpanded ? 'bg-white/5' : 'hover:bg-white/[0.02]'}
                            `}
                          >
                             <td className="px-6 py-4 text-center text-cgi-gray">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </td>
                            <td className="px-6 py-4 font-medium text-white">
                              {alloc.name}
                              <div className="text-xs text-cgi-gray font-normal mt-0.5">
                                {alloc.state} • {alloc.student_size?.toLocaleString()} students
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-green-400 font-bold bg-green-950/30 px-2 py-1 rounded border border-green-500/20">
                                {formatCurrency(alloc.investment)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-cgi-blue">
                              +{(alloc.retention_improvement ?? 0) > 0 ? ((alloc.retention_improvement ?? 0) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-bold ${(alloc.risk_index ?? 0) > 60 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {(alloc.risk_index ?? 0).toFixed(0)}
                              </span>
                            </td>
                          </tr>
                          
                          {/* Expanded Details */}
                          {isExpanded && (
                            <tr className="bg-black/20">
                              <td colSpan={5} className="px-6 py-6 fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Left: Distribution Strategy */}
                                  <div>
                                    <h5 className="text-xs uppercase tracking-wider text-green-400 font-semibold mb-3 flex items-center gap-2">
                                      <DollarSign size={14} /> 
                                      Distribution Strategy
                                    </h5>
                                    
                                    <div className="bg-green-950/10 border border-green-500/20 rounded-lg p-4">
                                      <p className="text-lg font-medium text-white mb-1">
                                        {alloc.student_distribution?.strategy?.split(':')[0]}
                                      </p>
                                      <p className="text-sm text-green-100/70 mb-4">
                                        {alloc.student_distribution?.strategy?.split(':')[1]}
                                      </p>
                                      
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-black/20 rounded p-2">
                                          <p className="text-xs text-cgi-gray mb-1">Recommended per Student</p>
                                          <p className="font-mono text-white">
                                            {formatCurrency(alloc.student_distribution?.recommended_pell_per_student || 0)}
                                          </p>
                                        </div>
                                        <div className="bg-black/20 rounded p-2">
                                          <p className="text-xs text-cgi-gray mb-1">Target At-Risk Students</p>
                                          <p className="font-mono text-white">
                                            {alloc.student_distribution?.at_risk_students?.toLocaleString() || 0}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Right: Risk Explanation */}
                                  <div>
                                     <h5 className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-3 flex items-center gap-2">
                                      <TrendingUp size={14} /> 
                                      Risk Analysis
                                    </h5>
                                    <RiskExplanationCard explanation={alloc.risk_explanation} compact />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {!result && (
        <div className="bg-white/5 rounded-lg p-12 border border-dashed border-white/20 text-center flex flex-col items-center justify-center">
          <div className="bg-cgi-red/10 rounded-full p-4 mb-4">
             <DollarSign size={32} className="text-cgi-red" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Ready to Optimize</h4>
          <p className="text-cgi-gray max-w-md">
            Set your budget above and run the allocation model to see tailored Pell Grant distribution strategies.
          </p>
        </div>
      )}
    </div>
  );
}
