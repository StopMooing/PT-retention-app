// Coach view of one client. This file loads the data and owns every save; the tabs in
// src/coach/profile/ only draw it. Reply to a check-in is the first thing on Overview.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, Link2, Check, Mail, MessageCircle, ClipboardList } from 'lucide-react'
import { supabase } from './supabase'
import { Avatar, Chip, Button, Mark, Card, EmptyState } from './ui'
import { toLocalDateStr, clientStatus, STATUS, relativeDay, sessionsThisMonth, formatDate, startedByClient, firstName } from './coach/lib'
import OverviewTab from './coach/profile/OverviewTab'
import CheckinsTab from './coach/profile/CheckinsTab'
import TrainingTab from './coach/profile/TrainingTab'
import NutritionTab from './coach/profile/NutritionTab'
import HabitsTab from './coach/profile/HabitsTab'
import NotesTab from './coach/profile/NotesTab'
import WorkoutSheet from './coach/profile/WorkoutSheet'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'checkins', label: 'Check-ins' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'habits', label: 'Habits' },
  { id: 'notes', label: 'Notes' },
]

const SW_SELECT = 'id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)'
const enrichSW = (sw) => ({ ...sw, _displayName: sw.program_workouts?.name || sw.saved_workouts?.name || 'Workout', _isCustom: !!sw.custom_workout_id })

