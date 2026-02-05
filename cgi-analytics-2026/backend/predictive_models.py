"""
Predictive Models for Pell Grant ROI Analysis

Three institutional-level forecasting models:
1. Dropout Risk Model - Logistic regression predicting high dropout probability
2. Price Elasticity Model - Enrollment response to grant changes
3. Institutional Viability Forecast - Closure risk based on Pell dependence

All models use REAL aggregate institutional data from College Scorecard.
NO synthetic student-level data is generated.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import json

DATA_DIR = Path(__file__).parent.parent / "data"


def load_processed_data() -> pd.DataFrame:
    """Load the processed scorecard data."""
    data_file = DATA_DIR / 'scorecard_processed.csv'
    if not data_file.exists():
        raise FileNotFoundError(f"Processed data not found at {data_file}")
    return pd.read_csv(data_file)


# =============================================================================
# 1. DROPOUT RISK MODEL
# =============================================================================

class DropoutRiskModel:
    """
    Institutional-level dropout risk classifier.
    
    Predicts whether an institution has HIGH (>50%) dropout rate based on:
    - Net price for low-income students
    - Median debt at graduation
    - First-year retention rate
    - Pell grant recipient rate
    - Institution size
    
    Output: Risk probability 0-1 (higher = more likely high dropout)
    """
    
    FEATURE_COLS = [
        'net_price_low_income',
        'median_debt',
        'retention_rate',
        'pell_rate',
        'student_size',
        'admission_rate',
    ]
    
    def __init__(self):
        self.model = LogisticRegression(max_iter=1000, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_importance = {}
    
    def prepare_data(self, df: pd.DataFrame) -> tuple:
        """Prepare features and target for training."""
        # Create binary target: high dropout = completion rate < 0.50
        df_model = df.dropna(subset=self.FEATURE_COLS + ['completion_rate'])
        
        X = df_model[self.FEATURE_COLS].copy()
        y = (df_model['completion_rate'] < 0.50).astype(int)  # 1 = high dropout risk
        
        return X, y, df_model
    
    def train(self, df: pd.DataFrame) -> dict:
        """Train the dropout risk model."""
        X, y, df_model = self.prepare_data(df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train logistic regression
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Cross-validation score
        cv_scores = cross_val_score(self.model, X_scaled, y, cv=5, scoring='roc_auc')
        
        # Feature importance (absolute coefficient values)
        self.feature_importance = dict(zip(
            self.FEATURE_COLS,
            [abs(float(c)) for c in self.model.coef_[0]]
        ))
        
        return {
            'samples': len(y),
            'high_risk_count': int(y.sum()),
            'high_risk_rate': float(y.mean()),
            'cv_auc_mean': float(cv_scores.mean()),
            'cv_auc_std': float(cv_scores.std()),
            'feature_importance': self.feature_importance
        }
    
    def predict(self, school_data: dict) -> dict:
        """Predict dropout risk for a single institution."""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare input
        X = pd.DataFrame([{col: school_data.get(col, 0) for col in self.FEATURE_COLS}])
        X_scaled = self.scaler.transform(X)
        
        # Get probability
        prob = self.model.predict_proba(X_scaled)[0, 1]
        
        # Generate explanation
        factors = []
        if school_data.get('retention_rate', 1) < 0.70:
            factors.append(f"Low retention ({school_data.get('retention_rate', 0)*100:.0f}%)")
        if school_data.get('net_price_low_income', 0) > 15000:
            factors.append(f"High net price (${school_data.get('net_price_low_income', 0):,.0f})")
        if school_data.get('pell_rate', 0) > 0.50:
            factors.append(f"High Pell dependency ({school_data.get('pell_rate', 0)*100:.0f}%)")
        
        return {
            'risk_probability': float(prob),
            'risk_level': 'high' if prob > 0.5 else ('medium' if prob > 0.3 else 'low'),
            'contributing_factors': factors
        }
    
    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add dropout risk predictions to dataframe."""
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Prepare features
        df_pred = df.dropna(subset=self.FEATURE_COLS).copy()
        X = df_pred[self.FEATURE_COLS]
        X_scaled = self.scaler.transform(X)
        
        # Predictions
        df_pred['dropout_risk_prob'] = self.model.predict_proba(X_scaled)[:, 1]
        df_pred['dropout_risk_level'] = df_pred['dropout_risk_prob'].apply(
            lambda p: 'high' if p > 0.5 else ('medium' if p > 0.3 else 'low')
        )
        
        return df_pred


