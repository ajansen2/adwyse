'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/dashboard';
import { MetricCard } from '@/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface CustomerLTV {
  customer_id: string;
  customer_email: string;
  first_order_date: string;
  last_order_date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  acquisition_source: string | null;
  predicted_ltv: number;
  ltv_score: 'high' | 'medium' | 'low';
  days_since_first_order: number;
  purchase_frequency: number;
}

interface LTVMetrics {
  totalCustomers: number;
  avgLTV: number;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  avgPredictedLTV: number;
  predictedTotalValue: number;
  highValueCustomers: number;
  topCustomers: CustomerLTV[];
  cohortData: {
    month: string;
    customers: number;
    revenue: number;
    avgLTV: number;
  }[];
  sourceBreakdown: {
    source: string;
    customers: number;
    avgLTV: number;
    avgPredictedLTV: number;
  }[];
}

function LTVContent() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<LTVMetrics | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const shop = searchParams.get('shop');
        if (!shop) {
          setLoading(false);
          return;
        }

        // First get store ID
        const storeXhr = new XMLHttpRequest();
        storeXhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        storeXhr.send();

        if (storeXhr.status !== 200) {
          setLoading(false);
          return;
        }

        const storeData = JSON.parse(storeXhr.responseText);
        if (!storeData.store?.id) {
          setLoading(false);
          return;
        }

        // Load LTV metrics
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/ltv?store_id=${storeData.store.id}`, false);
        xhr.send();

        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error loading LTV metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [searchParams]);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'facebook': return '#1877F2';
      case 'google': return '#4285F4';
      case 'tiktok': return '#000000';
      case 'direct': return '#10B981';
      default: return '#8B5CF6';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'facebook': return '📘';
      case 'google': return '🔍';
      case 'tiktok': return '🎵';
      case 'direct': return '🔗';
      default: return '📊';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
          <p className="text-gray-300 capitalize">{label}</p>
          <p className="text-orange-400">Avg LTV : ${payload[0].value.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
          <p className="text-gray-300">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'avgLTV' ? 'Avg LTV' : 'Customers'} : {entry.dataKey === 'avgLTV' ? `$${entry.value.toFixed(0)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading LTV analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="ltv" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Customer Lifetime Value</h1>
            <p className="text-white/60 text-sm">Track and optimize customer value</p>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Customers"
              value={metrics?.totalCustomers || 0}
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              className="bg-zinc-900/50 backdrop-blur border-zinc-800"
            />
            <MetricCard
              title="Average LTV"
              value={metrics?.avgLTV || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              className="bg-zinc-900/50 backdrop-blur border-zinc-800"
            />
            <MetricCard
              title="Avg Order Value"
              value={metrics?.avgOrderValue || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              className="bg-zinc-900/50 backdrop-blur border-zinc-800"
            />
            <MetricCard
              title="Orders/Customer"
              value={metrics?.avgOrdersPerCustomer || 0}
              decimals={1}
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              className="bg-zinc-900/50 backdrop-blur border-zinc-800"
            />
          </div>

          {/* Predictive LTV Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Predictive LTV Analysis</h2>
                <p className="text-white/60 text-sm">AI-powered lifetime value predictions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Predicted Avg LTV</div>
                <div className="text-2xl font-bold text-white">
                  ${(metrics?.avgPredictedLTV || 0).toFixed(2)}
                </div>
                <div className="text-green-400 text-sm mt-1">
                  +${((metrics?.avgPredictedLTV || 0) - (metrics?.avgLTV || 0)).toFixed(2)} expected growth
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Predicted Total Value</div>
                <div className="text-2xl font-bold text-white">
                  ${((metrics?.predictedTotalValue || 0) / 1000).toFixed(1)}K
                </div>
                <div className="text-white/40 text-sm mt-1">
                  Future revenue potential
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">High-Value Customers</div>
                <div className="text-2xl font-bold text-white">
                  {metrics?.highValueCustomers || 0}
                </div>
                <div className="text-white/40 text-sm mt-1">
                  {metrics?.totalCustomers ? ((metrics.highValueCustomers / metrics.totalCustomers) * 100).toFixed(0) : 0}% of total
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LTV by Acquisition Source */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">LTV by Acquisition Source</h2>
              {metrics?.sourceBreakdown && metrics.sourceBreakdown.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.sourceBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" tickFormatter={(v) => `$${v}`} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <YAxis dataKey="source" type="category" width={80} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="avgLTV" fill="#F97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {metrics.sourceBreakdown.map((source) => (
                      <div key={source.source} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{getSourceIcon(source.source)}</span>
                          <span className="text-white font-medium capitalize">{source.source}</span>
                          <span className="text-white/40 text-sm">({source.customers} customers)</span>
                        </div>
                        <span className="text-green-400 font-bold">{formatCurrency(source.avgLTV)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-white/40">
                  No data available
                </div>
              )}
            </div>

            {/* Customer Cohort Analysis */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Customer Cohorts</h2>
              {metrics?.cohortData && metrics.cohortData.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.cohortData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(v) => {
                            const [year, month] = v.split('-');
                            return `${month}/${year.slice(2)}`;
                          }}
                        />
                        <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => `$${v}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                        <Tooltip content={<CustomLineTooltip />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="avgLTV"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={{ fill: '#F97316' }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="customers"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex gap-6 justify-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-white/60">Avg LTV</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-white/60">New Customers</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-white/40">
                  No cohort data available
                </div>
              )}
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Top Customers by Predicted LTV</h2>
              <span className="text-white/40 text-sm">Top 10 highest potential</span>
            </div>

            {metrics?.topCustomers && metrics.topCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">#</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Customer</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Score</th>
                      <th className="text-left text-white/60 text-sm font-medium py-3 px-4">Source</th>
                      <th className="text-right text-white/60 text-sm font-medium py-3 px-4">Orders</th>
                      <th className="text-right text-white/60 text-sm font-medium py-3 px-4">Current LTV</th>
                      <th className="text-right text-white/60 text-sm font-medium py-3 px-4">Predicted LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topCustomers.map((customer, index) => (
                      <tr key={customer.customer_id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-white/10 text-white'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-medium">{customer.customer_email}</div>
                          <div className="text-white/40 text-xs">
                            {customer.purchase_frequency?.toFixed(1) || '0'} orders/month
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            customer.ltv_score === 'high' ? 'bg-green-500/20 text-green-400' :
                            customer.ltv_score === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {customer.ltv_score?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                            backgroundColor: `${getSourceColor(customer.acquisition_source || 'direct')}20`,
                            color: getSourceColor(customer.acquisition_source || 'direct'),
                          }}>
                            {customer.acquisition_source || 'direct'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white">{customer.total_orders}</td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency(customer.total_revenue)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-purple-400 font-bold">{formatCurrency(customer.predicted_ltv || customer.total_revenue)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No customer data yet</p>
                <p className="text-sm mt-1">Orders will be tracked once customers make purchases</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileNav activePage="ltv" />
    </div>
  );
}

export default function LTVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading LTV analytics...</div>
        </div>
      </div>
    }>
      <LTVContent />
    </Suspense>
  );
}
