'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResilienceScore from '@/components/ResilienceScore';
import TrendChart from '@/components/TrendChart';
import ScenarioPlanner from '@/components/ScenarioPlanner';
import RiskDistribution from '@/components/RiskDistribution';
import SchoolTable from '@/components/SchoolTable';
import StateRiskChart from '@/components/StateRiskChart';
import { 
  fetchStats, 
  fetchSchools, 
  fetchRiskDistribution, 
  fetchTrends,
  runOptimization,
  formatCurrency,
  formatPercent,
  type DashboardStats,
  type School,
  type TrendData,
  type OptimizationResult
} from '@/lib/api';
import { 
  Loader2, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';

// Static demo data for when backend is not running
const DEMO_STATS: DashboardStats = {
  total_schools: 1847,
  avg_retention: 0.742,
  avg_risk_index: 48.3,
  high_risk_count: 312,
  median_earnings: 42500,
  median_debt: 27000,
  avg_value_add: 2.15,
};

const DEMO_TRENDS: TrendData = {
  years: [2022, 2023, 2024, 2025, 2026],
  enrollment: [12500000, 12250000, 11900000, 11420000, 10770000],
  revenue: [385000000000, 396550000000, 404957500000, 409297137500, 409297137500],
  warning: '2026 marks the demographic cliff',
};

const DEMO_RISK_DISTRIBUTION = {
  bins: ['Very Low', 'Low', 'Medium', 'High', 'Critical'],
  counts: [285, 412, 538, 389, 223],
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [riskDist, setRiskDist] = useState<{ bins: string[]; counts: number[] } | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, schoolsData, trendsData, riskData] = await Promise.all([
        fetchStats(),
        fetchSchools({ limit: 50 }),
        fetchTrends(),
        fetchRiskDistribution(),
      ]);
      
      setStats(statsData);
      setSchools(schoolsData.schools);
      setTrends(trendsData);
      setRiskDist(riskData);
      setUsingDemo(false);
    } catch (err) {
      console.log('Backend not available, using demo data', err);
      // Use demo data if backend is not running
      setStats(DEMO_STATS);
      setTrends(DEMO_TRENDS);
      setRiskDist(DEMO_RISK_DISTRIBUTION);
      setSchools([]);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (budget: number, sat: number, pell: number) => {
    setOptimizing(true);
    try {
      const result = await runOptimization({ budget, target_sat: sat, pell_minimum: pell });
      setOptimizationResult(result);
    } catch (err) {
      console.error(err);
      // Demo optimization result
      setOptimizationResult({
        status: 'Optimal',
        total_budget: budget,
        pell_allocation: budget * 0.87, 
        schools_funded: 12,
        students_impacted: 4500,
        baseline_retained: 0.65,
        projected_retained: 0.72,
        additional_retained: 315,
        total_allocated: budget * 0.87,
        budget_utilization: 0.87,
        pell_percentage: pell,
        allocations: []
      });
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cgi-red" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Header usingDemo={usingDemo} />

      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">
              ⚠️ The Demographic Cliff arrives in 2026. 
              <span className="opacity-80 ml-2">
                College-age population projected to decline 15%+ over the next decade.
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users size={20} className="text-cgi-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.total_schools.toLocaleString()}
                </p>
                <p className="kpi-label">Institutions Analyzed</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle size={20} className="text-cgi-red" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cgi-red">
                  {stats?.high_risk_count.toLocaleString()}
                </p>
                <p className="kpi-label">High Risk Schools</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.median_earnings) : 'N/A'}
                </p>
                <p className="kpi-label">Median Earnings (4yr)</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? formatPercent(stats.avg_retention) : 'N/A'}
                </p>
                <p className="kpi-label">Avg Retention Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid (Z-Pattern Layout) */}
        <div className="dashboard-grid">
          {/* Top Left: Resilience Score (Anchor) */}
          <ResilienceScore 
            score={stats?.avg_risk_index ?? 50} 
            schoolName="National Average"
          />
          
          {/* Top Right: Trend Chart */}
          {trends && (
            <TrendChart 
              years={trends.years}
              enrollment={trends.enrollment}
              revenue={trends.revenue}
            />
          )}
          {/* Middle: Risk Distribution & GeoMap */}
          {riskDist && (
            <RiskDistribution 
              bins={riskDist.bins}
              counts={riskDist.counts}
            />
          )}
          
          <StateRiskChart schools={schools} />
          
          {/* School Table (Full Width) */}
          <div className="col-span-12">
            <SchoolTable 
              schools={schools}
              title="High-Risk Institutions"
            />
          </div>
          
          {/* Bottom: Scenario Planner (Full Width) */}
          <ScenarioPlanner 
            onOptimize={handleOptimize}
            result={optimizationResult}
            loading={optimizing}
          />
        </div>

        {/* Footer */}
      {/* Footer */}
      <Footer />
      </div>
    </main>
  );
}
