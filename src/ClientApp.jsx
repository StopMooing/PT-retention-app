// The client app (PWA). This file loads the client's data, holds it in one place and
// shows the four tabs: Home, Train, Food, Progress. Each tab lives in src/client/.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Home, Dumbbell, Utensils, TrendingUp } from 'lucide-react'
import { supabase } from './supabase'
import { Button } from './ui'
import { toLocalDateStr, formatDateLabel } from './client/dates'
import { completedKeys, workoutName } from './client/metrics'
import {
  fetchScheduled, fetchExercisesFor, fetchWorkoutLogs, fetchFoodLogs, fetchWeightLogs,
  fetchStrength, fetchResources, fetchByClient, fetchAssignment, fetchOnDemand, fetchCoachName,
} from './client/data'
import { saveAiWorkout, saveAiMeal } from './client/aiSaves'
import { Loading, Toast } from './client/common'
import AIChat from './client/AIChat'
import WorkoutPreview from './client/WorkoutPreview'
import WorkoutLogging, { WorkoutComplete } from './client/WorkoutLogging'
import HomeTab from './client/HomeTab'
import TrainTab from './client/TrainTab'
import FoodTab from './client/FoodTab'
import ProgressTab from './client/ProgressTab'
import ProfileSheet from './client/ProfileSheet'
import ResourcesPage from './client/ResourcesPage'

const EMPTY = []

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'train', label: 'Training', icon: Dumbbell },
  { id: 'food', label: 'Nutrition', icon: Utensils },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
]

