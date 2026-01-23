# Project Aegis: University Resilience Suite

**One-Page Documentation for CGI Business Analytics Competition**

---

## The Challenge

By 2026, the U.S. higher education sector faces a "Demographic Cliff"—a 15%+ decline in college-age population caused by falling birth rates after the 2008 financial crisis. Tuition-dependent institutions, particularly regional public universities and small private colleges, face existential risk.

**Project Aegis** is a Strategic Resilience Engine that helps university administrators identify risk, predict outcomes, and optimize decisions to survive this transformation.

---

## Data Sources

| Dataset           | Source                                   | Link                                                                                     |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| College Scorecard | U.S. Department of Education             | [data.gov/dataset/college-scorecard](https://catalog.data.gov/dataset/college-scorecard) |
| Institution Data  | 1,810 bachelor's degree-granting schools | Fetched via REST API                                                                     |

**API Endpoint**: `https://api.data.gov/ed/collegescorecard/v1/schools`

---

## Methods & Tools

### Technology Stack

- **Backend**: Python 3.13, FastAPI, Pandas, NumPy
- **ML/Optimization**: XGBoost (regression), SHAP (explainability), PuLP (linear programming)
- **Frontend**: Next.js 16, React, Recharts, Tailwind CSS
- **Development**: Google Antigravity (agentic AI IDE)

### Analytics Approach

| Tier             | Technique                          | Implementation                                             |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| **Descriptive**  | Summary statistics, visualizations | KPI cards, risk histogram, trend charts                    |
| **Predictive**   | XGBoost regression                 | Retention rate forecasting with SHAP explanations          |
| **Prescriptive** | Linear programming                 | Financial aid optimizer maximizing yield under constraints |

### Engineered Features

1. **Resilience Risk Index**: Composite of admission rate, completion rate, Pell dependency
2. **Value-Add Ratio**: Median earnings ÷ Net price (ROI proxy)
3. **Geographic Isolation Score**: Haversine distance to nearest major metro

---

## Design Choices & Rationale

### 1. CGI Branding

Strict adherence to CGI's visual identity (#E31937 red, #005288 blue) to demonstrate enterprise-grade professionalism.

### 2. Z-Pattern Dashboard Layout

Eye-tracking research shows users scan in a Z-pattern. Critical Resilience Score is anchored top-left; details flow right and down.

### 3. Scenario Planner

Decision-makers need "what-if" analysis. Interactive sliders let administrators see real-time impact of budget changes on enrollment outcomes.

### 4. Fairness-First Design

Higher education analytics can perpetuate inequality. We built fairness auditing into the pipeline using the four-fifths rule to detect demographic disparities.

### 5. Agentic Development

Custom "Agent Skills" (cgi-brand-stylist, scorecard-api-expert, fairness-bias-auditor) encode domain knowledge for consistent, high-quality output.

---

## Key Insights

| Finding                                       | Implication                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| **306 schools** (41%) are High/Critical risk  | Immediate intervention needed for nearly half the sector   |
| **Revenue rising despite enrollment decline** | Price increases mask vulnerability—unsustainable post-2026 |
| **Geographic isolation** correlates with risk | Rural institutions need targeted support strategies        |

---

## Recommendations

1. **Prioritize Retention**: Retaining students is cheaper than recruiting new ones
2. **Optimize Aid Allocation**: Use LP optimization to maximize yield within budget
3. **Monitor Resilience Score**: Track institutional health quarterly
4. **Plan for 2026 Now**: Institutions in "yellow zone" have 2-3 years to pivot

---

_Built with the CGI Data2Diamonds methodology_
