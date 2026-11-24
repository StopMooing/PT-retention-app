// /privacy and /terms. Plain English, kept short. Drafts written for Luke to have checked:
// they describe what the app actually does today (see docs/status-2026-10-30.md), so
// update them when that changes (a new service, payments, a new place data is stored).
import { ArrowLeft } from 'lucide-react'
import { Mark } from './ui'

const UPDATED = '24 November 2026'
// The contact address for privacy questions. Empty until the new UNFNSHD email is set up.
const CONTACT_EMAIL = ''

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">{CONTACT_EMAIL}</a>
    : <span>our contact email, which is being set up and will be listed here</span>
}

function H({ children }) {
  return <h2 className="mt-10 text-[20px] font-bold text-ink">{children}</h2>
}
function P({ children }) {
  return <p className="mt-3 text-[16px] leading-relaxed text-muted">{children}</p>
}
function L({ items }) {
  return (
    <ul className="mt-3 space-y-2 list-disc pl-5 text-[16px] leading-relaxed text-muted marker:text-faint">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  )
}

function Privacy() {
  return (
    <>
      <P>UNFNSHD is coaching software: coaches use it to train and look after their clients, and clients use it to follow their program and stay in touch with their coach. This policy explains what information we hold, why, where it is kept and who can see it. We follow the Australian Privacy Principles.</P>

      <H>What we collect</H>
      <L items={[
        'Account details: name, email address and a password (stored scrambled, never readable).',
        'What a coach enters about a client: name, email, phone, goals, notes and anything relevant to training safely, such as injuries or limitations.',
        'What a client enters: workouts and sets, check-ins and their answers, daily energy, sleep and soreness, body weight, measurements, progress photos, food and water, habits and messages.',
        'If you turn on notifications: a code from your browser that lets us send them, and your time zone so they arrive at the right time.',
        'Error reports when something in the app breaks, with no names, emails or other personal details in them, and no IP addresses kept.',
        'Visits to the public pages (this site\'s home, sign-in and these pages): page counts only, with no cookies and nothing that identifies you. Nothing is measured inside the app.',
      ]} />
      <P>Some of this, like weight, measurements, photos and how you are feeling, is health information. We only collect it so you and your coach can use the app, and only because you or your coach enter it.</P>

      <H>Who can see it</H>
      <L items={[
        'A client and their coach. Coaches only ever see their own clients. Clients only see their own information.',
        'Progress photos are private to the client and their coach.',
        'We can access information when we need to keep the app running or fix a problem, and for nothing else.',
        'We never sell information, and there are no ads.',
      ]} />

      <H>Services we use, and where information is kept</H>
      <P>Your information is stored and handled by these services on our behalf. Some are outside Australia.</P>
      <L items={[
        'Supabase: the database, sign-in and photo storage. Servers in Mumbai, India.',
        'Vercel: hosts the app and counts visits to the public pages. Servers around the world.',
        'Resend: sends sign-up and password emails. Servers in Tokyo, Japan.',
        'Sentry: receives error reports, without personal details.',
        'Anthropic: if you use the AI workout or meal ideas, the request you type (and your nutrition targets, for meal ideas) is sent to Anthropic in the United States to write a reply.',
        'Open Food Facts: when you scan a barcode, only the barcode number is sent to look up the food.',
        'Unsplash: recipe photos load from Unsplash.',
      ]} />

      <H>How long we keep it</H>
      <P>For as long as the account is open. When a coach ends coaching with a client, the client's history is kept so it is not lost. You can ask us to delete your account and information at any time, and we will, unless the law requires us to keep something.</P>

      <H>Your rights</H>
      <P>You can ask to see the information we hold about you, ask us to correct it, or ask us to delete it. Contact us at <Contact />. If you are not happy with how we handle a privacy concern, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).</P>
    </>
  )
}

function Terms() {
  return (
    <>
      <P>These terms apply to anyone using UNFNSHD. By creating an account or using the app you agree to them.</P>

      <H>Who it is for</H>
      <L items={[
        'Coaches: personal trainers and coaches aged 18 or over, coaching their own clients.',
        'Clients: people invited by their coach. A client under 18 needs a parent or guardian\'s agreement.',
      ]} />

      <H>Coaches</H>
      <L items={[
        'You are responsible for the coaching you give and the programs you set. UNFNSHD is a tool to help you do it.',
        'You must have your clients\' agreement to store their information in UNFNSHD, and only add information you need to coach them.',
        'Keep your password to yourself. You are responsible for what happens in your account.',
      ]} />

      <H>Not medical advice</H>
      <P>Nothing in UNFNSHD, including the ready-made programs, meal plans, calorie targets and AI ideas, is medical advice. Check with a doctor before starting a new exercise or eating plan, especially with an injury or health condition.</P>

      <H>Beta and payment</H>
      <P>UNFNSHD is in beta. Founding coaches use it free during the beta. We will give you notice before any charges start, and nothing is charged without you choosing a plan. Features may change while we build.</P>

      <H>Fair use</H>
      <P>Don't misuse the app: no trying to get into accounts that aren't yours, no harmful or unlawful content, and no copying or reselling the app. We can suspend an account that breaks these terms.</P>

      <H>Things we can't promise</H>
      <P>We work hard to keep UNFNSHD running and your information safe, but we can't promise it will never be unavailable or never have a fault. To the extent the law allows, we are not responsible for indirect losses. Nothing in these terms takes away your rights under the Australian Consumer Law.</P>

      <H>Ending your account</H>
      <P>You can stop using UNFNSHD at any time and ask us to delete your account. Contact us at <Contact />.</P>

      <H>The law that applies</H>
      <P>These terms are governed by the law of South Australia.</P>
    </>
  )
}

export default function LegalPage({ kind }) {
  const privacy = kind === 'privacy'
  return (
    <div className="min-h-dvh bg-bg text-ink px-4 sm:px-6 pt-[max(env(safe-area-inset-top),24px)] pb-16">
      <div className="max-w-[720px] mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={18} /> Back
        </a>
        <div className="mt-10 flex items-center gap-2">
          <Mark size={26} />
          <span className="font-display text-[20px] leading-none pt-0.5">UNFNSHD</span>
        </div>
        <h1 className="mt-6 font-display text-[clamp(36px,8vw,52px)] leading-[1]">{privacy ? 'Privacy policy' : 'Terms of use'}</h1>
        <p className="mt-2 text-[14px] text-faint">Last updated {UPDATED}</p>
        {privacy ? <Privacy /> : <Terms />}
      </div>
    </div>
  )
}