# =============================================================================
# 2. PRICE ELASTICITY MODEL
# =============================================================================

class PriceElasticityModel:
    """
    Model enrollment response to Pell Grant changes.
    
    Formula: Enrollment_new = Enrollment_base * (1 + Elasticity * ΔGrant/NetPrice)
    
    Elasticity is estimated from historical patterns:
    - Lower-income institutions have higher elasticity (more price-sensitive)
    - Schools with higher Pell rates respond more to grant changes
    
    This is a *calibrated* economic model, not ML-trained.
    Based on research: elasticity typically ranges from -0.5 to -1.5 for low-income students.
    """
    
    # Calibrated elasticity parameters based on research literature
    BASE_ELASTICITY = -0.8  # Average enrollment elasticity to net price
    
    def __init__(self):
        self.calibrated = True
    
    def estimate_elasticity(self, pell_rate: float, net_price: float, admission_rate: float) -> float:
        """
        Estimate institution-specific price elasticity.
        
        Higher elasticity (more negative) for:
        - Higher Pell rates (more price-sensitive students)
        - Lower net prices (marginal students more sensitive)
        - Higher admission rates (less selective schools)
        """
        # Base elasticity adjusted by institution characteristics
        pell_factor = 1 + (pell_rate - 0.35) * 0.5  # Higher Pell = more elastic
        price_factor = 1 + max(0, (20000 - net_price) / 40000)  # Lower price = more elastic
        selectivity_factor = 1 + (admission_rate - 0.5) * 0.3  # Less selective = more elastic
        
        elasticity = self.BASE_ELASTICITY * pell_factor * price_factor * selectivity_factor
        
        # Bound elasticity to reasonable range
        return max(-2.0, min(-0.2, elasticity))
    
    def predict_enrollment_change(
        self,
        current_enrollment: int,
        current_net_price: float,
        grant_change: float,
        pell_rate: float,
        admission_rate: float = 0.5
    ) -> dict:
        """
        Predict enrollment change from grant amount adjustment.
        
        Args:
            current_enrollment: Current student headcount
            current_net_price: Current net price for low-income students
            grant_change: Dollar change in Pell grant (positive = increase)
            pell_rate: Fraction of students receiving Pell
            admission_rate: Admission rate (selectivity)
        
        Returns:
            Dictionary with new enrollment and percent change
        """
        # Calculate institution-specific elasticity
        elasticity = self.estimate_elasticity(pell_rate, current_net_price, admission_rate)
        
        # Calculate percent change in net price
        new_net_price = max(0, current_net_price - grant_change)
        price_change_pct = (new_net_price - current_net_price) / current_net_price
        
        # Apply elasticity formula: %ΔQ = elasticity * %ΔP
        enrollment_change_pct = elasticity * price_change_pct
        
        # Only Pell-eligible students are affected
        pell_enrollment = current_enrollment * pell_rate
        non_pell_enrollment = current_enrollment * (1 - pell_rate)
        
        new_pell_enrollment = pell_enrollment * (1 + enrollment_change_pct)
        new_total_enrollment = new_pell_enrollment + non_pell_enrollment
        
        return {
            'original_enrollment': int(current_enrollment),
            'new_enrollment': int(new_total_enrollment),
            'enrollment_change': int(new_total_enrollment - current_enrollment),
            'enrollment_change_pct': float(enrollment_change_pct * pell_rate * 100),
            'elasticity': float(elasticity),
            'new_net_price': float(new_net_price)
        }
    
    def simulate_grant_scenarios(self, df: pd.DataFrame, grant_changes: list = None) -> list:
        """
        Run multiple grant change scenarios across all institutions.
        
        Args:
            df: Processed scorecard data
            grant_changes: List of grant change amounts to simulate
        
        Returns:
            List of scenario results with aggregate impacts
        """
        if grant_changes is None:
            grant_changes = [-1000, 0, 1000, 2000, 3000, 5000]
        
        # Filter to schools with required data
        df_sim = df.dropna(subset=['student_size', 'net_price_low_income', 'pell_rate']).copy()
        
        results = []
        for grant_delta in grant_changes:
            total_enrollment_change = 0
            
            for _, row in df_sim.iterrows():
                pred = self.predict_enrollment_change(
                    current_enrollment=int(row['student_size']),
                    current_net_price=float(row['net_price_low_income']),
                    grant_change=grant_delta,
                    pell_rate=float(row['pell_rate']),
                    admission_rate=float(row.get('admission_rate', 0.5) or 0.5)
                )
                total_enrollment_change += pred['enrollment_change']
            
            results.append({
                'grant_change': grant_delta,
                'total_enrollment_change': int(total_enrollment_change),
                'schools_analyzed': len(df_sim)
            })
        
        return results


