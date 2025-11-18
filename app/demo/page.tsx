'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

export default function DemoPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; index: number; pixelX?: number; pixelY?: number } | null>(null);

  // Calculate values based on active range
  const getValuesForRange = (range: TimeRange) => {
    const values = {
      '1D': { price: 287450, change: 350, percent: 0.12 },
      '5D': { price: 287850, change: 850, percent: 0.30 },
      '1M': { price: 287450, change: 2350, percent: 0.82 },
      '3M': { price: 289200, change: 4200, percent: 1.47 },
      '6M': { price: 293500, change: 8500, percent: 2.98 },
      '1Y': { price: 299100, change: 14100, percent: 4.95 }
    };
    return values[range];
  };

  const { price: currentPrice, change: priceChange, percent: percentChange } = getValuesForRange(activeRange);

  // Calculate metrics based on range
  const getMetricsForRange = (range: TimeRange) => {
    const multipliers = {
      '1D': 0.2,
      '5D': 0.4,
      '1M': 1,
      '3M': 2.5,
      '6M': 4,
      '1Y': 7
    };
    const mult = multipliers[range];

    return [
      { label: 'Cap Rate', value: '7.2%', change: `+${(0.3 * mult).toFixed(1)}%`, positive: true },
      { label: 'Cash Flow', value: '$1,450/mo', change: `+$${Math.round(120 * mult)}`, positive: true },
      { label: 'ROI', value: '12.8%', change: `+${(1.2 * mult).toFixed(1)}%`, positive: true },
      { label: 'NOI', value: '$21,600', change: `+$${Math.round(1800 * mult).toLocaleString()}`, positive: true },
      { label: 'Price/sqft', value: '$155', change: `+$${Math.round(3 * mult)}`, positive: true },
      { label: 'Market Index', value: '94.5', change: `+${(2.1 * mult).toFixed(1)}`, positive: true },
    ];
  };

  // Generate chart data based on selected time range
  const generateChartData = (range: TimeRange) => {
    const basePrice = 285000;
    let dataPoints: number;

    switch (range) {
      case '1D':
        dataPoints = 24;
        break;
      case '5D':
        dataPoints = 120;
        break;
      case '1M':
        dataPoints = 30;
        break;
      case '3M':
        dataPoints = 90;
        break;
      case '6M':
        dataPoints = 180;
        break;
      case '1Y':
        dataPoints = 365;
        break;
      default:
        dataPoints = 30;
    }

    const data = [];
    for (let i = 0; i < dataPoints; i++) {
      const variation = Math.sin(i / 5) * 5000 + (i * 50);
      const randomNoise = (Math.random() - 0.5) * 3000;
      data.push(basePrice + variation + randomNoise);
    }
    return data;
  };

  const chartData = generateChartData(activeRange);
  const maxPrice = Math.max(...chartData);
  const minPrice = Math.min(...chartData);

  const getTimeLabel = (range: TimeRange): string => {
    const labels = {
      '1D': 'today',
      '5D': 'last 5 days',
      '1M': 'last month',
      '3M': 'last quarter',
      '6M': 'last 6 months',
      '1Y': 'this year'
    };
    return labels[range];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

        .glow-card {
          transition: all 0.3s ease;
        }

        .glow-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        }

        .glow-button {
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Image src="/logo 3.png" alt="ARGORA DEALS" width={140} height={47} style={{ objectFit: 'contain' }} />
          </Link>
          <nav className="flex gap-8 items-center">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
            <Link href="/roi-calculator" className="text-white/80 hover:text-white transition-colors">ROI Calculator</Link>
            <Link
              href="/onboarding"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold glow-button"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Interactive <span className="gradient-text">Demo Dashboard</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Explore how ARGORA DEALS helps you track property values, analyze deals, and make data-driven investment decisions in real-time
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-lg glow-button"
          >
            Create Your Own Dashboard →
          </Link>
        </div>

        {/* Demo Dashboard Container */}
        <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border border-white/10 rounded-3xl p-12 backdrop-blur-sm">
          {/* Property Header */}
          <div className="flex justify-between items-center mb-12 flex-wrap gap-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                1234 Sunset Blvd, Los Angeles, CA
              </h2>
              <p className="text-white/60 text-lg">
                Single Family • 3 Bed • 2 Bath • 1,850 sq ft
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-5xl font-bold text-white mb-2">
                ${currentPrice.toLocaleString()}
              </div>
              <div style={{
                color: priceChange >= 0 ? '#00ff41' : '#ff4444',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString()} ({percentChange >= 0 ? '+' : ''}{percentChange}%) {getTimeLabel(activeRange)}
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-4 mb-12 justify-center flex-wrap">
            {(['1D', '5D', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                  activeRange === range
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-slate-900/50 rounded-2xl p-8 mb-12 border border-white/5">
            <div style={{ position: 'relative', height: '500px' }}>
              <svg
                viewBox="0 0 1000 300"
                style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                preserveAspectRatio="none"
                onMouseMove={(e) => {
                  const svg = e.currentTarget;
                  const rect = svg.getBoundingClientRect();

                  // Get mouse position relative to SVG
                  const mouseX = e.clientX - rect.left;

                  // Convert to viewBox coordinates
                  const x = (mouseX / rect.width) * 1000;
                  const index = Math.round((x / 1000) * (chartData.length - 1));

                  if (index >= 0 && index < chartData.length) {
                    const price = chartData[index];
                    const pointX = (index / (chartData.length - 1)) * 1000;
                    const pointY = 300 - ((price - minPrice) / (maxPrice - minPrice)) * 280;

                    // Store both SVG coordinates and pixel coordinates
                    setHoveredPoint({
                      x: pointX,
                      y: pointY,
                      price,
                      index,
                      pixelX: mouseX,
                      pixelY: (pointY / 300) * rect.height
                    });
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: '#667eea', stopOpacity: 0.05 }} />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={i * 75}
                    x2="1000"
                    y2={i * 75}
                    stroke="#333"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}

                {/* Chart area fill */}
                <polygon
                  points={chartData.map((price, index) => {
                    const x = (index / (chartData.length - 1)) * 1000;
                    const y = 300 - ((price - minPrice) / (maxPrice - minPrice)) * 280;
                    return `${x},${y}`;
                  }).join(' ') + ` 1000,300 0,300`}
                  fill="url(#chartGradient)"
                />

                {/* Chart line */}
                <polyline
                  points={chartData.map((price, index) => {
                    const x = (index / (chartData.length - 1)) * 1000;
                    const y = 300 - ((price - minPrice) / (maxPrice - minPrice)) * 280;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="3"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(102,126,234,0.6))'
                  }}
                />

                {/* Hover indicator */}
                {hoveredPoint && (
                  <>
                    {/* Vertical line */}
                    <line
                      x1={hoveredPoint.x}
                      y1="0"
                      x2={hoveredPoint.x}
                      y2="300"
                      stroke="#667eea"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.5"
                    />
                    {/* Hover point */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="6"
                      fill="#667eea"
                      stroke="white"
                      strokeWidth="2"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(102,126,234,0.8))'
                      }}
                    />
                  </>
                )}

                {/* Price labels */}
                <text x="10" y="25" fill="#888" fontSize="12">${(maxPrice/1000).toFixed(0)}k</text>
                <text x="10" y="285" fill="#888" fontSize="12">${(minPrice/1000).toFixed(0)}k</text>
              </svg>

              {/* Tooltip */}
              {hoveredPoint && hoveredPoint.pixelX !== undefined && hoveredPoint.pixelY !== undefined && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${hoveredPoint.pixelX}px`,
                    top: `${hoveredPoint.pixelY}px`,
                    transform: 'translate(-50%, -40px)',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 16px rgba(102,126,234,0.6)',
                    zIndex: 10,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  ${hoveredPoint.price.toLocaleString()}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid #667eea'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {getMetricsForRange(activeRange).map((metric, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/10 rounded-2xl p-8 glow-card"
              >
                <div className="text-white/60 text-sm mb-3 uppercase tracking-wider">
                  {metric.label}
                </div>
                <div className="text-4xl font-bold text-white mb-3">
                  {metric.value}
                </div>
                <div style={{
                  color: metric.positive ? '#00ff41' : '#ff4444',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  {metric.change} {getTimeLabel(activeRange)}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Start Analyzing Properties Like This
            </h3>
            <p className="text-white/70 mb-8 text-lg max-w-2xl mx-auto">
              Get instant access to AI-powered deal analysis, real-time market data, and comprehensive portfolio tracking
            </p>
            <Link
              href="/onboarding"
              className="inline-block px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-xl glow-button"
            >
              Try It Free →
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: '📊',
              title: 'Real-Time Analytics',
              desc: 'Track property values, market trends, and key metrics in real-time with interactive charts and live data feeds'
            },
            {
              icon: '🤖',
              title: 'AI-Powered Insights',
              desc: 'Get intelligent recommendations and risk assessments powered by Claude AI to make smarter investment decisions'
            },
            {
              icon: '📈',
              title: 'Portfolio Management',
              desc: 'Monitor all your properties in one place with performance tracking, alerts, and comprehensive reporting'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border border-white/10 rounded-2xl p-10 text-center backdrop-blur-sm glow-card"
            >
              <div className="text-6xl mb-6">{feature.icon}</div>
              <h4 className="text-2xl font-bold text-white mb-4">{feature.title}</h4>
              <p className="text-white/70 text-lg leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">ARGORA DEALS</div>
              <p className="text-white/60">AI-powered real estate investment analysis</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/demo" className="text-white/60 hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/roi-calculator" className="text-white/60 hover:text-white transition-colors">ROI Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-white/60">adam@argora.ai</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 ARGORA DEALS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
