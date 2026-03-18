'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-white">
      <Header />
      
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16 border-b border-white/10 pb-8">
          <h1 className="text-5xl font-bold mb-4 text-white tracking-tight">Documentation & Methodology</h1>
          <p className="text-xl text-[#94969C] max-w-2xl">
            A transparent overview of the data sources, analytical models, and design decisions behind Project Aegis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* 1. Data Sources */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#E31937] flex items-center justify-center text-sm font-bold text-white">1</span>
                Data Sources
              </h2>
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <p className="mb-6 text-gray-300 leading-relaxed">
                  The foundation of this analysis is the <a href="https://catalog.data.gov/dataset/college-scorecard" target="_blank" className="text-[#E31937] hover:underline font-semibold">U.S. Department of Education College Scorecard</a> dataset, sourced directly from Data.gov. We utilize the most recent institution-level cohort data (1,810 institutions) to ensure relevance.
                </p>
                
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Key Variables Extracted</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <code className="text-[#E31937] font-bold text-sm">PCTPELL</code>
                    <p className="text-sm text-gray-400 mt-1">Percentage of Pell Grant Recipients</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <code className="text-[#E31937] font-bold text-sm">C150_4</code>
                    <p className="text-sm text-gray-400 mt-1">Completion Rate (150% of expected time)</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <code className="text-[#E31937] font-bold text-sm">MD_EARN_WNE_P10</code>
                    <p className="text-sm text-gray-400 mt-1">Median Earnings (10 years post-entry)</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <code className="text-[#E31937] font-bold text-sm">NPT4_0_30000</code>
                    <p className="text-sm text-gray-400 mt-1">Net Price for Low-Income Students</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-400">
                  Additional sources include <strong>Congressional Research Service</strong> (Pell Max Awards 1973–2024), <strong>College Board</strong> (Cost of Attendance History), and <strong>Bureau of Economic Analysis</strong> (Regional Price Parities for COL adjustments).
                </p>
              </div>
            </section>

            {/* 2. Analytical Methods */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#005288] flex items-center justify-center text-sm font-bold text-white">2</span>
                Analytical Methods
              </h2>
              <div className="space-y-6">
                
                {/* Descriptive */}
                <div className="border-l-4 border-l-cgi-blue-light pl-6 py-1">
                  <h3 className="text-lg font-bold text-white">Descriptive Analytics</h3>
                  <p className="text-gray-400 mt-2">
                    <strong>Purchasing Power Gap:</strong> Ratio of Max Pell Award to Avg. Cost of Attendance (50-yr trend).<br/>
                    <strong>Completion Gap:</strong> 6-yr graduation rate comparison (Pell vs. Non-Pell) within the same institution.<br/>
                    <strong>Vertical Equity Analysis:</strong> Per-student instructional spending vs. completion rate by region, revealing resource allocation patterns.<br/>
                    <strong>State Risk Distribution:</strong> Aggregated risk metrics by state to identify regional clusters of vulnerability.<br/>
                    Visualizing the current landscape via <strong>KPI Dashboards</strong> and interactive charts, answering &quot;What is happening now?&quot;
                  </p>
                </div>

                {/* Predictive */}
                <div className="border-l-4 border-l-[#E31937] pl-6 py-1">
                  <h3 className="text-lg font-bold text-white">Predictive Modeling</h3>
                  <p className="text-gray-400 mt-2">
                    <strong>Bending the Curve (OLS):</strong> Value-add model predicting completion based on demographics (R²=0.506).<br/>
                    <strong>Dropout Risk Classifier:</strong> Logistic regression classifying institutions as high/low dropout risk using net price, debt, retention, Pell rate, and enrollment size (5-fold cross-validated AUC).<br/>
                    <strong>Price Elasticity:</strong> Calibrated economic model estimating enrollment response to grant changes (base ε = −0.8), bounded to [−2.0, −0.2] per institution.<br/>
                    <strong>Viability Risk Index:</strong> Composite score weighting retention (40%), completion (30%), Pell dependency (20%), and admission rate (10%).
                  </p>
                </div>

                {/* Prescriptive */}
                <div className="border-l-4 border-l-white/40 pl-6 py-1">
                  <h3 className="text-lg font-bold text-white">Prescriptive Optimization</h3>
                  <p className="text-gray-400 mt-2">
                    <strong>Linear Programming (PuLP):</strong> Solves for the optimal distribution of federal investment funds to maximize total student retention, subject to budget and equity constraints.<br/>
                    <strong>Fairness Auditing (fairlearn):</strong> Post-optimization bias checks verify demographic parity and equalized odds, guarding against &quot;creaming&quot; — the tendency to fund only easy-to-succeed institutions while excluding those serving the most vulnerable populations.
                  </p>
                </div>

              </div>
            </section>

             {/* 3. Design Rationale */}
             <section>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#5A5B5D] flex items-center justify-center text-sm font-bold text-white">3</span>
                Design & Innovation
              </h2>
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Narrative-Driven UX</h3>
                    <p className="text-gray-400">
                      The dashboard follows a classic storytelling arc: <strong>The Hook</strong> (Purchasing Power Collapse), <strong>The Evidence</strong> (Equity & Completion gaps), and <strong>The Solution</strong> (Optimized Funding). This ensures that users don&apos;t just see numbers, they see a path to action.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Human-Centric Explanations</h3>
                    <p className="text-gray-400">
                      We prioritize trust by providing natural language explanations for every high-risk determination (e.g., &quot;Critical Risk driven by Low Retention&quot;). This helps non-technical stakeholders trust the &quot;black box&quot; of AI.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Project Aegis: A &quot;Shield&quot; for Students</h3>
                    <p className="text-gray-400">
                      The name &quot;Aegis&quot; (Ancient Greek for &quot;shield&quot;) reflects our mission: to protect vulnerable students from financial and academic precarity by empowering data-driven policy.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Radical Transparency</h3>
                    <p className="text-gray-400">
                      Every metric, model output, and threshold on the dashboard includes an InfoTooltip (ℹ) explaining its source, calculation, and limitations. Over 30 tooltips ensure no number is a &quot;black box.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Sidebar / Quick Links */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#E31937]/10 rounded-xl p-6 border border-[#E31937]/20">
              <h3 className="text-[#E31937] font-bold mb-2 text-sm uppercase tracking-wide">About the Project</h3>
              <p className="text-sm text-gray-300">
                Project Aegis was built for the <strong>CGI Business Analytics Competition</strong>. It transforms the $30B Pell Grant program from an access voucher into a completion investment using advanced prescriptive analytics.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Technology Stack</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <strong>Frontend:</strong> Next.js 16, React, Recharts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <strong>Backend:</strong> Python 3.13, FastAPI
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <strong>ML Engine:</strong> Scikit-Learn, XGBoost
                </li>
                 <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <strong>Optimization:</strong> PuLP (Linear Programming)
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
