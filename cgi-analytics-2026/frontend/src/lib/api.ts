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
