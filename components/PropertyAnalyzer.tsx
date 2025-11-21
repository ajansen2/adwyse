'use client';

import { useState, useEffect } from 'react';

interface PropertyInput {
  address: string;
  purchasePrice: number;
  downPayment: number; // percentage
  interestRate: number;
  loanTerm: number;
  monthlyRent: number;
  propertyTax: number; // annual
  insurance: number; // annual
  maintenance: number; // annual
  vacancy: number; // percentage
  propertyManagement: number; // percentage
  [key: string]: string | number; // Index signature for compatibility
}

interface CalculatedMetrics {
  downPaymentAmount: number;
  loanAmount: number;
  monthlyMortgage: number;
  totalMonthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  totalCashInvested: number;
  roi: number;
  [key: string]: number; // Index signature for compatibility
}

interface SavePropertyData {
  address: string;
  purchasePrice: number;
  currentValue: number;
  monthlyRent: number;
  monthlyCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  noi: number;
  roi: number;
  status: string;
  inputs: PropertyInput;
  metrics: CalculatedMetrics;
  createdAt: string;
}

export default function PropertyAnalyzer({ onClose, onSave }: { onClose: () => void; onSave: (property: SavePropertyData) => void }) {
  const [step, setStep] = useState(1);
  const [propertyInput, setPropertyInput] = useState<PropertyInput>({
    address: '',
    purchasePrice: 300000,
    downPayment: 20,
    interestRate: 7.0,
    loanTerm: 30,
    monthlyRent: 2500,
    propertyTax: 3600,
    insurance: 1200,
    maintenance: 2400,
    vacancy: 5,
    propertyManagement: 10,
  });

  const [metrics, setMetrics] = useState<CalculatedMetrics>({
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
    roi: 0,
  });

  useEffect(() => {
    calculateMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyInput]);

  const calculateMetrics = () => {
    const {
      purchasePrice,
      downPayment,
      interestRate,
      loanTerm,
      monthlyRent,
      propertyTax,
      insurance,
      maintenance,
      vacancy,
      propertyManagement,
    } = propertyInput;

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

    // Total annual operating expenses (PITI + management)
    const annualOperatingExpenses = propertyTax + insurance + maintenance + managementFees;

    // Net Operating Income (NOI) - Industry standard calculation
    const noi = effectiveRentalIncome - annualOperatingExpenses;

    // Annual debt service
    const annualDebtService = monthlyMortgage * 12;

    // Annual cash flow
    const annualCashFlow = noi - annualDebtService;

    // Monthly cash flow
    const monthlyCashFlow = annualCashFlow / 12;

    // Total monthly expenses (including mortgage)
    const totalMonthlyExpenses = (annualOperatingExpenses / 12) + monthlyMortgage;

    // Cap Rate - Industry standard: NOI / Purchase Price
    const capRate = (noi / purchasePrice) * 100;

    // Total cash invested (down payment + closing costs estimate)
    const closingCosts = purchasePrice * 0.03; // Estimate 3% closing costs
    const totalCashInvested = downPaymentAmount + closingCosts;

    // Cash-on-Cash Return - Industry standard: Annual Cash Flow / Total Cash Invested
    const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

    // ROI - Simple appreciation metric
    const roi = 0; // Will be calculated when property appreciates

    setMetrics({
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
      roi,
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

  const handleSave = () => {
    const property = {
      address: propertyInput.address,
      purchasePrice: propertyInput.purchasePrice,
      currentValue: propertyInput.purchasePrice,
      monthlyRent: propertyInput.monthlyRent,
      monthlyCashFlow: metrics.monthlyCashFlow,
      capRate: metrics.capRate,
      cashOnCashReturn: metrics.cashOnCashReturn,
      noi: metrics.noi,
      roi: metrics.roi,
      status: 'Analyzing',
      inputs: propertyInput,
      metrics: metrics,
      createdAt: new Date().toISOString(),
    };
    onSave(property);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 rounded-3xl max-w-6xl w-full p-8 my-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Add New Property</h2>
            <p className="text-white/60">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Property Details & Financing */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Property Information</h3>

                  {/* Address */}
                  <div className="mb-6">
                    <label className="block text-white/80 mb-2">Property Address</label>
                    <input
                      type="text"
                      value={propertyInput.address}
                      onChange={(e) => setPropertyInput({ ...propertyInput, address: e.target.value })}
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Purchase Price */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Purchase Price</label>
                      <span className="text-purple-400 font-semibold">{formatCurrency(propertyInput.purchasePrice)}</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="2000000"
                      step="10000"
                      value={propertyInput.purchasePrice}
                      onChange={(e) => setPropertyInput({ ...propertyInput, purchasePrice: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Down Payment */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Down Payment</label>
                      <span className="text-purple-400 font-semibold">{propertyInput.downPayment}% ({formatCurrency(metrics.downPaymentAmount)})</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={propertyInput.downPayment}
                      onChange={(e) => setPropertyInput({ ...propertyInput, downPayment: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Interest Rate</label>
                      <span className="text-purple-400 font-semibold">{propertyInput.interestRate.toFixed(2)}%</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="0.25"
                      value={propertyInput.interestRate}
                      onChange={(e) => setPropertyInput({ ...propertyInput, interestRate: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Loan Term */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Loan Term</label>
                      <span className="text-purple-400 font-semibold">{propertyInput.loanTerm} years</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="30"
                      step="5"
                      value={propertyInput.loanTerm}
                      onChange={(e) => setPropertyInput({ ...propertyInput, loanTerm: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Income & Operating Expenses</h3>

                  {/* Monthly Rent */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Monthly Rent</label>
                      <span className="text-purple-400 font-semibold">{formatCurrency(propertyInput.monthlyRent)}</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="15000"
                      step="100"
                      value={propertyInput.monthlyRent}
                      onChange={(e) => setPropertyInput({ ...propertyInput, monthlyRent: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Property Tax */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Property Tax (Annual)</label>
                      <span className="text-purple-400 font-semibold">{formatCurrency(propertyInput.propertyTax)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="100"
                      value={propertyInput.propertyTax}
                      onChange={(e) => setPropertyInput({ ...propertyInput, propertyTax: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Insurance */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Insurance (Annual)</label>
                      <span className="text-purple-400 font-semibold">{formatCurrency(propertyInput.insurance)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8000"
                      step="100"
                      value={propertyInput.insurance}
                      onChange={(e) => setPropertyInput({ ...propertyInput, insurance: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Maintenance */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Maintenance (Annual)</label>
                      <span className="text-purple-400 font-semibold">{formatCurrency(propertyInput.maintenance)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15000"
                      step="100"
                      value={propertyInput.maintenance}
                      onChange={(e) => setPropertyInput({ ...propertyInput, maintenance: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Vacancy Rate */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Vacancy Rate</label>
                      <span className="text-purple-400 font-semibold">{propertyInput.vacancy}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={propertyInput.vacancy}
                      onChange={(e) => setPropertyInput({ ...propertyInput, vacancy: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Property Management */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-white/80">Property Management Fee</label>
                      <span className="text-purple-400 font-semibold">{propertyInput.propertyManagement}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={propertyInput.propertyManagement}
                      onChange={(e) => setPropertyInput({ ...propertyInput, propertyManagement: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!propertyInput.address}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Review Analysis →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Key Metrics */}
              <div className="bg-slate-800/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Key Investment Metrics</h3>

                <div className="space-y-4">
                  {/* Monthly Cash Flow */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Monthly Cash Flow</div>
                    <div className={`text-3xl font-bold ${metrics.monthlyCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.monthlyCashFlow)}
                    </div>
                    <div className="text-white/40 text-xs mt-1">Annual: {formatCurrency(metrics.annualCashFlow)}</div>
                  </div>

                  {/* Cap Rate */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Cap Rate</div>
                    <div className="text-3xl font-bold text-purple-400">{formatPercent(metrics.capRate)}</div>
                    <div className="text-white/40 text-xs mt-1">
                      {metrics.capRate >= 6 ? '✓ Good for most markets' : '⚠ Below 6% threshold'}
                    </div>
                  </div>

                  {/* Cash-on-Cash Return */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Cash-on-Cash Return</div>
                    <div className={`text-3xl font-bold ${
                      metrics.cashOnCashReturn >= 8 ? 'text-green-400' :
                      metrics.cashOnCashReturn >= 4 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {formatPercent(metrics.cashOnCashReturn)}
                    </div>
                    <div className="text-white/40 text-xs mt-1">Target: 8-12%</div>
                  </div>

                  {/* NOI */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="text-white/60 text-sm mb-1">Net Operating Income (NOI)</div>
                    <div className="text-3xl font-bold text-blue-400">{formatCurrency(metrics.noi)}</div>
                    <div className="text-white/40 text-xs mt-1">Annual operating income after expenses</div>
                  </div>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="bg-slate-800/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Investment Breakdown</h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-white/70">
                    <span>Purchase Price</span>
                    <span className="text-white font-semibold">{formatCurrency(propertyInput.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Down Payment ({propertyInput.downPayment}%)</span>
                    <span className="text-white font-semibold">{formatCurrency(metrics.downPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Closing Costs (est. 3%)</span>
                    <span className="text-white font-semibold">{formatCurrency(metrics.totalCashInvested - metrics.downPaymentAmount)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex justify-between">
                    <span className="text-white font-bold">Total Cash Invested</span>
                    <span className="text-purple-400 font-bold text-xl">{formatCurrency(metrics.totalCashInvested)}</span>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex justify-between text-white/70">
                      <span>Loan Amount</span>
                      <span className="text-white font-semibold">{formatCurrency(metrics.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Monthly Mortgage (P&I)</span>
                      <span className="text-white font-semibold">{formatCurrency(metrics.monthlyMortgage)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Monthly Rent Income</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(propertyInput.monthlyRent)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Total Monthly Expenses</span>
                      <span className="text-white font-semibold">{formatCurrency(metrics.totalMonthlyExpenses)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-4">
                      <div className="text-white/80 text-sm mb-2">Investment Score</div>
                      <div className="flex items-end gap-2">
                        <div className="text-4xl font-bold text-white">
                          {(() => {
                            let score = 0;
                            if (metrics.monthlyCashFlow > 0) score += 30;
                            if (metrics.capRate >= 6) score += 30;
                            if (metrics.cashOnCashReturn >= 8) score += 40;
                            return score;
                          })()}
                        </div>
                        <div className="text-white/60 mb-1">/100</div>
                      </div>
                      <div className="text-white/60 text-xs mt-2">
                        {(() => {
                          let score = 0;
                          if (metrics.monthlyCashFlow > 0) score += 30;
                          if (metrics.capRate >= 6) score += 30;
                          if (metrics.cashOnCashReturn >= 8) score += 40;

                          if (score >= 80) return '✓ Excellent investment opportunity';
                          if (score >= 60) return '✓ Good investment with solid returns';
                          if (score >= 40) return '⚠ Fair investment, room for improvement';
                          return '⚠ Consider renegotiating terms';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold hover:shadow-lg transition-all"
                >
                  Save Property
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
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
    </div>
  );
}
