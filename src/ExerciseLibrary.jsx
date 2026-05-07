import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Other',
]

const MUSCLE_CHIP = {
  Chest:      'bg-blue-50 text-blue-700',
  Back:       'bg-purple-50 text-purple-700',
  Shoulders:  'bg-amber-50 text-amber-700',
  Biceps:     'bg-pink-50 text-pink-700',
  Triceps:    'bg-orange-50 text-orange-700',
  Legs:       'bg-indigo-50 text-indigo-700',
  Glutes:     'bg-rose-50 text-rose-700',
  Core:       'bg-teal-50 text-teal-700',
  Cardio:     'bg-red-50 text-red-700',
  'Full Body':'bg-emerald-50 text-emerald-700',
  Other:      'bg-gray-100 text-gray-600',
}

const EMPTY_FORM = { name: '', muscle_group: 'Chest', instructions: '' }

function ExerciseCard({ exercise, userId }) {
  const isOwn = !exercise.is_global && exercise.created_by === userId
  const chip = MUSCLE_CHIP[exercise.muscle_group] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:border-emerald-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug m-0">{exercise.name}</p>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${chip}`}>
          {exercise.muscle_group}
        </span>
      </div>

      {exercise.instructions ? (
        <p className="text-xs text-gray-500 leading-relaxed m-0 line-clamp-3">{exercise.instructions}</p>
      ) : (
        <p className="text-xs text-gray-300 italic m-0">No instructions added.</p>
      )}

      <div className="mt-auto pt-1">
        {isOwn ? (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Custom</span>
        ) : (
          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Global</span>
        )}
      </div>
    </div>
  )
}

export default function ExerciseLibrary({ user }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  const filtered = filter === 'All'
    ? exercises
    : exercises.filter(e => e.muscle_group === filter)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function cancelForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setSaveError('')
  }

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

    if (error) {
      setSaveError('Something went wrong. Please try again.')
      return
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
    setSuccess(true)
    fetchExercises()
    setTimeout(() => setSuccess(false), 3500)
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">

      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">Exercise Library</h1>
            <p className="text-gray-500 text-sm mt-1">
              Browse global exercises or add your own custom ones.
            </p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setSaveError('') }}
            className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            + Add Exercise
          </button>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-lg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Exercise added to your library.
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 m-0 mb-5">New Exercise</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Exercise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Bench Press"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">Muscle Group</label>
                <select
                  value={form.muscle_group}
                  onChange={e => setField('muscle_group', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-gray-600">
                  Instructions{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe how to perform this exercise..."
                  value={form.instructions}
                  onChange={e => setField('instructions', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {saveError && (
                <p className="sm:col-span-2 text-xs text-red-500 m-0">{saveError}</p>
              )}

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Exercise'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {MUSCLE_GROUPS.map(group => (
            <button
              key={group}
              onClick={() => setFilter(group)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === group
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading exercises...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-900 m-0">No exercises found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== 'All'
                ? `No ${filter} exercises yet. Add one above.`
                : 'Add your first exercise using the button above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(exercise => (
              <ExerciseCard key={exercise.id} exercise={exercise} userId={user.id} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
