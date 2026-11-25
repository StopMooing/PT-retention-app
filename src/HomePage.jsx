// unfnshd.app for anyone signed out. Built around one idea: show a coach's real week on the
// real app, so a trainer gets it without reading feature lists. Screens are the app running
// on made-up sample data (tools/screenshots), in light and dark to match the visitor's phone,
// with close-ups on small screens. No invented customers, numbers or quotes.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Mark, Ring } from './ui'

const cx = (...c) => c.filter(Boolean).join(' ')
const WRAP = 'w-full max-w-[1200px] mx-auto px-4 sm:px-6'

// Founding coaches: the full top plan, free for the beta, for the first few coaches.
const FOUNDING = { clients: 50, places: 20 }
// Luke's photo for the letter, e.g. '/site/luke.webp'. Left empty, the letter shows without one.
const FOUNDER_PHOTO = ''

const darkNow = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
const wideNow = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
const calmNow = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// One app screen in the visitor's light or dark mode. `close` is a close-up used on phones
// and tablets instead of a full computer screen. Only the image on show loads.
function Screen({ name, close, alt, eager, className }) {
  const dark = darkNow()
  const wide = wideNow()
  const img = (file, theme, cls, onShow) => (
    <img
      key={`${file}-${theme}`}
      src={`/site/${file}-${theme}.webp`}
      alt={alt}
      loading={eager && onShow ? 'eager' : 'lazy'}
      decoding="async"
      className={cx('block', cls, className)}
    />
  )
  if (!close) return <>{[img(name, 'light', 'dark:hidden', !dark), img(name, 'dark', 'hidden dark:block', dark)]}</>
  return (
    <>
      {[
        img(name, 'light', 'hidden lg:block lg:dark:hidden', wide && !dark),
        img(name, 'dark', 'hidden lg:dark:block', wide && dark),
        img(close, 'light', 'lg:hidden dark:hidden', !wide && !dark),
        img(close, 'dark', 'hidden dark:block lg:dark:hidden', !wide && dark),
      ]}
    </>
  )
}

const WEEK = [
  {
    day: 'Mon', time: '6:40am',
    title: "See how everyone's going.",
    body: 'Before your first session you can see every client at a glance: engaged, drifting or at risk, and who has trained this week. Worked out for you, every day.',
    shot: 'health', narrow: true,
    alt: 'Your clients at a glance: six clients, four engaged, one drifting, one at risk, and who has trained this week',
  },
  {
    day: 'Mon', time: '7:10am',
    title: 'Reply to check-ins over coffee.',
    body: "Their answers sit next to how they've felt all week: energy, sleep and soreness. Write a few lines and it lands in their app.",
    shot: 'profile', close: 'checkin',
    alt: "A client's check-in with their answers, how they've been feeling this week, and a reply box",
  },
  {
    day: 'Mon', time: '12:30pm',
    title: "Sophie's gone quiet. The message is written.",
    body: 'Ready-made messages for missed sessions, quiet weeks and time away. Change a word or two, then send it in the app or as a text.',
    shot: 'reachcard',
    alt: 'Reach out to Sophie: a ready-made message to edit, then send in the app or as a text',
  },
  {
    day: 'Tue', time: '5:45pm',
    title: 'Jane trains your program.',
    body: "Every set laid out with your targets. If the rack is taken she can swap the exercise for that session, and you'll see what she did instead.",
    shot: 'log', phone: true,
    alt: "Logging a workout with the coach's targets and a Swap exercise button",
  },
  {
    day: 'Sun', time: '7:30pm',
    title: 'Build next week in minutes.',
    body: 'Every set is its own row: reps, kg, RPE and rest. Add a week and it adds 2.5 kg or a rep for you. You see what your client will see as you build.',
    shot: 'builder', close: 'buildercard',
    alt: "The program builder with set rows on the left and the client's view on the right",
  },
]

const STATES = [
  { name: 'Engaged', value: 0.9, body: 'Training and checking in as planned.' },
  { name: 'Drifting', value: 0.5, body: 'Two planned sessions missed in a row, or a week without a session or a check-in.' },
  { name: 'At risk', value: 0.18, body: 'Two weeks without a session or a check-in.' },
]

