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

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0]
}

function isPast(dateStr) {
  return dateStr < new Date().toISOString().split('T')[0]
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
function AIChat({ context, placeholder, systemPrompt, onClose, onSave }) {
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
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  {msg.content.split('\n').filter(line => line.trim() !== '').map((line, li) => {
                    if (line.startsWith('### ')) return <p key={li} className="font-bold text-gray-900 text-sm mt-2">{line.replace('### ', '')}</p>
                    if (line.startsWith('## ')) return <p key={li} className="font-bold text-gray-900 text-base mt-3 mb-1">{line.replace('## ', '')}</p>
                    if (line.startsWith('# ')) return <p key={li} className="font-bold text-gray-900 text-lg mt-3 mb-1">{line.replace('# ', '')}</p>
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <div key={li} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span><span>{line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span></div>
                    }
                    if (/^\d+\. /.test(line)) {
                      const num = line.match(/^(\d+)\. /)[1]
                      return <div key={li} className="flex items-start gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">{num}.</span><span>{line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span></div>
                    }
                    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                    return <p key={li} dangerouslySetInnerHTML={{ __html: formatted }} />
                  })}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && onSave && !loading && (
          <div className="flex justify-start">
            <button
              onClick={() => onSave(messages[messages.length - 1].content)}
              className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors ml-1"
            >
              <Plus size={12} /> Save this workout
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
function WorkoutLogging({ scheduledWorkout, exercises, client, onBack, onComplete }) {
  const [setInputs, setSetInputs] = useState({})
  const [savingSet, setSavingSet] = useState(null)
  const [workoutLogId, setWorkoutLogId] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const logIdRef = useRef(null)
  const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)

  async function ensureLog() {
    if (logIdRef.current) return logIdRef.current
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('workout_logs').insert({
      client_id: client.id,
      workout_id: scheduledWorkout.id,
      logged_by: user.id,
      completed: false,
    }).select('id').single()
    if (error || !data) return null
    logIdRef.current = data.id
    setWorkoutLogId(data.id)
    return data.id
  }

  async function handleSaveSet(exId, exDbId, setIdx) {
    const key = `${exId}_${setIdx}`
    const inp = setInputs[key] ?? {}
    const reps = parseInt(inp.reps, 10)
    if (!reps || reps <= 0) return
    setSavingSet(key)
    const logId = await ensureLog()
    if (!logId) { setSavingSet(null); return }
    const { error } = await supabase.from('exercise_logs').insert({
      workout_log_id: logId,
      exercise_id: exDbId,
      set_number: setIdx + 1,
      reps_completed: reps,
      weight_kg: parseFloat(inp.weight) || null,
    })
    setSavingSet(null)
    if (!error) setSetInputs(prev => ({ ...prev, [key]: { ...prev[key], saved: true } }))
  }

  async function handleComplete() {
    const logId = logIdRef.current
    if (!logId) return
    setCompleting(true)
    await supabase.from('workout_logs').update({ completed: true }).eq('id', logId)
    setCompleting(false)
    setCompleted(true)
    onComplete && onComplete(scheduledWorkout.id)
  }

  function setInput(key, field, value) {
    setSetInputs(prev => ({ ...prev, [key]: { ...(prev[key] ?? {}), [field]: value, saved: false } }))
  }

  const allSaved = exercises.length > 0 && exercises.every(ex =>
    Array.from({ length: ex.sets || 3 }).some((_, i) => setInputs[`${ex.id}_${i}`]?.saved)
  )

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 flex-shrink-0">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">{formatDateLabel(scheduledWorkout.scheduled_date)}</p>
            <h1 className="text-base font-bold text-gray-900 truncate">{scheduledWorkout.program_workouts?.name || 'Workout'}</h1>
          </div>
          {estMin > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <Clock size={13} /><span>~{estMin} min</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {completed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Workout complete!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Great work — this session has been saved.</p>
            </div>
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No exercises in this workout yet.</p>
          </div>
        ) : exercises.map((ex, idx) => {
          const exName = ex.exercises?.name || 'Exercise'
          const muscle = ex.exercises?.muscle_group
          const chipClass = MUSCLE_CHIP[muscle] ?? MUSCLE_CHIP.Other
          const setCount = ex.sets || 3
          return (
            <div key={ex.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-4 border-b border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{exName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {muscle && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipClass}`}>{muscle}</span>}
                      <span className="text-xs text-gray-400">{setCount} sets × {ex.reps || '—'} reps</span>
                      {ex.rest_seconds && <span className="text-xs text-gray-400">· {ex.rest_seconds}s rest</span>}
                    </div>
                    {ex.notes && <p className="text-xs text-gray-400 mt-1 italic">{ex.notes}</p>}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="grid grid-cols-[36px_1fr_1fr_36px] gap-2 px-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Set</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Weight kg</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Reps</span>
                  <span />
                </div>
                {Array.from({ length: setCount }).map((_, i) => {
                  const key = `${ex.id}_${i}`
                  const inp = setInputs[key] ?? {}
                  const isSaved = !!inp.saved
                  const isSaving = savingSet === key
                  return (
                    <div key={i} className={`grid grid-cols-[36px_1fr_1fr_36px] gap-2 items-center px-1 py-1 rounded-xl transition-colors ${isSaved ? 'bg-emerald-50' : ''}`}>
                      <span className="text-xs font-semibold text-gray-400 text-center">{i + 1}</span>
                      <input type="number" min="0" step="0.5" placeholder="—" disabled={isSaved} value={inp.weight ?? ''} onChange={e => setInput(key, 'weight', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400 w-full" />
                      <input type="number" min="1" step="1" placeholder="—" disabled={isSaved} value={inp.reps ?? ''} onChange={e => setInput(key, 'reps', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400 w-full" />
                      <button onClick={() => handleSaveSet(ex.id, ex.exercises?.id, i)} disabled={isSaved || isSaving || !inp.reps}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isSaved ? 'bg-emerald-500 text-white' : 'border border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
                        {isSaving ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!completed && allSaved && (
          <button onClick={handleComplete} disabled={completing}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
            {completing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><CheckCircle2 size={18} />Complete Workout</>}
          </button>
        )}
        <div className="h-8" />
      </div>
    </div>
  )
}

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
  const [completedIds, setCompletedIds] = useState(new Set())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedCalDate, setSelectedCalDate] = useState(new Date().toISOString().split('T')[0])

  // Program
  const [programView, setProgramView] = useState('list')
  const [selectedProgramDay, setSelectedProgramDay] = useState(null)
  const [showWorkoutAI, setShowWorkoutAI] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState([])

  // Nutrition
  const [foodLogs, setFoodLogs] = useState([])
  const [showNutritionAI, setShowNutritionAI] = useState(false)
  const [foodInput, setFoodInput] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', meal_type: 'breakfast' })
  const [addingFood, setAddingFood] = useState(false)
  const [showAddFood, setShowAddFood] = useState(false)

  // Database
  const [resourceFilter, setResourceFilter] = useState('all')

  const todayStr = new Date().toISOString().split('T')[0]

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

      const today = new Date().toISOString().split('T')[0]

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
      const { data: swData } = await supabase.from('scheduled_workouts').select('id, scheduled_date, program_workout_id, program_workouts(id, name, day_number)').eq('client_id', clientRow.id).gte('scheduled_date', from.toISOString().split('T')[0]).lte('scheduled_date', to.toISOString().split('T')[0]).order('scheduled_date', { ascending: true })
      const fetchedSW = swData ?? []
      setScheduledWorkouts(fetchedSW)

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

      // Workout logs for completion status
      const { data: logsData } = await supabase.from('workout_logs').select('id, completed, workout_id').eq('client_id', clientRow.id)
      const logs = logsData ?? []
      setWorkoutLogs(logs)
      setCompletedIds(new Set(logs.filter(l => l.completed).map(l => l.workout_id)))

      // Food logs for today
      const { data: foodData } = await supabase.from('food_logs').select('*').eq('client_id', clientRow.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false })
      setFoodLogs(foodData ?? [])

      // Resources from PT
      const { data: resourceData } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
      setResources(resourceData ?? [])

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
  const calTarget = client?.calorie_target || 0
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
  if (showWorkoutAI) return <AIChat context="Build a custom workout" placeholder="e.g. Give me a 45 minute upper body workout with dumbbells only" systemPrompt="You are an expert personal trainer. When giving a workout, always use this exact format with no markdown symbols, no asterisks, no hashtags:\n\nWARM UP\nExercise name — X minutes or X reps\nExercise name — X minutes or X reps\n\nMAIN SESSION\nExercise name\nSets: X  Reps: X  Rest: Xs\n\nExercise name\nSets: X  Reps: X  Rest: Xs\n\nCOOL DOWN\nExercise name — X minutes\n\nUse plain text only. No bullet points, no asterisks, no hashtags, no bold markers. Just clean section headers in CAPS followed by exercise details on separate lines." onClose={() => setShowWorkoutAI(false)} onSave={(content) => { alert('Workout saved as template! Coming soon: add to a specific day.') }} />
  if (showNutritionAI) return <AIChat context="Nutrition & meal ideas" placeholder="e.g. Give me a high protein breakfast under 500 calories" systemPrompt="You are an expert nutritionist and chef. Help the user with meal ideas, recipes, and nutrition advice. Give practical, delicious suggestions with macros where helpful. Keep advice evidence-based and actionable. When giving a meal or recipe, always end with a MACROS section showing: Calories: X, Protein: Xg, Carbs: Xg, Fats: Xg" onClose={() => setShowNutritionAI(false)} onSave={async (content) => { const calorieMatch = content.match(/[Cc]alories?:?\s*(\d+)/); const proteinMatch = content.match(/[Pp]rotein:?\s*(\d+)/); const carbsMatch = content.match(/[Cc]arbs?:?\s*(\d+)/); const fatsMatch = content.match(/[Ff]ats?:?\s*(\d+)/); const mealName = content.split('\n')[0].replace(/^#+\s*/, '').trim().substring(0, 50) || 'AI Meal'; try { const { data: { user } } = await supabase.auth.getUser(); await supabase.from('food_logs').insert({ client_id: client.id, food_name: mealName, meal_type: 'other', calories: parseFloat(calorieMatch?.[1]) || 0, protein_g: parseFloat(proteinMatch?.[1]) || 0, carbs_g: parseFloat(carbsMatch?.[1]) || 0, fats_g: parseFloat(fatsMatch?.[1]) || 0, logged_at: new Date().toISOString() }); setShowNutritionAI(false); alert('Meal added to your food log!') } catch(e) { console.error(e) } }} />

  // Workout logging overlay
  if (loggingWorkout) {
    const exercises = workoutExercises[loggingWorkout.program_workout_id] ?? []
    return (
      <WorkoutLogging
        scheduledWorkout={loggingWorkout}
        exercises={exercises}
        client={client}
        onBack={() => setLoggingWorkout(null)}
        onComplete={(id) => {
          setCompletedIds(prev => new Set([...prev, id]))
          setLoggingWorkout(null)
        }}
      />
    )
  }

  // ── TAB CONTENT ─────────────────────────────────────────────────────────────

  function renderHome() {
    const firstName = client.full_name?.split(' ')[0] || client.full_name
    return (
      <div className="px-4 py-5 space-y-5">

        {/* Welcome header */}
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

        {/* Weight card */}
        {!todayWeight ? (
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Log Today's Weight</p>
            <div className="flex items-center gap-2">
              <input type="number" step="0.1" min="20" max="500" placeholder="Enter weight..." value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogWeight() }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <span className="text-xs text-gray-400 flex-shrink-0">kg</span>
              <button onClick={handleLogWeight} disabled={savingWeight || !weightInput}
                className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0">
                {savingWeight ? '...' : 'Log'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Today's weight</p>
                <p className="text-sm font-bold text-gray-900">{todayWeight} kg</p>
              </div>
            </div>
            <button onClick={() => setTodayWeight(null)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">Update</button>
          </div>
        )}

        {/* Today's workout */}
        {nextWorkouts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isToday(nextWorkoutDate) ? "Today's Workout" : formatShortDate(nextWorkoutDate)}
              </p>
              <button onClick={() => setActiveTab('calendar')} className="text-xs text-emerald-600 font-semibold">Full schedule →</button>
            </div>
            {nextWorkouts.map(sw => {
              const exercises = workoutExercises[sw.program_workout_id] ?? []
              const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
              const done = completedIds.has(sw.id)
              return (
                <div key={sw.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${done ? 'border-emerald-200' : 'border-gray-200'}`}>
                  <div className={`px-4 pt-4 pb-3 ${done ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h2 className="text-base font-bold text-gray-900 truncate">{sw.program_workouts?.name || 'Workout'}</h2>
                      {done && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">Done ✓</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      {estMin > 0 && <div className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /><span>~{estMin} min</span></div>}
                      {exercises.length > 0 && <div className="flex items-center gap-1 text-xs text-gray-400"><Dumbbell size={12} /><span>{exercises.length} exercises</span></div>}
                    </div>
                    {exercises.slice(0, 3).map((ex, idx) => (
                      <div key={ex.id} className="flex items-center gap-2.5 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <span className="text-xs text-gray-700 font-medium truncate flex-1">{ex.exercises?.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{ex.sets}×{ex.reps}</span>
                      </div>
                    ))}
                    {exercises.length > 3 && <p className="text-xs text-gray-400 pl-7">+ {exercises.length - 3} more</p>}
                  </div>
                  <div className="px-4 pb-4">
                    <button onClick={() => setLoggingWorkout(sw)}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${done ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-black hover:bg-gray-800 text-white'}`}>
                      {done ? 'View Workout' : 'Start Workout'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick stats */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today at a Glance</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setActiveTab('nutrition')} className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} className="text-orange-500" />
                <span className="text-xs font-semibold text-gray-500">Calories</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{todayCalories}<span className="text-sm font-medium text-gray-400 ml-1">kcal</span></p>
              {calTarget > 0 && (
                <>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${calPct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">of {calTarget} target</p>
                </>
              )}
            </button>
            <button onClick={() => setActiveTab('nutrition')} className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-red-500" />
                <span className="text-xs font-semibold text-gray-500">Protein</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{todayProtein}<span className="text-sm font-medium text-gray-400 ml-1">g</span></p>
              {client?.protein_target_g > 0 && (
                <>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, Math.round((todayProtein / client.protein_target_g) * 100))}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">of {client.protein_target_g}g target</p>
                </>
              )}
            </button>
          </div>
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
        <h2 className="text-lg font-bold text-gray-900">Schedule</h2>

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
              const hasCompleted = groupedByDate[dateStr]?.some(sw => completedIds.has(sw.id))
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
            <p className="text-sm font-bold text-gray-900">{selectedDateLabel}</p>
            {isToday(selectedCalDate) && <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">TODAY</span>}
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
                const done = completedIds.has(sw.id)
                const exercises = workoutExercises[sw.program_workout_id] ?? []
                const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
                return (
                  <button key={sw.id} onClick={() => setLoggingWorkout(sw)}
                    className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'border-2 border-gray-200'}`}>
                      {done && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{sw.program_workouts?.name || 'Workout'}</p>
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
      </div>
    )
  }

  function renderProgram() {
    if (programView === 'detail' && selectedProgramDay) {
      const exercises = allProgramExercises[selectedProgramDay.id] ?? []
      return (
        <div className="px-4 py-4">
          <button onClick={() => { setProgramView('list'); setSelectedProgramDay(null) }} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <ArrowLeft size={16} /><span>Back to program</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedProgramDay.name}</h2>
          <p className="text-xs text-gray-400 mb-4">Day {selectedProgramDay.day_number} · {exercises.length} exercises</p>
          <div className="space-y-3">
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
          <div className="h-20" />
        </div>
      )
    }

    return (
      <div className="px-4 py-4 space-y-5">
        <h2 className="text-lg font-bold text-gray-900">Program</h2>

        {/* Assigned program */}
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
                const exercises = allProgramExercises[pw.id] ?? []
                const estMin = Math.round(exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0) * 2.5)
                return (
                  <button key={pw.id} onClick={() => { setSelectedProgramDay(pw); setProgramView('detail') }}
                    className="w-full text-left bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-gray-500">D{pw.day_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{pw.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{exercises.length} exercises</span>
                        {estMin > 0 && <><span className="text-gray-300 text-xs">·</span><span className="text-xs text-gray-400">~{estMin} min</span></>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
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

        {/* Build your own */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Build Your Own</p>
          <button onClick={() => setShowWorkoutAI(true)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Build with AI</p>
              <p className="text-xs text-gray-400 mt-0.5">Describe your goal and get a custom workout</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        </div>

        <div className="h-20" />
      </div>
    )
  }

  function renderNutrition() {
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
          <button onClick={() => setShowNutritionAI(true)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span>✨</span> AI Ideas
          </button>
        </div>

        {/* Macro rings */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Today's Totals</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: todayCalories, unit: 'kcal', target: calTarget, colour: 'text-orange-500', bar: 'bg-orange-400' },
              { label: 'Protein', value: todayProtein, unit: 'g', target: client?.protein_target_g || 0, colour: 'text-red-500', bar: 'bg-red-400' },
              { label: 'Carbs', value: todayCarbs, unit: 'g', target: client?.carbs_target_g || 0, colour: 'text-yellow-500', bar: 'bg-yellow-400' },
              { label: 'Fats', value: todayFats, unit: 'g', target: client?.fats_target_g || 0, colour: 'text-blue-500', bar: 'bg-blue-400' },
            ].map(m => {
              const pct = m.target > 0 ? Math.min(100, Math.round((m.value / m.target) * 100)) : 0
              return (
                <div key={m.label} className="flex flex-col items-center">
                  <span className={`text-lg font-black ${m.colour}`}>{m.value}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{m.unit}</span>
                  {m.target > 0 && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${pct}%` }} />
                    </div>
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Food Log</p>
            <button onClick={() => setShowAddFood(v => !v)} className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Add Food
            </button>
          </div>

          {showAddFood && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
              <input type="text" placeholder="Food name" value={foodInput.name} onChange={e => setFoodInput(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <select value={foodInput.meal_type} onChange={e => setFoodInput(f => ({ ...f, meal_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'calories', label: 'Calories (kcal)' },
                  { key: 'protein', label: 'Protein (g)' },
                  { key: 'carbs', label: 'Carbs (g)' },
                  { key: 'fats', label: 'Fats (g)' },
                ].map(f => (
                  <input key={f.key} type="number" placeholder={f.label} value={foodInput[f.key]} onChange={e => setFoodInput(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddFood} disabled={addingFood || !foodInput.name.trim()}
                  className="flex-1 bg-black text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                  {addingFood ? 'Saving...' : 'Add'}
                </button>
                <button onClick={() => setShowAddFood(false)} className="flex-1 border border-gray-200 text-gray-500 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
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