export default function ClientApp() {
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [programWorkouts, setProgramWorkouts] = useState([])
  const [allProgramExercises, setAllProgramExercises] = useState({})
  const [scheduledWorkouts, setScheduledWorkouts] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState({})
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [completedIds, setCompletedIds] = useState(new Set())
  const [foodLogs, setFoodLogs] = useState([])
  const [resources, setResources] = useState([])
  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [savedMeals, setSavedMeals] = useState([])
  const [checkins, setCheckins] = useState([])
  const [progressPhotos, setProgressPhotos] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [strength, setStrength] = useState({ personalBests: [], heavySets: [] })
  const [nutritionTargets, setNutritionTargets] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [onDemand, setOnDemand] = useState({ workouts: [], programs: [], exercises: {} })
  const [coachName, setCoachName] = useState(null)

  // Navigation
  const [tab, setTab] = useState('home')
  const [trainView, setTrainView] = useState('workouts')
  const [trainDate, setTrainDate] = useState(() => toLocalDateStr())
  const [trainDayOpen, setTrainDayOpen] = useState(false)
  const [foodView, setFoodView] = useState('log')
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Workout flow
  const [previewWorkout, setPreviewWorkout] = useState(null)
  const [loggingWorkout, setLoggingWorkout] = useState(null)
  const [workoutCompleteData, setWorkoutCompleteData] = useState(null)

  // AI helper
  const [aiMode, setAiMode] = useState(null) // 'workout' | 'nutrition'
  const [workoutLibrary, setWorkoutLibrary] = useState(null)
  const [workoutLibraryError, setWorkoutLibraryError] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: clientRow } = await supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle()
      if (!clientRow) { setLoading(false); return }
      setClient(clientRow)
      const id = clientRow.id

      const asgn = await fetchAssignment(id)
      setAssignment(asgn.assignment)
      setProgramWorkouts(asgn.programWorkouts)
      setAllProgramExercises(asgn.exercises)

      const sw = await fetchScheduled(id)
      setScheduledWorkouts(sw)
      const pwIds = [...new Set(sw.map((s) => s.program_workout_id).filter(Boolean))]
      if (pwIds.length > 0) setWorkoutExercises(await fetchExercisesFor(pwIds))

      const [logs, food, res, savedW, savedM, ci, photos, weights, str, library, coach] = await Promise.all([
        fetchWorkoutLogs(id),
        fetchFoodLogs(id),
        fetchResources(clientRow.pt_id),
        fetchByClient('saved_workouts', id, 'created_at'),
        fetchByClient('saved_meals', id, 'created_at'),
        fetchByClient('checkins', id, 'submitted_at'),
        fetchByClient('progress_photos', id, 'taken_date'),
        fetchWeightLogs(id),
        fetchStrength(id),
        fetchOnDemand(),
        fetchCoachName(clientRow.pt_id),
      ])
      setOnDemand(library)
      setCoachName(coach)
      setWorkoutLogs(logs)
      setCompletedIds(completedKeys(logs))
      setFoodLogs(food)
      setResources(res)
      setSavedWorkouts(savedW)
      setSavedMeals(savedM)
      setCheckins(ci)
      setProgressPhotos(photos)
      setWeightLogs(weights)
      setStrength(str)
      setNutritionTargets({
        calories: clientRow.calorie_target || 0,
        protein: clientRow.protein_target_g || 0,
        carbs: clientRow.carbs_target_g || 0,
        fats: clientRow.fats_target_g || 0,
      })
      setLoading(false)
    }
    init()
  }, [])

  // The AI workout builder needs the exercise library first.
  useEffect(() => {
    if (aiMode !== 'workout' || (workoutLibrary && workoutLibrary.length > 0)) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('exercises').select('name, muscle_group, category')
      if (cancelled) return
      if (error || !data || data.length === 0) {
        console.error('Workout library load error:', error || 'no rows')
        setWorkoutLibraryError(true)
        return
      }
      setWorkoutLibrary(data)
    })()
    return () => { cancelled = true }
  }, [aiMode, workoutLibrary])

  // A short message near the bottom. Pass { action: { label, onClick }, ms } for an Undo.
  const showToast = useCallback((message, opts = {}) => {
    clearTimeout(toastTimer.current)
    const action = opts.action
      ? { label: opts.action.label, onClick: () => { clearTimeout(toastTimer.current); setToast(null); opts.action.onClick() } }
      : null
    setToast({ message, action })
    toastTimer.current = setTimeout(() => setToast(null), opts.ms || (action ? 5000 : 2500))
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Exercises for any program day: what was loaded for the schedule, falling back to the
  // whole program, so a day scheduled after the app opened still shows its exercises.
  const exerciseMap = useMemo(
    () => ({ ...onDemand.exercises, ...allProgramExercises, ...workoutExercises }),
    [onDemand.exercises, allProgramExercises, workoutExercises],
  )

  const clientId = client?.id
  // After the client starts or stops a program.
  const reloadAssignment = useCallback(async () => {
    if (!clientId) return
    const asgn = await fetchAssignment(clientId)
    setAssignment(asgn.assignment)
    setProgramWorkouts(asgn.programWorkouts)
    setAllProgramExercises(asgn.exercises)
  }, [clientId])

  const reloadScheduledWorkouts = useCallback(async () => {
    if (!clientId) return
    const sw = await fetchScheduled(clientId)
    setScheduledWorkouts(sw)
    const missing = [...new Set(sw.map((s) => s.program_workout_id).filter(Boolean))].filter((id) => !exerciseMap[id])
    if (missing.length > 0) {
      const more = await fetchExercisesFor(missing)
      setWorkoutExercises((prev) => ({ ...prev, ...more }))
    }
  }, [clientId, exerciseMap])

  const refreshFoodLogs = useCallback(async () => {
    if (!clientId) return
    setFoodLogs(await fetchFoodLogs(clientId))
  }, [clientId])

  function openWorkout(sw) {
    const existing = workoutLogs.find((l) => l.scheduled_workout_id === sw.id && l.completed) ?? null
    if (existing) setLoggingWorkout({ ...sw, _existingLog: existing })
    else setPreviewWorkout({ ...sw, _existingLog: null })
  }

  function openWorkoutAI() {
    setWorkoutLibraryError(false)
    setAiMode('workout')
  }

  // Called only after the session is confirmed saved.
  async function handleWorkoutDone(key, stats) {
    setCompletedIds((prev) => new Set([...prev, key]))
    setLoggingWorkout(null)
    if (stats.edited) showToast('Session updated')
    else setWorkoutCompleteData(stats)
    // Refresh so Home, Train and Progress all count the new session and any new bests.
    const [logs, str] = await Promise.all([fetchWorkoutLogs(client.id), fetchStrength(client.id)])
    setWorkoutLogs(logs)
    setCompletedIds((prev) => new Set([...prev, ...completedKeys(logs)]))
    setStrength(str)
  }

  async function handleSaveWorkout(content) {
    const { data, error, notice } = await saveAiWorkout(client, content)
    if (!data) { showToast(error, { ms: 5000 }); return }
    setSavedWorkouts((prev) => [data, ...prev])
    setAiMode(null)
    setTab('train')
    setTrainView('workouts')
    showToast(notice || 'Workout saved', notice ? { ms: 6000 } : undefined)
  }

  async function handleSaveMeal(content) {
    const { data, error } = await saveAiMeal(client, content)
    if (!data) { showToast(error, { ms: 5000 }); return }
    setSavedMeals((prev) => [data, ...prev])
    setAiMode(null)
    setTab('food')
    setFoodView('saved')
    showToast('Meal saved')
  }

  function goTab(id) {
    setTab(id)
    window.scrollTo(0, 0)
  }

  if (loading) return <Loading full />

  if (!client) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-display text-[28px] text-ink">Account not linked</p>
        <p className="text-muted mt-1">Ask your coach for a new invite link to get access.</p>
      </div>
    </div>
  )

  const shared = { client, scheduledWorkouts, completedIds, workoutLogs, workoutExercises: exerciseMap, showToast }

  let overlay = null
  if (aiMode === 'workout' && workoutLibraryError) {
    overlay = (
      <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <p className="text-[17px] font-bold text-ink">Couldn't load the exercise library.</p>
          <p className="text-muted mt-1">The workout builder needs it. Try again in a moment.</p>
          <Button size="lg" block className="mt-6" onClick={() => { setWorkoutLibraryError(false); setAiMode(null) }}>Go back</Button>
        </div>
      </div>
    )
  } else if (aiMode === 'workout' && (!workoutLibrary || workoutLibrary.length === 0)) {
    overlay = <div className="fixed inset-0 z-50"><Loading full /></div>
  } else if (aiMode === 'workout') {
    overlay = <AIChat context="Build a workout" placeholder="For example: a 45 minute upper body workout with dumbbells only" mode="workout" onClose={() => setAiMode(null)} onSave={handleSaveWorkout} saveLabel="Save workout" />
  } else if (aiMode === 'nutrition') {
    overlay = <AIChat context="Meal ideas" placeholder="For example: a high protein breakfast under 500 calories" mode="nutrition" onClose={() => setAiMode(null)} onSave={handleSaveMeal} saveLabel="Save meal" />
  } else if (workoutCompleteData) {
    overlay = (
      <WorkoutComplete
        workoutName={workoutCompleteData.workoutName}
        stats={workoutCompleteData}
        onDone={() => { setWorkoutCompleteData(null); setLoggingWorkout(null); goTab('home') }}
      />
    )
  } else if (loggingWorkout) {
    overlay = (
      <WorkoutLogging
        scheduledWorkout={loggingWorkout}
        existingLog={loggingWorkout._existingLog ?? null}
        exercises={exerciseMap[loggingWorkout.program_workout_id] ?? EMPTY}
        client={client}
        onBack={() => setLoggingWorkout(null)}
        onComplete={handleWorkoutDone}
      />
    )
  } else if (previewWorkout) {
    overlay = (
      <WorkoutPreview
        eyebrow={previewWorkout.scheduled_date ? formatDateLabel(previewWorkout.scheduled_date) : ''}
        title={workoutName(previewWorkout)}
        exercises={exerciseMap[previewWorkout.program_workout_id] ?? EMPTY}
        customContent={previewWorkout._isCustom || !previewWorkout.program_workout_id ? (previewWorkout._customWorkout?.content || previewWorkout.saved_workouts?.content || '') : null}
        onBack={() => setPreviewWorkout(null)}
        footer={<Button size="lg" block onClick={() => { setLoggingWorkout(previewWorkout); setPreviewWorkout(null) }}><Dumbbell size={20} /> Start workout</Button>}
      />
    )
  } else if (resourcesOpen) {
    overlay = <ResourcesPage resources={resources} onBack={() => setResourcesOpen(false)} />
  }

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-[480px] mx-auto pb-32">
        {tab === 'home' && (
          <HomeTab
            {...shared}
            setCheckins={setCheckins}
            checkins={checkins}
            assignment={assignment}
            foodLogs={foodLogs}
            nutritionTargets={nutritionTargets}
            personalBests={strength.personalBests}
            coachName={coachName}
            onOpenWorkout={openWorkout}
            onOpenProfile={() => setProfileOpen(true)}
            onBuildWorkout={openWorkoutAI}
            onLogFood={() => { setFoodView('log'); setAddFoodOpen(true); goTab('food') }}
            onPickDay={(d) => { setTrainDate(d); setTrainDayOpen(true); goTab('train') }}
            onSeeCheckins={() => goTab('progress')}
          />
        )}
        {tab === 'train' && (
          <TrainTab
            {...shared}
            view={trainView}
            setView={setTrainView}
            selectedDate={trainDate}
            setSelectedDate={setTrainDate}
            dayOpen={trainDayOpen}
            setDayOpen={setTrainDayOpen}
            assignment={assignment}
            programWorkouts={programWorkouts}
            savedWorkouts={savedWorkouts}
            onDemand={onDemand}
            reloadScheduledWorkouts={reloadScheduledWorkouts}
            reloadAssignment={reloadAssignment}
            onOpenWorkout={openWorkout}
            onStartWorkout={(sw) => setLoggingWorkout({ ...sw, _existingLog: null })}
            onPreviewWorkout={(sw) => setPreviewWorkout(sw)}
            onBuildWorkout={openWorkoutAI}
          />
        )}
        {tab === 'food' && (
          <FoodTab
            client={client}
            setClient={setClient}
            showToast={showToast}
            foodLogs={foodLogs}
            setFoodLogs={setFoodLogs}
            refreshFoodLogs={refreshFoodLogs}
            savedMeals={savedMeals}
            setSavedMeals={setSavedMeals}
            nutritionTargets={nutritionTargets}
            setNutritionTargets={setNutritionTargets}
            view={foodView}
            setView={setFoodView}
            addOpen={addFoodOpen}
            setAddOpen={setAddFoodOpen}
            onOpenAI={() => setAiMode('nutrition')}
          />
        )}
        {tab === 'progress' && (
          <ProgressTab
            client={client}
            weightLogs={weightLogs}
            setWeightLogs={setWeightLogs}
            workoutLogs={workoutLogs}
            checkins={checkins}
            strength={strength}
            progressPhotos={progressPhotos}
            setProgressPhotos={setProgressPhotos}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line shadow-[0_-8px_24px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-[480px] mx-auto flex px-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => goTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 min-h-[56px] transition-colors ${active ? 'text-accent' : 'text-muted hover:text-ink'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[11px] font-bold">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        client={client}
        setClient={setClient}
        hasResources={resources.length > 0}
        onOpenResources={() => { setProfileOpen(false); setResourcesOpen(true) }}
      />

      {overlay}
      <Toast toast={toast} />
    </div>
  )
}
