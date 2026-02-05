'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Target, Zap, Shield, Loader2 } from 'lucide-react';
import { runEnrollmentOptimization, formatCurrency, formatNumber, type StrategyComparison, type EnrollmentOptimization } from '@/lib/api';

interface StrategyCardProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  graduates: number;
  costPerGrad: number;
  specialMetric?: { label: string; value: string };
  isSelected: boolean;
  onClick: () => void;
}

function StrategyCard({ 
  name, icon, description, graduates, costPerGrad, 
  specialMetric, isSelected, onClick 
}: StrategyCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        card text-left w-full cursor-pointer transition-all
        ${isSelected 
          ? 'border-[var(--accent-red)] bg-[var(--bg-hover)] glow-red' 
          : 'hover:border-[var(--border-hover)]'
        }
      `}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isSelected ? 'bg-[var(--accent-red)]/20' : 'bg-[var(--bg-elevated)]'}
        `}>
          {icon}
        </div>
        <h3 className="text-title">{name}</h3>
      </div>
      
      <p className="text-caption mb-6 min-h-[40px]">{description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-label mb-1">Graduates</p>
          <p className="text-mono text-lg">{formatNumber(graduates)}</p>
        </div>
        <div>
          <p className="text-label mb-1">Cost/Grad</p>
          <p className="text-mono text-lg">{formatCurrency(costPerGrad)}</p>
        </div>
      </div>
      
      {specialMetric && (
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-label mb-1">{specialMetric.label}</p>
          <p className="text-mono text-[var(--accent-emerald)]">{specialMetric.value}</p>
        </div>
      )}
    </motion.button>
  );
}

interface OptimizerSectionProps {
  initialComparison?: StrategyComparison | null;
}

