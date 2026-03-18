'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Target, Zap, Shield, Loader2 } from 'lucide-react';
import { runEnrollmentOptimization, formatCurrency, formatNumber, type StrategyComparison, type EnrollmentOptimization } from '@/lib/api';
import InfoTooltip from '@/components/ui/InfoTooltip';

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
  const [debouncedBudget, setDebouncedBudget] = useState(50_000_000);
  const [selectedStrategy, setSelectedStrategy] = useState<'base' | 'performance' | 'retention_trigger'>('retention_trigger');
  const [comparison, setComparison] = useState<StrategyComparison | null>(initialComparison || null);
  const [optimization, setOptimization] = useState<EnrollmentOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Debounce budget changes (400ms) so we don't fire API calls on every slider tick
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedBudget(budget), 400);
    return () => clearTimeout(timeout);
  }, [budget]);

  // Fetch strategy comparison
  const loadComparison = useCallback(async () => {
    try {
      const response = await runEnrollmentOptimization({ compare: true, budget: debouncedBudget });
      // API returns { budget, comparison: [...], full_results: {...} }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response as any;
      if (data.comparison && Array.isArray(data.comparison)) {
        setComparison(data.comparison as StrategyComparison);
      }
    } catch (err) {
      console.error('Failed to load comparison:', err);
    }
  }, [debouncedBudget]);

  // Fetch detailed optimization
  const loadOptimization = useCallback(async () => {
    setLoading(true);
    try {
      const data = await runEnrollmentOptimization({ strategy: selectedStrategy, budget: debouncedBudget });
      setOptimization(data as EnrollmentOptimization);
    } catch (err) {
      console.error('Failed to load optimization:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStrategy, debouncedBudget]);

  // Load comparison when debounced budget changes
  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // Load optimization when strategy or debounced budget changes
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
      description: 'Standard allocation optimized for enrollment volume (Elasticity Model).',
      graduates: baseStrategy?.graduates || 0,
      costPerGrad: baseStrategy?.cost_per_grad || 0,
    },
    {
      key: 'performance' as const,
      name: 'Performance',
      icon: <Zap size={20} className="text-[var(--accent-amber)]" />,
      description: 'Rewards high value-add schools (OLS Regression, R²=0.51).',
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
      description: 'Targeted aid for dropout risk (XGBoost Classifier, AUC=0.82).',
      graduates: retentionStrategy?.graduates || 0,
      costPerGrad: retentionStrategy?.cost_per_grad || 0,
      specialMetric: { 
        label: 'Schools Funded', 
        value: retentionStrategy?.schools_funded?.toString() || '0' 
      },
    },
  ] : [];

  return (
    <section id="optimizer" className="section bg-[var(--bg-void)] scroll-mt-8">
      <div className="page-container">
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
          <p className="text-body max-w-2xl mx-auto mb-6">
            Understanding the problem isn&apos;t enough — decision-makers need to know where to invest.
            This studio uses Linear Programming to simulate three allocation strategies under real budget constraints.<InfoTooltip text="Uses Linear Programming to allocate a fixed budget across eligible institutions. Each strategy weights schools differently based on enrollment elasticity, value-add scores, or dropout risk predictions." />
          </p>
          
          {/* Fairness Audit Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/30">
            <Shield size={16} className="text-[var(--accent-emerald)]" />
            <span className="text-xs font-medium text-[var(--accent-emerald)] tracking-wide uppercase">
              Fairness Audited
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              — Anti-creaming bias checks via fairlearn ensure equitable recommendations<InfoTooltip text="The fairlearn library tests for demographic parity and equalized odds, verifying the optimizer doesn't systematically exclude schools serving underrepresented populations." />
            </span>
          </div>
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
              <p className="text-caption">Adjust the total federal investment to see impact<InfoTooltip text="The slider range ($10M–$100M) is for interactive demonstration only. Actual annual Pell Grant disbursement is approximately $30 billion." /></p>
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

          {/* Executive Summary */}
          {optimization && (
            <div className="mt-6 p-4 rounded-xl bg-[var(--accent-emerald)]/5 border border-[var(--accent-emerald)]/20">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--accent-emerald)]">Key Insight:</span>{' '}
                At a {formatCurrency(budget)} budget, the {selectedStrategy === 'base' ? 'Base' : selectedStrategy === 'performance' ? 'Performance' : 'Retention Trigger'} strategy 
                would reach <strong className="text-[var(--text-primary)]">{formatNumber(optimization.total_pell_students || 0)}</strong> Pell students 
                and produce <strong className="text-[var(--text-primary)]">{formatNumber(optimization.total_expected_graduates || 0)}</strong> additional graduates 
                at <strong className="text-[var(--text-primary)]">{formatCurrency(optimization.avg_cost_per_graduate || 0)}</strong> per graduate
                {optimization.total_enrollment_impact ? `, with ${formatNumber(optimization.total_enrollment_impact)} new enrollments predicted` : ''}.
              </p>
            </div>
          )}
          
          {/* Predicted Impact Summary */}
          {optimization && (
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
              <h4 className="text-label mb-4">Predicted Impact</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="pb-2 text-caption font-normal">Metric</th>
                      <th className="pb-2 text-caption font-normal text-center">Baseline<InfoTooltip text="Current outcome without any optimization reallocation applied." /></th>
                      <th className="pb-2 text-caption font-normal text-center">Projected<InfoTooltip text="Model-predicted outcome after applying the selected strategy at the given budget." /></th>
                      <th className="pb-2 text-caption font-normal text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Pell Students Reached<InfoTooltip text="Total students receiving Pell Grant aid at funded institutions." /></td>
                      <td className="py-3 text-center text-[var(--text-muted)]">
                        {formatNumber(optimization.baseline_pell_students || 0)}
                      </td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.total_pell_students || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        {((optimization.total_pell_students || 0) - (optimization.baseline_pell_students || 0)) >= 0 ? '+' : ''}
                        {formatNumber((optimization.total_pell_students || 0) - (optimization.baseline_pell_students || 0))}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Expected Graduates<InfoTooltip text="Projected total degrees produced under this allocation, based on each school's historical completion rate." /></td>
                      <td className="py-3 text-center text-[var(--text-muted)]">
                        {formatNumber(optimization.baseline_expected_graduates || 0)}
                      </td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.total_expected_graduates || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        {((optimization.total_expected_graduates || 0) - (optimization.baseline_expected_graduates || 0)) >= 0 ? '+' : ''}
                        {formatNumber((optimization.total_expected_graduates || 0) - (optimization.baseline_expected_graduates || 0))}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Schools Funded</td>
                      <td className="py-3 text-center text-[var(--text-muted)]">
                        {formatNumber(optimization.eligible_schools || optimization.baseline_schools || 0)} eligible
                      </td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        {formatNumber(optimization.schools_funded || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-blue)]">
                        {optimization.schools_funded || 0} of {optimization.eligible_schools || optimization.baseline_schools || 0}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-3 text-body">Enrollment Impact<InfoTooltip text="Additional students predicted to enroll based on the price elasticity of demand for higher education at each institution." /></td>
                      <td className="py-3 text-center text-[var(--text-muted)]">—</td>
                      <td className="py-3 text-center font-medium text-[var(--text-primary)]">
                        +{formatNumber(optimization.total_enrollment_impact || 0)}
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                        +{formatNumber(optimization.total_enrollment_impact || 0)} students
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-body">Cost per Graduate<InfoTooltip text="Total budget divided by projected graduates. Lower values indicate more cost-efficient allocation." /></td>
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
                  <th>Allocation<InfoTooltip text="Dollar amount the optimizer recommends directing to this institution based on the selected strategy." /></th>
                  <th>Baseline Grads<InfoTooltip text="Current number of annual graduates without any reallocation." /></th>
                  <th>Projected Grads<InfoTooltip text="Expected graduates after applying the optimized funding allocation." /></th>
                  <th>Δ Graduates<InfoTooltip text="Net change in projected graduates compared to the baseline." /></th>
                  <th>Enroll. Impact<InfoTooltip text="Additional students expected to enroll due to reduced net price from the allocation." /></th>
                </tr>
              </thead>
              <tbody>
                {optimization?.allocations?.slice(0, showAll ? undefined : 10).map((alloc, idx) => (
                  <tr key={`alloc-${idx}`}>
                    <td className="font-medium max-w-[250px] truncate">
                      {alloc.school_name || 'Unknown'}
                      <span className="text-caption ml-1">{alloc.state}</span>
                    </td>
                    <td className="mono text-[var(--accent-emerald)]">
                      {formatCurrency(alloc.allocation)}
                    </td>
                    <td className="mono text-[var(--text-muted)]">
                      {formatNumber(alloc.baseline_graduates || 0)}
                    </td>
                    <td className="mono font-medium">
                      {formatNumber(alloc.projected_graduates || alloc.expected_graduates || 0)}
                    </td>
                    <td className={`mono font-medium ${
                      (alloc.graduate_delta || 0) > 0 
                        ? 'text-[var(--accent-emerald)]' 
                        : 'text-[var(--text-muted)]'
                    }`}>
                      {(alloc.graduate_delta || 0) > 0 ? '+' : ''}
                      {formatNumber(alloc.graduate_delta || 0)}
                    </td>
                    <td className={`mono ${
                      (alloc.enrollment_impact || 0) > 0 
                        ? 'text-[var(--accent-emerald)]' 
                        : 'text-[var(--text-muted)]'
                    }`}>
                      {(alloc.enrollment_impact || 0) > 0 ? '+' : ''}
                      {formatNumber(alloc.enrollment_impact || 0)}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="text-center text-[var(--text-muted)] py-8">
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
