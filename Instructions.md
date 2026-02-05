Data is everywhere, but raw numbers don’t tell a story on their own. The United States Federal Government established Data.gov in 2009 with the goal of improving public access to high value, machine-readable datasets. Since then, the site has grown to more than 370,000 datasets, capturing everything from lotto numbers to food prices to storm events. The data is the starting point, what you do with it tells the story.

Your challenge is to design and prototype a business analytics solution that combines descriptive analytics (summarizing and visualizing trends) with predictive modeling (forecasting what might happen next) using one or more of the datasets available on Data.gov to provide recommendations to decision-makers.

**Your solution should:**

- Visualize insights: Build dashboards or reports that summarize trends, KPIs, and patterns.
- Tell a story: Use visuals that highlight key takeaways and support decision-making.
- Predict the future: Incorporate predictive modelling to help identify what will happen in the future.
- Support decisions: Show how the platform helps identify risks, opportunities, and “what-if” scenarios.
- Make recommendations: Use prescriptive models to give recommendations on how to move forward.

**Deliverables:**

**Prototype: A working demo showcasing dashboards, visualizations, and at least one predictive feature (descriptive, predictive, and prescriptive).**

- Dashboards or visualizations built from Data.gov data.
- At least one predictive component (such as a simple forecast, trend model, machine learning prediction or ect.)
- Clear connections between the data insights and recommendations for decision-makers.

**Documentation: A clear 1 page write-up of data sources, methods, and design choices.**

- The datasets you used (with links to Data.gov).
- Your methods and tools.
- Key design choices and rationale for your approach.

By the end of this challenge, your solution will turn raw Government data from Data.gov into actionable insights and you’ll show your ability to communicate findings that drive smarter business decisions.

**Evaluation Rubric**

**Guidelines**

**Storytelling and Visualization**

- Are insights easy to understand and presented in a compelling way?
- Does the documentation explain the story behind the data effectively?
  (20 points)

**Analytical depth**

- Are one or more analytical techniques (descriptive, predictive, or prescriptive) applied effectively and appropriately within the prototype?
- Are methods clearly described in the documentation?
  (20 points)

**Business value**

- Are the benefits and recommendations communicated clearly to non-technical decision-makers through the prototype and documentation?
  (20 points)

**User experience**

- Is the prototype intuitive, visually engaging, and easy to navigate?
- Does the documentation make it easy for others to understand how the prototype works?
  (20 points)

**Innovation**

- Does the solution stand out in its approach, design, or application of analytics?
- Does the documentation reflect creative problem-solving or unique thinking?
  (20 points)

**Total**
(100 points)

New objectives:

1. Descriptive Analysis: The "State of the System"
   Goal: Understand where the money is going and identify the current inefficiencies.

This stage looks at historical data to identify patterns. You cannot optimize what you cannot measure.

Key Metric: The "Purchasing Power" Gap

Analysis: Calculate the ratio of Maximum Pell Award to Average Cost of Attendance (CoA) over the last 50 years.

Insight: This reveals that while nominal funding increases, the real value (efficacy) of the grant decreases annually.

Key Metric: The "Completion Gap"

Analysis: Compare 6-year graduation rates of Pell recipients vs. non-Pell recipients within the same institutions.

Insight: If a university takes $50M in Pell funds but graduates only 20% of those students, the descriptive analysis flags this as a "High-Input, Low-Output" node in the network.

Key Metric: Vertical Equity

Analysis: Assess if funding correlates with "Unmet Need" (Cost minus Expected Family Contribution). Are funds reaching the absolute poorest, or "leaking" to middle-income brackets due to formula quirks?

2. Predictive Analysis: The "Risk & Probability" Models
   Goal: Forecast future outcomes based on current variables to intervene before failure occurs.

Instead of just reporting dropout rates (descriptive), you use regression models to predict who will drop out and when.

Model: Drop-out Risk Scoring (Logistic Regression)

Variables: Unmet financial need, debt-to-income ratio, first-semester GPA, and part-time/full-time status.

Hypothesis: You might find that for every $1,000 "gap" between aid and cost, the probability of graduation drops by 7%.

Model: Price Elasticity of Enrollment

