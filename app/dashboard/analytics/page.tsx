'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';
import { initializeAppBridge, isEmbeddedInShopify, navigateInApp, getShopifySessionToken } from '@/lib/shopify-app-bridge';
import Link from 'next/link';
import Image from 'next/image';

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
  platform: string;
  status: string;
}

interface AbandonedCart {
  id: string;
  customer_email: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  cart_value: number;
  status: string;
  abandoned_at: string;
  store_id: string;
  emails_sent?: number;
  first_email_sent_at?: string | null;
  second_email_sent_at?: string | null;
  third_email_sent_at?: string | null;
  recovered_at?: string | null;
}

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const router = useRouter();

  const supabase = getSupabaseClient();

  useEffect(() => {
    const checkAuth = async () => {
      // Initialize App Bridge if we're embedded
      if (typeof window !== 'undefined') {
        initializeAppBridge();

        // Get session token and make fetch request for Shopify's automated checks
        const sessionToken = await getShopifySessionToken();
        if (sessionToken) {
          try {
            await fetch('/api/health');
            console.log('✅ Session token sent via App Bridge (Analytics)');
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
          console.log('🔍 About to fetch /api/stores/lookup?shop=' + shop);

          // Use XMLHttpRequest instead of fetch to avoid App Bridge interception
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false); // Synchronous
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
            }
          } else {
            console.error('❌ Failed to lookup store:', data.error);
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

        // Get active stores only (for non-embedded)
        if (merchantData) {
          const { data: storesData } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', merchantData.id)
            .eq('status', 'active');

          setStores((storesData as Store[]) || []);
        }
      }

      // If still no merchant, redirect to connect-store
      if (!merchantData) {
        navigateInApp('/dashboard/connect-store');
        return;
      }

      setMerchant(merchantData as Merchant);

      console.log('🔍 DEBUG - Merchant ID:', (merchantData as Merchant).id);

      // Get abandoned carts via API (bypasses RLS for cookie-based auth)
      try {
        console.log('🔍 About to fetch carts for merchant:', (merchantData as Merchant).id);

        // Use XMLHttpRequest to avoid App Bridge interception
        const cartsXhr = new XMLHttpRequest();
        cartsXhr.open('GET', `/api/carts/list?merchant_id=${(merchantData as Merchant).id}`, false);
        cartsXhr.send();

        console.log('🔍 Carts XHR status:', cartsXhr.status);
        const cartsJson = JSON.parse(cartsXhr.responseText);
        console.log('🔍 Carts response:', cartsJson);

        if (cartsJson.carts) {
          setAbandonedCarts(cartsJson.carts);
        }
      } catch (error) {
        console.error('❌ Error fetching carts:', error);
      }

      console.log('✅ Setting loading to false');
      setLoading(false);
    };

    checkAuth();
  }, [router, searchParams]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigateInApp('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return null;
  }

  // Calculate metrics
  const totalCarts = abandonedCarts.length;
  const recoveredCarts = abandonedCarts.filter(cart => cart.status === 'recovered').length;
  const recoveryRate = totalCarts > 0 ? ((recoveredCarts / totalCarts) * 100).toFixed(1) : '0';
  const revenueRecovered = abandonedCarts
    .filter(cart => cart.status === 'recovered')
    .reduce((sum, cart) => sum + cart.cart_value, 0);

  // Calculate total emails sent across all carts
  const totalEmailsSent = abandonedCarts.reduce((sum, cart) => {
    let emailCount = 0;
    if (cart.first_email_sent_at) emailCount++;
    if (cart.second_email_sent_at) emailCount++;
    if (cart.third_email_sent_at) emailCount++;
    return sum + emailCount;
  }, 0);

  // Prepare revenue over time data (group by day)
  const revenueByDay = abandonedCarts
    .filter(cart => cart.recovered_at)
    .reduce((acc, cart) => {
      const day = new Date(cart.recovered_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day] += cart.cart_value;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByDay).map(([day, revenue]) => ({ day, revenue }));
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Prepare recent activity data
  interface Activity {
    type: 'email' | 'recovery';
    cart: AbandonedCart;
    timestamp: string;
    emailNumber?: number;
  }

  const recentActivity: Activity[] = [];

  // Add email activities
  abandonedCarts.forEach(cart => {
    if (cart.first_email_sent_at) {
      recentActivity.push({ type: 'email', cart, timestamp: cart.first_email_sent_at, emailNumber: 1 });
    }
    if (cart.second_email_sent_at) {
      recentActivity.push({ type: 'email', cart, timestamp: cart.second_email_sent_at, emailNumber: 2 });
    }
    if (cart.third_email_sent_at) {
      recentActivity.push({ type: 'email', cart, timestamp: cart.third_email_sent_at, emailNumber: 3 });
    }
    if (cart.recovered_at) {
      recentActivity.push({ type: 'recovery', cart, timestamp: cart.recovered_at });
    }
  });

  // Sort by most recent first
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const totalActivities = recentActivity.length;
  const totalPages = Math.ceil(totalActivities / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const recentActivities = recentActivity.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900/90 backdrop-blur border-r border-white/10 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center">
              <Image src="/logo 3.png" alt="ARGORA" width={120} height={40} style={{ objectFit: 'contain' }} />
            </Link>
          </div>

          {/* Navigation */}
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
              onClick={() => navigateInApp('/dashboard/analytics')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">Analytics</span>
            </button>

            <button
              onClick={() => navigateInApp('/dashboard/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                {merchant.full_name?.charAt(0) || merchant.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{merchant.full_name || 'Merchant'}</div>
                <div className="text-white/40 text-sm truncate">{merchant.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:text-purple-400 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                {merchant.subscription_tier === 'trial' ? '14-Day Trial' : 'Pro Plan'}
              </span>
            </div>
          </div>
        </header>

        {/* Analytics Content */}
        <div className="p-6">
          {/* Time Range Selector */}
          <div className="mb-6 flex justify-end">
            <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Abandoned Carts</h3>
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalCarts}</div>
              <div className="text-white/40 text-sm">{totalCarts === 0 ? 'No data yet' : `${abandonedCarts.filter(c => c.status === 'abandoned' || c.status === 'recovering').length} awaiting recovery`}</div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Emails Sent</h3>
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{totalEmailsSent}</div>
              <div className="text-white/40 text-sm">
                {totalEmailsSent === 0 ? 'No campaigns yet' : 'Recovery emails sent'}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Recovery Rate</h3>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{recoveryRate}%</div>
              <div className="text-white/40 text-sm">{totalCarts === 0 ? 'Waiting for data' : `${recoveredCarts} of ${totalCarts} recovered`}</div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">Revenue Recovered</h3>
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${revenueRecovered.toFixed(2)}</div>
              <div className="text-white/40 text-sm">Last 30 days</div>
            </div>
          </div>

          {/* Revenue Over Time Chart */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Revenue Over Time</h2>
            {chartData.length > 0 ? (
              <div className="h-64">
                <div className="flex items-end justify-between h-full gap-2 px-4">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="relative w-full mb-2">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-300 group-hover:from-green-500 group-hover:to-green-300"
                          style={{ height: `${(data.revenue / maxRevenue) * 200}px`, minHeight: '20px' }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              ${data.revenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs mt-1 text-center">{data.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-white/40">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No recovered revenue yet</p>
                  <p className="text-sm mt-2">Revenue will appear here as carts are recovered</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              {totalActivities > 0 && (
                <div className="text-white/60 text-sm">
                  Showing {Math.min(startIndex + 1, totalActivities)}-{Math.min(endIndex, totalActivities)} of {totalActivities} activities | Page {currentPage} of {Math.max(1, totalPages)}
                </div>
              )}
            </div>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const timeAgo = new Date(activity.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0">
                      {activity.type === 'email' ? (
                        <div className="w-10 h-10 rounded-full bg-yellow-600/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-white font-medium">
                              {activity.type === 'email'
                                ? `Recovery Email ${activity.emailNumber} sent`
                                : 'Cart Recovered!'
                              }
                            </p>
                            <p className="text-white/60 text-sm mt-1">
                              {activity.cart.customer_first_name && activity.cart.customer_last_name
                                ? `${activity.cart.customer_first_name} ${activity.cart.customer_last_name}`
                                : activity.cart.customer_email
                              }
                            </p>
                            <p className="text-white/40 text-xs mt-1">
                              Cart value: ${activity.cart.cart_value.toFixed(2)}
                            </p>
                          </div>
                          <span className="text-white/40 text-xs whitespace-nowrap">{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No activity yet</p>
                <p className="text-sm mt-2">Your recovery campaigns will appear here</p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ← Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {(() => {
                    const pageNumbers = [];

                    // Always show first page
                    if (totalPages > 0) pageNumbers.push(1);

                    // Show ellipsis and pages around current page
                    if (currentPage > 3) pageNumbers.push('...');

                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      pageNumbers.push(i);
                    }

                    // Show ellipsis before last page
                    if (currentPage < totalPages - 2) pageNumbers.push('...');

                    // Always show last page
                    if (totalPages > 1) pageNumbers.push(totalPages);

                    return pageNumbers.map((page, idx) => {
                      if (page === '...') {
                        return <span key={`ellipsis-${idx}`} className="px-2 text-white/40">...</span>;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === totalPages
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading analytics...</div>
        </div>
      </div>
    }>
      <AnalyticsPageContent />
    </Suspense>
  );
}
