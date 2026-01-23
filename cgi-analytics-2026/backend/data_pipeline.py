"""
Data Pipeline for College Scorecard API
Fetches, cleans, and engineers features for higher education analytics.
"""
import os
import json
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from math import radians, cos, sin, asin, sqrt

load_dotenv()

API_KEY = os.getenv('SCORECARD_API_KEY')
BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools'
DATA_DIR = Path(__file__).parent.parent / 'data'

# Fields to fetch from College Scorecard API
FIELDS = [
    'id',
    'school.name',
    'school.city',
    'school.state',
    'school.carnegie_basic',
    'school.ownership',  # 1=public, 2=private nonprofit, 3=private for-profit
    'location.lat',
    'location.lon',
    'latest.student.size',
    'latest.admissions.admission_rate.overall',
    'latest.student.retention_rate.four_year.full_time',
    'latest.completion.completion_rate_4yr_150nt',
    'latest.cost.net_price.public.by_income_level.0-30000',
    'latest.cost.net_price.private.by_income_level.0-30000',
    'latest.aid.median_debt.completers.overall',
    'latest.aid.pell_grant_rate',
    'latest.earnings.4_yrs_after_completion.median',
    'latest.student.demographics.race_ethnicity.white',
    'latest.student.demographics.race_ethnicity.black',
    'latest.student.demographics.race_ethnicity.hispanic',
]


def fetch_scorecard_data(max_pages: int = 50) -> list:
    """
    Fetch data from College Scorecard API.
    Focus on 4-year degree-granting institutions.
    """
    all_results = []
    
    for page in range(max_pages):
        params = {
            'api_key': API_KEY,
            'fields': ','.join(FIELDS),
            'school.degrees_awarded.predominant': '3',  # Bachelor's degree granting
            'school.operating': '1',  # Currently operating
            'per_page': 100,
            'page': page,
        }
        
        print(f"Fetching page {page + 1}...")
        response = requests.get(BASE_URL, params=params)
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            break
            
        data = response.json()
        results = data.get('results', [])
        
        if not results:
            break
            
        all_results.extend(results)
        
        # Check if we've got all data
        metadata = data.get('metadata', {})
        total = metadata.get('total', 0)
        if len(all_results) >= total:
            break
    
    print(f"Fetched {len(all_results)} schools")
    return all_results


def flatten_nested_dict(d: dict, parent_key: str = '', sep: str = '.') -> dict:
    """Flatten nested dictionary with dot notation."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_nested_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean scorecard data following best practices:
    - Replace PrivacySuppressed with NaN
    - Handle null values
    - Filter to valid institutions
    """
    # Replace privacy suppressed values
    df = df.replace('PrivacySuppressed', np.nan)
    df = df.replace('NULL', np.nan)
    df = df.replace('null', np.nan)
    
    # Convert numeric columns
    numeric_cols = [
        'latest.student.size',
        'latest.admissions.admission_rate.overall',
        'latest.student.retention_rate.four_year.full_time',
        'latest.completion.completion_rate_4yr_150nt',
        'latest.cost.net_price.public.by_income_level.0-30000',
        'latest.cost.net_price.private.by_income_level.0-30000',
        'latest.aid.median_debt.completers.overall',
        'latest.aid.pell_grant_rate',
        'latest.earnings.4_yrs_after_completion.median',
        'location.lat',
        'location.lon',
    ]
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Create unified net price column (public or private)
    df['net_price_low_income'] = df['latest.cost.net_price.public.by_income_level.0-30000'].fillna(
        df['latest.cost.net_price.private.by_income_level.0-30000']
    )
    
    # Filter to schools with essential data
    essential_cols = ['latest.student.retention_rate.four_year.full_time', 'latest.student.size']
    df = df.dropna(subset=essential_cols)
    
    # Peer-group imputation using Carnegie classification
    df = impute_by_carnegie(df)
    
    return df


def impute_by_carnegie(df: pd.DataFrame) -> pd.DataFrame:
    """
    Impute missing values using median of same Carnegie classification.
    More accurate than global mean imputation.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_cols:
        if df[col].isna().any():
            df[col] = df.groupby('school.carnegie_basic')[col].transform(
                lambda x: x.fillna(x.median())
            )
            # Fill remaining NaNs with global median
            df[col] = df[col].fillna(df[col].median())
    
    return df


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in miles between two coordinates."""
    R = 3959  # Earth radius in miles
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c


