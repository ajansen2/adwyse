'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MetricCard } from '@/components/ui';

interface WebhookEvent {
  id: string;
  shop_domain: string;
  webhook_topic: string;
  success: boolean;
  error_type: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

interface WebhookSummary {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  successRate: number;
  avgProcessingTime: number;
}

interface TopicBreakdown {
  [topic: string]: { total: number; success: number; failed: number };
}

function WebhooksContent() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WebhookSummary | null>(null);
  const [topicBreakdown, setTopicBreakdown] = useState<TopicBreakdown>({});
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [recentErrors, setRecentErrors] = useState<WebhookEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const searchParams = useSearchParams();

  const loadMetrics = async () => {
    try {
      const shop = searchParams.get('shop');
      if (!shop) {
        setLoading(false);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/api/webhooks/metrics?shop=${encodeURIComponent(shop)}&limit=200`, false);
      xhr.send();

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setSummary(data.summary);
        setTopicBreakdown(data.topicBreakdown);
        setEvents(data.events);
        setRecentErrors(data.recentErrors);
      }
    } catch (error) {
      console.error('Error loading webhook metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [searchParams]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, searchParams]);

  const getTopicLabel = (topic: string) => {
    const labels: Record<string, string> = {
      'orders/create': 'Order Created',
      'orders/updated': 'Order Updated',
      'orders/paid': 'Order Paid',
      'checkouts/create': 'Checkout Started',
      'checkouts/update': 'Checkout Updated',
      'app_subscriptions/update': 'Subscription Updated',
      'app/uninstalled': 'App Uninstalled',
      'customers/create': 'Customer Created',
      'customers/update': 'Customer Updated',
    };
    return labels[topic] || topic;
  };

  const getTopicIcon = (topic: string) => {
    if (topic.includes('orders')) return '📦';
    if (topic.includes('checkout')) return '🛒';
    if (topic.includes('subscription')) return '💳';
    if (topic.includes('customer')) return '👤';
    if (topic.includes('uninstall')) return '🗑️';
    return '📨';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading webhook monitor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="webhooks" />

      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Webhook Monitor</h1>
              <p className="text-white/60 text-sm">Real-time Shopify webhook events</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadMetrics}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border-white/20"
                />
                Auto-refresh
              </label>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Events"
              value={summary?.totalEvents || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Successful"
              value={summary?.successfulEvents || 0}
              icon={
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Failed"
              value={summary?.failedEvents || 0}
              icon={
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
            <MetricCard
              title="Success Rate"
              value={summary?.totalEvents === 0 ? 1 : (summary?.successRate || 0) / 100}
              format="percent"
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              className="bg-white/5 backdrop-blur border-white/10"
            />
          </div>

          {/* Topic Breakdown */}
          {Object.keys(topicBreakdown).length > 0 && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Events by Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(topicBreakdown).map(([topic, stats]) => (
                  <div
                    key={topic}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTopicIcon(topic)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{getTopicLabel(topic)}</div>
                        <div className="text-white/40 text-xs">{topic}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-center">
                        <div className="text-white text-lg font-bold">{stats.total}</div>
                        <div className="text-white/40 text-xs">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 text-lg font-bold">{stats.success}</div>
                        <div className="text-white/40 text-xs">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 text-lg font-bold">{stats.failed}</div>
                        <div className="text-white/40 text-xs">Failed</div>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${stats.total > 0 ? (stats.success / stats.total * 100) : 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Recent Errors</h2>
              </div>
              <div className="space-y-3">
                {recentErrors.map((error) => (
                  <div
                    key={error.id}
                    className="p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{getTopicLabel(error.webhook_topic)}</span>
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                            {error.error_type || 'Error'}
                          </span>
                        </div>
                        {error.error_message && (
                          <p className="text-red-200/70 text-sm mt-1 truncate">{error.error_message}</p>
                        )}
                      </div>
                      <div className="text-white/40 text-xs whitespace-nowrap">
                        {new Date(error.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events Stream */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Event Stream</h2>
              <span className="text-white/40 text-sm">Last {events.length} events</span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-white/60">No webhook events yet</p>
                <p className="text-white/40 text-sm mt-1">Events will appear here when Shopify sends webhooks</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition ${
                      event.success
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
                    }`}
                  >
                    <span className="text-xl">{getTopicIcon(event.webhook_topic)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{getTopicLabel(event.webhook_topic)}</span>
                        {event.success ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      {!event.success && event.error_type && (
                        <span className="text-red-300 text-xs">{event.error_type}</span>
                      )}
                    </div>
                    {event.processing_time_ms && (
                      <span className="text-white/40 text-xs">{event.processing_time_ms}ms</span>
                    )}
                    <span className="text-white/40 text-xs whitespace-nowrap">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading webhook monitor...</div>
        </div>
      </div>
    }>
      <WebhooksContent />
    </Suspense>
  );
}
