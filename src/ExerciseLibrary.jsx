import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, Pencil, Dumbbell } from 'lucide-react'
import { supabase } from './supabase'
import { PageTitle, SectionLabel, Card, Button, Chip, Sheet, EmptyState, Field } from './ui'
import { Loading, Toast, Select, TextArea, SearchBox, FilterChips } from './tools/kit'
import { useToast } from './tools/useToast'
import { getCoachingTips } from './tools/coachingTips'

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Other',
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell',    label: 'Barbell' },
  { value: 'dumbbell',   label: 'Dumbbell' },
  { value: 'cable',      label: 'Cable' },
  { value: 'machine',    label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'band',       label: 'Band' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'trx',        label: 'TRX' },
  { value: 'sled',       label: 'Sled' },
  { value: 'landmine',   label: 'Landmine' },
  { value: 'trap_bar',   label: 'Trap bar' },
  { value: 'functional', label: 'Functional' },
  { value: 'plate',      label: 'Plate' },
]

const CATEGORY_OPTIONS = [
  { value: 'strength',   label: 'Strength' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'accessory',  label: 'Accessory' },
  { value: 'power',      label: 'Power' },
  { value: 'cardio',     label: 'Cardio' },
  { value: 'warmup',     label: 'Warm-up' },
  { value: 'cooldown',   label: 'Cool-down' },
]

const EMPTY_EXERCISE_FORM = { name: '', muscle_group: 'Chest', equipment: '', category: 'strength', instructions: '' }

function equipmentLabel(value) {
  return EQUIPMENT_OPTIONS.find(o => o.value === value)?.label ?? value ?? 'Unspecified'
}

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find(o => o.value === value)?.label ?? value ?? 'Unspecified'
}

