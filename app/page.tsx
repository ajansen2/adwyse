'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({})
  const refs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Redirect to dashboard if loaded as embedded app
  useEffect(() => {
    const isEmbedded = window.self !== window.top
    if (isEmbedded) {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      if (shop) {
        window.location.href = `/dashboard?${urlParams.toString()}`
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [router])

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    Object.values(refs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-text {
          background: linear-gradient(-45deg, #f59e0b, #ef4444, #f59e0b, #ef4444);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient 3s ease infinite;
        }

        .glow-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(245, 158, 11, 0.4);
        }

        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .glow-button:hover::before {
          left: 100%;
        }

        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: 'hidden'
      }}>

        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrollY > 50 ? 'rgba(10,10,10,0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease',
          padding: '20px 40px',
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div
              style={{
                cursor: 'pointer',
                fontSize: '28px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              onClick={() => window.scrollTo(0, 0)}
            >
              AdWyse
            </div>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
              {[
                { href: '/about', label: 'About' },
                { href: '#features', label: 'Features' },
                { href: '/how-it-works', label: 'How It Works' },
                { href: '#pricing', label: 'Pricing' }
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: '#ccc',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    borderBottom: '2px solid transparent',
                    paddingBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#f59e0b'
                    e.currentTarget.style.borderBottom = '2px solid #f59e0b'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ccc'
                    e.currentTarget.style.borderBottom = '2px solid transparent'
                  }}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Install App →
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '20px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 50%, rgba(245,158,11,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 80%, rgba(239,68,68,0.1) 0%, transparent 50%)`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }} />

          <div style={{
            textAlign: 'center',
            zIndex: 1,
            transform: `translateY(${scrollY * -0.2}px)`
          }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '50px',
              padding: '8px 20px',
              marginBottom: '30px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#f59e0b'
            }}>
              🎯 AI-Powered Ad Attribution for Shopify
            </div>

            <h1 className="gradient-text" style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '30px'
            }}>
              Know Which Ads<br/>Actually Make You Money
            </h1>
            <p style={{
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: '#ccc',
              marginBottom: '20px',
              fontWeight: 300
            }}>
              Track every order back to the ad that drove it
            </p>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#888',
              marginBottom: '50px',
              maxWidth: '700px',
              margin: '0 auto 50px'
            }}>
              iOS 14 broke your ad tracking. AdWyse fixes it. Track Facebook, Google, and TikTok ads with AI-powered insights that tell you exactly which campaigns to scale and which to kill.
            </p>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="glow-button"
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  padding: '18px 48px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Start Free Trial
              </button>

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent',
                  border: '2px solid #f59e0b',
                  padding: '18px 48px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#f59e0b',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                See How It Works
              </button>
            </div>

            <div style={{ marginTop: '30px', color: '#888', fontSize: '14px' }}>
              ✓ 7-day free trial • ✓ $99/month • ✓ 2-minute setup
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'float 2s ease-in-out infinite'
          }}>
            <div style={{ color: '#666', fontSize: '12px' }}>SCROLL</div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: '80px 20px', background: '#0f0f0f' }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'center'
          }}>
            {[
              { number: '70%', label: 'Of Ad Tracking Broken by iOS 14' },
              { number: '$2.4B', label: 'Wasted on Bad Ads Annually' },
              { number: '5x', label: 'Better ROAS with Attribution' },
              { number: '< 2min', label: 'Setup Time' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '10px'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#888', fontSize: '16px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '100px 20px' }}>
          <div
            ref={(el) => { refs.current.features = el }}
            id="features-section"
            className={`fade-in ${isVisible['features-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Why Choose AdWyse?
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              Stop guessing which ads work. Know exactly where your revenue comes from.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px'
            }}>
              {[
                {
                  icon: '🎯',
                  title: 'Accurate Attribution',
                  desc: 'Track every order back to its original ad source using UTM parameters, Facebook Click IDs (FBCLID), and Google Click IDs (GCLID). Know exactly which campaign drove each sale.'
                },
                {
                  icon: '🤖',
                  title: 'AI-Powered Insights',
                  desc: 'Claude AI analyzes your campaigns daily and tells you exactly what to do: "Pause Campaign X (losing $47/day)" or "Scale Campaign Y (5.2x ROAS - increase budget)".'
                },
                {
                  icon: '📊',
                  title: 'Real ROAS Calculations',
                  desc: 'See your true Return on Ad Spend. We match ad spend from Facebook/Google APIs with actual Shopify orders to show you real profit numbers.'
                },
                {
                  icon: '⚡',
                  title: 'Multi-Platform Tracking',
                  desc: 'Track Facebook Ads, Google Ads, TikTok Ads, and more - all in one dashboard. Compare performance across platforms instantly.'
                },
                {
                  icon: '🔗',
                  title: 'Seamless Integration',
                  desc: '2-minute setup. Connect your Shopify store, authorize Facebook & Google Ads. We handle webhooks, API calls, and data sync automatically.'
                },
                {
                  icon: '💰',
                  title: 'Save Thousands Monthly',
                  desc: 'Most merchants waste 30%+ of ad spend on bad campaigns. AdWyse helps you cut waste and invest in winners. Typical savings: $1,500-3,000/month.'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="floating"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '40px',
                    animationDelay: `${i * 0.2}s`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)'
                    e.currentTarget.style.borderColor = '#f59e0b'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = '#333'
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, transparent, #0f0f0f, transparent)'
        }}>
          <div
            ref={(el) => { refs.current.how = el }}
            id="how-section"
            className={`fade-in ${isVisible['how-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              How It Works
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              From ad click to revenue tracking in 4 simple steps
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
              {[
                {
                  step: '01',
                  title: 'Install & Connect',
                  desc: 'Install AdWyse from Shopify App Store. Connect your Facebook Ads and Google Ads accounts via OAuth. Takes 2 minutes.'
                },
                {
                  step: '02',
                  title: 'Track Orders',
                  desc: 'When customers click your ads, we capture UTM parameters and platform click IDs. Every Shopify order gets automatically attributed to its source.'
                },
                {
                  step: '03',
                  title: 'Pull Ad Spend Data',
                  desc: 'We sync daily ad spend from Facebook/Google APIs and match it with your orders to calculate true ROAS for each campaign.'
                },
                {
                  step: '04',
                  title: 'Get AI Insights',
                  desc: 'Claude AI analyzes your data and generates actionable insights: which campaigns to pause, scale, or optimize. See results in your dashboard.'
                }
              ].map((item, i) => (
                <div key={i} className="floating" style={{
                  textAlign: 'center',
                  animationDelay: `${i * 0.2}s`
                }}>
                  <div style={{
                    fontSize: '72px',
                    fontWeight: 800,
                    color: 'rgba(245,158,11,0.2)',
                    marginBottom: '20px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '24px', marginBottom: '15px', fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section style={{ padding: '100px 20px', background: '#0f0f0f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '40px'
            }}>
              AdWyse vs. Competitors
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '40px',
              textAlign: 'left'
            }}>
              {[
                {
                  icon: '💰',
                  title: 'Affordable Pricing',
                  desc: 'AdWyse: $99/month flat fee. Triple Whale: $129-599/month. Polar Analytics: $199-599/month. Get the same insights for less.'
                },
                {
                  icon: '🤖',
                  title: 'AI Recommendations',
                  desc: 'Most tools just show data. AdWyse uses Claude AI to tell you exactly what to do with that data. "Pause this, scale that, estimated impact: +$1,500/month".'
                },
                {
                  icon: '⚡',
                  title: 'Simple Setup',
                  desc: 'Other tools take 30+ minutes to configure. AdWyse: 2-minute OAuth setup. No complex integrations or technical knowledge required.'
                },
                {
                  icon: '🎯',
                  title: 'Focus on ROI',
                  desc: 'Built for Shopify merchants spending $1k-50k/month on ads. Not enterprise complexity. Just the metrics that matter: ROAS, attribution, profit.'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '40px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '22px', marginBottom: '15px', fontWeight: 600 }}>{item.title}</h3>
                  <p style={{ color: '#888', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, transparent, #0f0f0f)'
        }}>
          <div
            ref={(el) => { refs.current.pricing = el }}
            id="pricing-section"
            className={`fade-in ${isVisible['pricing-section'] ? 'visible' : ''}`}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              One price, unlimited tracking. No setup fees, no hidden costs.
            </p>

            <div style={{
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))',
                border: '3px solid #f59e0b',
                borderRadius: '20px',
                padding: '50px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f59e0b',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  BEST VALUE
                </div>

                <div style={{ fontSize: '20px', color: '#f59e0b', marginBottom: '10px', fontWeight: 600 }}>
                  Pro Plan
                </div>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  $99<span style={{ fontSize: '24px', color: '#ccc' }}>/month</span>
                </div>
                <div style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
                  Billed monthly • Cancel anytime • No contracts
                </div>

                <div style={{
                  textAlign: 'left',
                  marginBottom: '30px'
                }}>
                  {[
                    '✓ Unlimited order tracking',
                    '✓ Facebook Ads integration',
                    '✓ Google Ads integration',
                    '✓ TikTok Ads integration (soon)',
                    '✓ AI-powered insights',
                    '✓ ROAS calculations',
                    '✓ Campaign comparison',
                    '✓ Revenue attribution',
                    '✓ 7-day free trial'
                  ].map((feature, i) => (
                    <div key={i} style={{ color: '#ccc', marginBottom: '12px', fontSize: '16px' }}>
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  className="glow-button"
                  onClick={() => window.location.href = '/dashboard'}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Start Free Trial
                </button>

                <div style={{ marginTop: '15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                  🎉 7-day free trial • No credit card required
                </div>
              </div>
            </div>

            {/* ROI Calculator */}
            <div style={{
              maxWidth: '700px',
              margin: '60px auto 0',
              textAlign: 'center',
              padding: '40px',
              background: '#1a1a1a',
              borderRadius: '16px',
              border: '1px solid #333'
            }}>
              <h3 style={{ fontSize: '24px', marginBottom: '20px' }}>Quick ROI Calculator</h3>
              <p style={{ color: '#888', marginBottom: '20px' }}>
                If you spend $10K/month on ads and waste just 15% on bad campaigns:
              </p>
              <div style={{ fontSize: '48px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>
                $1,500/month saved
              </div>
              <div style={{ color: '#ccc' }}>
                That's <span style={{ color: '#f59e0b', fontWeight: 600 }}>15x ROI</span> on your $99 investment
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section style={{ padding: '100px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              Ready to Stop Wasting Ad Spend?
            </h2>
            <p style={{ fontSize: '20px', color: '#888', marginBottom: '40px' }}>
              Join Shopify merchants who track every dollar with AI-powered attribution. Start your 7-day free trial.
            </p>
            <button
              className="glow-button"
              onClick={() => window.location.href = '/dashboard'}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none',
                padding: '18px 48px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Start Free Trial →
            </button>
            <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
              2-minute setup • $99/month • 7-day free trial • Cancel anytime
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '60px 20px',
          borderTop: '1px solid #333',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '30px'
            }}>
              AdWyse
            </div>

            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
              <a href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</a>
              <a href="mailto:adam@adwyse.ca" style={{ color: '#666', textDecoration: 'none' }}>Contact</a>
            </div>
            <div style={{ color: '#666' }}>
              © 2025 AdWyse - AI-Powered Ad Attribution for Shopify
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
