'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase-client';
import { initializeAppBridge, isEmbeddedInShopify, navigateInApp, getShopifySessionToken } from '@/lib/shopify-app-bridge';

interface Merchant {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  subscription_tier: string;
  settings?: {
    emails_enabled?: boolean;
    first_email_delay?: number;
    second_email_delay?: number;
    third_email_delay?: number;
    discount_code_1?: string;
    discount_percentage_1?: number;
    discount_code_2?: string;
    discount_percentage_2?: number;
    discount_code_3?: string;
    discount_percentage_3?: number;
  };
}

interface Store {
  id: string;
  store_name: string;
  store_url: string;
  platform: string;
  status: string;
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Email recovery settings state
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailsEnabled, setEmailsEnabled] = useState(true);
  const [firstEmailDelay, setFirstEmailDelay] = useState(0.25);
  const [secondEmailDelay, setSecondEmailDelay] = useState(0.5);
  const [thirdEmailDelay, setThirdEmailDelay] = useState(1);

  // Separate discount codes for each email
  const [discountCode1, setDiscountCode1] = useState('');
  const [discountPercentage1, setDiscountPercentage1] = useState(0);
  const [discountCode2, setDiscountCode2] = useState('');
  const [discountPercentage2, setDiscountPercentage2] = useState(0);
  const [discountCode3, setDiscountCode3] = useState('COMEBACK10');
  const [discountPercentage3, setDiscountPercentage3] = useState(10);

  const [stores, setStores] = useState<Store[]>([]);

  const router = useRouter();

  // Use shared Supabase client to prevent multiple instances
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadMerchant = async () => {
      try {
        // Initialize App Bridge if we're embedded
        if (typeof window !== 'undefined') {
          initializeAppBridge();

          // Get session token and make fetch request for Shopify's automated checks
          const sessionToken = await getShopifySessionToken();
          if (sessionToken) {
            try {
              await fetch('/api/health');
              console.log('✅ Session token sent via App Bridge (Settings)');
            } catch (error) {
              console.log('Health check failed (non-critical):', error);
            }
          }
        }

        const shop = searchParams?.get('shop');

        let merchantData: Merchant | null = null;

        // If we have a shop parameter, we're embedded - use API to bypass RLS
        if (shop) {
          console.log('🏪 Running embedded in Shopify:', shop);

          // Use API to bypass RLS for embedded apps
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
            xhr.send();

            const data = JSON.parse(xhr.responseText);

            if (xhr.status === 200 && data.merchant) {
              merchantData = data.merchant as Merchant;

              if (data.store) {
                setStores([data.store as Store]);
              }
            }
          } catch (error) {
            console.error('❌ API error looking up store:', error);
          }
        } else {
          // Not embedded - use regular Supabase auth
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // Get merchant profile via Supabase auth
            const { data, error: merchantError } = await supabase
              .from('merchants')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (!merchantError && data) {
              merchantData = data as Merchant;
            }
          }

          // Fallback: Check for merchant_id cookie
          if (!merchantData) {
            const merchantId = document.cookie
              .split('; ')
              .find(row => row.startsWith('merchant_id='))
              ?.split('=')[1];

            if (merchantId) {
              // Get merchant directly by ID
              const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', merchantId)
                .single();

              if (!error && data) {
                merchantData = data as Merchant;
              }
            }
          }
        }

        if (!merchantData) {
          navigateInApp('/dashboard/connect-store');
          setLoading(false);
          return;
        }

        if (merchantData) {
          setMerchant(merchantData as Merchant);
          setFullName((merchantData as Merchant).full_name || '');
          setCompany((merchantData as Merchant).company || '');

          // Load email recovery settings
          if ((merchantData as Merchant).settings) {
            const settings = (merchantData as Merchant).settings!;
            setEmailsEnabled(settings.emails_enabled ?? true);
            setFirstEmailDelay(settings.first_email_delay ?? 0.25);
            setSecondEmailDelay(settings.second_email_delay ?? 0.5);
            setThirdEmailDelay(settings.third_email_delay ?? 1);

            // Load discount codes for each email
            setDiscountCode1(settings.discount_code_1 ?? '');
            setDiscountPercentage1(settings.discount_percentage_1 ?? 0);
            setDiscountCode2(settings.discount_code_2 ?? '');
            setDiscountPercentage2(settings.discount_percentage_2 ?? 0);
            setDiscountCode3(settings.discount_code_3 ?? 'COMEBACK10');
            setDiscountPercentage3(settings.discount_percentage_3 ?? 10);
          }

          // Don't load stores - not needed for settings page
          // This was causing 502 errors and blocking the page
          setStores([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Load merchant error:', error);
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    loadMerchant();
  }, [router, searchParams]); // Removed supabase from deps - it's a singleton now

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!merchant) return;

    const { error: updateError } = await supabase
      .from('merchants')
      // @ts-expect-error - Singleton pattern causes type inference issues
      .update({
        full_name: fullName,
        company: company,
      })
      .eq('id', merchant.id);

    if (updateError) {
      setError('Failed to update profile');
      setSaving(false);
      return;
    }

    setSuccess('Profile updated successfully!');
    setSaving(false);

    // Update local state
    setMerchant({ ...merchant, full_name: fullName, company: company });

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    setError('');
    setSuccess('');

    if (!merchant) return;

    const settings = {
      emails_enabled: emailsEnabled,
      first_email_delay: firstEmailDelay,
      second_email_delay: secondEmailDelay,
      third_email_delay: thirdEmailDelay,

      // Save individual discount codes for each email
      discount_code_1: discountCode1,
      discount_percentage_1: discountPercentage1,
      discount_code_2: discountCode2,
      discount_percentage_2: discountPercentage2,
      discount_code_3: discountCode3,
      discount_percentage_3: discountPercentage3,
    };

    const { error: updateError } = await supabase
      .from('merchants')
      // @ts-expect-error - Singleton pattern causes type inference issues
      .update({ settings })
      .eq('id', merchant.id);

    if (updateError) {
      setError('Failed to save email settings');
      console.error('Save error:', updateError);
      setSavingEmail(false);
      return;
    }

    // Update local merchant state
    setMerchant({
      ...merchant,
      settings
    });

    setSuccess('Email settings saved successfully!');
    setSavingEmail(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setError('');
    setSuccess('Preparing test email... This may take a few seconds.');

    try {
      if (!merchant) {
        setError('Merchant not found');
        setTestingEmail(false);
        return;
      }

      if (!testEmail || !testEmail.includes('@')) {
        setError('Please enter a valid email address');
        setTestingEmail(false);
        return;
      }

      // Get abandoned carts via API using fetch
      const cartsResponse = await fetch(`/api/carts/list?merchant_id=${merchant.id}`);

      if (!cartsResponse.ok) {
        throw new Error('Failed to fetch abandoned carts');
      }

      const cartsJson = await cartsResponse.json();

      if (!cartsJson.carts || cartsJson.carts.length === 0) {
        setError('No abandoned carts found to test with. Please wait for a cart abandonment first.');
        setTestingEmail(false);
        return;
      }

      // Get the most recent cart
      const cart = cartsJson.carts[0];

      // Send test email using fetch with override email
      const emailResponse = await fetch('/api/recovery/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart.id,
          emailNumber: 1,
          testEmail: testEmail, // Override the cart's email with test email
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send test email');
      }

      setSuccess(`Test email sent to ${testEmail}! Check your inbox.`);
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email. Please try again.');
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigateInApp('/dashboard')} className="flex items-center cursor-pointer">
            <Image src="/logo 3.png" alt="ARGORA" width={120} height={40} style={{ objectFit: 'contain' }} />
          </button>
          <button
            onClick={() => navigateInApp('/dashboard')}
            className="text-white/60 hover:text-white transition text-sm cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={merchant.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/40 cursor-not-allowed"
                />
                <p className="text-white/40 text-xs mt-1">This is your account email address</p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your Company"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Subscription Info */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 font-medium">Current Plan</p>
                <p className="text-white/40 text-sm">
                  {merchant.subscription_tier === 'trial' ? '14-Day Free Trial' : 'Pro Plan - $19.99/month'}
                </p>
              </div>
              <span className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                {merchant.subscription_tier === 'trial' ? 'Trial Active' : 'Pro'}
              </span>
            </div>
            {merchant.subscription_tier === 'trial' && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  Your trial includes unlimited cart recoveries and full access to all features.
                  You'll be automatically billed $19.99/month after your trial ends.
                </p>
              </div>
            )}
          </div>

          {/* Email Recovery Settings */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Email Recovery Settings</h2>

            {/* Enable/Disable Toggle */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Recovery Emails</h3>
                  <p className="text-white/60 text-sm">
                    Automatically send recovery emails to customers who abandon their carts
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !emailsEnabled;
                    setEmailsEnabled(newValue);

                    // Auto-save toggle state
                    const currentSettings = merchant?.settings || {};
                    const { error } = await supabase
                      .from('merchants')
                      // @ts-expect-error - Singleton pattern causes type inference issues
                      .update({
                        settings: {
                          ...currentSettings,
                          emails_enabled: newValue,
                          first_email_delay: firstEmailDelay,
                          second_email_delay: secondEmailDelay,
                          third_email_delay: thirdEmailDelay,
                        }
                      })
                      .eq('id', merchant?.id);

                    if (error) {
                      console.error('Failed to save toggle:', error);
                      // Revert on error
                      setEmailsEnabled(!newValue);
                    } else {
                      // Update merchant state
                      setMerchant({
                        ...merchant!,
                        settings: {
                          ...currentSettings,
                          emails_enabled: newValue,
                        }
                      });
                    }
                  }}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    emailsEnabled ? 'bg-purple-600' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      emailsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Email Timing Settings */}
            <div className={emailsEnabled ? 'opacity-100' : 'opacity-50'}>
              <h3 className="text-lg font-semibold text-white mb-4">Email Timing</h3>

              <div className="space-y-4 mb-6">
                {/* First Email */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-white">First Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        value={firstEmailDelay}
                        onChange={(e) => setFirstEmailDelay(parseFloat(e.target.value))}
                        className="w-20 px-3 py-1 bg-white/10 rounded border border-white/20 text-center text-white"
                      />
                      <span className="text-white/60">hours after abandonment</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">Gentle reminder with helpful tone</p>
                </div>

                {/* Second Email */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-white">Second Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.25"
                        max="72"
                        step="0.25"
                        value={secondEmailDelay}
                        onChange={(e) => setSecondEmailDelay(parseFloat(e.target.value))}
                        className="w-20 px-3 py-1 bg-white/10 rounded border border-white/20 text-center text-white"
                      />
                      <span className="text-white/60">hours after abandonment</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">Urgency + FOMO (items may sell out)</p>
                </div>

                {/* Third Email */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-white">Third Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.25"
                        max="168"
                        step="0.25"
                        value={thirdEmailDelay}
                        onChange={(e) => setThirdEmailDelay(parseFloat(e.target.value))}
                        className="w-20 px-3 py-1 bg-white/10 rounded border border-white/20 text-center text-white"
                      />
                      <span className="text-white/60">hours after abandonment</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">Final offer with discount code</p>
                </div>
              </div>

              {/* Discount Settings */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Discount Codes (Optional)</h3>
                <p className="text-sm text-white/60 mb-4">
                  Configure discount codes for each email. Create these codes in your Shopify admin first.
                </p>

                {/* Email 1 Discount */}
                <div className="mb-4 bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Email 1 - Gentle Reminder (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount Code</label>
                      <input
                        type="text"
                        value={discountCode1}
                        onChange={(e) => setDiscountCode1(e.target.value.toUpperCase())}
                        placeholder="WELCOME5 (optional)"
                        className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercentage1}
                          onChange={(e) => setDiscountPercentage1(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white"
                        />
                        <span className="text-white/60">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email 2 Discount */}
                <div className="mb-4 bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-3">Email 2 - Urgency + FOMO (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount Code</label>
                      <input
                        type="text"
                        value={discountCode2}
                        onChange={(e) => setDiscountCode2(e.target.value.toUpperCase())}
                        placeholder="SAVE10 (optional)"
                        className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercentage2}
                          onChange={(e) => setDiscountPercentage2(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white"
                        />
                        <span className="text-white/60">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email 3 Discount */}
                <div className="bg-white/5 p-4 rounded-lg border-2 border-purple-500/30">
                  <h4 className="font-medium text-white mb-3">Email 3 - Final Offer with Discount</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount Code</label>
                      <input
                        type="text"
                        value={discountCode3}
                        onChange={(e) => setDiscountCode3(e.target.value.toUpperCase())}
                        placeholder="COMEBACK10"
                        className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Discount %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercentage3}
                          onChange={(e) => setDiscountPercentage3(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 bg-white/10 rounded border border-white/20 text-white"
                        />
                        <span className="text-white/60">%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-300/80 mt-2">
                    💡 This is your final chance email - a discount code is recommended
                  </p>
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300/90">
                    <strong>Important:</strong> You must create these discount codes in your Shopify admin first.
                    Go to Shopify → Discounts → Create discount code.
                  </p>
                </div>
              </div>

              {/* Test Email Section */}
              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Test Email Functionality</h3>
                <p className="text-sm text-white/60 mb-4">
                  Send a test recovery email to verify your settings are working correctly.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Enter your email address to receive a test recovery email
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveEmailSettings}
                  disabled={savingEmail}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEmail ? 'Saving...' : 'Save Email Settings'}
                </button>

                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail || !emailsEnabled || !testEmail}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {testingEmail && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {testingEmail ? 'Sending test email...' : 'Send Test Email'}
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-200">How Recovery Emails Work</h4>
                <ul className="text-sm text-blue-200/80 space-y-1 list-disc list-inside">
                  <li>Emails are sent automatically based on your timing settings</li>
                  <li>Each customer receives up to 3 recovery emails per abandoned cart</li>
                  <li>Emails are powered by AI for personalized, compelling content</li>
                  <li>Click tracking helps you measure recovery performance</li>
                  <li>The system runs automatically - no manual intervention needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Uninstall App Section */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Uninstall App</h2>
            <p className="text-white/60 text-sm mb-6">
              Need to remove Argora Cart Recovery from your store? You can uninstall the app from your Shopify admin.
            </p>
            <button
              onClick={() => {
                // Get shop domain from stores
                if (stores && stores.length > 0) {
                  const shopDomain = stores[0].store_url.replace('https://', '');
                  window.open(`https://${shopDomain}/admin/settings/apps`, '_blank');
                } else {
                  window.open('https://admin.shopify.com/store/apps', '_blank');
                }
              }}
              className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 font-semibold transition"
            >
              Go to Shopify Apps Settings
            </button>
            <p className="text-white/40 text-xs mt-4">
              Your data will be removed after uninstalling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
