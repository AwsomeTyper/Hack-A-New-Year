'use client';

import { useState, useMemo, useEffect } from 'react';
import { fetchEquityPerformance } from '@/lib/api';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine, ZAxis
} from 'recharts';
import { TrendingDown, AlertTriangle, Building2, Award, Filter, Target } from 'lucide-react';

interface PurchasingPowerPoint {
  year: number;
  coverage_pct: number;
}

interface CompletionGapInstitution {
  name: string;
  fullName?: string;
  state?: string;
  gap_pct: number;
  pell_rate?: number;
  nopell_rate?: number;
  student_size?: number;
}

interface EvidenceSectionProps {
  purchasingPowerData: PurchasingPowerPoint[];
  completionGapData: CompletionGapInstitution[];
  atRiskCount: number;
  avgCompletionGap: number;
  totalErosion: number;
  viabilitySummary?: {
    critical_count: number;
    elevated_count: number;
    moderate_count: number;
    stable_count: number;
  };
  elasticityImpact?: number;
  equityPerformanceData?: {
    summary: {
      total_schools: number;
      equity_champions: number;
      value_add_focus: number;
      at_risk: number;
      equity_success: number;
      correlation: number | null;
    };
    available_states?: string[];
    available_college_types?: { code: number; label: string }[];
    available_ownerships?: { code: number; label: string }[];
    schools: Array<{
      id: number;
      name: string;
      state: string;
      pell_gap_pct: number;
      bending_curve_pct: number;
      quadrant: string;
      pell_rate: number;
      student_size: number;
      actual_completion?: number;
      expected_completion?: number;
    }>;
  } | null;
}