# Major metropolitan areas (CSAs with pop > 500k)
MAJOR_METROS = [
    (40.7128, -74.0060),   # New York
    (34.0522, -118.2437),  # Los Angeles
    (41.8781, -87.6298),   # Chicago
    (29.7604, -95.3698),   # Houston
    (33.4484, -112.0740),  # Phoenix
    (39.9526, -75.1652),   # Philadelphia
    (29.4241, -98.4936),   # San Antonio
    (32.7767, -96.7970),   # Dallas
    (37.5485, -121.9886),  # San Jose
    (30.2672, -97.7431),   # Austin
    (47.6062, -122.3321),  # Seattle
    (33.7490, -84.3880),   # Atlanta
    (42.3601, -71.0589),   # Boston
    (25.7617, -80.1918),   # Miami
    (38.9072, -77.0369),   # Washington DC
]


def calculate_geographic_isolation(lat: float, lon: float) -> float:
    """Calculate distance to nearest major metro (CSA pop > 500k)."""
    if pd.isna(lat) or pd.isna(lon):
        return np.nan
    
    min_distance = float('inf')
    for metro_lat, metro_lon in MAJOR_METROS:
        dist = haversine_distance(lat, lon, metro_lat, metro_lon)
        min_distance = min(min_distance, dist)
    
    return min_distance


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create "Diamond Features" for predictive modeling:
    1. Value-Add Efficiency Ratio
    2. Resilience Risk Index
    3. Geographic Isolation Score
    """
    # 1. Value-Add Efficiency Ratio
    # Higher = school provides better earnings relative to cost
    df['value_add_ratio'] = (
        df['latest.earnings.4_yrs_after_completion.median'] / 
        df['net_price_low_income'].replace(0, np.nan)
    )
    
    # 2. Resilience Risk Index (higher = more vulnerable)
    # Normalize components to 0-1 scale
    df['admission_rate_norm'] = df['latest.admissions.admission_rate.overall'].fillna(0.5)
    df['completion_rate_norm'] = 1 - df['latest.completion.completion_rate_4yr_150nt'].fillna(0.5)
    df['pell_rate_norm'] = df['latest.aid.pell_grant_rate'].fillna(0.3)
    
    # Weighted composite (higher admission + lower completion + higher pell = higher risk)
    df['resilience_risk_index'] = (
        0.4 * df['admission_rate_norm'] +
        0.4 * df['completion_rate_norm'] +
        0.2 * df['pell_rate_norm']
    )
    
    # Scale to 0-100
    df['resilience_risk_index'] = (
        (df['resilience_risk_index'] - df['resilience_risk_index'].min()) /
        (df['resilience_risk_index'].max() - df['resilience_risk_index'].min()) * 100
    )
    
    # 3. Geographic Isolation Score
    df['geographic_isolation'] = df.apply(
        lambda row: calculate_geographic_isolation(
            row.get('location.lat'),
            row.get('location.lon')
        ),
        axis=1
    )
    
    # Create simplified column names for modeling
    df['retention_rate'] = df['latest.student.retention_rate.four_year.full_time']
    df['earnings_4yr'] = df['latest.earnings.4_yrs_after_completion.median']
    df['median_debt'] = df['latest.aid.median_debt.completers.overall']
    df['admission_rate'] = df['latest.admissions.admission_rate.overall']
    df['completion_rate'] = df['latest.completion.completion_rate_4yr_150nt']
    df['pell_rate'] = df['latest.aid.pell_grant_rate']
    df['student_size'] = df['latest.student.size']
    
    # Add risk explanations
    df['risk_explanation'] = df.apply(generate_risk_explanation, axis=1)
    
    return df


def generate_risk_explanation(row) -> dict:
    """
    Generate top 3 explanatory factors for why a school is at risk.
    Returns dict with factors sorted by severity for Dept of Education ROI optimization.
    """
    factors = []
    
    # 1. Low retention rate (critical for ROI)
    retention = row.get('retention_rate', None)
    if retention is not None and retention < 0.70:
        severity = "high" if retention < 0.55 else ("medium" if retention < 0.65 else "low")
        factors.append({
            "factor": "Low Retention",
            "value": f"{retention*100:.1f}%",
            "explanation": f"Only {retention*100:.0f}% of students return for sophomore year",
            "severity": severity,
            "priority": 0 if severity == "high" else (1 if severity == "medium" else 2)
        })
    
    # 2. Low completion rate
    completion = row.get('completion_rate', None)
    if completion is not None and completion < 0.45:
        severity = "high" if completion < 0.25 else ("medium" if completion < 0.35 else "low")
        factors.append({
            "factor": "Low Completion",
            "value": f"{completion*100:.1f}%",
            "explanation": f"Only {completion*100:.0f}% graduate within 6 years",
            "severity": severity,
            "priority": 0 if severity == "high" else (1 if severity == "medium" else 2)
        })
    
    # 3. High Pell dependency (vulnerability to funding changes)
    pell = row.get('pell_rate', None)
    if pell is not None and pell > 0.45:
        severity = "high" if pell > 0.70 else ("medium" if pell > 0.55 else "low")
        factors.append({
            "factor": "High Pell Dependency",
            "value": f"{pell*100:.1f}%",
            "explanation": f"{pell*100:.0f}% of students rely on Pell Grants",
            "severity": severity,
            "priority": 0 if severity == "high" else (1 if severity == "medium" else 2)
        })
    
    # 4. High admission rate (non-selective)
    admission = row.get('admission_rate', None)
    if admission is not None and admission > 0.85:
        factors.append({
            "factor": "Non-Selective Admissions",
            "value": f"{admission*100:.1f}%",
            "explanation": "Admits most applicants, may face quality perception issues",
            "severity": "low",
            "priority": 2
        })
    
    # 5. Poor debt-to-earnings ratio
    earnings = row.get('earnings_4yr', None)
    debt = row.get('median_debt', None)
    if debt and earnings and debt > 0 and earnings > 0:
        debt_to_earnings = debt / earnings
        if debt_to_earnings > 0.55:
            severity = "high" if debt_to_earnings > 0.80 else ("medium" if debt_to_earnings > 0.65 else "low")
            factors.append({
                "factor": "Poor ROI",
                "value": f"{debt_to_earnings:.2f}x",
                "explanation": f"${debt:,.0f} debt vs ${earnings:,.0f} early earnings",
                "severity": severity,
                "priority": 0 if severity == "high" else (1 if severity == "medium" else 2)
            })
    
    # 6. Geographic isolation (harder to recruit)
    geo_isolation = row.get('geographic_isolation', None)
    if geo_isolation is not None and geo_isolation > 150:
        factors.append({
            "factor": "Geographic Isolation",
            "value": f"{geo_isolation:.0f} mi",
            "explanation": f"{geo_isolation:.0f} miles from nearest major metro",
            "severity": "low",
            "priority": 2
        })
    
    # Sort by priority (severity), take top 3
    factors_sorted = sorted(factors, key=lambda x: x['priority'])[:3]
    
    # Remove priority key from output
    for f in factors_sorted:
        del f['priority']
    
    # Count severities
    high_count = len([f for f in factors_sorted if f['severity'] == 'high'])
    med_count = len([f for f in factors_sorted if f['severity'] == 'medium'])
    
    summary = ""
    if high_count > 0:
        summary = f"{high_count} critical"
        if med_count > 0:
            summary += f", {med_count} moderate"
    elif med_count > 0:
        summary = f"{med_count} moderate concerns"
    else:
        summary = "Low risk"
    
    return {
        "factors": factors_sorted,
        "summary": summary
    }


def run_pipeline() -> pd.DataFrame:
    """Execute full data pipeline."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check for cached data
    cache_file = DATA_DIR / 'scorecard_raw.json'
    
    if cache_file.exists():
        print("Loading cached data...")
        with open(cache_file, 'r') as f:
            raw_data = json.load(f)
    else:
        print("Fetching fresh data from API...")
        raw_data = fetch_scorecard_data()
        with open(cache_file, 'w') as f:
            json.dump(raw_data, f)
    
    # Convert to DataFrame
    flat_data = [flatten_nested_dict(school) for school in raw_data]
    df = pd.DataFrame(flat_data)
    
    print(f"Raw data: {len(df)} schools, {len(df.columns)} columns")
    
    # Clean and engineer features
    df = clean_data(df)
    df = engineer_features(df)
    
    print(f"Processed data: {len(df)} schools after cleaning")
    
    # Save processed data
    processed_file = DATA_DIR / 'scorecard_processed.csv'
    df.to_csv(processed_file, index=False)
    print(f"Saved to {processed_file}")
    
    return df


if __name__ == '__main__':
    df = run_pipeline()
    print("\nSample statistics:")
    print(df[['retention_rate', 'resilience_risk_index', 'value_add_ratio']].describe())
