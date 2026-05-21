import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { X, Edit3, Check, ChevronRight, Plus, Search } from 'lucide-react'

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Other',
]

const MUSCLE_CHIP = {
  Chest:        { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  Back:         { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  Shoulders:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  Biceps:       { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500'    },
  Triceps:      { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  Legs:         { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  Glutes:       { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
  Core:         { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  Cardio:       { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
  'Full Body':  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Other:        { bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400'    },
}

function MuscleChip({ group, size = 'sm' }) {
  const cfg = MUSCLE_CHIP[group] ?? MUSCLE_CHIP.Other
  const textSize = size === 'lg' ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${cfg.bg} ${cfg.text} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {group}
    </span>
  )
}

function ExerciseDetailModal({ exercise, userId, onClose, onSave }) {
  const isOwn = !exercise.is_global && exercise.created_by === userId
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(exercise.name)
  const [editMuscle, setEditMuscle] = useState(exercise.muscle_group)
  const [editInstructions, setEditInstructions] = useState(exercise.instructions ?? '')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  async function handleSave() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: editName.trim(),
          muscle_group: editMuscle,
          instructions: editInstructions.trim() || null,
        })
        .eq('id', exercise.id)
      if (error) throw error
      onSave({ ...exercise, name: editName.trim(), muscle_group: editMuscle, instructions: editInstructions.trim() || null })
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const cfg = MUSCLE_CHIP[exercise.muscle_group] ?? MUSCLE_CHIP.Other

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity duration-250"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-250"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-100 ${cfg.bg}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{exercise.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {editing ? (
                  <select
                    value={editMuscle}
                    onChange={e => setEditMuscle(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                  >
                    {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <MuscleChip group={exercise.muscle_group} size="lg" />
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  exercise.is_global
                    ? 'bg-white/70 text-gray-500'
                    : 'bg-white/70 text-emerald-600'
                }`}>
                  {exercise.is_global ? 'Global' : 'Custom'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center transition"
                >
                  <Edit3 size={14} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-white/70 hover:bg-white flex items-center justify-center transition text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Instructions */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">How To Perform</h3>
            {editing ? (
              <textarea
                rows={8}
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                placeholder="Describe how to perform this exercise..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none leading-relaxed"
              />
            ) : exercise.instructions ? (
              <div className="bg-gray-50 rounded-xl px-5 py-4">
                <p className="text-sm text-gray-700 leading-relaxed">{exercise.instructions}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-300 italic">No instructions added yet.</p>
            )}
          </div>

          {/* Muscle group info */}
          {!editing && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Muscle Group</h3>
              <div className={`rounded-xl px-5 py-4 ${cfg.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                  <span className={`text-sm font-semibold ${cfg.text}`}>{exercise.muscle_group}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tips section for global exercises */}
          {!editing && exercise.is_global && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Coaching Tips</h3>
              <div className="space-y-2">
                {getCoachingTips(exercise.muscle_group).map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className={`w-5 h-5 rounded-full ${cfg.dot} flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className="text-white text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {editing ? (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={() => { setEditing(false); setEditName(exercise.name); setEditMuscle(exercise.muscle_group); setEditInstructions(exercise.instructions ?? '') }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="flex-1 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="w-full py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function getCoachingTips(muscleGroup) {
  const tips = {
    Biceps: [
      'Keep elbows pinned to your sides throughout — elbow drift reduces bicep isolation.',
      'Supinate your wrist at the top of the movement for maximum bicep contraction.',
      'Control the eccentric (lowering) phase — 2-3 seconds down for greater hypertrophy.',
    ],
    Triceps: [
      'Lock out fully at the bottom of pushdowns to fully activate the lateral head.',
      'For overhead extensions, keep upper arms close to your head throughout.',
      'The long head of the tricep is only fully stretched in overhead positions.',
    ],
    Chest: [
      'Retract and depress your scapula before pressing — this protects shoulders and improves force transfer.',
      'Think about squeezing your hands together on any press to maximise pec activation.',
      'Control the eccentric — lower in 2-3 seconds for greater chest development.',
    ],
    Back: [
      'Initiate all pulling movements by depressing and retracting the scapula first.',
      'Drive elbows — not hands — toward your hip for better lat engagement.',
      'Achieve full stretch at the top of rows and pulldowns for complete range of motion.',
    ],
    Shoulders: [
      'Lead with your elbows on lateral raises — not your hands — to shift emphasis to the lateral delt.',
      'Avoid shrugging shoulders during pressing — keep traps relaxed and scapula stable.',
      'Rear delt work is often undertrained — prioritise face pulls and rear delt flys.',
    ],
    Legs: [
      'Push your knees out in line with your toes throughout all squat variations.',
      'Drive through the entire foot — not just the heel — during squats and leg press.',
      'Achieve full depth before adding load — mobility first, strength second.',
    ],
    Glutes: [
      'Squeeze your glutes hard at full hip extension — brief hold at top increases activation.',
      'Hip thrust has the highest glute EMG of any exercise — prioritise it for glute development.',
      'Posterior pelvic tilt at the top of hip thrusts further increases glute activation.',
    ],
    Core: [
      'Brace your core by creating intra-abdominal pressure — like you are about to be punched.',
      'Avoid pulling your neck during crunches — place tongue on roof of mouth to reduce neck tension.',
      'Anti-rotation and anti-extension exercises (plank, Pallof press) are as important as crunches.',
    ],
    Cardio: [
      'Zone 2 cardio (conversational pace) builds aerobic base — aim for 150+ minutes per week.',
      'HIIT should be used sparingly — 2x per week maximum alongside strength training.',
      'Low impact options (bike, swim, elliptical) reduce injury risk while maintaining cardiovascular benefit.',
    ],
    'Full Body': [
      'Prioritise compound movements early in sessions when energy and focus are highest.',
      'Full body movements have high metabolic demand — manage intensity and rest periods accordingly.',
      'Focus on movement quality over load — technique breaks down quickly under fatigue.',
    ],
  }
  return tips[muscleGroup] ?? [
    'Focus on controlled movement through full range of motion.',
    'Progressive overload is the key driver of adaptation — track your weights.',
    'Warm up the target muscle group before working sets.',
  ]
}

export default function ExerciseLibrary({ user }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', muscle_group: 'Chest', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(null)

  async function fetchExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${user.id}`)
      .order('name', { ascending: true })
    if (!error && data) setExercises(data)
    setLoading(false)
  }

  useEffect(() => { fetchExercises() }, [user.id])

  const filtered = exercises
    .filter(e => filter === 'All' || e.muscle_group === filter)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('exercises').insert({
      name: form.name.trim(),
      muscle_group: form.muscle_group,
      instructions: form.instructions.trim() || null,
      created_by: user.id,
      is_global: false,
    })
    setSaving(false)
    if (error) { setSaveError('Something went wrong. Please try again.'); return }
    setForm({ name: '', muscle_group: 'Chest', instructions: '' })
    setShowForm(false)
    fetchExercises()
  }

  function handleSaveEdit(updated) {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelectedExercise(updated)
  }

  const customCount = exercises.filter(e => !e.is_global && e.created_by === user.id).length

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          userId={user.id}
          onClose={() => setSelectedExercise(null)}
          onSave={handleSaveEdit}
        />
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
            <p className="text-sm text-gray-400 mt-1">
              {exercises.length} exercises · {customCount} custom
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setSaveError('') }}
            className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <Plus size={15} /> Add Exercise
          </button>
        </div>

        {/* Add exercise form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">New Exercise</h2>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Bench Press"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Muscle Group</label>
                <select
                  value={form.muscle_group}
                  onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instructions <span className="text-gray-300 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Describe how to perform this exercise..."
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                />
              </div>
              {saveError && <p className="sm:col-span-2 text-xs text-red-500">{saveError}</p>}
              <div className="sm:col-span-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-100 transition font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Exercise'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 mb-6">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>}
        </div>

        {/* Muscle group filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MUSCLE_GROUPS.map(group => {
            const cfg = MUSCLE_CHIP[group]
            const isActive = filter === group
            return (
              <button
                key={group}
                onClick={() => setFilter(group)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? group === 'All'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${cfg?.bg} ${cfg?.text} border-transparent`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {group}
              </button>
            )
          })}
        </div>

        {/* Results count */}
        {(search || filter !== 'All') && (
          <p className="text-sm text-gray-400 mb-4">
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
            {filter !== 'All' && ` in ${filter}`}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Exercise grid */}
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading exercises...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-900">No exercises found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? `No results for "${search}"` : `No ${filter} exercises yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(exercise => {
              const cfg = MUSCLE_CHIP[exercise.muscle_group] ?? MUSCLE_CHIP.Other
              const isOwn = !exercise.is_global && exercise.created_by === user.id
              return (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-gray-300 hover:shadow-md transition-all duration-150 group flex flex-col gap-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 leading-snug flex-1">{exercise.name}</p>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition shrink-0 mt-0.5" />
                  </div>

                  {/* Muscle chip */}
                  <MuscleChip group={exercise.muscle_group} />

                  {/* Instructions preview */}
                  {exercise.instructions ? (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{exercise.instructions}</p>
                  ) : (
                    <p className="text-xs text-gray-300 italic">No instructions added.</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOwn ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isOwn ? '✦ Custom' : 'Global'}
                    </span>
                    <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition">Tap to view →</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
