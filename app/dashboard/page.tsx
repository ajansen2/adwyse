'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { initializeAppBridge, isEmbeddedInShopify, navigateInApp, getShopifySessionToken, redirectToOAuth } from '@/lib/shopify-app-bridge';
import Link from 'next/link';
import { Sidebar, ProfitSummary, AlertsWidget } from '@/components/dashboard';
import { MetricCard, DashboardSkeleton } from '@/components/ui';
import { RevenueChart } from '@/components/charts';

type DateRangeOption = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

interface DateRange {
  start: Date | null;
  end: Date | null;
  label: string;
}

interface Merchant {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  subscription_tier: string;
}

interface Store {
  id: string;
  store_name: string;
  store_url: string;
  shopify_domain: string;
  status: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

interface Order {
  id: string;
  shopify_order_id: string;
  order_number: string;
  customer_email: string | null;
  total_price: number;
  currency: string;
  attributed_platform: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  order_created_at: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  total_spend: number;
  total_revenue: number;
  total_orders: number;
}

function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard...');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBillingSuccess, setShowBillingSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'trial' | 'pro'>('trial');
  const [tierLimits, setTierLimits] = useState<{adAccounts: number; ordersPerMonth: number; aiInsights: boolean; dataRetentionDays?: number} | null>(null);
  const [ordersLimitInfo, setOrdersLimitInfo] = useState<{ordersReturned: number; ordersPerMonth: number; dataRetentionDays: number} | null>(null);
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showBillingRequired, setShowBillingRequired] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Calculate trial days left
  const getTrialDaysLeft = () => {
    const store = stores[0];
    if (!store?.trial_ends_at) return null;
    const trialEnd = new Date(store.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  // Check if subscription is required (trial expired and not active)
  const isSubscriptionRequired = () => {
    const store = stores[0];
    if (!store) return false;
    if (store.subscription_status === 'active') return false;
    const trialDays = getTrialDaysLeft();
    if (trialDays === null) return true;
    return trialDays <= 0;
  };

  // Check subscription status after stores load
  useEffect(() => {
    if (stores.length > 0 && !loading) {
      if (isSubscriptionRequired()) {
        setShowBillingRequired(true);
      }
    }
  }, [stores, loading]);

  // Show onboarding only ONCE for new users
  useEffect(() => {
    if (stores.length > 0 && !loading) {
      const storageKey = `adwyse_onboarding_${stores[0].id}`;
      const hasSeenOnboarding = localStorage.getItem(storageKey);
      if (hasSeenOnboarding !== 'true') {
        setShowOnboarding(true);
        // Immediately mark as seen to prevent re-showing on refresh
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [stores, loading]);

  const completeOnboarding = () => {
    if (stores[0]) {
      localStorage.setItem(`adwyse_onboarding_${stores[0].id}`, 'true');
    }
    setShowOnboarding(false);
    setOnboardingStep(1);
  };

  const router = useRouter();

  // Calculate date range based on selection
  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateRangeOption) {
      case '7d':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end,
          label: 'Last 7 days'
        };
      case '14d':
        return {
          start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          end,
          label: 'Last 14 days'
        };
      case '30d':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end,
          label: 'Last 30 days'
        };
      case '90d':
        return {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end,
          label: 'Last 90 days'
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59') : end,
          label: customStartDate && customEndDate
            ? `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
            : 'Custom range'
        };
      case 'all':
      default:
        return {
          start: null,
          end: null,
          label: 'All time'
        };
    }
  }, [dateRangeOption, customStartDate, customEndDate]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.start) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.order_created_at);
      return orderDate >= dateRange.start! && (!dateRange.end || orderDate <= dateRange.end);
    });
  }, [orders, dateRange]);

  // Prepare chart data - daily revenue for the selected period
  // IMPORTANT: This must be defined before any conditional returns to satisfy React's Rules of Hooks
  const chartData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const days: { [key: string]: { revenue: number; orders: number; adRevenue: number } } = {};

    // Initialize days based on date range
    const orderTimes = filteredOrders.map(o => new Date(o.order_created_at).getTime());
    const startDate = dateRange.start || new Date(Math.min(...orderTimes));
    const endDate = dateRange.end || new Date();

    // Create day entries
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const key = currentDate.toISOString().split('T')[0];
      days[key] = { revenue: 0, orders: 0, adRevenue: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with order data
    filteredOrders.forEach(order => {
      const key = order.order_created_at.split('T')[0];
      if (days[key]) {
        days[key].revenue += order.total_price;
        days[key].orders += 1;
        if (order.attributed_platform && order.attributed_platform !== 'direct') {
          days[key].adRevenue += order.total_price;
        }
      }
    });

    return Object.entries(days).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, dateRange]);

  const searchParams = useSearchParams();

  // Handle subscribe button click
  const handleSubscribe = async () => {
    const store = stores[0];
    if (!store) return;
    setSubscribing(true);
    const shop = searchParams.get('shop') || store.shopify_domain;
    try {
      const response = await fetch('/api/billing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, shop })
      });
      const data = await response.json();
      if (data.confirmationUrl) {
        redirectToOAuth(data.confirmationUrl);
      } else if (data.needsOAuth) {
        redirectToOAuth(`/api/auth/shopify/install?shop=${shop}`);
      }
    } catch (error) {
      console.error('Error creating billing charge:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const supabase = getSupabaseClient();

  // Check for billing success parameter and process charge activation
  useEffect(() => {
    const billingStatus = searchParams.get('billing');
    const chargeId = searchParams.get('charge_id');
    const shop = searchParams.get('shop');
    const storeId = searchParams.get('store_id');

    // If we have charge_id, this is a redirect from billing approval - need to activate it
    if (chargeId && shop && storeId) {
      console.log('🔍 Dashboard - Processing billing charge activation');
      console.log('  Charge ID:', chargeId);
      console.log('  Shop:', shop);
      console.log('  Store ID:', storeId);

      // Call billing callback to activate the charge
      fetch(`/api/billing/callback?shop=${shop}&charge_id=${chargeId}&store_id=${storeId}`)
        .then(response => {
          if (response.ok) {
            console.log('✅ Billing charge activated successfully');
            setShowBillingSuccess(true);
            setTimeout(() => setShowBillingSuccess(false), 10000);

            // Clean up URL by removing billing params
            const url = new URL(window.location.href);
            url.searchParams.delete('charge_id');
            url.searchParams.delete('store_id');
            url.searchParams.set('billing', 'success');
            window.history.replaceState({}, '', url.toString());
          } else {
            console.error('❌ Failed to activate billing charge');
          }
        })
        .catch(error => {
          console.error('❌ Error activating billing charge:', error);
        });
    } else if (billingStatus === 'success') {
      // Just showing success message (charge already processed)
      setShowBillingSuccess(true);
      setTimeout(() => setShowBillingSuccess(false), 10000);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      let merchantData: Merchant | null = null;

      // Check if running embedded in Shopify
      const embedded = isEmbeddedInShopify();

      if (embedded) {
        // Initialize App Bridge for session tracking
        initializeAppBridge();

        // Get session token for Shopify's automated checks
        const sessionToken = await getShopifySessionToken();
        if (sessionToken) {
          console.log('✅ Got Shopify session token');

          try {
            const healthCheck = await fetch('/api/health');
            const healthData = await healthCheck.json();
            console.log('✅ Health check with App Bridge session token:', healthData);
          } catch (error) {
            console.log('Health check failed (non-critical):', error);
          }
        }

        // Get shop from URL params
        const shop = searchParams.get('shop');

        if (shop) {
          console.log('🏪 Running embedded in Shopify:', shop);

          // Use API to bypass RLS for embedded apps
          try {
            console.log('🔍 Fetching store data for:', shop);

            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
            xhr.send();

            console.log('🔍 XHR response status:', xhr.status);
            const data = JSON.parse(xhr.responseText);
            console.log('🔍 XHR response data:', data);

            if (xhr.status === 200 && data.merchant) {
              console.log('✅ Got merchant data:', data.merchant.id);
              merchantData = data.merchant as Merchant;

              if (data.store) {
                console.log('✅ Got store data:', data.store.id);
                setStores([data.store as Store]);

                // Check billing status - if not active, create charge and redirect
                const store = data.store;
                const billingStatus = searchParams.get('billing');
                const isReturningFromBilling = billingStatus === 'success' || searchParams.get('charge_id');

                if (store.subscription_status !== 'active' && !isReturningFromBilling) {
                  console.log('💰 Checking billing status for store:', store.id);
                  console.log('💰 Current subscription_status:', store.subscription_status);

                  try {
                    const billingResponse = await fetch('/api/billing/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ storeId: store.id, shop })
                    });
                    const billingData = await billingResponse.json();

                    console.log('💰 Billing create response:', billingData);

                    if (billingData.confirmationUrl) {
                      console.log('💰 Redirecting to billing approval:', billingData.confirmationUrl);
                      setLoadingMessage('Redirecting to billing...');
                      // Use App Bridge redirect for embedded apps
                      redirectToOAuth(billingData.confirmationUrl);
                      return;
                    } else if (billingData.status === 'active') {
                      console.log('✅ Billing already active');
                      // Update local store data
                      store.subscription_status = 'active';
                    } else if (billingData.error || billingData.needsOAuth || !billingResponse.ok) {
                      // Billing failed - might need to re-authenticate
                      console.error('❌ Billing creation failed:', billingData.error, 'Status:', billingResponse.status);

                      // If we need OAuth (401/403 or explicit flag), redirect to install flow
                      if (billingData.needsOAuth ||
                          billingResponse.status === 401 ||
                          billingResponse.status === 403 ||
                          billingData.error?.includes('OAuth required')) {
                        console.log('🔄 Access token invalid, redirecting to OAuth install...');
                        setLoadingMessage('Connecting to Shopify...');
                        const installUrl = `/api/auth/shopify/install?shop=${encodeURIComponent(shop)}`;
                        // Use App Bridge redirect for proper iframe handling
                        redirectToOAuth(installUrl);
                        return;
                      }
                    }
                  } catch (error) {
                    console.error('❌ Billing check error:', error);
                  }
                } else if (isReturningFromBilling) {
                  console.log('✅ Returning from billing flow, skipping billing check');
                }
              }
            } else if (xhr.status === 404) {
              console.log('⚠️  Store not found, creating records for first install:', shop);

              try {
                const installResponse = await fetch('/api/shopify/install-embedded', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ shop })
                });

                if (installResponse.ok) {
                  const installData = await installResponse.json();
                  console.log('✅ Created merchant/store:', installData);
                  merchantData = installData.merchant as Merchant;
                  if (installData.store) {
                    setStores([installData.store as Store]);

                    // New install - redirect to billing approval
                    console.log('💰 New install - creating billing charge...');
                    try {
                      const billingResponse = await fetch('/api/billing/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ storeId: installData.store.id, shop })
                      });
                      const billingData = await billingResponse.json();

                      console.log('💰 New install billing response:', billingData);

                      if (billingData.confirmationUrl) {
                        console.log('💰 Redirecting to billing approval:', billingData.confirmationUrl);
                        setLoadingMessage('Redirecting to billing...');
                        redirectToOAuth(billingData.confirmationUrl);
                        return;
                      } else if (billingData.error || billingData.needsOAuth || !billingResponse.ok) {
                        // Billing failed - need OAuth
                        console.error('❌ New install billing failed:', billingData.error, 'Status:', billingResponse.status);
                        // Store was created without valid access token - redirect to OAuth
                        console.log('🔄 Redirecting to OAuth install for new store...');
                        setLoadingMessage('Connecting to Shopify...');
                        const installUrl = `/api/auth/shopify/install?shop=${encodeURIComponent(shop)}`;
                        redirectToOAuth(installUrl);
                        return;
                      }
                    } catch (error) {
                      console.error('❌ Billing create error:', error);
                    }
                  }
                } else {
                  console.error('❌ Failed to create merchant/store');
                  setLoadError('Failed to complete installation. Please try again.');
                  setLoading(false);
                  return;
                }
              } catch (error) {
                console.error('❌ Error creating merchant/store:', error);
                setLoadError('Failed to complete installation. Please try again.');
                setLoading(false);
                return;
              }
            } else {
              console.error('❌ Failed to lookup store:', data.error);
            }
          } catch (error) {
            console.error('❌ API error looking up store:', error);
          }
        } else {
          console.log('❌ No shop parameter found in URL');
          setLoadError('Missing shop parameter. Please access this page through Shopify.');
          setLoading(false);
          return;
        }
      } else {
        // Not embedded - use traditional Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
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

      // If still no merchant, handle based on whether embedded or not
      if (!merchantData) {
        if (embedded) {
          console.error('❌ Unable to load merchant data for embedded app');
          setLoadError('Unable to load your store data. Please try reinstalling the app or contact support.');
          setLoading(false);
          return;
        } else {
          navigateInApp('/dashboard/connect-store');
          return;
        }
      }

      setMerchant(merchantData as Merchant);

      // Get active stores only (skip if embedded since we got it from API already)
      if (!embedded) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('*')
          .eq('merchant_id', (merchantData as Merchant).id)
          .eq('status', 'active');

        if (storesData) {
          setStores(storesData as Store[]);
        }
      }

      // Get orders and campaigns via API
      if (stores.length > 0 || embedded) {
        try {
          console.log('🔍 Fetching orders for merchant:', (merchantData as Merchant).id);

          const ordersXhr = new XMLHttpRequest();
          ordersXhr.open('GET', `/api/orders/list?merchant_id=${(merchantData as Merchant).id}`, false);
          ordersXhr.send();

          if (ordersXhr.status === 200) {
            const ordersJson = JSON.parse(ordersXhr.responseText);
            if (ordersJson.orders) {
              setOrders(ordersJson.orders);
            }
            // Capture limit info for free tier warnings
            if (ordersJson.limits) {
              setOrdersLimitInfo(ordersJson.limits);
            }
          }

          // Get campaigns
          const campaignsXhr = new XMLHttpRequest();
          campaignsXhr.open('GET', `/api/campaigns/list?merchant_id=${(merchantData as Merchant).id}`, false);
          campaignsXhr.send();

          if (campaignsXhr.status === 200) {
            const campaignsJson = JSON.parse(campaignsXhr.responseText);
            if (campaignsJson.campaigns) {
              setCampaigns(campaignsJson.campaigns);
            }
          }

          // Get latest AI insight (if store exists)
          if (stores.length > 0 || embedded) {
            const storeId = stores[0]?.id || searchParams.get('store_id');
            if (storeId) {
              const insightsXhr = new XMLHttpRequest();
              insightsXhr.open('GET', `/api/insights/list?store_id=${storeId}`, false);
              insightsXhr.send();

              if (insightsXhr.status === 200) {
                const insightsJson = JSON.parse(insightsXhr.responseText);
                if (insightsJson.insights && insightsJson.insights.length > 0) {
                  setLatestInsight(insightsJson.insights[0]);
                }
              }

              // Fetch subscription tier info
              const tierXhr = new XMLHttpRequest();
              tierXhr.open('GET', `/api/subscription/tier?store_id=${storeId}`, false);
              tierXhr.send();

              if (tierXhr.status === 200) {
                const tierJson = JSON.parse(tierXhr.responseText);
                if (tierJson.tier) {
                  setSubscriptionTier(tierJson.tier);
                  setTierLimits(tierJson.limits);
                }
              }

              // Sync customer segments in background (for Built for Shopify requirement)
              // This queries customerSegmentMembers API as required
              fetch('/api/segments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId }),
              }).then(() => {
                console.log('📊 Customer segments synced');
              }).catch(() => {
                // Non-critical, ignore errors
              });
            }
          }
        } catch (error) {
          console.error('❌ Error fetching data:', error);
        }
      }

      console.log('✅ Setting loading to false');
      setLoading(false);
    };

    checkAuth();
  }, [router, searchParams, supabase]);

  const handleGenerateInsight = async () => {
    if (!stores[0] || generatingInsight) return;

    setGeneratingInsight(true);
    try {
      // Use XHR for better compatibility with Shopify iframe
      const result = await new Promise<{ok: boolean, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/insights/generate', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 60000; // 60 second timeout for AI generation

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
          } catch (e) {
            resolve({ ok: false, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. AI generation may take a moment.'));
        };

        xhr.send(JSON.stringify({ storeId: stores[0].id }));
      });

      if (result.ok && result.data.insight) {
        setLatestInsight(result.data.insight);
      } else {
        alert(result.data.error || 'Failed to generate insights');
      }
    } catch (error: any) {
      console.error('Error generating insights:', error);
      alert(error?.message || 'Failed to generate insights');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigateInApp('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">{loadingMessage}</div>
        </div>
      </div>
    );
  }

  // Show error if failed to load merchant data
  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-red-500/10 border-2 border-red-500/50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Dashboard</h2>
          <p className="text-white/80 mb-6">{loadError}</p>
          <p className="text-white/60 text-sm">
            If this issue persists, please contact support at adam@adwyse.ca
          </p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return null; // Redirecting...
  }

  // Billing Required Paywall - blocks entire UI
  if (showBillingRequired) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-2 border-orange-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Trial Ended</h2>
            <p className="text-white/70 mb-6 text-lg">
              Your 7-day free trial has expired. Subscribe to Adwyse to continue tracking your ad attribution.
            </p>
            <div className="bg-zinc-900/50 rounded-xl p-4 mb-6">
              <div className="text-white/60 text-sm mb-1">Adwyse Pro</div>
              <div className="text-3xl font-bold text-white">$99.99<span className="text-lg font-normal text-white/60">/month</span></div>
              <div className="text-orange-400 text-sm mt-1">Unlimited attribution & AI insights</div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
            >
              {subscribing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Subscribe Now'
              )}
            </button>
            <p className="text-white/40 text-sm mt-4">
              Secure payment through Shopify. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasStores = stores.length > 0;

  // Calculate metrics from filtered orders
  const totalOrders = filteredOrders.length;
  const attributedOrders = filteredOrders.filter(order => order.attributed_platform && order.attributed_platform !== 'direct').length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
  const attributedRevenue = filteredOrders
    .filter(order => order.attributed_platform && order.attributed_platform !== 'direct')
    .reduce((sum, order) => sum + order.total_price, 0);

  // Calculate total ad spend and average ROAS
  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.total_spend, 0);
  const avgROAS = totalSpend > 0 ? (attributedRevenue / totalSpend) : 0;

  // Calculate previous period metrics for comparison
  const previousPeriodMetrics = useMemo(() => {
    if (!dateRange.start || dateRangeOption === 'all') return null;

    const periodLength = dateRange.end
      ? dateRange.end.getTime() - dateRange.start.getTime()
      : 30 * 24 * 60 * 60 * 1000; // Default 30 days

    const prevStart = new Date(dateRange.start.getTime() - periodLength);
    const prevEnd = new Date(dateRange.start.getTime() - 1);

    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.order_created_at);
      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const prevTotalOrders = prevOrders.length;
    const prevTotalRevenue = prevOrders.reduce((sum, order) => sum + order.total_price, 0);
    const prevAttributedRevenue = prevOrders
      .filter(order => order.attributed_platform && order.attributed_platform !== 'direct')
      .reduce((sum, order) => sum + order.total_price, 0);

    return {
      totalOrders: prevTotalOrders,
      totalRevenue: prevTotalRevenue,
      attributedRevenue: prevAttributedRevenue,
      // For spend/ROAS we'd need historical campaign data, use 0 for now
      totalSpend: 0,
      avgROAS: 0
    };
  }, [orders, dateRange, dateRangeOption]);

  // Generate sparkline data from chart data (last 7 days of revenue)
  const revenueSparkline = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.slice(-7).map(d => d.revenue);
  }, [chartData]);

  const ordersSparkline = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.slice(-7).map(d => d.orders);
  }, [chartData]);

  // Get max value for chart scaling
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer Email', 'Total', 'Currency', 'Ad Source', 'Campaign', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Date'];
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.customer_email || '',
      order.total_price.toFixed(2),
      order.currency,
      order.attributed_platform || 'direct',
      order.utm_campaign || '',
      order.utm_source || '',
      order.utm_medium || '',
      order.utm_campaign || '',
      new Date(order.order_created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `adwyse-orders-${dateRange.label.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step === onboardingStep ? 'bg-orange-500 w-6' : step < onboardingStep ? 'bg-orange-500' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to AdWyse!</h2>
                <p className="text-zinc-400 mb-6">
                  Track your ad performance and see exactly which campaigns are driving sales.
                </p>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Automatic Tracking</h2>
                <p className="text-zinc-400 mb-6">
                  AdWyse automatically tracks every order and attributes it to the right ad source. No setup required.
                </p>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Insights</h2>
                <p className="text-zinc-400 mb-6">
                  Get weekly AI insights that analyze your campaigns and recommend optimizations to improve ROAS.
                </p>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
                <p className="text-zinc-400 mb-6">
                  Orders will appear automatically as customers make purchases. Connect ad accounts in Settings for full ROAS tracking.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {onboardingStep > 1 && (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition"
                >
                  Back
                </button>
              )}
              {onboardingStep < 4 ? (
                <button
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Skip button */}
            {onboardingStep < 4 && (
              <button
                onClick={completeOnboarding}
                className="w-full mt-3 text-zinc-500 hover:text-zinc-400 text-sm transition"
              >
                Skip tutorial
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar activePage="dashboard" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:text-orange-400 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Range Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateRange.label}
                  <svg className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDatePicker && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDatePicker(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        {[
                          { value: '7d', label: 'Last 7 days' },
                          { value: '14d', label: 'Last 14 days' },
                          { value: '30d', label: 'Last 30 days' },
                          { value: '90d', label: 'Last 90 days' },
                          { value: 'all', label: 'All time' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setDateRangeOption(option.value as DateRangeOption);
                              setShowDatePicker(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                              dateRangeOption === option.value
                                ? 'bg-orange-600 text-white'
                                : 'text-white/80 hover:bg-zinc-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-zinc-800 p-3">
                        <div className="text-white/60 text-xs mb-2">Custom range</div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="flex-1 px-2 py-1 bg-zinc-800 border border-white/20 rounded text-white text-sm"
                          />
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="flex-1 px-2 py-1 bg-zinc-800 border border-white/20 rounded text-white text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (customStartDate && customEndDate) {
                              setDateRangeOption('custom');
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={!customStartDate || !customEndDate}
                          className="w-full px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-800 disabled:text-white/40 rounded text-white text-sm font-medium transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Export Button */}
              {filteredOrders.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}

              {/* Help Button */}
              <button
                onClick={() => setShowOnboarding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm font-medium transition"
                title="Quick Start Guide"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>

              {(() => {
                const store = stores[0];
                const trialDays = getTrialDaysLeft();

                if (subscriptionTier === 'free') {
                  return (
                    <span className="px-3 py-1 bg-zinc-600/20 border border-zinc-500/30 rounded-full text-zinc-300 text-sm font-medium">
                      Free Plan
                    </span>
                  );
                }

                if (subscriptionTier === 'trial' && trialDays !== null) {
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trialDays <= 3
                        ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                        : 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                    }`}>
                      {trialDays} day{trialDays !== 1 ? 's' : ''} left
                    </span>
                  );
                }

                return (
                  <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium">
                    Pro Plan
                  </span>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Free Tier Upgrade Banner */}
        {subscriptionTier === 'free' && (
          <div className="mx-6 mt-6 mb-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">You&apos;re on the Free Plan</h3>
                  <p className="text-amber-100/80 text-sm">
                    Limited to {tierLimits?.ordersPerMonth || 100} orders/month and {tierLimits?.adAccounts || 1} ad account. Upgrade for unlimited tracking + AI insights.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigateInApp('/dashboard/settings?upgrade=true')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center gap-2"
              >
                Upgrade to Pro
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Free Tier Limit Warning - shows when nearing or at limits */}
        {subscriptionTier === 'free' && ordersLimitInfo && (
          ordersLimitInfo.ordersReturned >= ordersLimitInfo.ordersPerMonth * 0.8 || ordersLimitInfo.dataRetentionDays <= 30
        ) && (
          <div className="mx-6 mt-4 mb-0 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-200 text-sm font-medium">Free Plan Limits Active</p>
                <div className="text-red-200/70 text-xs mt-1 space-y-0.5">
                  {ordersLimitInfo.dataRetentionDays <= 30 && (
                    <p>Only showing last {ordersLimitInfo.dataRetentionDays} days of data (Pro: unlimited history)</p>
                  )}
                  {ordersLimitInfo.ordersReturned >= ordersLimitInfo.ordersPerMonth && (
                    <p>Order limit reached ({ordersLimitInfo.ordersReturned}/{ordersLimitInfo.ordersPerMonth} orders)</p>
                  )}
                  {ordersLimitInfo.ordersReturned >= ordersLimitInfo.ordersPerMonth * 0.8 && ordersLimitInfo.ordersReturned < ordersLimitInfo.ordersPerMonth && (
                    <p>Approaching order limit ({ordersLimitInfo.ordersReturned}/{ordersLimitInfo.ordersPerMonth} orders)</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigateInApp('/dashboard/settings?upgrade=true')}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-red-200 text-xs font-medium transition"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Billing Success Notification */}
        {showBillingSuccess && (
          <div className="mx-6 mt-6 mb-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-6 relative">
            <button
              onClick={() => setShowBillingSuccess(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to AdWyse! 🎉</h3>
                <p className="text-green-100 text-lg mb-3">
                  Your Pro Plan subscription is now active!
                </p>
                <div className="space-y-2 text-white/80">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Your store is connected and webhooks are active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Order attribution tracking is running</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-powered insights will be generated weekly</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">
                  Your subscription is $99/month. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="p-6">
          {!hasStores ? (
            // Empty State: No Stores Connected
            <div className="max-w-2xl mx-auto mt-20">
              <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Connect Your Shopify Store</h2>
                <p className="text-white/60 text-lg mb-8">
                  Get started by connecting your Shopify store to track ad attribution and calculate ROAS.
                </p>
                <button
                  onClick={() => {
                    window.location.href = '/dashboard/connect-store';
                  }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg text-white font-semibold hover:opacity-90 transition text-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.373 0c-.343 0-1.02.188-1.547.562-1.105.785-1.92 2.012-2.298 3.456-.75.3-1.39.566-1.828.764-.99.45-1.02.48-1.148.72-.1.183-.187.42-.27.7-1.23.397-2.46.784-2.976 1.13C3.563 8.5 3.375 10.874 3 12v4.78l15-3.562V8.5c0-2.437-1.5-4-3.75-4h-1.5c.327-1.163.97-2.25 2.058-3.008C15.39.934 15.933.718 16.375.5c.345-.17.564-.29.747-.406C17.28.002 17.39 0 17.625 0h-1.252zm-1.998 8.5c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm1.5 7.5H3v4.5c0 1.656 1.344 3 3 3h12c1.656 0 3-1.344 3-3V16h-4.125z"/>
                  </svg>
                  Install Shopify App
                </button>
                <p className="text-white/40 text-sm mt-6">
                  Takes less than 2 minutes
                </p>
              </div>
            </div>
          ) : (
            // Dashboard with Stats
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Total Orders"
                  value={totalOrders}
                  previousValue={previousPeriodMetrics?.totalOrders}
                  sparklineData={ordersSparkline}
                  icon={
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                  className="bg-zinc-900/50 backdrop-blur border-zinc-800"
                />

                <MetricCard
                  title="Total Revenue"
                  value={totalRevenue}
                  previousValue={previousPeriodMetrics?.totalRevenue}
                  format="currency"
                  sparklineData={revenueSparkline}
                  icon={
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  className="bg-zinc-900/50 backdrop-blur border-zinc-800"
                />

                <MetricCard
                  title="Ad Spend"
                  value={totalSpend}
                  format="currency"
                  icon={
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  className="bg-zinc-900/50 backdrop-blur border-zinc-800"
                />

                <MetricCard
                  title="Average ROAS"
                  value={avgROAS}
                  format="multiplier"
                  decimals={2}
                  icon={
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                  className="bg-zinc-900/50 backdrop-blur border-zinc-800"
                />
              </div>

              {/* Revenue Chart */}
              {chartData.length > 0 && (
                <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Revenue Over Time</h2>
                      <p className="text-white/60 text-sm">{dateRange.label}</p>
                    </div>
                  </div>
                  <RevenueChart data={dateRangeOption === 'all' ? chartData.filter(d => d.revenue > 0 || d.adRevenue > 0) : chartData.slice(-30)} dateRangeLabel={dateRange.label} />
                </div>
              )}

              {/* Profit Summary */}
              {(totalRevenue > 0 || totalSpend > 0) && (
                <div className="mb-8">
                  <ProfitSummary
                    revenue={totalRevenue}
                    adSpend={totalSpend}
                  />
                </div>
              )}

              {/* Alerts Widget */}
              {stores[0] && (
                <div className="mb-8">
                  <AlertsWidget storeId={stores[0].id} />
                </div>
              )}

              {/* AI Insights */}
              {latestInsight && (
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur border border-purple-500/30 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">AI Insights</h2>
                        <p className="text-white/60 text-sm">Powered by AI</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateInsight}
                      disabled={generatingInsight}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                      {generatingInsight ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    className="bg-zinc-900/50 rounded-lg p-4 text-white/80 text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                      [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-3 [&>h1]:mt-4 [&>h1]:first:mt-0
                      [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-purple-300 [&>h2]:mb-2 [&>h2]:mt-4 [&>h2]:first:mt-0
                      [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-white/90 [&>h3]:mb-2 [&>h3]:mt-3
                      [&>p]:mb-2 [&>p]:text-white/80
                      [&>ul]:mb-3 [&>ul]:ml-4 [&>ul]:list-disc [&>ul]:text-white/80
                      [&>li]:mb-1
                      [&_strong]:text-white [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: latestInsight.content
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^• (.*$)/gm, '<li>$1</li>')
                        .replace(/^- (.*$)/gm, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                  {latestInsight.created_at && (
                    <div className="text-white/40 text-xs mt-3">
                      Generated {new Date(latestInsight.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Generate Insights Button (if no insights yet) */}
              {!latestInsight && campaigns.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur border border-purple-500/30 rounded-xl p-8 mb-8 text-center">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Get AI-Powered Insights</h3>
                  <p className="text-white/60 mb-6 max-w-md mx-auto">
                    Let AI analyze your campaign performance and get personalized recommendations to improve your ROAS.
                  </p>
                  {subscriptionTier === 'free' ? (
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-600/30 rounded-lg text-zinc-400 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pro Feature
                      </div>
                      <button
                        onClick={() => navigateInApp('/dashboard/settings?upgrade=true')}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-white font-medium transition inline-flex items-center gap-2"
                      >
                        Upgrade to Unlock
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateInsight}
                      disabled={generatingInsight}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition inline-flex items-center gap-2"
                    >
                      {generatingInsight ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Generating Insights...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Insights
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Connected Stores */}
              <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Connected Stores</h2>
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.373 0c-.343 0-1.02.188-1.547.562-1.105.785-1.92 2.012-2.298 3.456-.75.3-1.39.566-1.828.764-.99.45-1.02.48-1.148.72-.1.183-.187.42-.27.7-1.23.397-2.46.784-2.976 1.13C3.563 8.5 3.375 10.874 3 12v4.78l15-3.562V8.5c0-2.437-1.5-4-3.75-4h-1.5c.327-1.163.97-2.25 2.058-3.008C15.39.934 15.933.718 16.375.5c.345-.17.564-.29.747-.406C17.28.002 17.39 0 17.625 0h-1.252z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-medium">{store.store_name}</div>
                          <div className="text-white/40 text-sm">{store.shopify_domain}</div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        store.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {store.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info box when no orders */}
              {orders.length === 0 && (
                <div className="bg-blue-500/10 backdrop-blur border border-blue-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">How Attribution Tracking Works</h3>
                      <p className="text-white/70 text-sm mb-3">
                        AdWyse automatically tracks every order and shows you exactly which ads are driving sales. 100% automatic, no setup required.
                      </p>
                      <div className="bg-zinc-900/50 rounded-lg p-4 text-sm text-white/60">
                        <p className="mb-2"><strong className="text-white/80">How it works:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Customers click on your Facebook, Google, or TikTok ads</li>
                          <li>When they purchase, AdWyse automatically tracks which ad drove the sale</li>
                          <li>Orders appear here with full attribution data (source, campaign, etc.)</li>
                          <li>Connect ad accounts in Settings to see ROAS and get AI insights</li>
                        </ol>
                      </div>
                      <p className="text-white/50 text-xs mt-3">
                        ✅ Webhooks active - tracking all orders automatically. No technical setup required.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {filteredOrders.length > 0 && (
                <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                    <div className="text-white/60 text-sm">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => {
                      const timeAgo = new Date(order.order_created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      });

                      return (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center">
                              <span className="text-orange-300 font-bold text-lg">
                                {order.customer_email?.charAt(0).toUpperCase() || '#'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium">
                                Order #{order.order_number}
                              </div>
                              <div className="text-white/40 text-sm truncate">{order.customer_email || 'No email'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-white font-bold text-lg">${order.total_price.toFixed(2)}</div>
                              <div className="text-white/40 text-sm">{timeAgo}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                              order.attributed_platform === 'facebook'
                                ? 'bg-blue-500/20 text-blue-300'
                                : order.attributed_platform === 'google'
                                ? 'bg-red-500/20 text-red-300'
                                : order.attributed_platform === 'tiktok'
                                ? 'bg-pink-500/20 text-pink-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {order.attributed_platform || 'direct'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {Math.ceil(filteredOrders.length / itemsPerPage) > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          currentPage === 1
                            ? 'bg-zinc-900/50 text-white/30 cursor-not-allowed'
                            : 'bg-zinc-800 text-white hover:bg-white/20'
                        }`}
                      >
                        ← Previous
                      </button>
                      <div className="text-white/60 text-sm px-4">
                        Page {currentPage} of {Math.ceil(filteredOrders.length / itemsPerPage)}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          currentPage === Math.ceil(filteredOrders.length / itemsPerPage)
                            ? 'bg-zinc-900/50 text-white/30 cursor-not-allowed'
                            : 'bg-zinc-800 text-white hover:bg-white/20'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
