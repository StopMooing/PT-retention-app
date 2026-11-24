// A small pill at the top of every screen in the demo: what this is, switch sides, leave.
import { useState } from 'react'
import { X, ArrowLeftRight } from 'lucide-react'
import { demoRole, startDemo, exitDemo } from './demo.js'

export default function DemoBanner() {
  const [small, setSmall] = useState(false)
  const role = demoRole()
  if (!role) return null
  const other = role === 'coach' ? 'client' : 'coach'
  return (
    <div className="fixed top-[max(env(safe-area-inset-top),6px)] left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-tan text-on-tan shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] pl-3.5 pr-1 h-9 text-[13px] font-bold whitespace-nowrap">
        <button onClick={() => setSmall((s) => !s)} className="pr-1">{small ? 'Demo' : 'Demo with made-up data'}</button>
        {!small && (
          <button onClick={() => startDemo(other)} className="h-7 px-2.5 rounded-full hover:bg-on-tan/10 inline-flex items-center gap-1">
            <ArrowLeftRight size={13} /> {other === 'client' ? 'Client app' : 'Coach side'}
          </button>
        )}
        <button onClick={exitDemo} aria-label="Leave the demo" className="h-7 px-2.5 rounded-full hover:bg-on-tan/10 inline-flex items-center gap-1">
          <X size={14} /> {small ? '' : 'Leave'}
        </button>
      </div>
    </div>
  )
}
