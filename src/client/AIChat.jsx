// AI helper chat: builds custom workouts (mode "workout") or meal ideas (mode "nutrition").
// Talks to /api/chat, which only works on deployed URLs, not localhost.
import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Plus } from 'lucide-react'
import { supabase } from '../supabase'
import { Button } from '../ui'
import { Overlay, BackHeader } from './common'
import { parseAiJson } from './foods'

// True only when the reply holds something that can be saved: a workout with exercises
// (mode "workout") or a plan with meals (mode "nutrition"). Questions and errors are not.
function isSaveable(content, mode) {
  const p = parseAiJson(content)
  if (!p) return false
  if (mode === 'workout') return !!p.title && Array.isArray(p.exercises) && p.exercises.some((e) => e?.name)
  if (mode === 'nutrition') return Array.isArray(p.meals) && p.meals.some((m) => m?.name)
  return false
}

function AssistantMessage({ content }) {
  const parsed = parseAiJson(content)
  const textOnly = parsed ? content.replace(/\{[\s\S]*\}/, '').replace(/```json/gi, '').replace(/```/g, '').trim() : content
  if (parsed?.title && Array.isArray(parsed?.exercises)) {
    return (
      <div>
        {textOnly && <p className="whitespace-pre-wrap mb-3">{textOnly}</p>}
        <p className="font-bold mb-2">{parsed.title}</p>
        <ul className="space-y-1.5">
          {parsed.exercises.map((ex, i) => (
            <li key={i} className="text-[13px]">
              <span className="font-bold">{ex.name}</span>
              <span className="text-muted">{ex.sets > 0 ? `, ${ex.sets} x ${ex.reps}` : `, ${ex.reps}`}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (parsed?.title && Array.isArray(parsed?.meals)) {
    return (
      <div>
        {textOnly && <p className="whitespace-pre-wrap mb-3">{textOnly}</p>}
        <p className="font-bold mb-2">{parsed.title}</p>
        <ul className="space-y-2">
          {parsed.meals.map((m, i) => (
            <li key={i} className="text-[13px]">
              <span className="font-bold capitalize">{m.meal_type}: </span>
              <span className="font-bold">{m.name}</span>
              <span className="text-muted"> · {m.calories} kcal · P {m.protein_g}g · C {m.carbs_g}g · F {m.fats_g}g</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return <p className="whitespace-pre-wrap">{content}</p>
}

export default function AIChat({ context, placeholder, mode, onClose, onSave, saveLabel }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode, messages: [...messages.filter((m) => !m.failed), userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Request failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
    } catch (e) {
      console.error(e)
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, that didn't come through. Try sending it again.", failed: true }])
    }
    setLoading(false)
  }

  const last = messages[messages.length - 1]
  const [saving, setSaving] = useState(false)
  const canSave = !!onSave && !loading && last?.role === 'assistant' && !last.failed && isSaveable(last.content, mode)

  async function save() {
    setSaving(true)
    try { await onSave(last.content) } finally { setSaving(false) }
  }

  return (
    <Overlay z="z-50">
      <BackHeader onBack={onClose} eyebrow="AI helper" title={context} right={<Sparkles size={20} className="text-accent shrink-0" />} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center pt-10 px-6">
            <span className="w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </span>
            <p className="font-bold text-ink">What would you like?</p>
            <p className="text-sm text-muted mt-1">{placeholder}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[15px] leading-relaxed ${
                msg.role === 'user' ? 'bg-accent text-on-accent rounded-br-md' : 'bg-surface border border-line text-ink rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? <AssistantMessage content={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
            </div>
          </div>
        ))}
        {canSave && (
          <Button variant="soft" size="sm" onClick={save} disabled={saving}>
            <Plus size={16} /> {saving ? 'Saving...' : saveLabel}
          </Button>
        )}
        {loading && (
          <div className="flex gap-1 px-4 py-3 bg-surface border border-line rounded-[20px] rounded-bl-md w-fit">
            {[0, 150, 300].map((d) => (
              <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="Type a message"
            className="flex-1 h-12 px-4 rounded-full border border-line-strong bg-bg text-ink placeholder:text-faint outline-none focus:border-accent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="w-12 h-12 rounded-full bg-accent text-on-accent flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </Overlay>
  )
}
