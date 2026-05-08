import { Dumbbell, ClipboardCheck, Utensils, BarChart2, CreditCard, TrendingUp, CheckCircle2, ChevronRight, Menu, X } from 'lucide-react'

export default function LandingPage() {

  return (
    <div className="scroll-smooth" style={{ backgroundColor: '#0a0a0a' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeInUp 0.6s ease forwards; }
        .fade-in-delay-1 { animation: fadeInUp 0.6s ease 0.1s forwards; opacity: 0; }
        .fade-in-delay-2 { animation: fadeInUp 0.6s ease 0.2s forwards; opacity: 0; }
        .fade-in-delay-3 { animation: fadeInUp 0.6s ease 0.3s forwards; opacity: 0; }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
          <span className="text-white font-bold text-xl tracking-tight">StopMooing</span>
          <div className="flex items-center">
            <a href="/auth" className="hidden md:inline text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-150 mr-3">Sign in</a>
            <a href="/auth" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-green-900/30 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2">Get started →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen pt-16 flex items-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left */}
            <div className="fade-in">
              <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Now in beta — join 500+ personal trainers
              </span>

              <h1 className="mt-6">
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">Run Your Entire</span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">PT Business</span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-green-500 leading-none tracking-tight">From One Place.</span>
              </h1>

              <p className="mt-6 text-zinc-400 text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg">
                Training programs. Check-ins. Nutrition. Habit coaching. Payments. One platform that replaces everything.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/10 border border-white/20 text-white placeholder-zinc-500 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-72"
                />
                <a href="/auth" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-green-900/30 px-6 py-3 text-sm w-full sm:w-auto text-center">Start for free →</a>
              </div>
              <p className="mt-3 text-zinc-500 text-xs">Free to start · No credit card required · Cancel anytime</p>

              <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { num: '500+', label: 'Personal trainers' },
                  { num: '2 min', label: 'Avg check-in time' },
                  { num: '3x', label: 'Fewer cancellations' },
                  { num: '$600 AUD', label: 'Revenue protected monthly' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-3xl font-black text-white">{s.num}</span>
                    <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hidden lg:block relative fade-in-delay-1">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-sm">StopMooing</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    <span className="text-green-500 text-xs font-medium">Live</span>
                  </span>
                </div>

                {/* 2x2 stat tiles */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { num: '8', label: 'Total clients', color: 'text-white' },
                    { num: '5', label: 'Engaged', color: 'text-green-500' },
                    { num: '2', label: 'Drifting', color: 'text-yellow-500' },
                    { num: '1', label: 'At Risk', color: 'text-red-500' },
                  ].map((t) => (
                    <div key={t.label} className="bg-black/40 rounded-xl p-3">
                      <div className={`text-2xl font-black ${t.color}`}>{t.num}</div>
                      <div className="text-zinc-500 text-xs">{t.label}</div>
                    </div>
                  ))}
                </div>

                {/* Client rows */}
                <div className="space-y-2">
                  {[
                    { init: 'SM', name: 'Sarah Mitchell', bg: 'bg-blue-600', status: 'Engaged', badge: 'bg-green-600/20 text-green-400' },
                    { init: 'JO', name: 'James Okafor', bg: 'bg-purple-600', status: 'Drifting', badge: 'bg-yellow-600/20 text-yellow-400' },
                    { init: 'PN', name: 'Priya Nair', bg: 'bg-emerald-600', status: 'Engaged', badge: 'bg-green-600/20 text-green-400' },
                    { init: 'TB', name: 'Tom Bergström', bg: 'bg-orange-600', status: 'At Risk', badge: 'bg-red-600/20 text-red-400' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.bg}`}>{c.init}</div>
                        <span className="text-white text-xs font-medium">{c.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating alert */}
              <div className="absolute -top-4 -right-6 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-sm">🔔</span>
                  <span className="text-white text-xs font-semibold">Tom is at risk</span>
                </div>
                <div className="text-zinc-500 text-xs mt-0.5">Last check-in: 18 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE ICON STRIP */}
      <section className="bg-white/[0.03] border-y border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { icon: <Dumbbell size={18} />, label: 'Training Programs' },
            { icon: <ClipboardCheck size={18} />, label: 'Client Check-ins' },
            { icon: <Utensils size={18} />, label: 'Nutrition Tracking' },
            { icon: <BarChart2 size={18} />, label: 'Habit Coaching' },
            { icon: <CreditCard size={18} />, label: 'Payments' },
            { icon: <TrendingUp size={18} />, label: 'Progress Analytics' },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-center gap-2.5">
              <span className="text-green-500">{f.icon}</span>
              <span className="text-zinc-400 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE BLOCK 1 — RETENTION */}
      <section style={{ backgroundColor: '#0a0a0a' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto px-6 py-16 lg:py-32">
          {/* Left — text */}
          <div className="fade-in">
            <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20">
              Client Retention
            </span>
            <h2 className="mt-5 text-4xl font-bold text-white leading-tight tracking-tight">
              Know exactly who needs you before it's too late.
            </h2>
            <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
              StopMooing watches your entire client roster around the clock. Automated weekly check-ins. Real-time engagement scoring. Instant alerts the moment someone starts drifting — while there's still time to save the relationship.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Automated weekly check-in links sent to every client — no manual work',
                'Green, amber, red engagement status visible at a glance on your dashboard',
                'Instant email alerts the moment a client\'s score drops to At Risk',
                'Full check-in response history stored per client forever',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-zinc-300 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — mockup */}
          <div className="hidden lg:block fade-in-delay-1">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div>
                <div className="text-white font-semibold text-sm">Client Dashboard</div>
                <div className="text-zinc-500 text-xs mt-0.5">4 active clients · Updated just now</div>
              </div>

              <div className="flex gap-2 mt-4">
                {[
                  { label: '8 Total', cls: 'bg-white/10 text-zinc-300' },
                  { label: '5 Engaged', cls: 'bg-green-600/20 text-green-400' },
                  { label: '2 Drifting', cls: 'bg-yellow-600/20 text-yellow-400' },
                  { label: '1 At Risk', cls: 'bg-red-600/20 text-red-400' },
                ].map((p) => (
                  <span key={p.label} className={`text-xs font-semibold px-3 py-1 rounded-full ${p.cls}`}>{p.label}</span>
                ))}
              </div>

              <div className="mt-5 space-y-1">
                {[
                  { name: 'Sarah Mitchell', init: 'SM', bg: 'bg-blue-600', goal: 'Weight Loss', status: 'Engaged', badge: 'bg-green-600/20 text-green-400' },
                  { name: 'James Okafor', init: 'JO', bg: 'bg-purple-600', goal: 'Muscle Gain', status: 'Drifting', badge: 'bg-yellow-600/20 text-yellow-400' },
                  { name: 'Priya Nair', init: 'PN', bg: 'bg-emerald-600', goal: 'Marathon Training', status: 'Engaged', badge: 'bg-green-600/20 text-green-400' },
                  { name: 'Tom Bergström', init: 'TB', bg: 'bg-orange-600', goal: 'General Fitness', status: 'At Risk', badge: 'bg-red-600/20 text-red-400' },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.bg}`}>{c.init}</div>
                      <span className="text-white text-sm font-medium">{c.name}</span>
                      <span className="text-zinc-500 text-xs ml-1">{c.goal}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BLOCK 2 — PROGRAMS */}
      <section className="bg-white/[0.02]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto px-6 py-16 lg:py-32">
          {/* Text — first in JSX for mobile, right on desktop */}
          <div className="fade-in-delay-1 lg:order-2">
            <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20">
              Program Builder
            </span>
            <h2 className="mt-5 text-4xl font-bold text-white leading-tight tracking-tight">
              Build world-class training programs in minutes.
            </h2>
            <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
              A powerful drag-and-drop program builder with a full exercise library. Create structured multi-week programs, assign them to clients with one click, and let your clients log every set and rep directly inside StopMooing.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Build structured multi-day, multi-week training programs',
                'Full exercise library with muscle group tagging',
                'Assign programs to any client with one click',
                'Clients log sets, reps and weights from their own view',
                'Track client progress and personal bests over time',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-zinc-300 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup — hidden on mobile, left on desktop */}
          <div className="hidden lg:block lg:order-1 fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Program Builder</span>
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg">+ New Program</span>
              </div>

              <div className="mt-4 bg-green-600/10 border-l-4 border-green-500 rounded-xl p-4">
                <div className="text-white font-semibold text-sm">6 Week Strength Block</div>
                <div className="text-zinc-400 text-xs mt-1">3 days · Upper / Lower / Full Body</div>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { n: 1, name: 'Bench Press', muscle: 'Chest', sets: '4 × 6-10 reps' },
                  { n: 2, name: 'Barbell Row', muscle: 'Back', sets: '3 × 8-12 reps' },
                  { n: 3, name: 'Shoulder Press', muscle: 'Shoulders', sets: '3 × 8-12 reps' },
                  { n: 4, name: 'Squat', muscle: 'Legs', sets: '4 × 6-8 reps' },
                ].map((e) => (
                  <div key={e.n} className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-green-600/20 text-green-500 text-xs font-bold flex items-center justify-center shrink-0">{e.n}</div>
                    <span className="text-white text-sm font-medium flex-1">{e.name}</span>
                    <span className="bg-green-600/10 text-green-500 text-xs px-2 py-0.5 rounded-full font-medium">{e.muscle}</span>
                    <span className="text-zinc-500 text-xs ml-2">{e.sets}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BLOCK 3 — NUTRITION & HABITS */}
      <section style={{ backgroundColor: '#0a0a0a' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto px-6 py-16 lg:py-32">
          {/* Left — text */}
          <div className="fade-in">
            <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20">
              Nutrition &amp; Habits
            </span>
            <h2 className="mt-5 text-4xl font-bold text-white leading-tight tracking-tight">
              Coach the whole person, not just the workout.
            </h2>
            <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
              Meal plans. Macro targets. Daily habit check-ins. StopMooing gives your clients the structure to build real, lasting change — and gives you the visibility to coach them on everything.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Create and assign custom meal plans per client',
                'Set daily macro and calorie targets',
                'Daily habit tracking with streak counters',
                'Full habit history visible on your PT dashboard',
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-zinc-300 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — mockup */}
          <div className="hidden lg:block fade-in-delay-1">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">Today's Habits</span>
                <span className="text-zinc-500 text-xs">Thu 7 May</span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  { name: 'Morning workout', streak: '🔥 7 day streak', filled: 6 },
                  { name: 'Hit protein target', streak: '🔥 5 day streak', filled: 5 },
                  { name: '8hrs sleep', streak: '🔥 4 day streak', filled: 4 },
                  { name: 'Drink 3L water', streak: '🔥 7 day streak', filled: 7 },
                ].map((h) => (
                  <div key={h.name} className="flex items-center justify-between">
                    <div>
                      <div className="text-zinc-300 text-sm font-medium">{h.name}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{h.streak}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full ${i < h.filled ? 'bg-green-500' : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
                {[
                  { label: 'Protein', value: '156g / 180g', pct: 87 },
                  { label: 'Carbs', value: '210g / 250g', pct: 84 },
                  { label: 'Fats', value: '58g / 70g', pct: 83 },
                ].map((m) => (
                  <div key={m.label} className="bg-black/40 rounded-xl p-3 text-center">
                    <div className="text-zinc-500 text-xs uppercase tracking-wide">{m.label}</div>
                    <div className="text-white font-bold text-lg mt-1">{m.value}</div>
                    <div className="h-1 rounded-full bg-white/10 mt-2">
                      <div className="h-1 rounded-full bg-green-500" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 lg:py-32 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20 fade-in">
              How It Works
            </span>
            <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-5 tracking-tight fade-in-delay-1">
              Set up in minutes. Results from day one.
            </h2>
            <p className="text-center text-zinc-400 text-lg mt-4 max-w-2xl mx-auto fade-in-delay-2">
              No complicated onboarding. No technical knowledge needed. Just add your clients and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            {[
              {
                num: '01',
                heading: 'Add your clients',
                desc: 'Import your existing roster or add clients one by one. Takes less than 2 minutes and requires zero technical setup.',
              },
              {
                num: '02',
                heading: 'Build their program',
                desc: 'Create a personalised training program, assign it directly to the client, and set up their nutrition and habit targets.',
              },
              {
                num: '03',
                heading: 'Retain more clients',
                desc: 'Automated check-ins run silently in the background. You get alerted before anyone even thinks about cancelling.',
              },
            ].map((s, i) => (
              <div
                key={s.num}
                className={`bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200 fade-in-delay-${i + 1}`}
              >
                <div className="text-7xl font-black text-green-600/20 leading-none">{s.num}</div>
                <div className="text-white font-bold text-lg mt-6">{s.heading}</div>
                <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 lg:py-32" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-green-600/10 text-green-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-green-600/20 fade-in">
              Pricing
            </span>
            <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-5 tracking-tight fade-in-delay-1">
              Simple pricing. No surprises.
            </h2>
            <p className="text-center text-zinc-400 text-lg mt-4 fade-in-delay-2">
              One subscription replaces 4-5 separate tools. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col fade-in-delay-1">
              <div className="text-white font-bold text-xl">Starter</div>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-5xl font-black text-white">$49</span>
                <span className="text-zinc-500 text-base pb-1">/month</span>
              </div>
              <p className="text-zinc-400 text-sm mt-2">Perfect for PTs building their foundation</p>
              <div className="border-t border-white/10 my-6" />
              <ul className="space-y-3">
                {[
                  'Up to 10 clients',
                  'Check-in system with automated links',
                  'Program builder and exercise library',
                  'Client workout logging',
                  'Basic dashboard analytics',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    <span className="text-zinc-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth" className="mt-auto pt-8 border border-white/20 text-white hover:bg-white/10 rounded-xl py-3 text-sm font-semibold text-center block w-full transition-all duration-150">Get started free</a>
            </div>

            {/* Pro */}
            <div className="bg-green-600 border border-green-500 rounded-2xl p-8 flex flex-col relative overflow-hidden fade-in-delay-2">
              <div className="absolute inset-0 bg-green-400/10 rounded-2xl pointer-events-none" />
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 relative">Most Popular</span>
              <div className="text-white font-bold text-xl relative">Pro</div>
              <div className="flex items-end gap-1 mt-4 relative">
                <span className="text-5xl font-black text-white">$99</span>
                <span className="text-white/70 text-base pb-1">/month</span>
              </div>
              <p className="text-white/80 text-sm mt-2 relative">For serious PTs ready to scale their business</p>
              <div className="border-t border-white/20 my-6 relative" />
              <ul className="space-y-3 relative">
                {[
                  'Unlimited clients',
                  'Everything in Starter',
                  'Nutrition and meal plan builder',
                  'Habit coaching and tracking',
                  'Automated email alerts for at-risk clients',
                  'Payments integration',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-white shrink-0" />
                    <span className="text-white text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="/auth" className="mt-auto pt-8 bg-white text-green-700 font-bold rounded-xl py-3 text-sm text-center block w-full hover:bg-green-50 transition-all duration-150">Start free trial →</a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 lg:py-32 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-white font-black text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight fade-in">
            Ready to stop the churn?
          </h2>
          <p className="mt-5 text-zinc-400 text-lg fade-in-delay-1">
            Join personal trainers already using StopMooing to protect their income.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center fade-in-delay-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white/10 border border-white/20 text-white placeholder-zinc-500 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-72"
            />
            <a href="/auth" className="bg-white text-green-700 font-bold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-all duration-150 text-sm w-full sm:w-auto text-center">Start for free →</a>
          </div>
          <p className="text-zinc-600 text-xs mt-3">Free to start · No credit card required · Cancel anytime</p>
          <a href="/auth" className="mt-6 inline-block text-white font-black text-xl sm:text-2xl hover:text-green-500 transition-colors duration-150 tracking-tight">CREATE YOUR FREE ACCOUNT →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg">StopMooing</span>
              <span className="text-zinc-500 text-sm mt-1">Built for personal trainers.</span>
            </div>
            <div className="flex gap-6">
              <a href="/auth" className="text-zinc-400 hover:text-white text-sm transition-colors duration-150">Sign in</a>
              <a href="/auth" className="text-zinc-400 hover:text-white text-sm transition-colors duration-150">Get started</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-600 text-xs">© 2026 StopMooing. All rights reserved.</span>
            <div className="flex gap-6">
              <button className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors duration-150">Privacy Policy</button>
              <button className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors duration-150">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
