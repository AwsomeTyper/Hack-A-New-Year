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
from data_pipeline import run_pipeline, DATA_DIR
from retention_model import predict_retention, MODELS_DIR, load_data
from optimizer import run_scenario

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
