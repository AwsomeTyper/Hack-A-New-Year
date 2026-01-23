"""
Retention Prediction Model using XGBoost with SHAP Explainability
Includes automated fairness auditing using fairlearn.
"""
import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import shap

# Try to import fairlearn, gracefully degrade if not available
try:
    from fairlearn.metrics import demographic_parity_ratio, equalized_odds_difference
    FAIRLEARN_AVAILABLE = True
except ImportError:
    FAIRLEARN_AVAILABLE = False
    print("Warning: fairlearn not installed. Fairness audit will be skipped.")

DATA_DIR = Path(__file__).parent.parent / 'data'
MODELS_DIR = Path(__file__).parent / 'models'


# Feature columns for the model
FEATURE_COLS = [
    'net_price_low_income',
    'median_debt',
    'admission_rate',
    'pell_rate',
    'geographic_isolation',
    'student_size',
    'value_add_ratio',
]

TARGET_COL = 'retention_rate'


def load_data() -> pd.DataFrame:
    """Load processed scorecard data."""
    data_file = DATA_DIR / 'scorecard_processed.csv'
    if not data_file.exists():
        raise FileNotFoundError(
            "Processed data not found. Run data_pipeline.py first."
        )
    return pd.read_csv(data_file)


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Prepare feature matrix and target variable."""
    # Filter to rows with all required features
    required_cols = FEATURE_COLS + [TARGET_COL]
    df_model = df.dropna(subset=required_cols)
    
    X = df_model[FEATURE_COLS].copy()
    y = df_model[TARGET_COL].copy()
    
    return X, y, df_model


def train_retention_model(X: pd.DataFrame, y: pd.Series) -> xgb.XGBRegressor:
    """
    Train XGBoost regression model for retention prediction.
    Uses cross-validation to prevent overfitting.
    """
    # Split for final evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # XGBoost model with regularization
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,  # L1 regularization
        reg_lambda=1.0,  # L2 regularization
        random_state=42,
        n_jobs=-1
    )
    
    # 5-fold cross-validation
    cv_scores = cross_val_score(
        model, X_train, y_train,
        cv=5, scoring='neg_root_mean_squared_error'
    )
    
    print(f"Cross-validation RMSE: {-cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Train on full training set
    model.fit(X_train, y_train)
    
    # Evaluate on test set
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"Test RMSE: {rmse:.4f}")
    print(f"Test R²: {r2:.4f}")
    
    return model, X_test, y_test


def generate_shap_explanations(model: xgb.XGBRegressor, X: pd.DataFrame) -> dict:
    """Generate SHAP values for model interpretability."""
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # Feature importance based on mean |SHAP|
    importance = pd.DataFrame({
        'feature': FEATURE_COLS,
        'importance': np.abs(shap_values).mean(axis=0)
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance (SHAP):")
    for _, row in importance.iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")
    
    return {
        'shap_values': shap_values.tolist(),
        'expected_value': float(explainer.expected_value),
        'feature_importance': importance.to_dict('records')
    }


def run_fairness_audit(
    model: xgb.XGBRegressor,
    X: pd.DataFrame,
    y: pd.Series,
    df_model: pd.DataFrame
) -> dict:
    """
    Run fairness audit using Pell Grant rate as socioeconomic proxy.
    Checks for demographic parity in predictions.
    """
    if not FAIRLEARN_AVAILABLE:
        return {'status': 'skipped', 'reason': 'fairlearn not installed'}
    
    # Create binary groups: High Pell (economically disadvantaged) vs Low Pell
    pell_threshold = df_model['pell_rate'].median()
    sensitive_features = (df_model.loc[X.index, 'pell_rate'] > pell_threshold).astype(int)
    
    # Get predictions
    y_pred = model.predict(X)
    
    # Binarize for classification metrics (above/below median retention)
    y_binary = (y > y.median()).astype(int)
    y_pred_binary = (y_pred > y.median()).astype(int)
    
    # Calculate fairness metrics
    try:
        dp_ratio = demographic_parity_ratio(
            y_binary, y_pred_binary,
            sensitive_features=sensitive_features
        )
        
        # Check four-fifths rule
        four_fifths_violation = dp_ratio < 0.8
        
        audit_results = {
            'status': 'completed',
            'demographic_parity_ratio': float(dp_ratio),
            'four_fifths_violation': bool(four_fifths_violation),
            'groups': {
                'high_pell': int(sensitive_features.sum()),
                'low_pell': int(len(sensitive_features) - sensitive_features.sum())
            }
        }
        
        if four_fifths_violation:
            print(f"\n⚠️ FAIRNESS WARNING: Four-fifths rule violation detected!")
            print(f"   Demographic parity ratio: {dp_ratio:.3f} (threshold: 0.8)")
        else:
            print(f"\n✓ Fairness audit passed. Demographic parity ratio: {dp_ratio:.3f}")
        
        return audit_results
        
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


def save_model_artifacts(
    model: xgb.XGBRegressor,
    shap_results: dict,
    fairness_results: dict
):
    """Save model and analysis artifacts."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save XGBoost model
    model_path = MODELS_DIR / 'retention_xgb.json'
    model.save_model(model_path)
    print(f"\nModel saved to {model_path}")
    
    # Save SHAP and fairness results
    results = {
        'shap': {
            'expected_value': shap_results['expected_value'],
            'feature_importance': shap_results['feature_importance']
        },
        'fairness': fairness_results,
        'features': FEATURE_COLS,
        'target': TARGET_COL
    }
    
    results_path = MODELS_DIR / 'model_analysis.json'
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Analysis saved to {results_path}")


def predict_retention(school_data: dict) -> dict:
    """Make retention prediction for a single school with explanation."""
    model = xgb.XGBRegressor()
    model.load_model(MODELS_DIR / 'retention_xgb.json')
    
    # Prepare features
    X = pd.DataFrame([{col: school_data.get(col) for col in FEATURE_COLS}])
    
    # Predict
    prediction = model.predict(X)[0]
    
    # SHAP explanation
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)[0]
    
    # Build explanation
    explanation = []
    for feat, shap_val in zip(FEATURE_COLS, shap_values):
        direction = "increases" if shap_val > 0 else "decreases"
        explanation.append({
            'feature': feat,
            'value': float(school_data.get(feat, 0)),
            'shap_value': float(shap_val),
            'direction': direction
        })
    
    return {
        'predicted_retention': float(prediction),
        'explanation': sorted(explanation, key=lambda x: abs(x['shap_value']), reverse=True)
    }


def run_training_pipeline():
    """Execute full model training pipeline."""
    print("=" * 60)
    print("RETENTION MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    # Load data
    print("\n1. Loading data...")
    df = load_data()
    
    # Prepare features
    print("\n2. Preparing features...")
    X, y, df_model = prepare_features(df)
    print(f"   Training samples: {len(X)}")
    
    # Train model
    print("\n3. Training XGBoost model...")
    model, X_test, y_test = train_retention_model(X, y)
    
    # SHAP explanations
    print("\n4. Generating SHAP explanations...")
    shap_results = generate_shap_explanations(model, X_test)
    
    # Fairness audit
    print("\n5. Running fairness audit...")
    fairness_results = run_fairness_audit(model, X_test, y_test, df_model)
    
    # Save artifacts
    print("\n6. Saving model artifacts...")
    save_model_artifacts(model, shap_results, fairness_results)
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    run_training_pipeline()
