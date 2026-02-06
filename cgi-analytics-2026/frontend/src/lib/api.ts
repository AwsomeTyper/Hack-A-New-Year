const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardStats {
  total_schools: number;
  avg_retention: number;
  avg_risk_index: number;
  high_risk_count: number;
  median_earnings: number;
  median_debt: number;
  avg_value_add: number;
}

export interface RiskFactor {
  factor: string;
  value: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RiskExplanation {
  factors: RiskFactor[];
  summary: string;
}

export interface StudentDistribution {
  pell_eligible_students: number;
  at_risk_students: number;
  pell_at_risk_overlap: number;
  recommended_pell_per_student: number;
  pell_per_at_risk_student: number;
  strategy: string;
}

export interface School {
  id: number;
  'school.name': string;
  'school.city': string;
  'school.state': string;
  student_size: number;
  retention_rate: number;
  resilience_risk_index: number;
  earnings_4yr: number;
  median_debt: number;
  admission_rate: number;
  value_add_ratio: number;
  'location.lat': number;
  'location.lon': number;
  risk_explanation?: RiskExplanation;
}

export interface OptimizationResult {
  status: string;
  total_budget: number;
  total_allocated: number;
  budget_utilization: number;
  pell_allocation: number;
  pell_percentage: number;
  // New fields from real Scorecard data optimizer
  schools_funded?: number;
  students_impacted?: number;
  baseline_retained?: number;
  projected_retained?: number;
  additional_retained?: number;
  allocations?: Array<{
    school_id?: number;
    name: string;
    state?: string;
    investment: number;
    student_size?: number;
    base_retention?: number;
    projected_retention?: number;
    retention_improvement?: number;
    risk_index?: number;
    pell_rate?: number;
    student_distribution?: StudentDistribution;
    risk_explanation?: RiskExplanation;
  }>;
}

export interface TrendData {
  years: number[];
  enrollment: number[];
  revenue: number[];
  warning: string;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchSchools(params?: {
  state?: string;
  min_risk?: number;
  max_risk?: number;
  limit?: number;
}): Promise<{ count: number; schools: School[] }> {
  const searchParams = new URLSearchParams();
  if (params?.state) searchParams.set('state', params.state);
  if (params?.min_risk) searchParams.set('min_risk', params.min_risk.toString());
  if (params?.max_risk) searchParams.set('max_risk', params.max_risk.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  const res = await fetch(`${API_BASE}/api/schools?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch schools');
  return res.json();
}

export async function fetchRiskDistribution(): Promise<{ bins: string[]; counts: number[] }> {
  const res = await fetch(`${API_BASE}/api/risk-distribution`);
  if (!res.ok) throw new Error('Failed to fetch risk distribution');
  return res.json();
}

export async function fetchTrends(): Promise<TrendData> {
  const res = await fetch(`${API_BASE}/api/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return res.json();
}

export async function runOptimization(params: {
  budget: number;
  target_sat: number;
  pell_minimum: number;
}): Promise<OptimizationResult> {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run optimization');
  return res.json();
}

export async function fetchGeoData(): Promise<{ schools: School[] }> {
  const res = await fetch(`${API_BASE}/api/geo-data`);
  if (!res.ok) throw new Error('Failed to fetch geo data');
  return res.json();
}

// Utility: Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Utility: Format percentage
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Utility: Format large numbers
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

// Utility: Get risk label
export function getRiskLabel(score: number): { label: string; color: string; class: string } {
  if (score >= 80) return { label: 'Critical', color: '#E31937', class: 'critical' };
  if (score >= 60) return { label: 'High', color: '#ff6b35', class: 'high' };
  if (score >= 40) return { label: 'Medium', color: '#ffc107', class: 'medium' };
  if (score >= 20) return { label: 'Low', color: '#005288', class: 'low' };
  return { label: 'Very Low', color: '#28a745', class: 'very-low' };
}

// =============================================================================
// PELL GRANT ROI - NEW API TYPES AND FUNCTIONS
// =============================================================================

export interface PurchasingPowerData {
  summary: {
    peak_coverage_year: number;
    peak_coverage_pct: number;
    current_coverage_pct: number;
    erosion_pct: number;
  };
  time_series: Array<{
    year: number;
    max_pell_award: number;
    avg_cost_of_attendance: number;
    coverage_percent: number;  // API returns coverage_percent, not coverage_pct
    gap_dollars: number;
  }>;
}

export interface CompletionGapData {
  summary: {
    total_schools_with_data: number;
    avg_gap_pct: number;
    worst_gap_pct: number;
    schools_with_pell_disadvantage: number;
  };
  // API returns 'schools' array, not 'institutions'
  schools: Array<{
    id: number;
    'school.name': string;
    'school.state': string;
    pell_completion_6yr: number;
    nopell_completion_6yr: number;
    completion_gap_pct: number;
    pell_rate: number;
    student_size: number;
  }>;
}

export interface ElasticityData {
  grant_change: number;
  system_wide: Array<{
    grant_change: number;
    total_enrollment_change: number;
    schools_analyzed: number;
  }>;
}

export interface ViabilityData {
  summary: {
    avg_viability_score: number;
    critical_count: number;
    elevated_count: number;
    moderate_count: number;
    stable_count: number;
  };
  at_risk_institutions: Array<{
    id: number;
    'school.name': string;
    'school.state': string;
    viability_score: number;
    viability_risk_level: string;
    pell_rate: number;
    completion_rate: number;
    student_size: number;
  }>;
}

export interface EnrollmentOptimization {
  status: string;
  strategy: string;
  total_budget: number;
  total_allocated: number;
  budget_utilization: number;
  schools_funded: number;
  total_expected_graduates: number;
  avg_cost_per_graduate: number;
  total_pell_students?: number;
  bonus_eligible_schools?: number;
  students_with_micro_grants?: number;
  intervention_lift?: number;
  total_graduates_with_lift?: number;
  allocations: Array<{
    school_id: number;
    school_name: string;
    state: string;
    allocation: number;
    pell_students: number;
    completion_rate: number;
    expected_graduates: number;
    cost_per_graduate?: number;
    performance_bonus?: number;
    emergency_allocation?: number;
  }>;
}

// API returns comparison as array of strategy summaries
export interface StrategySummary {
  strategy: string;
  graduates: number;
  cost_per_grad: number;
  schools_funded: number;
}

// StrategyComparison is an array of StrategySummary
export type StrategyComparison = StrategySummary[];

// Fetch purchasing power time series
export async function fetchPurchasingPower(): Promise<PurchasingPowerData> {
  const res = await fetch(`${API_BASE}/api/metrics/purchasing-power`);
  if (!res.ok) throw new Error('Failed to fetch purchasing power');
  return res.json();
}

// Fetch completion gap data
export async function fetchCompletionGap(limit = 50): Promise<CompletionGapData> {
  const res = await fetch(`${API_BASE}/api/metrics/completion-gap?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch completion gap');
  return res.json();
}

// Fetch price elasticity simulation
export async function fetchElasticity(grantChange = 1000): Promise<ElasticityData> {
  const res = await fetch(`${API_BASE}/api/predict/elasticity?grant_change=${grantChange}`);
  if (!res.ok) throw new Error('Failed to fetch elasticity');
  return res.json();
}

// Fetch institutional viability
export async function fetchViability(maxScore?: number): Promise<ViabilityData> {
  const url = maxScore 
    ? `${API_BASE}/api/predict/viability?max_score=${maxScore}` 
    : `${API_BASE}/api/predict/viability`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch viability');
  return res.json();
}

// Run enrollment optimization
export async function runEnrollmentOptimization(params: {
  budget?: number;
  strategy?: 'base' | 'performance' | 'retention_trigger';
  compare?: boolean;
}): Promise<EnrollmentOptimization | StrategyComparison> {
  const searchParams = new URLSearchParams();
  if (params.budget) searchParams.set('budget', params.budget.toString());
  if (params.strategy) searchParams.set('strategy', params.strategy);
  if (params.compare) searchParams.set('compare', 'true');
  
  const res = await fetch(`${API_BASE}/api/optimize/enrollment?${searchParams}`);
  if (!res.ok) throw new Error('Failed to run optimization');
  return res.json();
}

// Equity Performance for Pell Gap vs Bending Curve scatter plot
export interface EquityPerformanceSchool {
  id: number;
  name: string;
  state: string;
  pell_gap_pct: number;    // X-axis
  bending_curve_pct: number;  // Y-axis
  quadrant: 'equity_champion' | 'value_add_focus' | 'at_risk' | 'equity_success';
  pell_rate: number;
  student_size: number;
  actual_completion?: number;
  expected_completion?: number;
  // New fields for enhanced tooltip
  college_type?: string;
  ownership?: string;
  retention_rate?: number;
  instructional_spend?: number;
  first_gen_share?: number;
  pell_completion?: number;
  non_pell_completion?: number;
  rank?: number;
  composite_score?: number;
  median_earnings?: number;
  // Bias-adjusted fields
  transfer_adjusted_completion?: number;
  earnings_10yr?: number;
  earnings_col_adjusted?: number;
  earnings_value_add?: number;
  earnings_value_add_pct?: number;
}

export interface EquityPerformanceData {
  summary: {
    total_schools: number;
    equity_champions: number;
    value_add_focus: number;
    at_risk: number;
    equity_success: number;
    correlation: number | null;
  };
  available_states: string[];
  available_college_types: { code: number; label: string }[];
  available_ownerships: { code: number; label: string }[];
  schools: EquityPerformanceSchool[];
}

// Fetch equity performance (Pell Gap vs Bending Curve)
export async function fetchEquityPerformance(params?: {
  limit?: number;
  state?: string;
  search?: string;
  quadrant?: string;
  college_types?: number[];  // Carnegie classification codes
  ownerships?: number[];  // Ownership codes (1=Public, 2=Private NP, 3=Private FP)
  pell_rate_min?: number;
  pell_rate_max?: number;
  student_size_min?: number;
  student_size_max?: number;
  instructional_spend_min?: number;
  instructional_spend_max?: number;
}): Promise<EquityPerformanceData> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.state && params.state !== 'all') searchParams.set('state', params.state);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.quadrant && params.quadrant !== 'all') searchParams.set('quadrant', params.quadrant);
  if (params?.college_types?.length) searchParams.set('college_types', params.college_types.join(','));
  if (params?.ownerships?.length) searchParams.set('ownerships', params.ownerships.join(','));
  if (params?.pell_rate_min !== undefined) searchParams.set('pell_rate_min', params.pell_rate_min.toString());
  if (params?.pell_rate_max !== undefined) searchParams.set('pell_rate_max', params.pell_rate_max.toString());
  if (params?.student_size_min !== undefined) searchParams.set('student_size_min', params.student_size_min.toString());
  if (params?.student_size_max !== undefined) searchParams.set('student_size_max', params.student_size_max.toString());
  if (params?.instructional_spend_min !== undefined) searchParams.set('instructional_spend_min', params.instructional_spend_min.toString());
  if (params?.instructional_spend_max !== undefined) searchParams.set('instructional_spend_max', params.instructional_spend_max.toString());
  
  const res = await fetch(`${API_BASE}/api/metrics/equity-performance?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch equity performance');
  return res.json();
}

