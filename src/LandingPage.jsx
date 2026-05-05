import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

// ─── Tokens ──────────────────────────────────────────────────────────────────

const font = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

// ─── FadeIn ──────────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── DashboardMockup ─────────────────────────────────────────────────────────

const mockClients = [
  { initials: 'SM', name: 'Sarah Mitchell',  goal: 'Weight Loss',       last: 'Today',      sessions: 4, status: 'Engaged',  color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
  { initials: 'JO', name: 'James Okafor',    goal: 'Muscle Gain',       last: '5 days ago', sessions: 2, status: 'Drifting', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D' },
  { initials: 'PN', name: 'Priya Nair',      goal: 'Marathon Training', last: 'Yesterday',  sessions: 6, status: 'Engaged',  color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
  { initials: 'TB', name: 'Tom Bergström',   goal: 'General Fitness',   last: '18 days ago',sessions: 1, status: 'At Risk',  color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
]

function DashboardMockup() {
  return (
    <div
      className="lp-mockup"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        fontFamily: '"Inter", system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Browser chrome */}
      <div style={{
        background: '#161618',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: '#222224',
            borderRadius: 6,
            padding: '4px 18px',
            fontSize: 11,
            color: '#52525b',
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="#fff"/>
            </svg>
            app.stopmooing.com/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div style={{ background: '#fafafa' }}>

        {/* App header */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000', animation: 'lp-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#000', letterSpacing: '-0.02em' }}>StopMooing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#a1a1aa' }}>pt@stopmooing.com</span>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, #000 0%, #333 100%)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700,
            }}>LV</div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>

          {/* Page title */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>Client Dashboard</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#a1a1aa' }}>4 active clients · Updated just now</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Total',    value: '8',  sub: 'clients',   color: '#0a0a0a' },
              { label: 'Engaged',  value: '5',  sub: 'on track',  color: '#16A34A' },
              { label: 'Drifting', value: '2',  sub: 'at risk',   color: '#D97706' },
              { label: 'At Risk',  value: '1',  sub: 'critical',  color: '#DC2626' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                background: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <p style={{ margin: 0, fontSize: 8, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 8, color: '#a1a1aa' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Client list */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              padding: '9px 14px',
              borderBottom: '1px solid #f4f4f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#3f3f46', letterSpacing: '-0.01em' }}>All Clients</span>
              <span style={{ fontSize: 9, color: '#a1a1aa' }}>4 of 8 shown</span>
            </div>

            {mockClients.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderBottom: i < mockClients.length - 1 ? '1px solid #f9f9f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#f4f4f5',
                  color: '#52525b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, flexShrink: 0,
                  letterSpacing: '0.02em',
                }}>{c.initials}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#0a0a0a', letterSpacing: '-0.01em' }}>{c.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 8, color: '#a1a1aa' }}>{c.goal} · Last check-in: {c.last}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: '#a1a1aa' }}>{c.sessions} sessions</span>
                  <span style={{
                    fontSize: 8,
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 20,
                    background: c.bg,
                    color: c.color,
                    border: `1px solid ${c.border}`,
                  }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)' }} />
}

// ─── Page ────────────────────────────────────────────────────────────────────

const problemCards = [
  {
    num: '1',
    eyebrow: 'Silent',
    eyebrowColor: '#EF4444',
    accentColor: '#EF4444',
    title: 'The cancellation you never saw coming',
    body: 'A client messages to cancel. No warning. No friction. You thought the relationship was solid. The truth is the signals were there weeks ago. You just had no way to see them.',
  },
  {
    num: '2',
    eyebrow: 'Gradual',
    eyebrowColor: '#F59E0B',
    accentColor: '#F59E0B',
    title: 'The slow fade that costs you thousands',
    body: 'It starts with a skipped check-in. Then slower replies. Then a missed session. Each one feels minor. Together they mean a client who is already mentally gone while you are still planning their next program.',
  },
  {
    num: '3',
    eyebrow: 'Invisible',
    eyebrowColor: '#EF4444',
    accentColor: '#EF4444',
    title: 'The revenue blindspot hiding in plain sight',
    body: 'One unexpected cancellation a month is $2,700 AUD gone every year. Multiply that across your roster and the number gets uncomfortable fast. You cannot stop what you cannot measure.',
  },
]

const featureItems = [
  {
    title: 'Automated weekly check-ins',
    body: 'Each client receives a personalised 60-second check-in link every week. Three questions about training, energy and blockers. You get the signal without lifting a finger.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="14" height="17" rx="2"/>
        <rect x="8" y="2" width="5" height="4" rx="1"/>
        <line x1="6" y1="10" x2="14" y2="10"/>
        <line x1="6" y1="13" x2="14" y2="13"/>
        <line x1="6" y1="16" x2="11" y2="16"/>
      </svg>
    ),
  },
  {
    title: 'Green, amber, red at a glance',
    body: 'Your dashboard scores every client in real time based on their responses and behaviour. Engaged. Drifting. At Risk. You see the full picture before problems become cancellations.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="3" height="7" rx="1"/>
        <rect x="8.5" y="6" width="3" height="13" rx="1"/>
        <rect x="14" y="9" width="3" height="10" rx="1"/>
      </svg>
    ),
  },
  {
    title: 'Alerts before it is too late',
    body: 'The moment a client\'s engagement score drops below your threshold, you are notified immediately. Not next week. Right now. While the relationship is still worth saving.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2 C6.5 2 4 4.5 4 8 L4 13 L2 15 L18 15 L16 13 L16 8 C16 4.5 13.5 2 10 2 Z"/>
        <path d="M8 15 C8 16.1 8.9 17 10 17 C11.1 17 12 16.1 12 15"/>
      </svg>
    ),
  },
]

const statsData = [
  { value: '2 min',    label: 'Average check-in time per client' },
  { value: '94%',      label: 'Response rate from clients' },
  { value: '3x',       label: 'Fewer surprise cancellations' },
  { value: '$600 AUD', label: 'Avg. monthly revenue protected' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: '#09090b', fontFamily: font, color: '#fff', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(9,9,11,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto', padding: '0 32px',
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>StopMooing</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/login" className="lp-header-signin">Sign in</Link>
            <Link to="/signup" className="lp-header-btn">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '140px 32px 100px',
        maxWidth: 1120,
        margin: '0 auto',
      }}
        className="lp-hero-pad"
      >
        {/* Live indicator */}
        <div className="lp-hero-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px 5px 8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'lp-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 500, letterSpacing: '0.02em' }}>Client Retention for Personal Trainers</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="lp-hero-grid">

          {/* Copy */}
          <div>
            <h1 style={{ margin: '0 0 24px', lineHeight: 1.04, letterSpacing: '-0.04em' }}>
              <span
                className="lp-hero-line-1"
                style={{
                  display: 'block',
                  fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                Stop losing
              </span>
              <span
                className="lp-hero-line-2"
                style={{
                  display: 'block',
                  fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#52525b',
                }}
              >
                clients you never
              </span>
              <span
                className="lp-hero-line-1"
                style={{
                  display: 'block',
                  fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                saw coming.
              </span>
            </h1>

            <p className="lp-hero-sub" style={{
              margin: '0 0 40px',
              color: '#71717a',
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 460,
            }}>
              StopMooing spots disengaged clients weeks before they cancel. Weekly check-ins. Real-time alerts. Your income, protected.
            </p>

            <div className="lp-hero-cta" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/signup" className="lp-btn-primary">
                Start for free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/login" className="lp-btn-secondary">Sign in</Link>
            </div>

            <p style={{ margin: '20px 0 0', fontSize: 13, color: '#3f3f46' }}>Free to start · No credit card required</p>
          </div>

          {/* Mockup */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -40,
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <DashboardMockup />
          </div>

        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{
        backgroundColor: '#0A0A0A',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 48,
        paddingRight: 48,
        width: '100%',
      }} className="lp-statsbar-section">
        <div className="lp-statsbar-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {statsData.map(({ value, label }, i) => (
            <div
              key={i}
              className={`lp-stat-item${i < 3 ? ' lp-stat-border' : ''}`}
              style={{ paddingLeft: i === 0 ? 0 : 40, paddingRight: 40 }}
            >
              <span style={{ fontSize: 44, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1, display: 'block', marginBottom: 8 }}>{value}</span>
              <span style={{ fontSize: 13, color: '#52525B', fontWeight: 400, lineHeight: 1.5, display: 'block' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="lp-problem-section" style={{ backgroundColor: '#000000', paddingTop: 160, paddingBottom: 160, paddingLeft: 48, paddingRight: 48, width: '100%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#3F3F46', display: 'block', marginBottom: 24 }}>
              The Problem
            </span>
            <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#FFFFFF', maxWidth: 640, margin: '0 0 24px' }}>
              Every PT knows this feeling.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 400, color: '#71717A', lineHeight: 1.75, maxWidth: 480, margin: '0 0 80px' }}>
              The signs are always there. You just never had a way to see them.
            </p>
          </FadeIn>

          <div className="lp-problem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {problemCards.map((card, i) => (
              <FadeIn key={card.num} delay={i * 80}>
                <div className="lp-problem-card" style={{
                  backgroundColor: '#0A0A0A',
                  paddingTop: 48,
                  paddingBottom: 48,
                  paddingLeft: 40,
                  paddingRight: 40,
                  position: 'relative',
                  overflow: 'hidden',
                  borderTop: `2px solid ${card.accentColor}`,
                  transition: 'background-color 200ms ease',
                  height: '100%',
                  boxSizing: 'border-box',
                }}>
                  <span style={{ position: 'absolute', bottom: -24, right: 24, fontSize: '10rem', fontWeight: 900, lineHeight: 1, color: 'rgba(255,255,255,0.03)', zIndex: 0, userSelect: 'none', pointerEvents: 'none' }}>{card.num}</span>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20, display: 'block', color: card.eyebrowColor }}>{card.eyebrow}</span>
                    <p style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{card.title}</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: '#71717A', lineHeight: 1.75 }}>{card.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="lp-solution-section" style={{ backgroundColor: '#000000', paddingTop: 160, paddingBottom: 160, paddingLeft: 48, paddingRight: 48, width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#3F3F46', display: 'block', marginBottom: 24 }}>
              The Solution
            </span>
            <h2 style={{ fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#FFFFFF', maxWidth: 700, margin: '0 0 24px' }}>
              Know exactly who needs you before it is too late.
            </h2>
            <p style={{ fontSize: 18, fontWeight: 400, color: '#71717A', lineHeight: 1.75, maxWidth: 520, margin: '0 0 96px' }}>
              StopMooing runs quietly in the background. Watching engagement. Scoring behaviour. Alerting you at exactly the right moment while there is still time to act.
            </p>
          </FadeIn>

          <div className="lp-solution-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 48 }}>
            {featureItems.map((feature, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexShrink: 0 }}>
                    {feature.icon}
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{feature.title}</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: '#71717A', lineHeight: 1.75 }}>{feature.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#09090b', padding: '160px 32px', textAlign: 'center' }} className="lp-section-pad">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#52525b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Get started today
            </p>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.04em',
              lineHeight: 1.04,
            }}>
              Ready to stop the churn?
            </h2>
            <p style={{ margin: '0 0 48px', fontSize: 18, color: '#52525b', lineHeight: 1.6 }}>
              Join personal trainers using StopMooing to protect their income.
            </p>
            <Link to="/signup" className="lp-cta-btn">
              Create your free account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <p style={{ margin: '20px 0 0', fontSize: 13, color: '#3f3f46' }}>Free to start · No credit card required</p>
          </FadeIn>
        </div>
      </section>

      <Divider />

      {/* ── Footer ── */}
      <footer style={{ background: '#09090b', padding: '32px 32px' }}>
        <div
          style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          className="lp-footer-inner"
        >
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#fff' }}>StopMooing</span>
          <p style={{ margin: 0, fontSize: 13, color: '#3f3f46' }}>Built for personal trainers.</p>
        </div>
      </footer>

    </div>
  )
}
