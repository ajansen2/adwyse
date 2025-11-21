'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';
import { getUserProperties, getUserInsights, getSupabaseClient } from '../lib/supabase-client';
import { calculatePortfolioMetrics } from '../lib/calculations';
import { getRecentActivities, logActivity, formatActivityTime, type Activity } from '../lib/activities';

// Declare Chart.js type for window
interface ChartConstructor {
  new (context: CanvasRenderingContext2D, config: unknown): ChartInstance;
}

declare global {
  interface Window {
    Chart: ChartConstructor;
  }
}

interface PropertyMetrics {
  totalProperties: number;
  totalValue: number;
  avgCapRate: number;
  monthlyCashFlow: number;
  totalROI: number;
  propertiesAnalyzed: number;
}

interface PropertyDisplay {
  id: string;
  address: string;
  value: number;
  capRate: number;
  cashFlow: number;
  roi: number;
  status: 'analyzing' | 'acquired' | 'passed' | 'sold';
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface MarketData {
  city: string;
  state: string;
  avgCapRate: number;
  appreciation: number;
  score: number;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: 'opportunity' | 'warning' | 'trend';
}

interface ChartInstance {
  destroy: () => void;
}

export default function ComprehensiveDashboard() {
  const [metrics, setMetrics] = useState<PropertyMetrics>({
    totalProperties: 0,
    totalValue: 0,
    avgCapRate: 0,
    monthlyCashFlow: 0,
    totalROI: 0,
    propertiesAnalyzed: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [chartInstance, setChartInstance] = useState<ChartInstance | null>(null);
  const [roiChartInstance, setRoiChartInstance] = useState<ChartInstance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications] = useState<Notification[]>([]);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [topMarkets, setTopMarkets] = useState<MarketData[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [topProperties, setTopProperties] = useState<PropertyDisplay[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyDisplay[]>([]);
  const [activeMarkets, setActiveMarkets] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Reinitialize charts when topProperties changes
  useEffect(() => {
    if (!loading && topProperties.length > 0) {
      initializeCharts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topProperties, loading]);

  // Fetch REAL user metrics from Supabase
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch user's actual properties from Supabase
        const fetchedProperties = await getUserProperties();

        // Type cast to work around singleton pattern type inference
        const properties = fetchedProperties as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Calculate real metrics from user's properties
        const realMetrics = calculatePortfolioMetrics(properties);
        setMetrics(realMetrics);

        // Calculate active markets (unique city + state combinations)
        const uniqueMarkets = new Set(
          properties.map(p => `${p.city}, ${p.state}`)
        );
        setActiveMarkets(uniqueMarkets.size);

        // Get ALL properties for the full list
        const allPropertiesMapped = properties.map(p => ({
          id: p.id,
          address: `${p.address}, ${p.city}, ${p.state}`,
          value: p.current_value,
          capRate: p.cap_rate || 0,
          cashFlow: p.monthly_cash_flow || 0,
          roi: p.roi || 0,
          status: p.status
        }));
        setAllProperties(allPropertiesMapped);

        // Get top 3 performing properties sorted by ROI
        const top3 = properties
          .filter(p => p.roi && p.roi > 0)
          .sort((a, b) => (b.roi || 0) - (a.roi || 0))
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            address: `${p.address}, ${p.city}, ${p.state}`,
            value: p.current_value,
            capRate: p.cap_rate || 0,
            cashFlow: p.monthly_cash_flow || 0,
            roi: p.roi || 0,
            status: p.status
          }));
        setTopProperties(top3);

        // Fetch AI insights from database
        const fetchedInsights = await getUserInsights();

        // Type cast to work around singleton pattern type inference
        const insights = fetchedInsights as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        setAiInsights(insights.map(insight => ({
          id: insight.id,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence_score,
          type: insight.insight_type as 'opportunity' | 'warning' | 'trend'
        })));

        // Fetch real activity feed
        const activities = await getRecentActivities(10);
        setActivityFeed(activities);

        // Set demo market data (will be replaced with real API later)
        setTopMarkets([
          { city: 'Austin', state: 'TX', avgCapRate: 8.2, appreciation: 12.5, score: 94 },
          { city: 'Phoenix', state: 'AZ', avgCapRate: 7.8, appreciation: 11.2, score: 91 },
          { city: 'Nashville', state: 'TN', avgCapRate: 7.5, appreciation: 10.8, score: 89 },
          { city: 'Tampa', state: 'FL', avgCapRate: 7.2, appreciation: 9.5, score: 86 },
          { city: 'Charlotte', state: 'NC', avgCapRate: 6.9, appreciation: 8.7, score: 83 }
        ]);

        setLoading(false);

        // Animate counters with REAL data
        setTimeout(() => {
          animateValue('totalProperties', 0, realMetrics.totalProperties, 1500);
          animateValue('totalValue', 0, realMetrics.totalValue, 1500);
          animateValue('avgCapRate', 0, realMetrics.avgCapRate, 1500);
          animateValue('monthlyCashFlow', 0, realMetrics.monthlyCashFlow, 1500);
          animateValue('totalROI', 0, realMetrics.totalROI, 1500);
        }, 100);

        // Log dashboard view activity on initial load only
        // Non-blocking - don't fail if activity logging fails
        logActivity('Viewed dashboard', 'dashboard').catch(err =>
          console.error('Failed to log activity:', err)
        );
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const animateValue = (id: string, start: number, end: number, duration: number) => {
    const element = document.getElementById(id);
    if (!element || isNaN(end)) return;

    const range = end - start;
    const minTimer = 50;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = Math.max(stepTime, minTimer);
    const steps = Math.floor(duration / timer);
    const increment = range / steps;
    let current = start;

    const handle = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        if (id === 'totalValue' || id === 'monthlyCashFlow') {
          element.textContent = `$${end.toLocaleString()}`;
        } else if (id === 'avgCapRate' || id === 'totalROI') {
          element.textContent = `${end.toFixed(1)}%`;
        } else {
          element.textContent = Math.round(end).toString();
        }
        clearInterval(handle);
      } else {
        if (id === 'totalValue' || id === 'monthlyCashFlow') {
          element.textContent = `$${Math.floor(current).toLocaleString()}`;
        } else if (id === 'avgCapRate' || id === 'totalROI') {
          element.textContent = `${current.toFixed(1)}%`;
        } else {
          element.textContent = Math.floor(current).toString();
        }
      }
    }, timer);
  };

  const initializeCharts = () => {
    if (!window.Chart) return;

    // Portfolio Value Chart (demo data until historical tracking is implemented)
    const canvas1 = document.getElementById('portfolioChart') as HTMLCanvasElement;
    if (canvas1) {
      const ctx1 = canvas1.getContext('2d');
      if (!ctx1) return;

      if (chartInstance) chartInstance.destroy();

      const gradient1 = ctx1.createLinearGradient(0, 0, 0, 300);
      gradient1.addColorStop(0, 'rgba(102, 126, 234, 0.6)');
      gradient1.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

      const newChart = new window.Chart(ctx1, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Portfolio Value (Demo)',
              data: [3200000, 3450000, 3680000, 3920000, 4100000, 4250000],
              borderColor: '#667eea',
              backgroundColor: gradient1,
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: '#667eea',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#fff',
                font: { size: 14, weight: 600 },
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.9)',
              titleColor: '#fff',
              bodyColor: '#ccc',
              borderColor: '#667eea',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                label: (context: { parsed: { y: number } }) => `$${context.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#888', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#888',
                font: { size: 12 },
                callback: (value: string | number) => `$${(Number(value)/1000000).toFixed(1)}M`
              }
            }
          }
        }
      });
      setChartInstance(newChart);
    }

    // ROI Chart - NOW DYNAMIC with user's real properties
    const canvas2 = document.getElementById('roiChart') as HTMLCanvasElement;
    if (canvas2) {
      const ctx2 = canvas2.getContext('2d');
      if (!ctx2) return;

      if (roiChartInstance) roiChartInstance.destroy();

      // Use topProperties data (already sorted by ROI)
      const labels = topProperties.map(p => {
        const parts = p.address.split(',');
        return parts[0].length > 20 ? parts[0].substring(0, 20) + '...' : parts[0];
      });
      const roiData = topProperties.map(p => p.roi || 0);

      // Generate colors based on ROI value
      const colors = roiData.map(roi => {
        if (roi >= 20) return 'rgba(0, 255, 65, 0.8)'; // Green for high ROI
        if (roi >= 15) return 'rgba(102, 126, 234, 0.8)'; // Blue for good ROI
        if (roi >= 10) return 'rgba(255, 159, 64, 0.8)'; // Orange for medium ROI
        return 'rgba(255, 99, 132, 0.8)'; // Red for low ROI
      });

      const borderColors = colors.map(c => c.replace('0.8', '1'));

      const roiChart = new window.Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['No properties yet'],
          datasets: [{
            label: 'ROI (%)',
            data: roiData.length > 0 ? roiData : [0],
            backgroundColor: colors.length > 0 ? colors : ['rgba(102, 126, 234, 0.8)'],
            borderColor: borderColors.length > 0 ? borderColors : ['rgb(102, 126, 234)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: { parsed: { y: number } }) => `ROI: ${context.parsed.y.toFixed(2)}%`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#888',
                callback: (value: string | number) => `${value}%`
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#888',
                maxRotation: 45,
                minRotation: 0
              }
            }
          }
        }
      });
      setRoiChartInstance(roiChart);
    }
  };

  const handleExportReport = async () => {
    const reportData = {
      date: new Date().toISOString(),
      period: selectedPeriod,
      metrics: {
        totalProperties: metrics.totalProperties,
        portfolioValue: metrics.totalValue,
        avgCapRate: metrics.avgCapRate,
        monthlyCashFlow: metrics.monthlyCashFlow,
        totalROI: metrics.totalROI
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `argora-deals-report-${new Date().toISOString().split('T')[0]}.json`;
    a.download = filename;
    a.click();

    // Log activity (non-blocking)
    logActivity('Exported portfolio report', 'report', undefined, { filename, period: selectedPeriod })
      .then(() => getRecentActivities(10))
      .then(activities => setActivityFeed(activities))
      .catch(err => console.error('Failed to log activity:', err));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading your portfolio...</div>
        </div>
      </div>
    );
  }

  // Empty state - no properties yet
  if (metrics.totalProperties === 0) {
    return (
      <>
        <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <Link href="/demo" className="text-white/80 hover:text-white transition-colors">Demo</Link>
            </nav>
          </div>
        </header>

        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <div className="text-8xl mb-8">🏠</div>
            <h1 className="text-5xl font-bold text-white mb-4">Welcome to ARGORA DEALS!</h1>
            <p className="text-white/70 text-xl mb-8">
              You're all set up! Analyze any property deal with AI or add properties you already own to track your portfolio.
            </p>
            <div className="flex gap-4 justify-center mb-4">
              <Link
                href="/analyze"
                className="inline-block px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold text-xl hover:opacity-90 transition shadow-lg"
              >
                🔍 Analyze a Deal
              </Link>
              <Link
                href="/properties/add"
                className="inline-block px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-white font-semibold text-xl hover:opacity-90 transition shadow-lg"
              >
                ➕ Add Property
              </Link>
            </div>
            <p className="text-white/50 text-sm mt-8">
              AI-powered deal analysis • Real market data • Investment recommendations
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        onLoad={initializeCharts}
        strategy="afterInteractive"
      />

      {/* Header Navigation */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
          </Link>
          <nav>
            <button
              onClick={async () => {
                const supabase = getSupabaseClient();
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors text-sm font-semibold"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">

        {/* Live Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`
                p-4 rounded-lg shadow-lg backdrop-blur-sm
                ${notif.type === 'success' ? 'bg-green-500/90' : 'bg-blue-500/90'}
                text-white max-w-sm
              `}
            >
              {notif.message}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Portfolio Dashboard
                </h1>
                <p className="text-white/70 text-lg">Real-time investment analytics powered by AI</p>
              </div>

              <div className="text-right">
                <div className="flex gap-2 mb-2 justify-end">
                  <Link
                    href="/analyze"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition text-sm font-semibold"
                  >
                    🔍 Analyze New Deal
                  </Link>
                  <Link
                    href="/properties/add"
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition text-sm font-semibold"
                  >
                    ➕ Add Property
                  </Link>
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition text-sm"
                  >
                    📊 Export Report
                  </button>
                </div>
                <div className="text-white/60 text-sm mb-1">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-2xl font-mono">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500 text-sm font-semibold">LIVE</span>
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="mt-6">
              <div className="flex gap-2">
                {(['week', 'month', 'quarter'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    This {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-2">
                📊 Historical data tracking coming soon - currently showing all-time metrics
              </p>
            </div>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-8">
              <div className="text-white/60 text-sm mb-2 uppercase tracking-wider">Portfolio Value</div>
              <div className="text-5xl font-bold text-white">
                <span id="totalValue">$0</span>
              </div>
              <div className="text-white/40 text-sm mt-2">Total market value of all properties</div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-8">
              <div className="text-white/60 text-sm mb-2 uppercase tracking-wider">Monthly Cash Flow</div>
              <div className="text-5xl font-bold text-white">
                <span id="monthlyCashFlow">$0</span>
              </div>
              <div className="text-white/40 text-sm mt-2">Net income after all expenses</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-8">
              <div className="text-white/60 text-sm mb-2 uppercase tracking-wider">Total ROI</div>
              <div className="text-5xl font-bold text-white">
                <span id="totalROI">0%</span>
              </div>
              <div className="text-white/40 text-sm mt-2">Return on investment across portfolio</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Properties', id: 'totalProperties', value: metrics.totalProperties, icon: '🏠' },
              { label: 'Avg Cap Rate', id: 'avgCapRate', value: `${metrics.avgCapRate.toFixed(2)}%`, icon: '📈' },
              { label: 'Properties Analyzed', id: 'propertiesAnalyzed', value: metrics.propertiesAnalyzed, icon: '🔍' },
              { label: 'Active Markets', id: 'activeMarkets', value: activeMarkets, icon: '🗺️' }
            ].map(stat => (
              <div key={stat.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-2">{stat.label}</div>
                <div className="text-3xl font-bold">
                  {typeof stat.value === 'number' ? <span id={stat.id}>0</span> : stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2">Portfolio Growth</h3>
              <p className="text-white/40 text-xs mb-4">📊 Demo data - Historical tracking coming soon</p>
              <div className="h-[300px]">
                <canvas id="portfolioChart"></canvas>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2">Property Performance</h3>
              <p className="text-white/40 text-xs mb-4">💪 Showing your top {topProperties.length} properties by ROI</p>
              <div className="h-[300px]">
                <canvas id="roiChart"></canvas>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              AI-Powered Market Insights
            </h3>
            <div className="space-y-4">
              {aiInsights.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <div className="text-4xl mb-4">🔮</div>
                  <p className="text-lg mb-2">AI Insights Coming Soon</p>
                  <p className="text-sm">As you add more properties, our AI will analyze market trends and provide personalized insights.</p>
                </div>
              ) : (
                aiInsights.map(insight => (
                <div
                  key={insight.id}
                  className={`
                    p-5 rounded-xl border-l-4 backdrop-blur
                    ${insight.type === 'opportunity' ? 'bg-green-500/10 border-green-500' : ''}
                    ${insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' : ''}
                    ${insight.type === 'trend' ? 'bg-blue-500/10 border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {insight.type === 'opportunity' && '🎯'}
                      {insight.type === 'warning' && '⚠️'}
                      {insight.type === 'trend' && '📊'}
                      {insight.title}
                    </h4>
                    <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                      {insight.confidence}% confident
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-3">{insight.description}</p>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        insight.type === 'opportunity' ? 'bg-green-500' :
                        insight.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Top Markets & Top Properties Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Markets Heatmap */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                Top Investment Markets
              </h3>
              <div className="space-y-3">
                {topMarkets.map((market, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-white/10 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg">{market.city}, {market.state}</div>
                        <div className="text-white/60 text-xs">Market Score: {market.score}/100</div>
                      </div>
                      <div className={`
                        text-2xl font-bold px-4 py-2 rounded-lg
                        ${market.score >= 90 ? 'bg-green-500/20 text-green-400' : ''}
                        ${market.score >= 85 && market.score < 90 ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${market.score < 85 ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      `}>
                        #{index + 1}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-white/50 text-xs mb-1">Avg Cap Rate</div>
                        <div className="text-green-400 font-bold">{market.avgCapRate}%</div>
                      </div>
                      <div>
                        <div className="text-white/50 text-xs mb-1">Appreciation</div>
                        <div className="text-blue-400 font-bold">↑ {market.appreciation}%</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-black/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${market.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Properties */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                Top Performing Properties
              </h3>
              <p className="text-white/60 text-sm mb-4">Click any property to edit details and update cash flow</p>
              <div className="space-y-3">
                {topProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/edit/${property.id}`}
                    className="block p-4 rounded-xl bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-white/10 hover:border-green-500/50 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-sm mb-1">{property.address}</div>
                        <div className="text-white/60 text-xs">${property.value.toLocaleString()}</div>
                      </div>
                      <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        ROI: {property.roi}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-white/50 mb-1">Cap Rate</div>
                        <div className="text-purple-400 font-bold">{property.capRate}%</div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Cash Flow</div>
                        <div className="text-green-400 font-bold">${property.cashFlow}</div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Status</div>
                        <div className="text-blue-400 font-bold capitalize">{property.status}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Deal Score Calculator */}
          <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Deal Quality Scoring System
            </h3>
            <p className="text-white/70 mb-6">
              Our system analyzes 50+ factors to give you instant deal quality scores. Higher scores = better opportunities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Excellent Deals', score: '90-100', count: 23, color: 'green' },
                { label: 'Good Deals', score: '75-89', count: 67, color: 'blue' },
                { label: 'Fair Deals', score: '60-74', count: 94, color: 'yellow' }
              ].map(category => (
                <div
                  key={category.label}
                  className={`
                    p-5 rounded-xl border backdrop-blur
                    ${category.color === 'green' ? 'bg-green-500/10 border-green-500/30' : ''}
                    ${category.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                    ${category.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                  `}
                >
                  <div className="text-white/60 text-sm mb-2">{category.label}</div>
                  <div className="text-3xl font-bold mb-1">{category.count}</div>
                  <div className="text-white/50 text-xs">Score: {category.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Recent Activity
            </h3>
            {activityFeed.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg mb-2">No activity yet</p>
                <p className="text-sm">Your actions will appear here as you use the platform</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div className="flex-1 text-white/80">{activity.action}</div>
                    <div className="text-white/50 text-sm">{formatActivityTime(activity.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Properties List */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">🏘️</span>
                All Properties ({allProperties.length})
              </h3>
              <Link
                href="/properties/add"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition text-sm font-semibold"
              >
                ➕ Add Property
              </Link>
            </div>

            {allProperties.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <div className="text-6xl mb-4">🏠</div>
                <p className="text-xl mb-2">No properties yet</p>
                <p className="text-sm mb-6">Add your first property to start tracking your portfolio</p>
                <Link
                  href="/properties/add"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold hover:opacity-90 transition"
                >
                  Add Your First Property
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/edit/${property.id}`}
                    className="block p-5 rounded-xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/10 hover:border-purple-500/50 hover:scale-[1.02] transition-all"
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`
                        text-xs px-3 py-1 rounded-full font-bold uppercase
                        ${property.status === 'acquired' ? 'bg-green-500/20 text-green-400' : ''}
                        ${property.status === 'analyzing' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${property.status === 'passed' ? 'bg-gray-500/20 text-gray-400' : ''}
                        ${property.status === 'sold' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      `}>
                        {property.status}
                      </span>
                      <div className="text-xs font-bold">
                        {property.roi > 0 ? (
                          <span className="text-green-400">↑ +{property.roi.toFixed(1)}% ROI</span>
                        ) : property.roi < 0 ? (
                          <span className="text-red-400">↓ {property.roi.toFixed(1)}% ROI</span>
                        ) : (
                          <span className="text-gray-400">0.0% ROI</span>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="font-bold text-white mb-2 line-clamp-2">
                      {property.address}
                    </div>

                    {/* Value */}
                    <div className="text-white/60 text-sm mb-4">
                      ${property.value.toLocaleString()}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-white/50 mb-1">Cap Rate</div>
                        <div className="text-purple-400 font-bold">{property.capRate.toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Cash Flow</div>
                        <div className={`font-bold ${property.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${Math.abs(property.cashFlow).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50 mb-1">Action</div>
                        <div className="text-blue-400 font-bold">Edit →</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