const INCLUDED = [
  { tab: 'Keeping clients', items: [
    ['Needs you', 'Who to talk to today, and why.'],
    ['Reach out', 'Ready-made messages to change and send.'],
    ['Client health', 'Engaged, drifting or at risk, for every client.'],
    ['Weekly check-ins', 'Your questions, their answers, your reply.'],
    ['Messages', 'Chat in the app, plus a quick daily check-in.'],
  ] },
  { tab: 'Training', items: [
    ['Program builder', 'Set by set, with weeks, warm-ups, drop sets and supersets.'],
    ['Exercise library', 'Over 300 exercises with cues, and your own videos.'],
    ['Ready-made programs', 'Assign one in a tap, or copy it and make it yours.'],
    ['Swaps', 'Rack taken? Clients swap an exercise for that session, and you see it.'],
  ] },
  { tab: 'Food', items: [
    ['Food log', 'Australian food data and a barcode scanner.'],
    ['Meal plans', '54 ready-made plans with recipes.'],
    ['Targets', 'Calories, protein, carbs and fats, set by you.'],
  ] },
  { tab: 'Progress', items: [
    ['Habits', 'Daily habits your clients tick off.'],
    ['Body', 'Weigh-ins, measurements and progress photos.'],
    ['PBs', 'Personal bests, picked up from their sessions.'],
  ] },
]

