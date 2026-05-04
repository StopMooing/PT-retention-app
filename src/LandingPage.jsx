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

const problems = [
  {
    num: '01',
    title: 'The silent cancellation',
    desc: 'A client cancels out of nowhere. No warning signs. No chance to intervene.',
  },
  {
    num: '02',
    title: 'The communication drop-off',
    desc: "Messages slow down. Check-ins get ignored. By the time you notice, they're already halfway out.",
  },
  {
    num: '03',
    title: 'The revenue blindspot',
    desc: "You don't know which clients are at risk until they're gone. Every cancellation is a surprise.",
  },
]

const solutions = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 5.67a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 11.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    title: 'Automated weekly check-ins',
    desc: 'Each client gets a personal 60-second check-in link. Three questions. You get the signal.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Green, amber, red at a glance',
    desc: 'Your dashboard updates in real time. No spreadsheets. No guessing. Just clarity.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
    title: "Alerts before it's too late",
    desc: 'The moment a client starts drifting, you know. Reach out and save the relationship.',
  },
]

const stats = [
  { value: '2 min', label: 'Average check-in time per client' },
  { value: '94%',  label: 'Response rate from clients' },
  { value: '3×',   label: 'Fewer surprise cancellations' },
  { value: '£400', label: 'Avg. monthly revenue saved' },
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

      <Divider />

      {/* ── Stats ── */}
      <section style={{ padding: '80px 32px' }} className="lp-section-pad">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}
            className="lp-stats-grid"
          >
            {stats.map(({ value, label }, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div style={{ background: '#09090b', padding: '36px 32px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 'clamp(2rem, 3vw, 2.75rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#52525b', lineHeight: 1.5 }}>{label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Problem ── */}
      <section style={{ background: '#09090b', padding: '120px 32px' }} className="lp-section-pad">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#52525b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              The Problem
            </p>
            <h2 style={{
              margin: '0 0 72px',
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
            }}>
              Every PT knows this feeling.
            </h2>
          </FadeIn>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}
            className="lp-problem-grid"
          >
            {problems.map((p, i) => (
              <FadeIn key={p.num} delay={i * 80}>
                <div style={{ background: '#09090b', padding: '40px 36px', height: '100%' }}>
                  <p style={{ margin: '0 0 24px', fontSize: 42, fontWeight: 900, color: 'rgba(255,255,255,0.06)', letterSpacing: '-0.05em', lineHeight: 1 }}>{p.num}</p>
                  <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#52525b', lineHeight: 1.7 }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Solution ── */}
      <section style={{ background: '#09090b', padding: '120px 32px' }} className="lp-section-pad">
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <FadeIn>
            <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#52525b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              The Solution
            </p>
            <h2 style={{
              margin: '0 0 80px',
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              maxWidth: 640,
            }}>
              Know who needs you —<br />before it's too late.
            </h2>
          </FadeIn>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}
            className="lp-solution-grid"
          >
            {solutions.map((s, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 28 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#a1a1aa',
                    marginBottom: 20,
                  }}>
                    {s.icon}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{s.title}</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#52525b', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <Divider />

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
