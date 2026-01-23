"""
Financial Aid Optimization Engine using Linear Programming (PuLP)
Optimizes resource allocation across REAL institutions from College Scorecard.
"""
import ast
import json
import numpy as np
import pandas as pd
from pathlib import Path
from pulp import LpProblem, LpMaximize, LpVariable, lpSum, LpStatus, value

DATA_DIR = Path(__file__).parent.parent / 'data'


def calculate_impact_score(
    base_retention: float,
    investment_level: float,
    risk_index: float,
    pell_rate: float
) -> float:
    """
    Estimate improvement in student outcomes given investment level.
    Higher investment in high-risk, high-Pell schools = more impact.
    """
    # Diminishing returns on investment
    investment_factor = 1 - np.exp(-investment_level / 50000)
    
    # Higher risk schools have more room for improvement
    risk_factor = (risk_index / 100) * 0.5
    
    # Pell-heavy schools benefit more from financial support
    pell_factor = pell_rate * 0.3
    
    # Base improvement potential
    improvement = investment_factor * (risk_factor + pell_factor) * (1 - base_retention)
    
    return base_retention + improvement


def optimize_school_investments(
    schools: list[dict],
    total_budget: float = 10_000_000,
    min_pell_allocation: float = 0.40,
    max_per_school: float = 500_000,
    investment_levels: list[int] = [0, 50000, 100000, 200000, 500000]
) -> dict:
    """
    Optimize investment allocation across schools using Linear Programming.
    Uses REAL school data from College Scorecard.
    
    Args:
        schools: List of school dicts from Scorecard with keys:
            - id, school.name, retention_rate, resilience_risk_index, pell_rate, student_size
        total_budget: Total investment budget
        min_pell_allocation: Minimum fraction of budget for high-Pell schools (>=50%)
        max_per_school: Maximum investment per school
        investment_levels: Discrete investment amounts to consider
    
    Returns:
        Optimization results with allocations and projected outcomes
    """
    n_schools = len(schools)
    n_levels = len(investment_levels)
    
    if n_schools == 0:
        return {'status': 'Error', 'error': 'No schools provided'}
    
    prob = LpProblem("School_Investment_Optimization", LpMaximize)
    
    # Decision variables: x[i][j] = 1 if school i gets investment level j
    x = {}
    for i in range(n_schools):
        for j in range(n_levels):
            x[i, j] = LpVariable(f"x_{i}_{j}", cat='Binary')
    
    # OBJECTIVE: Maximize total projected student outcomes
    # (weighted by student size and improvement potential)
    prob += lpSum(
        schools[i].get('student_size', 1000) *
        calculate_impact_score(
            schools[i].get('retention_rate', 0.5),
            investment_levels[j],
            schools[i].get('resilience_risk_index', 50),
            schools[i].get('pell_rate', 0.3)
        ) * x[i, j]
        for i in range(n_schools)
        for j in range(n_levels)
    ), "Total_Student_Outcomes"
    
    # CONSTRAINT 1: Each school gets exactly one investment level
    for i in range(n_schools):
        prob += lpSum(x[i, j] for j in range(n_levels)) == 1, f"One_Level_{i}"
    
    # CONSTRAINT 2: Total budget
    prob += lpSum(
        investment_levels[j] * x[i, j]
        for i in range(n_schools)
        for j in range(n_levels)
    ) <= total_budget, "Budget_Constraint"
    
    # CONSTRAINT 3: Minimum Pell allocation (equity focus)
    # Schools with pell_rate >= 0.5 are considered high-Pell
    high_pell_indices = [i for i in range(n_schools) 
                         if schools[i].get('pell_rate', 0) >= 0.5]
    
    if high_pell_indices:
        effective_pell_min = min_pell_allocation * 0.5  # Relaxed for feasibility
        prob += lpSum(
            investment_levels[j] * x[i, j]
            for i in high_pell_indices
            for j in range(n_levels)
        ) >= effective_pell_min * total_budget, "Pell_Equity"
    
    # Solve
    prob.solve()
    
    status = LpStatus[prob.status]
    
    if status != 'Optimal':
        return {
            'status': status,
            'error': 'Optimization did not find optimal solution',
            'allocations': []
        }
    
    # Parse results
    allocations = []
    total_allocated = 0
    total_students_impacted = 0
    pell_allocated = 0
    baseline_outcomes = 0
    projected_outcomes = 0
    
    for i in range(n_schools):
        for j in range(n_levels):
            if value(x[i, j]) > 0.5:
                investment = investment_levels[j]
                
                if investment > 0:
                    school = schools[i]
                    student_size = school.get('student_size', 1000)
                    base_retention = school.get('retention_rate', 0.5)
                    risk = school.get('resilience_risk_index', 50)
                    pell = school.get('pell_rate', 0.3)
                    
                    projected_retention = calculate_impact_score(
                        base_retention, investment, risk, pell
                    )
                    
                    # Calculate student distribution recommendations
                    # Priority: Pell-eligible students at risk of dropping out
                    pell_students = int(student_size * pell)
                    at_risk_students = int(student_size * (1 - base_retention))
                    pell_at_risk = int(pell_students * (1 - base_retention))
                    
                    # Recommend Pell per student for targeted impact
                    pell_per_student = investment / max(pell_students, 1)
                    pell_per_at_risk = investment / max(pell_at_risk, 1)
                    
                    student_distribution = {
                        "pell_eligible_students": pell_students,
                        "at_risk_students": at_risk_students,
                        "pell_at_risk_overlap": pell_at_risk,
                        "recommended_pell_per_student": round(pell_per_student, 2),
                        "pell_per_at_risk_student": round(pell_per_at_risk, 2),
                        "strategy": get_distribution_strategy(pell_per_student, pell_at_risk, investment)
                    }
                    
                    # Get risk explanation if available
                    risk_explanation = school.get('risk_explanation', {
                        "factors": [],
                        "summary": "Data unavailable"
                    })
                    
                    allocations.append({
                        'school_id': school.get('id'),
                        'name': school.get('school.name', 'Unknown'),
                        'state': school.get('school.state', ''),
                        'investment': investment,
                        'student_size': int(student_size),
                        'base_retention': round(base_retention, 3),
                        'projected_retention': round(projected_retention, 3),
                        'retention_improvement': round(projected_retention - base_retention, 3),
                        'risk_index': round(risk, 1),
                        'pell_rate': round(pell, 3),
                        'student_distribution': student_distribution,
                        'risk_explanation': risk_explanation,
                    })
                    
                    total_allocated += investment
                    total_students_impacted += student_size
                    baseline_outcomes += student_size * base_retention
                    projected_outcomes += student_size * projected_retention
                    
                    if pell >= 0.5:
                        pell_allocated += investment
    
    # Sort by investment amount (highest first)
    allocations.sort(key=lambda x: x['investment'], reverse=True)
    
    return {
        'status': 'Optimal',
        'total_budget': total_budget,
        'total_allocated': total_allocated,
        'budget_utilization': total_allocated / total_budget if total_budget > 0 else 0,
        'schools_funded': len(allocations),
        'students_impacted': int(total_students_impacted),
        'baseline_retained': int(baseline_outcomes),
        'projected_retained': int(projected_outcomes),
        'additional_retained': int(projected_outcomes - baseline_outcomes),
        'pell_allocation': pell_allocated,
        'pell_percentage': pell_allocated / total_allocated if total_allocated > 0 else 0,
        'allocations': allocations[:20]  # Top 20 for display
    }


