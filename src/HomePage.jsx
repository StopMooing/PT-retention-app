// unfnshd.app for anyone signed out: what UNFNSHD is, who it's for, what it does and what
// it costs, in that order. Screens are the real app running on made-up sample data
// (tools/screenshots), in light and dark to match the visitor's phone. No invented
// customers, numbers or quotes.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Users, MessageCircleHeart, Activity, ClipboardCheck, MessageSquare, ListChecks,
  Dumbbell, LayoutGrid, Apple, UtensilsCrossed, CheckCircle2, LineChart, CalendarX, BellOff, Inbox, Check, ChevronDown,
} from 'lucide-react'
import { Mark, Button, Chip, Segmented } from './ui'

const cx = (...c) => c.filter(Boolean).join(' ')
const WRAP = 'w-full max-w-[1200px] mx-auto px-4 sm:px-6'

// One app screen, in the visitor's light or dark mode (only the shown one loads).
function Shot({ name, alt, phone, eager, className }) {
  const img = (theme, show) => (
    <img
      src={`/site/${name}-${theme}.webp`}
      alt={alt}
      width={phone ? 780 : 1600}
      height={phone ? 1688 : 1025}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cx('block w-full h-auto', show)}
    />
  )
  return (
    <div className={cx('overflow-hidden border border-line bg-bg shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]', phone ? 'rounded-[34px]' : 'rounded-[20px]', className)}>
      {img('light', 'dark:hidden')}
      {img('dark', 'hidden dark:block')}
    </div>
  )
}

function Eyebrow({ children }) {
  return <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted">{children}</p>
}

