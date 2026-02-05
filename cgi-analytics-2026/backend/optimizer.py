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


# =============================================================================
# PELL GRANT OPTIMIZER - Advanced Allocation Strategies
# =============================================================================

class PellGrantOptimizer:
    """
    Advanced Pell Grant allocation optimizer with three strategies:
    
    1. BASE: Standard allocation based on enrollment × completion rate
    2. PERFORMANCE: Bonus allocations to high Value-Add schools (mobility rate)
    3. RETENTION_TRIGGER: Reserve budget for micro-grants to high-risk students
    """
    
    def __init__(self):
        self.df = None
        self._load_data()
    
    def _load_data(self):
        """Load processed Scorecard data."""
        data_file = DATA_DIR / 'scorecard_processed.csv'
        if data_file.exists():
            self.df = pd.read_csv(data_file)
        else:
            raise FileNotFoundError("Scorecard data not found. Run data_pipeline.py first.")
    
    def run_enrollment_optimization(
        self,
        budget: float = 50_000_000,
        strategy: str = 'base',
        performance_bonus_pct: float = 0.20,
        retention_reserve_pct: float = 0.10,
        min_completion_rate: float = 0.30,
        max_per_school: float = 2_000_000
    ) -> dict:
        """
        Run enrollment optimization with specified strategy.
        
        Args:
            budget: Total budget to allocate
            strategy: 'base', 'performance', or 'retention_trigger'
            performance_bonus_pct: % of budget for performance bonuses (if strategy='performance')
            retention_reserve_pct: % of budget reserved for micro-grants (if strategy='retention_trigger')
            min_completion_rate: Minimum completion rate to qualify for funding
            max_per_school: Maximum allocation per school
        
        Returns:
            Optimization results with allocations and projected graduates
        """
        df = self.df.dropna(subset=['student_size', 'completion_rate', 'pell_rate']).copy()
        
        # Filter to schools with minimum completion rate
        df = df[df['completion_rate'] >= min_completion_rate]
        
        if len(df) == 0:
            return {'status': 'Error', 'error': 'No schools match criteria'}
        
        # Calculate base allocation metrics
        df['pell_students'] = (df['student_size'] * df['pell_rate']).astype(int)
        df['expected_graduates'] = df['pell_students'] * df['completion_rate']
        
        # Calculate value-add score for performance bonuses
        # Value-add = earnings relative to debt (higher = better ROI)
        df['value_add_score'] = df.get('value_add_ratio', 3.0).fillna(3.0)
        
        # Normalize value-add to 0-1 scale
        va_min = df['value_add_score'].min()
        va_max = df['value_add_score'].max()
        df['value_add_normalized'] = (df['value_add_score'] - va_min) / (va_max - va_min + 0.001)
        
        # Calculate risk score for retention triggers (higher = more at risk)
        df['dropout_risk'] = 1 - df.get('retention_rate', 0.7).fillna(0.7)
        
        # === STRATEGY-SPECIFIC LOGIC ===
        
        if strategy == 'base':
            result = self._base_allocation(df, budget, max_per_school)
            
        elif strategy == 'performance':
            result = self._performance_pricing(df, budget, max_per_school, performance_bonus_pct)
            
        elif strategy == 'retention_trigger':
            result = self._retention_trigger(df, budget, max_per_school, retention_reserve_pct)
            
        else:
            return {'status': 'Error', 'error': f'Unknown strategy: {strategy}'}
        
        result['strategy'] = strategy
        result['total_budget'] = budget
        
        return result
    
    def _base_allocation(self, df: pd.DataFrame, budget: float, max_per_school: float) -> dict:
        """
        Base allocation: Proportional to expected graduates (enrollment × completion).
        Objective: Maximize total graduates per dollar.
        """
        # Allocate proportional to expected graduates
        total_expected = df['expected_graduates'].sum()
        
        allocations = []
        total_allocated = 0
        total_graduates = 0
        
        for _, row in df.iterrows():
            # Proportional allocation
            allocation = (row['expected_graduates'] / total_expected) * budget
            allocation = min(allocation, max_per_school)
            
            # Calculate cost per graduate
            graduates = row['expected_graduates']
            cost_per_grad = allocation / graduates if graduates > 0 else float('inf')
            
            allocations.append({
                'school_id': int(row.get('id', 0)),
                'school_name': row.get('school.name', 'Unknown'),
                'state': row.get('school.state', ''),
                'allocation': round(allocation, 2),
                'pell_students': int(row['pell_students']),
                'completion_rate': round(row['completion_rate'], 3),
                'expected_graduates': int(graduates),
                'cost_per_graduate': round(cost_per_grad, 2),
                'pell_per_student': round(allocation / max(row['pell_students'], 1), 2)
            })
            
            total_allocated += allocation
            total_graduates += graduates
        
        # Sort by allocation (descending)
        allocations.sort(key=lambda x: x['allocation'], reverse=True)
        
        return {
            'status': 'Optimal',
            'total_allocated': round(total_allocated, 2),
            'budget_utilization': round(total_allocated / budget, 4),
            'schools_funded': len(allocations),
            'total_pell_students': int(df['pell_students'].sum()),
            'total_expected_graduates': int(total_graduates),
            'avg_cost_per_graduate': round(total_allocated / total_graduates, 2) if total_graduates > 0 else 0,
            'allocations': allocations[:30]  # Top 30
        }
    
    def _performance_pricing(
        self, 
        df: pd.DataFrame, 
        budget: float, 
        max_per_school: float,
        bonus_pct: float
    ) -> dict:
        """
        Performance-Based Pricing: Base allocation + bonus for high Value-Add schools.
        Shifts funds from low-mobility to high-mobility institutions.
        """
        # Split budget: base allocation + performance bonus pool
        base_budget = budget * (1 - bonus_pct)
        bonus_pool = budget * bonus_pct
        
        total_expected = df['expected_graduates'].sum()
        
        # Get top 20% by value-add for bonus eligibility
        value_add_threshold = df['value_add_score'].quantile(0.80)
        df['bonus_eligible'] = df['value_add_score'] >= value_add_threshold
        
        allocations = []
        total_allocated = 0
        total_graduates = 0
        bonus_allocated = 0
        
        for _, row in df.iterrows():
            # Base allocation
            base_alloc = (row['expected_graduates'] / total_expected) * base_budget
            
            # Performance bonus for high value-add schools
            bonus = 0
            if row['bonus_eligible']:
                # Bonus proportional to expected graduates × value-add
                eligible_total = df[df['bonus_eligible']]['expected_graduates'].sum()
                if eligible_total > 0:
                    bonus = (row['expected_graduates'] / eligible_total) * bonus_pool * row['value_add_normalized']
            
            allocation = min(base_alloc + bonus, max_per_school)
            graduates = row['expected_graduates']
            
            allocations.append({
                'school_id': int(row.get('id', 0)),
                'school_name': row.get('school.name', 'Unknown'),
                'state': row.get('school.state', ''),
                'allocation': round(allocation, 2),
                'base_allocation': round(base_alloc, 2),
                'performance_bonus': round(bonus, 2),
                'bonus_eligible': bool(row['bonus_eligible']),
                'value_add_score': round(row['value_add_score'], 2),
                'pell_students': int(row['pell_students']),
                'completion_rate': round(row['completion_rate'], 3),
                'expected_graduates': int(graduates),
                'cost_per_graduate': round(allocation / graduates, 2) if graduates > 0 else 0
            })
            
            total_allocated += allocation
            total_graduates += graduates
            bonus_allocated += bonus
        
        allocations.sort(key=lambda x: x['allocation'], reverse=True)
        
        return {
            'status': 'Optimal',
            'total_allocated': round(total_allocated, 2),
            'base_budget': round(base_budget, 2),
            'bonus_pool': round(bonus_pool, 2),
            'bonus_distributed': round(bonus_allocated, 2),
            'bonus_eligible_schools': int(df['bonus_eligible'].sum()),
            'budget_utilization': round(total_allocated / budget, 4),
            'schools_funded': len(allocations),
            'total_expected_graduates': int(total_graduates),
            'avg_cost_per_graduate': round(total_allocated / total_graduates, 2) if total_graduates > 0 else 0,
            'allocations': allocations[:30]
        }
    
    def _retention_trigger(
        self, 
        df: pd.DataFrame, 
        budget: float, 
        max_per_school: float,
        reserve_pct: float
    ) -> dict:
        """
        Retention Grant Trigger: Reserve budget for emergency micro-grants.
        
        1. Allocate (1-reserve_pct) as base funding
        2. Reserve (reserve_pct) for high-risk student interventions
        3. Target schools with high dropout risk but decent potential
        """
        # Split budget
        standard_budget = budget * (1 - reserve_pct)
        emergency_reserve = budget * reserve_pct
        
        total_expected = df['expected_graduates'].sum()
        
        # Identify high-risk schools for emergency targeting
        # High risk = low retention but moderate completion potential
        risk_threshold = df['dropout_risk'].quantile(0.70)
        df['emergency_eligible'] = (df['dropout_risk'] >= risk_threshold) & (df['completion_rate'] >= 0.30)
        
        allocations = []
        total_allocated = 0
        total_graduates = 0
        emergency_allocated = 0
        students_with_micro_grants = 0
        
        for _, row in df.iterrows():
            # Standard allocation
            std_alloc = (row['expected_graduates'] / total_expected) * standard_budget
            
            # Emergency micro-grant allocation for high-risk schools
            emergency_alloc = 0
            micro_grant_students = 0
            
            if row['emergency_eligible']:
                # Allocate emergency funds proportional to at-risk Pell students
                at_risk_students = int(row['pell_students'] * row['dropout_risk'])
                eligible_total = df[df['emergency_eligible']]['pell_students'].sum()
                if eligible_total > 0:
                    emergency_alloc = (row['pell_students'] / eligible_total) * emergency_reserve
                    # Micro-grants of ~$1000 per at-risk student
                    micro_grant_students = min(at_risk_students, int(emergency_alloc / 1000))
            
            allocation = min(std_alloc + emergency_alloc, max_per_school)
            graduates = row['expected_graduates']
            
            # Estimate additional retained students from intervention
            # Assumption: micro-grants improve retention by 10% for recipients
            additional_retained = int(micro_grant_students * 0.10)
            
            allocations.append({
                'school_id': int(row.get('id', 0)),
                'school_name': row.get('school.name', 'Unknown'),
                'state': row.get('school.state', ''),
                'allocation': round(allocation, 2),
                'standard_allocation': round(std_alloc, 2),
                'emergency_allocation': round(emergency_alloc, 2),
                'emergency_eligible': bool(row['emergency_eligible']),
                'dropout_risk': round(row['dropout_risk'], 3),
                'micro_grant_recipients': micro_grant_students,
                'additional_retained': additional_retained,
                'pell_students': int(row['pell_students']),
                'completion_rate': round(row['completion_rate'], 3),
                'expected_graduates': int(graduates)
            })
            
            total_allocated += allocation
            total_graduates += graduates
            emergency_allocated += emergency_alloc
            students_with_micro_grants += micro_grant_students
        
        allocations.sort(key=lambda x: x['allocation'], reverse=True)
        
        # Calculate lift from emergency interventions
        intervention_lift = sum(a['additional_retained'] for a in allocations)
        
        return {
            'status': 'Optimal',
            'total_allocated': round(total_allocated, 2),
            'standard_budget': round(standard_budget, 2),
            'emergency_reserve': round(emergency_reserve, 2),
            'emergency_distributed': round(emergency_allocated, 2),
            'emergency_eligible_schools': int(df['emergency_eligible'].sum()),
            'students_with_micro_grants': students_with_micro_grants,
            'intervention_lift': intervention_lift,
            'budget_utilization': round(total_allocated / budget, 4),
            'schools_funded': len(allocations),
            'total_expected_graduates': int(total_graduates),
            'total_graduates_with_lift': int(total_graduates + intervention_lift),
            'allocations': allocations[:30]
        }
    
    def compare_strategies(self, budget: float = 50_000_000) -> dict:
        """
        Run all three strategies and compare results.
        """
        base = self.run_enrollment_optimization(budget, strategy='base')
        performance = self.run_enrollment_optimization(budget, strategy='performance')
        retention = self.run_enrollment_optimization(budget, strategy='retention_trigger')
        
        return {
            'budget': budget,
            'comparison': [
                {
                    'strategy': 'base',
                    'graduates': base.get('total_expected_graduates', 0),
                    'cost_per_grad': base.get('avg_cost_per_graduate', 0),
                    'schools_funded': base.get('schools_funded', 0)
                },
                {
                    'strategy': 'performance',
                    'graduates': performance.get('total_expected_graduates', 0),
                    'cost_per_grad': performance.get('avg_cost_per_graduate', 0),
                    'schools_funded': performance.get('schools_funded', 0),
                    'bonus_schools': performance.get('bonus_eligible_schools', 0)
                },
                {
                    'strategy': 'retention_trigger',
                    'graduates': retention.get('total_graduates_with_lift', 0),
                    'cost_per_grad': budget / retention.get('total_graduates_with_lift', 1),
                    'schools_funded': retention.get('schools_funded', 0),
                    'micro_grant_students': retention.get('students_with_micro_grants', 0),
                    'intervention_lift': retention.get('intervention_lift', 0)
                }
            ],
            'full_results': {
                'base': base,
                'performance': performance,
                'retention_trigger': retention
            }
        }


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
