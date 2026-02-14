# Equity Analytics Methodology

> **Technical Documentation for Project Aegis Metrics**
>
> Version 1.0 | February 2026

---

## Overview

Project Aegis uses a combination of statistical regression models and direct metrics from the U.S. Department of Education's College Scorecard API to evaluate institutional performance on equity and completion outcomes. This document details the exact methodology for each metric.

---

## 1. Bending the Curve (Value-Add Score)

### Purpose

Measures how well an institution performs on student completion relative to expectations given its student demographics. This "value-added" approach prevents penalizing schools that serve disadvantaged populations.

### Academic Foundation

Based on **Galvao, Tucker & Attewell (2025)**: "Bending the Curve: Institutional Value-Added in Higher Education Completion" ([PMC11737589](https://pmc.ncbi.nlm.nih.gov/articles/PMC11737589/)).

### Statistical Method

**Ordinary Least Squares (OLS) Linear Regression** using `sklearn.linear_model.LinearRegression`

### Input Features (Independent Variables)

| Feature              | Description                            | Data Source                                                |
| -------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `pell_rate`          | Proportion of Pell Grant recipients    | `latest.student.pell_grant_rate`                           |
| `full_time_share`    | 1 - part-time share                    | `latest.student.part_time_share`                           |
| `black_pct`          | Proportion Black/African American      | `latest.student.demographics.race_ethnicity.black`         |
| `hispanic_pct`       | Proportion Hispanic/Latino             | `latest.student.demographics.race_ethnicity.hispanic`      |
| `first_gen_share`    | Proportion first-generation students   | `latest.student.share_firstgeneration`                     |
| `ln_instruction_fte` | Log-transformed instructional spending | `log(latest.school.instructional_expenditure_per_fte + 1)` |
| `admission_rate`     | Selectivity control                    | `latest.admissions.admission_rate.overall`                 |
| `carnegie_basic`     | Carnegie Classification code (1-23)    | `school.carnegie_basic`                                    |

### Outcome Variable (Dependent Variable)

**Transfer-Adjusted Completion Rate:**

```
Transfer_Adjusted_Completion = Direct_Completion_Rate + (Transfer_Rate × 0.50)
```

Where:

- `Direct_Completion_Rate` = 6-year completion rate for first-time full-time students
- `Transfer_Rate` = Proportion who transfer to another 4-year institution
- `0.50` = 50% of transfers eventually complete a bachelor's degree elsewhere

**Source:** National Student Clearinghouse Research Center (NSCRC) — "Slightly less than half (49.7%) of students who transferred from a community college completed a bachelor's degree." ([Transfer Outcomes Report](https://nscresearchcenter.org/transfer-outcomes/))

> [!NOTE]
> This is conservative for certain pathways. Transfer completion rates are higher for:
>
> - **70.3%** — community college → public 4-year transfers
> - **60.1%** — students with prior dual enrollment

**Rationale:** Prevents penalizing institutions that successfully prepare students to transfer and complete at other schools (e.g., community colleges, regional universities).

### Calculation Steps

1. **Fit regression model** on schools with complete data:

   ```python
   model = LinearRegression()
   model.fit(X_features, y_transfer_adjusted_completion)
   ```

2. **Predict expected completion** for each school:

   ```python
   expected_completion = model.predict(X_all_schools)
   ```

3. **Calculate value-add:**
   ```python
   bending_curve = actual_completion - expected_completion
   bending_curve_pct = bending_curve × 100
   ```

### Interpretation

| Score  | Meaning                                                           |
| ------ | ----------------------------------------------------------------- |
| `+15%` | School completes 15 percentage points MORE students than expected |
| `0%`   | School performs exactly as expected given demographics            |
| `-10%` | School completes 10 percentage points FEWER than expected         |

### Model Performance

- **R² ≈ 0.506** – Model explains approximately 50% of completion variance
- Remaining variance represents true institutional effects plus unmeasured factors

---

## 2. Pell Gap (Equity Metric)

### Purpose

Measures completion equity between low-income (Pell Grant recipient) and higher-income students at each institution.

### Data Sources

| Metric                   | Scorecard Field                                                           |
| ------------------------ | ------------------------------------------------------------------------- |
| Pell Completion Rate     | `latest.completion.rate_suppressed.lt_four_year_150percent.pell_grant`    |
| Non-Pell Completion Rate | `latest.completion.rate_suppressed.lt_four_year_150percent.no_pell_grant` |

### Calculation

```python
pell_gap_pct = (pell_completion_rate - non_pell_completion_rate) × 100
```

### Interpretation

| Score  | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| `+5%`  | Pell students complete at 5 points HIGHER than non-Pell (strong equity) |
| `0%`   | No gap between populations                                              |
| `-12%` | Pell students complete at 12 points LOWER than non-Pell (equity gap)    |

---

## 3. Retention Rate

### Purpose

First-year student persistence—a leading indicator of eventual completion.

### Data Source

Direct from College Scorecard (no calculation):

```
latest.student.retention_rate.four_year.full_time
```

### Interpretation

Percentage of first-time, full-time students who return for their second year (0.0–1.0 scale displayed as 0–100%).

---

## 4. Instructional Expenditure per Student

### Purpose

Measures institutional investment in instruction per full-time equivalent student.

### Data Source

Direct from College Scorecard (no calculation):

```
latest.school.instructional_expenditure_per_fte
```

### Units

U.S. dollars per FTE student per year.

---

## 5. Earnings Value-Add (Risk-Adjusted)

### Purpose

Measures how much an institution's graduates out-earn expectations given student demographics. Addresses the bias where schools serving disadvantaged students appear to have worse earnings outcomes.

### Statistical Method

**OLS Linear Regression** predicting expected earnings, then calculating deviation.

### Cost-of-Living Adjustment

Before regression, all earnings are adjusted to national-average purchasing power using Bureau of Economic Analysis (BEA) Regional Price Parities (RPPs):

```python
col_adjusted_earnings = raw_earnings × (100 / state_RPP)
```

**Example RPP values (2024):**

| State       | RPP   | Effect                   |
| ----------- | ----- | ------------------------ |
| Mississippi | 86.8  | $50K → $57.6K equivalent |
| California  | 115.5 | $70K → $60.6K equivalent |
| Texas       | 97.4  | ~National average        |

### Input Features

| Feature           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `pell_rate`       | Low-income student proportion                     |
| `first_gen_share` | First-generation proportion                       |
| `female_share`    | Female student proportion (gender pay gap factor) |
| `black_pct`       | Black/African American proportion                 |
| `hispanic_pct`    | Hispanic/Latino proportion                        |
| `admission_rate`  | Selectivity control                               |
| `carnegie_basic`  | Program mix proxy                                 |

### Outcome Variable

**10-year median earnings** (COL-adjusted), falling back to 4-year earnings if unavailable.

### Calculation

```python
model.fit(X_features, y_col_adjusted_earnings)

expected_earnings = model.predict(X_all_schools)
earnings_value_add = actual_earnings - expected_earnings
earnings_value_add_pct = (earnings_value_add / expected_earnings) × 100
```

### Interpretation

| Score  | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| `+20%` | Graduates earn 20% MORE than expected given student demographics |
| `0%`   | Graduates earn exactly as expected                               |
| `-15%` | Graduates earn 15% LESS than expected                            |

### Model Performance

- **R² ≈ 0.262** – Model explains approximately 26% of earnings variance
- Lower R² is expected as earnings depend heavily on individual choices (field of study, location, etc.)

---

## 6. COL-Adjusted Earnings

### Purpose

Raw median earnings normalized to national purchasing power for fair geographic comparison.

### Formula

```python
col_adjusted = raw_earnings × (100 / state_RPP)
```

### Data Source

- **Primary:** `latest.earnings.10_yrs_after_entry.median`
- **Fallback:** `latest.earnings.4_yrs_after_entry.median_2`

---

## Quadrant Classification

Schools are classified into four quadrants based on their position on the Equity vs. Excellence matrix:

| Quadrant                | Criteria                           | Count |
| ----------------------- | ---------------------------------- | ----- |
| 🟢 **Equity Champions** | Pell Gap ≥ 0 AND Bending Curve ≥ 0 | ~10%  |
| 🔵 **Value-Add Focus**  | Pell Gap < 0 AND Bending Curve ≥ 0 | ~45%  |
| 🟡 **Equity Success**   | Pell Gap ≥ 0 AND Bending Curve < 0 | ~9%   |
| 🔴 **At-Risk**          | Pell Gap < 0 AND Bending Curve < 0 | ~35%  |

---

## Data Quality Notes

### Missing Value Handling

- Schools missing required fields are excluded from regression training
- For prediction, missing features are imputed with column medians
- Schools with privacy-suppressed completion data (< 10 completers) are excluded

### Sample Size Requirements

- Minimum 50 schools required for regression model fitting
- If threshold not met, value-add metrics return `null`

### Update Frequency

- College Scorecard data is updated annually (typically fall)
- Regional Price Parities updated annually by BEA

---

## References

1. Galvao, R., Tucker, J., & Attewell, P. (2025). Bending the Curve: Institutional Value-Added in Higher Education Completion. _Journal of Higher Education_. [PMC11737589](https://pmc.ncbi.nlm.nih.gov/articles/PMC11737589/)

2. U.S. Department of Education. College Scorecard Data. https://collegescorecard.ed.gov/data/

3. Bureau of Economic Analysis. Regional Price Parities by State. https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area

---

_Document generated for Project Aegis | CGI Federal Team_
