// The client app (PWA). This file loads the client's data, holds it in one place and
// shows the tabs: Home, Training, Nutrition, Progress and (with a coach) Messages. Each
// tab lives in src/client/.
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Home, Dumbbell, Utensils, TrendingUp, MessageCircle } from 'lucide-react'
import { supabase } from './supabase'
import { Button, TabBar } from './ui'
import { formatDateLabel } from './client/dates'
import { completedKeys, workoutName } from './client/metrics'
import {
  fetchScheduled, fetchExercisesFor, fetchWorkoutLogs, fetchFoodLogs, fetchWeightLogs,
  fetchStrength, fetchResources, fetchByClient, fetchAssignment, fetchOnDemand, fetchCoachName, fetchDailyCheckins,
} from './client/data'
import { fetchUnreadCounts, unseenReplyCount, markConversationOpened } from './lib/messages'
import { saveAiWorkout, saveAiMeal } from './client/aiSaves'
import { Loading, Toast } from './client/common'
import AIChat from './client/AIChat'
import WorkoutPreview from './client/WorkoutPreview'
import WorkoutLogging, { WorkoutComplete } from './client/WorkoutLogging'
import HomeTab from './client/HomeTab'
import TrainTab from './client/TrainTab'
import FoodTab from './client/FoodTab'
import ProgressTab from './client/ProgressTab'
import MessagesTab from './client/MessagesTab'
import ProfileSheet from './client/ProfileSheet'
import ResourcesPage from './client/ResourcesPage'

const EMPTY = []

// Phones often reload a web app that was in the background. These keep the client where
// they were: the workout they had open (12 hours max) and the tab they were on.
// Storage can be blocked, so every call is guarded and the app works without it.
const ACTIVE_KEY = 'unfnshd-active-workout'
const TAB_KEY = 'unfnshd-tab'
function saveActiveWorkout(clientId, sw) {
  try {
    if (sw) localStorage.setItem(ACTIVE_KEY, JSON.stringify({ clientId, sw, at: Date.now() }))
    else localStorage.removeItem(ACTIVE_KEY)
  } catch { /* storage unavailable */ }
}
function readActiveWorkout(clientId) {
  try {
    const v = JSON.parse(localStorage.getItem(ACTIVE_KEY))
    if (v?.clientId === clientId && v.sw?.id && Date.now() - v.at < 12 * 3600 * 1000) return v.sw
  } catch { /* storage unavailable */ }
  return null
}
function readTab() {
  try { return sessionStorage.getItem(TAB_KEY) || 'home' } catch { return 'home' }
}

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'train', label: 'Training', icon: Dumbbell },
  { id: 'food', label: 'Nutrition', icon: Utensils },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'messages', label: 'Messages', icon: MessageCircle, coachOnly: true },
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
  const [userId, setUserId] = useState(null)
  const [dailyCheckins, setDailyCheckins] = useState([])
  // Messages tab badge: unread coach messages plus check-in replies since Messages was last opened.
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unseenReplies, setUnseenReplies] = useState(0)

  // Navigation
  const [tab, setTab] = useState(readTab)
  const [trainView, setTrainView] = useState('workouts')
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
      // The session is already on the phone, so no network round trip is needed here.
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setLoading(false); return }
      const { data: clientRow } = await supabase.from('clients').select('*').eq('user_id', user.id).maybeSingle()
      if (!clientRow) { setLoading(false); return }
      setClient(clientRow)
      setUserId(user.id)
      if (!clientRow.pt_id) setTab((t) => (t === 'messages' ? 'home' : t))
      const id = clientRow.id

      // Everything else at once rather than one after another.
      const scheduledWithExercises = fetchScheduled(id).then(async (sw) => {
        const pwIds = [...new Set(sw.map((s) => s.program_workout_id).filter(Boolean))]
        return { sw, ex: pwIds.length > 0 ? await fetchExercisesFor(pwIds) : {} }
      })
      const [asgn, sched, logs, food, res, savedW, savedM, ci, photos, weights, str, library, coach, daily, unread] = await Promise.all([
        fetchAssignment(id),
        scheduledWithExercises,
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
        fetchDailyCheckins(id),
        clientRow.pt_id ? fetchUnreadCounts({ readerId: user.id, clientId: id }) : {},
      ])
      setAssignment(asgn.assignment)
      setProgramWorkouts(asgn.programWorkouts)
      setAllProgramExercises(asgn.exercises)
      setScheduledWorkouts(sched.sw)
      setWorkoutExercises(sched.ex)
      // Back into the workout they had open, unless it has been saved since.
      const active = readActiveWorkout(id)
      if (active && !logs.some((l) => l.scheduled_workout_id === active.id && l.completed)) setLoggingWorkout(active)
      setDailyCheckins(daily)
      setUnreadMessages(unread[id] || 0)
      setUnseenReplies(clientRow.pt_id ? unseenReplyCount(ci, id) : 0)
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

  // Leaving a session that "Start now" put on today just for this, with nothing ticked,
  // takes it off the calendar again so browsing a program never leaves extra sessions.
  async function leaveWorkout(sw, opts) {
    setLoggingWorkout(null)
    if (!sw?._createdNow || sw._existingLog || opts?.keptDraft !== false) return
    const { error } = await supabase.from('scheduled_workouts').delete().eq('id', sw.id)
    if (error) console.error('Remove unstarted workout error:', error)
    reloadScheduledWorkouts()
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

  // Remember the open workout and tab so a reload puts the client back where they were.
  useEffect(() => {
    if (loading || !client?.id) return
    saveActiveWorkout(client.id, loggingWorkout && !loggingWorkout._existingLog ? loggingWorkout : null)
  }, [loading, client?.id, loggingWorkout])

  function goTab(id) {
    setTab(id)
    try { sessionStorage.setItem(TAB_KEY, id) } catch { /* storage unavailable */ }
    // Opening Messages marks the thread read (useThread) and the check-in replies seen, so
    // the badge clears.
    if (id === 'messages') {
      setUnreadMessages(0)
      setUnseenReplies(0)
      if (client?.id) markConversationOpened(client.id)
    }
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
        coachName={coachName}
        hasCoach={!!client.pt_id}
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
        onBack={(opts) => leaveWorkout(loggingWorkout, opts)}
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
      <main className="max-w-[480px] mx-auto pb-[calc(var(--tabbar-space)+24px)]">
        {tab === 'home' && (
          <HomeTab
            {...shared}
            setCheckins={setCheckins}
            checkins={checkins}
            dailyCheckins={dailyCheckins}
            setDailyCheckins={setDailyCheckins}
            assignment={assignment}
            foodLogs={foodLogs}
            nutritionTargets={nutritionTargets}
            personalBests={strength.personalBests}
            coachName={coachName}
            onOpenWorkout={openWorkout}
            onStartWorkout={(sw) => setLoggingWorkout({ ...sw, _existingLog: null })}
            onOpenProfile={() => setProfileOpen(true)}
            onLogFood={() => { setFoodView('log'); setAddFoodOpen(true); goTab('food') }}
          />
        )}
        {tab === 'train' && (
          <TrainTab
            {...shared}
            view={trainView}
            setView={setTrainView}
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
        {tab === 'messages' && client.pt_id && (
          <MessagesTab clientId={client.id} userId={userId} coachName={coachName} />
        )}
      </main>

      <TabBar
        items={TABS.filter((t) => !t.coachOnly || client.pt_id).map(({ id, label, icon }) => ({
          key: id, label, icon, active: tab === id, onClick: () => goTab(id),
          badge: id === 'messages' && tab !== id ? unreadMessages + unseenReplies : 0,
        }))}
      />

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
