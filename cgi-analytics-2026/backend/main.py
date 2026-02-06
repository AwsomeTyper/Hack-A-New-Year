"""
FastAPI Backend Server for University Resilience Suite
Provides REST API for dashboard data, predictions, and optimization.
"""
import os
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

# Import our modules
from data_pipeline import run_pipeline, DATA_DIR, calculate_purchasing_power
from retention_model import predict_retention, MODELS_DIR, load_data
from optimizer import run_scenario, PellGrantOptimizer
from predictive_models import PellGrantPredictor, PriceElasticityModel

# Initialize predictive models (will train on first use)
pell_predictor = None

def get_pell_predictor():
    """Lazy-load and train the Pell Grant predictor."""
    global pell_predictor
    if pell_predictor is None:
        pell_predictor = PellGrantPredictor()
        pell_predictor.train()
    return pell_predictor

app = FastAPI(
    title="Project Aegis API",
    description="University Resilience Suite - Strategic Analytics for Higher Education",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# DATA MODELS
# ============================================================================

class SchoolQuery(BaseModel):
    state: Optional[str] = None
    min_size: Optional[int] = None
    max_size: Optional[int] = None
    max_risk: Optional[float] = None


class PredictionRequest(BaseModel):
    net_price_low_income: float
    median_debt: float
    admission_rate: float
    pell_rate: float
    geographic_isolation: float
    student_size: float
    value_add_ratio: float


class ScenarioRequest(BaseModel):
    budget: float = 5_000_000
    target_sat: float = 1100
    pell_minimum: float = 0.40


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_processed_data() -> pd.DataFrame:
    """Load processed scorecard data, running pipeline if needed."""
    data_file = DATA_DIR / 'scorecard_processed.csv'
    
    if not data_file.exists():
        print("Data not found, running pipeline...")
        run_pipeline()
    
    return pd.read_csv(data_file)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API health check."""
    return {
        "name": "Project Aegis API",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/api/stats")
async def get_dashboard_stats():
    """Get aggregate statistics for dashboard KPIs."""
    df = get_processed_data()
    
    return {
        "total_schools": len(df),
        "avg_retention": float(df['retention_rate'].mean()),
        "avg_risk_index": float(df['resilience_risk_index'].mean()),
        "high_risk_count": int((df['resilience_risk_index'] > 70).sum()),
        "median_earnings": float(df['earnings_4yr'].median()),
        "median_debt": float(df['median_debt'].median()),
        "avg_value_add": float(df['value_add_ratio'].mean()),
    }


# ============================================================================
# DESCRIPTIVE ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/api/metrics/purchasing-power")
async def get_purchasing_power():
    """
    Get the 'Purchasing Power Gap' showing Pell Grant erosion over time.
    This is a key narrative metric showing how the grant's real value has declined.
    """
    try:
        data = calculate_purchasing_power()
        return data
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/completion-gap")
async def get_completion_gap(
    min_gap: Optional[float] = None,
    limit: int = Query(default=50, le=200)
):
    """
    Get institutional Completion Gap data (Pell vs Non-Pell graduation rates).
    Negative gap = Pell students graduate at lower rates.
    """
    df = get_processed_data()
    
    # Filter to schools with valid completion gap data
    gap_df = df[df['completion_gap'].notna()].copy()
    
    if min_gap is not None:
        # Filter to schools with gap worse than threshold (more negative)
        gap_df = gap_df[gap_df['completion_gap'] <= min_gap]
    
    # Sort by gap (worst first - most negative)
    gap_df = gap_df.sort_values('completion_gap', ascending=True)
    
    # Limit results
    gap_df = gap_df.head(limit)
    
    # Prepare response
    result = gap_df[[
        'id', 'school.name', 'school.state',
        'pell_completion_6yr', 'nopell_completion_6yr', 
        'completion_gap', 'completion_gap_pct',
        'pell_rate', 'student_size'
    ]].to_dict('records')
    
    # Clean NaN values
    for row in result:
        for key, val in row.items():
            if pd.isna(val):
                row[key] = None
    
    # Calculate summary stats (handle NaN properly)
    def safe_float(val):
        """Convert to float, return None if NaN."""
        if pd.isna(val):
            return None
        return float(val)
    
    summary = {
        "total_schools_with_data": len(df[df['completion_gap'].notna()]) if 'completion_gap' in df.columns else 0,
        "avg_gap_pct": safe_float(df['completion_gap_pct'].mean()) if 'completion_gap_pct' in df.columns else None,
        "worst_gap_pct": safe_float(df['completion_gap_pct'].min()) if 'completion_gap_pct' in df.columns else None,
        "schools_with_pell_disadvantage": int((df['completion_gap'] < 0).sum()) if 'completion_gap' in df.columns and df['completion_gap'].notna().any() else 0
    }
    
    return {
        "summary": summary,
        "count": len(result),
        "schools": result
    }


@app.get("/api/metrics/vertical-equity")
async def get_vertical_equity(limit: int = Query(default=50, le=200)):
    """
    Get Vertical Equity scores showing if funding reaches those with highest unmet need.
    Higher score = more equitable funding distribution.
    """
    df = get_processed_data()
    
    # Filter to schools with valid equity score
    equity_df = df[df['vertical_equity_score'].notna()].copy()
    
    # Get top and bottom performers
    top_equity = equity_df.nlargest(limit // 2, 'vertical_equity_score')
    bottom_equity = equity_df.nsmallest(limit // 2, 'vertical_equity_score')
    
    def prepare_result(subset):
        result = subset[[
            'id', 'school.name', 'school.state',
            'vertical_equity_score', 'pell_rate', 
            'net_price_low_income', 'student_size'
        ]].to_dict('records')
        for row in result:
            for key, val in row.items():
                if pd.isna(val):
                    row[key] = None
        return result
    
    return {
        "summary": {
            "avg_equity_score": float(df['vertical_equity_score'].mean()),
            "median_equity_score": float(df['vertical_equity_score'].median()),
        },
        "top_performers": prepare_result(top_equity),
        "bottom_performers": prepare_result(bottom_equity)
    }


@app.get("/api/metrics/bending-curve")
async def get_bending_curve(
    limit: int = Query(default=50, le=200),
    min_bc: Optional[float] = Query(default=None, description="Minimum BC score filter")
):
    """
    Get 'Bending the Curve' scores showing adjusted graduation performance.
    
    BC = Actual Graduation Rate - Expected Graduation Rate
    - Positive BC = school exceeds expectations (true value-add)
    - Negative BC = school underperforms given its student body
    
    Based on Galvao, Tucker & Attewell (2025).
    """
    df = get_processed_data()
    
    # Filter to schools with valid BC
    bc_df = df[df['bending_curve'].notna()].copy()
    
    if min_bc is not None:
        bc_df = bc_df[bc_df['bending_curve'] >= min_bc]
    
    # Sort by BC descending (best performers first)
    bc_df = bc_df.sort_values('bending_curve', ascending=False).head(limit)
    
    def safe_float(val):
        """Convert to float, return None if NaN."""
        if pd.isna(val):
            return None
        return float(val)
    
    results = []
    for _, row in bc_df.iterrows():
        results.append({
            "id": row.get('id'),
            "name": row.get('school.name'),
            "state": row.get('school.state'),
            "bending_curve": safe_float(row.get('bending_curve')),
            "bending_curve_pct": safe_float(row.get('bending_curve_pct')),
            "actual_completion_rate": safe_float(row.get('completion_rate')),
            "expected_completion_rate": safe_float(row.get('expected_completion_rate')),
            "pell_rate": safe_float(row.get('pell_rate')),
            "student_size": safe_float(row.get('student_size'))
        })
    
    # Summary statistics
    all_bc = df['bending_curve'].dropna()
    
    return {
        "summary": {
            "mean_bc": safe_float(all_bc.mean()),
            "median_bc": safe_float(all_bc.median()),
            "std_bc": safe_float(all_bc.std()),
            "schools_exceeding_expectations": int((all_bc > 0).sum()),
            "schools_below_expectations": int((all_bc < 0).sum()),
            "total_schools_analyzed": int(len(all_bc))
        },
        "schools": results
    }


@app.get("/api/metrics/equity-performance")
async def get_equity_performance(
    limit: int = Query(default=5000, le=10000),  # Show all schools by default
    state: Optional[str] = None,
    search: Optional[str] = None,
    quadrant: Optional[str] = None,  # Filter by quadrant for legend click
    college_types: Optional[str] = None,  # Comma-separated Carnegie codes (1,2,3...)
    ownerships: Optional[str] = None,  # Comma-separated ownership codes (1,2,3)
    pell_rate_min: Optional[float] = None,  # Min Pell grant rate (0.0-1.0)
    pell_rate_max: Optional[float] = None,  # Max Pell grant rate (0.0-1.0)
    student_size_min: Optional[int] = None,  # Min student enrollment
    student_size_max: Optional[int] = None,  # Max student enrollment
    instructional_spend_min: Optional[int] = None,  # Min instructional spend per student
    instructional_spend_max: Optional[int] = None,  # Max instructional spend per student
):
    """
    Get combined Pell Gap and Bending the Curve data for scatter plot.
    
    Returns stratified sample prioritizing:
    1. Outliers (extreme values on both axes)
    2. Largest schools by enrollment
    3. Balanced representation from each quadrant
    
    Parameters:
    - limit: Max schools to return
    - state: Filter by state code
    - search: Filter by school name
    - quadrant: Filter by specific quadrant (equity_champion, value_add_focus, at_risk, equity_success)
    """
    df = get_processed_data()
    
    # Filter to schools with both metrics
    scatter_df = df[
        df['completion_gap_pct'].notna() & 
        df['bending_curve_pct'].notna()
    ].copy()
    
    # Apply state filter if provided
    if state and state != 'all':
        scatter_df = scatter_df[scatter_df['school.state'] == state]
    
    # Apply search filter if provided
    if search:
        search_lower = search.lower()
        scatter_df = scatter_df[
            scatter_df['school.name'].str.lower().str.contains(search_lower, na=False)
        ]
    
    # Apply college type filter (Carnegie classification)
    if college_types:
        type_codes = [int(c.strip()) for c in college_types.split(',') if c.strip().isdigit()]
        if type_codes:
            scatter_df = scatter_df[scatter_df['school.carnegie_basic'].isin(type_codes)]
    
    # Apply ownership filter
    if ownerships:
        ownership_codes = [int(c.strip()) for c in ownerships.split(',') if c.strip().isdigit()]
        if ownership_codes:
            scatter_df = scatter_df[scatter_df['school.ownership'].isin(ownership_codes)]
    
    # Apply Pell rate range filters
    if pell_rate_min is not None:
        scatter_df = scatter_df[scatter_df['pell_rate'] >= pell_rate_min]
    if pell_rate_max is not None:
        scatter_df = scatter_df[scatter_df['pell_rate'] <= pell_rate_max]
    
    # Apply student size range filters
    if student_size_min is not None:
        scatter_df = scatter_df[scatter_df['latest.student.size'] >= student_size_min]
    if student_size_max is not None:
        scatter_df = scatter_df[scatter_df['latest.student.size'] <= student_size_max]
    
    # Apply instructional spend range filters
    if instructional_spend_min is not None:
        scatter_df = scatter_df[scatter_df['latest.academics.program_percentage.education'] >= instructional_spend_min]
    if instructional_spend_max is not None:
        scatter_df = scatter_df[scatter_df['latest.academics.program_percentage.education'] <= instructional_spend_max]
    
    # Assign quadrants
    scatter_df['quadrant'] = scatter_df.apply(
        lambda row: (
            'equity_champion' if row['completion_gap_pct'] >= 0 and row['bending_curve_pct'] >= 0 else
            'value_add_focus' if row['completion_gap_pct'] < 0 and row['bending_curve_pct'] >= 0 else
            'at_risk' if row['completion_gap_pct'] < 0 and row['bending_curve_pct'] < 0 else
            'equity_success'
        ), axis=1
    )
    
    # Count schools in each quadrant BEFORE any quadrant filtering (for summary stats)
    quadrant_counts = {
        "equity_champions": int(((scatter_df['completion_gap_pct'] >= 0) & (scatter_df['bending_curve_pct'] >= 0)).sum()),
        "value_add_focus": int(((scatter_df['completion_gap_pct'] < 0) & (scatter_df['bending_curve_pct'] >= 0)).sum()),
        "at_risk": int(((scatter_df['completion_gap_pct'] < 0) & (scatter_df['bending_curve_pct'] < 0)).sum()),
        "equity_success": int(((scatter_df['completion_gap_pct'] >= 0) & (scatter_df['bending_curve_pct'] < 0)).sum()),
    }
    total_before_quadrant_filter = len(scatter_df)
    
    # Apply quadrant filter if provided (for legend click zoom)
    if quadrant and quadrant != 'all':
        scatter_df = scatter_df[scatter_df['quadrant'] == quadrant]
        # When filtering by quadrant, return ALL schools in that quadrant (up to limit)
        result_df = scatter_df.head(limit)
    else:
        # STRATIFIED SAMPLING: Prioritize outliers, large schools, and balanced quadrants
        
        # 1. Identify outliers (top/bottom 5% on each axis)
        pell_gap_low = scatter_df['completion_gap_pct'].quantile(0.05)
        pell_gap_high = scatter_df['completion_gap_pct'].quantile(0.95)
        bending_low = scatter_df['bending_curve_pct'].quantile(0.05)
        bending_high = scatter_df['bending_curve_pct'].quantile(0.95)
        
        outliers = scatter_df[
            (scatter_df['completion_gap_pct'] <= pell_gap_low) |
            (scatter_df['completion_gap_pct'] >= pell_gap_high) |
            (scatter_df['bending_curve_pct'] <= bending_low) |
            (scatter_df['bending_curve_pct'] >= bending_high)
        ]
        
        # 2. Identify largest schools (top 10% by enrollment)
        if 'student_size' in scatter_df.columns:
            size_threshold = scatter_df['student_size'].quantile(0.90)
            large_schools = scatter_df[scatter_df['student_size'] >= size_threshold]
        else:
            large_schools = pd.DataFrame()
        
        # 3. Combine priority schools (outliers + large)
        priority_ids = set(outliers.get('id', []).tolist() + large_schools.get('id', []).tolist())
        priority_df = scatter_df[scatter_df['id'].isin(priority_ids)]
        
        # 4. Get remaining budget for balanced sampling from each quadrant
        priority_count = len(priority_df)
        remaining_budget = max(0, limit - priority_count)
        per_quadrant = max(remaining_budget // 4, 10)
        
        balanced_samples = [priority_df]
        already_included = priority_ids
        
        for quad in ['equity_champion', 'value_add_focus', 'at_risk', 'equity_success']:
            q_df = scatter_df[
                (scatter_df['quadrant'] == quad) & 
                (~scatter_df['id'].isin(already_included))
            ]
            sample_size = min(len(q_df), per_quadrant)
            if sample_size > 0:
                sampled = q_df.sample(n=sample_size, random_state=42)
                balanced_samples.append(sampled)
                already_included.update(sampled['id'].tolist())
        
        result_df = pd.concat(balanced_samples, ignore_index=True).drop_duplicates(subset='id')
    
    def safe_float(val):
        if pd.isna(val):
            return None
        return float(val)
    
    def safe_int(val):
        if pd.isna(val):
            return None
        return int(val)
    
    # Carnegie classification decoder
    carnegie_map = {
        1: "Associate's—Public",
        2: "Associate's—Private",
        3: "Associate's—Private For-Profit",
        4: "Baccalaureate/Associate's",
        5: "Baccalaureate—Arts & Sciences",
        6: "Baccalaureate—Diverse Fields",
        7: "Master's—Small Programs",
        8: "Master's—Medium Programs",
        9: "Master's—Large Programs",
        10: "Doctoral—Research/Scholarship",
        11: "Doctoral—Professional Practice",
        12: "Doctoral—Professional/Research",
        13: "Doctoral—Research Intensive",
        14: "Research Universities—Very High",
        15: "Research Universities—High",
        16: "Tribal Colleges",
        17: "Special Focus—2-Year",
        18: "Special Focus—4-Year",
        19: "Special Focus—Faith-Related",
        20: "Special Focus—Medical",
        21: "Special Focus—Business/Management",
        22: "Special Focus—Engineering",
        23: "Special Focus—Other",
    }
    
    ownership_map = {
        1: "Public",
        2: "Private Non-Profit",
        3: "Private For-Profit"
    }
    
    # Calculate ranking based on composite score (higher is better)
    # Score = Pell Gap + Bending Curve (both positive = best, both negative = worst)
    result_df = result_df.copy()
    result_df['composite_score'] = result_df['completion_gap_pct'].fillna(0) + result_df['bending_curve_pct'].fillna(0)
    result_df['rank'] = result_df['composite_score'].rank(ascending=False, method='min').astype(int)
    
    results = []
    for _, row in result_df.iterrows():
        # Determine KPI status (contributing vs not contributing to quadrant)
        pell_gap = safe_float(row.get('completion_gap_pct'))
        bending = safe_float(row.get('bending_curve_pct'))
        
        # KPIs - positive values are generally better
        retention = safe_float(row.get('retention_rate'))
        instr_spend = safe_float(row.get('instruction_per_fte'))
        first_gen = safe_float(row.get('first_gen_share'))
        pell_completion = safe_float(row.get('pell_completion_rate'))
        non_pell_completion = safe_float(row.get('non_pell_completion_rate'))
        
        results.append({
            "id": row.get('id'),
            "name": row.get('school.name'),
            "state": row.get('school.state'),
            "pell_gap_pct": pell_gap,
            "bending_curve_pct": bending,
            "quadrant": row.get('quadrant'),
            "pell_rate": safe_float(row.get('pell_rate')),
            "student_size": safe_int(row.get('student_size')),
            "actual_completion": safe_float(row.get('completion_rate_6yr')),
            "expected_completion": safe_float(row.get('expected_completion')),
            # New fields for enhanced tooltip
            "college_type": carnegie_map.get(safe_int(row.get('school.carnegie_basic')), "Unknown"),
            "ownership": ownership_map.get(safe_int(row.get('school.ownership')), "Unknown"),
            "retention_rate": retention,
            "instructional_spend": instr_spend,
            "first_gen_share": first_gen,
            "pell_completion": pell_completion,
            "non_pell_completion": non_pell_completion,
            "rank": int(row.get('rank', 0)),
            "composite_score": safe_float(row.get('composite_score')),
            "median_earnings": safe_float(row.get('earnings_4yr')),
            # Bias-adjusted fields (NEW)
            "transfer_adjusted_completion": safe_float(row.get('transfer_adjusted_completion')),
            "earnings_10yr": safe_float(row.get('earnings_10yr')),
            "earnings_col_adjusted": safe_float(row.get('earnings_col_adjusted')),
            "earnings_value_add": safe_float(row.get('earnings_value_add')),
            "earnings_value_add_pct": safe_float(row.get('earnings_value_add_pct')),
        })
    
    # Get available states for filter dropdown (from unfiltered data)
    all_valid = df[df['completion_gap_pct'].notna() & df['bending_curve_pct'].notna()]
    available_states = sorted(all_valid['school.state'].dropna().unique().tolist())
    
    # Get available college types (Carnegie classifications present in data)
    carnegie_map = {
        1: "Doctoral: Very High Research",
        2: "Doctoral: High Research",
        3: "Doctoral/Professional",
        4: "Master's: Larger Programs",
        5: "Master's: Medium Programs",
        6: "Master's: Small Programs",
        7: "Baccalaureate: Arts & Sciences",
        8: "Baccalaureate: Diverse Fields",
        9: "Baccalaureate/Associate's Colleges",
        10: "Associate's: High Transfer-High Traditional",
        11: "Associate's: High Transfer-Mixed Traditional/Nontraditional",
        12: "Associate's: High Transfer-High Nontraditional",
        13: "Associate's: Mixed Transfer/Career & Technical-High Traditional",
        14: "Associate's: Mixed Transfer/Career & Technical-Mixed Traditional/Nontraditional",
        15: "Associate's: Mixed Transfer/Career & Technical-High Nontraditional",
        18: "Special Focus: 2-Year",
        21: "Special Focus: 4-Year",
        22: "Tribal Colleges",
        23: "Baccalaureate/Associate's: Mixed",
        -2: "Not Classified"
    }
    available_carnegie = [
        {"code": int(c), "label": carnegie_map.get(int(c), f"Type {int(c)}")}
        for c in sorted(all_valid['school.carnegie_basic'].dropna().unique())
        if not pd.isna(c)
    ]
    
    # Get available ownership types
    ownership_map = {1: "Public", 2: "Private Non-Profit", 3: "Private For-Profit"}
    available_ownership = [
        {"code": int(c), "label": ownership_map.get(int(c), f"Ownership {int(c)}")}
        for c in sorted(all_valid['school.ownership'].dropna().unique())
        if not pd.isna(c)
    ]
    
    return {
        "summary": {
            "total_schools": total_before_quadrant_filter,
            **quadrant_counts,
            "correlation": safe_float(scatter_df['completion_gap_pct'].corr(scatter_df['bending_curve_pct'])) if len(scatter_df) > 1 else None
        },
        "available_states": available_states,
        "available_college_types": available_carnegie,
        "available_ownerships": available_ownership,
        "schools": results
    }


# ============================================================================
# PREDICTIVE ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/api/predict/elasticity")
async def get_price_elasticity(
    grant_change: int = Query(default=1000, description="Dollar change in Pell grant"),
    limit: int = Query(default=20, le=100)
):
    """
    Simulate enrollment response to Pell Grant changes.
    Returns system-wide and per-institution impacts.
    """
    predictor = get_pell_predictor()
    elasticity_model = predictor.elasticity_model
    df = get_processed_data()
    
    # Get system-wide scenarios
    scenarios = elasticity_model.simulate_grant_scenarios(
        df, 
        grant_changes=[-2000, -1000, 0, grant_change, 2000, 5000]
    )
    
    # Get per-institution breakdown for specific grant change
    df_sim = df.dropna(subset=['student_size', 'net_price_low_income', 'pell_rate']).copy()
    
    institution_results = []
    for _, row in df_sim.head(limit).iterrows():
        pred = elasticity_model.predict_enrollment_change(
            current_enrollment=int(row['student_size']),
            current_net_price=float(row['net_price_low_income']),
            grant_change=grant_change,
            pell_rate=float(row['pell_rate']),
            admission_rate=float(row.get('admission_rate', 0.5) or 0.5)
        )
        institution_results.append({
            'school_name': row.get('school.name'),
            'state': row.get('school.state'),
            **pred
        })
    
    return {
        "grant_change": grant_change,
        "system_wide": scenarios,
        "institution_samples": institution_results
    }


@app.get("/api/predict/dropout-risk")
async def get_dropout_risk(
    min_risk: Optional[float] = None,
    limit: int = Query(default=50, le=200)
):
    """
    Get institutional dropout risk predictions.
    High risk = low completion rate predicted.
    """
    predictor = get_pell_predictor()
    df = get_processed_data()
    
    # Get batch predictions
    df_pred = predictor.dropout_model.predict_batch(df)
    
    if min_risk is not None:
        df_pred = df_pred[df_pred['dropout_risk_prob'] >= min_risk]
    
    # Sort by risk
    df_pred = df_pred.sort_values('dropout_risk_prob', ascending=False).head(limit)
    
    result = df_pred[[
        'id', 'school.name', 'school.state',
        'dropout_risk_prob', 'dropout_risk_level',
        'retention_rate', 'completion_rate', 'pell_rate'
    ]].to_dict('records')
    
    # Clean NaN values
    for row in result:
        for key, val in row.items():
            if pd.isna(val):
                row[key] = None
    
    # Model stats
    stats = predictor.dropout_model.train(df)
    
    return {
        "model_performance": {
            "auc": stats['cv_auc_mean'],
            "high_risk_rate": stats['high_risk_rate'],
            "feature_importance": stats['feature_importance']
        },
        "count": len(result),
        "high_risk_schools": result
    }


@app.get("/api/predict/viability")
async def get_institutional_viability(
    max_score: Optional[float] = None,
    limit: int = Query(default=50, le=200)
):
    """
    Get institutional viability/closure risk assessment.
    Lower score = higher risk of financial distress.
    """
    predictor = get_pell_predictor()
    df = get_processed_data()
    
    # Get viability predictions (on full dataset for summary)
    df_full_pred = predictor.viability_model.predict_batch(df)
    
    # Calculate summary stats from full predicted dataset
    summary = {
        "avg_viability_score": float(df_full_pred['viability_score'].mean()),
        "critical_count": int((df_full_pred['viability_score'] < 40).sum()),
        "elevated_count": int(((df_full_pred['viability_score'] >= 40) & (df_full_pred['viability_score'] < 60)).sum()),
        "moderate_count": int(((df_full_pred['viability_score'] >= 60) & (df_full_pred['viability_score'] < 75)).sum()),
        "stable_count": int((df_full_pred['viability_score'] >= 75).sum())
    }
    
    # Apply max_score filter for result list
    df_filtered = df_full_pred
    if max_score is not None:
        df_filtered = df_full_pred[df_full_pred['viability_score'] <= max_score]
    
    # Sort by viability (lowest first = most at risk)
    df_filtered = df_filtered.sort_values('viability_score', ascending=True).head(limit)
    
    result = df_filtered[[
        'id', 'school.name', 'school.state',
        'viability_score', 'viability_risk_level',
        'pell_rate', 'completion_rate', 'student_size'
    ]].to_dict('records')
    
    # Clean NaN values
    for row in result:
        for key, val in row.items():
            if pd.isna(val):
                row[key] = None
    
    return {
        "summary": summary,
        "count": len(result),
        "at_risk_institutions": result
    }


# =============================================================================
# PHASE 3: PRESCRIPTIVE OPTIMIZATION ENDPOINTS
# =============================================================================

# Singleton optimizer instance
_pell_optimizer = None

def get_pell_optimizer():
    """Lazy-load the Pell Grant Optimizer."""
    global _pell_optimizer
    if _pell_optimizer is None:
        _pell_optimizer = PellGrantOptimizer()
    return _pell_optimizer


@app.get("/api/optimize/enrollment")
async def optimize_enrollment(
    budget: float = Query(default=50_000_000, ge=1_000_000, description="Total budget to allocate"),
    strategy: str = Query(default="base", description="Optimization strategy: 'base', 'performance', or 'retention_trigger'"),
    compare: bool = Query(default=False, description="If true, compare all 3 strategies"),
    performance_bonus_pct: float = Query(default=0.20, ge=0, le=0.50, description="% for performance bonuses"),
    retention_reserve_pct: float = Query(default=0.10, ge=0, le=0.30, description="% for retention micro-grants"),
    limit: int = Query(default=30, le=100, description="Max schools to return")
):
    """
    Optimize Pell Grant allocation across institutions.
    
    Three strategies available:
    - **base**: Proportional allocation by expected graduates (enrollment × completion)
    - **performance**: Base + bonus pool for high Value-Add schools
    - **retention_trigger**: Base + emergency reserve for at-risk student micro-grants
    """
    try:
        optimizer = get_pell_optimizer()
        
        if compare:
            # Run all strategies and compare
            result = optimizer.compare_strategies(budget)
            return result
        
        # Run single strategy
        result = optimizer.run_enrollment_optimization(
            budget=budget,
            strategy=strategy,
            performance_bonus_pct=performance_bonus_pct,
            retention_reserve_pct=retention_reserve_pct
        )
        
        # Limit allocations returned
        if 'allocations' in result:
            result['allocations'] = result['allocations'][:limit]
        
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization error: {str(e)}")


@app.get("/api/schools")
async def get_schools(
    state: Optional[str] = None,
    min_risk: Optional[float] = None,
    max_risk: Optional[float] = None,
    limit: int = Query(default=100, le=500)
):
    """Get list of schools with optional filters and risk explanations."""
    df = get_processed_data()
    
    # Parse risk_explanation from string to dict
    if 'risk_explanation' in df.columns:
        import ast
        def parse_risk_explanation(val):
            if pd.isna(val):
                return {"factors": [], "summary": "Low risk"}
            try:
                return ast.literal_eval(val)
            except:
                return {"factors": [], "summary": "Low risk"}
        df['risk_explanation'] = df['risk_explanation'].apply(parse_risk_explanation)
    
    # Apply filters
    if state:
        df = df[df['school.state'] == state.upper()]
    if min_risk is not None:
        df = df[df['resilience_risk_index'] >= min_risk]
    if max_risk is not None:
        df = df[df['resilience_risk_index'] <= max_risk]
    
    # Sort by risk (highest first)
    df = df.sort_values('resilience_risk_index', ascending=False)
    
    # Limit results
    df = df.head(limit)
    
    # Select columns for response
    columns = [
        'id', 'school.name', 'school.city', 'school.state',
        'student_size', 'retention_rate', 'resilience_risk_index',
        'earnings_4yr', 'median_debt', 'admission_rate', 'pell_rate',
        'value_add_ratio', 'location.lat', 'location.lon', 'risk_explanation'
    ]
    
    # Only include columns that exist
    columns = [c for c in columns if c in df.columns]
    
    result = df[columns].to_dict('records')
    
    # Clean NaN values for JSON
    for row in result:
        for key, val in row.items():
            if pd.isna(val):
                row[key] = None
    
    return {
        "count": len(result),
        "schools": result
    }


@app.get("/api/school/{school_id}")
async def get_school_detail(school_id: int):
    """Get detailed information for a specific school."""
    df = get_processed_data()
    
    school = df[df['id'] == school_id]
    
    if len(school) == 0:
        raise HTTPException(status_code=404, detail="School not found")
    
    school_data = school.iloc[0].to_dict()
    
    # Clean NaN values
    for key, val in school_data.items():
        if pd.isna(val):
            school_data[key] = None
    
    # Get peer schools (similar Carnegie classification and size)
    carnegie = school_data.get('school.carnegie_basic')
    size = school_data.get('student_size', 5000)
    
    peers = df[
        (df['school.carnegie_basic'] == carnegie) &
        (df['id'] != school_id) &
        (df['student_size'].between(size * 0.5, size * 2))
    ].head(5)
    
    peer_list = peers[['school.name', 'retention_rate', 'resilience_risk_index']].to_dict('records')
    
    return {
        "school": school_data,
        "peers": peer_list
    }


@app.get("/api/risk-distribution")
async def get_risk_distribution():
    """Get risk distribution for histogram visualization."""
    df = get_processed_data()
    
    # Create bins
    bins = [0, 20, 40, 60, 80, 100]
    labels = ['Very Low', 'Low', 'Medium', 'High', 'Critical']
    
    df['risk_category'] = pd.cut(
        df['resilience_risk_index'],
        bins=bins,
        labels=labels,
        include_lowest=True
    )
    
    distribution = df['risk_category'].value_counts().to_dict()
    
    return {
        "bins": labels,
        "counts": [distribution.get(label, 0) for label in labels]
    }


@app.get("/api/geo-data")
async def get_geo_data():
    """Get geographic data for map visualization."""
    df = get_processed_data()
    
    # Filter to schools with valid coordinates
    df = df.dropna(subset=['location.lat', 'location.lon'])
    
    geo_data = df[[
        'id', 'school.name', 'school.state',
        'location.lat', 'location.lon',
        'student_size', 'resilience_risk_index', 'net_price_low_income'
    ]].to_dict('records')
    
    # Clean NaN
    for row in geo_data:
        for key, val in row.items():
            if pd.isna(val):
                row[key] = None
    
    return {"schools": geo_data}


@app.post("/api/predict")
async def predict_retention_endpoint(request: PredictionRequest):
    """Predict retention rate for given school characteristics."""
    try:
        result = predict_retention(request.dict())
        return result
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run retention_model.py first."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model-info")
async def get_model_info():
    """Get information about the trained model."""
    analysis_file = MODELS_DIR / 'model_analysis.json'
    
    if not analysis_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Model analysis not found. Train the model first."
        )
    
    with open(analysis_file, 'r') as f:
        return json.load(f)


@app.post("/api/optimize")
async def run_optimization(request: ScenarioRequest):
    """Run financial aid optimization scenario."""
    try:
        result = run_scenario(
            budget=request.budget,
            target_sat=request.target_sat,
            pell_min=request.pell_minimum
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trends")
async def get_trends():
    """
    Get trend data for revenue/enrollment visualization.
    Note: Scorecard doesn't have historical time series, so we simulate based on current data.
    """
    df = get_processed_data()
    
    # Aggregate by state for trend simulation
    state_agg = df.groupby('school.state').agg({
        'student_size': 'sum',
        'net_price_low_income': 'mean',
        'resilience_risk_index': 'mean'
    }).reset_index()
    
    # Simulate 5-year trend based on current risk
    years = [2022, 2023, 2024, 2025, 2026]
    national_enrollment = []
    national_revenue = []
    
    base_enrollment = df['student_size'].sum()
    base_avg_price = df['net_price_low_income'].mean()
    
    for i, year in enumerate(years):
        # Simulate declining enrollment with acceleration
        decline_factor = 1 - (0.02 * i) - (0.005 * i ** 2)
        enrollment = base_enrollment * decline_factor
        
        # Revenue tries to compensate with price increases
        price_increase = 1 + (0.03 * i)
        revenue = enrollment * base_avg_price * price_increase
        
        national_enrollment.append(int(enrollment))
        national_revenue.append(int(revenue))
    
    return {
        "years": years,
        "enrollment": national_enrollment,
        "revenue": national_revenue,
        "warning": "2026 marks the demographic cliff"
    }


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
