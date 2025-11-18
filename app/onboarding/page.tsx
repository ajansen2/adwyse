// app/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    email: '',
    phone: '',
    company: '',

    // Step 2: Investment Profile
    investmentGoal: 'cash-flow',
    preferredMarkets: [] as string[],
    budgetRange: '100k-300k',
    experienceLevel: 'beginner',

    // Step 3: Preferences
    propertyTypes: [] as string[],
    analysisFrequency: 'weekly',
    notifications: true,

    // Step 4: Dashboard Setup
    dashboardName: '',
    subdomain: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateFormData = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleArrayValue = (field: 'preferredMarkets' | 'propertyTypes', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email format';
    }

    if (step === 2) {
      if (formData.preferredMarkets.length === 0) newErrors.preferredMarkets = 'Select at least one market';
    }

    if (step === 3) {
      if (formData.propertyTypes.length === 0) newErrors.propertyTypes = 'Select at least one property type';
    }

    if (step === 4) {
      if (!formData.dashboardName.trim()) newErrors.dashboardName = 'Dashboard name is required';
      if (!formData.subdomain.trim()) newErrors.subdomain = 'Subdomain is required';
      if (formData.subdomain && !formData.subdomain.match(/^[a-z0-9-]+$/)) {
        newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Save user data to localStorage for success page
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('user_name', formData.fullName);
      localStorage.setItem('dashboard_name', formData.dashboardName);
      localStorage.setItem('dashboard_subdomain', formData.subdomain);

      // Build dashboard URL
      const dashboardUrl = `https://${formData.subdomain}.argora.ai`;
      localStorage.setItem('dashboard_url', dashboardUrl);

      // TODO: In production, submit to API
      // const response = await fetch('/api/onboarding', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // const data = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLoading(false);

      // Redirect with email param
      router.push(`/onboarding-success?email=${encodeURIComponent(formData.email)}&subdomain=${formData.subdomain}`);
    } catch (error) {
      console.error('Onboarding error:', error);
      setLoading(false);
      alert('There was an error setting up your dashboard. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-6">
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

        .glow-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        .glow-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to ARGORA DEALS</h1>
          <p className="text-white/70">Let's set up your personalized investment dashboard</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {step < currentStep ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <div className="text-xs text-white/60 mt-2">
                  {step === 1 && 'Personal'}
                  {step === 2 && 'Profile'}
                  {step === 3 && 'Preferences'}
                  {step === 4 && 'Dashboard'}
                </div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>

              <div>
                <label className="block text-white/80 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-white/80 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-white/80 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2">Company / Investment Firm (Optional)</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="ABC Investments LLC"
                />
              </div>
            </div>
          )}

          {/* Step 2: Investment Profile */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Investment Profile</h2>

              <div>
                <label className="block text-white/80 mb-3">Primary Investment Goal</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: 'cash-flow', label: 'Cash Flow', desc: 'Generate monthly income' },
                    { value: 'appreciation', label: 'Appreciation', desc: 'Long-term value growth' },
                    { value: 'balanced', label: 'Balanced', desc: 'Mix of both' },
                    { value: 'flipping', label: 'Flipping', desc: 'Buy, renovate, sell' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => updateFormData('investmentGoal', goal.value)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        formData.investmentGoal === goal.value
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="text-white font-semibold mb-1">{goal.label}</div>
                      <div className="text-white/60 text-sm">{goal.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/80 mb-3">Preferred Markets *</label>
                <p className="text-white/50 text-sm mb-4">Select the regions or countries you want to invest in</p>

                {/* North America */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌎</span> North America
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['USA - California', 'USA - Texas', 'USA - Florida', 'USA - New York', 'USA - Arizona', 'USA - Colorado', 'USA - Georgia', 'USA - North Carolina', 'Canada - Toronto', 'Canada - Vancouver', 'Canada - Montreal', 'Mexico'].map((market) => (
                      <button
                        key={market}
                        onClick={() => toggleArrayValue('preferredMarkets', market)}
                        className={`p-3 rounded-lg border text-white transition-all text-sm ${
                          formData.preferredMarkets.includes(market)
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Europe */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌍</span> Europe
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Portugal', 'Ireland'].map((market) => (
                      <button
                        key={market}
                        onClick={() => toggleArrayValue('preferredMarkets', market)}
                        className={`p-3 rounded-lg border text-white transition-all text-sm ${
                          formData.preferredMarkets.includes(market)
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Middle East */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌏</span> Middle East
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Dubai (UAE)', 'Abu Dhabi (UAE)', 'Saudi Arabia', 'Qatar', 'Turkey', 'Israel'].map((market) => (
                      <button
                        key={market}
                        onClick={() => toggleArrayValue('preferredMarkets', market)}
                        className={`p-3 rounded-lg border text-white transition-all text-sm ${
                          formData.preferredMarkets.includes(market)
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asia Pacific */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌏</span> Asia Pacific
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Singapore', 'Hong Kong', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Thailand', 'Malaysia'].map((market) => (
                      <button
                        key={market}
                        onClick={() => toggleArrayValue('preferredMarkets', market)}
                        className={`p-3 rounded-lg border text-white transition-all text-sm ${
                          formData.preferredMarkets.includes(market)
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Latin America */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌎</span> Latin America
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Brazil', 'Argentina', 'Colombia', 'Chile', 'Panama', 'Costa Rica'].map((market) => (
                      <button
                        key={market}
                        onClick={() => toggleArrayValue('preferredMarkets', market)}
                        className={`p-3 rounded-lg border text-white transition-all text-sm ${
                          formData.preferredMarkets.includes(market)
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => toggleArrayValue('preferredMarkets', 'Other / Multiple Regions')}
                      className={`p-3 rounded-lg border text-white transition-all text-sm ${
                        formData.preferredMarkets.includes('Other / Multiple Regions')
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      Other / Multiple Regions
                    </button>
                  </div>
                </div>

                {errors.preferredMarkets && <p className="text-red-400 text-sm mt-2">{errors.preferredMarkets}</p>}
              </div>

              <div>
                <label className="block text-white/80 mb-3">Budget Range</label>
                <select
                  value={formData.budgetRange}
                  onChange={(e) => updateFormData('budgetRange', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="under-100k">Under $100K</option>
                  <option value="100k-300k">$100K - $300K</option>
                  <option value="300k-500k">$300K - $500K</option>
                  <option value="500k-1m">$500K - $1M</option>
                  <option value="over-1m">Over $1M</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 mb-3">Experience Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'First investment' },
                    { value: 'intermediate', label: 'Intermediate', desc: '1-5 properties' },
                    { value: 'expert', label: 'Expert', desc: '5+ properties' },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateFormData('experienceLevel', level.value)}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        formData.experienceLevel === level.value
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="text-white font-semibold mb-1">{level.label}</div>
                      <div className="text-white/60 text-sm">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Analysis Preferences</h2>

              <div>
                <label className="block text-white/80 mb-3">Property Types of Interest *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Single Family', 'Multi-Family', 'Condos', 'Townhomes', 'Commercial', 'Land'].map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleArrayValue('propertyTypes', type)}
                      className={`p-3 rounded-lg border text-white transition-all ${
                        formData.propertyTypes.includes(type)
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {errors.propertyTypes && <p className="text-red-400 text-sm mt-2">{errors.propertyTypes}</p>}
              </div>

              <div>
                <label className="block text-white/80 mb-3">How often do you want market updates?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      onClick={() => updateFormData('analysisFrequency', freq.value)}
                      className={`p-4 rounded-lg border text-white transition-all ${
                        formData.analysisFrequency === freq.value
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-800/50 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-6">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-white font-semibold mb-1">Email Notifications</div>
                    <div className="text-white/60 text-sm">Get alerts about new opportunities and portfolio updates</div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) => updateFormData('notifications', e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => updateFormData('notifications', !formData.notifications)}
                      className={`relative w-14 h-8 rounded-full transition-all flex items-center ${
                        formData.notifications ? 'bg-purple-600' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`absolute w-6 h-6 bg-white rounded-full transition-all shadow-md ${
                          formData.notifications ? 'left-7' : 'left-1'
                        }`}
                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Dashboard Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Your Dashboard</h2>

              <div>
                <label className="block text-white/80 mb-2">Dashboard Name *</label>
                <input
                  type="text"
                  value={formData.dashboardName}
                  onChange={(e) => updateFormData('dashboardName', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="My Investment Dashboard"
                />
                {errors.dashboardName && <p className="text-red-400 text-sm mt-1">{errors.dashboardName}</p>}
                <p className="text-white/40 text-sm mt-1">This will be displayed at the top of your dashboard</p>
              </div>

              <div>
                <label className="block text-white/80 mb-2">Choose Your Subdomain *</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={(e) => updateFormData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="johndoe"
                    />
                  </div>
                  <span className="text-white/60">.argora.ai</span>
                </div>
                {errors.subdomain && <p className="text-red-400 text-sm mt-1">{errors.subdomain}</p>}
                <p className="text-white/40 text-sm mt-1">
                  Your dashboard will be accessible at: <span className="text-purple-400">{formData.subdomain || 'yourname'}.argora.ai</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3">Dashboard Preview</h3>
                <div className="space-y-2 text-white/70 text-sm">
                  <p>✓ Real-time property data and market intelligence</p>
                  <p>✓ AI-powered deal analysis and recommendations</p>
                  <p>✓ Portfolio tracking and performance monitoring</p>
                  <p>✓ Custom alerts and notifications</p>
                  <p>✓ Secure, unique dashboard URL</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-8 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-full border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={nextStep}
              disabled={loading}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold glow-button"
            >
              {loading ? 'Setting up...' : currentStep === 4 ? 'Complete Setup →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
