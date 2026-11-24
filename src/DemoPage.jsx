// /demo: look around UNFNSHD before signing up, as a coach or as a client, on made-up data.
// See src/demo/demo.js.
import { ArrowLeft, LayoutDashboard, Smartphone } from 'lucide-react'
import { Mark } from './ui'
import { startDemo } from './demo/demo.js'

function Choice({ icon: Icon, title, body, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-[24px] border border-line bg-surface p-5 flex items-start gap-4 hover:border-ink transition-colors">
      <span className="w-12 h-12 rounded-[16px] bg-accent-soft text-accent flex items-center justify-center shrink-0"><Icon size={23} /></span>
      <span>
        <span className="block text-[18px] font-bold text-ink">{title}</span>
        <span className="block mt-1 text-[15px] leading-relaxed text-muted">{body}</span>
      </span>
    </button>
  )
}

export default function DemoPage() {
  return (
    <div className="min-h-dvh bg-bg text-ink px-4 sm:px-6 pt-[max(env(safe-area-inset-top),24px)] pb-10">
      <div className="max-w-[560px] mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={18} /> Back
        </a>
        <div className="mt-10 flex items-center gap-2">
          <Mark size={30} />
          <span className="font-display text-[24px] leading-none pt-0.5">UNFNSHD</span>
        </div>
        <h1 className="mt-6 font-display text-[clamp(38px,10vw,56px)] leading-[0.98]">Look around.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          A coach called Sam and six made-up clients. Tap anything, build a workout, send a message. Nothing is saved and none of it is real, so you can't break anything.
        </p>
        <div className="mt-8 space-y-3">
          <Choice icon={LayoutDashboard} title="The coach side" body="Who needs you today, check-ins to reply to, programs and every client." onClick={() => startDemo('coach')} />
          <Choice icon={Smartphone} title="The client app" body="What Jane sees on her phone: her week, her workout, her food and her coach." onClick={() => startDemo('client')} />
        </div>
        <p className="mt-6 text-[14px] text-muted">Best on a computer for the coach side, and on a phone for the client app.</p>
      </div>
    </div>
  )
}