Question: "If we increase the Pell Grant by $500, how many marginal students (who otherwise wouldn't attend) will enroll?"

Application: This helps the DOE predict if increasing the grant cap will actually boost enrollment or just subsidize students who were already going to attend.

Model: Institutional Viability Forecasting

Analysis: Predict which institutions are likely to close or lose accreditation based on their dependence on Pell revenue vs. their alumni repayment rates.

3. Prescriptive Analysis: The "Optimization" Strategy
   Goal: Use algorithms to recommend specific actions that maximize ROI under budget constraints.

This is the most advanced tier. It doesn't just tell you what will happen; it tells you what you should do.

Strategy: Variable/Performance-Based Pricing

Current State: A student gets $7,395 regardless of whether they attend a high-graduation-rate public university or a low-performance for-profit school.

Prescription: An optimization algorithm could suggest "Bonus Allocations"—awarding additional funds to institutions that demonstrate high "Value-Added" mobility scores (moving students from the bottom income quintile to the top).

Strategy: The "Retention Grant" Trigger

Mechanism: Instead of dispersing all funds at the start of the semester, prescriptive models might recommend reserving 10% of the fund for "Emergency Retention Grants."

Trigger: When the Predictive Model (from step 2) detects a student is at high risk of dropping out due to a small financial shock (e.g., a broken car), the system prescribes an automatic micro-grant to prevent the drop-out.

Strategy: Enrollment Management Optimization

Algorithm: Linear Programming (LP) to maximize total Graduates subject to the constraint of Total Budget.

Output: The model might reveal that reducing individual grant amounts slightly to fund more students leads to fewer degrees (dilution), whereas concentrating larger grants on fewer students maximizes total degrees obtained.

Narrative Shift:

The current system essentially functions as a "voucher" for access, but it has failed to evolve into an investment in completion. If you are researching this for a project or thesis, here are the three strongest arguments for why the distribution model is flawed, along with the critical risk of changing it.

1. The "Purchasing Power" Erosion
   The most immediate argument for change is that the grant no longer does what it was designed to do.

The Flaw: When the Pell Grant was created, it covered nearly 80% of the cost of attendance at a public four-year university. Today, it covers roughly 30%.

The Consequence: This forces low-income students to bridge the gap with loans or full-time work. This creates a "poverty penalty"—the students who most need time to study are the ones forced to work the most hours to survive, leading to lower grades and higher dropout rates.

The Fix: Many economists argue the distribution shouldn't just be a flat number adjusted for inflation, but indexed to the actual cost of public tuition, restoring its original economic power.

2. The Lack of Institutional Accountability
   Currently, universities receive Pell dollars based on enrollment, not results.

The Flaw: If a university recruits 1,000 Pell students, takes the grant money, and 900 of them drop out with no degree and debt, the university suffers almost no financial penalty. In fact, aggressive "predatory" recruiting is incentivized.

The Consequence: Federal funds effectively subsidize failure at low-performing institutions rather than rewarding success at high-performing ones.

The Fix: A "Risk-Sharing" model. If a student defaults on their loans or drops out, the university should be required to pay back a portion of the federal aid. This would force schools to invest in student support services rather than just marketing.

3. The "Front-Loading" Inefficiency
   The current system distributes money equally across semesters (or years), assuming a linear path to a degree.

The Flaw: Dropout risks are not linear; they are highest in the first year and during specific financial emergencies. A steady drip of money doesn't help when a student needs a large sum now to fix a car to get to class.

The Fix: Flexible distribution. Allow for "Emergency Micro-Grants" or "Front-Loaded" aid that gives students more support early on when they are most vulnerable to dropping out.

The Critical Counter-Argument (The "Creaming" Effect)
While changing the distribution to be "performance-based" sounds economically sound, it carries a massive risk that you should address in your research.

If you punish schools for low graduation rates or loan repayment numbers, they might stop admitting "risky" students (low-income, first-generation, or those with difficult backgrounds) to protect their funding. This is called "Creaming" (skimming the cream off the top).

The Reform Dilemma: How do you hold schools accountable for poor results without incentivizing them to shut their doors to the poor?
