# Project Aegis — Pell Grant ROI Analytics

**CGI Hack-A-New-Year 2026 · Business Analytics Competition — Documentation**

---

## The Story

The Pell Grant once covered 61% of public university costs. Today it covers just 25%. This collapse has turned a completion investment into an access voucher—$30 billion annually subsidizing enrollment at institutions where many students never graduate. Project Aegis transforms raw College Scorecard data into an interactive policy brief that diagnoses the system's failures, predicts institutional risk, and prescribes evidence-based funding reforms.

## Data Sources

| Dataset                    | Source                                               | Records                                | Link                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| College Scorecard          | U.S. Department of Education (Data.gov)              | 1,810 bachelor's-granting institutions | [catalog.data.gov/dataset/college-scorecard](https://catalog.data.gov/dataset/college-scorecard)                                                                     |
| Pell Grant Max Awards      | Congressional Research Service / Federal Student Aid | 50 years (1973–2024)                   | [studentaid.gov/understand-aid/types/grants/pell](https://studentaid.gov/understand-aid/types/grants/pell)                                                           |
| Cost of Attendance History | College Board, _Trends in College Pricing_           | 50 years (1973–2024)                   | [research.collegeboard.org/trends/college-pricing](https://research.collegeboard.org/trends/college-pricing)                                                         |
| Regional Price Parities    | Bureau of Economic Analysis                          | 50 states + DC                         | [bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area](https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area) |

**API Endpoint:** `https://api.data.gov/ed/collegescorecard/v1/schools` — 30+ fields per institution including demographics, financials, completion rates, and earnings.

## Methods & Tools

| Layer        | Technology                                 | Purpose                                  |
| ------------ | ------------------------------------------ | ---------------------------------------- |
| Backend      | Python 3.13, FastAPI, Pandas, NumPy        | API data pipeline, feature engineering   |
| ML / Stats   | OLS Regression (sklearn), XGBoost          | Value-add scoring, earnings prediction   |
| Optimization | Linear Programming (PuLP)                  | Budget allocation maximizing graduates   |
| Frontend     | Next.js 16, React, Recharts, Framer Motion | Interactive dashboard and visualizations |

### Three-Tier Analytics

| Tier             | Metric                        | Method                                                                                 |
| ---------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| **Descriptive**  | Purchasing Power Gap          | Pell max award ÷ avg. cost of attendance (1974–2024 time series)                       |
| **Descriptive**  | Completion Gap                | 6-yr graduation rate: Pell vs. non-Pell within same institution                        |
| **Descriptive**  | Vertical Equity               | Net price for low-income families vs. Pell rate correlation                            |
| **Predictive**   | Bending the Curve (Value-Add) | OLS regression controlling for demographics → actual − expected completion (R² = 0.51) |
| **Predictive**   | Earnings Value-Add            | OLS on 10-yr median earnings, COL-adjusted via BEA RPP data (R² = 0.26)                |
| **Predictive**   | Institutional Viability       | Composite risk index: Pell dependency, completion rate, admission rate                 |
| **Prescriptive** | Enrollment Optimization       | LP via PuLP: maximize total graduates subject to budget constraint ($10M–$100M slider) |
| **Prescriptive** | Performance Allocation        | Bonus funding routed to high Value-Add institutions                                    |
| **Prescriptive** | Retention Trigger             | Emergency micro-grants for at-risk students flagged by predictive model                |

**Key Engineered Features:** Transfer-Adjusted Completion Rate (50% transfer success, per NSCRC data), Geographic Isolation Score (Haversine distance to nearest metro), Resilience Risk Index (composite of admission rate, completion rate, and Pell dependency), Carnegie-class imputation for missing values.

## Design Choices & Rationale

1. **Scrolling Policy Brief (not tabbed dashboard):** The site reads like a narrative argument — problem → evidence → solution → recommendations — to score on _Storytelling_ and communicate to non-technical decision-makers (_Business Value_).

2. **Equity-First Metric Design:** Every metric controls for student demographics. "Bending the Curve" uses OLS residuals so that schools serving disadvantaged populations aren't penalized for lower raw completion rates. We also address the "Creaming" risk — performance-based reforms must not incentivize schools to reject high-risk students.

3. **Bias Controls:** Transfer-adjusted completion (NSCRC source), cost-of-living adjustment (BEA RPP), Carnegie-class controls, and part-time student inclusion ensure analytical integrity (_Analytical Depth_).

4. **Interactive "What-If" Scenarios:** Budget slider ($10M–$100M), quadrant filtering on the Equity vs. Excellence matrix, and three strategy comparisons let users explore trade-offs in real time (_Innovation_, _User Experience_).

5. **CGI Brand Identity:** Deep-space dark theme with accent colors (#E31937 red, emerald, amber) applied consistently across charts, cards, and typography to demonstrate enterprise-grade polish.

---

_Built with real data from Data.gov · Project Aegis · CGI Hackathon 2026_
