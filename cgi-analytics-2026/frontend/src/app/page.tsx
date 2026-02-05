'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import EvidenceSection from '@/components/sections/EvidenceSection';
import OptimizerSection from '@/components/sections/OptimizerSection';
import ImpactSection from '@/components/sections/ImpactSection';
import { 
  fetchPurchasingPower, 
  fetchCompletionGap, 
  fetchViability,
  fetchElasticity,
  fetchEquityPerformance,
  type PurchasingPowerData,
  type CompletionGapData,
  type ViabilityData,
  type ElasticityData,
  type EquityPerformanceData
} from '@/lib/api';

export default function PolicyBrief() {
  const [purchasingPower, setPurchasingPower] = useState<PurchasingPowerData | null>(null);
  const [completionGap, setCompletionGap] = useState<CompletionGapData | null>(null);
  const [viability, setViability] = useState<ViabilityData | null>(null);
  const [elasticity, setElasticity] = useState<ElasticityData | null>(null);
  const [equityPerformance, setEquityPerformance] = useState<EquityPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [ppData, cgData, vData, elData, eqData] = await Promise.all([
          fetchPurchasingPower(),
          fetchCompletionGap(100),
          fetchViability(),
          fetchElasticity(1000),
          fetchEquityPerformance({ limit: 400 })
        ]);
        setPurchasingPower(ppData);
        setCompletionGap(cgData);
        setViability(vData);
        setElasticity(elData);
        setEquityPerformance(eqData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load dashboard data. Please ensure the API is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-caption">Loading policy brief...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-title text-[var(--accent-red)] mb-2">Connection Error</h2>
          <p className="text-body mb-4">{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data for components
  const currentCoverage = purchasingPower?.summary.current_coverage_pct || 25;
  const historicalCoverage = purchasingPower?.summary.peak_coverage_pct || 61;
  const totalErosion = purchasingPower?.summary.erosion_pct || -36;
  
  // Map time_series data - API uses coverage_percent, not coverage_pct
  const purchasingPowerTimeSeries = purchasingPower?.time_series.map(d => ({
    year: d.year,
    coverage_pct: d.coverage_percent  // Map to expected prop name
  })) || [];

  // Map completion gap data - API uses 'schools' array with 'school.name' field
  const completionGapInstitutions = completionGap?.schools?.map(d => ({
    name: (d['school.name'] || '').length > 35 
      ? (d['school.name'] || '').substring(0, 35) + '...' 
      : (d['school.name'] || ''),
    fullName: d['school.name'] || '',
    state: d['school.state'] || '',
    gap_pct: d.completion_gap_pct,
    pell_rate: d.pell_completion_6yr * 100,
    nopell_rate: d.nopell_completion_6yr * 100,
    student_size: d.student_size || 0
  })) || [];

  const atRiskCount = viability?.at_risk_institutions?.length || 0;
  const avgCompletionGap = completionGap?.summary.avg_gap_pct || 0;
  
  // Viability risk distribution for predictive insights
  const viabilitySummary = viability?.summary || {
    critical_count: 0,
    elevated_count: 0,
    moderate_count: 0,
    stable_count: 0
  };

  // Elasticity insight - enrollment change per $1000 grant increase
  const elasticityImpact = elasticity?.system_wide?.find(e => e.grant_change === 1000)?.total_enrollment_change || 370000;

  return (
    <main className="bg-[var(--bg-void)]">
      <HeroSection 
        currentCoverage={Math.round(currentCoverage)}
        historicalCoverage={Math.round(historicalCoverage)}
      />
      <EvidenceSection 
        purchasingPowerData={purchasingPowerTimeSeries}
        completionGapData={completionGapInstitutions}
        atRiskCount={atRiskCount}
        avgCompletionGap={avgCompletionGap}
        totalErosion={Math.round(totalErosion)}
        viabilitySummary={viabilitySummary}
        elasticityImpact={elasticityImpact}
        equityPerformanceData={equityPerformance}
      />
      <OptimizerSection />
      <ImpactSection />
    </main>
  );
}
