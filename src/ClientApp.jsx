import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { Home, Calendar, Dumbbell, Utensils, BookOpen, ArrowLeft, Check, CheckCircle2, Clock, ChevronRight, Plus, X, Send, Mic, Camera, Upload, ExternalLink, FileText, Headphones, Globe, Play, Target, Flame, Droplets, Search } from 'lucide-react'

const TABS = ['home', 'calendar', 'program', 'nutrition', 'database']

const MUSCLE_CHIP = {
  Chest: 'bg-blue-50 text-blue-700',
  Back: 'bg-purple-50 text-purple-700',
  Shoulders: 'bg-amber-50 text-amber-700',
  Biceps: 'bg-pink-50 text-pink-700',
  Triceps: 'bg-orange-50 text-orange-700',
  Legs: 'bg-indigo-50 text-indigo-700',
  Glutes: 'bg-rose-50 text-rose-700',
  Core: 'bg-teal-50 text-teal-700',
  Cardio: 'bg-red-50 text-red-700',
  'Full Body': 'bg-emerald-50 text-emerald-700',
  Other: 'bg-gray-100 text-gray-600',
}

const RESOURCE_ICONS = {
  pdf: FileText,
  podcast: Headphones,
  article: Globe,
  video: Play,
  other: BookOpen,
}