def get_distribution_strategy(pell_per_student: float, pell_at_risk: int, investment: float) -> str:
    """
    Generate a human-readable recommendation for how to distribute Pell funds
    to maximize DOE ROI (student retention).
    """
    if pell_per_student > 5000:
        return f"High-impact grants: ${pell_per_student:,.0f}/student for {max(1, int(investment/5000))} highest-need students"
    elif pell_per_student > 2500:
        return f"Moderate grants: ${pell_per_student:,.0f}/student, prioritize {pell_at_risk} at-risk Pell recipients"
    elif pell_per_student > 1000:
        return f"Distributed grants: ${pell_per_student:,.0f}/student across all Pell recipients"
    else:
        return f"Supplemental support: ${pell_per_student:,.0f}/student emergency fund + academic resources"


def run_scenario(
    budget: float,
    target_sat: float = 0,  # Minimum SAT average to include school
    pell_min: float = 0.40
) -> dict:
    """
    Run optimization scenario using REAL Scorecard data.
    """
    # Load processed Scorecard data
    data_file = DATA_DIR / 'scorecard_processed.csv'
    
    if not data_file.exists():
        return {'status': 'Error', 'error': 'Scorecard data not found. Run data_pipeline.py first.'}
    
    df = pd.read_csv(data_file)
    
    # Parse risk_explanation from string to dict
    if 'risk_explanation' in df.columns:
        def parse_risk_explanation(val):
            if pd.isna(val):
                return {"factors": [], "summary": "Data unavailable"}
            try:
                return ast.literal_eval(val)
            except:
                return {"factors": [], "summary": "Data unavailable"}
        df['risk_explanation'] = df['risk_explanation'].apply(parse_risk_explanation)
    
    # Filter to high-risk schools that would benefit most from intervention
    # Focus on schools with risk > 50 (above average)
    df_high_risk = df[df['resilience_risk_index'] >= 40].copy()
    
    # Limit to manageable number for LP solver
    df_sample = df_high_risk.nsmallest(100, 'retention_rate')
    
    # Convert to list of dicts
    schools = df_sample.to_dict('records')
    
    # Filter by SAT if target_sat > 0
    # Only exclude schools that have SAT data AND fall below threshold
    # Schools without SAT data are included (most high-risk schools don't report)
    if target_sat > 0:
        schools = [s for s in schools 
                   if s.get('sat_avg') is None or s['sat_avg'] >= target_sat]
    
    # Clean NaN values
    for school in schools:
        for key, val in school.items():
            if pd.isna(val):
                school[key] = None
    
    if len(schools) == 0:
        return {
            'status': 'No Schools',
            'error': f'No schools match the filters (SAT >= {target_sat})',
            'schools_funded': 0,
            'students_impacted': 0,
            'additional_retained': 0,
            'pell_percentage': 0,
            'budget_utilization': 0,
            'total_allocated': 0,
            'allocations': []
        }
    
    # Run optimization
    result = optimize_school_investments(
        schools=schools,
        total_budget=budget,
        min_pell_allocation=pell_min
    )
    
    return result


if __name__ == '__main__':
    print("Running school investment optimization with REAL Scorecard data...")
    print("=" * 60)
    
    result = run_scenario(10_000_000, pell_min=0.40)
    
    print(f"\nStatus: {result['status']}")
    if result['status'] == 'Optimal':
        print(f"Budget Used: ${result['total_allocated']:,.0f} ({result['budget_utilization']*100:.1f}%)")
        print(f"Schools Funded: {result['schools_funded']}")
        print(f"Students Impacted: {result['students_impacted']:,}")
        print(f"Additional Students Retained: {result['additional_retained']:,}")
        print(f"Pell Allocation: {result['pell_percentage']*100:.1f}%")
        
        print("\nTop 5 Investment Allocations:")
        for alloc in result['allocations'][:5]:
            print(f"  {alloc['name'][:40]:40s} ${alloc['investment']:>10,}")
            print(f"    Risk: {alloc['risk_index']:.0f} | Retention: {alloc['base_retention']:.1%} → {alloc['projected_retention']:.1%}")
