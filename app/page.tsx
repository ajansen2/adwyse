'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ShopifyAppStoreBadge from '@/components/ShopifyAppStoreBadge'

export default function HomePage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({})
  const refs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Redirect to dashboard if loaded as embedded app
  useEffect(() => {
    // Check if we're in an iframe (embedded in Shopify)
    const isEmbedded = window.self !== window.top

    console.log('🔍 Homepage: isEmbedded =', isEmbedded)

    if (isEmbedded) {
      // Get params from URL or use App Bridge
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')

      console.log('🔍 Homepage: shop param =', shop)

      if (shop) {
        // Has shop param - redirect with params
        console.log('🔍 Homepage: Redirecting to /dashboard with params')
        window.location.href = `/dashboard?${urlParams.toString()}`
      } else {
        // No shop param but embedded - just redirect to dashboard
        console.log('🔍 Homepage: Redirecting to /dashboard')
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

        /* Gradient text animation */
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
          background-clip: text;
          animation: gradient 3s ease infinite;
        }

        /* Glow button */
        .glow-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
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

        /* Fade in animation */
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Float animation */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }

        /* Pulse animation */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
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
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              onClick={() => window.scrollTo(0, 0)}
            >
              ARGORA
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
                    e.currentTarget.style.color = '#667eea'
                    e.currentTarget.style.borderBottom = '2px solid #667eea'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ccc'
                    e.currentTarget.style.borderBottom = '2px solid transparent'
                  }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://apps.shopify.com/argora-cart-recovery"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Get App →
              </a>
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
          {/* Background particles effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 50%, rgba(102,126,234,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 80%, rgba(118,75,162,0.1) 0%, transparent 50%)`,
            transform: `translateY(${scrollY * 0.5}px)`,
          }} />

          <div style={{
            textAlign: 'center',
            zIndex: 1,
            transform: `translateY(${scrollY * -0.2}px)`
          }}>
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              border: '1px solid #667eea40',
              borderRadius: '50px',
              padding: '8px 20px',
              marginBottom: '30px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#667eea'
            }}>
              🚀 Shopify App • AI-Powered Cart Recovery
            </div>

            <h1 className="gradient-text" style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '30px'
            }}>
              Recover Lost Sales<br/>With AI-Powered Emails
            </h1>
            <p style={{
              fontSize: 'clamp(20px, 3vw, 32px)',
              color: '#ccc',
              marginBottom: '20px',
              fontWeight: 300
            }}>
              Shopify Cart Recovery Using AI-Powered Personalization
            </p>
            {/* Testing auto-deploy workflow */}
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#888',
              marginBottom: '50px',
              maxWidth: '700px',
              margin: '0 auto 50px'
            }}>
              Stop losing 70% of your revenue to abandoned carts. Our AI writes personalized recovery emails that convert 3x better than generic templates. Install in 2 minutes.
            </p>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Official Shopify App Store Badge */}
              <ShopifyAppStoreBadge
                variant="preferred"
                appUrl="https://apps.shopify.com/argora-cart-recovery"
                height={70}
              />

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent',
                  border: '2px solid #667eea',
                  padding: '18px 48px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#667eea',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#667eea20'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                See How It Works
              </button>
            </div>

            {/* Social proof */}
            <div style={{ marginTop: '30px', color: '#888', fontSize: '14px' }}>
              🎉 Now Available on Shopify App Store!
            </div>
            <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              ✓ 2-minute setup • ✓ $19.99/month • ✓ 14-day free trial • ✓ Cancel anytime
            </div>
          </div>

          {/* Scroll indicator */}
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
              { number: '70%', label: 'Average Cart Abandonment Rate' },
              { number: '33%', label: 'AI Recovery Rate' },
              { number: '3x', label: 'Better Than Generic Templates' },
              { number: '< 2min', label: 'Setup Time' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
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
              Why Choose Argora Over Generic Tools?
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '20px',
              marginBottom: '60px',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              A Shopify app that uses AI to write personalized recovery emails
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px'
            }}>
              {[
                {
                  icon: '🤖',
                  title: 'AI-Powered Personalization',
                  desc: 'AI generates unique emails for each abandoned cart based on products, customer behavior, and your brand voice. No more robotic templates.'
                },
                {
                  icon: '📧',
                  title: 'Automated Email Sequences',
                  desc: 'Set and forget. Emails sent at 1hr, 24hr, and 72hr after abandonment. Sequence stops automatically when customer completes purchase.'
                },
                {
                  icon: '⚡',
                  title: '2-Minute Setup',
                  desc: 'Install from Shopify App Store. OAuth connects in seconds. Webhooks configured automatically. Start recovering carts immediately.'
                },
                {
                  icon: '📊',
                  title: 'Real-Time Analytics',
                  desc: 'Track recovered revenue, conversion rates, ROI, and email performance. See exactly how much money the app is making you.'
                },
                {
                  icon: '🎨',
                  title: 'Brand Voice Training',
                  desc: 'Tell the AI your brand voice (casual, professional, quirky) and it writes emails that sound authentically you.'
                },
                {
                  icon: '💰',
                  title: 'High ROI',
                  desc: 'Most merchants recover $4,000+ per month in lost sales. At just $19.99/month, the app pays for itself with just one recovered cart.'
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
                    e.currentTarget.style.borderColor = '#667eea'
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
              From cart abandonment to recovered revenue in 4 simple steps
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
              {[
                {
                  step: '01',
                  title: 'Install Shopify App',
                  desc: 'One-click install from Shopify App Store. OAuth connects your store automatically. Takes 2 minutes.'
                },
                {
                  step: '02',
                  title: 'AI Detects Abandonment',
                  desc: 'When a customer abandons their cart, our webhook triggers instantly and AI analyzes the cart data.'
                },
                {
                  step: '03',
                  title: 'Personalized Email Sent',
                  desc: 'AI generates a unique email mentioning specific products, customer name, and creates urgency. Sent via your verified domain.'
                },
                {
                  step: '04',
                  title: 'Revenue Recovered',
                  desc: 'Customer receives email, clicks link, completes purchase. Your dashboard shows real-time recovered revenue and ROI.'
                }
              ].map((item, i) => (
                <div key={i} className="floating" style={{
                  textAlign: 'center',
                  animationDelay: `${i * 0.2}s`
                }}>
                  <div style={{
                    fontSize: '72px',
                    fontWeight: 800,
                    color: '#667eea20',
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

        {/* Why AI Personalization Works */}
        <section style={{ padding: '100px 20px', background: '#0f0f0f' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              marginBottom: '40px'
            }}>
              Why AI Personalization Converts 3x Better
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '40px',
              textAlign: 'left'
            }}>
              {[
                {
                  icon: '📧',
                  title: 'Generic vs. AI-Powered',
                  desc: 'Generic tools send "You left something in your cart" to everyone. Our AI writes unique messages like "Hey Sarah, the Nike Air Max 270 in size 8.5 is selling fast..."'
                },
                {
                  icon: '🎯',
                  title: 'Product-Specific Details',
                  desc: 'AI mentions exact products, features, and creates urgency based on real inventory levels. Customers feel like a human wrote the email.'
                },
                {
                  icon: '⏰',
                  title: 'Perfect Timing',
                  desc: 'First email at 1hr (when intent is hot), follow-ups at 24hr and 72hr. AI adjusts tone for each message in the sequence.'
                },
                {
                  icon: '💰',
                  title: 'Pure Profit',
                  desc: 'Every recovered cart is revenue you were already losing. Zero customer acquisition cost. Just $19.99/month to unlock thousands in recovered sales.'
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
                    e.currentTarget.style.borderColor = '#667eea'
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
              One price, unlimited cart recoveries. No setup fees, no hidden costs.
            </p>

            <div style={{
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {/* Shopify App Pricing */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                border: '3px solid #667eea',
                borderRadius: '20px',
                padding: '50px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#667eea',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  SHOPIFY APP
                </div>

                <div style={{ fontSize: '20px', color: '#667eea', marginBottom: '10px', fontWeight: 600 }}>
                  Pro Plan
                </div>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  $19.99<span style={{ fontSize: '24px', color: '#ccc' }}>/month</span>
                </div>
                <div style={{ fontSize: '16px', color: '#888', marginBottom: '30px' }}>
                  Billed monthly • Cancel anytime • No contracts
                </div>

                <div style={{
                  textAlign: 'left',
                  marginBottom: '30px'
                }}>
                  {[
                    '✓ Unlimited cart recoveries',
                    '✓ AI-powered email generation',
                    '✓ Automated email sequences (1hr, 24hr, 72hr)',
                    '✓ Real-time analytics dashboard',
                    '✓ Brand voice customization',
                    '✓ Email open/click tracking',
                    '✓ Revenue attribution',
                    '✓ Priority support',
                    '✓ 14-day free trial'
                  ].map((feature, i) => (
                    <div key={i} style={{ color: '#ccc', marginBottom: '12px', fontSize: '16px' }}>
                      {feature}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                  <ShopifyAppStoreBadge
                    variant="preferred"
                    appUrl="https://apps.shopify.com/argora-cart-recovery"
                    height={60}
                  />
                </div>

                <div style={{ marginTop: '15px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                  🎉 Now Available - Start your 14-day free trial!
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
                If you're doing $50K/month with 70% cart abandonment and we recover 33%:
              </p>
              <div style={{ fontSize: '48px', fontWeight: 700, color: '#667eea', marginBottom: '10px' }}>
                $11,550/month
              </div>
              <div style={{ color: '#ccc' }}>
                Recovered revenue • That's <span style={{ color: '#667eea', fontWeight: 600 }}>578x ROI</span> on your $19.99 investment
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
              Ready to Recover Lost Revenue?
            </h2>
            <p style={{ fontSize: '20px', color: '#888', marginBottom: '40px' }}>
              Complete AI-powered email marketing for Shopify. Start your 14-day free trial, then $19.99/month.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <ShopifyAppStoreBadge
                variant="preferred"
                appUrl="https://apps.shopify.com/argora-cart-recovery"
                height={70}
              />
            </div>
            <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
              🎉 Now Available on Shopify App Store!
            </div>
            <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              2-minute setup • $19.99/month • 14-day free trial • Cancel anytime
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
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '30px'
            }}>
              ARGORA
            </div>
            {/* Shopify App Store Badge in Footer */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
              <ShopifyAppStoreBadge
                variant="alternative"
                appUrl="https://apps.shopify.com/argora-cart-recovery"
                height={50}
              />
            </div>

            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
              <a href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</a>
              <a href="mailto:adam@argora.ai" style={{ color: '#666', textDecoration: 'none' }}>Contact</a>
            </div>
            <div style={{ color: '#666' }}>
              © 2025 Argora.ai - AI-Powered Cart Recovery for Shopify
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