const RESOURCE_COLOURS = {
  pdf: 'bg-red-50 text-red-600 border-red-100',
  podcast: 'bg-purple-50 text-purple-600 border-purple-100',
  article: 'bg-blue-50 text-blue-600 border-blue-100',
  video: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function toLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function workoutKey(programWorkoutId, scheduledWorkoutId, dateStr) {
  const base = programWorkoutId || scheduledWorkoutId || 'unknown'
  return `${base}_${dateStr}`
}

function isToday(dateStr) {
  return dateStr === toLocalDateStr()
}

function isPast(dateStr) {
  return dateStr < toLocalDateStr()
}

// ─── PROFILE PHOTO COMPONENT ─────────────────────────────────────────────────
function ProfilePhoto({ client, size = 'md', onUpdate }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base'

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !client) return
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/profile.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path)
      await supabase.from('clients').update({ profile_photo_url: publicUrl }).eq('id', client.id)
      onUpdate && onUpdate(publicUrl)
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  const initials = client?.full_name?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?'

  return (
    <div className="relative inline-block">
      <div className={`${dim} rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 flex-shrink-0`}>
        {client?.profile_photo_url ? (
          <img src={client.profile_photo_url} alt={client.full_name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {onUpdate && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
          >
            {uploading
              ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={10} className="text-white" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </>
      )}
    </div>
  )
}

// ─── AI CHAT COMPONENT ────────────────────────────────────────────────────────
function AIChat({ context, placeholder, systemPrompt, onClose, onSave, saveLabel }) {
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
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt || 'You are a helpful fitness and nutrition coach assistant. Give practical, specific, actionable advice. Keep responses concise and friendly.',
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Request failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">AI Assistant</p>
          <p className="text-xs text-gray-400">{context}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-base">✨</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">How can I help you?</p>
            <p className="text-xs text-gray-400 mt-1">{placeholder || 'Ask me anything about your fitness or nutrition.'}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (() => {
                let parsed = null
                try {
                  const jsonMatch = msg.content.match(/\{[\s\S]*\}/)
                  if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
                } catch (e) {}
                if (parsed?.title && Array.isArray(parsed?.exercises)) {
                  return (
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-2">{parsed.title}</p>
                      <div className="space-y-1.5">
                        {parsed.exercises.map((ex, i) => (
                          <div key={i} className="text-xs text-gray-700">
                            <span className="font-semibold">{ex.name}</span>
                            {ex.sets > 0 && <span className="text-gray-500"> — {ex.sets} sets × {ex.reps}</span>}
                            {ex.sets === 0 && <span className="text-gray-500"> — {ex.reps}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
              })() : <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>}
            </div>
          </div>
        ))}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && onSave && !loading && (
          <div className="flex justify-start">
            <button
              onClick={() => onSave(messages[messages.length - 1].content)}
              className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors ml-1"
            >
              <Plus size={12} /> {saveLabel || 'Save this workout'}
            </button>
          </div>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
            placeholder={placeholder || 'Type a message...'}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── WORKOUT LOGGING VIEW ─────────────────────────────────────────────────────
function WorkoutComplete({ workoutName, stats, onDone }) {
  const { newPBs = [], totalVolume = 0, setsCompleted = 0, exerciseCount = 0 } = stats || {}
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-5">
        <div className="text-center pt-8">
          <div className="text-6xl mb-4">🏋️</div>
          <h1 className="text-2xl font-black text-gray-900">Session Complete!</h1>
          <p className="text-gray-400 mt-1 text-sm">{workoutName}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sets Done', value: setsCompleted, icon: '✅' },
            { label: 'Exercises', value: exerciseCount, icon: '💪' },
            { label: 'Volume', value: totalVolume > 0 ? `${Math.round(totalVolume)}kg` : '—', icon: '📊' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
              <p className="text-lg mb-1">{s.icon}</p>
              <p className="text-lg font-black text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        {newPBs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">🏆 Personal Bests</p>
            {newPBs.map((pb, i) => {
              const PB_LABELS = {
                '1rm': { label: 'Estimated 1RM', emoji: '🏋️', desc: 'Heaviest estimated single rep' },
                'best_set': { label: 'Best Set', emoji: '💥', desc: 'Highest weight × reps score' },
                'volume': { label: 'Session Volume', emoji: '📈', desc: 'Total kg moved this session' },
              }
              const pbMeta = PB_LABELS[pb.type] || { label: pb.label, emoji: '🏆', desc: '' }
              return (
                <div key={i} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{pbMeta.emoji}</span>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">{pbMeta.label}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{pb.exerciseName}</p>
                      <p className="text-xs text-yellow-600 font-semibold mt-0.5">
                        {pb.isFirst
                          ? `🌟 First time logged · ${pbMeta.desc}`
                          : `${pb.previous}${pb.unit} → ${pb.value}${pb.unit}`
                        }
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-orange-500">{pb.value}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{pb.unit}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {newPBs.length === 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-sm font-semibold text-blue-700">Keep going — PBs come with consistency! 💪</p>
            <p className="text-xs text-blue-400 mt-1">Log weights each session to track your progress</p>
          </div>
        )}
        <div className="h-8" />
      </div>
      <div className="px-4 pb-8 pt-3 border-t border-gray-100">
        <button onClick={onDone}
          className="w-full bg-black hover:bg-gray-800 text-white text-base font-bold py-4 rounded-2xl transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  )
}

function WorkoutPreview({ scheduledWorkout, exercises, client, onBack, onStart }) {
  const isCustom = scheduledWorkout._isCustom || !scheduledWorkout.program_workout_id
  const customContent = scheduledWorkout._customWorkout?.content || scheduledWorkout.saved_workouts?.content || null
  const workoutName = scheduledWorkout.program_workouts?.name || scheduledWorkout._customWorkout?.name || scheduledWorkout.saved_workouts?.name || 'Workout'
  const scheduledDate = scheduledWorkout.scheduled_date
  const dateLabel = scheduledDate ? new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

  const estMin = isCustom
    ? null
    : Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)

  const muscleGroups = isCustom
    ? []
    : [...new Set(exercises.map(ex => ex.exercises?.muscle_group).filter(Boolean))]

  const MUSCLE_COLOURS = {
    Chest: 'bg-red-50 text-red-600',
    Back: 'bg-blue-50 text-blue-600',
    Shoulders: 'bg-purple-50 text-purple-600',
    Legs: 'bg-emerald-50 text-emerald-600',
    Arms: 'bg-orange-50 text-orange-600',
    Core: 'bg-yellow-50 text-yellow-600',
    Glutes: 'bg-pink-50 text-pink-600',
    Other: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
          <h1 className="text-lg font-bold text-gray-900 truncate">{workoutName}</h1>
        </div>
      </div>

      {/* Stats row */}
      {!isCustom && (
        <div className="grid grid-cols-3 gap-3 px-4 py-4 border-b border-gray-100">
          <div className="text-center">
            <p className="text-xl font-black text-gray-900">{exercises.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">Exercises</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xl font-black text-gray-900">{estMin ?? '—'}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">Est. Min</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-gray-900">
              {exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">Total Sets</p>
          </div>
        </div>
      )}

      {/* Muscle groups */}
      {muscleGroups.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Muscles:</p>
          {muscleGroups.map(mg => (
            <span key={mg} className={`text-[10px] font-bold px-2 py-1 rounded-full ${MUSCLE_COLOURS[mg] ?? MUSCLE_COLOURS.Other}`}>
              {mg}
            </span>
          ))}
        </div>
      )}

      {/* Exercise list or AI content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isCustom && customContent ? (() => {
          let parsed = null
          try {
            const jsonMatch = customContent.match(/\{[\s\S]*\}/)
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
          } catch (e) {}
          if (parsed?.title && Array.isArray(parsed?.exercises)) {
            return (
              <div className="space-y-3">
                {parsed.exercises.map((ex, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {ex.sets > 0 && <span className="text-xs text-gray-500">{ex.sets} sets × {ex.reps} reps</span>}
                        {ex.sets === 0 && <span className="text-xs text-gray-500">{ex.reps}</span>}
                        {ex.rest_seconds > 0 && <span className="text-xs text-gray-400">· {ex.rest_seconds}s rest</span>}
                      </div>
                      {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout Plan</p>
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{customContent}</pre>
            </div>
          )
        })() : exercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No exercises loaded.</p>
          </div>
        ) : (
          exercises.map((ex, idx) => {
            const muscle = ex.exercises?.muscle_group
            const chipClass = MUSCLE_COLOURS[muscle] ?? MUSCLE_COLOURS.Other
            return (
              <div key={ex.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{ex.exercises?.name || 'Exercise'}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {muscle && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chipClass}`}>{muscle}</span>
                    )}
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      {ex.sets} sets × {ex.reps} reps
                    </span>
                    {ex.rest_seconds && (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        {ex.rest_seconds}s rest
                      </span>
                    )}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-gray-400 mt-1.5 italic">{ex.notes}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div className="h-24" />
      </div>

      {/* Start button pinned to bottom */}
      <div className="px-4 pb-8 pt-3 border-t border-gray-100 bg-white">
        <button
          onClick={onStart}
          className="w-full bg-black hover:bg-gray-800 text-white text-base font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Dumbbell size={18} />
          Start Workout
        </button>
      </div>
    </div>
  )
}

function WorkoutLogging({ scheduledWorkout, exercises, client, onBack, onComplete }) {
  const isCustom = scheduledWorkout._isCustom || !scheduledWorkout.program_workout_id
  const customContent = scheduledWorkout._customWorkout?.content || scheduledWorkout.saved_workouts?.content || null
  const workoutName = scheduledWorkout.program_workouts?.name || scheduledWorkout._customWorkout?.name || scheduledWorkout.saved_workouts?.name || 'Workout'

  const [setData, setSetData] = useState({})
  const [completing, setCompleting] = useState(false)
  const [previousSets, setPreviousSets] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [restInterval, setRestInterval] = useState(null)
  const [activeSet, setActiveSet] = useState(null)
  const [aiExercises, setAiExercises] = useState(null)
  const [aiParseError, setAiParseError] = useState(false)

  const trackedExercises = isCustom ? (aiExercises || []) : exercises
  const hasSetTracking = !isCustom || (aiExercises !== null && !aiParseError)

  useEffect(() => {
    async function loadPreviousData() {
      if (!client?.id) return
      const target = trackedExercises
      if (!target.length) return
      const wantedIds = target
        .map(ex => ex.exercise_id ?? ex.exercises?.id)
        .filter(Boolean)
      if (!wantedIds.length) { setPreviousSets({}); return }
      const { data: setRows } = await supabase
        .from('workout_set_logs')
        .select('exercise_id, set_number, weight_kg, reps_completed, logged_at')
        .eq('client_id', client.id)
        .in('exercise_id', wantedIds)
        .lt('logged_at', new Date().toISOString())
        .order('logged_at', { ascending: false })
        .order('set_number', { ascending: true })
      const latestSessionDate = {}
      const prev = {}
      for (const row of setRows ?? []) {
        const eid = row.exercise_id
        const dateStr = toLocalDateStr(new Date(row.logged_at))
        if (!latestSessionDate[eid]) latestSessionDate[eid] = dateStr
        if (dateStr !== latestSessionDate[eid]) continue
        if (!prev[eid]) prev[eid] = []
        prev[eid].push({ reps: row.reps_completed, weight_kg: row.weight_kg, set_number: row.set_number })
      }
      for (const eid of Object.keys(prev)) {
        prev[eid].sort((a, b) => a.set_number - b.set_number)
      }
      setPreviousSets(prev)
    }
    loadPreviousData()
  }, [trackedExercises, client?.id])

  useEffect(() => {
    if (!isCustom || !customContent) return
    let cancelled = false
    const failSafe = setTimeout(() => {
      if (!cancelled) setAiParseError(true)
    }, 10000)
    async function buildAiExercises() {
      try {
        let parsed = null
        try {
          const jsonMatch = customContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const p = JSON.parse(jsonMatch[0])
            if (p && Array.isArray(p.exercises) && p.exercises.length > 0) parsed = p
          }
        } catch (e) {
          console.warn('AI workout JSON parse failed:', e)
        }
        if (!parsed) {
          if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) }
          return
        }

        const names = parsed.exercises
          .map(e => (e?.name ?? '').trim())
          .filter(Boolean)

        const resolvedMap = {}
        try {
          const { data: resolved, error } = await supabase.rpc('resolve_exercise_ids', { p_names: names })
          if (error) console.error('resolve_exercise_ids error:', error)
          for (const row of resolved ?? []) {
            const key = (row?.input_name ?? '').trim().toLowerCase()
            if (key) resolvedMap[key] = row
          }
        } catch (e) {
          console.error('resolve_exercise_ids exception:', e)
        }

        const built = parsed.exercises.map((e, idx) => {
          const name = (e?.name ?? 'Exercise').trim()
          const match = resolvedMap[name.toLowerCase()] || {}
          const resolvedId = match.exercise_id || null
          return {
            id: `ai_${idx}`,
            exercise_id: resolvedId,
            exercises: { id: resolvedId, name, muscle_group: match.muscle_group || null },
            sets: parseInt(e?.sets, 10) || 1,
            reps: String(e?.reps ?? ''),
            rest_seconds: e?.rest_seconds || null,
            notes: e?.notes || null,
          }
        })

        if (!cancelled) { clearTimeout(failSafe); setAiExercises(built) }
      } catch (e) {
        console.error('buildAiExercises fatal error:', e)
        if (!cancelled) { clearTimeout(failSafe); setAiParseError(true) }
      }
    }
    buildAiExercises()
    return () => { cancelled = true; clearTimeout(failSafe) }
  }, [isCustom, customContent])

  useEffect(() => {
    return () => { if (restInterval) clearInterval(restInterval) }
  }, [restInterval])

  function startRestTimer(seconds) {
    if (restInterval) clearInterval(restInterval)
    setRestTimer(seconds)
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setRestInterval(null); return null }
        return prev - 1
      })
    }, 1000)
    setRestInterval(interval)
  }

  function updateSet(rowKey, setNumber, field, value) {
    setSetData(prev => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        [setNumber]: { ...(prev[rowKey]?.[setNumber] || {}), [field]: value }
      }
    }))
  }

  function markSetDone(ex, setNumber, restSeconds) {
    const rowKey = ex.id
    const exerciseId = ex.exercise_id ?? ex.exercises?.id ?? null
    const prevSet = (previousSets[exerciseId] || [])[setNumber - 1]
    const current = setData[rowKey]?.[setNumber] || {}
    if ((current.weight === undefined || current.weight === '') && prevSet?.weight_kg > 0) {
      updateSet(rowKey, setNumber, 'weight', String(prevSet.weight_kg))
    }
    if ((current.reps === undefined || current.reps === '') && prevSet?.reps) {
      updateSet(rowKey, setNumber, 'reps', String(prevSet.reps))
    }
    updateSet(rowKey, setNumber, 'done', true)
    setActiveSet({ rowKey, setNumber })
    if (restSeconds) startRestTimer(restSeconds)
  }

  const totalSetsCount = trackedExercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
  const doneSetsCount = Object.values(setData).reduce((sum, ex) =>
    sum + Object.values(ex).filter(s => s.done).length, 0)
  const allDone = hasSetTracking && totalSetsCount > 0 && doneSetsCount >= totalSetsCount
  const progressPct = totalSetsCount > 0 ? Math.round((doneSetsCount / totalSetsCount) * 100) : 0

  async function handleComplete() {
    setCompleting(true)
    try {
      let totalVolume = 0
      const setLogsToInsert = []
      for (const ex of trackedExercises) {
        const rowKey = ex.id
        const exerciseId = ex.exercise_id || ex.exercises?.id
        if (!exerciseId) continue
        const exSets = setData[rowKey] || {}
        const prevSetsForEx = previousSets[exerciseId] || []
        for (let s = 1; s <= (ex.sets || 0); s++) {
          const set = exSets[s] || {}
          const prevSet = prevSetsForEx[s - 1]
          let reps = parseFloat(set.reps) || 0
          let weight = parseFloat(set.weight) || 0
          if (reps < 0) reps = 0; if (reps > 100) reps = 100
          if (weight < 0) weight = 0; if (weight > 500) weight = 500
          totalVolume += reps * weight
          setLogsToInsert.push({ client_id: client.id, scheduled_workout_id: scheduledWorkout.id, exercise_id: exerciseId, set_number: s, reps_completed: reps, weight_kg: weight, logged_at: new Date().toISOString() })
        }
      }
      if (setLogsToInsert.length > 0) {
        try {
          const { error: setsError } = await supabase.from('workout_set_logs').insert(setLogsToInsert)
          if (setsError) console.error('workout_set_logs error:', setsError)
        } catch (e) { console.error('workout_set_logs exception:', e) }
      }

      const newPBs = []
      for (const ex of trackedExercises) {
        const rowKey = ex.id
        const exerciseId = ex.exercise_id || ex.exercises?.id
        if (!exerciseId) continue
        const exSets = setData[rowKey] || {}
        const exerciseName = ex.exercises?.name || 'Exercise'
        let best1RM = 0, bestSet = 0, sessionVolume = 0
        for (let s = 1; s <= (ex.sets || 0); s++) {
          const set = exSets[s] || {}
          const reps = parseFloat(set.reps) || parseFloat(ex.reps) || 0
          const weight = parseFloat(set.weight) || 0
          if (weight === 0) continue
          const estimated1RM = reps === 1 ? weight : weight * (1 + reps / 30)
          if (estimated1RM > best1RM) best1RM = estimated1RM
          const setScore = weight * reps
          if (setScore > bestSet) bestSet = setScore
          sessionVolume += reps * weight
        }
        const pbChecks = []
        if (best1RM > 0) pbChecks.push({ type: '1rm', value: Math.round(best1RM * 10) / 10, label: 'Estimated 1RM', unit: 'kg' })
        if (bestSet > 0) pbChecks.push({ type: 'best_set', value: bestSet, label: 'Best Set Score', unit: 'pts' })
        if (sessionVolume > 0) pbChecks.push({ type: 'volume', value: Math.round(sessionVolume), label: 'Session Volume', unit: 'kg' })
        for (const check of pbChecks) {
          const { data: existing } = await supabase.from('personal_bests').select('value').eq('client_id', client.id).eq('exercise_id', exerciseId).eq('pb_type', check.type).maybeSingle()
          if (!existing || check.value > existing.value) {
            await supabase.from('personal_bests').upsert({ client_id: client.id, exercise_id: exerciseId, pb_type: check.type, value: check.value, achieved_at: new Date().toISOString(), scheduled_workout_id: scheduledWorkout.id }, { onConflict: 'client_id,exercise_id,pb_type' })
            const celebrateTypes = ['1rm', 'volume']
            if (celebrateTypes.includes(check.type)) {
              if (!existing) {
                newPBs.push({ exerciseName, type: check.type, value: check.value, unit: check.unit, label: check.label, isFirst: true })
              } else {
                newPBs.push({ exerciseName, type: check.type, value: check.value, unit: check.unit, label: check.label, previous: existing.value, isFirst: false })
              }
            }
          }
        }
      }

      try {
        const { error: logError } = await supabase.from('workout_logs').insert({
          client_id: client.id,
          program_workout_id: scheduledWorkout.program_workout_id ?? null,
          scheduled_workout_id: scheduledWorkout.id ?? null,
          logged_at: new Date().toISOString(),
          completed: true,
          total_volume_kg: totalVolume,
        })
        if (logError) console.error('workout_logs insert error:', logError)
      } catch (logErr) {
        console.error('workout_logs insert exception:', logErr)
      }
      onComplete && onComplete(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs, totalVolume, setsCompleted: doneSetsCount, exerciseCount: trackedExercises.length, workoutName })
    } catch (e) {
      console.error('Complete error:', e)
      alert('Something went wrong: ' + e.message)
    }
    setCompleting(false)
  }

  async function handleCompleteCustom() {
    setCompleting(true)
    try {
      try {
        const { error: logError } = await supabase.from('workout_logs').insert({
          client_id: client.id,
          program_workout_id: scheduledWorkout.program_workout_id ?? null,
          scheduled_workout_id: scheduledWorkout.id ?? null,
          logged_at: new Date().toISOString(),
          completed: true,
          total_volume_kg: 0,
        })
        if (logError) console.error('workout_logs insert error:', logError)
      } catch (logErr) {
        console.error('workout_logs insert exception:', logErr)
      }
      onComplete && onComplete(workoutKey(scheduledWorkout.program_workout_id, scheduledWorkout.id, scheduledWorkout.scheduled_date), { newPBs: [], totalVolume: 0, setsCompleted: 0, exerciseCount: 0, workoutName })
    } catch (e) {
      console.error('Complete error:', e)
      alert('Something went wrong: ' + e.message)
    }
    setCompleting(false)
  }

  const MUSCLE_COLOURS = {
    Chest: 'bg-red-50 text-red-600', Back: 'bg-blue-50 text-blue-600',
    Shoulders: 'bg-purple-50 text-purple-600', Legs: 'bg-emerald-50 text-emerald-600',
    Arms: 'bg-orange-50 text-orange-600', Core: 'bg-yellow-50 text-yellow-600',
    Glutes: 'bg-pink-50 text-pink-600', Other: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{workoutName}</h1>
          {hasSetTracking && <p className="text-xs text-gray-400 mt-0.5">{doneSetsCount}/{totalSetsCount} sets completed</p>}
        </div>
        {hasSetTracking && totalSetsCount > 0 && (
          <div className="flex-shrink-0 w-10 h-10 relative">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${progressPct * 0.942} 94.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-600">{progressPct}%</span>
          </div>
        )}
      </div>

      {restTimer !== null && (
        <div className="bg-emerald-500 px-4 py-2 flex items-center justify-between">
          <p className="text-sm font-bold text-white">Rest timer</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black text-white tabular-nums">{restTimer}s</p>
            <button onClick={() => { if (restInterval) clearInterval(restInterval); setRestTimer(null) }}
              className="text-emerald-100 text-xs font-semibold border border-emerald-300 px-2 py-1 rounded-lg">Skip</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isCustom && aiParseError ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout Plan</p>
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{customContent}</pre>
            </div>
            <button onClick={handleCompleteCustom} disabled={completing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {completing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><CheckCircle2 size={20} />Complete Workout</>}
            </button>
          </div>
        ) : isCustom && aiExercises === null ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          trackedExercises.map((ex, idx) => {
            const rowKey = ex.id
            const exerciseId = ex.exercise_id || ex.exercises?.id
            const exSetData = setData[rowKey] || {}
            const prevSets = previousSets[exerciseId] || []
            const muscle = ex.exercises?.muscle_group
            const chipClass = MUSCLE_COLOURS[muscle] ?? MUSCLE_COLOURS.Other
            return (
              <div key={rowKey} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{ex.exercises?.name || 'Exercise'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {muscle && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chipClass}`}>{muscle}</span>}
                      <span className="text-xs text-gray-400">{ex.sets} sets × {ex.reps} reps</span>
                      {ex.rest_seconds && <span className="text-xs text-gray-300">· {ex.rest_seconds}s rest</span>}
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {Array.from({ length: ex.sets || 0 }, (_, i) => {
                    const setNum = i + 1
                    const setInfo = exSetData[setNum] || {}
                    const isDone = !!setInfo.done
                    const prevSet = prevSets[i]
                    return (
                      <div key={setNum} className={`px-4 py-3 flex items-center gap-3 transition-colors ${isDone ? 'bg-emerald-50' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {isDone ? '✓' : setNum}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-1 flex-1">
                            <input type="number" step="0.5" min="0" max="500"
                              placeholder={prevSet?.weight_kg > 0 ? `${prevSet.weight_kg}` : ''}
                              value={setInfo.weight || ''}
                              onChange={e => { const v = e.target.value; if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 500)) updateSet(rowKey, setNum, 'weight', v) }}
                              disabled={isDone}
                              className={`w-16 border rounded-xl px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 ${isDone ? 'bg-gray-50 border-gray-100 text-gray-400' : 'border-gray-200'}`} />
                            <span className="text-xs text-gray-400 flex-shrink-0">kg</span>
                          </div>
                          <span className="text-gray-300 text-sm">×</span>
                          <div className="flex items-center gap-1 flex-1">
                            <input type="number" min="0" max="100"
                              placeholder={prevSet?.reps ? `${prevSet.reps}` : ''}
                              value={setInfo.reps || ''}
                              onChange={e => { const v = e.target.value; if (v === '' || (parseInt(v, 10) >= 0 && parseInt(v, 10) <= 100)) updateSet(rowKey, setNum, 'reps', v) }}
                              disabled={isDone}
                              className={`w-16 border rounded-xl px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 ${isDone ? 'bg-gray-50 border-gray-100 text-gray-400' : 'border-gray-200'}`} />
                            <span className="text-xs text-gray-400 flex-shrink-0">reps</span>
                          </div>
                        </div>
                        {!isDone ? (
                          <button onClick={() => markSetDone(ex, setNum, ex.rest_seconds)}
                            className="flex-shrink-0 bg-black text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">Done</button>
                        ) : (
                          <button onClick={() => updateSet(rowKey, setNum, 'done', false)}
                            className="flex-shrink-0 text-xs text-gray-400 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Undo</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
        <div className="h-32" />
      </div>

      {hasSetTracking && trackedExercises.length > 0 && (
        <div className="px-4 pb-8 pt-3 border-t border-gray-100 bg-white">
          {allDone ? (
            <button onClick={handleComplete} disabled={completing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              {completing
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving your session...</>
                : <><CheckCircle2 size={20} />Complete Workout</>}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-center text-xs text-gray-400 font-medium">
                Complete all {totalSetsCount} sets to finish. {totalSetsCount - doneSetsCount} to go.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DATE PICKER MODAL ────────────────────────────────────────────────────────
function DatePickerModal({ title, scheduledWorkouts, onConfirm, onCancel }) {
  const today = toLocalDateStr()
  const [selected, setSelected] = useState(today)

  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return toLocalDateStr(d)
  })

  const firstDay = new Date(days[0] + 'T00:00:00')
  const dow = firstDay.getDay()
  const startPad = dow === 0 ? 6 : dow - 1
  const busyDates = new Set((scheduledWorkouts ?? []).map(sw => sw.scheduled_date))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onCancel}>
      <div className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-7 mb-1">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(dateStr => {
            const isTodayDate = dateStr === today
            const isSelected = dateStr === selected
            const hasDot = busyDates.has(dateStr)
            const dayNum = parseInt(dateStr.split('-')[2])
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className={`h-10 flex flex-col items-center justify-center rounded-xl transition-colors ${
                  isSelected ? 'bg-black' : isTodayDate ? 'bg-emerald-500' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`text-xs font-semibold ${isSelected || isTodayDate ? 'text-white' : 'text-gray-700'}`}>
                  {dayNum}
                </span>
                {hasDot && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected || isTodayDate ? 'bg-white/70' : 'bg-gray-400'}`} />
                )}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-500 text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const COMMON_FOODS = [
  { name: 'Chicken breast, raw, skinless', brand: 'Whole food', calories: 110, protein: 23.1, carbs: 0, fats: 1.2 },
  { name: 'Chicken breast, cooked, skinless', brand: 'Whole food', calories: 157, protein: 32.1, carbs: 0, fats: 3.2 },
  { name: 'Chicken thigh, raw, skinless', brand: 'Whole food', calories: 130, protein: 19.7, carbs: 0, fats: 5.6 },
  { name: 'Chicken thigh, cooked, skinless', brand: 'Whole food', calories: 179, protein: 24.8, carbs: 0, fats: 8.9 },
  { name: 'Beef mince, lean, raw', brand: 'Whole food', calories: 149, protein: 20.7, carbs: 0, fats: 7.1 },
  { name: 'Beef steak, lean, raw', brand: 'Whole food', calories: 144, protein: 21.0, carbs: 0, fats: 6.3 },
  { name: 'Salmon, raw', brand: 'Whole food', calories: 208, protein: 20.0, carbs: 0, fats: 13.4 },
  { name: 'Tuna, canned in springwater', brand: 'Whole food', calories: 116, protein: 25.5, carbs: 0, fats: 0.8 },
  { name: 'Egg, whole, raw', brand: 'Whole food', calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5 },
  { name: 'Egg whites, raw', brand: 'Whole food', calories: 52, protein: 10.9, carbs: 0.7, fats: 0.2 },
  { name: 'White rice, cooked', brand: 'Whole food', calories: 130, protein: 2.7, carbs: 28.0, fats: 0.3 },
  { name: 'Brown rice, cooked', brand: 'Whole food', calories: 123, protein: 2.7, carbs: 25.6, fats: 1.0 },
  { name: 'Oats, rolled, dry', brand: 'Whole food', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9 },
  { name: 'Sweet potato, raw', brand: 'Whole food', calories: 86, protein: 1.6, carbs: 20.1, fats: 0.1 },
  { name: 'Potato, raw', brand: 'Whole food', calories: 77, protein: 2.0, carbs: 17.0, fats: 0.1 },
  { name: 'Broccoli, raw', brand: 'Whole food', calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4 },
  { name: 'Spinach, raw', brand: 'Whole food', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { name: 'Banana', brand: 'Whole food', calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3 },
  { name: 'Apple', brand: 'Whole food', calories: 52, protein: 0.3, carbs: 13.8, fats: 0.2 },
  { name: 'Greek yoghurt, plain, full fat', brand: 'Whole food', calories: 97, protein: 9.0, carbs: 3.6, fats: 5.0 },
  { name: 'Milk, full cream', brand: 'Whole food', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3 },
  { name: 'Cottage cheese, full fat', brand: 'Whole food', calories: 98, protein: 11.1, carbs: 3.4, fats: 4.3 },
  { name: 'Almonds, raw', brand: 'Whole food', calories: 579, protein: 21.2, carbs: 21.7, fats: 49.9 },
  { name: 'Peanut butter, no added salt', brand: 'Whole food', calories: 588, protein: 25.0, carbs: 20.0, fats: 50.0 },
  { name: 'Olive oil', brand: 'Whole food', calories: 884, protein: 0, carbs: 0, fats: 100.0 },
  { name: 'White bread', brand: 'Whole food', calories: 265, protein: 9.0, carbs: 49.0, fats: 3.2 },
  { name: 'Pasta, dry', brand: 'Whole food', calories: 371, protein: 13.0, carbs: 74.7, fats: 1.5 },
  { name: 'Whey protein powder', brand: 'Whole food', calories: 400, protein: 80.0, carbs: 8.0, fats: 5.0 },
  { name: 'Avocado', brand: 'Whole food', calories: 160, protein: 2.0, carbs: 8.5, fats: 14.7 },
  { name: 'Pork loin, lean, raw', brand: 'Whole food', calories: 143, protein: 21.3, carbs: 0, fats: 6.3 },
]

// ─── MAIN CLIENT APP ──────────────────────────────────────────────────────────
export default function ClientApp() {
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [programWorkouts, setProgramWorkouts] = useState([])
  const [scheduledWorkouts, setScheduledWorkouts] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState({})
  const [allProgramExercises, setAllProgramExercises] = useState({})
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [resources, setResources] = useState([])
  const [photoUrl, setPhotoUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('home')

  // Home
  const [weightInput, setWeightInput] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [todayWeight, setTodayWeight] = useState(null)

  // Calendar
  const [loggingWorkout, setLoggingWorkout] = useState(null)
  const [previewWorkout, setPreviewWorkout] = useState(null)
  const [workoutCompleteData, setWorkoutCompleteData] = useState(null)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [selectedCalDate, setSelectedCalDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  // Program
  const [programView, setProgramView] = useState('list')
  const [selectedProgramDay, setSelectedProgramDay] = useState(null)
  const [showWorkoutAI, setShowWorkoutAI] = useState(false)
  const [workoutLibrary, setWorkoutLibrary] = useState(null)
  useEffect(() => {
    if (!showWorkoutAI) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('name, muscle_group, category')
      if (cancelled) return
      if (error) { console.error('Workout library load error:', error); return }
      setWorkoutLibrary(data || [])
    })()
    return () => { cancelled = true }
  }, [showWorkoutAI])
  const [customWorkouts, setCustomWorkouts] = useState([])

  // Nutrition
  const [foodLogs, setFoodLogs] = useState([])
  const [showNutritionAI, setShowNutritionAI] = useState(false)
  const [foodInput, setFoodInput] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', meal_type: 'breakfast' })
  const [addingFood, setAddingFood] = useState(false)
  const [showAddFood, setShowAddFood] = useState(false)
  const [foodSearchQuery, setFoodSearchQuery] = useState('')
  const [foodSearchResults, setFoodSearchResults] = useState([])
  const [foodSearchLoading, setFoodSearchLoading] = useState(false)
  const [foodServingSize, setFoodServingSize] = useState(100)
  const [foodBase, setFoodBase] = useState(null)

  // Database
  const [resourceFilter, setResourceFilter] = useState('all')

  // Saved workouts
  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [programSubTab, setProgramSubTab] = useState('program')
  const [showAddToCalendar, setShowAddToCalendar] = useState(false)
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null)
  const [scheduleView, setScheduleView] = useState('calendar') // 'calendar' | 'history'
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)
  const [historySetLogs, setHistorySetLogs] = useState({}) // { [workout_log_id]: [sets] }
  const [historyPBs, setHistoryPBs] = useState({}) // { [scheduled_workout_id]: [pbs] }
  const [calDetailWorkout, setCalDetailWorkout] = useState(null)
  const [datePickerMode, setDatePickerMode] = useState(null) // 'move' | 'duplicate' | 'schedule'
  const [programWorkoutToSchedule, setProgramWorkoutToSchedule] = useState(null)
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState('')
  const [showAddToCalModal, setShowAddToCalModal] = useState(false)
  const [addToCalDates, setAddToCalDates] = useState([])
  const [showWorkoutPickerModal, setShowWorkoutPickerModal] = useState(false)
  const [workoutPickerSelected, setWorkoutPickerSelected] = useState(null)
  const [expandedMealId, setExpandedMealId] = useState(null)
  const [workoutToSchedule, setWorkoutToSchedule] = useState(null)
  const [scheduleDate, setScheduleDate] = useState(toLocalDateStr())
  const [selectedHomeDate, setSelectedHomeDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [homeDateFoodLogs, setHomeDateFoodLogs] = useState([])
  const [homeDateLoading, setHomeDateLoading] = useState(false)
  const [showTDEE, setShowTDEE] = useState(false)
  const [tdeeInputs, setTdeeInputs] = useState({ age: '', gender: 'male', heightCm: '', weightKg: '', activity: '1.55' })
  const [tdeeResult, setTdeeResult] = useState(null)
  const [nutritionTargets, setNutritionTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  })

  // Saved meals
  const [savedMeals, setSavedMeals] = useState([])
  const [nutritionSubTab, setNutritionSubTab] = useState('log')

  // Progress photos
  const [progressPhotos, setProgressPhotos] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef(null)

  // Weight graph
  const [weightPeriod, setWeightPeriod] = useState(30)
  const [weightLogs, setWeightLogs] = useState([])

  const getTodayStr = () => toLocalDateStr()
  const todayStr = getTodayStr()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: clientRow } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!clientRow) { setLoading(false); return }
      setClient(clientRow)
      setPhotoUrl(clientRow.profile_photo_url)

      const today = toLocalDateStr()

      // Weight
      const { data: wt } = await supabase.from('body_weight_logs').select('weight_kg').eq('client_id', clientRow.id).eq('logged_date', today).maybeSingle()
      if (wt) setTodayWeight(wt.weight_kg)

      // Program assignment
      const { data: asgn } = await supabase.from('program_assignments').select('id, start_date, programs(id, name)').eq('client_id', clientRow.id).eq('is_active', true).maybeSingle()
      setAssignment(asgn)

      if (asgn) {
        // Program workouts
        const { data: pwData } = await supabase.from('program_workouts').select('id, name, day_number').eq('program_id', asgn.programs.id).order('day_number', { ascending: true })
        const fetchedPW = pwData ?? []
        setProgramWorkouts(fetchedPW)

        // Exercises for all program workouts
        if (fetchedPW.length > 0) {
          const exMap = {}
          await Promise.all(fetchedPW.map(async pw => {
            const { data: exData } = await supabase.from('workout_exercises').select('id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)').eq('program_workout_id', pw.id).order('order_index', { ascending: true })
            exMap[pw.id] = exData ?? []
          }))
          setAllProgramExercises(exMap)
        }
      }

      // Scheduled workouts
      const from = new Date(); from.setDate(from.getDate() - 28)
      const to = new Date(); to.setDate(to.getDate() + 56)
      const { data: fetchedSW } = await supabase
        .from('scheduled_workouts')
        .select('id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)')
        .eq('client_id', clientRow.id)
        .gte('scheduled_date', toLocalDateStr(from))
        .lte('scheduled_date', toLocalDateStr(to))
        .order('scheduled_date', { ascending: true })
      const enrichedSW = (fetchedSW ?? []).map(sw => ({
        ...sw,
        program_workouts: sw.program_workouts ?? (sw.saved_workouts ? { name: sw.saved_workouts.name, day_number: 0 } : null),
        _isCustom: !!sw.custom_workout_id,
        _customWorkout: sw.saved_workouts ?? null,
      }))
      setScheduledWorkouts(enrichedSW)

      // Exercises for scheduled workouts
      const pwIds = [...new Set(fetchedSW.map(sw => sw.program_workout_id).filter(Boolean))]
      if (pwIds.length > 0) {
        const exMap = {}
        await Promise.all(pwIds.map(async pwId => {
          const { data: exData } = await supabase.from('workout_exercises').select('id, sets, reps, rest_seconds, notes, order_index, exercises(id, name, muscle_group)').eq('program_workout_id', pwId).order('order_index', { ascending: true })
          exMap[pwId] = exData ?? []
        }))
        setWorkoutExercises(exMap)
      }

      // Workout logs for completion status — all completed logs, keyed by workout+date
      const { data: logsData } = await supabase
        .from('workout_logs')
        .select('id, completed, program_workout_id, scheduled_workout_id, logged_at')
        .eq('client_id', clientRow.id)
        .eq('completed', true)
      setWorkoutLogs(logsData ?? [])
      setCompletedIds(new Set(
        (logsData ?? [])
          .filter(l => l.program_workout_id || l.scheduled_workout_id)
          .map(l => workoutKey(l.program_workout_id, l.scheduled_workout_id, toLocalDateStr(new Date(l.logged_at))))
      ))

      // Food logs for today
      const localMidnight = new Date()
      localMidnight.setHours(0, 0, 0, 0)
      const { data: foodData } = await supabase.from('food_logs').select('*').eq('client_id', clientRow.id).gte('logged_at', localMidnight.toISOString()).order('logged_at', { ascending: false })
      setFoodLogs(foodData ?? [])

      // Resources from PT (global or created by this client's PT)
      const { data: resourceData } = await supabase
        .from('resources')
        .select('*')
        .or(`is_global.eq.true,created_by.eq.${clientRow.pt_id}`)
        .order('created_at', { ascending: false })
      setResources(resourceData ?? [])

      // Saved workouts
      const { data: savedWData } = await supabase.from('saved_workouts').select('*').eq('client_id', clientRow.id).order('created_at', { ascending: false })
      setSavedWorkouts(savedWData ?? [])

      // Saved meals
      const { data: savedMData } = await supabase.from('saved_meals').select('*').eq('client_id', clientRow.id).order('created_at', { ascending: false })
      setSavedMeals(savedMData ?? [])

      // Progress photos
      const { data: ppData } = await supabase.from('progress_photos').select('*').eq('client_id', clientRow.id).order('taken_date', { ascending: false })
      setProgressPhotos(ppData ?? [])

      // Weight logs (90 days)
      const ninetyAgo = new Date(); ninetyAgo.setDate(ninetyAgo.getDate() - 90)
      const { data: wlData } = await supabase.from('body_weight_logs').select('weight_kg, logged_date').eq('client_id', clientRow.id).gte('logged_date', toLocalDateStr(ninetyAgo)).order('logged_date', { ascending: true })
      setWeightLogs(wlData ?? [])

      setNutritionTargets({
        calories: clientRow?.calorie_target || 0,
        protein: clientRow?.protein_target_g || 0,
        carbs: clientRow?.carbs_target_g || 0,
        fats: clientRow?.fats_target_g || 0,
      })

      setLoading(false)
    }
    init()
  }, [])

  async function handleLogWeight() {
    const w = parseFloat(weightInput)
    if (!w || w <= 0 || w > 500) return
    setSavingWeight(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('body_weight_logs').insert({ client_id: client.id, logged_by: user.id, weight_kg: w, logged_date: todayStr })
      setTodayWeight(w)
      setWeightInput('')
    } catch (e) { console.error(e) }
    finally { setSavingWeight(false) }
  }

  async function reloadScheduledWorkouts() {
    if (!client?.id) return
    const from = new Date(); from.setDate(from.getDate() - 28)
    const to = new Date(); to.setDate(to.getDate() + 56)
    const { data: fetchedSW } = await supabase
      .from('scheduled_workouts')
      .select('id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)')
      .eq('client_id', client.id)
      .gte('scheduled_date', toLocalDateStr(from))
      .lte('scheduled_date', toLocalDateStr(to))
      .order('scheduled_date', { ascending: true })
    const enrichedSW = (fetchedSW ?? []).map(sw => ({
      ...sw,
      program_workouts: sw.program_workouts ?? (sw.saved_workouts ? { name: sw.saved_workouts.name, day_number: 0 } : null),
      _isCustom: !!sw.custom_workout_id,
      _customWorkout: sw.saved_workouts ?? null,
    }))
    setScheduledWorkouts(enrichedSW)
  }

  async function handleMoveWorkout(date) {
    if (!calDetailWorkout || !date) return
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update({ scheduled_date: date })
        .eq('id', calDetailWorkout.id)
      if (error) throw error
      await reloadScheduledWorkouts()
      setDatePickerMode(null)
      setCalDetailWorkout(null)
      setScheduleSuccessMsg('Workout moved!')
      setTimeout(() => setScheduleSuccessMsg(''), 2500)
    } catch (e) {
      console.error('Move workout error:', e)
      alert('Could not move workout: ' + e.message)
    }
  }

  async function handleDuplicateWorkout(date) {
    if (!calDetailWorkout || !date) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('scheduled_workouts').insert({
        client_id: client.id,
        program_workout_id: calDetailWorkout.program_workout_id ?? null,
        custom_workout_id: calDetailWorkout.custom_workout_id ?? null,
        scheduled_date: date,
        created_by: user.id,
      })
      if (error) throw error
      await reloadScheduledWorkouts()
      setDatePickerMode(null)
      setCalDetailWorkout(null)
      setScheduleSuccessMsg('Workout duplicated!')
      setTimeout(() => setScheduleSuccessMsg(''), 2500)
    } catch (e) {
      console.error('Duplicate workout error:', e)
      alert('Could not duplicate workout: ' + e.message)
    }
  }

  async function handleScheduleProgramWorkout(date) {
    if (!programWorkoutToSchedule || !date) return
    const exists = scheduledWorkouts.some(
      sw => sw.program_workout_id === programWorkoutToSchedule.id && sw.scheduled_date === date
    )
    if (exists) {
      alert('This workout is already scheduled for that day.')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('scheduled_workouts').insert({
        client_id: client.id,
        program_workout_id: programWorkoutToSchedule.id,
        custom_workout_id: null,
        scheduled_date: date,
        created_by: user.id,
      })
      if (error) throw error
      await reloadScheduledWorkouts()
      setDatePickerMode(null)
      setProgramWorkoutToSchedule(null)
      setScheduleSuccessMsg('Added to calendar!')
      setTimeout(() => setScheduleSuccessMsg(''), 2500)
    } catch (e) {
      console.error('Schedule program workout error:', e)
      alert('Could not schedule: ' + e.message)
    }
  }

  function handleDatePickerConfirm(date) {
    if (datePickerMode === 'move') handleMoveWorkout(date)
    else if (datePickerMode === 'duplicate') handleDuplicateWorkout(date)
    else if (datePickerMode === 'schedule') handleScheduleProgramWorkout(date)
  }

  async function handleAddToCalConfirm() {
    if (!addToCalDates.length || !selectedProgramDay) return
    let added = 0
    for (const dateStr of addToCalDates) {
      const exists = scheduledWorkouts.some(
        sw => sw.program_workout_id === selectedProgramDay.id && sw.scheduled_date === dateStr
      )
      if (exists) continue
      const { error } = await supabase.from('scheduled_workouts').insert({
        client_id: client.id,
        program_workout_id: selectedProgramDay.id,
        custom_workout_id: null,
        scheduled_date: dateStr,
        created_by: client.user_id,
      })
      if (!error) added++
    }
    await reloadScheduledWorkouts()
    setShowAddToCalModal(false)
    setAddToCalDates([])
    if (added > 0) {
      setScheduleSuccessMsg(`Added to ${added} day${added !== 1 ? 's' : ''}`)
      setTimeout(() => setScheduleSuccessMsg(''), 2500)
    }
  }

  async function handleWorkoutPickerConfirm() {
    if (!workoutPickerSelected) return
    const isProgram = workoutPickerSelected.type === 'program'
    const { error } = await supabase.from('scheduled_workouts').insert({
      client_id: client.id,
      program_workout_id: isProgram ? workoutPickerSelected.workout.id : null,
      custom_workout_id: isProgram ? null : workoutPickerSelected.workout.id,
      scheduled_date: selectedCalDate,
      created_by: client.user_id,
    })
    if (error) { alert('Could not add workout: ' + error.message); return }
    await reloadScheduledWorkouts()
    setShowWorkoutPickerModal(false)
    setWorkoutPickerSelected(null)
    setScheduleSuccessMsg(`Workout added to ${formatShortDate(selectedCalDate)}`)
    setTimeout(() => setScheduleSuccessMsg(''), 2500)
  }

  async function loadWorkoutHistory() {
    if (!client?.id) return
    setHistoryLoading(true)
    try {
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('id, client_id, program_workout_id, logged_at, completed, total_volume_kg')
        .eq('client_id', client.id)
        .eq('completed', true)
        .order('logged_at', { ascending: false })
        .limit(30)
      if (error) throw error

      // Two-step: fetch program workout names for any program_workout_id present
      const pwIds = [...new Set((logs ?? []).map(l => l.program_workout_id).filter(Boolean))]
      const nameMap = {}
      if (pwIds.length > 0) {
        const { data: pwData } = await supabase
          .from('program_workouts')
          .select('id, name')
          .in('id', pwIds)
        if (pwData) pwData.forEach(pw => { nameMap[pw.id] = pw.name })
      }
      console.log('program workout name map:', nameMap)

      const enrichedLogs = (logs ?? []).map(l => ({
        ...l,
        _workoutName: nameMap[l.program_workout_id] || null,
      }))
      console.log('history logs with names:', enrichedLogs)

      setWorkoutHistory(enrichedLogs)
      setHistoryPBs({})
    } catch (e) { console.error('History load error:', e) }
    finally { setHistoryLoading(false) }
  }

  async function loadHistorySetLogs(workoutLogId, loggedAt) {
    if (historySetLogs[workoutLogId]) return
    try {
      const dateStr = loggedAt ? loggedAt.split('T')[0] : null
      let query = supabase
        .from('workout_set_logs')
        .select('id, set_number, reps_completed, weight_kg, exercise_id, exercises(name, muscle_group)')
        .eq('client_id', client.id)
        .order('exercise_id')
        .order('set_number')
      if (dateStr) {
        query = query.gte('logged_at', dateStr + 'T00:00:00.000Z').lte('logged_at', dateStr + 'T23:59:59.999Z')
      }
      const { data } = await query
      if (data) {
        setHistorySetLogs(prev => ({ ...prev, [workoutLogId]: data }))
      }
    } catch (e) { console.error('Set logs load error:', e) }
  }

  async function loadHomeDateData(dateStr) {
    setHomeDateLoading(true)
    try {
      const d = new Date(dateStr + 'T00:00:00')
      const nextD = new Date(d)
      nextD.setDate(nextD.getDate() + 1)
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('logged_at', d.toISOString())
        .lt('logged_at', nextD.toISOString())
        .order('logged_at', { ascending: false })
      setHomeDateFoodLogs(data ?? [])
    } catch (e) { console.error(e) }
    finally { setHomeDateLoading(false) }
  }

  async function handleSetGoal(calories) {
    try {
      const protein = Math.round((calories * 0.30) / 4)
      const carbs = Math.round((calories * 0.40) / 4)
      const fats = Math.round((calories * 0.30) / 9)
      const { error } = await supabase
        .from('clients')
        .update({
          calorie_target: calories,
          protein_target_g: protein,
          carbs_target_g: carbs,
          fats_target_g: fats,
        })
        .eq('id', client.id)
      if (error) throw error
      setNutritionTargets({ calories, protein, carbs, fats })
      setClient(prev => ({
        ...prev,
        calorie_target: calories,
        protein_target_g: protein,
        carbs_target_g: carbs,
        fats_target_g: fats,
      }))
      setTdeeResult(null)
      setShowTDEE(false)
    } catch (e) {
      console.error('Set goal error:', e)
      alert('Could not set goal: ' + e.message)
    }
  }

  async function searchFood(query) {
    if (!query || query.trim().length < 2) { setFoodSearchResults([]); return }
    setFoodSearchLoading(true)
    const q = query.trim().toLowerCase()
    const commonMatches = COMMON_FOODS.filter(f => f.name.toLowerCase().includes(q))
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=6&lc=en&cc=au&fields=product_name,brands,nutriments,code`)
      const json = await res.json()
      const apiResults = (json.products || [])
        .filter(p => p.product_name && typeof p.nutriments?.['energy-kcal_100g'] === 'number')
        .map(p => ({
          name: p.product_name,
          brand: p.brands || '',
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein: parseFloat((p.nutriments['proteins_100g'] || 0).toFixed(1)),
          carbs: parseFloat((p.nutriments['carbohydrates_100g'] || 0).toFixed(1)),
          fats: parseFloat((p.nutriments['fat_100g'] || 0).toFixed(1)),
        }))
      const combined = [...commonMatches, ...apiResults].slice(0, 8)
      setFoodSearchResults(combined)
    } catch (e) {
      console.error('Food search error:', e)
      setFoodSearchResults(commonMatches.slice(0, 8))
    } finally {
      setFoodSearchLoading(false)
    }
  }

  async function handleAddFood() {
    if (!foodInput.name.trim()) return
    setAddingFood(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('food_logs').insert({
        client_id: client.id,
        food_name: foodInput.name.trim(),
        meal_type: foodInput.meal_type,
        calories: parseFloat(foodInput.calories) || 0,
        protein_g: parseFloat(foodInput.protein) || 0,
        carbs_g: parseFloat(foodInput.carbs) || 0,
        fats_g: parseFloat(foodInput.fats) || 0,
        logged_at: new Date().toISOString(),
      }).select().single()
      if (error) throw error
      setFoodLogs(prev => [data, ...prev])
      setFoodInput({ name: '', calories: '', protein: '', carbs: '', fats: '', meal_type: 'breakfast' })
      setShowAddFood(false)
    } catch (e) { console.error(e) }
    finally { setAddingFood(false) }
  }

  async function handleSaveWorkout(content) {
    if (!content?.trim()) return
    let parsedWorkout = null
    let cleanContent = content.trim()
    try {
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.title && Array.isArray(parsed.exercises)) {
          parsedWorkout = parsed
          cleanContent = JSON.stringify(parsed)
        }
      }
    } catch (e) {
      console.warn('AI workout JSON parse failed, saving as plain text:', e)
    }
    const name = parsedWorkout?.title || content.split('\n').find(l => l.trim())?.substring(0, 50) || `AI Workout ${toLocalDateStr()}`
    try {
      const { data, error } = await supabase.from('saved_workouts').insert({
        client_id: client.id,
        name,
        content: cleanContent,
      }).select().single()
      if (error) { alert('Could not save workout: ' + error.message); return }
      setSavedWorkouts(prev => [data, ...prev])
      setShowWorkoutAI(false)
      setProgramSubTab('saved')
    } catch (e) {
      alert('Could not save workout: ' + e.message)
    }
  }

  async function handleSaveMeal(content) {
    const calorieMatch = content.match(/[Cc]alories?:?\s*(\d+)/)
    const proteinMatch = content.match(/[Pp]rotein:?\s*(\d+)/)
    const carbsMatch = content.match(/[Cc]arbs?:?\s*(\d+)/)
    const fatsMatch = content.match(/[Ff]ats?:?\s*(\d+)/)
    const name = content.split('\n').find(l => l.trim().length > 3)?.trim().substring(0, 50) || 'AI Meal'
    try {
      const { data, error } = await supabase.from('saved_meals').insert({
        client_id: client.id,
        name,
        content,
        calories: parseFloat(calorieMatch?.[1]) || 0,
        protein_g: parseFloat(proteinMatch?.[1]) || 0,
        carbs_g: parseFloat(carbsMatch?.[1]) || 0,
        fats_g: parseFloat(fatsMatch?.[1]) || 0,
      }).select().single()
      if (error) {
        console.error('Save meal error:', error)
        alert('Could not save meal: ' + error.message)
        return
      }
      setSavedMeals(prev => [data, ...prev])
      setShowNutritionAI(false)
      setNutritionSubTab('saved')
    } catch (e) {
      console.error('Save meal exception:', e)
      alert('Something went wrong saving the meal.')
    }
  }

  async function handleAddMealToLog(meal) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('food_logs').insert({
        client_id: client.id,
        food_name: meal.name,
        meal_type: 'other',
        calories: meal.calories || 0,
        protein_g: meal.protein_g || 0,
        carbs_g: meal.carbs_g || 0,
        fats_g: meal.fats_g || 0,
        logged_at: new Date().toISOString(),
      }).select().single()
      if (error) {
        console.error('Add meal error:', error)
        alert('Could not add meal: ' + error.message)
        return
      }
      setFoodLogs(prev => [data, ...prev])
      setNutritionSubTab('log')
    } catch (e) {
      console.error('Add meal exception:', e)
      alert('Something went wrong: ' + e.message)
    }
  }

  async function handleScheduleWorkout() {
    if (!workoutToSchedule || !scheduleDate) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .insert({
          client_id: client.id,
          program_workout_id: null,
          custom_workout_id: workoutToSchedule.id,
          scheduled_date: scheduleDate,
          created_by: user.id,
        })
        .select('id, scheduled_date, program_workout_id, custom_workout_id')
        .single()
      if (error) {
        console.error('Schedule error:', error)
        alert('Could not schedule workout: ' + error.message)
        return
      }
      const enriched = {
        ...data,
        program_workouts: { name: workoutToSchedule.name, day_number: 0 },
        _isCustom: true,
        _customWorkout: workoutToSchedule,
      }
      setScheduledWorkouts(prev => [...prev, enriched])
      setShowAddToCalendar(false)
      setWorkoutToSchedule(null)
    } catch (e) {
      console.error('Schedule exception:', e)
      alert('Something went wrong: ' + e.message)
    }
  }

  async function handleUploadProgressPhoto(e) {
    const file = e.target.files?.[0]
    if (!file || !client) return
    setUploadingPhoto(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const path = `${user.id}/progress/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(path)
      const { data, error } = await supabase.from('progress_photos').insert({ client_id: client.id, photo_url: publicUrl, taken_date: toLocalDateStr() }).select().single()
      if (error) throw error
      setProgressPhotos(prev => [data, ...prev])
    } catch (e) { console.error(e) }
    finally { setUploadingPhoto(false) }
  }

  async function handleDeleteFood(id) {
    await supabase.from('food_logs').delete().eq('id', id)
    setFoodLogs(prev => prev.filter(f => f.id !== id))
  }

  // Grouped scheduled workouts
  const groupedByDate = scheduledWorkouts.reduce((acc, sw) => {
    if (!acc[sw.scheduled_date]) acc[sw.scheduled_date] = []
    acc[sw.scheduled_date].push(sw)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedByDate).sort()
  const nextWorkoutDate = sortedDates.find(d => d >= todayStr)
  const nextWorkouts = nextWorkoutDate ? groupedByDate[nextWorkoutDate] : []

  // Today nutrition totals
  const todayCalories = Math.round(foodLogs.reduce((s, f) => s + (f.calories || 0), 0))
  const todayProtein = Math.round(foodLogs.reduce((s, f) => s + (f.protein_g || 0), 0))
  const todayCarbs = Math.round(foodLogs.reduce((s, f) => s + (f.carbs_g || 0), 0))
  const todayFats = Math.round(foodLogs.reduce((s, f) => s + (f.fats_g || 0), 0))
  const calTarget = nutritionTargets.calories || client?.calorie_target || 0
  const calPct = calTarget > 0 ? Math.min(100, Math.round((todayCalories / calTarget) * 100)) : 0

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  if (!client) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={24} className="text-gray-300" />
        </div>
        <p className="text-gray-900 font-semibold">Account not linked</p>
        <p className="text-sm text-gray-400 mt-1">Contact your trainer to get access.</p>
      </div>
    </div>
  )

  // AI overlays
  const workoutAIPrompt = (() => {
    const lib = workoutLibrary || []
    const mainEx = lib.filter(e => !['warmup', 'cooldown', 'cardio'].includes(e.category))
    const warmups = lib.filter(e => e.category === 'warmup').map(e => e.name)
    const cooldowns = lib.filter(e => e.category === 'cooldown').map(e => e.name)
    const cardio = lib.filter(e => e.category === 'cardio').map(e => e.name)
    const byMuscle = {}
    mainEx.forEach(e => {
      const mg = e.muscle_group || 'Other'
      if (!byMuscle[mg]) byMuscle[mg] = []
      byMuscle[mg].push(e.name)
    })
    let libSection = ''
    if (mainEx.length > 0) {
      libSection = 'MAIN EXERCISE LIBRARY (choose working exercises ONLY from these, using the exact name as written):\n'
      Object.keys(byMuscle).sort().forEach(mg => {
        libSection += `${mg}: ${byMuscle[mg].join(', ')}\n`
      })
      libSection += `\nWARMUP options (only if a warmup is requested): ${warmups.join(', ') || 'none available'}\n`
      libSection += `COOLDOWN options (only if a cooldown is requested): ${cooldowns.join(', ') || 'none available'}\n`
      libSection += `CARDIO / CONDITIONING options (only if cardio or conditioning is requested): ${cardio.join(', ') || 'none available'}\n`
    }
    return `You are an expert personal trainer and strength coach building a single workout session.

${libSection}
PROGRAMMING RULES (follow exactly):
- Every workout serves ONE primary goal. Infer the goal from the user request. If ambiguous, default to hypertrophy.
- Rep ranges by goal: strength 3 to 6 reps; hypertrophy 6 to 12 reps; muscular endurance 15 to 20 plus reps; power 1 to 5 explosive reps.
- Rest by goal: strength 120 to 240 seconds; hypertrophy 60 to 90 seconds; endurance 30 to 60 seconds; power 120 to 180 seconds.
- Volume: every targeted muscle group gets 4 to 9 working sets in the session and never more than 9. Total session is 16 to 24 working sets across all exercises.
- Bias volume to the primary muscle of the session, near 9 sets. Secondary muscles get 4 to 6 sets.
- Order compound movements before isolation. Balance pushing and pulling where it makes sense.
- A session has 4 to 8 exercises. Never more than 8.
- Never prescribe heavy compounds like squats, deadlifts or bench press at high reps for a strength or power goal.
- Choose working exercises ONLY from the MAIN EXERCISE LIBRARY above, using the exact name as written. Never invent an exercise name. If you want a movement that is not listed, pick the closest one that IS listed.
- Do not include a warmup or cooldown unless the user explicitly asks. If asked, use only the WARMUP or COOLDOWN options above.
- Only include cardio or conditioning exercises if the user asks for cardio or conditioning, using the CARDIO options above.
- Notes are short, plain English coaching cues. No anatomy jargon. No em dashes.

OUTPUT FORMAT. Respond with ONLY a valid JSON object. No markdown, no backticks, no text before or after. Structure: {"title": "Upper Body Hypertrophy", "exercises": [{"name": "Bench Press", "sets": 4, "reps": "8-12", "rest_seconds": 90, "notes": "Control the descent"}]}. title is a short descriptive workout name. exercises is an array. name must be an exact library name as a string. sets is an integer. reps is a string like "8-12" or "5". rest_seconds is an integer in seconds. notes is a short cue string or empty string. Respond with ONLY the JSON object and nothing else.`
  })()
  if (showWorkoutAI) return <AIChat context="Build a custom workout" placeholder="e.g. Give me a 45 minute upper body workout with dumbbells only" systemPrompt={workoutAIPrompt} onClose={() => setShowWorkoutAI(false)} onSave={handleSaveWorkout} saveLabel="Save workout" />
  if (showNutritionAI) return <AIChat context="Nutrition & meal ideas" placeholder="e.g. Give me a high protein breakfast under 500 calories" systemPrompt="You are an expert nutritionist and chef. Help the user with meal ideas, recipes, and nutrition advice. Give practical, delicious suggestions with macros where helpful. Keep advice evidence-based and actionable. When giving a meal or recipe, always end with a MACROS section showing: Calories: X, Protein: Xg, Carbs: Xg, Fats: Xg" onClose={() => setShowNutritionAI(false)} onSave={handleSaveMeal} saveLabel="Save meal" />

  // Workout preview (between card tap and logging)
  if (workoutCompleteData) return (
    <WorkoutComplete
      workoutName={workoutCompleteData.workoutName}
      stats={workoutCompleteData}
      onDone={() => {
        setWorkoutCompleteData(null)
        setLoggingWorkout(null)
        setActiveTab('home')
      }}
    />
  )

  if (previewWorkout) return (
    <WorkoutPreview
      scheduledWorkout={previewWorkout}
      exercises={workoutExercises[previewWorkout.program_workout_id] ?? []}
      client={client}
      onBack={() => setPreviewWorkout(null)}
      onStart={() => {
        setLoggingWorkout(previewWorkout)
        setPreviewWorkout(null)
      }}
    />
  )

  // Workout logging overlay
  if (loggingWorkout) return (
    <WorkoutLogging
      scheduledWorkout={loggingWorkout}
      exercises={workoutExercises[loggingWorkout.program_workout_id] ?? []}
      client={client}
      onBack={() => setLoggingWorkout(null)}
      onComplete={(workoutId, stats) => {
        setCompletedIds(prev => new Set([...prev, workoutId]))
        setLoggingWorkout(null)
        setWorkoutCompleteData(stats)
      }}
    />
  )

  // ── TAB CONTENT ─────────────────────────────────────────────────────────────

  function renderHome() {
    const firstName = client.full_name?.split(' ')[0] || client.full_name

    // Weight graph data
    const days = parseInt(weightPeriod)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = toLocalDateStr(cutoff)
    const filteredWeightLogs = weightLogs.filter(w => w.logged_date >= cutoffStr)
    const minW = filteredWeightLogs.length > 0 ? Math.min(...filteredWeightLogs.map(w => parseFloat(w.weight_kg))) : 0
    const maxW = filteredWeightLogs.length > 0 ? Math.max(...filteredWeightLogs.map(w => parseFloat(w.weight_kg))) : 100
    const wRange = maxW - minW || 5
    const chartH = 80
    const chartW = 300
    const wPoints = filteredWeightLogs.map((w, i) => ({
      x: filteredWeightLogs.length > 1 ? (i / (filteredWeightLogs.length - 1)) * chartW : chartW / 2,
      y: chartH - ((parseFloat(w.weight_kg) - minW) / wRange) * (chartH - 10) - 5,
      weight: w.weight_kg,
      date: w.logged_date,
    }))
    const svgPath = wPoints.length > 1 ? wPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : ''
    const svgFill = wPoints.length > 1 ? `${svgPath} L ${wPoints[wPoints.length-1].x} ${chartH} L ${wPoints[0].x} ${chartH} Z` : ''
    const latestWeight = filteredWeightLogs.length > 0 ? parseFloat(filteredWeightLogs[filteredWeightLogs.length-1].weight_kg) : null
    const weightChange = filteredWeightLogs.length > 1 ? (parseFloat(filteredWeightLogs[filteredWeightLogs.length-1].weight_kg) - parseFloat(filteredWeightLogs[0].weight_kg)).toFixed(1) : null

    // Streak
    const sortedCompletedDates = [...new Set(scheduledWorkouts.filter(sw => completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date))).map(sw => sw.scheduled_date))].sort().reverse()
    let streak = 0
    let checkDate = new Date()
    for (const dateStr of sortedCompletedDates) {
      const checkStr = toLocalDateStr(checkDate)
      if (dateStr === checkStr) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
      else if (dateStr < checkStr) break
    }

    // Week strip data
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const weeklyCount = scheduledWorkouts.filter(sw => completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date)) && sw.scheduled_date >= toLocalDateStr(monday)).length
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    // Selected day data
    const selectedDateWorkouts = groupedByDate[selectedHomeDate] ?? []
    const selectedIsToday = selectedHomeDate === todayStr

    const selectedDateCalories = selectedIsToday
      ? todayCalories
      : Math.round(homeDateFoodLogs.reduce((s, f) => s + (f.calories || 0), 0))
    const selectedDateProtein = selectedIsToday
      ? todayProtein
      : Math.round(homeDateFoodLogs.reduce((s, f) => s + (f.protein_g || 0), 0))
    const selectedDateCarbs = selectedIsToday
      ? todayCarbs
      : Math.round(homeDateFoodLogs.reduce((s, f) => s + (f.carbs_g || 0), 0))
    const selectedDateFats = selectedIsToday
      ? todayFats
      : Math.round(homeDateFoodLogs.reduce((s, f) => s + (f.fats_g || 0), 0))

    const calTarget = client?.calorie_target || 0
    const calPct = calTarget > 0 ? Math.min(100, Math.round((selectedDateCalories / calTarget) * 100)) : 0

    return (
      <div className="px-4 py-5 space-y-4">

        {/* ── TOP HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{firstName} 👋</h1>
            {assignment && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-500">{assignment.programs?.name}</span>
              </div>
            )}
          </div>
          <ProfilePhoto client={{ ...client, profile_photo_url: photoUrl }} size="lg" onUpdate={setPhotoUrl} />
        </div>

        {/* ── WEEK STRIP ── */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {today.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
            </p>
            <button onClick={() => setActiveTab('calendar')} className="text-xs text-emerald-600 font-semibold">
              Full calendar →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const dateStr = toLocalDateStr(day)
              const isCurrentDay = dateStr === todayStr
              const isSelected = dateStr === selectedHomeDate
              const hasWorkout = !!(groupedByDate[dateStr]?.length)
              const hasCompleted = groupedByDate[dateStr]?.some(sw => completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date)))
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedHomeDate(dateStr)
                    if (dateStr !== todayStr) loadHomeDateData(dateStr)
                  }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                    isSelected && isCurrentDay ? 'bg-emerald-500' :
                    isSelected ? 'bg-gray-800' :
                    isCurrentDay ? 'bg-emerald-50 border border-emerald-200' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase ${
                    isSelected ? 'text-white' : isCurrentDay ? 'text-emerald-600' : 'text-gray-400'
                  }`}>{DAY_LABELS[i]}</span>
                  <span className={`text-sm font-bold ${
                    isSelected ? 'text-white' : isCurrentDay ? 'text-emerald-600' : 'text-gray-700'
                  }`}>{day.getDate()}</span>
                  {hasWorkout ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : hasCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  ) : (
                    <div className="w-1.5 h-1.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── SELECTED DAY CARD ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">
              {selectedIsToday ? 'Today' : new Date(selectedHomeDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            {selectedIsToday && <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">TODAY</span>}
          </div>

          {/* Workout row */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Workout</p>
            {homeDateLoading ? (
              <p className="text-xs text-gray-300">Loading...</p>
            ) : selectedDateWorkouts.length === 0 ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">No workout scheduled</p>
                {selectedIsToday && (
                  <button onClick={() => { setActiveTab('program'); setShowWorkoutAI(true) }}
                    className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    ✨ Build one
                  </button>
                )}
              </div>
            ) : selectedDateWorkouts.map(sw => {
              const done = completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date))
              const name = sw.program_workouts?.name || sw._customWorkout?.name || 'Workout'
              const exercises = workoutExercises[sw.program_workout_id] ?? []
              const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
              return (
                <button key={sw.id} onClick={() => setPreviewWorkout(sw)}
                  className="w-full text-left flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    done ? 'bg-emerald-500' : 'border-2 border-gray-200 group-hover:border-emerald-400'
                  }`}>
                    {done && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${done ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {done ? 'Completed ✓' : 'Tap to start'}
                      </span>
                      {estMin > 0 && !done && (
                        <><span className="text-gray-200">·</span><span className="text-xs text-gray-400">~{estMin} min</span></>
                      )}
                    </div>
                  </div>
                  {!done && <ChevronRight size={14} className="text-gray-300 flex-shrink-0 group-hover:text-emerald-500 transition-colors" />}
                </button>
              )
            })}
          </div>

          {/* Nutrition row */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Nutrition</p>
              {calTarget > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  calPct >= 90 && calPct <= 110 ? 'bg-emerald-50 text-emerald-600' :
                  calPct > 110 ? 'bg-red-50 text-red-500' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {calPct}% of goal
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Calories', value: selectedDateCalories, unit: 'kcal', colour: 'text-orange-500', target: calTarget },
                { label: 'Protein', value: selectedDateProtein, unit: 'g', colour: 'text-red-500', target: client?.protein_target_g || 0 },
                { label: 'Carbs', value: selectedDateCarbs, unit: 'g', colour: 'text-yellow-500', target: client?.carbs_target_g || 0 },
                { label: 'Fats', value: selectedDateFats, unit: 'g', colour: 'text-blue-500', target: client?.fats_target_g || 0 },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className={`text-base font-black ${m.colour}`}>{m.value}</p>
                  <p className="text-[10px] text-gray-400">{m.unit}</p>
                  {m.target > 0 && (
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        m.label === 'Calories' ? 'bg-orange-400' :
                        m.label === 'Protein' ? 'bg-red-400' :
                        m.label === 'Carbs' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`} style={{ width: `${Math.min(100, Math.round((m.value / m.target) * 100))}%` }} />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-300 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('nutrition')} className="w-full text-center text-xs text-emerald-600 font-semibold mt-3 py-1.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
              Log food →
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-500">{streak}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">🔥 Streak</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-blue-500">{weeklyCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">💪 This Week</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-500">{latestWeight ?? '—'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wide">⚖️ Weight</p>
          </div>
        </div>

        {/* ── WEIGHT GRAPH ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Body Weight</p>
              {latestWeight && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-gray-900">{latestWeight}<span className="text-sm font-medium text-gray-400 ml-1">kg</span></span>
                  {weightChange !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      parseFloat(weightChange) < 0 ? 'bg-emerald-50 text-emerald-600' :
                      parseFloat(weightChange) > 0 ? 'bg-red-50 text-red-500' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {['7', '30', '90'].map(p => (
                <button key={p} onClick={() => setWeightPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${weightPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {p}d
                </button>
              ))}
            </div>
          </div>

          {filteredWeightLogs.length < 2 ? (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-300 text-center mb-3">Log more entries to see your weight trend</p>
              {!todayWeight ? (
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="20" max="500" placeholder="Log today's weight..." value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogWeight() }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <span className="text-xs text-gray-400 flex-shrink-0">kg</span>
                  <button onClick={handleLogWeight} disabled={savingWeight || !weightInput}
                    className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50 flex-shrink-0">
                    {savingWeight ? '...' : 'Log'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs text-gray-500">Logged {todayWeight} kg today</span>
                  <button onClick={() => setTodayWeight(null)} className="text-xs text-gray-400 underline ml-auto">Update</button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 pb-4">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: '80px' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {svgFill && <path d={svgFill} fill="url(#wGrad)" />}
                {svgPath && <path d={svgPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {wPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-300">{filteredWeightLogs[0]?.logged_date ? new Date(filteredWeightLogs[0].logged_date + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit' }) : ''}</span>
                <span className="text-[10px] text-gray-300">{filteredWeightLogs[filteredWeightLogs.length-1]?.logged_date ? new Date(filteredWeightLogs[filteredWeightLogs.length-1].logged_date + 'T00:00:00').toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit' }) : ''}</span>
              </div>
              {!todayWeight && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <input type="number" step="0.1" min="20" max="500" placeholder="Log today's weight..." value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogWeight() }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <span className="text-xs text-gray-400 flex-shrink-0">kg</span>
                  <button onClick={handleLogWeight} disabled={savingWeight || !weightInput}
                    className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50 flex-shrink-0">
                    {savingWeight ? '...' : 'Log'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PROGRESS PHOTOS ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progress Photos</p>
            <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {uploadingPhoto ? '...' : <><Camera size={12} /> Add</>}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUploadProgressPhoto} />
          </div>
          {progressPhotos.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Camera size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No progress photos yet.</p>
              <p className="text-xs text-gray-300 mt-0.5">Tap Add to track your visual progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1">
              {progressPhotos.slice(0, 6).map(photo => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {progressPhotos.length > 6 && (
                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-400">+{progressPhotos.length - 6}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-20" />
      </div>
    )
  }

  function renderCalendar() {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay()
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
    const monthName = new Date(calYear, calMonth).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    const selectedWorkouts = groupedByDate[selectedCalDate] ?? []
    const selectedDateLabel = formatDateLabel(selectedCalDate)

    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setScheduleView('calendar')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${scheduleView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => {
              setScheduleView('history')
              if (workoutHistory.length === 0) loadWorkoutHistory()
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${scheduleView === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            History
          </button>
        </div>

        {scheduleView === 'history' ? (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workoutHistory.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-10 text-center">
                <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No completed workouts yet</p>
                <p className="text-xs text-gray-400 mt-1">Complete your first session to see history here.</p>
              </div>
            ) : workoutHistory.map(log => {
              const workoutName = log._workoutName || 'Workout'
              const sessionDate = log.logged_at
                ? new Date(log.logged_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : 'Unknown date'
              const isExpanded = expandedHistoryId === log.id
              const sets = historySetLogs[log.id] ?? []
              const sessionPBs = historyPBs[log.program_workout_id] ?? []

              const exerciseMap = {}
              for (const s of sets) {
                const eid = s.exercise_id
                if (!exerciseMap[eid]) exerciseMap[eid] = { name: s.exercises?.name || 'Exercise', muscle: s.exercises?.muscle_group, sets: [] }
                exerciseMap[eid].sets.push(s)
              }
              const exerciseList = Object.values(exerciseMap)

              return (
                <div key={log.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      if (!isExpanded) loadHistorySetLogs(log.id, log.logged_at)
                      setExpandedHistoryId(isExpanded ? null : log.id)
                    }}
                    className="w-full text-left px-4 py-4 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{workoutName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sessionDate}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {log.total_volume_kg > 0 && (
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {Math.round(log.total_volume_kg).toLocaleString()} kg total
                          </span>
                        )}
                        {sessionPBs.length > 0 && (
                          <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                            🏆 {sessionPBs.length} PB{sessionPBs.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {sessionPBs.length > 0 && (
                        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-2">PBs This Session</p>
                          <div className="space-y-1">
                            {sessionPBs.map(pb => {
                              const PB_LABELS = { '1rm': 'Est. 1RM', 'best_set': 'Best Set', 'volume': 'Volume' }
                              return (
                                <div key={pb.id} className="flex items-center justify-between">
                                  <span className="text-xs text-orange-700 font-semibold">{pb.exercises?.name} — {PB_LABELS[pb.pb_type] || pb.pb_type}</span>
                                  <span className="text-xs font-black text-orange-500">{pb.value} {pb.pb_type === 'volume' ? 'kg vol' : 'kg'}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {sets.length === 0 ? (
                        <div className="px-4 py-4 text-center">
                          <p className="text-xs text-gray-400">No set data recorded for this session.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {exerciseList.map((ex, i) => (
                            <div key={i} className="px-4 py-3">
                              <p className="text-xs font-bold text-gray-700 mb-2">{ex.name}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {ex.sets.map((s, si) => (
                                  <div key={si} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium">Set {s.set_number}</p>
                                    {s.weight_kg > 0 ? (
                                      <p className="text-xs font-bold text-gray-900">{s.weight_kg}kg × {s.reps_completed}</p>
                                    ) : (
                                      <p className="text-xs font-bold text-gray-900">{s.reps_completed} reps</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div className="h-20" />
          </div>
        ) : (<>

        {/* Month navigation */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600 rotate-180" />
            </button>
            <span className="text-sm font-bold text-gray-900">{monthName}</span>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isCurrentDay = dateStr === todayStr
              const isSelected = dateStr === selectedCalDate
              const hasWorkout = !!(groupedByDate[dateStr]?.length)
              const hasCompleted = groupedByDate[dateStr]?.some(sw => completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date)))
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedCalDate(dateStr)}
                  className={`h-10 flex flex-col items-center justify-center relative transition-colors ${
                    isSelected ? 'bg-emerald-500' :
                    isCurrentDay ? 'bg-emerald-50' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-semibold ${
                    isSelected ? 'text-white' :
                    isCurrentDay ? 'text-emerald-600' :
                    'text-gray-700'
                  }`}>{day}</span>
                  {hasWorkout && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' :
                      hasCompleted ? 'bg-emerald-500' :
                      'bg-gray-400'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date panel */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{selectedDateLabel}</p>
              {isToday(selectedCalDate) && <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">TODAY</span>}
            </div>
            <button
              onClick={() => { setWorkoutPickerSelected(null); setShowWorkoutPickerModal(true) }}
              className="text-xs font-semibold bg-black text-white rounded-lg px-3 py-1"
            >
              + Add
            </button>
          </div>
          {selectedWorkouts.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">No workouts scheduled for this day.</p>
              <button
                onClick={() => setShowWorkoutAI(true)}
                className="flex items-center gap-2 mx-auto text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl"
              >
                <span>✨</span> Build a workout with AI
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedWorkouts.map(sw => {
                const done = completedIds.has(workoutKey(sw.program_workout_id, sw.id, sw.scheduled_date))
                const exercises = workoutExercises[sw.program_workout_id] ?? []
                const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
                return (
                  <button key={sw.id} onClick={() => setCalDetailWorkout(sw)}
                    className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'border-2 border-gray-200'}`}>
                      {done && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{sw.program_workouts?.name || sw._customWorkout?.name || sw.saved_workouts?.name || 'Workout'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${done ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {done ? 'Completed' : 'Tap to start'}
                        </span>
                        {exercises.length > 0 && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">{exercises.length} exercises</span></>}
                        {estMin > 0 && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">~{estMin} min</span></>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="h-20" />
      </>
      )}
    </div>
    )
  }

  function renderProgram() {
    if (programView === 'detail' && selectedProgramDay) {
      const exercises = allProgramExercises[selectedProgramDay.id] ?? []
      return (
        <div className="px-4 py-4 pb-28">
          <button onClick={() => { setProgramView('list'); setSelectedProgramDay(null) }} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <ArrowLeft size={16} /><span>Back to program</span>
          </button>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-gray-900">{selectedProgramDay.name}</h2>
            <button
              onClick={() => setShowAddToCalModal(true)}
              className="bg-black text-white text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
            >
              + Schedule
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">Day {selectedProgramDay.day_number} · {exercises.length} exercises</p>
          <div className="space-y-3 mb-6">
            {exercises.map((ex, idx) => {
              const muscle = ex.exercises?.muscle_group
              const chipClass = MUSCLE_CHIP[muscle] ?? MUSCLE_CHIP.Other
              return (
                <div key={ex.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{ex.exercises?.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {muscle && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipClass}`}>{muscle}</span>}
                      <span className="text-xs text-gray-500">{ex.sets} sets × {ex.reps} reps</span>
                      {ex.rest_seconds && <span className="text-xs text-gray-400">· {ex.rest_seconds}s rest</span>}
                    </div>
                    {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="px-4 py-4 space-y-5">
        <h2 className="text-lg font-bold text-gray-900">Program</h2>

        {/* Sub-tabs */}
        <div className="flex gap-4 border-b border-gray-100 -mx-4 px-4">
          {[['program', 'My Program'], ['saved', 'Saved']].map(([id, label]) => (
            <button key={id} onClick={() => setProgramSubTab(id)}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${programSubTab === id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {programSubTab === 'program' ? (
          <>
            {assignment ? (
              <div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 mb-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Dumbbell size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{assignment.programs?.name}</p>
                      <p className="text-xs text-gray-400">Started {new Date(assignment.start_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {programWorkouts.map(pw => {
                    return (
                      <div key={pw.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center justify-between hover:border-emerald-200 hover:shadow-sm transition-all">
                        <button
                          onClick={() => { setPreviewWorkout(null); setSelectedProgramDay(pw); setProgramView('detail') }}
                          className="flex-1 text-left flex items-center gap-4 min-w-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-gray-500">D{pw.day_number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{pw.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{(allProgramExercises[pw.id] ?? []).length} exercises</span>
                              {Math.round((allProgramExercises[pw.id] ?? []).reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5) > 0 && (
                                <><span className="text-gray-300 text-xs">·</span><span className="text-xs text-gray-400">~{Math.round((allProgramExercises[pw.id] ?? []).reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)} min</span></>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No program assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Your trainer will assign a program here.</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Build Your Own</p>
              <button onClick={() => setShowWorkoutAI(true)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><span className="text-xl">✨</span></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Build with AI</p>
                  <p className="text-xs text-gray-400 mt-0.5">Describe your goal and get a custom workout</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            </div>
          </>
        ) : (
          <>
            {savedWorkouts.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No saved workouts yet.</p>
                <p className="text-xs text-gray-300 mt-1">Use AI to build and save a workout.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedWorkouts.map(sw => {
                  const isExpanded = expandedWorkoutId === sw.id
                  return (
                    <div key={sw.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedWorkoutId(isExpanded ? null : sw.id)}
                          className="flex-1 text-left min-w-0 mr-3"
                        >
                          <p className="text-sm font-bold text-gray-900 truncate">{sw.name || sw.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">{new Date(sw.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <span className="text-gray-200">·</span>
                            <p className={`text-xs font-semibold ${isExpanded ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {isExpanded ? 'Collapse ↑' : 'View ↓'}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => { setWorkoutToSchedule(sw); setShowAddToCalendar(true) }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex-shrink-0">
                          <Plus size={12} /> Schedule
                        </button>
                      </div>
                      {expandedWorkoutId === sw.id && (() => {
                        let parsed = null
                        try { parsed = JSON.parse(sw.content) } catch (e) {}
                        if (parsed?.exercises) {
                          return (
                            <div className="px-4 pb-4 space-y-2">
                              {parsed.exercises.map((ex, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{ex.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {ex.sets > 0 && <span className="text-xs text-gray-500">{ex.sets} sets × {ex.reps} reps</span>}
                                      {ex.sets === 0 && <span className="text-xs text-gray-500">{ex.reps}</span>}
                                      {ex.rest_seconds > 0 && <span className="text-xs text-gray-400">· {ex.rest_seconds}s rest</span>}
                                    </div>
                                    {ex.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{ex.notes}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                        return (
                          <div className="px-4 pb-4">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">{sw.content}</pre>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Add to Calendar modal */}
        {showAddToCalendar && workoutToSchedule && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center" onClick={() => setShowAddToCalendar(false)}>
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold text-gray-900 mb-1">Add to Calendar</h3>
              <p className="text-xs text-gray-400 mb-4 truncate">{workoutToSchedule.title}</p>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <div className="flex gap-2">
                <button onClick={() => handleScheduleWorkout()}
                  className="flex-1 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors">Schedule</button>
                <button onClick={() => setShowAddToCalendar(false)}
                  className="flex-1 border border-gray-200 text-gray-500 text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>
    )
  }

  function renderNutrition() {
    const calTarget = nutritionTargets.calories || client?.calorie_target || 0
    const proTarget = nutritionTargets.protein || client?.protein_target_g || 0
    const carbTarget = nutritionTargets.carbs || client?.carbs_target_g || 0
    const fatTarget = nutritionTargets.fats || client?.fats_target_g || 0

    const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other']
    const MEAL_COLOURS = {
      breakfast: 'bg-amber-50 text-amber-700 border-amber-200',
      lunch: 'bg-blue-50 text-blue-700 border-blue-200',
      dinner: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      snack: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      other: 'bg-gray-100 text-gray-600 border-gray-200',
    }

    return (
      <div className="px-4 py-4 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nutrition</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTDEE(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              🔢 Calc
            </button>
            <button onClick={() => setShowNutritionAI(true)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <span>✨</span> AI Ideas
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-4 border-b border-gray-100 -mx-4 px-4">
          {[['log', "Today's Log"], ['saved', 'Saved Meals']].map(([id, label]) => (
            <button key={id} onClick={() => setNutritionSubTab(id)}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${nutritionSubTab === id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* TDEE Calculator */}
        {showTDEE && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Calorie Calculator</p>
              <button onClick={() => { setShowTDEE(false); setTdeeResult(null) }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Age</label>
                  <input type="number" placeholder="e.g. 28" value={tdeeInputs.age} onChange={e => setTdeeInputs(p => ({ ...p, age: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Gender</label>
                  <select value={tdeeInputs.gender} onChange={e => setTdeeInputs(p => ({ ...p, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Height (cm)</label>
                  <input type="number" placeholder="e.g. 175" value={tdeeInputs.heightCm} onChange={e => setTdeeInputs(p => ({ ...p, heightCm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Weight (kg)</label>
                  <input type="number" placeholder="e.g. 75" value={tdeeInputs.weightKg} onChange={e => setTdeeInputs(p => ({ ...p, weightKg: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Activity Level</label>
                <select value={tdeeInputs.activity} onChange={e => setTdeeInputs(p => ({ ...p, activity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="1.2">Sedentary — little or no exercise</option>
                  <option value="1.375">Lightly active — 1-3 days/week</option>
                  <option value="1.55">Moderately active — 3-5 days/week</option>
                  <option value="1.725">Very active — 6-7 days/week</option>
                  <option value="1.9">Extremely active — physical job + training</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const age = parseFloat(tdeeInputs.age)
                  const h = parseFloat(tdeeInputs.heightCm)
                  const w = parseFloat(tdeeInputs.weightKg)
                  const act = parseFloat(tdeeInputs.activity)
                  if (!age || !h || !w) { alert('Please fill in all fields'); return }
                  const bmr = tdeeInputs.gender === 'male'
                    ? (10 * w) + (6.25 * h) - (5 * age) + 5
                    : (10 * w) + (6.25 * h) - (5 * age) - 161
                  const maintenance = Math.round(bmr * act)
                  setTdeeResult({
                    maintenance,
                    fatLoss: maintenance - 500,
                    aggressiveLoss: maintenance - 750,
                    muscleGain: maintenance + 300,
                  })
                }}
                className="w-full bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Calculate
              </button>
              {tdeeResult && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Results</p>
                  {[
                    { label: 'Maintain Weight', cal: tdeeResult.maintenance, colour: 'bg-blue-50 border-blue-100', text: 'text-blue-600', desc: 'Stay at current weight' },
                    { label: 'Fat Loss', cal: tdeeResult.fatLoss, colour: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', desc: '~0.5kg loss per week' },
                    { label: 'Aggressive Fat Loss', cal: tdeeResult.aggressiveLoss, colour: 'bg-orange-50 border-orange-100', text: 'text-orange-600', desc: '~0.75kg loss per week' },
                    { label: 'Muscle Gain', cal: tdeeResult.muscleGain, colour: 'bg-purple-50 border-purple-100', text: 'text-purple-600', desc: 'Lean bulk' },
                  ].map(r => (
                    <div key={r.label} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${r.colour}`}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${r.text}`}>{r.label}</p>
                        <p className="text-[10px] text-gray-400">{r.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className={`text-lg font-black ${r.text}`}>{r.cal}<span className="text-xs font-medium ml-0.5">kcal</span></p>
                        <button
                          onClick={() => handleSetGoal(r.cal)}
                          className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          Set goal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {nutritionSubTab === 'log' ? (
          <>
            {/* Macro totals */}
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Today's Totals</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Calories', value: todayCalories, unit: 'kcal', target: calTarget, colour: 'text-orange-500', bar: 'bg-orange-400' },
                  { label: 'Protein', value: todayProtein, unit: 'g', target: proTarget, colour: 'text-red-500', bar: 'bg-red-400' },
                  { label: 'Carbs', value: todayCarbs, unit: 'g', target: carbTarget, colour: 'text-yellow-500', bar: 'bg-yellow-400' },
                  { label: 'Fats', value: todayFats, unit: 'g', target: fatTarget, colour: 'text-blue-500', bar: 'bg-blue-400' },
                ].map(m => {
                  const pct = m.target > 0 ? Math.min(100, Math.round((m.value / m.target) * 100)) : 0
                  const remaining = m.target > 0 ? m.target - m.value : null
                  const over = remaining !== null && remaining < 0
                  return (
                    <div key={m.label} className="flex flex-col items-center">
                      {m.target > 0 ? (
                        <div className="text-center">
                          <span className={`text-base font-black ${m.colour}`}>{m.value}</span>
                          <span className="text-[10px] text-gray-300 font-medium">/{m.target}</span>
                        </div>
                      ) : (
                        <span className={`text-lg font-black ${m.colour}`}>{m.value}</span>
                      )}
                      <span className="text-[10px] text-gray-400 mt-0.5">{m.unit}</span>
                      {m.target > 0 && (
                        <>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : m.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-[9px] font-semibold mt-0.5 ${over ? 'text-red-400' : 'text-gray-300'}`}>
                            {over ? `${Math.abs(remaining)}${m.unit} over` : `${remaining}${m.unit} left`}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] text-gray-400 mt-0.5">{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add food */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Food Log</p>
                <button onClick={() => setShowAddFood(v => !v)} className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Plus size={12} /> Add Food
                </button>
              </div>

              {showAddFood && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search food e.g. chicken breast, oats..."
                      value={foodSearchQuery}
                      onChange={e => {
                        setFoodSearchQuery(e.target.value)
                        setFoodInput(f => ({ ...f, name: e.target.value }))
                        clearTimeout(window._foodSearchTimer)
                        window._foodSearchTimer = setTimeout(() => searchFood(e.target.value), 400)
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-8"
                    />
                    {foodSearchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {foodSearchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-48 overflow-y-auto">
                      {foodSearchResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setFoodBase({ calories: r.calories, protein: r.protein, carbs: r.carbs, fats: r.fats })
                            setFoodInput(f => ({ ...f, name: r.name, calories: String(r.calories), protein: String(r.protein), carbs: String(r.carbs), fats: String(r.fats) }))
                            setFoodSearchQuery(r.name)
                            setFoodServingSize(100)
                            setFoodSearchResults([])
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {r.brand && <span className="text-xs text-gray-400 truncate max-w-[120px]">{r.brand}</span>}
                            <span className="text-xs text-orange-500 font-medium">{r.calories} kcal</span>
                            <span className="text-xs text-red-400">P {r.protein}g</span>
                            <span className="text-xs text-yellow-500">C {r.carbs}g</span>
                            <span className="text-xs text-blue-400">F {r.fats}g</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <select
                    value={foodInput.meal_type}
                    onChange={e => setFoodInput(f => ({ ...f, meal_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {['breakfast', 'lunch', 'dinner', 'snack', 'other'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>

                  {foodInput.calories && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-emerald-700">Serving size</p>
                        <p className="text-xs text-emerald-600 font-medium">
                          {Math.round(parseFloat(foodInput.calories) * (foodServingSize / 100))} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="2000"
                          value={foodServingSize}
                          onChange={e => {
                            setFoodServingSize(e.target.value)
                          }}
                          onBlur={e => {
                            const size = parseFloat(e.target.value) || 100
                            setFoodServingSize(size)
                            if (foodBase) {
                              const scale = size / 100
                              setFoodInput(f => ({
                                ...f,
                                calories: String(Math.round(foodBase.calories * scale)),
                                protein: String(parseFloat((foodBase.protein * scale).toFixed(1))),
                                carbs: String(parseFloat((foodBase.carbs * scale).toFixed(1))),
                                fats: String(parseFloat((foodBase.fats * scale).toFixed(1))),
                              }))
                            }
                          }}
                          className="w-20 border border-emerald-300 rounded-lg px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                        />
                        <span className="text-xs text-emerald-600 font-medium">g</span>
                        <span className="text-xs text-gray-400 ml-1">P {foodInput.protein}g · C {foodInput.carbs}g · F {foodInput.fats}g</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'calories', label: 'Calories (kcal)', colour: 'text-orange-500' },
                      { key: 'protein', label: 'Protein (g)', colour: 'text-red-500' },
                      { key: 'carbs', label: 'Carbs (g)', colour: 'text-yellow-500' },
                      { key: 'fats', label: 'Fats (g)', colour: 'text-blue-500' },
                    ].map(f => (
                      <div key={f.key} className="relative">
                        <input
                          type="number"
                          placeholder={f.label}
                          value={foodInput[f.key]}
                          onChange={e => setFoodInput(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleAddFood()
                        setFoodSearchQuery('')
                        setFoodSearchResults([])
                        setFoodServingSize(100)
                        setFoodBase(null)
                      }}
                      disabled={addingFood || !foodInput.name.trim()}
                      className="flex-1 bg-black text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {addingFood ? 'Saving...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddFood(false)
                        setFoodSearchQuery('')
                        setFoodSearchResults([])
                        setFoodServingSize(100)
                        setFoodBase(null)
                        setFoodInput({ name: '', calories: '', protein: '', carbs: '', fats: '', meal_type: 'breakfast' })
                      }}
                      className="flex-1 border border-gray-200 text-gray-500 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {foodLogs.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                  <Utensils size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nothing logged yet today.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {foodLogs.map(log => {
                    const mealColour = MEAL_COLOURS[log.meal_type?.toLowerCase()] ?? MEAL_COLOURS.other
                    return (
                      <div key={log.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${mealColour}`}>{log.meal_type || 'other'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{log.food_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{Math.round(log.calories)} kcal · P{Math.round(log.protein_g)}g · C{Math.round(log.carbs_g)}g · F{Math.round(log.fats_g)}g</p>
                        </div>
                        <button onClick={() => handleDeleteFood(log.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {savedMeals.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                <Utensils size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No saved meals yet.</p>
                <p className="text-xs text-gray-300 mt-1">Use AI Ideas to generate and save meals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedMeals.map(meal => {
                  const isExpanded = expandedMealId === meal.id
                  return (
                    <div key={meal.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <button
                          onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                          className="flex-1 text-left min-w-0 mr-3"
                        >
                          <p className="text-sm font-bold text-gray-900 truncate">{meal.name || meal.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {meal.calories > 0 && <span className="text-xs text-orange-500 font-semibold">{meal.calories} kcal</span>}
                            {meal.protein_g > 0 && <span className="text-xs text-red-500">P{meal.protein_g}g</span>}
                            {meal.carbs_g > 0 && <span className="text-xs text-yellow-500">C{meal.carbs_g}g</span>}
                            {meal.fats_g > 0 && <span className="text-xs text-blue-500">F{meal.fats_g}g</span>}
                            <span className="text-gray-200">·</span>
                            <span className={`text-xs font-semibold ${isExpanded ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {isExpanded ? 'Collapse ↑' : 'View ↓'}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleAddMealToLog(meal)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex-shrink-0">
                          <Plus size={12} /> Add to Log
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                          <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{meal.content}</pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div className="h-20" />
      </div>
    )
  }

  function renderDatabase() {
    const FILTER_TYPES = ['all', 'pdf', 'podcast', 'article', 'video', 'other']
    const filtered = resourceFilter === 'all' ? resources : resources.filter(r => r.type === resourceFilter)

    return (
      <div className="px-4 py-4 space-y-5">
        <h2 className="text-lg font-bold text-gray-900">Resources</h2>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TYPES.map(type => (
            <button key={type} onClick={() => setResourceFilter(type)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${resourceFilter === type ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>

        {/* Resources list */}
        {filtered.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-10 text-center">
            <BookOpen size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{resourceFilter === 'all' ? 'No resources yet.' : `No ${resourceFilter} resources yet.`}</p>
            <p className="text-xs text-gray-300 mt-1">Your trainer will add resources here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(resource => {
              const IconComp = RESOURCE_ICONS[resource.type] ?? RESOURCE_ICONS.other
              const colourClass = RESOURCE_COLOURS[resource.type] ?? RESOURCE_COLOURS.other
              const hasLink = resource.url || resource.file_path
              return (
                <div key={resource.id} className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${colourClass}`}>
                      <IconComp size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{resource.title}</p>
                      {resource.description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{resource.description}</p>}
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize mt-2 ${colourClass}`}>{resource.type}</span>
                    </div>
                  </div>
                  {hasLink && (
                    <a href={resource.url || resource.file_path} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      <ExternalLink size={14} />
                      {resource.type === 'pdf' ? 'Open PDF' : resource.type === 'podcast' ? 'Listen' : resource.type === 'video' ? 'Watch' : 'Open'}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="h-20" />
      </div>
    )
  }

  const tabContent = { home: renderHome, calendar: renderCalendar, program: renderProgram, nutrition: renderNutrition, database: renderDatabase }

  const TAB_CONFIG = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'program', label: 'Program', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'database', label: 'Resources', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-lg mx-auto">
        {tabContent[activeTab]?.()}
      </div>

      {/* Calendar workout detail bottom sheet */}
      {calDetailWorkout && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center"
          onClick={() => setCalDetailWorkout(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5">
              <p className="text-base font-bold text-gray-900 truncate">
                {calDetailWorkout.program_workouts?.name || calDetailWorkout._customWorkout?.name || 'Workout'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatShortDate(calDetailWorkout.scheduled_date)}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setPreviewWorkout(calDetailWorkout); setCalDetailWorkout(null) }}
              className="w-full bg-black text-white text-sm font-bold py-3.5 rounded-2xl mb-2 hover:bg-gray-800 transition-colors"
            >
              Start Workout
            </button>
            <button
              onClick={e => { e.stopPropagation(); setDatePickerMode('move') }}
              className="w-full bg-white border border-black text-gray-900 text-sm font-semibold py-3.5 rounded-2xl mb-2 hover:bg-gray-50 transition-colors"
            >
              Move to another day
            </button>
            <button
              onClick={e => { e.stopPropagation(); setDatePickerMode('duplicate') }}
              className="w-full bg-white border border-black text-gray-900 text-sm font-semibold py-3.5 rounded-2xl mb-2 hover:bg-gray-50 transition-colors"
            >
              Duplicate to another day
            </button>
            <button
              onClick={e => { e.stopPropagation(); setCalDetailWorkout(null) }}
              className="w-full text-center text-sm text-gray-400 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Date picker modal */}
      {datePickerMode && (
        <DatePickerModal
          title={
            datePickerMode === 'move' ? 'Move to another day' :
            datePickerMode === 'duplicate' ? 'Duplicate to another day' :
            'Add to calendar'
          }
          scheduledWorkouts={scheduledWorkouts}
          onConfirm={handleDatePickerConfirm}
          onCancel={() => {
            setDatePickerMode(null)
            if (datePickerMode === 'schedule') setProgramWorkoutToSchedule(null)
          }}
        />
      )}

      {/* MODAL A — Add to calendar (multi-date picker from program detail) */}
      {showAddToCalModal && selectedProgramDay && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => { setShowAddToCalModal(false); setAddToCalDates([]) }}>
          <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Add to calendar</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedProgramDay.name}</p>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4">
              <div className="grid grid-cols-7 mb-2">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              {(() => {
                const todayStr = toLocalDateStr()
                const days = Array.from({ length: 42 }, (_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() + i)
                  return toLocalDateStr(d)
                })
                const firstDay = new Date(days[0] + 'T00:00:00')
                const dow = firstDay.getDay()
                const startPad = dow === 0 ? 6 : dow - 1
                const busyDates = new Set(
                  scheduledWorkouts
                    .filter(sw => sw.program_workout_id === selectedProgramDay.id)
                    .map(sw => sw.scheduled_date)
                )
                return (
                  <div className="grid grid-cols-7 gap-y-1">
                    {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                    {days.map(dateStr => {
                      const isSelected = addToCalDates.includes(dateStr)
                      const hasDot = busyDates.has(dateStr)
                      const isToday = dateStr === todayStr
                      const dayNum = parseInt(dateStr.split('-')[2])
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setAddToCalDates(prev =>
                            prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                          )}
                          className={`h-10 flex flex-col items-center justify-center rounded-lg transition-colors ${
                            isSelected ? 'bg-black' : isToday ? 'ring-2 ring-inset ring-black' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                            {dayNum}
                          </span>
                          {hasDot && (
                            <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white/70' : 'bg-emerald-500'}`} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                disabled={addToCalDates.length === 0}
                onClick={handleAddToCalConfirm}
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40 mb-2"
              >
                {addToCalDates.length === 0 ? 'Select days' : `Add to ${addToCalDates.length} day${addToCalDates.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => { setShowAddToCalModal(false); setAddToCalDates([]) }}
                className="w-full text-center text-sm text-gray-400 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL B — Workout picker (from "+ Add" on schedule day panel) */}
      {showWorkoutPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => { setShowWorkoutPickerModal(false); setWorkoutPickerSelected(null) }}>
          <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Add workout</h3>
              <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(selectedCalDate)}</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {programWorkouts.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">My Program</p>
                  {programWorkouts.map(pw => {
                    const exCount = (allProgramExercises[pw.id] ?? []).length
                    const isSelected = workoutPickerSelected?.type === 'program' && workoutPickerSelected.workout.id === pw.id
                    return (
                      <button
                        key={pw.id}
                        onClick={() => setWorkoutPickerSelected({ type: 'program', workout: pw })}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center gap-3 transition-colors ${isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black text-gray-500">D{pw.day_number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{pw.name}</p>
                          <p className="text-xs text-gray-400">{exCount} exercise{exCount !== 1 ? 's' : ''}</p>
                        </div>
                        {isSelected && <Check size={16} className="text-emerald-500 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </>
              )}
              {savedWorkouts.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">Saved Workouts</p>
                  {savedWorkouts.map(sw => {
                    const isSelected = workoutPickerSelected?.type === 'saved' && workoutPickerSelected.workout.id === sw.id
                    return (
                      <button
                        key={sw.id}
                        onClick={() => setWorkoutPickerSelected({ type: 'saved', workout: sw })}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center gap-3 transition-colors ${isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Dumbbell size={14} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{sw.name}</p>
                          <p className="text-xs text-gray-400">Saved workout</p>
                        </div>
                        {isSelected && <Check size={16} className="text-emerald-500 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </>
              )}
              {programWorkouts.length === 0 && savedWorkouts.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-gray-400">No workouts available.</p>
                  <p className="text-xs text-gray-300 mt-1">Ask your trainer to assign a program, or build one with AI.</p>
                </div>
              )}
              <div className="h-4" />
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                disabled={!workoutPickerSelected}
                onClick={handleWorkoutPickerConfirm}
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl text-sm disabled:opacity-40 mb-2"
              >
                {workoutPickerSelected
                  ? `Schedule for ${formatShortDate(selectedCalDate)}`
                  : 'Select a workout'}
              </button>
              <button
                onClick={() => { setShowWorkoutPickerModal(false); setWorkoutPickerSelected(null) }}
                className="w-full text-center text-sm text-gray-400 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {scheduleSuccessMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-black text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg pointer-events-none whitespace-nowrap">
          {scheduleSuccessMsg}
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-pb">
        <div className="max-w-lg mx-auto flex">
          {TAB_CONFIG.map(tab => {
            const IconComp = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'program') setProgramView('list') }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                <IconComp size={20} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