// Custom tooltip - using any to match Recharts expectation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="text-caption mb-1">{label}</p>
        <p className="text-title text-[var(--text-primary)]">
          {typeof payload[0].value === 'number' 
            ? `${payload[0].value.toFixed(1)}%` 
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function EvidenceSection({
  purchasingPowerData = [],
  completionGapData = [],
  atRiskCount = 0,
  avgCompletionGap = 0,
  totalErosion = -36,
  viabilitySummary,
  elasticityImpact = 370000,
  equityPerformanceData = null
}: EvidenceSectionProps) {

  // Calculate total institutions for risk distribution
  const totalInstitutions = viabilitySummary 
    ? viabilitySummary.critical_count + viabilitySummary.elevated_count + 
      viabilitySummary.moderate_count + viabilitySummary.stable_count
    : 0;


  // State filter for Pell Gap chart
  const [selectedState, setSelectedState] = useState<string>('all');
  
  // State filter for Equity Matrix scatter plot
  const [matrixState, setMatrixState] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [quadrantFilter, setQuadrantFilter] = useState<string>('all');
  const [selectedCollegeTypes, setSelectedCollegeTypes] = useState<number[]>([]);
  const [selectedOwnerships, setSelectedOwnerships] = useState<number[]>([]);
  // Range filter states
  const [pellRateRange, setPellRateRange] = useState<[number, number]>([0, 100]);
  const [studentSizeRange, setStudentSizeRange] = useState<[number, number]>([0, 100000]);
  const [instructionalSpendRange, setInstructionalSpendRange] = useState<[number, number]>([0, 50000]);
  // X-axis metric selection
  const [xAxisMetric, setXAxisMetric] = useState<string>('completion_gap');
  const [matrixData, setMatrixData] = useState(equityPerformanceData);
  const [matrixLoading, setMatrixLoading] = useState(true);  // Start loading true to fetch on mount
  const [selectedSchool, setSelectedSchool] = useState<{
    id: number;
    name: string;
    state: string;
    pell_gap_pct: number;
    bending_curve_pct: number;
    quadrant: string;
    pell_rate: number;
    student_size: number;
    actual_completion?: number;
    expected_completion?: number;
  } | null>(null);
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Fetch equity matrix data when filters change - always fetch to get all schools
  useEffect(() => {
    const loadMatrixData = async () => {
      setMatrixLoading(true);
      try {
        const data = await fetchEquityPerformance({
          limit: 5000,  // Get all schools
          state: matrixState !== 'all' ? matrixState : undefined,
          search: debouncedSearch || undefined,
          quadrant: quadrantFilter !== 'all' ? quadrantFilter : undefined,
          college_types: selectedCollegeTypes.length > 0 ? selectedCollegeTypes : undefined,
          ownerships: selectedOwnerships.length > 0 ? selectedOwnerships : undefined,
          pell_rate_min: pellRateRange[0] > 0 ? pellRateRange[0] / 100 : undefined,
          pell_rate_max: pellRateRange[1] < 100 ? pellRateRange[1] / 100 : undefined,
          student_size_min: studentSizeRange[0] > 0 ? studentSizeRange[0] : undefined,
          student_size_max: studentSizeRange[1] < 100000 ? studentSizeRange[1] : undefined,
          instructional_spend_min: instructionalSpendRange[0] > 0 ? instructionalSpendRange[0] : undefined,
          instructional_spend_max: instructionalSpendRange[1] < 50000 ? instructionalSpendRange[1] : undefined,
        });
        setMatrixData(data);
      } catch (err) {
        console.error('Failed to fetch matrix data:', err);
      } finally {
        setMatrixLoading(false);
      }
    };
    loadMatrixData();
  }, [matrixState, debouncedSearch, quadrantFilter, selectedCollegeTypes, selectedOwnerships, pellRateRange, studentSizeRange, instructionalSpendRange, equityPerformanceData]);
  
  // Extract unique states from data
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    completionGapData.forEach(d => {
      if (d.state) states.add(d.state);
    });
    return ['all', ...Array.from(states).sort()];
  }, [completionGapData]);
  
  // Filter data by selected state
  const filteredGapData = useMemo(() => {
    if (selectedState === 'all') return completionGapData;
    return completionGapData.filter(d => d.state === selectedState);
  }, [completionGapData, selectedState]);
  
  // Matrix available states (from API response - use initial data for full list)
  const matrixAvailableStates = useMemo(() => {
    return ['all', ...(equityPerformanceData?.available_states || [])];
  }, [equityPerformanceData]);
  
  // X-axis configuration based on selected metric
  const xAxisConfig = useMemo(() => {
    const configs: Record<string, { dataKey: string; label: string; formatter: (v: number) => string; domain: [number, number] }> = {
      completion_gap: {
        dataKey: 'pell_gap_pct',
        label: 'Pell Gap (Equity →)',
        formatter: (v) => `${v}%`,
        domain: [-40, 40]
      },
      pell_rate: {
        dataKey: 'pell_rate',
        label: 'Pell Grant Rate (Access →)',
        formatter: (v) => `${(v * 100).toFixed(0)}%`,
        domain: [0, 1]
      },
      retention_rate: {
        dataKey: 'retention_rate',
        label: 'Retention Rate (Quality →)',
        formatter: (v) => `${(v * 100).toFixed(0)}%`,
        domain: [0, 1]
      },
      instructional_spend: {
        dataKey: 'instructional_spend',
        label: 'Instructional $/Student (Investment →)',
        formatter: (v) => `$${(v / 1000).toFixed(0)}k`,
        domain: [0, 50000]
      },
      median_earnings: {
        dataKey: 'median_earnings',
        label: 'Median Earnings 10yr (Outcomes →)',
        formatter: (v) => `$${(v / 1000).toFixed(0)}k`,
        domain: [20000, 100000]
      }
    };
    return configs[xAxisMetric] || configs.completion_gap;
  }, [xAxisMetric]);
  
  // Calculate axis domains based on quadrant filter for zoom effect
  const axisDomains = useMemo(() => {
    // Default full range
    if (quadrantFilter === 'all' || !matrixData?.schools?.length) {
      return {
        x: [-40, 40] as [number, number],
        y: [-40, 100] as [number, number]
      };
    }
    
    // Calculate data range with padding for the selected quadrant
    const schools = matrixData.schools;
    const xValues = schools.map(s => s.pell_gap_pct).filter(v => v !== null && v !== undefined);
    const yValues = schools.map(s => s.bending_curve_pct).filter(v => v !== null && v !== undefined);
    
    if (xValues.length === 0 || yValues.length === 0) {
      return { x: [-40, 40] as [number, number], y: [-40, 100] as [number, number] };
    }
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Add 10% padding
    const xPad = Math.max(5, (xMax - xMin) * 0.1);
    const yPad = Math.max(5, (yMax - yMin) * 0.1);
    
    return {
      x: [Math.floor(xMin - xPad), Math.ceil(xMax + xPad)] as [number, number],
      y: [Math.floor(yMin - yPad), Math.ceil(yMax + yPad)] as [number, number]
    };
  }, [quadrantFilter, matrixData]);
  
  // Equity Engines: Schools with positive or zero gap (Pell students do as well or better)
  const equityEngines = useMemo(() => {
    return completionGapData
      .filter(d => d.gap_pct >= 0)
      .sort((a, b) => b.gap_pct - a.gap_pct)
      .slice(0, 10);
  }, [completionGapData]);

  return (
    <section id="evidence" className="section bg-[var(--bg-surface)]">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-label text-[var(--accent-red)] mb-4 block">THE EVIDENCE</span>
          <h2 className="text-section mb-4">The Problem at Scale</h2>
          <p className="text-body max-w-2xl mx-auto">
            Critical metrics across {atRiskCount > 0 ? atRiskCount.toLocaleString() : '1,800'} institutions reveal systemic failure in federal higher education investment.
          </p>
        </motion.div>

        {/* Evidence Grid */}
        <div className="grid-3">
          
          {/* BLOCK 1: Purchasing Power Erosion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card col-span-2"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-red)]/10 flex items-center justify-center">
                    <TrendingDown className="text-[var(--accent-red)]" size={20} />
                  </div>
                  <h3 className="text-title">Purchasing Power Erosion</h3>
                </div>
                <p className="text-caption">Maximum Pell Grant as % of average Cost of Attendance (1974-2024)</p>
              </div>
              <div className="text-right">
                <div className="stat-value stat-crisis">{totalErosion}%</div>
                <p className="text-caption">Total Erosion</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={purchasingPowerData}>
                  <defs>
                    <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31937" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E31937" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 80]}
                    tickFormatter={(v) => `${v}%`}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip content={ChartTooltip} />
                  <ReferenceLine 
                    y={25} 
                    stroke="rgba(227, 25, 55, 0.5)" 
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="coverage_pct" 
                    stroke="#E31937"
                    fill="url(#coverageGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* BLOCK 2: Predictive Insights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card flex flex-col justify-between"
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center mx-auto mb-3">
                <Building2 className="text-[var(--accent-blue)]" size={22} />
              </div>
              <h3 className="text-title mb-1">Viability Risk</h3>
              <p className="text-caption text-sm">Institutional stability forecast</p>
            </div>
            
            {viabilitySummary && totalInstitutions > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--accent-red)]">Critical</span>
                  <span className="font-mono">{viabilitySummary.critical_count}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-void)] rounded">
                  <div className="h-full bg-[var(--accent-red)] rounded" style={{ width: `${(viabilitySummary.critical_count / totalInstitutions) * 100}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--accent-amber)]">Elevated</span>
                  <span className="font-mono">{viabilitySummary.elevated_count}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-void)] rounded">
                  <div className="h-full bg-[var(--accent-amber)] rounded" style={{ width: `${(viabilitySummary.elevated_count / totalInstitutions) * 100}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">Moderate</span>
                  <span className="font-mono">{viabilitySummary.moderate_count}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-void)] rounded">
                  <div className="h-full bg-[var(--text-muted)] rounded" style={{ width: `${(viabilitySummary.moderate_count / totalInstitutions) * 100}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--accent-emerald)]">Stable</span>
                  <span className="font-mono">{viabilitySummary.stable_count}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-void)] rounded">
                  <div className="h-full bg-[var(--accent-emerald)] rounded" style={{ width: `${(viabilitySummary.stable_count / totalInstitutions) * 100}%` }} />
                </div>
              </div>
            )}
            
            {/* Elasticity insight */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-center">
              <p className="text-caption">Grant Elasticity</p>
              <p className="text-lg font-semibold text-[var(--accent-emerald)]">
                +{(elasticityImpact / 1000).toFixed(0)}K students
              </p>
              <p className="text-xs text-[var(--text-muted)]">per $1,000 grant increase</p>
            </div>
          </motion.div>

          {/* BLOCK 3: Completion Gap Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="card col-span-2"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-red)]/10 flex items-center justify-center">
                    <AlertTriangle className="text-[var(--accent-red)]" size={20} />
                  </div>
                  <h3 className="text-title">Pell Gap by Institution</h3>
                </div>
                <p className="text-caption">Pell vs. Non-Pell 6-year graduation rate difference</p>
              </div>
              <div className="flex items-center gap-4">
                {/* State Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[var(--text-muted)]" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                  >
                    {availableStates.map(state => (
                      <option key={state} value={state}>
                        {state === 'all' ? 'All States' : state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-right">
                  <div className="stat-value stat-crisis">{avgCompletionGap > 0 ? '+' : ''}{avgCompletionGap.toFixed(1)}%</div>
                  <p className="text-caption">Average Gap</p>
                </div>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={filteredGapData.slice(0, 12)}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis 
                    type="number"
                    domain={[-30, 30]}
                    tickFormatter={(v) => `${v}%`}
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    width={180}
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={ChartTooltip} />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar 
                    dataKey="gap_pct" 
                    radius={[0, 4, 4, 0]}
                  >
                    {filteredGapData.slice(0, 12).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.gap_pct < 0 ? '#E31937' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* BLOCK 4: Key Insight */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card card-glass border-gradient flex flex-col justify-center"
          >
            <h3 className="text-title mb-4">The Core Problem</h3>
            <p className="text-body mb-4">
              Universities receive Pell dollars based on <strong className="text-[var(--text-primary)]">enrollment</strong>, 
              not <strong className="text-[var(--text-primary)]">completion</strong>.
            </p>
            <p className="text-caption">
              This incentivizes aggressive recruiting over student success—effectively 
              subsidizing failure at low-performing institutions.
            </p>
          </motion.div>

          {/* BLOCK 5: Pell Gap vs Bending the Curve Scatter Plot */}
          {equityPerformanceData && equityPerformanceData.schools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="card col-span-3"
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-[var(--accent-purple)]" />
                <h3 className="text-title">Equity vs. Excellence Matrix</h3>
              </div>
              <p className="text-caption mb-4">
                Comparing Pell Gap (equity) with &ldquo;Bending the Curve&rdquo; (value-add). 
                Schools in the top-right achieve both equity and excellence.
              </p>
              
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* X-Axis Metric Selector */}
                <div className="flex items-center gap-2 border-r border-[var(--border)] pr-4">
                  <label className="text-xs text-[var(--text-secondary)]">X-Axis:</label>
                  <select
                    value={xAxisMetric}
                    onChange={(e) => setXAxisMetric(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-2 py-1.5 text-body text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] text-sm font-medium"
                  >
                    <option value="completion_gap">Completion Gap (Pell vs Non-Pell)</option>
                    <option value="pell_rate">Pell Grant Rate</option>
                    <option value="retention_rate">Retention Rate</option>
                    <option value="instructional_spend">Instructional $/Student</option>
                    <option value="median_earnings">Median Earnings (10yr)</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                  <select
                    value={matrixState}
                    onChange={(e) => { setMatrixState(e.target.value); setSelectedSchool(null); }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-body text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)]"
                  >
                    {matrixAvailableStates.map(state => (
                      <option key={state} value={state}>
                        {state === 'all' ? 'All States' : state}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Institution Type Multi-Select */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      const code = parseInt(e.target.value);
                      if (code && !selectedCollegeTypes.includes(code)) {
                        setSelectedCollegeTypes([...selectedCollegeTypes, code]);
                      }
                    }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-2 py-1.5 text-body text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] text-sm"
                  >
                    <option value="">Institution Type {selectedCollegeTypes.length > 0 ? `(${selectedCollegeTypes.length})` : ''}</option>
                    {(equityPerformanceData.available_college_types || []).map((type) => (
                      <option key={type.code} value={type.code} disabled={selectedCollegeTypes.includes(type.code)}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Ownership Multi-Select */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      const code = parseInt(e.target.value);
                      if (code && !selectedOwnerships.includes(code)) {
                        setSelectedOwnerships([...selectedOwnerships, code]);
                      }
                    }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-2 py-1.5 text-body text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)] text-sm"
                  >
                    <option value="">Ownership {selectedOwnerships.length > 0 ? `(${selectedOwnerships.length})` : ''}</option>
                    {(equityPerformanceData.available_ownerships || []).map((type) => (
                      <option key={type.code} value={type.code} disabled={selectedOwnerships.includes(type.code)}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search schools..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-body text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-purple)]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className="text-caption">
                  {matrixLoading ? 'Loading...' : `Showing ${matrixData?.schools?.length || 0} schools`}
                </span>
              </div>
              
              {/* Range Sliders Row */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                {/* Pell Rate Range */}
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] flex justify-between">
                    <span>Pell Rate</span>
                    <span>{pellRateRange[0]}% – {pellRateRange[1]}%</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pellRateRange[0]}
                      onChange={(e) => setPellRateRange([parseInt(e.target.value), pellRateRange[1]])}
                      className="flex-1 h-1 accent-purple-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pellRateRange[1]}
                      onChange={(e) => setPellRateRange([pellRateRange[0], parseInt(e.target.value)])}
                      className="flex-1 h-1 accent-purple-500"
                    />
                  </div>
                </div>
                
                {/* Student Size Range */}
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] flex justify-between">
                    <span>Students</span>
                    <span>{studentSizeRange[0].toLocaleString()} – {studentSizeRange[1].toLocaleString()}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={studentSizeRange[0]}
                      onChange={(e) => setStudentSizeRange([parseInt(e.target.value), studentSizeRange[1]])}
                      className="flex-1 h-1 accent-teal-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={studentSizeRange[1]}
                      onChange={(e) => setStudentSizeRange([studentSizeRange[0], parseInt(e.target.value)])}
                      className="flex-1 h-1 accent-teal-500"
                    />
                  </div>
                </div>
                
                {/* Instructional Spend Range */}
                <div className="space-y-1">
                  <label className="text-xs text-[var(--text-secondary)] flex justify-between">
                    <span>Instr. $/Student</span>
                    <span>${instructionalSpendRange[0].toLocaleString()} – ${instructionalSpendRange[1].toLocaleString()}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="500"
                      value={instructionalSpendRange[0]}
                      onChange={(e) => setInstructionalSpendRange([parseInt(e.target.value), instructionalSpendRange[1]])}
                      className="flex-1 h-1 accent-amber-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="500"
                      value={instructionalSpendRange[1]}
                      onChange={(e) => setInstructionalSpendRange([instructionalSpendRange[0], parseInt(e.target.value)])}
                      className="flex-1 h-1 accent-amber-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Active Filter Badges */}
              {(selectedCollegeTypes.length > 0 || selectedOwnerships.length > 0 || 
                pellRateRange[0] > 0 || pellRateRange[1] < 100 || 
                studentSizeRange[0] > 0 || studentSizeRange[1] < 100000 ||
                instructionalSpendRange[0] > 0 || instructionalSpendRange[1] < 50000) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCollegeTypes.map((code) => {
                    const type = equityPerformanceData.available_college_types?.find(t => t.code === code);
                    return (
                      <span key={`type-${code}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-xs text-purple-300">
                        {type?.label || `Type ${code}`}
                        <button onClick={() => setSelectedCollegeTypes(selectedCollegeTypes.filter(c => c !== code))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                  {selectedOwnerships.map((code) => {
                    const type = equityPerformanceData.available_ownerships?.find(t => t.code === code);
                    return (
                      <span key={`own-${code}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/20 text-xs text-teal-300">
                        {type?.label || `Ownership ${code}`}
                        <button onClick={() => setSelectedOwnerships(selectedOwnerships.filter(c => c !== code))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                  {(pellRateRange[0] > 0 || pellRateRange[1] < 100) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-xs text-purple-300">
                      Pell: {pellRateRange[0]}–{pellRateRange[1]}%
                      <button onClick={() => setPellRateRange([0, 100])} className="hover:text-white">×</button>
                    </span>
                  )}
                  {(studentSizeRange[0] > 0 || studentSizeRange[1] < 100000) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/20 text-xs text-teal-300">
                      Students: {studentSizeRange[0].toLocaleString()}–{studentSizeRange[1].toLocaleString()}
                      <button onClick={() => setStudentSizeRange([0, 100000])} className="hover:text-white">×</button>
                    </span>
                  )}
                  {(instructionalSpendRange[0] > 0 || instructionalSpendRange[1] < 50000) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-xs text-amber-300">
                      Instr. $: ${instructionalSpendRange[0].toLocaleString()}–${instructionalSpendRange[1].toLocaleString()}
                      <button onClick={() => setInstructionalSpendRange([0, 50000])} className="hover:text-white">×</button>
                    </span>
                  )}
                  <button 
                    onClick={() => { 
                      setSelectedCollegeTypes([]); 
                      setSelectedOwnerships([]); 
                      setPellRateRange([0, 100]);
                      setStudentSizeRange([0, 100000]);
                      setInstructionalSpendRange([0, 50000]);
                    }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {/* Clickable Quadrant legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button 
                  onClick={() => setQuadrantFilter('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    quadrantFilter === 'all' 
                      ? 'bg-white/10 ring-2 ring-white/30' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500" />
                  <span className="text-caption">All ({equityPerformanceData.summary.total_schools})</span>
                </button>
                <button 
                  onClick={() => setQuadrantFilter('equity_champion')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    quadrantFilter === 'equity_champion' 
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50' 
                      : 'hover:bg-emerald-500/10'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <span className="text-caption">Equity Champions ({equityPerformanceData.summary.equity_champions})</span>
                </button>
                <button 
                  onClick={() => setQuadrantFilter('value_add_focus')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    quadrantFilter === 'value_add_focus' 
                      ? 'bg-blue-500/20 ring-2 ring-blue-500/50' 
                      : 'hover:bg-blue-500/10'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-caption">Value-Add Focus ({equityPerformanceData.summary.value_add_focus})</span>
                </button>
                <button 
                  onClick={() => setQuadrantFilter('equity_success')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    quadrantFilter === 'equity_success' 
                      ? 'bg-amber-500/20 ring-2 ring-amber-500/50' 
                      : 'hover:bg-amber-500/10'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  <span className="text-caption">Equity Success ({equityPerformanceData.summary.equity_success})</span>
                </button>
                <button 
                  onClick={() => setQuadrantFilter('at_risk')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    quadrantFilter === 'at_risk' 
                      ? 'bg-red-500/20 ring-2 ring-red-500/50' 
                      : 'hover:bg-red-500/10'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E31937' }} />
                  <span className="text-caption">At-Risk ({equityPerformanceData.summary.at_risk})</span>
                </button>
              </div>
              
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      type="number" 
                      dataKey={xAxisConfig.dataKey} 
                      name={xAxisConfig.label}
                      domain={xAxisMetric === 'completion_gap' ? axisDomains.x : xAxisConfig.domain}
                      tickFormatter={xAxisConfig.formatter}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      label={{ 
                        value: xAxisConfig.label, 
                        position: 'bottom', 
                        fill: 'rgba(255,255,255,0.5)',
                        fontSize: 12
                      }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="bending_curve_pct" 
                      name="Bending Curve"
                      domain={axisDomains.y}
                      tickFormatter={(v) => `${v}%`}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      label={{ 
                        value: 'Bending the Curve (Value-Add →)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        fill: 'rgba(255,255,255,0.5)',
                        fontSize: 12
                      }}
                    />
                    <ZAxis type="number" dataKey="student_size" range={[30, 200]} />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          const quadrantLabels: Record<string, string> = {
                            'equity_champion': 'Equity Champion',
                            'value_add_focus': 'Value-Add Focus',
                            'at_risk': 'At-Risk',
                            'equity_success': 'Equity Success'
                          };
                          const quadrantLabel = quadrantLabels[data.quadrant as string] || data.quadrant;
                          
                          return (
                            <div className="chart-tooltip max-w-xs">
                              {/* Header with name and rank */}
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                  <p className="text-title text-[var(--text-primary)] leading-tight">{data.name}</p>
                                  <p className="text-caption">{data.state}</p>
                                </div>
                                {data.rank && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10">#{data.rank}</span>
                                )}
                              </div>
                              
                              {/* College Info */}
                              <div className="text-xs space-y-0.5 mb-2 opacity-80">
                                <p>{data.college_type || 'Unknown Type'}</p>
                                <p>{data.ownership || 'Unknown'}</p>
                              </div>
                              
                              {/* Quick Stats */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                                <p><span className="opacity-60">Students:</span> {data.student_size?.toLocaleString() || 'N/A'}</p>
                                <p><span className="opacity-60">Pell Rate:</span> {data.pell_rate ? `${(data.pell_rate * 100).toFixed(0)}%` : 'N/A'}</p>
                              </div>
                              
                              {/* Matrix Position */}
                              <div className="border-t border-white/10 pt-2 mb-2">
                                <p className="text-xs font-medium mb-1" style={{ color: data.quadrant === 'equity_champion' ? '#10b981' : data.quadrant === 'value_add_focus' ? '#3b82f6' : data.quadrant === 'at_risk' ? '#E31937' : '#f59e0b' }}>
                                  {quadrantLabel}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 text-xs">
                                  <p><span className="opacity-60">Pell Gap:</span> <span className={data.pell_gap_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{data.pell_gap_pct?.toFixed(1)}%</span></p>
                                  <p><span className="opacity-60">Bending:</span> <span className={data.bending_curve_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>{data.bending_curve_pct?.toFixed(1)}%</span></p>
                                </div>
                              </div>
                              
                              {/* Performance Metrics */}
                              <div className="border-t border-white/10 pt-2 text-xs">
                                <p className="opacity-60 mb-1">Performance Metrics</p>
                                <div className="space-y-0.5">
                                  {data.retention_rate && <p><span className="opacity-60">Retention:</span> {(data.retention_rate * 100).toFixed(0)}%</p>}
                                  {data.pell_completion && <p><span className="opacity-60">Pell Completion:</span> {(data.pell_completion * 100).toFixed(0)}%</p>}
                                  {data.non_pell_completion && <p><span className="opacity-60">Non-Pell Completion:</span> {(data.non_pell_completion * 100).toFixed(0)}%</p>}
                                  {data.instructional_spend && <p><span className="opacity-60">Instructional $/Student:</span> ${data.instructional_spend.toLocaleString()}</p>}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      name="Schools" 
                      data={matrixData?.schools || []}
                      onClick={(data) => {
                        if (data && data.payload) {
                          setSelectedSchool(data.payload);
                        }
                      }}
                      cursor="pointer"
                    >
                      {(matrixData?.schools || []).map((school: { id: number; name: string; state: string; pell_gap_pct: number; bending_curve_pct: number; quadrant: string; pell_rate: number; student_size: number; actual_completion?: number; expected_completion?: number }, index: number) => {
                        const getColor = (quadrant: string) => {
                          switch (quadrant) {
                            case 'equity_champion': return '#10b981';
                            case 'value_add_focus': return '#3b82f6';
                            case 'equity_success': return '#f59e0b';
                            case 'at_risk': return '#E31937';
                            default: return '#6b7280';
                          }
                        };
                        const isSelected = selectedSchool?.id === school.id;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getColor(school.quadrant)}
                            stroke={isSelected ? '#fff' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                            fillOpacity={isSelected ? 1 : 0.7}
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <p className="text-caption mt-4 text-center">
                Correlation: r = {equityPerformanceData.summary.correlation?.toFixed(3) || 'N/A'} 
                (These dimensions are largely independent)
              </p>
              
              {/* Selected School Details */}
              {selectedSchool && (
                <div className="mt-6 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                          {selectedSchool.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          selectedSchool.quadrant === 'equity_champion' ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedSchool.quadrant === 'value_add_focus' ? 'bg-blue-500/20 text-blue-400' :
                          selectedSchool.quadrant === 'equity_success' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedSchool.quadrant === 'equity_champion' ? 'Equity Champion' :
                           selectedSchool.quadrant === 'value_add_focus' ? 'Value-Add Focus' :
                           selectedSchool.quadrant === 'equity_success' ? 'Equity Success' : 'At-Risk'}
                        </span>
                      </div>
                      <p className="text-caption">{selectedSchool.state}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedSchool(null)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <span className="text-caption block">Pell Gap</span>
                      <span className={`text-lg font-semibold ${selectedSchool.pell_gap_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedSchool.pell_gap_pct?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block">Bending Curve</span>
                      <span className={`text-lg font-semibold ${selectedSchool.bending_curve_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedSchool.bending_curve_pct?.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block">Pell Rate</span>
                      <span className="text-lg font-semibold text-[var(--text-primary)]">
                        {(selectedSchool.pell_rate * 100)?.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-caption block">Enrollment</span>
                      <span className="text-lg font-semibold text-[var(--text-primary)]">
                        {selectedSchool.student_size?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* BLOCK 6: Equity Engines - Positive Outliers */}
          {equityEngines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="card col-span-3"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-emerald)]/10 flex items-center justify-center">
                  <Award className="text-[var(--accent-emerald)]" size={20} />
                </div>
                <div>
                  <h3 className="text-title">Equity Engines</h3>
                  <p className="text-caption">Schools breaking the income-achievement correlation</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {equityEngines.slice(0, 10).map((school, idx) => (
                  <div 
                    key={`equity-${idx}`}
                    className="bg-[var(--bg-surface)] border border-[var(--accent-emerald)]/20 rounded-lg p-3"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={school.fullName || school.name}>
                      {school.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[var(--text-muted)]">{school.state}</span>
                      <span className="text-sm font-mono text-[var(--accent-emerald)]">
                        +{school.gap_pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {equityEngines.length === 0 && (
                <p className="text-caption text-center py-4">
                  No equity engine schools found in the current dataset.
                </p>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}