export default function ClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // A Reply link from the dashboard lands on Overview (the default tab) with that check-in focused.
  const focusReplyId = location.state?.reply ?? null

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [client, setClient] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [programAssignment, setProgramAssignment] = useState(null)
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [mealPlan, setMealPlan] = useState(null)
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [personalBests, setPersonalBests] = useState([])
  const [sessionSetLogs, setSessionSetLogs] = useState({})
  const [savedNotes, setSavedNotes] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [progressPhotos, setProgressPhotos] = useState([])
  const [clientGoal, setClientGoal] = useState('')
  const [clientLimitations, setClientLimitations] = useState('')
  const [foodLogs, setFoodLogs] = useState([])
  const [waterLogs, setWaterLogs] = useState([])
  const [scheduledWorkouts, setScheduledWorkouts] = useState([])
  const [workoutExercises, setWorkoutExercises] = useState({})
  const [programWorkouts, setProgramWorkouts] = useState([])
  const [allPrograms, setAllPrograms] = useState([])
  const [allProgramWorkouts, setAllProgramWorkouts] = useState([])
  // Workout name by program_workouts id, including on-demand workouts outside the coach's
  // own list, so logged sessions without a schedule row still show their real name.
  const [workoutNames, setWorkoutNames] = useState({})
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  // Check-in replies
  const [replyDrafts, setReplyDrafts] = useState({})
  const [savingReplyId, setSavingReplyId] = useState(null)
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [replyError, setReplyError] = useState(null)

  // Nutrition targets (saved values, and the edit buffer while editing)
  const [calorieTarget, setCalorieTarget] = useState('')
  const [proteinTarget, setProteinTarget] = useState('')
  const [carbsTarget, setCarbsTarget] = useState('')
  const [fatsTarget, setFatsTarget] = useState('')
  const [savingTargets, setSavingTargets] = useState(false)
  const [waterTarget, setWaterTarget] = useState(2000)
  const [waterTargetInput, setWaterTargetInput] = useState('')
  const [savingWater, setSavingWater] = useState(false)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [clientRes, checkinsRes, programRes, habitsRes, mealPlanRes, workoutRes, weightRes] = await Promise.all([
          supabase.from('clients').select('*').eq('id', clientId).single(),
          supabase.from('checkins').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }),
          supabase.from('program_assignments').select('*, programs(*)').eq('client_id', clientId).eq('is_active', true).order('created_at', { ascending: false }).limit(1),
          supabase.from('habits').select('*').eq('client_id', clientId).eq('is_active', true),
          supabase.from('meal_plans').select('*').eq('client_id', clientId).eq('is_active', true).limit(1),
          supabase.from('workout_logs').select('*').eq('client_id', clientId).order('logged_at', { ascending: false }).limit(200),
          supabase.from('body_weight_logs').select('*').eq('client_id', clientId).order('logged_date', { ascending: true }),
        ])
        setClient(clientRes.data)
        setCheckins(checkinsRes.data ?? [])
        setProgramAssignment(programRes.data?.[0] ?? null)
        const fetchedHabits = habitsRes.data ?? []
        setHabits(fetchedHabits)
        setMealPlan(mealPlanRes.data?.[0] ?? null)
        setWorkoutLogs(workoutRes.data ?? [])
        setWeightLogs(weightRes.data ?? [])

        const { data: ptNotesData } = await supabase.from('pt_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
        setSavedNotes(ptNotesData ?? [])

        const { data: pbData } = await supabase
          .from('personal_bests')
          .select('id, exercise_id, pb_type, value, achieved_at, exercises(name)')
          .eq('client_id', clientId)
          .order('achieved_at', { ascending: false })
        setPersonalBests(pbData ?? [])

        const { data: { user: currentUserForFetch } } = await supabase.auth.getUser()
        const { data: allProgramsData } = await supabase
          .from('programs')
          .select('id, name, description')
          .eq('created_by', currentUserForFetch.id)
          .order('created_at', { ascending: false })
        const fetchedPrograms = allProgramsData ?? []
        setAllPrograms(fetchedPrograms)

        let fetchedAllPW = []
        const exerciseMap = {}
        const loadExercises = (pws) => Promise.all(
          pws.map(async (pw) => {
            const { data: exData } = await supabase
              .from('workout_exercises')
              .select('id, sets, reps, order_index, exercises(id, name, muscle_group)')
              .eq('program_workout_id', pw.id)
              .order('order_index', { ascending: true })
            exerciseMap[pw.id] = exData ?? []
          }),
        )
        if (fetchedPrograms.length > 0) {
          const { data: allPWData } = await supabase
            .from('program_workouts')
            .select('id, name, day_number, program_id')
            .in('program_id', fetchedPrograms.map((p) => p.id))
            .order('day_number', { ascending: true })
          fetchedAllPW = allPWData ?? []
          setAllProgramWorkouts(fetchedAllPW)
          setProgramWorkouts(fetchedAllPW.filter((pw) => pw.program_id === programRes.data?.[0]?.programs?.id))
          await loadExercises(fetchedAllPW)
        }

        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const threeMonthsAhead = new Date()
        threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3)
        const { data: swData } = await supabase
          .from('scheduled_workouts')
          .select(SW_SELECT)
          .eq('client_id', clientId)
          .gte('scheduled_date', toLocalDateStr(threeMonthsAgo))
          .lte('scheduled_date', toLocalDateStr(threeMonthsAhead))
        setScheduledWorkouts((swData ?? []).map(enrichSW))

        // Sessions can point at workouts outside the coach's own program list (an on-demand
        // workout the client started). Load those names and exercises too, so they read
        // exactly like program sessions.
        const known = new Set(fetchedAllPW.map((pw) => pw.id))
        const missing = [...new Set([...(swData ?? []), ...(workoutRes.data ?? [])].map((r) => r.program_workout_id).filter((pwId) => pwId && !known.has(pwId)))]
        let extraPW = []
        if (missing.length > 0) {
          const { data: extraData } = await supabase.from('program_workouts').select('id, name, day_number, program_id').in('id', missing)
          extraPW = extraData ?? []
          await loadExercises(extraPW)
        }
        const activeProgramId = programRes.data?.[0]?.programs?.id ?? programRes.data?.[0]?.program_id
        if (activeProgramId && !fetchedPrograms.some((p) => p.id === activeProgramId)) {
          const { data: activePW } = await supabase
            .from('program_workouts')
            .select('id, name, day_number, program_id')
            .eq('program_id', activeProgramId)
            .order('day_number', { ascending: true })
          setProgramWorkouts(activePW ?? [])
          await loadExercises((activePW ?? []).filter((pw) => !exerciseMap[pw.id]))
          extraPW = [...extraPW, ...(activePW ?? [])]
        }
        setWorkoutExercises(exerciseMap)
        setWorkoutNames(Object.fromEntries([...fetchedAllPW, ...extraPW].map((pw) => [pw.id, pw.name || `Day ${pw.day_number}`])))

        const { data: photoData } = await supabase
          .from('progress_photos')
          .select('id, photo_url, note, taken_date, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(12)
        setProgressPhotos(photoData ?? [])

        setClientGoal(clientRes.data?.goal ?? '')
        setClientLimitations(clientRes.data?.limitations ?? '')
        setCalorieTarget(clientRes.data?.calorie_target ?? '')
        setProteinTarget(clientRes.data?.protein_target_g ?? '')
        setCarbsTarget(clientRes.data?.carbs_target_g ?? '')
        setFatsTarget(clientRes.data?.fats_target_g ?? '')

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const { data: foodLogsData } = await supabase
          .from('food_logs')
          .select('id, food_name, brand, meal_type, serving_size_g, servings, calories, protein_g, carbs_g, fats_g, logged_at')
          .eq('client_id', clientId)
          .gte('logged_at', ninetyDaysAgo.toISOString())
          .order('logged_at', { ascending: false })
        setFoodLogs(foodLogsData ?? [])

        setWaterTarget(clientRes.data?.water_target_ml ?? 2000)
        setWaterTargetInput(String(clientRes.data?.water_target_ml ?? 2000))

        const thirtyDaysAgoForWater = new Date()
        thirtyDaysAgoForWater.setDate(thirtyDaysAgoForWater.getDate() - 30)
        const { data: waterLogsData } = await supabase
          .from('water_logs')
          .select('id, amount_ml, logged_date, created_at')
          .eq('client_id', clientId)
          .gte('logged_date', toLocalDateStr(thirtyDaysAgoForWater))
          .order('logged_date', { ascending: false })
        setWaterLogs(waterLogsData ?? [])

        if (fetchedHabits.length > 0) {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const { data: logsData } = await supabase
            .from('habit_logs')
            .select('*')
            .in('habit_id', fetchedHabits.map((h) => h.id))
            .gte('completed_date', toLocalDateStr(thirtyDaysAgo))
          setHabitLogs(logsData ?? [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [clientId])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Mark size={40} className="text-ink animate-pulse" />
      </div>
    )
  }

  if (!client) {
    return (
      <Card>
        <EmptyState title="Client not found" body="They may have been removed, or the link is wrong." action={<Button onClick={() => navigate('/dashboard')}>Back to clients</Button>} />
      </Card>
    )
  }

  /* ---------------- Saves ---------------- */

  function handleCopyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/claim/${client.claim_token}`)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  async function handleSaveReply(checkinId) {
    const current = checkins.find((c) => c.id === checkinId)
    const text = (replyDrafts[checkinId] ?? current?.coach_reply ?? '').trim()
    if (!text) return
    setSavingReplyId(checkinId)
    setReplyError(null)
    // The column GRANT means only coach_reply and replied_at can be written here. An
    // attempt to touch the client's own scores or notes would be rejected by Postgres.
    const { data, error } = await supabase
      .from('checkins')
      .update({ coach_reply: text, replied_at: new Date().toISOString() })
      .eq('id', checkinId)
      .select()
      .single()
    setSavingReplyId(null)
    if (error) {
      setReplyError({ id: checkinId, message: error.message })
      return
    }
    setCheckins((prev) => prev.map((c) => (c.id === checkinId ? { ...c, ...data } : c)))
    setReplyDrafts((prev) => {
      const next = { ...prev }
      delete next[checkinId]
      return next
    })
    setEditingReplyId(null)
  }

  async function handleSaveNote(text) {
    if (!text.trim()) return false
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('pt_notes')
        .insert({ client_id: clientId, pt_id: currentUser.id, text: text.trim() })
        .select()
        .single()
      if (error) throw error
      setSavedNotes((prev) => [data, ...prev])
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function handleLogWeight(value) {
    const w = parseFloat(value)
    if (!w || w <= 0 || w > 500) return false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('body_weight_logs')
        .insert({ client_id: clientId, logged_by: user.id, weight_kg: w, logged_date: toLocalDateStr() })
        .select()
        .single()
      if (error) throw error
      setWeightLogs((prev) => [...prev, data].sort((a, b) => new Date(a.logged_date) - new Date(b.logged_date)))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  // Returns an error message, or null when saved.
  async function handleSaveGoal(goal) {
    const { error } = await supabase.from('clients').update({ goal }).eq('id', clientId)
    if (error) { console.error(error); return 'Could not save the goal. Try again.' }
    setClientGoal(goal)
    setClient((prev) => ({ ...prev, goal }))
    return null
  }

  async function handleSaveLimitations(limitations) {
    const { error } = await supabase.from('clients').update({ limitations }).eq('id', clientId)
    if (error) { console.error(error); return 'Could not save. Try again.' }
    setClientLimitations(limitations)
    return null
  }

  async function handleSaveNutritionTargets() {
    setSavingTargets(true)
    try {
      const fields = {
        calorie_target: parseInt(calorieTarget) || null,
        protein_target_g: parseInt(proteinTarget) || null,
        carbs_target_g: parseInt(carbsTarget) || null,
        fats_target_g: parseInt(fatsTarget) || null,
      }
      const { error } = await supabase.from('clients').update(fields).eq('id', clientId)
      if (error) throw error
      setClient((prev) => ({ ...prev, ...fields }))
      // The water target sits in the same form, so save it with the macros.
      if ((parseInt(waterTargetInput) || 2000) !== waterTarget) {
        const ok = await handleSaveWaterTarget()
        if (!ok) return false
      }
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      setSavingTargets(false)
    }
  }

  function handleCancelTargets() {
    setCalorieTarget(client.calorie_target ?? '')
    setProteinTarget(client.protein_target_g ?? '')
    setCarbsTarget(client.carbs_target_g ?? '')
    setFatsTarget(client.fats_target_g ?? '')
    setWaterTargetInput(String(waterTarget))
  }

  async function handleSaveWaterTarget() {
    try {
      const ml = parseInt(waterTargetInput) || 2000
      const { error } = await supabase.from('clients').update({ water_target_ml: ml }).eq('id', clientId)
      if (error) throw error
      setWaterTarget(ml)
      setWaterTargetInput(String(ml))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function handleLogWater(amountMl) {
    if (!amountMl || amountMl <= 0) return false
    setSavingWater(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newLog, error } = await supabase
        .from('water_logs')
        .insert({ client_id: clientId, logged_by: user.id, amount_ml: amountMl, logged_date: toLocalDateStr() })
        .select()
        .single()
      if (error) throw error
      setWaterLogs((prev) => [newLog, ...prev])
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      setSavingWater(false)
    }
  }

  async function handleDeleteWaterLog(logId) {
    try {
      await supabase.from('water_logs').delete().eq('id', logId)
      setWaterLogs((prev) => prev.filter((w) => w.id !== logId))
    } catch (e) {
      console.error(e)
    }
  }

  async function loadSessionSets(log) {
    if (sessionSetLogs[log.id]) return
    const { data } = await supabase
      .from('workout_set_logs')
      .select('id, set_number, reps_completed, weight_kg, exercise_id, logged_at, exercises(name)')
      .eq('workout_log_id', log.id)
      .order('set_number', { ascending: true })
    setSessionSetLogs((prev) => ({ ...prev, [log.id]: data ?? [] }))
  }

  async function handleSelectWorkout(workout, targetDate) {
    if (!workout || !targetDate) return false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .insert({ client_id: clientId, program_workout_id: workout.id, scheduled_date: toLocalDateStr(targetDate), created_by: user.id })
        .select(SW_SELECT)
        .single()
      if (error) throw error
      setScheduledWorkouts((prev) => [...prev, enrichSW(data)])
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function handleRemoveScheduledWorkout(scheduledWorkoutId) {
    try {
      await supabase.from('scheduled_workouts').delete().eq('id', scheduledWorkoutId)
      setScheduledWorkouts((prev) => prev.filter((sw) => sw.id !== scheduledWorkoutId))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAssignProgram(program) {
    if (!program) return false
    try {
      if (programAssignment) {
        await supabase.from('program_assignments').update({ is_active: false }).eq('id', programAssignment.id)
      }
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newAssignment, error } = await supabase
        .from('program_assignments')
        .insert({ client_id: clientId, program_id: program.id, assigned_by: user.id, start_date: toLocalDateStr(), is_active: true })
        .select('id, start_date, assigned_by, programs(id, name)')
        .single()
      if (error) throw error
      setProgramAssignment(newAssignment)

      const { data: pwData } = await supabase
        .from('program_workouts')
        .select('id, name, day_number, program_id')
        .eq('program_id', program.id)
        .order('day_number', { ascending: true })
      const fetchedPW = pwData ?? []
      setProgramWorkouts(fetchedPW)

      const exerciseMap = { ...workoutExercises }
      await Promise.all(
        fetchedPW.map(async (pw) => {
          if (!exerciseMap[pw.id]) {
            const { data: exData } = await supabase
              .from('workout_exercises')
              .select('id, sets, reps, order_index, exercises(id, name, muscle_group)')
              .eq('program_workout_id', pw.id)
              .order('order_index', { ascending: true })
            exerciseMap[pw.id] = exData ?? []
          }
        }),
      )
      setWorkoutExercises(exerciseMap)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function handleRemoveProgram() {
    if (!programAssignment) return false
    try {
      const { error } = await supabase.from('program_assignments').update({ is_active: false }).eq('id', programAssignment.id)
      if (error) throw error
      setProgramAssignment(null)
      setProgramWorkouts([])
      setScheduledWorkouts([])
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  // Returns the first scheduled date so the calendar can jump to it.
  async function handleAutoSchedule(startDate, restDays) {
    if (!startDate || programWorkouts.length === 0) return null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const toInsert = programWorkouts.map((pw, i) => {
        const d = new Date(startDate + 'T00:00:00')
        d.setDate(d.getDate() + i * (1 + restDays))
        return { client_id: clientId, program_workout_id: pw.id, scheduled_date: toLocalDateStr(d), created_by: user.id }
      })
      const { data, error } = await supabase.from('scheduled_workouts').insert(toInsert).select(SW_SELECT)
      if (error) throw error
      setScheduledWorkouts((prev) => [...prev, ...(data ?? []).map(enrichSW)])
      return new Date(startDate + 'T00:00:00')
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async function handleMoveWorkout(scheduledWorkoutId, newDateStr) {
    const existing = scheduledWorkouts.find((sw) => sw.id === scheduledWorkoutId)
    if (!existing || existing.scheduled_date === newDateStr) return
    setScheduledWorkouts((prev) => prev.map((sw) => (sw.id === scheduledWorkoutId ? { ...sw, scheduled_date: newDateStr } : sw)))
    try {
      const { error } = await supabase.from('scheduled_workouts').update({ scheduled_date: newDateStr }).eq('id', scheduledWorkoutId)
      if (error) throw error
    } catch (e) {
      console.error(e)
      setScheduledWorkouts((prev) => prev.map((sw) => (sw.id === scheduledWorkoutId ? { ...sw, scheduled_date: existing.scheduled_date } : sw)))
    }
  }

  function openWorkout(sw, completedLog) {
    setSelectedCalendarDay({
      date: sw.scheduled_date,
      workout: {
        id: sw.id,
        name: sw._displayName || sw.program_workouts?.name || sw.saved_workouts?.name || 'Workout',
        exercises: workoutExercises[sw.program_workout_id] ?? [],
        _isCustom: sw._isCustom,
        customContent: sw.saved_workouts?.content || null,
        completedLog: completedLog ?? null,
      },
    })
  }

  /* ---------------- View ---------------- */

  const status = clientStatus(checkins[0]?.submitted_at)
  const awaiting = checkins.filter((c) => !c.coach_reply).length
  const month = sessionsThisMonth(workoutLogs)
  const reply = {
    drafts: replyDrafts, setDrafts: setReplyDrafts, savingId: savingReplyId,
    editingId: editingReplyId, setEditingId: setEditingReplyId, error: replyError, onSave: handleSaveReply,
  }
  const tv = {
    calorieTarget, setCalorieTarget, proteinTarget, setProteinTarget, carbsTarget, setCarbsTarget,
    fatsTarget, setFatsTarget, waterTarget, waterTargetInput, setWaterTargetInput,
  }
  const targets = {
    calories: parseInt(calorieTarget) || 0, protein: parseInt(proteinTarget) || 0,
    carbs: parseInt(carbsTarget) || 0, fats: parseInt(fatsTarget) || 0, water: waterTarget,
  }
  const shared = {
    client, checkins, reply, focusReplyId, onOpenTab: setActiveTab, weightLogs, onLogWeight: handleLogWeight,
    scheduledWorkouts, workoutLogs, onOpenWorkout: openWorkout, foodLogs, waterLogs, targets, limitations: clientLimitations,
  }

  return (
    <div className="pb-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 -ml-1 h-9 pr-2 text-sm font-semibold text-muted hover:text-ink">
        <ChevronLeft size={18} /> Clients
      </Link>

      {/* Header */}
      <div className="mt-2 flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Avatar name={client.full_name} src={client.profile_photo_url} size={56} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-[28px] md:text-[32px] leading-[1.05] text-ink">{client.full_name}</h1>
              <Chip tone={STATUS[status].tone}>{STATUS[status].label}</Chip>
            </div>
            {clientGoal && <p className="text-[15px] text-ink mt-1">{clientGoal}</p>}
            <p className="text-[13px] text-muted mt-0.5">
              {checkins.length ? `Checked in ${relativeDay(checkins[0].submitted_at).toLowerCase()}` : 'No check-ins yet'}
              {' · '}{month} {month === 1 ? 'session' : 'sessions'} this month
              {programAssignment?.programs?.name ? ` · ${programAssignment.programs.name}` : ''}
              {programAssignment?.programs?.name && startedByClient(programAssignment, client) ? `, started by ${firstName(client.full_name)} (on demand)` : ''}
              {' · '}Joined {formatDate(client.created_at, { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end md:max-w-[420px]">
          {client.user_id ? null : !client.email ? (
            <span title="Add an email to this client before you can invite them" className="inline-flex items-center h-9 px-3.5 rounded-full text-sm font-semibold text-muted border border-dashed border-line-strong">Add an email to invite</span>
          ) : (
            <Button variant="soft" size="sm" onClick={handleCopyInvite}>
              {inviteCopied ? <Check size={16} /> : <Link2 size={16} />} {inviteCopied ? 'Copied' : 'Copy invite link'}
            </Button>
          )}
          {client.phone && (
            <a href={`sms:${client.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-bold bg-surface text-ink border border-line-strong hover:bg-surface-2">
              <MessageCircle size={16} /> Text
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-bold bg-surface text-ink border border-line-strong hover:bg-surface-2">
              <Mail size={16} /> Email
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={() => { setActiveTab('training'); setAssignOpen(true) }}>
            <ClipboardList size={16} /> {programAssignment ? 'Change program' : 'Assign program'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 -mx-4 md:mx-0 px-4 md:px-0 border-b border-line overflow-x-auto [scrollbar-width:none]" role="tablist">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className={`relative h-11 px-3 text-[15px] font-bold whitespace-nowrap transition-colors ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}
              >
                {t.label}
                {t.id === 'checkins' && awaiting > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-warn-soft text-warn text-xs tabular-nums">{awaiting}</span>
                )}
                {active && <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 md:mt-5">
        {activeTab === 'overview' && <OverviewTab {...shared} />}
        {activeTab === 'checkins' && <CheckinsTab client={client} checkins={checkins} reply={reply} />}
        {activeTab === 'training' && (
          <TrainingTab
            client={client}
            programAssignment={programAssignment}
            programWorkouts={programWorkouts}
            allPrograms={allPrograms}
            allProgramWorkouts={allProgramWorkouts}
            workoutExercises={workoutExercises}
            workoutNames={workoutNames}
            scheduledWorkouts={scheduledWorkouts}
            workoutLogs={workoutLogs}
            personalBests={personalBests}
            sessionSetLogs={sessionSetLogs}
            loadSessionSets={loadSessionSets}
            onOpenWorkout={openWorkout}
            onScheduleWorkout={handleSelectWorkout}
            onRemoveScheduled={handleRemoveScheduledWorkout}
            onAssignProgram={handleAssignProgram}
            onRemoveProgram={handleRemoveProgram}
            onAutoSchedule={handleAutoSchedule}
            onMoveWorkout={handleMoveWorkout}
            assignOpen={assignOpen}
            setAssignOpen={setAssignOpen}
          />
        )}
        {activeTab === 'nutrition' && (
          <NutritionTab
            clientFirst={client.full_name.split(' ')[0]}
            foodLogs={foodLogs}
            waterLogs={waterLogs}
            tv={tv}
            mealPlan={mealPlan}
            onSaveTargets={handleSaveNutritionTargets}
            onCancelTargets={handleCancelTargets}
            savingTargets={savingTargets}
            onLogWater={handleLogWater}
            onDeleteWater={handleDeleteWaterLog}
            savingWater={savingWater}
          />
        )}
        {activeTab === 'habits' && <HabitsTab client={client} habits={habits} habitLogs={habitLogs} />}
        {activeTab === 'notes' && (
          <NotesTab
            client={client}
            clientGoal={clientGoal}
            onSaveGoal={handleSaveGoal}
            clientLimitations={clientLimitations}
            onSaveLimitations={handleSaveLimitations}
            savedNotes={savedNotes}
            onSaveNote={handleSaveNote}
            progressPhotos={progressPhotos}
          />
        )}
      </div>

      <WorkoutSheet
        selectedDay={selectedCalendarDay}
        clientId={clientId}
        onClose={() => setSelectedCalendarDay(null)}
        onWorkoutDone={(newLog) => { if (newLog) setWorkoutLogs((prev) => [newLog, ...prev]) }}
      />
    </div>
  )
}