/* The fields shared by "new exercise" and "edit exercise". */
function ExerciseFields({ form, setForm, autoFocus }) {
  return (
    <>
      <Field
        label="Name" required autoFocus={autoFocus} placeholder="e.g. Barbell bench press"
        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Muscle group" value={form.muscle_group} onChange={e => setForm(f => ({ ...f, muscle_group: e.target.value }))}>
          {MUSCLE_GROUPS.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
        <Select label="Equipment" required value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}>
          <option value="" disabled>Choose</option>
          {EQUIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
      <Select label="Type" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
        {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <TextArea
        label="How to do it (optional)" rows={4} placeholder="Short steps your client can follow"
        value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
      />
    </>
  )
}

function ExerciseDetailSheet({ exercise, userId, onClose, onSave }) {
  const isOwn = !exercise.is_global && exercise.created_by === userId
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setForm({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: exercise.equipment ?? 'barbell',
      category: exercise.category ?? 'strength',
      instructions: exercise.instructions ?? '',
    })
    setEditError('')
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setEditError('')
    const updates = {
      name: form.name.trim(),
      muscle_group: form.muscle_group,
      equipment: form.equipment,
      category: form.category,
      instructions: form.instructions.trim() || null,
    }
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', exercise.id)
        .select()
      if (error) throw error
      // An update blocked by RLS returns no error and no rows. Treat that as a failure, not a success.
      if (!data || data.length === 0) throw new Error('No rows updated')
      onSave({ ...exercise, ...data[0] })
      setEditing(false)
    } catch (err) {
      console.error(err)
      setEditError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <Sheet
        open
        onClose={onClose}
        title="Edit exercise"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" form="edit-exercise-form" size="lg" className="flex-1" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <form id="edit-exercise-form" onSubmit={handleSave} className="flex flex-col gap-4">
          <ExerciseFields form={form} setForm={setForm} />
          {editError && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{editError}</p>}
        </form>
      </Sheet>
    )
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={exercise.name}
      footer={isOwn ? (
        <Button variant="secondary" size="lg" block onClick={startEditing}>
          <Pencil size={18} /> Edit exercise
        </Button>
      ) : null}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {exercise.muscle_group && <Chip tone="accent">{exercise.muscle_group}</Chip>}
          {exercise.equipment && <Chip>{equipmentLabel(exercise.equipment)}</Chip>}
          {exercise.category && <Chip>{categoryLabel(exercise.category)}</Chip>}
          <Chip>{isOwn ? 'Yours' : 'Library'}</Chip>
        </div>

        {exercise.instructions && (
          <div>
            <SectionLabel>How to do it</SectionLabel>
            <p className="text-[15px] text-ink leading-relaxed whitespace-pre-line px-1">{exercise.instructions}</p>
          </div>
        )}

        {exercise.is_global && (
          <div>
            <SectionLabel>Coaching cues</SectionLabel>
            <ol className="flex flex-col gap-2.5">
              {getCoachingTips(exercise.name, exercise.muscle_group).map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent-soft text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-px">
                    {i + 1}
                  </span>
                  <p className="text-[15px] text-ink leading-relaxed">{tip}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {isOwn && !exercise.instructions && (
          <p className="text-sm text-muted bg-surface-2 rounded-[14px] px-4 py-3">
            Add a few short steps so your clients know how to do this one.
          </p>
        )}
      </div>
    </Sheet>
  )
}

export default function ExerciseLibrary({ user }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_EXERCISE_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [toast, showToast] = useToast()

  const fetchExercises = useCallback(async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${user.id}`)
      .order('name', { ascending: true })
    if (!error && data) setExercises(data)
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchExercises() }, [fetchExercises])

  const filtered = exercises
    .filter(e => filter === 'All' || e.muscle_group === filter)
    .filter(e => !equipmentFilter || e.equipment === equipmentFilter)
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.equipment) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('exercises').insert({
      name: form.name.trim(),
      muscle_group: form.muscle_group,
      equipment: form.equipment,
      category: form.category,
      instructions: form.instructions.trim() || null,
      created_by: user.id,
      is_global: false,
    })
    setSaving(false)
    if (error) { setSaveError('Something went wrong. Please try again.'); return }
    showToast(`${form.name.trim()} added`)
    setForm(EMPTY_EXERCISE_FORM)
    setShowForm(false)
    fetchExercises()
  }

  function handleSaveEdit(updated) {
    setExercises(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelectedExercise(updated)
    showToast('Saved')
  }

  function openNew(name = '') {
    setForm({ ...EMPTY_EXERCISE_FORM, name })
    setSaveError('')
    setShowForm(true)
  }

  // Fixed groups first, then any other group found in the data (e.g. Hamstrings).
  const muscleOptions = [...MUSCLE_GROUPS, ...[...new Set(exercises.map(e => e.muscle_group).filter(g => g && !MUSCLE_GROUPS.includes(g)))].sort()]
  const customCount = exercises.filter(e => !e.is_global && e.created_by === user.id).length
  const filtering = search || filter !== 'All' || equipmentFilter

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Exercises"
        action={<Button onClick={() => openNew()}><Plus size={18} /> New exercise</Button>}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Search exercises" className="flex-1" />
          <Select value={equipmentFilter} onChange={e => setEquipmentFilter(e.target.value)} aria-label="Equipment" className="sm:w-52">
            <option value="">Any equipment</option>
            {EQUIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <FilterChips options={muscleOptions} value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title={filtering ? 'No exercises found' : 'No exercises yet'}
            body={search ? `Nothing matches "${search}". Add it as your own exercise.` : 'Add your own exercise to build programs with it.'}
            action={<Button onClick={() => openNew(search)}><Plus size={18} /> New exercise</Button>}
          />
        </Card>
      ) : (
        <div>
          <SectionLabel>
            {filtering
              ? `${filtered.length} of ${exercises.length}`
              : `${exercises.length} exercises${customCount ? ` · ${customCount} yours` : ''}`}
          </SectionLabel>
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-line md:grid md:grid-cols-2 md:divide-y-0">
              {filtered.map(exercise => {
                const isOwn = !exercise.is_global && exercise.created_by === user.id
                return (
                  <li key={exercise.id} className="md:border-b md:border-line md:odd:border-r">
                    <button
                      onClick={() => setSelectedExercise(exercise)}
                      className="w-full min-h-[60px] px-4 py-2.5 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-ink truncate">{exercise.name}</span>
                          {isOwn && <Chip tone="accent" className="shrink-0">Yours</Chip>}
                        </span>
                        <span className="block text-[13px] text-muted truncate">
                          {[exercise.muscle_group, exercise.equipment && equipmentLabel(exercise.equipment)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-faint shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      )}

      {selectedExercise && (
        <ExerciseDetailSheet
          key={selectedExercise.id}
          exercise={selectedExercise}
          userId={user.id}
          onClose={() => setSelectedExercise(null)}
          onSave={handleSaveEdit}
        />
      )}

      <Sheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New exercise"
        footer={
          <Button type="submit" form="new-exercise-form" size="lg" block disabled={saving || !form.name.trim() || !form.equipment}>
            {saving ? 'Saving…' : 'Save exercise'}
          </Button>
        }
      >
        <form id="new-exercise-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ExerciseFields form={form} setForm={setForm} autoFocus />
          {saveError && <p className="m-0 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{saveError}</p>}
        </form>
      </Sheet>

      <Toast toast={toast} />
    </div>
  )
}
