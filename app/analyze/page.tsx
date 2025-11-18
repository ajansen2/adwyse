'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SaleRecord {
  saleTransDate?: string;
  saleAmt?: number;
}

interface RentalComp {
  address?: string;
  rent?: number;
  distance?: number;
}

interface PropertyAnalysis {
  address: string;
  propertyDetails: {
    beds?: number;
    baths?: number;
    sqft?: number;
    yearBuilt?: number;
    propertyType?: string;
    lotSize?: number;
  };
  taxData: {
    assessedValue?: number;
    taxAmount?: number;
    taxYear?: number;
  };
  salesHistory: SaleRecord[];
  rentalComps: RentalComp[];
  marketRent: number | null;
  aiAnalysis: string;
  dealScore: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass';
  usingMockData?: boolean;
  usingManualData?: boolean;
  dataWarning?: string;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    propertyType: 'residential'
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'CAD'>('USD');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    beds: '',
    baths: '',
    sqft: '',
    yearBuilt: '',
    purchasePrice: '',
    currentValue: '',
    monthlyRent: '',
    annualTax: ''
  });

  // Currency conversion rate (approximate)
  const USD_TO_CAD = 1.36;
  const CAD_TO_USD = 0.74;

  const convertCurrency = (amount: number, toCurrency: 'USD' | 'CAD') => {
    if (toCurrency === 'CAD') {
      return Math.round(amount * USD_TO_CAD);
    }
    return amount; // Already in USD
  };

  const formatCurrency = (amount: number) => {
    const converted = convertCurrency(amount, currency);
    return currency === 'CAD'
      ? `C$${converted.toLocaleString()}`
      : `$${converted.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/property/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze property');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    // Validate manual data
    if (!manualData.beds || !manualData.baths || !manualData.sqft || !manualData.currentValue) {
      setError('Please fill in at least Bedrooms, Bathrooms, Square Feet, and Current Value');
      return;
    }

    setShowManualEntry(false);
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/property/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          manualData: {
            beds: parseInt(manualData.beds),
            baths: parseFloat(manualData.baths),
            sqft: parseInt(manualData.sqft),
            yearBuilt: manualData.yearBuilt ? parseInt(manualData.yearBuilt) : undefined,
            purchasePrice: manualData.purchasePrice ? parseInt(manualData.purchasePrice) : undefined,
            currentValue: parseInt(manualData.currentValue),
            monthlyRent: manualData.monthlyRent ? parseInt(manualData.monthlyRent) : undefined,
            annualTax: manualData.annualTax ? parseInt(manualData.annualTax) : undefined
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze property');
      }

      setAnalysis(data.analysis);

      // Reset manual data form
      setManualData({
        beds: '',
        baths: '',
        sqft: '',
        yearBuilt: '',
        purchasePrice: '',
        currentValue: '',
        monthlyRent: '',
        annualTax: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return 'bg-green-500';
      case 'buy':
        return 'bg-blue-500';
      case 'hold':
        return 'bg-yellow-500';
      case 'pass':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return 'STRONG BUY';
      case 'buy':
        return 'BUY';
      case 'hold':
        return 'HOLD';
      case 'pass':
        return 'PASS';
      default:
        return recommendation.toUpperCase();
    }
  };

  const getDealScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 65) return 'text-blue-500';
    if (score >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/60 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white">
                AI Deal Analyzer
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <h2 className="text-xl font-semibold text-white flex-1">
              Enter Property Address
            </h2>
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              🇺🇸 US ONLY
            </span>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-4">
            <p className="text-blue-100 text-sm font-semibold mb-2">📍 Geographic Coverage</p>
            <p className="text-blue-100/90 text-sm">
              This tool currently supports <strong>United States properties only</strong>.
              Canadian, UK, and international markets are not yet supported.
              Entering a non-US address will result in placeholder data for demonstration purposes.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property Type Selector */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Property Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'residential', label: '🏠 Residential', supported: true },
                  { value: 'commercial', label: '🏢 Commercial', supported: false },
                  { value: 'land', label: '🌳 Land/Vacant', supported: false },
                  { value: 'mobile', label: '🚐 Mobile Home', supported: false }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: type.value })}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all relative ${
                      formData.propertyType === type.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {type.label}
                    {!type.supported && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        ⚠️
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {formData.propertyType !== 'residential' && (
                <div className="mt-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ <strong>Limited Support:</strong> {formData.propertyType === 'commercial' && 'Commercial properties'}{formData.propertyType === 'land' && 'Land/vacant lots'}{formData.propertyType === 'mobile' && 'Mobile homes'} may have incomplete data from ATTOM API. You can enter property details manually if automated data is unavailable.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Austin"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  State / Province *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="TX"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="78701"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Property...
                </span>
              ) : (
                'Analyze Property'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Data Warning Banner */}
        {analysis && analysis.usingMockData && analysis.dataWarning && (
          <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-yellow-200 font-bold text-lg mb-2">Placeholder Data Warning</h3>
                <p className="text-yellow-100 mb-4">{analysis.dataWarning}</p>
                <div className="bg-yellow-500/20 rounded-lg p-4 mb-4">
                  <p className="text-yellow-100 text-sm font-semibold mb-2">Why am I seeing this?</p>
                  <ul className="text-yellow-100 text-sm space-y-1 list-disc list-inside">
                    <li>Property is outside the United States (Canada, UK, etc.)</li>
                    <li>Property type not well-supported (commercial, land, mobile home)</li>
                    <li>Property is too new or too old to be in database</li>
                    <li>Rural/remote location with limited data coverage</li>
                    <li>Address format doesn't match ATTOM database exactly</li>
                  </ul>
                  <p className="text-yellow-100 text-sm mt-3">
                    💡 <strong>For US residential properties:</strong> Try reformatting the address (include directionals like NW, SE) or contact support if you continue seeing this message.
                  </p>
                </div>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
                >
                  📝 Enter Property Details Manually
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">Manual Property Entry</h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-white/70 mb-6">
                Enter property details manually for properties not in our database (commercial, land, mobile homes, or international properties).
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Bedrooms *</label>
                    <input
                      type="number"
                      value={manualData.beds}
                      onChange={(e) => setManualData({ ...manualData, beds: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Bathrooms *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={manualData.baths}
                      onChange={(e) => setManualData({ ...manualData, baths: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Square Feet *</label>
                    <input
                      type="number"
                      value={manualData.sqft}
                      onChange={(e) => setManualData({ ...manualData, sqft: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Year Built</label>
                    <input
                      type="number"
                      value={manualData.yearBuilt}
                      onChange={(e) => setManualData({ ...manualData, yearBuilt: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2010"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      value={manualData.purchasePrice}
                      onChange={(e) => setManualData({ ...manualData, purchasePrice: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="400000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Current Value *</label>
                    <input
                      type="number"
                      value={manualData.currentValue}
                      onChange={(e) => setManualData({ ...manualData, currentValue: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="450000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Monthly Rent</label>
                    <input
                      type="number"
                      value={manualData.monthlyRent}
                      onChange={(e) => setManualData({ ...manualData, monthlyRent: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Annual Property Tax</label>
                    <input
                      type="number"
                      value={manualData.annualTax}
                      onChange={(e) => setManualData({ ...manualData, annualTax: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <p className="text-white/50 text-xs mt-2">* Required fields</p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Analyzing...' : 'Analyze with Manual Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !analysis.usingMockData && (
          <div className="space-y-6">
            {/* Currency Toggle & Data Source */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {analysis.usingMockData ? (
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-xs font-bold rounded-full">
                    ⚠️ DEMO DATA
                  </span>
                ) : analysis.usingManualData ? (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-200 text-xs font-bold rounded-full">
                    📝 USER PROVIDED
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-200 text-xs font-bold rounded-full">
                    ✓ REAL DATA
                  </span>
                )}
                <span className="text-white/40 text-xs">
                  Data from: {analysis.usingMockData ? 'Placeholder' : analysis.usingManualData ? 'Manual Entry' : 'ATTOM + RentCast APIs'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currency === 'USD'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  🇺🇸 USD
                </button>
                <button
                  onClick={() => setCurrency('CAD')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currency === 'CAD'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  🇨🇦 CAD
                </button>
              </div>
            </div>

            {/* Header with Address and Recommendation */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {analysis.address}
                  </h3>
                  <p className="text-white/60">
                    {analysis.propertyDetails.propertyType || 'Residential Property'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-lg ${getRecommendationColor(analysis.recommendation)} text-white font-bold mb-2`}>
                    {getRecommendationLabel(analysis.recommendation)}
                  </div>
                  <div className={`text-4xl font-bold ${getDealScoreColor(analysis.dealScore)}`}>
                    {analysis.dealScore}/100
                  </div>
                  <p className="text-white/60 text-sm">Deal Score</p>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">AI Investment Analysis</h3>
              </div>
              <div className="text-white/90 leading-relaxed space-y-4 prose prose-invert max-w-none">
                {analysis.aiAnalysis.split('\n').map((line, idx) => {
                  // Handle bold text (**text**)
                  if (line.startsWith('**') && line.includes(':**')) {
                    const parts = line.split(':**');
                    const heading = parts[0].replace(/\*\*/g, '');
                    const content = parts[1]?.trim();
                    return (
                      <div key={idx} className="mt-3">
                        <h4 className="text-blue-300 font-bold text-sm mb-1">{heading}</h4>
                        {content && <p className="text-white/90 ml-4">{content}</p>}
                      </div>
                    );
                  }
                  // Handle bullet points
                  if (line.trim().startsWith('-')) {
                    return (
                      <div key={idx} className="flex items-start gap-2 ml-4">
                        <span className="text-blue-400 mt-1">•</span>
                        <p className="text-white/90 flex-1">{line.trim().substring(1).trim()}</p>
                      </div>
                    );
                  }
                  // Handle regular paragraphs
                  if (line.trim()) {
                    return <p key={idx} className="text-white/90">{line.trim()}</p>;
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Property Details & Tax Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Details */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Property Details</h3>
                <div className="space-y-3">
                  {analysis.propertyDetails.beds && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Bedrooms</span>
                      <span className="text-white font-semibold">{analysis.propertyDetails.beds}</span>
                    </div>
                  )}
                  {analysis.propertyDetails.baths && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Bathrooms</span>
                      <span className="text-white font-semibold">{analysis.propertyDetails.baths}</span>
                    </div>
                  )}
                  {analysis.propertyDetails.sqft && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Square Feet</span>
                      <span className="text-white font-semibold">{analysis.propertyDetails.sqft.toLocaleString()}</span>
                    </div>
                  )}
                  {analysis.propertyDetails.yearBuilt && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Year Built</span>
                      <span className="text-white font-semibold">{analysis.propertyDetails.yearBuilt}</span>
                    </div>
                  )}
                  {analysis.propertyDetails.lotSize && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Lot Size</span>
                      <span className="text-white font-semibold">{analysis.propertyDetails.lotSize.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Data */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tax Assessment</h3>
                <div className="space-y-3">
                  {analysis.taxData.assessedValue && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Assessed Value</span>
                      <span className="text-white font-semibold">{formatCurrency(analysis.taxData.assessedValue)}</span>
                    </div>
                  )}
                  {analysis.taxData.taxAmount && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Annual Tax</span>
                      <span className="text-white font-semibold">{formatCurrency(analysis.taxData.taxAmount)}</span>
                    </div>
                  )}
                  {analysis.taxData.taxYear && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Tax Year</span>
                      <span className="text-white font-semibold">{analysis.taxData.taxYear}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rental Market Data */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Rental Market Analysis</h3>
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Estimated Market Rent</span>
                  <span className="text-2xl font-bold text-green-400">
                    {analysis.marketRent !== null && analysis.marketRent !== undefined
                      ? analysis.marketRent === 0
                        ? <span className="text-white/50 text-lg">Not Rented</span>
                        : `${formatCurrency(analysis.marketRent)}/mo`
                      : <span className="text-white/50 text-lg">Not Available</span>
                    }
                  </span>
                </div>
              </div>
              {analysis.rentalComps && analysis.rentalComps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Comparable Rentals</h4>
                  <div className="space-y-2">
                    {analysis.rentalComps.slice(0, 3).map((comp: RentalComp, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                        <span className="text-white/80 text-sm">{comp.address || `Comp ${idx + 1}`}</span>
                        <span className="text-white font-semibold">{comp.rent ? `${formatCurrency(comp.rent)}/mo` : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sales History */}
            {analysis.salesHistory && analysis.salesHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sales History</h3>
                <div className="space-y-2">
                  {analysis.salesHistory.slice(0, 5).map((sale: SaleRecord, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                      <span className="text-white/80">{sale.saleTransDate || 'Unknown Date'}</span>
                      <span className="text-white font-semibold">{sale.saleAmt ? formatCurrency(sale.saleAmt) : 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setFormData({ address: '', city: '', state: '', zip: '', propertyType: 'residential' });
                }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
              >
                Analyze Another Property
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