// What's included, a group at a time.
function Included() {
  const [at, setAt] = useState(0)
  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="What's included" className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
        {INCLUDED.map((g, i) => (
          <button
            key={g.tab}
            role="tab"
            aria-selected={i === at}
            onClick={() => setAt(i)}
            className={cx('shrink-0 h-11 px-5 rounded-full text-[15px] font-bold transition-colors', i === at ? 'bg-accent text-on-accent' : 'bg-bg text-ink hover:bg-surface-2')}
          >
            {g.tab}
          </button>
        ))}
      </div>
      <dl role="tabpanel" className="mt-6 border-t border-line">
        {INCLUDED[at].items.map(([name, body]) => (
          <div key={name} className="border-b border-line py-4 sm:grid sm:grid-cols-[220px_1fr] sm:gap-6">
            <dt className="text-[17px] font-bold">{name}</dt>
            <dd className="mt-0.5 sm:mt-0 text-[16px] leading-relaxed text-muted">{body}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const PLANS = [
  { clients: 8, price: 50 },
  { clients: 16, price: 75 },
  { clients: 50, price: 100 },
]

const FAQ = [
  { q: 'Do my clients pay anything?', a: 'No. Your plan covers your clients. They join through the invite link you send them.' },
  { q: 'Does it work on iPhone and Android?', a: "Yes. UNFNSHD runs in the phone's browser and adds to the home screen like an app, so there's no app store to go through. On iPhone, notifications need it added to the home screen first." },
  { q: 'I already use another coaching app. Is moving across hard?', a: "There's no big moving day. Add a client and send their invite link, and they're set up in about a minute on the phone they already have. Build your programs set by set, or start from a ready-made one and change it. Start with a few clients and bring the rest across when you're ready." },
  { q: 'What does founding coach mean?', a: `The first ${FOUNDING.places} coaches use the full plan, for up to ${FOUNDING.clients} clients, free while we're in beta, and get a say in what gets built next. Before the beta ends you'll hear from us, and nothing is charged unless you choose a plan.` },
  { q: 'Can I try it before signing up?', a: 'Yes. The demo runs the real app on made-up clients, both the coach side and the client app. Nothing you do there is saved.' },
  { q: 'Can I use my own programs?', a: 'Yes. Build them set by set in the program builder, or start from a ready-made program and change it to suit.' },
  { q: "Who can see my clients' information?", a: "Only you and each client. Coaches see their own clients and nobody else's, clients see only their own information, and progress photos stay private to the client and their coach." },
]

// The week, one moment at a time, with a ring that fills as the week goes, like the client's
// week ring in the app. Big screens: pick a moment and the screen changes. Phones: swipe across.
function Week() {
  const [at, setAt] = useState(0)
  const [swiped, setSwiped] = useState(0)
  const track = useRef(null)
  const m = WEEK[at]
  const step = () => {
    const el = track.current
    const card = el?.firstElementChild
    return card ? card.offsetWidth + 12 : 1
  }
  const onSwipe = () => {
    const i = Math.round(track.current.scrollLeft / step())
    setSwiped(Math.max(0, Math.min(WEEK.length - 1, i)))
  }
  const swipeTo = (i) => track.current?.scrollTo({ left: i * step(), behavior: calmNow() ? 'auto' : 'smooth' })
  const ring = (i, size, stroke) => (
    <Ring value={(i + 1) / WEEK.length} size={size} stroke={stroke} color="var(--tan)" track="var(--hero-track)" dot="var(--hero-dot)" />
  )
  return (
    <>
      <div className="hidden lg:grid grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-12 mt-14 items-start">
        <div>
          <div className="flex items-center gap-4">
            {ring(at, 76, 8)}
            <p className="font-display text-[34px] leading-none">{m.day} <span className="text-hero-muted">{m.time}</span></p>
          </div>
          <ol className="mt-8 border-t border-hero-track">
            {WEEK.map((w, i) => {
              const on = i === at
              return (
                <li key={w.time} className="border-b border-hero-track">
                  <button
                    onClick={() => setAt(i)}
                    aria-pressed={on}
                    className={cx('w-full text-left py-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tan', on ? 'text-on-hero' : 'text-hero-muted hover:text-on-hero')}
                  >
                    <span className="block text-[14px] font-semibold tabular-nums">{w.day} {w.time}</span>
                    <span className="block mt-0.5 text-[19px] font-bold leading-snug">{w.title}</span>
                    {on && <span className="block mt-2 text-[16px] leading-relaxed text-hero-muted font-normal">{w.body}</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="sticky top-24">
          <div className="relative aspect-[1600/1025] rounded-[24px] bg-hero-chip">
            <div key={m.shot} className="absolute inset-0 flex items-center justify-center p-5">
              <Screen
                name={m.shot}
                alt={m.alt}
                className={cx('max-h-full max-w-full w-auto h-auto shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]', m.phone ? 'rounded-[28px]' : 'rounded-[14px]')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden mt-10">
        <div className="flex items-center gap-3">
          {ring(swiped, 48, 6)}
          <p className="font-display text-[26px] leading-none">{WEEK[swiped].day} <span className="text-hero-muted">{WEEK[swiped].time}</span></p>
          <p className="ml-auto text-[14px] font-semibold text-hero-muted">{swiped + 1} of {WEEK.length}</p>
        </div>
        <ol ref={track} onScroll={onSwipe} className="mt-5 -mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {WEEK.map((w) => (
            <li key={w.time} className="snap-start shrink-0 w-[86%] rounded-[24px] bg-hero-chip p-5 flex flex-col">
              <h3 className="font-display text-[26px] leading-[1.05]">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-hero-muted">{w.body}</p>
              <div className="mt-5 h-[340px] flex items-center justify-center">
                <Screen name={w.shot} close={w.close} alt={w.alt} className={cx('max-h-full max-w-full w-auto h-auto', w.phone ? 'rounded-[24px]' : 'rounded-[14px]')} />
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex justify-center gap-2">
          {WEEK.map((w, i) => (
            <button key={w.time} onClick={() => swipeTo(i)} aria-label={`${w.day} ${w.time}: ${w.title}`} className="p-1.5">
              <span className={cx('block h-2 rounded-full transition-all', i === swiped ? 'w-6 bg-tan' : 'w-2 bg-hero-track')} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const join = () => navigate('/signup')
  const signIn = () => navigate('/login')
  const demo = () => navigate('/demo')
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: calmNow() ? 'auto' : 'smooth', block: 'start' })

  const primary = 'h-[52px] px-6 rounded-full bg-accent text-on-accent font-bold text-[16px] inline-flex items-center justify-center hover:bg-accent-strong transition-colors'
  const secondary = 'h-[52px] px-6 rounded-full border border-line-strong text-ink font-bold text-[16px] inline-flex items-center justify-center hover:bg-surface transition-colors'
  const link = 'px-3 py-2 rounded-full hover:text-ink transition-colors'

  return (
    <div className="site min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className={cx(WRAP, 'h-16 flex items-center gap-4')}>
          <a href="/" className="flex items-center gap-2 shrink-0" aria-label="UNFNSHD home">
            <Mark size={26} />
            <span className="font-display text-[22px] leading-none tracking-[0.5px] pt-0.5">UNFNSHD</span>
          </a>
          <nav className="hidden md:flex items-center ml-6 text-[15px] font-semibold text-muted">
            <button onClick={() => go('week')} className={link}>How it works</button>
            <button onClick={() => go('pricing')} className={link}>Pricing</button>
            <button onClick={() => go('questions')} className={link}>Questions</button>
            <button onClick={demo} className={link}>Demo</button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={signIn} className="h-9 px-3.5 rounded-full text-[14px] font-bold hover:bg-surface transition-colors">Sign in</button>
            <button onClick={join} className="h-9 px-4 rounded-full bg-accent text-on-accent text-[14px] font-bold hover:bg-accent-strong transition-colors">Join free</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero: the promise on the left, the screen that keeps it on the right */}
        <section className={cx(WRAP, 'pt-8 sm:pt-14 pb-20 sm:pb-28 grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] items-center')}>
          <div>
            <p className="text-[16px] font-semibold text-muted">For personal trainers and online coaches</p>
            <h1 className="mt-4 font-display text-[clamp(52px,10.5vw,104px)] leading-[0.9] tracking-[-0.01em]">Keep every client you coach.</h1>
            <p className="mt-6 text-[18px] sm:text-[20px] leading-relaxed text-muted max-w-[34em]">
              UNFNSHD tells you which clients are slipping and why, and hands you the message to send. Programs, weekly check-ins, food and the app your clients train from all come with it.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={join} className={primary}>Join as a founding coach</button>
              <button onClick={demo} className={secondary}>Try the demo</button>
            </div>
            <p className="mt-4 text-[14px] text-muted">Free for the first {FOUNDING.places} coaches while we're in beta. No card needed.</p>
            <p className="mt-1 text-[14px] text-muted">
              Coming to train with your coach? <button onClick={signIn} className="font-semibold text-ink underline underline-offset-2">Sign in to your app</button>
            </p>
          </div>

          <figure className="rounded-[32px] bg-tan text-on-tan p-5 sm:p-9">
            <div>
              <Screen name="needs" alt="Five clients need you: check-ins to reply to, one client drifting and one at risk" eager className="w-full h-auto rounded-[18px] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]" />
              <figcaption className="mt-5 text-[15px] font-semibold leading-snug">The first thing you see each morning: who needs you, and why.</figcaption>
            </div>
          </figure>
        </section>

        {/* The problem, in the app's own words */}
        <section className={cx(WRAP, 'pb-20 sm:pb-28 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
          <h2 className="font-display text-[clamp(36px,6vw,60px)] leading-[0.98]">Clients rarely quit loudly. They go quiet first.</h2>
          <div className="lg:pt-2">
            <p className="text-[18px] leading-relaxed text-muted max-w-[36em]">
              A missed session, a skipped check-in, a few days without a word. UNFNSHD watches every client for those signs, every day, and sorts them for you, so you can step in while it's still an easy conversation.
            </p>
            <dl className="mt-8 space-y-6">
              {STATES.map((s) => (
                <div key={s.name} className="flex items-start gap-4">
                  <Ring value={s.value} size={44} stroke={5} />
                  <div className="pt-1">
                    <dt className="text-[18px] font-bold">{s.name}</dt>
                    <dd className="mt-0.5 text-[16px] leading-relaxed text-muted">{s.body}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* A week with UNFNSHD: the one big moment on the page */}
        <section id="week" className="bg-hero text-on-hero scroll-mt-16">
          <div className={cx(WRAP, 'py-20 sm:py-28')}>
            <h2 className="font-display text-[clamp(40px,7vw,76px)] leading-[0.95]">A week with UNFNSHD.</h2>
            <p className="mt-4 text-[18px] leading-relaxed text-hero-muted max-w-[34em]">Five moments from a coach's week, on the real app with made-up clients.</p>
            <Week />
            <div className="mt-14 flex flex-col sm:flex-row sm:items-center gap-4">
              <button onClick={demo} className="h-[52px] px-6 rounded-full bg-tan text-on-tan font-bold text-[16px] inline-flex items-center justify-center hover:brightness-105 transition">Try it yourself in the demo</button>
              <p className="text-[15px] text-hero-muted">The coach side and the client app, with made-up clients. Nothing is saved.</p>
            </div>
          </div>
        </section>

        {/* The client app */}
        <section className={cx(WRAP, 'py-20 sm:py-28')}>
          <div className="max-w-[720px]">
            <h2 className="font-display text-[clamp(36px,6vw,60px)] leading-[0.98]">Your clients get their own app.</h2>
            <p className="mt-4 text-[18px] leading-relaxed text-muted">
              Their week, today's session, food, habits and you, on the phone they already have. It celebrates showing up and always points to the next step.
            </p>
          </div>
          <div className="mt-12 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 gap-5 sm:gap-8 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2">
            {[
              ['home', "This week, and what's on today", "Home: this week ring, today's plan, calories and water", ''],
              ['food', 'Food, water and meal plans', "Nutrition: calories and macros left, with today's meal plan", 'sm:mt-16'],
              ['msgs', 'Check-ins and messages with you', 'Messages with the coach, including a daily check-in', 'sm:mt-8'],
            ].map(([name, label, alt, offset]) => (
              <figure key={name} className={cx('snap-start shrink-0 w-[68%] sm:w-auto', offset)}>
                <Screen name={name} alt={alt} className="w-full h-auto rounded-[32px] border border-line shadow-[0_24px_60px_-30px_var(--shadow)]" />
                <figcaption className="mt-4 text-[16px] font-bold">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Everything included */}
        <section className="bg-surface">
          <div className={cx(WRAP, 'py-20 sm:py-28 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]')}>
            <div>
              <h2 className="font-display text-[clamp(36px,6vw,60px)] leading-[0.98]">One app instead of five.</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">No more juggling a training app, a food tracker, a chat app, a check-in form and a spreadsheet of who you haven't heard from. Every plan has all of it.</p>
            </div>
            <Included />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className={cx(WRAP, 'py-20 sm:py-28 scroll-mt-16')}>
          <div className="max-w-[720px]">
            <h2 className="font-display text-[clamp(36px,6vw,60px)] leading-[0.98]">What it costs.</h2>
            <p className="mt-4 text-[18px] leading-relaxed text-muted">One price, set by how many clients you coach. Every feature is on every plan, and your clients never pay for the app.</p>
          </div>

          <div className="mt-10 rounded-[32px] bg-hero text-on-hero p-7 sm:p-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[16px] font-bold text-hero-muted">The first {FOUNDING.places} coaches</p>
              <p className="mt-2 font-display text-[clamp(40px,7vw,68px)] leading-[0.95]">Free while we're in beta.</p>
              <p className="mt-4 text-[17px] leading-relaxed text-hero-muted max-w-[36em]">
                The full plan for up to {FOUNDING.clients} clients, every new feature as it lands, and a say in what gets built next. You'll hear from us before the beta ends, and nothing is charged unless you choose a plan.
              </p>
            </div>
            <button onClick={join} className="h-[52px] px-6 rounded-full bg-tan text-on-tan font-bold text-[16px] inline-flex items-center justify-center hover:brightness-105 transition">Join as a founding coach</button>
          </div>

          <p className="mt-14 text-[17px] font-bold">After the beta</p>
          <div className="mt-4 grid sm:grid-cols-3 border-t border-line sm:border-t-0">
            {PLANS.map((p, i) => (
              <div key={p.clients} className={cx('flex sm:block items-baseline justify-between border-b sm:border-b-0 border-line py-5 sm:py-2', i > 0 && 'sm:border-l sm:pl-8', i < PLANS.length - 1 && 'sm:pr-8')}>
                <p className="text-[16px] font-semibold text-muted">Up to {p.clients} clients</p>
                <p className="sm:mt-3">
                  <span className="font-display text-[44px] sm:text-[64px] leading-none tabular-nums">A${p.price}</span>
                  <span className="ml-1.5 text-[15px] text-muted">a month</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 space-y-2 text-[15px] leading-relaxed text-muted max-w-[44em]">
            <p>Prices in Australian dollars. Coaching more than {FOUNDING.clients} clients, or running a team of coaches? Bigger plans are on the way.</p>
            <p>Training on your own, without a coach? The UNFNSHD app for one, with workouts, programs, food and progress, will be A$14.99 a month. It opens after the coach beta.</p>
          </div>
        </section>

        {/* A note from Luke. Draft in his voice: he checks every line. */}
        <section className={cx(WRAP, 'pb-20 sm:pb-28')}>
          <article className="max-w-[720px] mx-auto rounded-[32px] bg-surface px-6 py-10 sm:px-14 sm:py-14">
            <h2 className="font-display text-[clamp(32px,5vw,48px)] leading-[1]">Why I built it.</h2>
            <div className="mt-6 space-y-4 text-[18px] leading-[1.65] text-ink">
              <p>I'm Luke, a personal trainer in Adelaide. I built UNFNSHD for my own clients first.</p>
              <p>It keeps an eye on every client for me, every day, and tells me who needs me and why. The rest of it, the programs, check-ins, food and the client app, is there because I needed it with real people.</p>
              <p>The name says it: we aren't done. We can still work and move, and there's always a next session. If you coach, try it, and tell me what's missing.</p>
            </div>
            <div className="mt-8 flex items-center gap-4">
              {FOUNDER_PHOTO && <img src={FOUNDER_PHOTO} alt="Luke" className="w-16 h-16 rounded-full object-cover" />}
              <div>
                <p className="font-display text-[36px] leading-none">Luke</p>
                <p className="mt-1 text-[15px] text-muted">Personal trainer and founder, UNFNSHD</p>
              </div>
            </div>
          </article>
        </section>

        {/* Questions */}
        <section id="questions" className="bg-surface scroll-mt-16">
          <div className={cx(WRAP, 'py-20 sm:py-28 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]')}>
            <h2 className="font-display text-[clamp(36px,6vw,60px)] leading-[0.98]">Questions.</h2>
            <div className="border-t border-line">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0} className="group border-b border-line">
                  <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 py-5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    <span className="text-[18px] font-bold leading-snug">{f.q}</span>
                    <Plus size={22} className="shrink-0 text-muted transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="pb-6 -mt-1 text-[16px] leading-relaxed text-muted max-w-[40em]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Close */}
        <section className={cx(WRAP, 'py-20 sm:py-32')}>
          <Mark size={72} />
          <h2 className="mt-6 font-display text-[clamp(44px,9vw,96px)] leading-[0.92] max-w-[11em]">Your clients are worth keeping.</h2>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <button onClick={join} className={primary}>Join as a founding coach</button>
            <button onClick={demo} className={secondary}>Try the demo</button>
          </div>
          <p className="mt-4 text-[14px] text-muted">Free for the first {FOUNDING.places} coaches while we're in beta. No card needed.</p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className={cx(WRAP, 'py-8 flex flex-col sm:flex-row sm:items-center gap-4 text-[14px] text-muted')}>
          <div className="flex items-center gap-2 text-ink">
            <Mark size={20} />
            <span className="font-display text-[17px] leading-none pt-0.5">UNFNSHD</span>
          </div>
          <span className="sm:ml-2">We aren't done. Neither are you.</span>
          <div className="sm:ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
            <button onClick={signIn} className="font-semibold text-ink">Sign in</button>
            <button onClick={demo} className="font-semibold text-ink">Demo</button>
            <a href="/privacy" className="font-semibold text-ink">Privacy</a>
            <a href="/terms" className="font-semibold text-ink">Terms</a>
            <span>© 2026 UNFNSHD</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
