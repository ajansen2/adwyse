'use client';

import { useState } from 'react';

type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

export default function DemoDashboard() {
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');

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
    let dataPoints: number;

    switch (range) {
      case '1D':
        dataPoints = 24; // Hourly updates
        break;
      case '5D':
        dataPoints = 120; // Every 2 hours over 5 days
        break;
      case '1M':
        dataPoints = 30; // Daily
        break;
      case '3M':
        dataPoints = 90; // Daily
        break;
      case '6M':
        dataPoints = 180; // Daily
        break;
      case '1Y':
        dataPoints = 365; // Daily
        break;
      default:
        dataPoints = 30;
    }

    const data = [];
    const basePrice = 285000;
    for (let i = 0; i < dataPoints; i++) {
      const variation = Math.sin(i / 5) * 5000 + (i * 50); // Simulated growth trend
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
    <section id="demo-dashboard" style={{
      padding: '100px 20px',
      background: 'linear-gradient(180deg, transparent, #0f0f0f, transparent)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          See Your Dashboard in Action
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '20px',
          marginBottom: '60px'
        }}>
          Track property values, analyze deals, and make data-driven investment decisions
        </p>

        {/* Demo Dashboard Container */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          border: '1px solid rgba(102,126,234,0.3)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(102,126,234,0.2)'
        }}>
          {/* Property Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h3 style={{ fontSize: '28px', marginBottom: '8px' }}>
                1234 Sunset Blvd, Los Angeles, CA
              </h3>
              <p style={{ color: '#888', fontSize: '16px' }}>
                Single Family • 3 Bed • 2 Bath • 1,850 sq ft
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                ${currentPrice.toLocaleString()}
              </div>
              <div style={{
                color: priceChange >= 0 ? '#00ff41' : '#ff4444',
                fontSize: '18px'
              }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString()} ({percentChange >= 0 ? '+' : ''}{percentChange}%) {getTimeLabel(activeRange)}
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            {(['1D', '5D', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: activeRange === range ? '2px solid #667eea' : '1px solid #333',
                  background: activeRange === range ? 'rgba(102,126,234,0.2)' : '#1a1a1a',
                  color: activeRange === range ? '#667eea' : '#888',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeRange === range ? 600 : 400,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeRange !== range) {
                    e.currentTarget.style.borderColor = '#667eea40';
                    e.currentTarget.style.background = '#2a2a2a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeRange !== range) {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.background = '#1a1a1a';
                  }
                }}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background: '#0a0a0a',
            borderRadius: '12px',
            padding: '30px 20px',
            marginBottom: '40px',
            position: 'relative',
            height: '400px'
          }}>
            <svg viewBox="0 0 1000 300" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
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

              {/* Price labels */}
              <text x="10" y="25" fill="#888" fontSize="12">${(maxPrice/1000).toFixed(0)}k</text>
              <text x="10" y="285" fill="#888" fontSize="12">${(minPrice/1000).toFixed(0)}k</text>
            </svg>
          </div>

          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {getMetricsForRange(activeRange).map((metric, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #667eea10, #764ba210)',
                  border: '1px solid rgba(102,126,234,0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(102,126,234,0.5)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102,126,234,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(102,126,234,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  {metric.value}
                </div>
                <div style={{
                  color: metric.positive ? '#00ff41' : '#ff4444',
                  fontSize: '14px'
                }}>
                  {metric.change} {getTimeLabel(activeRange)}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))',
            borderRadius: '16px',
            border: '1px solid rgba(102,126,234,0.3)'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>
              Start Analyzing Properties Like This
            </h3>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '16px' }}>
              Get instant access to AI-powered deal analysis, market data, and portfolio tracking
            </p>
            <button
              onClick={() => window.location.href = '/onboarding'}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                padding: '16px 40px',
                borderRadius: '12px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(102,126,234,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Try It Free →
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginTop: '60px'
        }}>
          {[
            {
              icon: '📊',
              title: 'Real-Time Analytics',
              desc: 'Track property values, market trends, and key metrics in real-time with interactive charts'
            },
            {
              icon: '🤖',
              title: 'AI-Powered Insights',
              desc: 'Get intelligent recommendations and risk assessments powered by Claude AI'
            },
            {
              icon: '📈',
              title: 'Portfolio Management',
              desc: 'Monitor all your properties in one place with performance tracking and alerts'
            }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                border: '1px solid #333',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
              <h4 style={{ fontSize: '20px', marginBottom: '12px' }}>{feature.title}</h4>
              <p style={{ color: '#888', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
