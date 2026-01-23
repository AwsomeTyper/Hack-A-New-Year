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
                  The foundation of this analysis is the <a href="https://catalog.data.gov/dataset/college-scorecard" target="_blank" className="text-[#E31937] hover:underline font-semibold">U.S. Department of Education College Scorecard</a> dataset, sourced directly from Data.gov. We utilize the most recent institution-level cohort data to ensure relevance.
                </p>
                
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Key Variables Extracted</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <code className="text-[#E31937] font-bold text-sm">RET_FT4</code>
                    <p className="text-sm text-gray-400 mt-1">Retention Rate (4-year institutions)</p>
                  </div>
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
                </div>
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
                    Visualizing the current landscape via <strong>KPI Dashboards</strong> and <strong>Geographic Heatmaps</strong>. We aggregate risk metrics by state to identify regional clusters of vulnerability, answering "What is happening now?"
                  </p>
                </div>

                {/* Predictive */}
                <div className="border-l-4 border-l-[#E31937] pl-6 py-1">
                  <h3 className="text-lg font-bold text-white">Predictive Modeling</h3>
                  <p className="text-gray-400 mt-2">
                    Forecasting future risk using a <strong>Resilience Risk Index</strong>. This weighted composite model combines financial health, academic performance, and student dependency ratios to predict institutional stability through 2026.
                  </p>
                </div>

                {/* Prescriptive */}
                <div className="border-l-4 border-l-white/40 pl-6 py-1">
                  <h3 className="text-lg font-bold text-white">Prescriptive Optimization</h3>
                  <p className="text-gray-400 mt-2">
                    Generating actionable recommendations via a <strong>Linear Programming (PuLP) Allocator</strong>. This model solves for the optimal distribution of "Additional Intervention Pilot" funds to maximize total student retention, subject to budget and equity constraints.
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
                      The dashboard follows a classic storytelling arc: <strong>The Hook</strong> (The 2026 Demographic Cliff), <strong>The Data</strong> (Resilience Scores), and <strong>The Solution</strong> (Scenario Planner). This ensures that users don't just see numbers, they see a path to action.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Human-Centric Explanations</h3>
                    <p className="text-gray-400">
                      We prioritize trust by providing natural language explanations for every high-risk determination (e.g., "Critical Risk driven by Low Retention"). This helps non-technical stakeholders trust the "black box" of AI.
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
                Project Aegis was built for the <strong>CGI Business Analytics Competition</strong>. It demonstrates how modern analytics can provide a "shield" for higher education institutions facing the 2026 demographic downturn.
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">Technology Stack</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <strong>Frontend:</strong> Next.js 14, Tailwind CSS
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <strong>Backend:</strong> Python (FastAPI)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <strong>ML Engine:</strong> SciKit-Learn, XGBoost
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
