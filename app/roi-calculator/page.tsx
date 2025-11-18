// app/roi-calculator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ROICalculatorPage() {
  // Input values
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(20); // percentage
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTerm, setLoanTerm] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [propertyTax, setPropertyTax] = useState(3600); // annual
  const [insurance, setInsurance] = useState(1200); // annual
  const [maintenance, setMaintenance] = useState(2400); // annual
  const [vacancy, setVacancy] = useState(5); // percentage
  const [propertyManagement, setPropertyManagement] = useState(10); // percentage

  // Calculated values
  const [results, setResults] = useState({
    downPaymentAmount: 0,
    loanAmount: 0,
    monthlyMortgage: 0,
    totalMonthlyExpenses: 0,
    monthlyCashFlow: 0,
    annualCashFlow: 0,
    noi: 0,
    capRate: 0,
    cashOnCashReturn: 0,
    totalCashInvested: 0,
  });

  useEffect(() => {
    calculateROI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasePrice, downPayment, interestRate, loanTerm, monthlyRent, propertyTax, insurance, maintenance, vacancy, propertyManagement]);

  const calculateROI = () => {
    // Down payment amount
    const downPaymentAmount = purchasePrice * (downPayment / 100);

    // Loan amount
    const loanAmount = purchasePrice - downPaymentAmount;

    // Monthly mortgage payment (P&I)
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyMortgage = loanAmount > 0
      ? (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : 0;

    // Annual rental income
    const annualRentalIncome = monthlyRent * 12;

    // Vacancy loss
    const vacancyLoss = annualRentalIncome * (vacancy / 100);

    // Effective rental income
    const effectiveRentalIncome = annualRentalIncome - vacancyLoss;

    // Property management fees
    const managementFees = effectiveRentalIncome * (propertyManagement / 100);

    // Total annual operating expenses
    const annualOperatingExpenses = propertyTax + insurance + maintenance + managementFees;

    // Net Operating Income (NOI)
    const noi = effectiveRentalIncome - annualOperatingExpenses;

    // Annual debt service
    const annualDebtService = monthlyMortgage * 12;

    // Annual cash flow
    const annualCashFlow = noi - annualDebtService;

    // Monthly cash flow
    const monthlyCashFlow = annualCashFlow / 12;

    // Total monthly expenses (including mortgage)
    const totalMonthlyExpenses = (annualOperatingExpenses / 12) + monthlyMortgage;

    // Cap Rate
    const capRate = (noi / purchasePrice) * 100;

    // Total cash invested (down payment + closing costs estimate)
    const closingCosts = purchasePrice * 0.03; // Estimate 3% closing costs
    const totalCashInvested = downPaymentAmount + closingCosts;

    // Cash-on-Cash Return
    const cashOnCashReturn = (annualCashFlow / totalCashInvested) * 100;

    setResults({
      downPaymentAmount,
      loanAmount,
      monthlyMortgage,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualCashFlow,
      noi,
      capRate,
      cashOnCashReturn,
      totalCashInvested,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-text {
          background: linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient 3s ease infinite;
        }

        .glow-button {
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
          </Link>
          <nav className="flex gap-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
            <Link href="/roi-calculator" className="text-white transition-colors">ROI Calculator</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">
            Real Estate <span className="gradient-text">ROI Calculator</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Calculate your investment returns with our interactive calculator. Adjust the inputs below to see how different scenarios impact your cash flow, cap rate, and cash-on-cash return.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>

              {/* Purchase Price */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Purchase Price</label>
                  <span className="text-purple-400 font-semibold">{formatCurrency(purchasePrice)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="10000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                />
              </div>

              {/* Down Payment */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Down Payment</label>
                  <span className="text-purple-400 font-semibold">{downPayment}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
              </div>

              {/* Interest Rate */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Interest Rate</label>
                  <span className="text-purple-400 font-semibold">{interestRate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.25"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>

              {/* Loan Term */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Loan Term</label>
                  <span className="text-purple-400 font-semibold">{loanTerm} years</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="30"
                  step="5"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Income & Expenses</h2>

              {/* Monthly Rent */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Monthly Rent</label>
                  <span className="text-purple-400 font-semibold">{formatCurrency(monthlyRent)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                />
              </div>

              {/* Property Tax */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Property Tax (Annual)</label>
                  <span className="text-purple-400 font-semibold">{formatCurrency(propertyTax)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12000"
                  step="100"
                  value={propertyTax}
                  onChange={(e) => setPropertyTax(Number(e.target.value))}
                />
              </div>

              {/* Insurance */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Insurance (Annual)</label>
                  <span className="text-purple-400 font-semibold">{formatCurrency(insurance)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={insurance}
                  onChange={(e) => setInsurance(Number(e.target.value))}
                />
              </div>

              {/* Maintenance */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Maintenance (Annual)</label>
                  <span className="text-purple-400 font-semibold">{formatCurrency(maintenance)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={maintenance}
                  onChange={(e) => setMaintenance(Number(e.target.value))}
                />
              </div>

              {/* Vacancy Rate */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Vacancy Rate</label>
                  <span className="text-purple-400 font-semibold">{vacancy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={vacancy}
                  onChange={(e) => setVacancy(Number(e.target.value))}
                />
              </div>

              {/* Property Management */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white/80">Property Management Fee</label>
                  <span className="text-purple-400 font-semibold">{propertyManagement}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={propertyManagement}
                  onChange={(e) => setPropertyManagement(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Key Metrics</h2>

              <div className="space-y-6">
                {/* Cash Flow */}
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="text-white/60 mb-2">Monthly Cash Flow</div>
                  <div className={`text-4xl font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(results.monthlyCashFlow)}
                  </div>
                  <div className="text-white/40 text-sm mt-2">
                    Annual: {formatCurrency(results.annualCashFlow)}
                  </div>
                </div>

                {/* Cap Rate */}
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="text-white/60 mb-2">Capitalization Rate</div>
                  <div className="text-4xl font-bold text-purple-400">
                    {formatPercent(results.capRate)}
                  </div>
                  <div className="text-white/40 text-sm mt-2">
                    NOI: {formatCurrency(results.noi)}
                  </div>
                </div>

                {/* Cash-on-Cash Return */}
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="text-white/60 mb-2">Cash-on-Cash Return</div>
                  <div className={`text-4xl font-bold ${results.cashOnCashReturn >= 8 ? 'text-green-400' : results.cashOnCashReturn >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatPercent(results.cashOnCashReturn)}
                  </div>
                  <div className="text-white/40 text-sm mt-2">
                    Target: 8-12%
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Investment Breakdown</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-white/70">
                  <span>Down Payment</span>
                  <span className="text-white font-semibold">{formatCurrency(results.downPaymentAmount)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Closing Costs (est. 3%)</span>
                  <span className="text-white font-semibold">{formatCurrency(results.totalCashInvested - results.downPaymentAmount)}</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between">
                  <span className="text-white font-bold">Total Cash Invested</span>
                  <span className="text-purple-400 font-bold text-xl">{formatCurrency(results.totalCashInvested)}</span>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-white/70">
                    <span>Loan Amount</span>
                    <span className="text-white font-semibold">{formatCurrency(results.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Monthly Mortgage (P&I)</span>
                    <span className="text-white font-semibold">{formatCurrency(results.monthlyMortgage)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Total Monthly Expenses</span>
                    <span className="text-white font-semibold">{formatCurrency(results.totalMonthlyExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Analysis</h2>
              <div className="space-y-3 text-white/70">
                {results.monthlyCashFlow >= 0 ? (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Positive cash flow indicates the property generates income after all expenses.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Negative cash flow means you'll need to cover the shortfall each month.</span>
                  </div>
                )}

                {results.capRate >= 6 ? (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Cap rate of {formatPercent(results.capRate)} is considered good for most markets.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Cap rate below 6% may indicate lower returns or appreciation-focused market.</span>
                  </div>
                )}

                {results.cashOnCashReturn >= 8 ? (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Cash-on-cash return of {formatPercent(results.cashOnCashReturn)} meets investor target of 8-12%.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Cash-on-cash return below 8% may indicate lower immediate returns.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want AI-Powered Analysis for Real Properties?
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Get instant access to real property data, AI insights, and comprehensive financial analysis with ARGORA DEALS.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-full font-semibold text-lg glow-button"
          >
            Start Analyzing Real Deals
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">ARGORA DEALS</div>
              <p className="text-white/60">AI-powered real estate investment analysis</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/roi-calculator" className="text-white/60 hover:text-white transition-colors">ROI Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-white/60">adam@argora.ai</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 ARGORA DEALS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