function Ticks({ items }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[16px] leading-snug text-ink">
          <Check size={18} strokeWidth={3} className="text-accent shrink-0 mt-0.5" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

const SIGNS = [
  { icon: CalendarX, title: 'Missed sessions', body: 'Two planned sessions missed in a row and a client moves to Drifting.' },
  { icon: BellOff, title: 'Gone quiet', body: 'A week without a session or a check-in is Drifting. Two weeks is At risk.' },
  { icon: Inbox, title: 'Waiting on you', body: 'Every check-in that needs your reply sits at the top of your day.' },
]

const STEPS = [
  { n: '01', title: 'Add your clients', body: 'Add a client and send their invite link. They set a password and they are in, on any phone.' },
  { n: '02', title: 'They train and check in', body: 'Workouts with every set laid out, food, habits and a weekly check-in, with you one message away.' },
  { n: '03', title: 'You see who needs you', body: 'Your day starts with a short list: who checked in, who is drifting and why. The message is already written.' },
]

const EVERYTHING = [
  { icon: Users, title: 'Needs you', body: 'Who to talk to today, and why' },
  { icon: MessageCircleHeart, title: 'Reach out', body: 'Ready-made messages to edit and send' },
  { icon: Activity, title: 'Client health', body: 'Engaged, drifting and at risk at a glance' },
  { icon: ClipboardCheck, title: 'Weekly check-ins', body: 'Your questions, their answers, your reply' },
  { icon: MessageSquare, title: 'Messages', body: 'Chat in the app, with daily check-ins' },
  { icon: ListChecks, title: 'Program builder', body: 'Set by set, with weeks and supersets' },
  { icon: Dumbbell, title: 'Exercise library', body: 'Over 300 exercises, cues and your own videos' },
  { icon: LayoutGrid, title: 'Ready-made programs', body: 'Assign one in a tap, or copy and change it' },
  { icon: Apple, title: 'Nutrition', body: 'Food log, Australian food data, barcode scanner' },
  { icon: UtensilsCrossed, title: 'Meal plans', body: '54 ready-made plans with recipes' },
  { icon: CheckCircle2, title: 'Habits', body: 'Daily habits clients tick off' },
  { icon: LineChart, title: 'Progress', body: 'Weigh-ins, measurements, photos and PBs' },
]

const PLANS = [
  { key: '8', clients: 8, price: 50 },
  { key: '16', clients: 16, price: 75 },
  { key: '50', clients: 50, price: 100 },
]

const FAQ = [
  { q: 'Do my clients pay anything?', a: 'No. Your plan covers your clients. They join through the invite link you send them.' },
  { q: 'Does it work on iPhone and Android?', a: 'Yes. UNFNSHD runs in the phone\'s browser and adds to the home screen like an app, so there is no app store to go through. On iPhone, notifications need it added to the home screen first.' },
  { q: 'What does founding coach mean?', a: 'You use UNFNSHD free while we are in beta, and you help shape what gets built next. Before beta ends you will hear from us, and you choose a plan then.' },
  { q: 'Can I use my own programs?', a: 'Yes. Build them set by set in the program builder, or start from a ready-made program and change it to suit.' },
  { q: 'Who can see my clients\' information?', a: 'Only you and each client. Coaches see their own clients and nobody else\'s, clients see only their own data, and progress photos stay private to the client and their coach.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState('16')
  const [open, setOpen] = useState(0)
  const join = () => navigate('/signup')
  const signIn = () => navigate('/login')
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line pt-[env(safe-area-inset-top)]">
        <div className={cx(WRAP, 'h-16 flex items-center gap-4')}>
          <a href="/" className="flex items-center gap-2 shrink-0" aria-label="UNFNSHD home">
            <Mark size={26} />
            <span className="font-display text-[22px] leading-none tracking-[0.5px] pt-0.5">UNFNSHD</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 ml-6 text-[15px] font-semibold text-muted">
            <button onClick={() => go('how')} className="px-3 py-2 rounded-full hover:text-ink">How it works</button>
            <button onClick={() => go('features')} className="px-3 py-2 rounded-full hover:text-ink">Features</button>
            <button onClick={() => go('pricing')} className="px-3 py-2 rounded-full hover:text-ink">Pricing</button>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={signIn}>Sign in</Button>
            <Button size="sm" onClick={join}>Join free</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className={cx(WRAP, 'pt-12 sm:pt-20 pb-14 sm:pb-20')}>
          <div className="max-w-[760px]">
            <Chip tone="accent" className="!h-7 !px-3 !text-[13px]">For personal trainers and online coaches</Chip>
            <h1 className="mt-5 font-display text-[clamp(44px,9vw,84px)] leading-[0.95] tracking-[-0.5px]">Keep every client you coach.</h1>
            <p className="mt-5 text-[18px] sm:text-[20px] leading-relaxed text-muted max-w-[640px]">
              UNFNSHD shows you who is slipping and why, and hands you the message to send. Programs, weekly check-ins, nutrition and the app your clients train from all come with it.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={join}>Join as a founding coach <ArrowRight size={18} /></Button>
              <Button size="lg" variant="secondary" onClick={() => go('how')}>See how it works</Button>
            </div>
            <p className="mt-3 text-[14px] text-muted">Free for founding coaches while we are in beta. No card needed.</p>
          </div>
          <div className="relative mt-12 sm:mt-16">
            <Shot name="dash" alt="The coach dashboard: five clients need you, with the reason for each and a Reply or Reach out button" eager />
            <div className="hidden md:block absolute -bottom-10 right-6 lg:right-10 w-[210px] lg:w-[240px]">
              <Shot name="home" alt="A client's home screen: this week's sessions, today's plan, calories and water" phone eager />
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="bg-surface border-y border-line">
          <div className={cx(WRAP, 'py-16 sm:py-24')}>
            <div className="max-w-[720px]">
              <Eyebrow>Why it matters</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(32px,6vw,52px)] leading-[1.02]">Clients rarely quit loudly. They go quiet first.</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">
                A missed session, a skipped check-in, a few days without a word. UNFNSHD watches for those signs on every client, every day, so you can step in while it is still an easy conversation.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {SIGNS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-[20px] bg-bg border border-line p-5">
                  <span className="w-11 h-11 rounded-[14px] bg-accent-soft text-accent flex items-center justify-center"><Icon size={21} /></span>
                  <p className="mt-4 text-[18px] font-bold">{title}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={cx(WRAP, 'py-16 sm:py-24 scroll-mt-20')}>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-[clamp(32px,6vw,52px)] leading-[1.02] max-w-[720px]">Set up in an afternoon. Useful from the first week.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t-2 border-ink pt-5">
                <p className="font-display text-[40px] leading-none text-faint tabular-nums">{s.n}</p>
                <p className="mt-3 text-[20px] font-bold">{s.title}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20">
          <div className={cx(WRAP, 'pb-16 sm:pb-24 space-y-20 sm:space-y-28')}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
              <div>
                <Eyebrow>For you</Eyebrow>
                <h3 className="mt-3 font-display text-[clamp(30px,5vw,44px)] leading-[1.05]">Every check-in, answered by you.</h3>
                <Ticks items={[
                  'A weekly check-in with your own questions, right in their app',
                  'How they have been feeling all week, next to their answers',
                  'Reply in a few lines and it lands in their app straight away',
                  'Engaged, drifting and at risk for every client, worked out for you',
                ]} />
              </div>
              <Shot name="profile" alt="A client's check-in with their answers, how they have been feeling this week, and a reply box" />
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-center">
              <Shot name="reach" alt="Reach out to Sophie: a ready-made message to edit, then send in the app or as a text" className="order-2 lg:order-1" />
              <div className="order-1 lg:order-2">
                <Eyebrow>For you</Eyebrow>
                <h3 className="mt-3 font-display text-[clamp(30px,5vw,44px)] leading-[1.05]">The right words, ready to send.</h3>
                <Ticks items={[
                  'Ready-made messages for missed sessions, quiet weeks and time away',
                  'Edit it, then send it in the app or as a text',
                  'See when you last reached out, so nobody gets forgotten',
                ]} />
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
              <div>
                <Eyebrow>For you</Eyebrow>
                <h3 className="mt-3 font-display text-[clamp(30px,5vw,44px)] leading-[1.05]">Programs built set by set.</h3>
                <Ticks items={[
                  'Every set its own row: reps, kg, RPE and rest',
                  'Warm-ups, drop sets and supersets',
                  'Add a week with 2.5 kg or a rep added for you',
                  'See exactly what your client sees while you build',
                ]} />
              </div>
              <Shot name="builder" alt="The program builder with set rows on the left and the client's view on the right" />
            </div>

            <div>
              <div className="max-w-[720px]">
                <Eyebrow>For your clients</Eyebrow>
                <h3 className="mt-3 font-display text-[clamp(30px,5vw,44px)] leading-[1.05]">Everything your clients need, in one app.</h3>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">Their week, their workout, their food and you. It celebrates showing up and always points to the next step.</p>
              </div>
              <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  ['home', 'This week and today', 'Home: this week ring, today\'s plan, calories and water'],
                  ['log', 'Your targets, set by set', 'Logging a workout with the coach\'s targets and a Swap exercise button'],
                  ['food', 'Food and meal plans', 'Nutrition: calories and macros left, with today\'s meal plan'],
                  ['msgs', 'Check-ins and messages', 'Messages with the coach, including a daily check-in'],
                ].map(([name, label, alt]) => (
                  <figure key={name}>
                    <Shot name={name} alt={alt} phone />
                    <figcaption className="mt-3 text-[15px] font-bold text-center">{label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* All of it */}
        <section className="bg-surface border-y border-line">
          <div className={cx(WRAP, 'py-16 sm:py-24')}>
            <Eyebrow>All one system</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(32px,6vw,52px)] leading-[1.02] max-w-[720px]">One app instead of five.</h2>
            <div className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {EVERYTHING.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon size={22} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[16px] font-bold">{title}</p>
                    <p className="text-[14px] leading-snug text-muted mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={cx(WRAP, 'py-16 sm:py-24 scroll-mt-20')}>
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 font-display text-[clamp(32px,6vw,52px)] leading-[1.02] max-w-[720px]">Every feature on every plan.</h2>

          <div className="mt-8 rounded-[28px] bg-hero text-on-hero p-6 sm:p-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div>
              <p className="text-[14px] font-bold text-hero-muted">Founding coaches</p>
              <p className="mt-1 font-display text-[clamp(30px,5vw,44px)] leading-[1.02]">Free while we are in beta.</p>
              <p className="mt-3 text-[16px] leading-relaxed text-hero-muted max-w-[620px]">Join now, coach your clients on UNFNSHD at no cost, and help shape what gets built next. You will hear from us before beta ends.</p>
            </div>
            <button onClick={join} className="h-[52px] px-6 rounded-full bg-tan text-on-tan font-bold inline-flex items-center justify-center gap-2 hover:brightness-105">
              Join as a founding coach <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <p className="text-[18px] font-bold">How many clients do you coach?</p>
            <Segmented
              value={plan}
              onChange={setPlan}
              options={PLANS.map((p) => ({ value: p.key, label: `Up to ${p.clients}` }))}
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PLANS.map((p) => {
              const on = p.key === plan
              return (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  aria-pressed={on}
                  className={cx('text-left rounded-[24px] border p-6 transition-colors', on ? 'border-ink bg-surface' : 'border-line bg-bg hover:bg-surface')}
                >
                  <p className="text-[15px] font-bold text-muted">Up to {p.clients} clients</p>
                  <p className="mt-2 font-display text-[48px] leading-none tabular-nums">A${p.price}</p>
                  <p className="mt-1 text-[14px] text-muted">a month</p>
                  <p className="mt-4 text-[15px] leading-relaxed">Everything, for you and up to {p.clients} clients. Clients never pay for the app.</p>
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-[14px] text-muted">Plan prices apply after beta, in Australian dollars. Founding coaches use UNFNSHD free until then.</p>

          <div className="mt-10 rounded-[24px] border border-line p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1">
              <p className="text-[18px] font-bold">Training on your own?</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">The UNFNSHD app for one, with workouts, programs, food and progress, will be A$14.99 a month. It opens after the coach beta.</p>
            </div>
          </div>
        </section>

        {/* Built by a coach */}
        <section className="bg-surface border-y border-line">
          <div className={cx(WRAP, 'py-16 sm:py-24 grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] items-start')}>
            <Mark size={56} />
            <div className="max-w-[720px]">
              <Eyebrow>Built by a coach</Eyebrow>
              <p className="mt-3 font-display text-[clamp(26px,4.5vw,38px)] leading-[1.12]">UNFNSHD is built by Luke, a personal trainer in Adelaide, to coach his own clients first.</p>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">The name means we are never done. There is always a next session, a next step, a next week. Every feature is here because a coach needed it with real clients.</p>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className={cx(WRAP, 'py-16 sm:py-24')}>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-3 font-display text-[clamp(32px,6vw,52px)] leading-[1.02]">Good to know.</h2>
          <div className="mt-8 max-w-[820px] divide-y divide-line border-y border-line">
            {FAQ.map((f, i) => {
              const isOpen = open === i
              return (
                <div key={f.q}>
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-center justify-between gap-4 py-5 text-left">
                    <span className="text-[18px] font-bold">{f.q}</span>
                    <ChevronDown size={20} className={cx('shrink-0 text-muted transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && <p className="pb-5 -mt-1 text-[16px] leading-relaxed text-muted max-w-[680px]">{f.a}</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Close */}
        <section className={cx(WRAP, 'pb-20')}>
          <div className="rounded-[32px] bg-hero text-on-hero px-6 py-12 sm:px-12 sm:py-16 text-center">
            <h2 className="font-display text-[clamp(34px,7vw,64px)] leading-[0.98]">Your clients are worth keeping.</h2>
            <p className="mt-4 text-[17px] text-hero-muted">Free for founding coaches while we are in beta.</p>
            <button onClick={join} className="mt-8 h-[52px] px-7 rounded-full bg-tan text-on-tan font-bold inline-flex items-center justify-center gap-2 hover:brightness-105">
              Join as a founding coach <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={cx(WRAP, 'py-8 flex flex-col sm:flex-row sm:items-center gap-4 text-[14px] text-muted')}>
          <div className="flex items-center gap-2 text-ink">
            <Mark size={20} />
            <span className="font-display text-[17px] leading-none pt-0.5">UNFNSHD</span>
          </div>
          <span className="sm:ml-2">We aren't done. Neither are you.</span>
          <div className="sm:ml-auto flex items-center gap-4">
            <button onClick={signIn} className="font-semibold text-ink">Sign in</button>
            <button onClick={join} className="font-semibold text-ink">Join free</button>
            <span>© 2026 UNFNSHD</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