export default function OptimizerSection({ initialComparison }: OptimizerSectionProps) {
  const [budget, setBudget] = useState(50_000_000);
  const [selectedStrategy, setSelectedStrategy] = useState<'base' | 'performance' | 'retention_trigger'>('retention_trigger');
  const [comparison, setComparison] = useState<StrategyComparison | null>(initialComparison || null);
  const [optimization, setOptimization] = useState<EnrollmentOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Fetch strategy comparison
  const loadComparison = useCallback(async () => {
    try {
      const response = await runEnrollmentOptimization({ compare: true, budget });
      // API returns { budget, comparison: [...], full_results: {...} }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response as any;
      if (data.comparison && Array.isArray(data.comparison)) {
        setComparison(data.comparison as StrategyComparison);
      }
    } catch (err) {
      console.error('Failed to load comparison:', err);
    }
  }, [budget]);

  // Fetch detailed optimization
  const loadOptimization = useCallback(async () => {
    setLoading(true);
    try {
      const data = await runEnrollmentOptimization({ strategy: selectedStrategy, budget });
      setOptimization(data as EnrollmentOptimization);
    } catch (err) {
      console.error('Failed to load optimization:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStrategy, budget]);

  // Load comparison on mount
  useEffect(() => {
    if (!comparison) {
      loadComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load optimization when strategy or budget changes
  useEffect(() => {
    loadOptimization();
  }, [loadOptimization]);

  // API returns comparison as array: [{strategy: 'base', graduates, cost_per_grad, schools_funded}, ...]
  const getStrategy = (name: string) => comparison?.find(s => s.strategy === name);
  
  const baseStrategy = getStrategy('base');
  const perfStrategy = getStrategy('performance');
  const retentionStrategy = getStrategy('retention_trigger');

  const strategies = comparison && comparison.length > 0 ? [
    {
      key: 'base' as const,
      name: 'Base Allocation',
      icon: <Target size={20} className="text-[var(--text-secondary)]" />,
      description: 'Proportional allocation based on expected graduates',
      graduates: baseStrategy?.graduates || 0,
      costPerGrad: baseStrategy?.cost_per_grad || 0,
    },
    {
      key: 'performance' as const,
      name: 'Performance',
      icon: <Zap size={20} className="text-[var(--accent-amber)]" />,
      description: 'Bonus allocations for high Value-Added institutions',
      graduates: perfStrategy?.graduates || 0,
      costPerGrad: perfStrategy?.cost_per_grad || 0,
      specialMetric: { 
        label: 'Schools Funded', 
        value: perfStrategy?.schools_funded?.toString() || '0' 
      },
    },
    {
      key: 'retention_trigger' as const,
      name: 'Retention Trigger',
      icon: <Shield size={20} className="text-[var(--accent-emerald)]" />,
      description: 'Emergency micro-grants for at-risk students',
      graduates: retentionStrategy?.graduates || 0,
      costPerGrad: retentionStrategy?.cost_per_grad || 0,
      specialMetric: { 
        label: 'Schools Funded', 
        value: retentionStrategy?.schools_funded?.toString() || '0' 
      },
    },
  ] : [];

  return (
    <section id="optimizer" className="section bg-[var(--bg-void)]">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-label text-[var(--accent-emerald)] mb-4 block">THE SOLUTION</span>
          <h2 className="text-section mb-4">Optimization Studio</h2>
          <p className="text-body max-w-2xl mx-auto">
            Compare allocation strategies and see how different approaches 
            maximize graduates per federal dollar invested.
          </p>
        </motion.div>

        {/* Strategy Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid-3 mb-12"
        >
          {strategies.map((strategy, idx) => (
            <StrategyCard
              key={`strategy-${idx}`}
              name={strategy.name}
              icon={strategy.icon}
              description={strategy.description}
              graduates={strategy.graduates}
              costPerGrad={strategy.costPerGrad}
              specialMetric={strategy.specialMetric}
              isSelected={selectedStrategy === strategy.key}
              onClick={() => setSelectedStrategy(strategy.key)}
            />
          ))}
        </motion.div>

        {/* Budget Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card card-elevated mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h3 className="text-title mb-1">Budget Allocation</h3>
              <p className="text-caption">Adjust the total federal investment to see impact</p>
            </div>
            <div className="text-right">
              <div className="stat-value text-[var(--text-primary)]">{formatCurrency(budget)}</div>
            </div>
          </div>
          
          <div className="slider-container">
            <input
              type="range"
              min={10_000_000}
              max={100_000_000}
              step={5_000_000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="slider"
            />
            <div className="flex justify-between mt-2">
              <span className="text-caption">$10M</span>
              <span className="text-caption">$100M</span>
            </div>
          </div>
          
          {/* Predicted Impact Summary */}
          {optimization && (
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <h4 className="text-label mb-4">Predicted Impact</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="pb-2 text-caption font-normal">Metric</th>
                      <th className="pb-2 text-caption font-normal text-center">Baseline</th>
                      <th className="pb-2 text-caption font-normal text-center">Projected</th>
                      <th className="pb-2 text-caption font-normal text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Pell Students Reached</td>
                      <td className="py-3 text-center text-[var(--text-muted)]">0</td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.total_pell_students || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        +{formatNumber(optimization.total_pell_students || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Expected Graduates</td>
                      <td className="py-3 text-center text-[var(--text-muted)]">0</td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.total_expected_graduates || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        +{formatNumber(optimization.total_expected_graduates || 0)}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Schools Funded</td>
                      <td className="py-3 text-center text-[var(--text-muted)]">0</td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.schools_funded || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        +{formatNumber(optimization.schools_funded || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-body">Cost per Graduate</td>
                      <td className="py-3 text-center text-[var(--text-muted)]">—</td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatCurrency(optimization.avg_cost_per_graduate || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-blue)]">
                        {formatCurrency(optimization.avg_cost_per_graduate || 0)}/grad
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* Allocation Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-title mb-1">Institution Allocations</h3>
              <p className="text-caption">
                {showAll 
                  ? `All ${optimization?.allocations?.length || 0} institutions under ${selectedStrategy.replace(/_/g, ' ')} strategy`
                  : `Top 10 of ${optimization?.allocations?.length || 0} institutions under ${selectedStrategy.replace(/_/g, ' ')} strategy`
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && <Loader2 className="animate-spin text-[var(--text-muted)]" size={20} />}
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn btn-secondary text-sm"
              >
                {showAll ? 'Show Top 10' : 'Show All'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Allocation</th>
                  <th>Pell Students</th>
                  <th>Completion Rate</th>
                  <th>Expected Grads</th>
                </tr>
              </thead>
              <tbody>
                {optimization?.allocations?.slice(0, showAll ? undefined : 10).map((alloc, idx) => (
                  <tr key={`alloc-${idx}`}>
                    <td className="font-medium max-w-[250px] truncate">
                      {alloc.school_name || 'Unknown'}
                    </td>
                    <td className="mono text-[var(--accent-emerald)]">
                      {formatCurrency(alloc.allocation)}
                    </td>
                    <td>{formatNumber(alloc.pell_students || 0)}</td>
                    <td>{((alloc.completion_rate || 0) * 100).toFixed(1)}%</td>
                    <td className="mono">{formatNumber(alloc.expected_graduates || 0)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--text-muted)] py-8">
                      {loading ? 'Loading allocations...' : 'No allocation data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