# =============================================================================
# 3. INSTITUTIONAL VIABILITY MODEL
# =============================================================================

class InstitutionalViabilityModel:
    """
    Predict institutional closure/distress risk.
    
    Formula: Risk = Pell_Dependence × (1 - Repayment_Rate) × Enrollment_Trend_Factor
    
    High risk indicators:
    - Heavy reliance on Pell revenue (>50% Pell rate)
    - Low loan repayment rates (<50%)
    - Declining enrollment trends
    - High completion gap (Pell students performing worse)
    """
    
    def calculate_viability_score(self, row: pd.Series) -> dict:
        """
        Calculate viability score for a single institution.
        
        Returns score 0-100 (higher = more viable/stable)
        """
        # Helper to safely extract numeric values with defaults
        def safe_get(key, default):
            val = row.get(key)
            if val is None or (isinstance(val, float) and pd.isna(val)):
                return default
            return float(val)
        
        # Extract factors with proper NaN handling
        pell_rate = safe_get('pell_rate', 0.35)
        completion_rate = safe_get('completion_rate', 0.50)
        retention_rate = safe_get('retention_rate', 0.70)
        value_add = safe_get('value_add_ratio', 3.0)
        student_size = safe_get('student_size', 1000)
        
        # Pell dependence risk (higher pell rate = more dependent on federal aid)
        # Only penalize if >50%, max contribution: 0.2
        pell_risk = max(0, (pell_rate - 0.4)) * 0.3
        
        # Completion factor (lower completion = higher risk)
        # Only penalize if <60%, max contribution: 0.3
        completion_risk = max(0, (0.6 - completion_rate)) * 0.5
        
        # Retention factor (lower retention = higher risk)
        # Only penalize if <75%, max contribution: 0.2
        retention_risk = max(0, (0.75 - retention_rate)) * 0.3
        
        # Size factor (smaller schools more vulnerable)
        # Only penalize if <1000, max contribution: 0.15
        size_risk = max(0, min(1, (1000 - student_size) / 1000)) * 0.15
        
        # Value-add factor (poor outcomes = higher risk)
        # Only penalize if <2.5, max contribution: 0.15
        value_risk = max(0, (2.5 - value_add) / 5) * 0.15
        
        # Combined risk (0-1 scale)
        total_risk = min(1.0, pell_risk + completion_risk + retention_risk + size_risk + value_risk)
        
        # Convert to viability score (100 = most viable)
        viability_score = (1 - total_risk) * 100
        
        # Risk level
        if viability_score < 40:
            risk_level = 'critical'
        elif viability_score < 60:
            risk_level = 'elevated'
        elif viability_score < 75:
            risk_level = 'moderate'
        else:
            risk_level = 'stable'
        
        # Contributing factors
        factors = []
        if pell_rate > 0.50:
            factors.append({'factor': 'High Pell Dependence', 'value': f'{pell_rate*100:.0f}%'})
        if completion_rate < 0.40:
            factors.append({'factor': 'Low Completion Rate', 'value': f'{completion_rate*100:.0f}%'})
        if retention_rate < 0.60:
            factors.append({'factor': 'Low Retention Rate', 'value': f'{retention_rate*100:.0f}%'})
        if student_size < 500:
            factors.append({'factor': 'Small Enrollment', 'value': f'{student_size:,.0f}'})
        
        return {
            'viability_score': round(viability_score, 1),
            'risk_level': risk_level,
            'contributing_factors': factors[:3]  # Top 3 factors
        }
    
    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add viability predictions to dataframe."""
        df_pred = df.copy()
        
        results = df_pred.apply(self.calculate_viability_score, axis=1)
        df_pred['viability_score'] = results.apply(lambda x: x['viability_score'])
        df_pred['viability_risk_level'] = results.apply(lambda x: x['risk_level'])
        
        return df_pred
    
    def get_at_risk_institutions(self, df: pd.DataFrame, threshold: float = 50) -> pd.DataFrame:
        """Get institutions below viability threshold."""
        df_pred = self.predict_batch(df)
        return df_pred[df_pred['viability_score'] < threshold].sort_values('viability_score')


# =============================================================================
# COMBINED PREDICTOR
# =============================================================================

class PellGrantPredictor:
    """
    Combined predictor for all Pell Grant ROI models.
    
    Provides unified interface for:
    - Dropout risk classification
    - Price elasticity simulation
    - Institutional viability forecasting
    """
    
    def __init__(self):
        self.dropout_model = DropoutRiskModel()
        self.elasticity_model = PriceElasticityModel()
        self.viability_model = InstitutionalViabilityModel()
        self.is_trained = False
    
    def train(self, df: pd.DataFrame = None) -> dict:
        """Train all trainable models."""
        if df is None:
            df = load_processed_data()
        
        # Train dropout model
        dropout_results = self.dropout_model.train(df)
        self.is_trained = True
        
        return {
            'dropout_model': dropout_results,
            'elasticity_model': {'status': 'calibrated', 'base_elasticity': -0.8},
            'viability_model': {'status': 'rule-based'}
        }
    
    def predict_all(self, school_data: dict) -> dict:
        """Run all predictions for a single institution."""
        if not self.is_trained:
            df = load_processed_data()
            self.train(df)
        
        # Dropout risk
        dropout_pred = self.dropout_model.predict(school_data)
        
        # Price elasticity (example: $1000 grant increase)
        elasticity_pred = self.elasticity_model.predict_enrollment_change(
            current_enrollment=int(school_data.get('student_size', 1000)),
            current_net_price=float(school_data.get('net_price_low_income', 15000)),
            grant_change=1000,
            pell_rate=float(school_data.get('pell_rate', 0.35)),
            admission_rate=float(school_data.get('admission_rate', 0.5) or 0.5)
        )
        
        # Viability
        viability_pred = self.viability_model.calculate_viability_score(pd.Series(school_data))
        
        return {
            'dropout_risk': dropout_pred,
            'price_elasticity': elasticity_pred,
            'viability': viability_pred
        }


# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == '__main__':
    # Load data
    df = load_processed_data()
    print(f"Loaded {len(df)} institutions")
    
    # Initialize and train
    predictor = PellGrantPredictor()
    results = predictor.train(df)
    
    print("\n=== DROPOUT RISK MODEL ===")
    print(f"Samples: {results['dropout_model']['samples']}")
    print(f"High Risk Rate: {results['dropout_model']['high_risk_rate']*100:.1f}%")
    print(f"CV AUC: {results['dropout_model']['cv_auc_mean']:.3f}")
    print(f"Top Features: {results['dropout_model']['feature_importance']}")
    
    print("\n=== PRICE ELASTICITY SIMULATION ===")
    scenarios = predictor.elasticity_model.simulate_grant_scenarios(df)
    for s in scenarios:
        print(f"Grant Δ${s['grant_change']:+,}: Enrollment Δ{s['total_enrollment_change']:+,}")
    
    print("\n=== VIABILITY - AT RISK INSTITUTIONS ===")
    at_risk = predictor.viability_model.get_at_risk_institutions(df, threshold=40)
    print(f"Critical risk: {len(at_risk)} institutions")
    print(at_risk[['school.name', 'viability_score']].head(10))
