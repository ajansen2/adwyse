'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

interface Merchant {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  subscription_tier: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: Record<string, any>;
}

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Email settings
  const [emailsEnabled, setEmailsEnabled] = useState(true);
  const [firstEmailDelay, setFirstEmailDelay] = useState(1);
  const [secondEmailDelay, setSecondEmailDelay] = useState(24);
  const [thirdEmailDelay, setThirdEmailDelay] = useState(48);
  const [discountCode1, setDiscountCode1] = useState('');
  const [discountPercentage1, setDiscountPercentage1] = useState(0);
  const [discountCode2, setDiscountCode2] = useState('');
  const [discountPercentage2, setDiscountPercentage2] = useState(0);
  const [discountCode3, setDiscountCode3] = useState('COMEBACK10');
  const [discountPercentage3, setDiscountPercentage3] = useState(10);

  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/dashboard/settings-new');
          return;
        }

        const { data: merchantData } = await supabase
          .from('merchants')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (merchantData) {
          setMerchant(merchantData);

          // Load settings
          const s = merchantData.settings || {};
          setEmailsEnabled(s.emails_enabled ?? true);
          setFirstEmailDelay(s.first_email_delay ?? 1);
          setSecondEmailDelay(s.second_email_delay ?? 24);
          setThirdEmailDelay(s.third_email_delay ?? 48);
          setDiscountCode1(s.discount_code_1 ?? '');
          setDiscountPercentage1(s.discount_percentage_1 ?? 0);
          setDiscountCode2(s.discount_code_2 ?? '');
          setDiscountPercentage2(s.discount_percentage_2 ?? 0);
          setDiscountCode3(s.discount_code_3 ?? 'COMEBACK10');
          setDiscountPercentage3(s.discount_percentage_3 ?? 10);
        }
      } catch (err) {
        console.error('Load error:', err);
      }
    };
    loadData();
  }, [router, supabase]);

  const saveSettings = async () => {
    if (!merchant) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const settings = {
      emails_enabled: emailsEnabled,
      first_email_delay: firstEmailDelay,
      second_email_delay: secondEmailDelay,
      third_email_delay: thirdEmailDelay,
      discount_code_1: discountCode1,
      discount_percentage_1: discountPercentage1,
      discount_code_2: discountCode2,
      discount_percentage_2: discountPercentage2,
      discount_code_3: discountCode3,
      discount_percentage_3: discountPercentage3,
    };

    const { error: updateError } = await supabase
      .from('merchants')
      .update({ settings })
      .eq('id', merchant.id);

    if (updateError) {
      setError('Failed to save settings');
      setSaving(false);
      return;
    }

    setSuccess('Settings saved successfully!');
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleEmails = async () => {
    if (!merchant) return;

    const newValue = !emailsEnabled;
    setEmailsEnabled(newValue);

    const settings = {
      ...(merchant.settings || {}),
      emails_enabled: newValue,
    };

    await supabase
      .from('merchants')
      .update({ settings })
      .eq('id', merchant.id);
  };

  const testEmail = async () => {
    setTestingEmail(true);
    setError('');
    setSuccess('');

    try {
      const { data: cart } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!cart) {
        setError('No carts found');
        setTestingEmail(false);
        return;
      }

      const res = await fetch('/api/recovery/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id, emailNumber: 1 }),
      });

      if (!res.ok) throw new Error('Failed');

      setSuccess(`Test email sent to ${cart.customer_email}!`);
    } catch {
      setError('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo 3.png" alt="ARGORA" width={120} height={40} style={{ objectFit: 'contain' }} />
          </Link>
          <Link href="/dashboard" className="text-white/60 hover:text-white transition text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

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

        <div className="space-y-6">
          {/* Email Recovery */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Email Recovery Settings</h2>

            {/* Toggle */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Recovery Emails</h3>
                  <p className="text-white/60 text-sm">Automatically send recovery emails</p>
                </div>
                <button
                  onClick={toggleEmails}
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

            {/* Timing */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Email Timing</h3>
              <div className="space-y-4">
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
                      <span className="text-white/60">hours after</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-white">Second Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={secondEmailDelay}
                        onChange={(e) => setSecondEmailDelay(parseInt(e.target.value))}
                        className="w-20 px-3 py-1 bg-white/10 rounded border border-white/20 text-center text-white"
                      />
                      <span className="text-white/60">hours after</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-white">Third Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={thirdEmailDelay}
                        onChange={(e) => setThirdEmailDelay(parseInt(e.target.value))}
                        className="w-20 px-3 py-1 bg-white/10 rounded border border-white/20 text-center text-white"
                      />
                      <span className="text-white/60">hours after</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Codes */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Discount Codes (Optional)</h3>

              {/* Email 1 */}
              <div className="mb-4 bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-3">Email 1</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={discountCode1}
                    onChange={(e) => setDiscountCode1(e.target.value.toUpperCase())}
                    placeholder="CODE (optional)"
                    className="px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                  />
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

              {/* Email 2 */}
              <div className="mb-4 bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-3">Email 2</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={discountCode2}
                    onChange={(e) => setDiscountCode2(e.target.value.toUpperCase())}
                    placeholder="CODE (optional)"
                    className="px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                  />
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

              {/* Email 3 */}
              <div className="bg-white/5 p-4 rounded-lg border-2 border-purple-500/30">
                <h4 className="font-medium text-white mb-3">Email 3</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={discountCode3}
                    onChange={(e) => setDiscountCode3(e.target.value.toUpperCase())}
                    placeholder="COMEBACK10"
                    className="px-4 py-2 bg-white/10 rounded border border-white/20 text-white placeholder-white/40"
                  />
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
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={testEmail}
                disabled={testingEmail}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition disabled:opacity-50"
              >
                {testingEmail ? 'Sending...' : 'Test Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
