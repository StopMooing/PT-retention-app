import { useState } from 'react'
import { Dumbbell, ClipboardCheck, Utensils, BarChart2, CreditCard, TrendingUp, CheckCircle2, ChevronRight, Sparkles, Mic, Brain, Zap, Users, Calendar, Heart, Shield, ArrowRight, Play, Star } from 'lucide-react'

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [email2, setEmail2] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="scroll-smooth font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .fade-in-up   { animation: fadeInUp 0.7s ease forwards; }
        .fade-in-up-1 { animation: fadeInUp 0.7s ease 0.1s forwards; opacity: 0; }
        .fade-in-up-2 { animation: fadeInUp 0.7s ease 0.2s forwards; opacity: 0; }
        .fade-in-up-3 { animation: fadeInUp 0.7s ease 0.3s forwards; opacity: 0; }
        .fade-in-up-4 { animation: fadeInUp 0.7s ease 0.4s forwards; opacity: 0; }

        .ticker-track { animation: ticker 28s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        .float-card { animation: float 4s ease-in-out infinite; }
        .float-card-2 { animation: float 4s ease-in-out 1s infinite; }

        .pulse-dot { animation: pulse-ring 2s ease-in-out infinite; }

        .hero-gradient {
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.12) 0%, transparent 60%),
                      #0a0a0a;
        }

        .section-light { background: #f8f9fa; }
        .section-white { background: #ffffff; }
        .section-dark  { background: #0a0a0a; }

        .feature-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.08);
        }

        .gradient-text {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ai-glow {
          box-shadow: 0 0 0 1px rgba(16,185,129,0.3), 0 8px 32px rgba(16,185,129,0.15);
        }

        .nav-blur {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      {/* ─── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur bg-black/85 border-b border-white/[0.08] h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">PT Blueprint</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">Features</a>
            <a href="#ai" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">AI Tools</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">How it works</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/auth" className="hidden md:inline text-zinc-400 hover:text-white text-sm font-medium transition-colors">Sign in</a>
            <a href="/auth" className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-150 text-sm px-4 py-2 shadow-lg shadow-emerald-500/25">
              Get started free →
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="hero-gradient pt-16 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full fade-in-up mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                Now in beta — join 500+ personal trainers
              </div>

              <h1 className="fade-in-up-1">
                <span className="block text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">More clients.</span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">Less admin.</span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight gradient-text">Better results.</span>
              </h1>

              <p className="mt-8 text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-xl fade-in-up-2">
                Programs. Nutrition. Habits. Check-ins. Payments. And AI that works alongside you — not instead of you. One platform to run and grow your entire coaching business.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 fade-in-up-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/[0.07] border border-white/20 text-white placeholder-zinc-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-80"
                />
                <a href="/auth" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all duration-150 shadow-lg shadow-emerald-500/30 px-6 py-3 text-sm text-center whitespace-nowrap">
                  Start for free →
                </a>
              </div>
              <p className="mt-3 text-zinc-600 text-xs fade-in-up-3">Free to start · No credit card required · Cancel anytime</p>

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-6 fade-in-up-4">
                {[
                  { num: '500+', label: 'Personal trainers' },
                  { num: '2 min', label: 'Avg check-in time' },
                  { num: '3x', label: 'Fewer cancellations' },
                  { num: '$600', label: 'Revenue protected/mo' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-2xl sm:text-3xl font-black text-white">{s.num}</div>
                    <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hidden lg:block relative fade-in-up-2 mt-12">
              {/* Main card */}
              <div className="bg-zinc-900/90 border border-white/[0.1] rounded-2xl p-5 shadow-[0_32px_80px_rgba(0,0,0,0.6)] float-card">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-white font-bold text-sm">PT Blueprint</div>
                    <div className="text-zinc-500 text-xs mt-0.5">Client Dashboard</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                    <span className="text-emerald-400 text-xs font-medium">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { num: '12', label: 'Total', colour: 'text-white' },
                    { num: '8',  label: 'Engaged', colour: 'text-emerald-400' },
                    { num: '3',  label: 'Drifting', colour: 'text-amber-400' },
                    { num: '1',  label: 'At Risk', colour: 'text-red-400' },
                  ].map(t => (
                    <div key={t.label} className="bg-black/40 rounded-xl p-3 text-center">
                      <div className={`text-xl font-black ${t.colour}`}>{t.num}</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">{t.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {[
                    { init: 'SM', name: 'Sarah Mitchell', goal: 'Weight loss', bg: 'bg-blue-600',    status: 'Engaged', badge: 'bg-emerald-500/20 text-emerald-400' },
                    { init: 'JO', name: 'James Okafor',   goal: 'Muscle gain', bg: 'bg-purple-600',  status: 'Drifting', badge: 'bg-amber-500/20 text-amber-400' },
                    { init: 'PN', name: 'Priya Nair',     goal: 'Marathon',    bg: 'bg-emerald-600', status: 'Engaged', badge: 'bg-emerald-500/20 text-emerald-400' },
                    { init: 'TB', name: 'Tom Bergström',  goal: 'Fitness',     bg: 'bg-orange-600',  status: 'At Risk', badge: 'bg-red-500/20 text-red-400' },
                  ].map(c => (
                    <div key={c.name} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${c.bg}`}>{c.init}</div>
                        <div>
                          <div className="text-white text-xs font-semibold">{c.name}</div>
                          <div className="text-zinc-500 text-[10px]">{c.goal}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating alert */}
              <div className="absolute -top-3 right-4 bg-zinc-800 border border-white/[0.12] rounded-xl px-4 py-3 shadow-2xl float-card-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔔</span>
                  <span className="text-white text-xs font-bold">Tom needs attention</span>
                </div>
                <div className="text-zinc-500 text-[10px] mt-0.5">Last check-in: 18 days ago</div>
              </div>

              {/* AI badge */}
              <div className="absolute -bottom-3 left-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 shadow-2xl ai-glow z-10">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-bold">AI check-in summary ready</span>
                </div>
                <div className="text-zinc-500 text-[10px] mt-0.5">James Okafor · reviewed just now</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── TICKER ───────────────────────────────────────────── */}
      <div className="bg-emerald-500 py-3 overflow-hidden">
        <div className="ticker-track flex gap-12 whitespace-nowrap w-max">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              {[
                'Training Programs', 'Client Check-ins', 'Nutrition Tracking',
                'Habit Coaching', 'AI-Powered Tools', 'Progress Analytics',
                'Automated Alerts', 'Payment Processing', 'Voice Commands',
              ].map(item => (
                <span key={item} className="text-white font-semibold text-sm flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── AI FEATURE SECTION ───────────────────────────────── */}
      <section id="ai" className="section-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
              <Sparkles size={12} />
              AI-Powered Coaching
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Your expertise.<br />
              <span className="gradient-text">Amplified by AI.</span>
            </h2>
            <p className="mt-5 text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
              PT Blueprint's AI works quietly in the background — drafting programs, suggesting meal plans, running check-ins. You review, personalise, and send. Your coaching, your relationships, your brand. Just faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain size={24} className="text-emerald-600" />,
                bg: "bg-emerald-50",
                tag: "For Coaches",
                title: "AI Program & Plan Generation",
                desc: "Tell the AI your client's goals, training history and equipment — it drafts a full program or meal plan in seconds. You review it, adjust it, make it yours, then send.",
                bullets: [
                  "Generate structured multi-week programs",
                  "Create macro-specific meal plans instantly",
                  "AI learns your coaching style over time",
                ],
              },
              {
                icon: <ClipboardCheck size={24} className="text-blue-600" />,
                bg: "bg-blue-50",
                tag: "For Coaches",
                title: "Intelligent Check-in Summaries",
                desc: "When a client completes a check-in, AI reads the responses, flags anything important, and sends you a plain-English summary — so you never miss a thing, even when you're slammed.",
                bullets: [
                  "Automated weekly check-in conversations",
                  "AI summarises key themes and concerns",
                  "Instant alerts for at-risk clients",
                ],
              },
              {
                icon: <Mic size={24} className="text-purple-600" />,
                bg: "bg-purple-50",
                tag: "For Clients",
                title: "Voice-First Client Experience",
                desc: "Your clients speak, PT Blueprint listens. Ask for a workout, a meal idea, or nutrition advice — and get a personalised answer in seconds. Coaching available to them around the clock.",
                bullets: [
                  '"Give me a high protein lunch under 600 cal"',
                  '"I need a 30 minute upper body workout"',
                  "All within your branded platform",
                ],
              },
            ].map(card => (
              <div key={card.title} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm feature-card">
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-5`}>
                  {card.icon}
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.tag}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2 leading-snug">{card.title}</h3>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">{card.desc}</p>
                <ul className="mt-5 space-y-2">
                  {card.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 1 — RETENTION (dark) ─────────────── */}
      <section id="features" className="section-dark py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
                Client Retention
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Know exactly who needs you before it's too late.
              </h2>
              <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
                PT Blueprint watches your entire client roster in real time. The moment someone starts going quiet — fewer check-ins, missed sessions, reduced engagement — you know about it before they even think about cancelling.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Automated weekly check-in links — no chasing required',
                  'Green, amber, red status on every client at a glance',
                  'Instant alerts the moment a client goes At Risk',
                  'Full check-in history stored per client forever',
                  'AI summarises each check-in so you can act fast',
                ].map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 size={17} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-zinc-300 text-sm leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:block">
              <div className="bg-zinc-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-white font-bold text-sm">Client Dashboard</div>
                    <div className="text-zinc-500 text-xs mt-0.5">Updated just now</div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { l: '12 Total', c: 'bg-white/10 text-zinc-300' },
                      { l: '8 Engaged', c: 'bg-emerald-500/20 text-emerald-400' },
                      { l: '3 Drifting', c: 'bg-amber-500/20 text-amber-400' },
                      { l: '1 At Risk', c: 'bg-red-500/20 text-red-400' },
                    ].map(p => (
                      <span key={p.l} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.c}`}>{p.l}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { init: 'SM', name: 'Sarah Mitchell', goal: 'Weight Loss',     bg: 'bg-blue-600',    status: 'Engaged', badge: 'bg-emerald-500/20 text-emerald-400' },
                    { init: 'JO', name: 'James Okafor',   goal: 'Muscle Gain',     bg: 'bg-purple-600',  status: 'Drifting', badge: 'bg-amber-500/20 text-amber-400' },
                    { init: 'PN', name: 'Priya Nair',     goal: 'Marathon',        bg: 'bg-emerald-600', status: 'Engaged', badge: 'bg-emerald-500/20 text-emerald-400' },
                    { init: 'TB', name: 'Tom Bergström',  goal: 'General Fitness', bg: 'bg-orange-600',  status: 'At Risk', badge: 'bg-red-500/20 text-red-400' },
                  ].map(c => (
                    <div key={c.name} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.bg}`}>{c.init}</div>
                        <div>
                          <div className="text-white text-sm font-semibold">{c.name}</div>
                          <div className="text-zinc-500 text-xs">{c.goal}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${c.badge}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 2 — PROGRAMS (light) ─────────────── */}
      <section className="section-light py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="hidden lg:block lg:order-1">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-200/60">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-gray-900 font-bold text-sm">Program Builder</span>
                  <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg">
                    <Sparkles size={11} />
                    AI Draft
                  </span>
                </div>

                <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4 mb-4">
                  <div className="text-gray-900 font-bold text-sm">6 Week Strength Block</div>
                  <div className="text-gray-500 text-xs mt-0.5">3 days · Upper / Lower / Full Body</div>
                </div>

                <div className="space-y-2">
                  {[
                    { n: 1, name: 'Bench Press',    muscle: 'Chest',     colour: 'bg-blue-100 text-blue-700',    sets: '4 × 6-10 reps' },
                    { n: 2, name: 'Barbell Row',    muscle: 'Back',      colour: 'bg-purple-100 text-purple-700', sets: '3 × 8-12 reps' },
                    { n: 3, name: 'Shoulder Press', muscle: 'Shoulders', colour: 'bg-amber-100 text-amber-700',   sets: '3 × 8-12 reps' },
                    { n: 4, name: 'Squat',          muscle: 'Legs',      colour: 'bg-indigo-100 text-indigo-700', sets: '4 × 6-8 reps' },
                  ].map(e => (
                    <div key={e.n} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0">{e.n}</div>
                      <span className="text-gray-900 text-sm font-semibold flex-1">{e.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.colour}`}>{e.muscle}</span>
                      <span className="text-gray-400 text-xs">{e.sets}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:order-2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
                Program Builder
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Build world-class programs. In minutes, not hours.
              </h2>
              <p className="mt-6 text-gray-500 text-lg leading-relaxed">
                A full exercise library, structured program builder, and AI that drafts programs based on your client's goals. You refine it, assign it, and your client logs every set directly in the app.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Build structured multi-day, multi-week programs',
                  'Full exercise library with muscle group tagging',
                  'AI drafts a program from your brief in seconds',
                  'Assign to any client with one click',
                  'Clients log sets, reps and weights from their own view',
                  'Track progress and personal bests over time',
                ].map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 size={17} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600 text-sm leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 3 — NUTRITION (dark) ─────────────── */}
      <section className="section-dark py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
                Nutrition & Habits
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Coach the whole person, not just the workout.
              </h2>
              <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
                Meal plans. Macro targets. Daily habit tracking. Water intake. Full food logging. PT Blueprint gives your clients the structure to build lasting change — and gives you the visibility to coach them on all of it.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Create and assign custom meal plans per client',
                  'Set daily macro, calorie and water targets',
                  'Daily habit tracking with streak counters and compliance scores',
                  'Clients log food, workouts and water from their app',
                  'Full nutrition history and trend charts visible on your dashboard',
                ].map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 size={17} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-zinc-300 text-sm leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:block">
              <div className="bg-zinc-900 border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-white font-bold text-sm">Today's Summary</span>
                  <span className="text-zinc-500 text-xs">Sunday 17 May</span>
                </div>

                {/* Calorie ring */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="188 251" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-black text-white leading-none">1502</span>
                      <span className="text-[9px] text-zinc-500">kcal</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {[
                      { label: 'Protein', cur: 142, max: 180, colour: 'bg-red-500',    pct: 79 },
                      { label: 'Carbs',   cur: 180, max: 250, colour: 'bg-yellow-500', pct: 72 },
                      { label: 'Fats',    cur: 52,  max: 70,  colour: 'bg-blue-500',   pct: 74 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400 text-xs">{m.label}</span>
                          <span className="text-zinc-400 text-xs">{m.cur}g / {m.max}g</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.colour}`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habits */}
                <div className="border-t border-white/[0.06] pt-4">
                  <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-3">Today's Habits</div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Morning workout', streak: '🔥 7 day streak', filled: 6 },
                      { name: 'Hit protein target', streak: '🔥 5 day streak', filled: 5 },
                      { name: 'Drink 3L water', streak: '🔥 7 day streak', filled: 7 },
                    ].map(h => (
                      <div key={h.name} className="flex items-center justify-between">
                        <div>
                          <div className="text-zinc-300 text-xs font-medium">{h.name}</div>
                          <div className="text-zinc-600 text-[10px] mt-0.5">{h.streak}</div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full ${i < h.filled ? 'bg-emerald-500' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (light) ────────────────────────────── */}
      <section id="how-it-works" className="section-light py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
              How It Works
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Set up in minutes.<br />Results from day one.
            </h2>
            <p className="mt-5 text-gray-500 text-lg max-w-xl mx-auto">
              No complicated onboarding. No technical knowledge needed. Just add your clients and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            <div className="hidden sm:block absolute top-[2.75rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent pointer-events-none" />
            {[
              {
                num: '01',
                icon: <Users size={22} className="text-emerald-600" />,
                heading: 'Add your clients',
                desc: 'Sign up and build your client roster in minutes. Every client gets a dedicated profile — goals, programs, nutrition, habits and check-ins all in one place.',
              },
              {
                num: '02',
                icon: <Sparkles size={22} className="text-emerald-600" />,
                heading: 'Coach smarter with AI',
                desc: "AI is your behind-the-scenes assistant. Draft a program, get a head start on a meal plan, or run a check-in when you're flat out — then review, personalise and send it your way. Your expertise, amplified.",
              },
              {
                num: '03',
                icon: <TrendingUp size={22} className="text-emerald-600" />,
                heading: 'Build a business that retains',
                desc: "Know exactly which clients need your attention before it's too late. Automated alerts, check-in summaries and full progress visibility mean you're always one step ahead.",
              },
            ].map((s, i) => (
              <div key={s.num} className="bg-white border border-gray-200 rounded-2xl p-8 feature-card relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center ring-4 ring-white">
                    {s.icon}
                  </div>
                  <span className="text-6xl font-black text-emerald-50">{s.num}</span>
                </div>
                <h3 className="text-gray-900 font-bold text-xl">{s.heading}</h3>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF — STATS + STACK ───────────────────── */}
      <section className="section-white py-20 lg:py-24 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Built for coaches who mean business
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">PT Blueprint replaces the tools you're already paying for — at a fraction of the cost</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { num: '500+',  label: 'Personal trainers',         sub: 'and growing every week'         },
              { num: '3x',    label: 'Fewer cancellations',       sub: 'vs platforms with no AI alerts' },
              { num: '2 min', label: 'Average check-in time',     sub: 'down from 15+ minutes manually' },
              { num: '$600+', label: 'Revenue protected monthly', sub: 'per coach on average'            },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center feature-card">
                <div className="text-4xl font-black text-gray-900">{s.num}</div>
                <div className="text-sm font-bold text-gray-700 mt-2">{s.label}</div>
                <div className="text-xs text-gray-400 mt-1 leading-snug">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
                  Replace your entire stack
                </div>
                <h3 className="text-3xl font-black text-white leading-tight">
                  One tool.<br />Everything covered.
                </h3>
                <p className="text-zinc-400 text-base mt-4 leading-relaxed">
                  Most PTs are paying for 4–5 separate tools that don't talk to each other. PT Blueprint replaces all of them — and adds AI on top.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { tool: 'Program builder',       replaced: 'Trainerize / Google Docs'    },
                  { tool: 'Nutrition tracking',    replaced: 'MyFitnessPal / spreadsheets' },
                  { tool: 'Client check-ins',      replaced: 'Manual emails / WhatsApp'    },
                  { tool: 'Habit coaching',        replaced: 'Separate habit apps'         },
                  { tool: 'AI program drafting',   replaced: 'Not available elsewhere'     },
                  { tool: 'Voice client coaching', replaced: 'Not available elsewhere'     },
                ].map(r => (
                  <div key={r.tool} className="flex items-center justify-between bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span className="text-white text-sm font-semibold">{r.tool}</span>
                    </div>
                    <span className="text-zinc-500 text-xs">replaces {r.replaced}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="section-light py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5">
              Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Simple pricing. No surprises.</h2>
            <p className="mt-4 text-gray-500 text-lg">One subscription replaces 4–5 separate tools. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">

            {/* Starter */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col shadow-sm">
              <div className="text-gray-900 font-black text-2xl">Starter</div>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-6xl font-black text-gray-900">$49</span>
                <span className="text-gray-400 text-base pb-2">/month</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Perfect for PTs building their foundation</p>
              <div className="border-t border-gray-100 my-6" />
              <ul className="space-y-3 flex-1">
                {[
                  'Up to 10 clients',
                  'Check-in system with automated links',
                  'Program builder and exercise library',
                  'Client workout logging',
                  'Nutrition and habit tracking',
                  'Basic AI drafting tools',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth" className="mt-8 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-3 text-sm font-bold text-center block w-full transition-all">
                Get started free
              </a>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-gray-900/30">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1 rounded-full mb-4 w-fit">Most Popular</span>
              <div className="text-white font-black text-2xl">Pro</div>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-6xl font-black text-white">$99</span>
                <span className="text-zinc-500 text-base pb-2">/month</span>
              </div>
              <p className="text-zinc-400 text-sm mt-2">For serious PTs ready to scale their business</p>
              <div className="border-t border-white/[0.08] my-6" />
              <ul className="space-y-3 flex-1">
                {[
                  'Unlimited clients',
                  'Everything in Starter',
                  'Full AI program & meal plan generation',
                  'Voice-powered client experience',
                  'AI check-in summaries',
                  'Automated email alerts for at-risk clients',
                  'Payments integration',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span className="text-zinc-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth" className="mt-8 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl py-3 text-sm text-center block w-full transition-all shadow-lg shadow-emerald-500/25">
                Start free trial →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FINAL CTA (dark) ────────────────────────────────── */}
      <section className="section-dark py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/[0.06] rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/[0.04] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
            <Zap size={12} />
            Start today — it's free
          </div>
          <h2 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Ready to build a PT business that lasts?
          </h2>
          <p className="mt-6 text-zinc-400 text-xl leading-relaxed max-w-xl mx-auto">
            Join hundreds of personal trainers using PT Blueprint to coach better, retain more clients, and grow a business they're proud of.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email2}
              onChange={e => setEmail2(e.target.value)}
              className="bg-white/[0.07] border border-white/20 text-white placeholder-zinc-500 rounded-lg px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-80"
            />
            <a href="/auth" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-lg transition-all shadow-lg shadow-emerald-500/25 text-sm whitespace-nowrap">
              Get started free →
            </a>
          </div>
          <p className="text-zinc-600 text-xs mt-4">Free to start · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/[0.06] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-12">

            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-black text-xs">P</span>
                </div>
                <span className="text-white font-bold text-base">PT Blueprint</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                The complete coaching platform built to help personal trainers run, grow and retain their business — online or in person.
              </p>
            </div>

            <div>
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Platform</div>
              <div className="space-y-3">
                {['Features', 'AI Tools', 'Pricing', 'How it works'].map(l => (
                  <a key={l} href="#" className="block text-zinc-500 hover:text-white text-sm transition-colors">{l}</a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Account</div>
              <div className="space-y-3">
                {[
                  { label: 'Sign in', href: '/auth' },
                  { label: 'Get started', href: '/auth' },
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                ].map(l => (
                  <a key={l.label} href={l.href} className="block text-zinc-500 hover:text-white text-sm transition-colors">{l.label}</a>
                ))}
              </div>
            </div>

          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-600 text-xs">© 2026 PT Blueprint. All rights reserved.</span>
            <span className="text-zinc-600 text-xs">Built for personal trainers who mean business.</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
