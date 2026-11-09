import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronRight, Pencil, Dumbbell, Trash2, Upload, Link2, PlayCircle } from 'lucide-react'
import { supabase } from './supabase'
import { PageTitle, SectionLabel, Card, Button, Chip, Sheet, EmptyState, Field } from './ui'
import { Loading, Toast, Select, TextArea, SearchBox, FilterChips } from './tools/kit'
import { useToast } from './tools/useToast'
import { getCoachingTips } from './tools/coachingTips'
import { fetchExerciseVideo, fetchMyVideoIds, uploadExerciseVideo, saveYoutubeVideo, removeExerciseVideo } from './lib/exerciseVideo'
import { MAX_SECONDS } from './lib/shrinkVideo'
import MovementDemo, { MovementThumb } from './lib/movement/MovementDemo'

const stageLabel = (s) => (s?.step === 'shrinking' ? `Preparing ${Math.round((s.p || 0) * 100)}%` : 'Uploading')
import { ExerciseVideo } from './lib/ExerciseVideo'

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

// The coach's own video for this exercise: record it on their phone and upload it, or paste
// a YouTube link. Their clients see it when they open the exercise in a workout.
function VideoSection({ exercise, userId, onChange }) {
  const [media, setMedia] = useState(undefined) // undefined while loading, null when none
  const [mode, setMode] = useState(null) // 'link' while pasting a link
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stage, setStage] = useState(null) // { step: 'shrinking' | 'uploading', p }

  useEffect(() => {
    let live = true
    fetchExerciseVideo(exercise.id).then((m) => { if (live) setMedia(m && m.coach_id === userId ? m : null) })
    return () => { live = false }
  }, [exercise.id, userId])

  async function run(fn) {
    setBusy(true)
    setError('')
    const res = await fn()
    setBusy(false)
    setStage(null)
    if (res.error) {
      const msg = res.error.message
      setError(msg === 'too_long' ? `That clip is over ${MAX_SECONDS / 60} minutes. Trim it to the part that shows the movement, then try again.`
        : msg === 'too_big' ? 'That video is too big for this browser to shrink. Trim it shorter, or try in Safari or Chrome.'
        : msg === 'not_youtube' ? "That doesn't look like a YouTube link. Copy it from the Share button on the video."
        : "Couldn't save the video. Try again.")
      return
    }
    setMedia(res.media ?? null)
    setMode(null)
    setLink('')
    onChange?.(exercise.id, !!res.media)
  }

  if (media === undefined) return <div className="h-12 rounded-[14px] bg-surface-2 animate-pulse" />
  return (
    <div>
      <SectionLabel>Your video</SectionLabel>
      {media ? (
        <div className="space-y-2.5">
          <ExerciseVideo media={media} />
          <p className="text-[13px] text-muted px-1">Your clients see this when they open {exercise.name} in a workout.</p>
          <div className="flex gap-2">
            <label className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-bold border border-line-strong text-ink hover:bg-surface-2 cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={16} /> {busy ? stageLabel(stage) : 'Replace'}
              <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(() => uploadExerciseVideo(userId, exercise.id, f, media, (step, p) => setStage({ step, p }))) }} />
            </label>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(() => removeExerciseVideo(media).then((r) => (r.error ? r : { media: null })))}>
              <Trash2 size={16} /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-line-strong p-4 space-y-3">
          <p className="text-[14px] text-muted">Show your clients how you want it done. Film yourself on your phone, or use a YouTube video you like.</p>
          {mode === 'link' ? (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => saveYoutubeVideo(userId, exercise.id, link, null)) }}>
              <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste link here" className="flex-1 min-w-0 h-10 px-4 rounded-full border border-line-strong bg-surface text-[15px] text-ink outline-none focus:border-accent" />
              <Button type="submit" size="sm" disabled={busy || !link.trim()}>{busy ? 'Saving' : 'Save'}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setMode(null); setLink('') }}>Cancel</Button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <label className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-bold bg-accent text-on-accent cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} /> {busy ? stageLabel(stage) : 'Upload a video'}
                <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(() => uploadExerciseVideo(userId, exercise.id, f, null, (step, p) => setStage({ step, p }))) }} />
              </label>
              <Button variant="secondary" size="sm" onClick={() => setMode('link')}><Link2 size={16} /> YouTube link</Button>
            </div>
          )}
          <p className="text-[12px] text-faint">{mode === 'link' ? 'Any YouTube link works, including Shorts.' : `Any clip from your phone, up to ${MAX_SECONDS / 60} minutes. We shrink it for you (sound is not kept). 10 to 30 seconds works best.`}</p>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-bad bg-bad-soft rounded-[14px] px-4 py-3">{error}</p>}
    </div>
  )
}

function ExerciseDetailSheet({ exercise, userId, onClose, onSave, onDelete, onVideoChange }) {
  const isOwn = !exercise.is_global && exercise.created_by === userId
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  // Only your own exercises, and only ones no program uses and no client has logged
  // (the database refuses those, so a client's history never loses its sets).
  async function handleDelete() {
    if (!window.confirm(`Delete ${exercise.name}? This can't be undone.`)) return
    setSaving(true)
    setEditError('')
    const { data, error } = await supabase.from('exercises').delete().eq('id', exercise.id).select('id')
    setSaving(false)
    if (error?.message?.includes('in_use')) { setEditError("It's in one of your programs or a client has logged it, so it stays. Take it out of your programs first."); return }
    if (error || !data?.length) { console.error(error); setEditError('Could not delete it. Please try again.'); return }
    onDelete(exercise.id)
  }

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
          <Button type="button" variant="danger" block onClick={handleDelete} disabled={saving}>
            <Trash2 size={18} /> Delete exercise
          </Button>
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
        <MovementDemo name={exercise.name} />
        <div className="flex flex-wrap gap-2">
          {exercise.muscle_group && <Chip tone="accent">{exercise.muscle_group}</Chip>}
          {exercise.equipment && <Chip>{equipmentLabel(exercise.equipment)}</Chip>}
          {exercise.category && <Chip>{categoryLabel(exercise.category)}</Chip>}
          <Chip>{isOwn ? 'Yours' : 'Library'}</Chip>
        </div>

        <VideoSection exercise={exercise} userId={userId} onChange={onVideoChange} />

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
  const [videoIds, setVideoIds] = useState(() => new Set()) // exercises you have a video for
  const [toast, showToast] = useToast()

  useEffect(() => { fetchMyVideoIds(user.id).then(setVideoIds) }, [user.id])

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
                      <MovementThumb name={exercise.name} fallback={exercise.muscle_group} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-ink truncate">{exercise.name}</span>
                          {isOwn && <Chip tone="accent" className="shrink-0">Yours</Chip>}
                          {videoIds.has(exercise.id) && <PlayCircle size={16} className="text-accent shrink-0" aria-label="Has your video" />}
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
          onVideoChange={(id, has) => { setVideoIds((prev) => { const next = new Set(prev); if (has) next.add(id); else next.delete(id); return next }); showToast(has ? 'Video saved. Your clients will see it.' : 'Video removed') }}
          onClose={() => setSelectedExercise(null)}
          onSave={handleSaveEdit}
          onDelete={(id) => { setExercises((prev) => prev.filter((x) => x.id !== id)); setSelectedExercise(null); showToast('Exercise deleted') }}
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
