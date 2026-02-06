"""
Regional Price Parities (RPP) for Cost of Living Adjustment
Source: Bureau of Economic Analysis (BEA)
Updated: 2024 data

RPP = 100 means national average
RPP > 100 means higher cost of living
RPP < 100 means lower cost of living

Use: adjusted_earnings = raw_earnings * (100 / RPP)
This converts earnings to national-average purchasing power.
"""

# BEA Regional Price Parities by State (2024)
# https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
RPP_BY_STATE = {
    'AL': 88.1,  # Alabama
    'AK': 105.4,  # Alaska
    'AZ': 97.8,  # Arizona
    'AR': 87.8,  # Arkansas
    'CA': 115.5,  # California
    'CO': 103.0,  # Colorado
    'CT': 109.0,  # Connecticut
    'DE': 101.5,  # Delaware
    'DC': 117.0,  # District of Columbia
    'FL': 100.5,  # Florida
    'GA': 93.5,  # Georgia
    'HI': 119.2,  # Hawaii
    'ID': 94.3,  # Idaho
    'IL': 97.8,  # Illinois
    'IN': 90.9,  # Indiana
    'IA': 90.2,  # Iowa
    'KS': 90.1,  # Kansas
    'KY': 89.4,  # Kentucky
    'LA': 91.0,  # Louisiana
    'ME': 97.5,  # Maine
    'MD': 108.6,  # Maryland
    'MA': 110.8,  # Massachusetts
    'MI': 93.1,  # Michigan
    'MN': 97.8,  # Minnesota
    'MS': 86.8,  # Mississippi
    'MO': 89.8,  # Missouri
    'MT': 94.2,  # Montana
    'NE': 91.5,  # Nebraska
    'NV': 98.2,  # Nevada
    'NH': 105.8,  # New Hampshire
    'NJ': 114.5,  # New Jersey
    'NM': 93.5,  # New Mexico
    'NY': 115.9,  # New York
    'NC': 92.5,  # North Carolina
    'ND': 93.4,  # North Dakota
    'OH': 90.8,  # Ohio
    'OK': 89.6,  # Oklahoma
    'OR': 101.0,  # Oregon
    'PA': 97.2,  # Pennsylvania
    'RI': 101.1,  # Rhode Island
    'SC': 90.1,  # South Carolina
    'SD': 91.0,  # South Dakota
    'TN': 91.0,  # Tennessee
    'TX': 97.4,  # Texas
    'UT': 98.5,  # Utah
    'VT': 101.0,  # Vermont
    'VA': 103.6,  # Virginia
    'WA': 106.4,  # Washington
    'WV': 88.0,  # West Virginia
    'WI': 93.8,  # Wisconsin
    'WY': 96.2,  # Wyoming
    'PR': 85.0,  # Puerto Rico (estimated)
    'GU': 100.0,  # Guam (use national average)
    'VI': 100.0,  # Virgin Islands (use national average)
}


def adjust_earnings_for_col(earnings: float, state: str) -> float:
    """
    Adjust earnings for cost of living using Regional Price Parities.
    
    Converts raw earnings to national-average purchasing power.
    A $50k salary in Mississippi (RPP=86.8) becomes ~$57.6k in purchasing power.
    A $70k salary in California (RPP=115.5) becomes ~$60.6k in purchasing power.
    
    Args:
        earnings: Raw median earnings
        state: Two-letter state code
        
    Returns:
        Earnings adjusted to national-average purchasing power
    """
    if earnings is None or earnings <= 0:
        return None
    
    rpp = RPP_BY_STATE.get(state, 100.0)
    return earnings * (100.0 / rpp)


def get_state_rpp(state: str) -> float:
    """Get the Regional Price Parity for a state."""
    return RPP_BY_STATE.get(state, 100.0)
