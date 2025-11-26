'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase-client';
import { navigateInApp } from '@/lib/shopify-app-bridge';

interface Store {
  id: string;
  shop_domain: string;
  store_name: string;
  email: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncingTikTok, setSyncingTikTok] = useState(false);
  const [emailReportFrequency, setEmailReportFrequency] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [roasAlertEnabled, setRoasAlertEnabled] = useState(false);
  const [roasThreshold, setRoasThreshold] = useState(1.5);
  const [spendAlertEnabled, setSpendAlertEnabled] = useState(false);
  const [spendThreshold, setSpendThreshold] = useState(100);
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const supabase = getSupabaseClient();

  // Check for OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'facebook_connected') {
      setSuccessMessage('Facebook Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (success === 'google_connected') {
      setSuccessMessage('Google Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (success === 'tiktok_connected') {
      setSuccessMessage('TikTok Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (error) {
      setErrorMessage(`Failed to connect: ${error.replace(/_/g, ' ')}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadStore = async () => {
      try {
        const shop = searchParams.get('shop');
        if (!shop) {
          setLoading(false);
          return;
        }

        // Use async fetch instead of synchronous XHR
        const lookupResponse = await fetch(`/api/stores/lookup?shop=${encodeURIComponent(shop)}`);

        if (!lookupResponse.ok) {
          console.error('Store lookup failed:', lookupResponse.status);
          setLoading(false);
          return;
        }

        const data = await lookupResponse.json();

        if (data.store) {
          setStore(data.store);

          // Load all data in parallel for faster loading
          const [accountsResult, reportResult, alertResult] = await Promise.allSettled([
            // Load ad accounts
            supabase
              .from('ad_accounts')
              .select('*')
              .eq('store_id', data.store.id),
            // Load email report settings (with timeout)
            Promise.race([
              fetch(`/api/reports/settings?store_id=${data.store.id}`),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]),
            // Load alert settings (with timeout)
            Promise.race([
              fetch(`/api/alerts/settings?store_id=${data.store.id}`),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ])
          ]);

          // Handle ad accounts
          if (accountsResult.status === 'fulfilled' && accountsResult.value.data) {
            setAdAccounts(accountsResult.value.data);
          }

          // Handle email report settings
          if (reportResult.status === 'fulfilled') {
            try {
              const reportResponse = reportResult.value as Response;
              if (reportResponse.ok) {
                const reportData = await reportResponse.json();
                setEmailReportFrequency(reportData.frequency || 'none');
              }
            } catch (err) {
              console.error('Error parsing email settings:', err);
            }
          }

          // Handle alert settings
          if (alertResult.status === 'fulfilled') {
            try {
              const alertResponse = alertResult.value as Response;
              if (alertResponse.ok) {
                const alertData = await alertResponse.json();
                setRoasAlertEnabled(alertData.roas_alert_enabled || false);
                setRoasThreshold(alertData.roas_threshold || 1.5);
                setSpendAlertEnabled(alertData.spend_alert_enabled || false);
                setSpendThreshold(alertData.spend_threshold || 100);
              }
            } catch (err) {
              console.error('Error parsing alert settings:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [searchParams, supabase]);

  const handleSaveAlertSettings = async () => {
    if (!store) return;

    setSavingAlertSettings(true);
    try {
      const response = await fetch('/api/alerts/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          roas_alert_enabled: roasAlertEnabled,
          roas_threshold: roasThreshold,
          spend_alert_enabled: spendAlertEnabled,
          spend_threshold: spendThreshold,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Alert settings saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to save alert settings');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving alert settings:', error);
      setErrorMessage('Failed to save alert settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingAlertSettings(false);
    }
  };

  const handleSaveEmailSettings = async (frequency: 'none' | 'weekly' | 'monthly') => {
    if (!store) return;

    setSavingEmailSettings(true);
    try {
      const response = await fetch('/api/reports/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, frequency }),
      });

      if (response.ok) {
        setEmailReportFrequency(frequency);
        setSuccessMessage(`Email reports ${frequency === 'none' ? 'disabled' : `set to ${frequency}`}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to update email settings');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setErrorMessage('Failed to update email settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleConnectFacebook = () => {
    if (!store) return;
    // Open in new window because Facebook blocks OAuth in iframes
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/facebook?store_id=${store.id}`,
      'Facebook OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  // Listen for message from OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'facebook_connected') {
        if (event.data.success) {
          setSuccessMessage('Facebook Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect Facebook account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }

      if (event.data?.type === 'google_connected') {
        if (event.data.success) {
          setSuccessMessage('Google Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect Google Ads account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }

      if (event.data?.type === 'tiktok_connected') {
        if (event.data.success) {
          setSuccessMessage('TikTok Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect TikTok Ads account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectTikTok = () => {
    if (!store) return;
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/tiktok?store_id=${store.id}`,
      'TikTok OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSyncTikTok = async () => {
    if (!store || syncingTikTok) return;

    setSyncingTikTok(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/tiktok';

      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000;

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'TikTok Ads campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync TikTok Ads campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync TikTok Ads campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncingTikTok(false);
    }
  };

  const handleConnectGoogle = () => {
    if (!store) return;
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/google?store_id=${store.id}`,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSyncGoogle = async () => {
    if (!store || syncingGoogle) return;

    setSyncingGoogle(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/google';

      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000;

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'Google Ads campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync Google Ads campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync Google Ads campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleSyncFacebook = async () => {
    if (!store) {
      setErrorMessage('Store not loaded. Please refresh the page.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (syncing) return;

    setSyncing(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/facebook';

      // Use XMLHttpRequest for better compatibility with Shopify iframe
      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000; // 30 second timeout

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'Facebook campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync Facebook campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync Facebook campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900/90 backdrop-blur border-r border-white/10 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="AdWyse" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigateInApp('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/orders')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/campaigns')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">Campaigns</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-600/20 text-orange-300 border border-orange-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-sm">Store Name</label>
                <div className="text-white font-medium">{store?.store_name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Shop Domain</label>
                <div className="text-white font-medium">{store?.shop_domain || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Email</label>
                <div className="text-white font-medium">{store?.email || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Subscription Status</label>
                <div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    store?.subscription_status === 'active'
                      ? 'bg-green-500/20 text-green-300'
                      : store?.subscription_status === 'trial'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {store?.subscription_status === 'active' ? 'Pro Plan' : store?.subscription_status === 'trial' ? '7-Day Trial' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ad Connections */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Ad Account Connections</h2>
            <p className="text-white/60 mb-6">
              Connect your ad accounts to automatically sync campaign spend data and calculate ROAS.
            </p>

            <div className="space-y-4">
              {/* Facebook Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">Facebook Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'facebook').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'facebook').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'facebook').length > 0 && (
                      <button
                        onClick={handleSyncFacebook}
                        disabled={syncing}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectFacebook}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'facebook').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected Facebook Accounts */}
                {adAccounts.filter(a => a.platform === 'facebook').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'facebook').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">Google Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'google').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'google').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'google').length > 0 && (
                      <button
                        onClick={handleSyncGoogle}
                        disabled={syncingGoogle}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncingGoogle ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'google').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected Google Accounts */}
                {adAccounts.filter(a => a.platform === 'google').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'google').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TikTok Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">TikTok Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'tiktok').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'tiktok').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'tiktok').length > 0 && (
                      <button
                        onClick={handleSyncTikTok}
                        disabled={syncingTikTok}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncingTikTok ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectTikTok}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'tiktok').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected TikTok Accounts */}
                {adAccounts.filter(a => a.platform === 'tiktok').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'tiktok').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Reports */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Email Reports</h2>
                <p className="text-white/60 text-sm">Get performance summaries delivered to your inbox</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSaveEmailSettings('none')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'none'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Off</div>
                <div className="text-xs opacity-60">No emails</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('weekly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'weekly'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Weekly</div>
                <div className="text-xs opacity-60">Every Monday</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('monthly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'monthly'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Monthly</div>
                <div className="text-xs opacity-60">1st of month</div>
              </button>
            </div>

            {savingEmailSettings && (
              <div className="mt-3 text-white/60 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            )}
          </div>

          {/* Performance Alerts */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Performance Alerts</h2>
                <p className="text-white/60 text-sm">Get notified when campaigns need attention</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* ROAS Alert */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">Low ROAS Alert</div>
                    <div className="text-white/40 text-sm">Alert when ROAS drops below threshold</div>
                  </div>
                  <button
                    onClick={() => setRoasAlertEnabled(!roasAlertEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      roasAlertEnabled ? 'bg-orange-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      roasAlertEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                {roasAlertEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Alert when ROAS below:</span>
                    <input
                      type="number"
                      value={roasThreshold}
                      onChange={(e) => setRoasThreshold(parseFloat(e.target.value) || 0)}
                      step="0.1"
                      min="0"
                      className="w-20 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <span className="text-white/60 text-sm">x</span>
                  </div>
                )}
              </div>

              {/* Spend Alert */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">High Spend Alert</div>
                    <div className="text-white/40 text-sm">Alert when daily spend exceeds budget</div>
                  </div>
                  <button
                    onClick={() => setSpendAlertEnabled(!spendAlertEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      spendAlertEnabled ? 'bg-orange-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      spendAlertEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                {spendAlertEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Alert when daily spend exceeds:</span>
                    <span className="text-white/60">$</span>
                    <input
                      type="number"
                      value={spendThreshold}
                      onChange={(e) => setSpendThreshold(parseFloat(e.target.value) || 0)}
                      step="10"
                      min="0"
                      className="w-24 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveAlertSettings}
                disabled={savingAlertSettings}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {savingAlertSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Alert Settings'
                )}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-white/60 mb-4">
              Uninstalling will remove all data and disconnect your store.
            </p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
              Uninstall App
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
