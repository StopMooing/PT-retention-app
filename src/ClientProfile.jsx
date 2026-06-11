import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { ArrowLeft, Phone, Target, Calendar, Activity, CheckCircle2, Clock, Dumbbell, Utensils, Heart, FileText, TrendingUp, Flame, Edit3, Send, Plus, ChevronRight, ChevronDown, Circle, Mail, Scale, AlertCircle, Camera, Flag, Timer, MoreHorizontal, Droplets, Trophy, Search } from "lucide-react";
import { DndContext, DragOverlay, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "training",  label: "Training"  },
  { id: "nutrition", label: "Nutrition" },
  { id: "habits",    label: "Habits"    },
  { id: "checkins",  label: "Check-ins" },
  { id: "notes",     label: "Notes"     },
]

function toLocalDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateLong(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function formatMonthYear(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-AU", { month: "long", year: "numeric" })
}

function timeAgo(dateStr) {
  if (!dateStr) return "Never"
  const daysAgo = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  if (daysAgo === 0) return "Today"
  if (daysAgo === 1) return "Yesterday"
  return `${daysAgo} days ago`
}

function computeStatus(checkins) {
  if (!checkins || checkins.length === 0) return "No check-ins"
  const daysAgo = Math.floor((new Date() - new Date(checkins[0].submitted_at)) / (1000 * 60 * 60 * 24))
  if (daysAgo <= 7) return "Engaged"
  if (daysAgo <= 14) return "Drifting"
  return "At Risk"
}

function statusStyle(status) {
  switch (status) {
    case "Engaged":  return { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" }
    case "Drifting": return { badge: "bg-amber-50 text-amber-600 border border-amber-200", dot: "bg-amber-400" }
    case "At Risk":  return { badge: "bg-red-50 text-red-600 border border-red-200", dot: "bg-red-500" }
    default:         return { badge: "bg-gray-100 text-gray-500 border border-gray-200", dot: "bg-gray-400" }
  }
}

function ScoreDots({ score }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-3 h-3 rounded-sm ${n <= score ? "bg-indigo-500" : "bg-gray-100"}`} />
      ))}
    </div>
  )
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function CalendarDayModal({ selectedDay, onClose, onStartWorkout }) {
  if (!selectedDay) return null;
  const { date, workout } = selectedDay;
  const exercises = workout.exercises || workout.workout_exercises || [];
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const estMinutes = Math.round(totalSets * 2.5);
  const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{dateLabel}</p>
            <h2 className="text-lg font-bold text-gray-900">{workout.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-lg leading-none">×</button>
        </div>
        <div className="flex gap-3 px-5 py-3 border-b border-gray-100">
          {estMinutes > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              est. {estMinutes} minutes
            </div>
          )}
          {exercises.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 4v16M18 4v16M6 12h12"/></svg>
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {workout._isCustom && workout.customContent ? (
            (() => {
              let parsed = null
              try {
                const candidate = JSON.parse(workout.customContent)
                if (candidate && Array.isArray(candidate.exercises)) parsed = candidate
              } catch (e) { /* legacy plain-text content, fall through to pre */ }
              if (parsed) {
                return (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Workout Plan</p>
                    <div className="space-y-3">
                      {parsed.exercises.map((ex, idx) => {
                        const rest = ex.rest_seconds ? `${ex.rest_seconds}s rest between sets` : null
                        return (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-emerald-700">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{ex.name || 'Exercise'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{ex.sets || 0} sets × {ex.reps || '–'} reps{rest ? ` · ${rest}` : ''}</p>
                              {ex.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{ex.notes}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              return (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Workout Plan</p>
                  <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4">{workout.customContent}</pre>
                </div>
              )
            })()
          ) : exercises.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No exercises added to this workout yet.</p>
          ) : null}
          {!workout._isCustom && exercises.map((ex, idx) => {
            const exName = ex.exercise?.name || ex.exercises?.name || ex.name || 'Exercise';
            const sets = ex.sets || 0;
            const reps = ex.reps || '–';
            const rest = ex.rest_seconds ? `${ex.rest_seconds}s rest between sets` : null;
            return (
              <div key={ex.id || idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-emerald-700">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{exName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sets} sets × {reps} reps{rest ? ` · ${rest}` : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => { onStartWorkout && onStartWorkout(workout); onClose(); }}
            className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 active:bg-gray-900 transition-colors text-sm"
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableWorkout({ workout, onRemove, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: workout.uniqueId || workout.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 999 : 'auto', position: 'relative' } : {};
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative"
    >
      <div
        {...listeners}
        onClick={() => onClick && onClick(workout)}
        className={`text-xs font-semibold px-2 py-1 rounded-lg cursor-pointer truncate mb-0.5 ${
          workout._isCustom
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
        } transition-colors`}
      >
        {workout._displayName || workout.program_workouts?.name || workout.saved_workouts?.name || 'Workout'}
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(workout); }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center z-10 leading-none"
        >×</button>
      )}
    </div>
  );
}

function DroppableDay({ dateStr, isToday, isPast, isHovered, isDragOver, day, scheduledForDay, programAssignment, activeDragWorkout, onMouseEnter, onMouseLeave, onAddClick, onRemoveClick, onWorkoutClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[130px] p-2 border-r border-gray-50 last:border-r-0 transition-colors relative overflow-hidden ${
        isOver && activeDragWorkout ? "bg-indigo-50/60 ring-2 ring-inset ring-indigo-300" :
        isHovered ? "bg-indigo-50/30" :
        isPast ? "bg-gray-50/30" : "bg-white"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-indigo-600 text-white" : "text-gray-500"}`}>
          {day.getDate()}
        </div>
        {isHovered && programAssignment && !activeDragWorkout && (
          <button
            onClick={onAddClick}
            className="w-5 h-5 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition shadow-sm"
          >
            <Plus size={11} className="text-white" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {scheduledForDay.map(sw => (
          <DraggableWorkout
            key={sw.id}
            workout={sw}
            onRemove={() => onRemoveClick(sw.id)}
            onClick={onWorkoutClick}
          />
        ))}
      </div>
    </div>
  )
}

export default function ClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [client, setClient]                       = useState(null)
  const [checkins, setCheckins]                   = useState([])
  const [programAssignment, setProgramAssignment] = useState(null)
  const [habits, setHabits]                       = useState([])
  const [habitLogs, setHabitLogs]                 = useState([])
  const [mealPlan, setMealPlan]                   = useState(null)
  const [workoutLogs, setWorkoutLogs]             = useState([])
  const [personalBests, setPersonalBests]         = useState([])
  const [pbSearch, setPbSearch]                   = useState("")
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [expandedExerciseKey, setExpandedExerciseKey] = useState(null)
  const [sessionSetLogs, setSessionSetLogs]       = useState({})
  const [activeTab, setActiveTab]                 = useState("overview")
  const [loading, setLoading]                     = useState(true)
  const [notes, setNotes]                         = useState("")
  const [showNoteForm, setShowNoteForm]           = useState(false)
  const [savedNotes, setSavedNotes]               = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [copied, setCopied]                       = useState(false)

  const [weightLogs, setWeightLogs] = useState([])
  const [weightPeriod, setWeightPeriod] = useState("30")
  const [progressPhotos, setProgressPhotos] = useState([])
  const [newWeight, setNewWeight] = useState("")
  const [savingWeight, setSavingWeight] = useState(false)
  const [showWeightInput, setShowWeightInput] = useState(false)
  const [clientGoal, setClientGoal] = useState("")
  const [clientLimitations, setClientLimitations] = useState("")
  const [editingGoal, setEditingGoal] = useState(false)
  const [editingLimitations, setEditingLimitations] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [savingLimitations, setSavingLimitations] = useState(false)

  const [foodLogs, setFoodLogs] = useState([])
  const [nutritionPeriod, setNutritionPeriod] = useState("30")
  const [calorieTarget, setCalorieTarget] = useState("")
  const [proteinTarget, setProteinTarget] = useState("")
  const [carbsTarget, setCarbsTarget] = useState("")
  const [fatsTarget, setFatsTarget] = useState("")
  const [editingTargets, setEditingTargets] = useState(false)
  const [savingTargets, setSavingTargets] = useState(false)
  const [targetMode, setTargetMode] = useState("grams")
  const [proteinPct, setProteinPct] = useState("")
  const [carbsPct, setCarbsPct] = useState("")
  const [fatsPct, setFatsPct] = useState("")
  const [waterLogs, setWaterLogs] = useState([])
  const [waterTarget, setWaterTarget] = useState(2000)
  const [waterTargetInput, setWaterTargetInput] = useState("")
  const [editingWaterTarget, setEditingWaterTarget] = useState(false)
  const [savingWaterTarget, setSavingWaterTarget] = useState(false)
  const [newWaterAmount, setNewWaterAmount] = useState("")
  const [savingWater, setSavingWater] = useState(false)
  const [waterUnit, setWaterUnit] = useState("ml")

  const [calendarView, setCalendarView] = useState("4week")
  const [calendarStartDate, setCalendarStartDate] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [scheduledWorkouts, setScheduledWorkouts] = useState([])
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [workoutExercises, setWorkoutExercises] = useState({})
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [modalTargetDate, setModalTargetDate] = useState(null)
  const [modalSearch, setModalSearch] = useState("")
  const [modalSelectedWorkout, setModalSelectedWorkout] = useState(null)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [trainingMode, setTrainingMode] = useState("assignment")
  const [programWorkouts, setProgramWorkouts] = useState([])
  const [hoveredDay, setHoveredDay] = useState(null)
  const [allPrograms, setAllPrograms] = useState([])
  const [expandedProgramId, setExpandedProgramId] = useState(null)
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false)
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false)
  const [activeDragWorkout, setActiveDragWorkout] = useState(null)
  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )
  const [autoScheduleStartDate, setAutoScheduleStartDate] = useState(() => new Date().toISOString().split("T")[0])
  const [autoScheduleRestDays, setAutoScheduleRestDays] = useState(1)
  const [autoScheduling, setAutoScheduling] = useState(false)
  const [assigningProgram, setAssigningProgram] = useState(false)
  const [selectedProgramToAssign, setSelectedProgramToAssign] = useState(null)
  const [assignProgramSearch, setAssignProgramSearch] = useState("")
  const [showRemoveProgramConfirm, setShowRemoveProgramConfirm] = useState(false)
  const [removingProgram, setRemovingProgram] = useState(false)
  const [allProgramWorkouts, setAllProgramWorkouts] = useState([])


  const getDateString = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split("T")[0]
  }

  const calculateStreak = (habitId) => {
    const dates = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .map(l => l.completed_date)
      .sort()
      .reverse()
    let streak = 0
    let checkDate = new Date().toISOString().split("T")[0]
    for (const date of dates) {
      if (date === checkDate) {
        streak++
        const d = new Date(checkDate + "T00:00:00")
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split("T")[0]
      } else if (date < checkDate) break
    }
    return streak
  }

  const calculateBestStreak = (habitId) => {
    const dates = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .map(l => l.completed_date)
      .sort()
    if (dates.length === 0) return 0
    let best = 1, current = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i] + "T00:00:00") - new Date(dates[i - 1] + "T00:00:00")) / 86400000
      if (diff === 1) { current++; if (current > best) best = current }
      else if (diff > 1) current = 1
    }
    return best
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const [clientRes, checkinsRes, programRes, habitsRes, mealPlanRes, workoutRes, weightRes, foodLogsRes, exerciseLogsRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", clientId).single(),
          supabase.from("checkins").select("*").eq("client_id", clientId).order("submitted_at", { ascending: false }),
          supabase.from("program_assignments").select("*, programs(*)").eq("client_id", clientId).eq("is_active", true).limit(1),
          supabase.from("habits").select("*").eq("client_id", clientId).eq("is_active", true),
          supabase.from("meal_plans").select("*").eq("client_id", clientId).eq("is_active", true).limit(1),
          supabase.from("workout_logs").select("*").eq("client_id", clientId).order("logged_at", { ascending: false }).limit(200),
          supabase.from("body_weight_logs").select("*").eq("client_id", clientId).order("logged_date", { ascending: true }),
          supabase.from("food_logs").select("*").eq("client_id", clientId).order("logged_at", { ascending: false }).limit(20),
          supabase.from("exercise_logs").select("*, exercises(name)").eq("client_id", clientId).order("created_at", { ascending: false }).limit(20),
        ])
        setClient(clientRes.data)
        setCheckins(checkinsRes.data ?? [])
        setProgramAssignment(programRes.data?.[0] ?? null)
        const fetchedHabits = habitsRes.data ?? []
        setHabits(fetchedHabits)
        setMealPlan(mealPlanRes.data?.[0] ?? null)
        setWorkoutLogs(workoutRes.data ?? [])
        setWeightLogs(weightRes.data ?? [])
        const { data: ptNotesData } = await supabase
          .from("pt_notes")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
        setSavedNotes(ptNotesData ?? [])

        const { data: pbData } = await supabase
          .from("personal_bests")
          .select("id, exercise_id, pb_type, value, achieved_at, exercises(name)")
          .eq("client_id", clientId)
          .order("achieved_at", { ascending: false })
        setPersonalBests(pbData ?? [])
        const { data: { user: currentUserForFetch } } = await supabase.auth.getUser()

        const { data: allProgramsData } = await supabase
          .from("programs")
          .select("id, name, description")
          .eq("created_by", currentUserForFetch.id)
          .order("created_at", { ascending: false })

        const fetchedPrograms = allProgramsData ?? []
        setAllPrograms(fetchedPrograms)

        if (fetchedPrograms.length > 0) {
          const { data: allPWData } = await supabase
            .from("program_workouts")
            .select("id, name, day_number, program_id")
            .in("program_id", fetchedPrograms.map(p => p.id))
            .order("day_number", { ascending: true })

          const fetchedAllPW = allPWData ?? []
          setAllProgramWorkouts(fetchedAllPW)
          setProgramWorkouts(fetchedAllPW.filter(pw => pw.program_id === programRes.data?.[0]?.programs?.id))

          if (fetchedAllPW.length > 0) {
            const exerciseMap = {}
            await Promise.all(
              fetchedAllPW.map(async (pw) => {
                const { data: exData } = await supabase
                  .from("workout_exercises")
                  .select("id, sets, reps, order_index, exercises(id, name, muscle_group)")
                  .eq("program_workout_id", pw.id)
                  .order("order_index", { ascending: true })
                exerciseMap[pw.id] = exData ?? []
              })
            )
            setWorkoutExercises(exerciseMap)
          }
        }

        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const threeMonthsAhead = new Date()
        threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3)

        const { data: swData } = await supabase
          .from("scheduled_workouts")
          .select("id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)")
          .eq("client_id", clientId)
          .gte("scheduled_date", threeMonthsAgo.toISOString().split("T")[0])
          .lte("scheduled_date", threeMonthsAhead.toISOString().split("T")[0])
        const enrichedSW = (swData ?? []).map(sw => ({
          ...sw,
          _displayName: sw.program_workouts?.name || sw.saved_workouts?.name || 'Workout',
          _isCustom: !!sw.custom_workout_id,
        }))
        setScheduledWorkouts(enrichedSW)

        const { data: photoData } = await supabase
          .from('progress_photos')
          .select('id, photo_url, note, taken_at, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(12)
        setProgressPhotos(photoData ?? [])

        setClientGoal(clientRes.data?.goal ?? "")
        setClientLimitations(clientRes.data?.limitations ?? "")
        setCalorieTarget(clientRes.data?.calorie_target ?? "")
        setProteinTarget(clientRes.data?.protein_target_g ?? "")
        setCarbsTarget(clientRes.data?.carbs_target_g ?? "")
        setFatsTarget(clientRes.data?.fats_target_g ?? "")

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const { data: foodLogsData } = await supabase
          .from("food_logs")
          .select("id, food_name, brand, meal_type, serving_size_g, servings, calories, protein_g, carbs_g, fats_g, logged_at")
          .eq("client_id", clientId)
          .gte("logged_at", ninetyDaysAgo.toISOString())
          .order("logged_at", { ascending: false })
        setFoodLogs(foodLogsData ?? [])

        setWaterTarget(clientRes.data?.water_target_ml ?? 2000)
        setWaterTargetInput(String(clientRes.data?.water_target_ml ?? 2000))

        const thirtyDaysAgoForWater = new Date()
        thirtyDaysAgoForWater.setDate(thirtyDaysAgoForWater.getDate() - 30)
        const { data: waterLogsData } = await supabase
          .from("water_logs")
          .select("id, amount_ml, logged_date, created_at")
          .eq("client_id", clientId)
          .gte("logged_date", thirtyDaysAgoForWater.toISOString().split("T")[0])
          .order("logged_date", { ascending: false })
        setWaterLogs(waterLogsData ?? [])

        if (fetchedHabits.length > 0) {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const { data: logsData } = await supabase
            .from("habit_logs")
            .select("*")
            .in("habit_id", fetchedHabits.map(h => h.id))
            .gte("completed_date", thirtyDaysAgo.toISOString().split("T")[0])
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <p className="text-gray-500 font-semibold">Client not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm text-indigo-600 hover:underline">Go back</button>
        </div>
      </div>
    )
  }

  const status = computeStatus(checkins)
  const { badge: badgeClass, dot: dotClass } = statusStyle(status)
  const today = new Date().toISOString().split("T")[0]

  const filteredWeightLogs = weightLogs.filter(w => {
    const daysAgo = Math.floor((new Date() - new Date(w.logged_date)) / (1000 * 60 * 60 * 24))
    return daysAgo <= parseInt(weightPeriod)
  })

  const allUpdates = [
    ...checkins.map(c => ({
      type: "checkin",
      label: "Submitted a check-in",
      sub: `Training ${c.training_score}/5 · Energy ${c.energy_score}/5`,
      date: c.submitted_at,
      icon: "checkin",
    })),
    ...habitLogs.filter(l => l.completed).map(l => {
      const habit = habits.find(h => h.id === l.habit_id)
      return {
        type: "habit",
        label: `Completed ${habit?.name ?? "a habit"}`,
        sub: habit?.icon ? `${habit.icon} ${habit.frequency ?? ""}` : "",
        date: l.completed_date,
        icon: "habit",
      }
    }),
    ...workoutLogs.map(w => ({
      type: "workout",
      label: w.completed ? "Completed a workout" : "Started a workout",
      sub: "",
      date: w.logged_at,
      icon: "workout",
    })),
    ...weightLogs.map(w => ({
      type: "weight",
      label: `Logged body weight`,
      sub: `${w.weight_kg} kg`,
      date: w.created_at,
      icon: "weight",
    })),
  ]
    .filter(u => u.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)

  const initials = client.full_name?.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?"

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/checkin/${clientId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveNote() {
    if (!notes.trim()) return
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("pt_notes")
        .insert({
          client_id: clientId,
          pt_id: currentUser.id,
          text: notes.trim(),
        })
        .select()
        .single()
      if (error) throw error
      setSavedNotes(prev => [data, ...prev])
      setNotes("")
      setShowNoteForm(false)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleLogWeight() {
    const w = parseFloat(newWeight)
    if (!w || w <= 0 || w > 500) return
    setSavingWeight(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("body_weight_logs")
        .insert({
          client_id: clientId,
          logged_by: user.id,
          weight_kg: w,
          logged_date: today,
        })
        .select()
        .single()
      if (error) throw error
      setWeightLogs(prev => [...prev, data].sort((a, b) => new Date(a.logged_date) - new Date(b.logged_date)))
      setNewWeight("")
      setShowWeightInput(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingWeight(false)
    }
  }

  async function handleSaveGoal() {
    setSavingGoal(true)
    try {
      await supabase.from("clients").update({ goal: clientGoal }).eq("id", clientId)
      setEditingGoal(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingGoal(false)
    }
  }

  async function handleSaveLimitations() {
    setSavingLimitations(true)
    try {
      await supabase.from("clients").update({ limitations: clientLimitations }).eq("id", clientId)
      setEditingLimitations(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingLimitations(false)
    }
  }

  async function handleSaveNutritionTargets() {
    setSavingTargets(true)
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          calorie_target: parseInt(calorieTarget) || null,
          protein_target_g: parseInt(proteinTarget) || null,
          carbs_target_g: parseInt(carbsTarget) || null,
          fats_target_g: parseInt(fatsTarget) || null,
        })
        .eq("id", clientId)
      if (error) throw error
      setEditingTargets(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingTargets(false)
    }
  }

  async function handleSaveWaterTarget() {
    setSavingWaterTarget(true)
    try {
      const ml = parseInt(waterTargetInput) || 2000
      const { error } = await supabase
        .from("clients")
        .update({ water_target_ml: ml })
        .eq("id", clientId)
      if (error) throw error
      setWaterTarget(ml)
      setEditingWaterTarget(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingWaterTarget(false)
    }
  }

  async function handleLogWater() {
    const rawAmount = parseFloat(newWaterAmount)
    if (!rawAmount || rawAmount <= 0) return
    const amountMl = waterUnit === "ml" ? Math.round(rawAmount) : Math.round(rawAmount * 1000)
    setSavingWater(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const todayStr = new Date().toISOString().split("T")[0]
      const { data: newLog, error } = await supabase
        .from("water_logs")
        .insert({
          client_id: clientId,
          logged_by: user.id,
          amount_ml: amountMl,
          logged_date: todayStr,
        })
        .select()
        .single()
      if (error) throw error
      setWaterLogs(prev => [newLog, ...prev])
      setNewWaterAmount("")
    } catch (e) {
      console.error(e)
    } finally {
      setSavingWater(false)
    }
  }

  async function handleDeleteWaterLog(logId) {
    try {
      await supabase.from("water_logs").delete().eq("id", logId)
      setWaterLogs(prev => prev.filter(w => w.id !== logId))
    } catch (e) {
      console.error(e)
    }
  }

  function getCalendarDays() {
    const days = []
    const numWeeks = calendarView === "1week" ? 1 : calendarView === "2week" ? 2 : 4
    for (let i = 0; i < numWeeks * 7; i++) {
      const d = new Date(calendarStartDate)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }

  async function loadSessionSets(log) {
    if (sessionSetLogs[log.id]) return
    const sessionDateStr = toLocalDateStr(new Date(log.logged_at))
    const dayStart = new Date(sessionDateStr + "T00:00:00")
    dayStart.setDate(dayStart.getDate() - 1)
    const dayEnd = new Date(sessionDateStr + "T00:00:00")
    dayEnd.setDate(dayEnd.getDate() + 2)
    const { data } = await supabase
      .from("workout_set_logs")
      .select("id, set_number, reps_completed, weight_kg, exercise_id, logged_at, exercises(name)")
      .eq("client_id", clientId)
      .gte("logged_at", dayStart.toISOString())
      .lte("logged_at", dayEnd.toISOString())
      .order("set_number", { ascending: true })
    const sameDay = (data ?? []).filter(r => toLocalDateStr(new Date(r.logged_at)) === sessionDateStr)
    setSessionSetLogs(prev => ({ ...prev, [log.id]: sameDay }))
  }

  function navigateCalendar(direction) {
    const numWeeks = calendarView === "1week" ? 1 : calendarView === "2week" ? 2 : 4
    setCalendarStartDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + (direction * numWeeks * 7))
      return d
    })
  }

  function goToToday() {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    setCalendarStartDate(d)
  }

  async function handleSelectWorkout() {
    if (!modalSelectedWorkout || !modalTargetDate) return
    setSavingSchedule(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const dateStr = toLocalDateStr(modalTargetDate)
      const { data, error } = await supabase
        .from("scheduled_workouts")
        .insert({
          client_id: clientId,
          program_workout_id: modalSelectedWorkout.id,
          scheduled_date: dateStr,
          created_by: user.id,
        })
        .select("id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)")
        .single()
      if (error) throw error
      const enriched = { ...data, _displayName: data.program_workouts?.name || data.saved_workouts?.name || 'Workout', _isCustom: !!data.custom_workout_id }
      setScheduledWorkouts(prev => [...prev, enriched])
      setShowWorkoutModal(false)
      setModalSelectedWorkout(null)
      setModalTargetDate(null)
      setModalSearch("")
    } catch (e) {
      console.error(e)
    } finally {
      setSavingSchedule(false)
    }
  }

  async function handleRemoveScheduledWorkout(scheduledWorkoutId) {
    try {
      await supabase.from("scheduled_workouts").delete().eq("id", scheduledWorkoutId)
      setScheduledWorkouts(prev => prev.filter(sw => sw.id !== scheduledWorkoutId))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAssignProgram() {
    if (!selectedProgramToAssign) return
    setAssigningProgram(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (programAssignment) {
        await supabase
          .from("program_assignments")
          .update({ is_active: false })
          .eq("id", programAssignment.id)
      }

      const today = new Date().toISOString().split("T")[0]
      const { data: newAssignment, error } = await supabase
        .from("program_assignments")
        .insert({
          client_id: clientId,
          program_id: selectedProgramToAssign.id,
          start_date: today,
          is_active: true,
        })
        .select("id, start_date, programs(id, name)")
        .single()

      if (error) throw error

      setProgramAssignment(newAssignment)

      const { data: pwData } = await supabase
        .from("program_workouts")
        .select("id, name, day_number, program_id")
        .eq("program_id", selectedProgramToAssign.id)
        .order("day_number", { ascending: true })

      const fetchedPW = pwData ?? []
      setProgramWorkouts(fetchedPW)

      const exerciseMap = { ...workoutExercises }
      await Promise.all(
        fetchedPW.map(async (pw) => {
          if (!exerciseMap[pw.id]) {
            const { data: exData } = await supabase
              .from("workout_exercises")
              .select("id, sets, reps, order_index, exercises(id, name, muscle_group)")
              .eq("program_workout_id", pw.id)
              .order("order_index", { ascending: true })
            exerciseMap[pw.id] = exData ?? []
          }
        })
      )
      setWorkoutExercises(exerciseMap)

      setShowAssignProgramModal(false)
      setSelectedProgramToAssign(null)
      setAssignProgramSearch("")
    } catch (e) {
      console.error(e)
    } finally {
      setAssigningProgram(false)
    }
  }

  async function handleRemoveProgram() {
    if (!programAssignment) return
    setRemovingProgram(true)
    try {
      const { error } = await supabase
        .from("program_assignments")
        .update({ is_active: false })
        .eq("id", programAssignment.id)
      if (error) throw error
      setProgramAssignment(null)
      setProgramWorkouts([])
      setScheduledWorkouts([])
      setShowRemoveProgramConfirm(false)
    } catch (e) {
      console.error(e)
    } finally {
      setRemovingProgram(false)
    }
  }

  async function handleAutoSchedule() {
    if (!autoScheduleStartDate || programWorkouts.length === 0) return
    setAutoScheduling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const toInsert = programWorkouts.map((pw, i) => {
        const d = new Date(autoScheduleStartDate + "T00:00:00")
        d.setDate(d.getDate() + i * (1 + autoScheduleRestDays))
        return {
          client_id: clientId,
          program_workout_id: pw.id,
          scheduled_date: d.toISOString().split("T")[0],
          created_by: user.id,
        }
      })
      const { data, error } = await supabase
        .from("scheduled_workouts")
        .insert(toInsert)
        .select("id, scheduled_date, program_workout_id, custom_workout_id, program_workouts(id, name, day_number), saved_workouts(id, name, content)")
      if (error) throw error
      const enrichedBulk = (data ?? []).map(sw => ({ ...sw, _displayName: sw.program_workouts?.name || sw.saved_workouts?.name || 'Workout', _isCustom: !!sw.custom_workout_id }))
      setScheduledWorkouts(prev => [...prev, ...enrichedBulk])
      setShowAutoScheduleModal(false)
      const firstDate = new Date(autoScheduleStartDate + "T00:00:00")
      const day = firstDate.getDay()
      const diff = firstDate.getDate() - day + (day === 0 ? -6 : 1)
      firstDate.setDate(diff)
      firstDate.setHours(0, 0, 0, 0)
      setCalendarStartDate(firstDate)
    } catch (e) {
      console.error(e)
    } finally {
      setAutoScheduling(false)
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveDragWorkout(null)
    if (!over || active.id === over.id) return
    const scheduledWorkoutId = active.id
    const newDateStr = over.id
    const existing = scheduledWorkouts.find(sw => sw.id === scheduledWorkoutId)
    if (!existing || existing.scheduled_date === newDateStr) return
    setScheduledWorkouts(prev => prev.map(sw =>
      sw.id === scheduledWorkoutId ? { ...sw, scheduled_date: newDateStr } : sw
    ))
    try {
      const { error } = await supabase
        .from("scheduled_workouts")
        .update({ scheduled_date: newDateStr })
        .eq("id", scheduledWorkoutId)
      if (error) throw error
    } catch (e) {
      console.error(e)
      setScheduledWorkouts(prev => prev.map(sw =>
        sw.id === scheduledWorkoutId ? { ...sw, scheduled_date: existing.scheduled_date } : sw
      ))
    }
  }

  function handleDragStart(event) {
    const { active } = event
    const workout = scheduledWorkouts.find(sw => sw.id === active.id)
    setActiveDragWorkout(workout ?? null)
  }

  // ── TAB RENDERERS ────────────────────────────────────────────

  function renderOverview() {
    const minWeight = filteredWeightLogs.length > 0 ? Math.min(...filteredWeightLogs.map(w => parseFloat(w.weight_kg))) : 0
    const maxWeight = filteredWeightLogs.length > 0 ? Math.max(...filteredWeightLogs.map(w => parseFloat(w.weight_kg))) : 100
    const weightRange = maxWeight - minWeight || 10
    const chartHeight = 120
    const chartWidth = 400

    function getX(index, total) {
      if (total <= 1) return chartWidth / 2
      return (index / (total - 1)) * chartWidth
    }

    function getY(weight) {
      const ratio = (parseFloat(weight) - minWeight) / weightRange
      return chartHeight - (ratio * (chartHeight - 20)) - 10
    }

    const weightPoints = filteredWeightLogs.map((w, i) => ({
      x: getX(i, filteredWeightLogs.length),
      y: getY(w.weight_kg),
      weight: w.weight_kg,
      date: w.logged_date,
    }))

    const svgPath = weightPoints.length > 1
      ? weightPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : ""

    const svgFill = weightPoints.length > 1
      ? `${svgPath} L ${weightPoints[weightPoints.length - 1].x} ${chartHeight} L ${weightPoints[0].x} ${chartHeight} Z`
      : ""

    function updateIcon(type) {
      switch(type) {
        case "checkin": return <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={14} className="text-emerald-600" /></div>
        case "habit":   return <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0"><Heart size={14} className="text-pink-500" /></div>
        case "workout": return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><Dumbbell size={14} className="text-blue-600" /></div>
        case "weight":  return <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0"><Scale size={14} className="text-indigo-600" /></div>
        default:        return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><Activity size={14} className="text-gray-400" /></div>
      }
    }

    const todayLocal = toLocalDateStr()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const weekStartLocal = toLocalDateStr(sevenDaysAgo)
    const monthLocal = todayLocal.slice(0, 7)

    const completedLogs = workoutLogs.filter(w => w.completed)
    const workoutsLast7 = completedLogs.filter(w => {
      const d = toLocalDateStr(new Date(w.logged_at))
      return d >= weekStartLocal && d <= todayLocal
    }).length
    const scheduledLast7 = scheduledWorkouts.filter(sw => sw.scheduled_date >= weekStartLocal && sw.scheduled_date <= todayLocal).length
    const workoutsThisMonth = completedLogs.filter(w => toLocalDateStr(new Date(w.logged_at)).slice(0, 7) === monthLocal).length
    const scheduledThisMonth = scheduledWorkouts.filter(sw => sw.scheduled_date.slice(0, 7) === monthLocal && sw.scheduled_date <= todayLocal).length
    const adherenceLast7 = scheduledLast7 > 0 ? Math.round((workoutsLast7 / scheduledLast7) * 100) : null
    const adherenceThisMonth = scheduledThisMonth > 0 ? Math.round((workoutsThisMonth / scheduledThisMonth) * 100) : null
    const workoutsTotal = completedLogs.length

    const weightChange = filteredWeightLogs.length > 1
      ? parseFloat(filteredWeightLogs[filteredWeightLogs.length - 1].weight_kg) - parseFloat(filteredWeightLogs[0].weight_kg)
      : null

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px_260px] gap-5">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          <SectionCard>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity size={15} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Training</span>
              </div>
              {checkins.length === 0 && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Send size={11} /> Send Check-in Link
                </button>
              )}
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center bg-gray-50 rounded-xl py-5 px-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Last 7 Days</span>
                  <span className="text-2xl font-black text-gray-900">{workoutsLast7}{scheduledLast7 > 0 && <span className="text-base text-gray-400 font-medium">/{scheduledLast7}</span>}</span>
                  <span className={`text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full ${adherenceLast7 !== null ? (adherenceLast7 >= 85 ? "bg-emerald-50 text-emerald-600" : adherenceLast7 >= 1 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400") : (workoutsLast7 > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}`}>{adherenceLast7 !== null ? `${adherenceLast7}% adherence` : (workoutsLast7 > 0 ? "Active" : "No sessions")}</span>
                </div>
                <div className="flex flex-col items-center bg-gray-50 rounded-xl py-5 px-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This Month</span>
                  <span className="text-2xl font-black text-gray-900">{workoutsThisMonth}{scheduledThisMonth > 0 && <span className="text-base text-gray-400 font-medium">/{scheduledThisMonth}</span>}</span>
                  <span className={`text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full ${adherenceThisMonth !== null ? (adherenceThisMonth >= 85 ? "bg-emerald-50 text-emerald-600" : adherenceThisMonth >= 1 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400") : (workoutsThisMonth > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}`}>{adherenceThisMonth !== null ? `${adherenceThisMonth}% adherence` : (workoutsThisMonth > 0 ? "Active" : "No sessions")}</span>
                </div>
                <div className="flex flex-col items-center bg-gray-50 rounded-xl py-5 px-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Total</span>
                  <span className="text-2xl font-black text-gray-900">{workoutsTotal}</span>
                  <span className="text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400">All time</span>
                </div>
              </div>
              {checkins.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Last check-in</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{formatDate(checkins[0].submitted_at)}</span>
                    <span className="text-xs text-gray-400">· {timeAgo(checkins[0].submitted_at)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">No check-ins yet</span>
                  <span className="text-xs text-gray-300">Send the link to get started</span>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Scale size={15} className="text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Body Weight</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={weightPeriod}
                  onChange={e => setWeightPeriod(e.target.value)}
                  className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <button
                  onClick={() => setShowWeightInput(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus size={12} /> Log Weight
                </button>
              </div>
            </div>

            {showWeightInput && (
              <div className="px-6 pt-4 pb-0 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1">
                  <Scale size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="500"
                    placeholder="e.g. 78.5"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400 shrink-0">kg</span>
                </div>
                <button
                  onClick={handleLogWeight}
                  disabled={savingWeight || !newWeight}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
                >
                  {savingWeight ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setShowWeightInput(false); setNewWeight("") }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="px-6 py-5">
              {filteredWeightLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <TrendingUp size={20} className="text-gray-200" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No weight data yet</p>
                  <p className="text-xs text-gray-300 mt-1">Click "Log Weight" to add the first entry</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-gray-900">{filteredWeightLogs[filteredWeightLogs.length - 1].weight_kg}<span className="text-sm font-medium text-gray-400 ml-1">kg</span></span>
                      {weightChange !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${weightChange < 0 ? "bg-emerald-50 text-emerald-600" : weightChange > 0 ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                          {weightChange < 0 ? "▼" : weightChange > 0 ? "▲" : "—"} {Math.abs(weightChange).toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{filteredWeightLogs.length} entries</span>
                  </div>
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: "120px" }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {svgFill && <path d={svgFill} fill="url(#weightGradient)" />}
                    {svgPath && <path d={svgPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                    {weightPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="transparent" />
                        <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                        <title>{`${p.weight} kg — ${new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" })}`}</title>
                      </g>
                    ))}
                  </svg>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-300">{filteredWeightLogs[0]?.logged_date ? new Date(filteredWeightLogs[0].logged_date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" }) : ""}</span>
                    <span className="text-[10px] text-gray-300">{filteredWeightLogs[filteredWeightLogs.length - 1]?.logged_date ? new Date(filteredWeightLogs[filteredWeightLogs.length - 1].logged_date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" }) : ""}</span>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                  <Camera size={15} className="text-pink-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Progress Photos</span>
              </div>
              <span className="text-xs text-gray-400">{progressPhotos.length} photos</span>
            </div>
            {progressPhotos.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-400">No progress photos yet.</p>
                <p className="text-xs text-gray-300 mt-1">Photos the client uploads will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 p-4">
                {progressPhotos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 group relative">
                    <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white">{new Date(photo.taken_at || photo.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-4">

          <SectionCard>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                <Flag size={13} className="text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Goal</span>
            </div>
            <div className="px-5 py-4">
              {editingGoal ? (
                <div className="flex flex-col gap-2">
                  <textarea rows={3} value={clientGoal} onChange={e => setClientGoal(e.target.value)} placeholder="e.g. Lose 10kg by summer" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveGoal} disabled={savingGoal} className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-semibold py-1.5 rounded-lg transition disabled:opacity-50">{savingGoal ? "Saving..." : "Save"}</button>
                    <button onClick={() => setEditingGoal(false)} className="flex-1 border border-gray-200 text-gray-500 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{clientGoal || <span className="text-gray-300 italic">No goal set yet</span>}</p>
                  <button onClick={() => setEditingGoal(true)} className="shrink-0 w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center transition"><Edit3 size={12} className="text-gray-400" /></button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle size={13} className="text-red-500" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Limitations / Injuries</span>
            </div>
            <div className="px-5 py-4">
              {editingLimitations ? (
                <div className="flex flex-col gap-2">
                  <textarea rows={3} value={clientLimitations} onChange={e => setClientLimitations(e.target.value)} placeholder="e.g. Left knee injury, avoid deep squats" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveLimitations} disabled={savingLimitations} className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-semibold py-1.5 rounded-lg transition disabled:opacity-50">{savingLimitations ? "Saving..." : "Save"}</button>
                    <button onClick={() => setEditingLimitations(false)} className="flex-1 border border-gray-200 text-gray-500 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{clientLimitations || <span className="text-gray-300 italic">No limitations recorded</span>}</p>
                  <button onClick={() => setEditingLimitations(true)} className="shrink-0 w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center transition"><Edit3 size={12} className="text-gray-400" /></button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <FileText size={13} className="text-yellow-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Notes</span>
              </div>
              <button onClick={() => setActiveTab("notes")} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition">View all →</button>
            </div>
            <div className="px-5 py-4">
              {savedNotes.length === 0 ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300 italic">No notes yet</p>
                  <button onClick={() => setActiveTab("notes")} className="text-xs font-semibold text-black hover:text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1 rounded-lg transition">Add note</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedNotes.slice(0, 3).map((note, i) => (
                    <div key={note.id ?? i} className="flex flex-col gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <span className="text-[10px] font-semibold text-gray-300">{formatDate(note.created_at)} · {timeAgo(note.created_at)}</span>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{note.text}</p>
                    </div>
                  ))}
                  {savedNotes.length > 3 && (
                    <button onClick={() => setActiveTab("notes")} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition">+{savedNotes.length - 3} more notes →</button>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">

          <SectionCard>
            <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50">
              <span className="text-sm font-semibold text-gray-800">Profile</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              {client.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={13} className="text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={13} className="text-gray-300 shrink-0" />
                  <span className="text-xs text-gray-500">{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Calendar size={13} className="text-gray-300 shrink-0" />
                <span className="text-xs text-gray-500">Joined {formatMonthYear(client.created_at)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Target size={13} className="text-gray-300 shrink-0" />
                <span className="text-xs text-gray-500">{client.goal || "No goal set"}</span>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
              <span className="text-sm font-semibold text-gray-800">Recent Activity</span>
              <span className="text-xs text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">{allUpdates.length}</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
              {allUpdates.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-gray-300 italic">No activity yet</p>
                </div>
              ) : (
                allUpdates.map((update, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition">
                    {updateIcon(update.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 leading-snug">{update.label}</p>
                      {update.sub && <p className="text-xs text-gray-400 mt-0.5">{update.sub}</p>}
                      <p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(update.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

        </div>

      </div>
    )
  }

  function renderTraining() {
    const calendarDays = getCalendarDays()
    const numWeeks = calendarView === "1week" ? 1 : calendarView === "2week" ? 2 : 4
    const weeks = []
    for (let i = 0; i < numWeeks; i++) {
      weeks.push(calendarDays.slice(i * 7, i * 7 + 7))
    }

    const todayStr = toLocalDateStr()

    const filteredProgramWorkouts = programWorkouts.filter(pw =>
      pw.name?.toLowerCase().includes(modalSearch.toLowerCase())
    )

    const startLabel = calendarStartDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
    const endDate = new Date(calendarStartDate)
    endDate.setDate(endDate.getDate() + (numWeeks * 7) - 1)
    const endLabel = endDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })

    return (
      <div className="flex flex-col gap-4">

        {/* Program assignment bar */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Dumbbell size={15} className="text-blue-600" />
            </div>
            <div>
              {programAssignment ? (
                <>
                  <p className="text-sm font-semibold text-gray-800">{programAssignment.programs?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Started {formatDate(programAssignment.start_date)} · <span className="text-emerald-600 font-medium">Active</span></p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-500">No program assigned</p>
                  <p className="text-xs text-gray-400 mt-0.5">Assign a program to start scheduling workouts</p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {programAssignment && (
              <button
                onClick={() => setShowRemoveProgramConfirm(true)}
                className="flex items-center gap-2 text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => {
                setSelectedProgramToAssign(null)
                setAssignProgramSearch("")
                setShowAssignProgramModal(true)
              }}
              className="flex items-center gap-2 text-sm font-semibold bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
            >
              {programAssignment ? "Change Program" : "Assign Program"}
            </button>
          </div>
        </div>

        {/* Training mode toggle — always visible */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 w-fit mb-3">
          <button
            onClick={() => setTrainingMode("assignment")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${trainingMode === "assignment" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Assignment
          </button>
          <button
            onClick={() => setTrainingMode("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${trainingMode === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            History
          </button>
        </div>

        {/* Calendar — Assignment mode only */}
        {trainingMode === "assignment" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={goToToday} className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Today</button>
                <button onClick={() => navigateCalendar(-1)} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition">
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <button onClick={() => navigateCalendar(1)} className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition">
                  <ChevronRight size={14} />
                </button>
                <span className="text-sm font-semibold text-gray-700 ml-1">{startLabel} – {endLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {programAssignment && (
                <button
                  onClick={() => setShowAutoScheduleModal(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Calendar size={12} /> Auto-schedule
                </button>
              )}
              <div className="flex items-center gap-2 overflow-x-auto">
                {["1week", "2week", "4week"].map(view => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${calendarView === view ? "bg-black text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {view === "1week" ? "1 Week" : view === "2week" ? "2 Week" : "4 Week"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar grid with drag and drop */}
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-50">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div key={day} className="px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</span>
                  </div>
                ))}
              </div>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className={`grid grid-cols-7 ${weekIndex < weeks.length - 1 ? "border-b border-gray-50" : ""}`}>
                  {week.map((day, dayIndex) => {
                    const dateStr = toLocalDateStr(day)
                    const isToday = dateStr === todayStr
                    const scheduledForDay = scheduledWorkouts.filter(sw => sw.scheduled_date === dateStr)
                    const isHovered = hoveredDay === dateStr
                    const isPast = day < new Date(todayStr)
                    const isDragOver = activeDragWorkout && hoveredDay === dateStr

                    return (
                      <DroppableDay
                        key={dateStr}
                        dateStr={dateStr}
                        isToday={isToday}
                        isPast={isPast}
                        isHovered={isHovered}
                        isDragOver={isDragOver}
                        day={day}
                        scheduledForDay={scheduledForDay}
                        programAssignment={programAssignment}
                        activeDragWorkout={activeDragWorkout}
                        onMouseEnter={() => setHoveredDay(dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onAddClick={() => { setModalTargetDate(day); setShowWorkoutModal(true) }}
                        onRemoveClick={handleRemoveScheduledWorkout}
                        onWorkoutClick={(wo) => setSelectedCalendarDay({ date: dateStr, workout: { id: wo.id, name: wo._displayName || wo.program_workouts?.name || wo.saved_workouts?.name || 'Workout', exercises: workoutExercises[wo.program_workout_id] ?? [], _isCustom: wo._isCustom, customContent: wo.saved_workouts?.content || null } })}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <DragOverlay>
              {activeDragWorkout ? (
                <div className="bg-white border-2 border-indigo-400 rounded-lg p-1.5 shadow-xl opacity-95 w-[120px]">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide truncate block">
                    {activeDragWorkout._displayName || activeDragWorkout.program_workouts?.name || activeDragWorkout.saved_workouts?.name || "Workout"}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        )}

        {/* History mode */}
        {trainingMode === "history" && (
          <>
          <SectionCard>
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Personal Best Lookup</h3>
            </div>
            <div className="px-6 py-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={pbSearch}
                  onChange={(e) => setPbSearch(e.target.value)}
                  placeholder="Search an exercise to see its PBs"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition"
                />
              </div>
              {pbSearch.trim() === "" ? (
                <p className="text-xs text-gray-300 italic py-2">Start typing to find an exercise's personal bests.</p>
              ) : (() => {
                const meta = {
                  "1rm": { label: "Est. 1RM", unit: "kg" },
                  best_set: { label: "Best Set", unit: "pts" },
                  volume: { label: "Volume", unit: "kg" },
                }
                const grouped = Object.values(
                  personalBests.reduce((acc, pb) => {
                    const key = pb.exercise_id || pb.id
                    if (!acc[key]) acc[key] = { name: pb.exercises?.name || "Exercise", types: {} }
                    acc[key].types[pb.pb_type] = pb
                    return acc
                  }, {})
                ).filter(row => row.name.toLowerCase().includes(pbSearch.trim().toLowerCase()))
                if (grouped.length === 0) {
                  return <p className="text-xs text-gray-300 italic py-2">No personal bests found for that exercise.</p>
                }
                return (
                  <div className="space-y-1">
                    {grouped.map((row, idx) => (
                      <div key={idx} className="py-3 border-b border-gray-50 last:border-0">
                        <p className="text-sm font-semibold text-gray-800 mb-1.5">{row.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {["1rm", "best_set", "volume"].map(t => {
                            const pb = row.types[t]
                            if (!pb) return null
                            return (
                              <div key={t} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1">
                                <span className="text-xs text-gray-400">{meta[t].label}</span>
                                <span className="text-xs font-semibold text-gray-800">{pb.value} {meta[t].unit}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </SectionCard>
          <SectionCard>
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Workout History</h3>
            </div>
            <div className="px-6 py-4">
              {workoutLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-300 italic">No workouts logged yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workoutLogs.map(log => {
                    const sessionDateStr = toLocalDateStr(new Date(log.logged_at))
                    const isSessionOpen = expandedSessionId === log.id
                    const sets = sessionSetLogs[log.id] || []
                    const byExercise = sets.reduce((acc, s) => {
                      const key = s.exercise_id || "unknown"
                      if (!acc[key]) acc[key] = { name: s.exercises?.name || "Exercise", sets: [] }
                      acc[key].sets.push(s)
                      return acc
                    }, {})
                    const pbLabelByType = { "1rm": "1RM", best_set: "Best Set", volume: "Volume" }
                    const pbTypeOrder = ["1rm", "best_set", "volume"]
                    const pbDatesByExercise = personalBests.reduce((acc, pb) => {
                      if (pb.achieved_at && toLocalDateStr(new Date(pb.achieved_at)) === sessionDateStr) {
                        if (!acc[pb.exercise_id]) acc[pb.exercise_id] = new Set()
                        acc[pb.exercise_id].add(pb.pb_type)
                      }
                      return acc
                    }, {})
                    return (
                      <div key={log.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => {
                            if (isSessionOpen) {
                              setExpandedSessionId(null)
                            } else {
                              setExpandedSessionId(log.id)
                              setExpandedExerciseKey(null)
                              loadSessionSets(log)
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{formatDate(log.logged_at)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.logged_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.completed ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={14} className="text-emerald-500" /> Completed</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-400"><Circle size={14} className="text-gray-200" /> Incomplete</span>
                            )}
                            <ChevronDown size={15} className={`text-gray-300 transition-transform ${isSessionOpen ? "rotate-180" : ""}`} />
                          </div>
                        </button>
                        {isSessionOpen && (
                          <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/40">
                            {Object.keys(byExercise).length === 0 ? (
                              <p className="text-xs text-gray-300 italic py-2">No set data recorded for this session.</p>
                            ) : (
                              <div className="space-y-1">
                                {Object.entries(byExercise).map(([exKey, ex]) => {
                                  const exOpen = expandedExerciseKey === `${log.id}_${exKey}`
                                  const hitPB = pbDatesByExercise[exKey]
                                  return (
                                    <div key={exKey} className="bg-white border border-gray-100 rounded-lg">
                                      <button
                                        onClick={() => setExpandedExerciseKey(exOpen ? null : `${log.id}_${exKey}`)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition rounded-lg"
                                      >
                                        <span className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-800">{ex.name}</span>
                                          {hitPB && hitPB.size > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                              <Trophy size={10} /> {pbTypeOrder.filter(t => hitPB.has(t)).map(t => pbLabelByType[t]).join(" · ")}
                                            </span>
                                          )}
                                        </span>
                                        <ChevronDown size={13} className={`text-gray-300 transition-transform ${exOpen ? "rotate-180" : ""}`} />
                                      </button>
                                      {exOpen && (
                                        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
                                          {ex.sets.map((s, i) => (
                                            <div key={s.id || i} className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center min-w-[64px]">
                                              <p className="text-[10px] text-gray-400">Set {s.set_number}</p>
                                              <p className="text-xs font-semibold text-gray-800">{s.weight_kg}kg × {s.reps_completed}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </SectionCard>
          </>
        )}

        <CalendarDayModal
          selectedDay={selectedCalendarDay}
          onClose={() => setSelectedCalendarDay(null)}
          onStartWorkout={(workout) => {
            setSelectedCalendarDay(null);
          }}
        />

        {/* Find a Workout Modal */}
        {showWorkoutModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={e => { if (e.target === e.currentTarget) { setShowWorkoutModal(false); setModalSelectedWorkout(null); setExpandedProgramId(null); setModalSearch("") } }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh" }}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Find a Workout</h2>
                <button onClick={() => { setShowWorkoutModal(false); setModalSelectedWorkout(null); setExpandedProgramId(null); setModalSearch("") }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <div className="flex flex-1 min-h-0">
                <div className="w-[55%] border-r border-gray-100 flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                      <input type="text" placeholder="Search workouts..." value={modalSearch} onChange={e => { setModalSearch(e.target.value); setModalSelectedWorkout(null); setExpandedProgramId(null) }} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none" autoFocus />
                      {modalSearch && <button onClick={() => { setModalSearch(""); setModalSelectedWorkout(null); setExpandedProgramId(null) }} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {modalSearch.trim() !== "" ? (
                      (() => {
                        const searchLower = modalSearch.toLowerCase()
                        const matchingByName = allProgramWorkouts.filter(pw => pw.name?.toLowerCase().includes(searchLower))
                        const matchingByProgram = allProgramWorkouts.filter(pw => allPrograms.find(p => p.id === pw.program_id && p.name?.toLowerCase().includes(searchLower)))
                        const combined = [...new Map([...matchingByName, ...matchingByProgram].map(pw => [pw.id, pw])).values()]
                        return combined.length === 0 ? (
                          <div className="px-4 py-8 text-center"><p className="text-sm text-gray-400">No workouts match your search</p></div>
                        ) : (
                          <div className="py-2">
                            <div className="px-4 py-2"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Results ({combined.length})</span></div>
                            {combined.map(pw => {
                              const isSelected = modalSelectedWorkout?.id === pw.id
                              const exercises = workoutExercises[pw.id] ?? []
                              const parentProgram = allPrograms.find(p => p.id === pw.program_id)
                              return (
                                <button key={pw.id} onClick={() => setModalSelectedWorkout(pw)} className={`w-full text-left px-4 py-3 transition border-l-2 ${isSelected ? "bg-indigo-50 border-indigo-500" : "border-transparent hover:bg-gray-50 hover:border-gray-200"}`}>
                                  <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>{pw.name || `Day ${pw.day_number}`}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{parentProgram?.name ?? "Unknown program"} · {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}</p>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()
                    ) : (
                      allPrograms.length === 0 ? (
                        <div className="px-4 py-8 text-center"><p className="text-sm text-gray-400">No programs found</p><p className="text-xs text-gray-300 mt-1">Build a program in the Program Builder first</p></div>
                      ) : (
                        <div className="py-2">
                          {allPrograms.map(program => {
                            const workoutsInProgram = allProgramWorkouts.filter(pw => pw.program_id === program.id)
                            const isExpanded = expandedProgramId === program.id
                            const isAssigned = programAssignment?.programs?.id === program.id
                            return (
                              <div key={program.id}>
                                <button onClick={() => { setExpandedProgramId(isExpanded ? null : program.id); setModalSelectedWorkout(null) }} className="w-full text-left px-4 py-3 transition hover:bg-gray-50 flex items-center justify-between gap-3 border-b border-gray-50">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold text-gray-800 truncate">{program.name}</p>
                                      {isAssigned && <span className="shrink-0 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full">Assigned</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{workoutsInProgram.length} workout{workoutsInProgram.length !== 1 ? "s" : ""}</p>
                                  </div>
                                  <ChevronRight size={14} className={`text-gray-300 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                </button>
                                {isExpanded && (
                                  <div className="bg-gray-50/50">
                                    {workoutsInProgram.length === 0 ? (
                                      <div className="px-6 py-4 text-center"><p className="text-xs text-gray-400 italic">No workouts in this program yet</p></div>
                                    ) : (
                                      workoutsInProgram.map(pw => {
                                        const isSelected = modalSelectedWorkout?.id === pw.id
                                        const exercises = workoutExercises[pw.id] ?? []
                                        return (
                                          <button key={pw.id} onClick={() => setModalSelectedWorkout(pw)} className={`w-full text-left px-6 py-2.5 transition border-l-2 ${isSelected ? "bg-indigo-50 border-indigo-500" : "border-transparent hover:bg-white hover:border-gray-200"}`}>
                                            <p className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>{pw.name || `Day ${pw.day_number}`}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{exercises.length} exercise{exercises.length !== 1 ? "s" : ""}</p>
                                          </button>
                                        )
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  {!modalSelectedWorkout ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <div><Dumbbell size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-300">Select a workout to preview</p></div>
                    </div>
                  ) : (
                    <>
                      <div className="px-5 py-4 border-b border-gray-50 bg-indigo-50/50">
                        <p className="text-sm font-bold text-indigo-800">{modalSelectedWorkout.name || `Day ${modalSelectedWorkout.day_number}`}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">{allPrograms.find(p => p.id === modalSelectedWorkout.program_id)?.name ?? ""} · {(workoutExercises[modalSelectedWorkout.id] ?? []).length} exercise{(workoutExercises[modalSelectedWorkout.id] ?? []).length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 py-3">
                        {(workoutExercises[modalSelectedWorkout.id] ?? []).length === 0 ? (
                          <p className="text-sm text-gray-300 italic text-center py-6">No exercises in this workout</p>
                        ) : (
                          <div className="space-y-2">
                            {(workoutExercises[modalSelectedWorkout.id] ?? []).map((ex, i) => (
                              <div key={ex.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{ex.exercises?.name}</p>
                                  {ex.exercises?.muscle_group && <p className="text-xs text-gray-400">{ex.exercises.muscle_group}</p>}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 shrink-0">{ex.sets}×{ex.reps}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <div>{modalTargetDate && <p className="text-xs text-gray-500">Scheduling for <span className="font-semibold text-gray-700">{modalTargetDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</span></p>}</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setShowWorkoutModal(false); setModalSelectedWorkout(null); setExpandedProgramId(null); setModalSearch("") }} className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-100 transition">Cancel</button>
                  <button onClick={handleSelectWorkout} disabled={!modalSelectedWorkout || savingSchedule} className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">{savingSchedule ? "Saving..." : "Select"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Program Confirmation Modal */}
        {showRemoveProgramConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={e => { if (e.target === e.currentTarget) setShowRemoveProgramConfirm(false) }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4"><AlertCircle size={20} className="text-red-500" /></div>
                <h2 className="text-base font-bold text-gray-900">Remove Program?</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">This will remove <span className="font-semibold text-gray-700">{programAssignment?.programs?.name}</span> from {client.full_name}'s profile. Their scheduled workouts will also be cleared.</p>
              </div>
              <div className="flex items-center gap-3 px-6 pb-6 pt-2">
                <button onClick={() => setShowRemoveProgramConfirm(false)} disabled={removingProgram} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
                <button onClick={handleRemoveProgram} disabled={removingProgram} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">{removingProgram ? "Removing..." : "Remove Program"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Program Modal */}
        {showAssignProgramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={e => { if (e.target === e.currentTarget) { setShowAssignProgramModal(false); setSelectedProgramToAssign(null); setAssignProgramSearch("") } }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{programAssignment ? "Change Program" : "Assign Program"}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Select a program to assign to {client.full_name}</p>
                </div>
                <button onClick={() => { setShowAssignProgramModal(false); setSelectedProgramToAssign(null); setAssignProgramSearch("") }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  <input type="text" placeholder="Search programs..." value={assignProgramSearch} onChange={e => setAssignProgramSearch(e.target.value)} className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none" autoFocus />
                  {assignProgramSearch && <button onClick={() => setAssignProgramSearch("")} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {allPrograms.length === 0 ? (
                  <div className="px-4 py-8 text-center"><Dumbbell size={28} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No programs found</p><p className="text-xs text-gray-300 mt-1">Build a program in the Program Builder first</p></div>
                ) : (
                  allPrograms.filter(p => p.name?.toLowerCase().includes(assignProgramSearch.toLowerCase())).map(program => {
                    const isCurrentlyAssigned = programAssignment?.programs?.id === program.id
                    const isSelected = selectedProgramToAssign?.id === program.id
                    const workoutsInProgram = allProgramWorkouts.filter(pw => pw.program_id === program.id)
                    return (
                      <button key={program.id} onClick={() => setSelectedProgramToAssign(isSelected ? null : program)} disabled={isCurrentlyAssigned} className={`w-full text-left px-5 py-3.5 transition border-l-2 flex items-center justify-between gap-3 ${isCurrentlyAssigned ? "opacity-50 cursor-not-allowed border-transparent" : isSelected ? "bg-indigo-50 border-indigo-500" : "border-transparent hover:bg-gray-50 hover:border-gray-200"}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>{program.name}</p>
                            {isCurrentlyAssigned && <span className="shrink-0 text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full">Current</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{workoutsInProgram.length} workout{workoutsInProgram.length !== 1 ? "s" : ""}{program.description ? ` · ${program.description}` : ""}</p>
                        </div>
                        {isSelected && <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0"><CheckCircle2 size={12} className="text-white" /></div>}
                      </button>
                    )
                  })
                )}
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">{selectedProgramToAssign ? `Selected: ${selectedProgramToAssign.name}` : "No program selected"}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setShowAssignProgramModal(false); setSelectedProgramToAssign(null); setAssignProgramSearch("") }} className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-100 transition">Cancel</button>
                  <button onClick={handleAssignProgram} disabled={!selectedProgramToAssign || assigningProgram} className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">{assigningProgram ? "Assigning..." : "Assign Program"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-schedule Modal */}
        {showAutoScheduleModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowAutoScheduleModal(false) }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Auto-schedule Program</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Automatically fill the calendar from your program workouts</p>
                </div>
                <button onClick={() => setShowAutoScheduleModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* Program summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Dumbbell size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{programAssignment?.programs?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{programWorkouts.length} workout{programWorkouts.length !== 1 ? "s" : ""} to schedule</p>
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Start Date</label>
                  <input
                    type="date"
                    value={autoScheduleStartDate}
                    onChange={e => setAutoScheduleStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                {/* Days between sessions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Rest Days Between Sessions</label>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(n => (
                      <button
                        key={n}
                        onClick={() => setAutoScheduleRestDays(n)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${autoScheduleRestDays === n ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {n === 0 ? "None" : n === 1 ? "1 day" : "2 days"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {programWorkouts.length > 0 && autoScheduleStartDate ? (() => {
                      const totalDays = (programWorkouts.length - 1) * (1 + autoScheduleRestDays)
                      const endDate = new Date(autoScheduleStartDate + "T00:00:00")
                      endDate.setDate(endDate.getDate() + totalDays)
                      return `${programWorkouts.length} sessions ending ${endDate.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
                    })() : "Select a start date to see the schedule end date"}
                  </p>
                </div>

                {/* Preview */}
                {autoScheduleStartDate && programWorkouts.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Preview</label>
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
                      {programWorkouts.map((pw, i) => {
                        const d = new Date(autoScheduleStartDate + "T00:00:00")
                        d.setDate(d.getDate() + i * (1 + autoScheduleRestDays))
                        return (
                          <div key={pw.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">{i + 1}</div>
                              <span className="text-sm font-semibold text-gray-800">{pw.name || `Day ${pw.day_number}`}</span>
                            </div>
                            <span className="text-xs text-gray-400">{d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button onClick={() => setShowAutoScheduleModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button
                  onClick={handleAutoSchedule}
                  disabled={!autoScheduleStartDate || programWorkouts.length === 0 || autoScheduling}
                  className="flex-1 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {autoScheduling ? "Scheduling..." : `Schedule ${programWorkouts.length} Session${programWorkouts.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  function renderNutrition() {
    const todayStr = new Date().toISOString().split("T")[0]

    const filteredFoodLogs = foodLogs.filter(f => {
      const daysAgo = Math.floor((new Date() - new Date(f.logged_at)) / (1000 * 60 * 60 * 24))
      return daysAgo <= parseInt(nutritionPeriod)
    })

    const groupedByDate = filteredFoodLogs.reduce((acc, log) => {
      const dateStr = new Date(log.logged_at).toISOString().split("T")[0]
      if (!acc[dateStr]) acc[dateStr] = []
      acc[dateStr].push(log)
      return acc
    }, {})

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a))

    const dailyTotals = sortedDates.map(dateStr => {
      const logs = groupedByDate[dateStr]
      return {
        date: dateStr,
        calories: Math.round(logs.reduce((sum, l) => sum + (parseFloat(l.calories) || 0), 0)),
        protein:  Math.round(logs.reduce((sum, l) => sum + (parseFloat(l.protein_g) || 0), 0)),
        carbs:    Math.round(logs.reduce((sum, l) => sum + (parseFloat(l.carbs_g) || 0), 0)),
        fats:     Math.round(logs.reduce((sum, l) => sum + (parseFloat(l.fats_g) || 0), 0)),
      }
    })

    const todayFoodLogs = foodLogs.filter(f => new Date(f.logged_at).toISOString().split("T")[0] === todayStr)
    const todayCalories  = Math.round(todayFoodLogs.reduce((sum, l) => sum + (parseFloat(l.calories) || 0), 0))
    const todayProtein   = Math.round(todayFoodLogs.reduce((sum, l) => sum + (parseFloat(l.protein_g) || 0), 0))
    const todayCarbs     = Math.round(todayFoodLogs.reduce((sum, l) => sum + (parseFloat(l.carbs_g) || 0), 0))
    const todayFats      = Math.round(todayFoodLogs.reduce((sum, l) => sum + (parseFloat(l.fats_g) || 0), 0))

    const todayWaterLogs = waterLogs.filter(w => w.logged_date === todayStr)
    const todayWaterMl   = todayWaterLogs.reduce((sum, w) => sum + (w.amount_ml || 0), 0)
    const waterPct       = waterTarget > 0 ? Math.min(100, Math.round((todayWaterMl / waterTarget) * 100)) : 0

    const calTarget  = parseInt(calorieTarget) || 0
    const proTarget  = parseInt(proteinTarget) || 0
    const carbTarget = parseInt(carbsTarget) || 0
    const fatTarget  = parseInt(fatsTarget) || 0

    const calPct  = calTarget > 0  ? Math.min(100, Math.round((todayCalories / calTarget)  * 100)) : 0
    const proPct  = proTarget > 0  ? Math.min(100, Math.round((todayProtein  / proTarget)  * 100)) : 0
    const carbPct = carbTarget > 0 ? Math.min(100, Math.round((todayCarbs   / carbTarget) * 100)) : 0
    const fatPct  = fatTarget > 0  ? Math.min(100, Math.round((todayFats    / fatTarget)  * 100)) : 0

    const avgCalories = dailyTotals.length > 0
      ? Math.round(dailyTotals.reduce((sum, d) => sum + d.calories, 0) / dailyTotals.length)
      : 0

    const avgProtein = dailyTotals.length > 0
      ? Math.round(dailyTotals.reduce((sum, d) => sum + d.protein, 0) / dailyTotals.length)
      : 0

    const complianceDays = calTarget > 0
      ? dailyTotals.filter(d => d.calories >= calTarget * 0.9 && d.calories <= calTarget * 1.1).length
      : 0

    const complianceRate = dailyTotals.length > 0 && calTarget > 0
      ? Math.round((complianceDays / dailyTotals.length) * 100)
      : 0

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split("T")[0]
      const dayTotal = dailyTotals.find(dt => dt.date === dateStr)
      const isToday = dateStr === todayStr
      const hit = calTarget > 0 && dayTotal && dayTotal.calories >= calTarget * 0.9 && dayTotal.calories <= calTarget * 1.1
      const under = dayTotal && calTarget > 0 && dayTotal.calories < calTarget * 0.9
      const over = dayTotal && calTarget > 0 && dayTotal.calories > calTarget * 1.1
      return {
        dateStr,
        dayTotal,
        hit,
        under,
        over,
        isToday,
        dayName: d.toLocaleDateString("en-AU", { weekday: "short" }),
        dayNum: d.getDate(),
      }
    })

    const chartDates = [...dailyTotals].reverse().slice(-parseInt(nutritionPeriod))
    const maxCal = chartDates.length > 0 ? Math.max(...chartDates.map(d => d.calories), calTarget || 0) : 2000
    const minCal = chartDates.length > 0 ? Math.min(...chartDates.map(d => d.calories)) : 0
    const calRange = maxCal - minCal || 500
    const chartHeight = 120
    const chartWidth = 400

    function getChartX(index, total) {
      if (total <= 1) return chartWidth / 2
      return (index / (total - 1)) * chartWidth
    }

    function getChartY(calories) {
      const ratio = (calories - minCal) / calRange
      return chartHeight - (ratio * (chartHeight - 20)) - 10
    }

    const calPoints = chartDates.map((d, i) => ({
      x: getChartX(i, chartDates.length),
      y: getChartY(d.calories),
      calories: d.calories,
      date: d.date,
    }))

    const calSvgPath = calPoints.length > 1
      ? calPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : ""

    const calSvgFill = calPoints.length > 1
      ? `${calSvgPath} L ${calPoints[calPoints.length - 1].x} ${chartHeight} L ${calPoints[0].x} ${chartHeight} Z`
      : ""

    const MEAL_TYPE_COLOURS = {
      breakfast: "bg-amber-50 text-amber-700 border-amber-200",
      lunch:     "bg-blue-50 text-blue-700 border-blue-200",
      dinner:    "bg-indigo-50 text-indigo-700 border-indigo-200",
      snack:     "bg-emerald-50 text-emerald-700 border-emerald-200",
      other:     "bg-gray-100 text-gray-600 border-gray-200",
    }

    function MacroProgressBar({ label, current, target, colour, bgColour, unit = "g" }) {
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
      const over = target > 0 && current > target
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-black ${colour}`}>{current}{unit}</span>
              {target > 0 && <span className="text-xs text-gray-300">/ {target}{unit}</span>}
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-400" : bgColour}`}
              style={{ width: pct === 0 ? "2px" : `${pct}%` }}
            />
          </div>
          {target > 0 && (
            <span className={`text-[10px] font-medium ${over ? "text-red-500" : pct >= 90 ? "text-emerald-600" : "text-gray-400"}`}>
              {over ? `${current - target}${unit} over target` : pct >= 90 ? "On target ✓" : `${target - current}${unit} remaining`}
            </span>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-5">

        {/* ── TODAY'S SUMMARY CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Activity size={15} className="text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Today's Summary</span>
            </div>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
          <div className="px-6 py-5">
            {todayFoodLogs.length === 0 && todayWaterMl === 0 ? (
              <div className="flex items-center gap-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Utensils size={16} className="text-gray-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Nothing logged today yet</p>
                  <p className="text-xs text-gray-300 mt-0.5">Food and water entries will appear here once the client starts logging</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Calorie ring + macros */}
                <div className="flex items-start gap-6">
                  {/* Calorie circle */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke={calPct >= 100 ? "#f97316" : "#6366f1"}
                          strokeWidth="10"
                          strokeDasharray={`${calPct === 0 ? 1 : Math.min(100, calPct) * 2.51} 251`}
                          strokeLinecap="round"
                          opacity={calPct === 0 ? 0.2 : 1}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-gray-900 leading-none">{todayCalories}</span>
                        <span className="text-[10px] text-gray-400">kcal</span>
                      </div>
                    </div>
                    {calTarget > 0 && (
                      <span className="text-[10px] text-gray-400 mt-1">of {calTarget} kcal</span>
                    )}
                  </div>

                  {/* Macro progress bars */}
                  <div className="flex-1 flex flex-col gap-3">
                    <MacroProgressBar label="Protein" current={todayProtein} target={proTarget}  colour="text-red-500"    bgColour="bg-red-400"    unit="g" />
                    <MacroProgressBar label="Carbs"   current={todayCarbs}   target={carbTarget} colour="text-yellow-500" bgColour="bg-yellow-400" unit="g" />
                    <MacroProgressBar label="Fats"    current={todayFats}    target={fatTarget}  colour="text-blue-500"  bgColour="bg-blue-400"   unit="g" />
                  </div>
                </div>

                {/* Water progress bar */}
                <div className="pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets size={14} className="text-blue-400" />
                      <span className="text-xs font-semibold text-gray-600">Water</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-blue-500">{todayWaterMl >= 1000 ? `${(todayWaterMl / 1000).toFixed(1)}L` : `${todayWaterMl}ml`}</span>
                      {waterTarget > 0 && <span className="text-xs text-gray-300">/ {waterTarget >= 1000 ? `${(waterTarget / 1000).toFixed(1)}L` : `${waterTarget}ml`}</span>}
                    </div>
                  </div>
                  <div className="h-2.5 bg-blue-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ width: waterPct === 0 ? "2px" : `${waterPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-medium ${waterPct >= 100 ? "text-emerald-600" : "text-blue-400"}`}>
                      {waterPct >= 100 ? "Daily target reached ✓" : `${waterTarget - todayWaterMl}ml remaining`}
                    </span>
                    <span className="text-[10px] text-gray-300">{waterPct}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── DAILY TARGETS CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Target size={15} className="text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Daily Targets</span>
            </div>
            {!editingTargets ? (
              <button
                onClick={() => {
                  setEditingTargets(true)
                  setTargetMode("grams")
                  setProteinPct("")
                  setCarbsPct("")
                  setFatsPct("")
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
              >
                <Edit3 size={12} /> Edit Targets
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNutritionTargets}
                  disabled={savingTargets}
                  className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {savingTargets ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingTargets(false)
                    setTargetMode("grams")
                    setProteinPct("")
                    setCarbsPct("")
                    setFatsPct("")
                  }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="px-6 py-5">
            {editingTargets ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Input mode</span>
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => {
                        setTargetMode("grams")
                        setProteinPct("")
                        setCarbsPct("")
                        setFatsPct("")
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${targetMode === "grams" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Grams
                    </button>
                    <button
                      onClick={() => setTargetMode("percentages")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${targetMode === "percentages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Percentages
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Calories</label>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-[180px]">
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      value={calorieTarget}
                      onChange={e => {
                        setCalorieTarget(e.target.value)
                        if (targetMode === "percentages") {
                          const cals = parseFloat(e.target.value) || 0
                          const pPct = parseFloat(proteinPct) || 0
                          const cPct = parseFloat(carbsPct) || 0
                          const fPct = parseFloat(fatsPct) || 0
                          setProteinTarget(pPct > 0 ? String(Math.round((cals * (pPct / 100)) / 4)) : "")
                          setCarbsTarget(cPct > 0 ? String(Math.round((cals * (cPct / 100)) / 4)) : "")
                          setFatsTarget(fPct > 0 ? String(Math.round((cals * (fPct / 100)) / 9)) : "")
                        }
                      }}
                      className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none w-full"
                    />
                    <span className="text-xs text-gray-400 shrink-0">kcal</span>
                  </div>
                </div>

                {targetMode === "grams" ? (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Protein", value: proteinTarget, setter: setProteinTarget, unit: "g", placeholder: "e.g. 150" },
                      { label: "Carbs",   value: carbsTarget,   setter: setCarbsTarget,   unit: "g", placeholder: "e.g. 200" },
                      { label: "Fats",    value: fatsTarget,    setter: setFatsTarget,    unit: "g", placeholder: "e.g. 70"  },
                    ].map(m => (
                      <div key={m.label} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{m.label}</label>
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <input
                            type="number"
                            placeholder={m.placeholder}
                            value={m.value}
                            onChange={e => m.setter(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none w-full"
                          />
                          <span className="text-xs text-gray-400 shrink-0">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Protein", pct: proteinPct, setPct: setProteinPct, setGrams: setProteinTarget, kcalPerG: 4, colour: "text-red-500",    placeholder: "e.g. 30" },
                        { label: "Carbs",   pct: carbsPct,   setPct: setCarbsPct,   setGrams: setCarbsTarget,   kcalPerG: 4, colour: "text-yellow-500", placeholder: "e.g. 40" },
                        { label: "Fats",    pct: fatsPct,    setPct: setFatsPct,    setGrams: setFatsTarget,    kcalPerG: 9, colour: "text-blue-500",   placeholder: "e.g. 30" },
                      ].map(m => {
                        const cals = parseFloat(calorieTarget) || 0
                        const pctVal = parseFloat(m.pct) || 0
                        const grams = cals > 0 && pctVal > 0 ? Math.round((cals * (pctVal / 100)) / m.kcalPerG) : null
                        return (
                          <div key={m.label} className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{m.label}</label>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder={m.placeholder}
                                value={m.pct}
                                onChange={e => {
                                  const newPct = e.target.value
                                  m.setPct(newPct)
                                  const calsNow = parseFloat(calorieTarget) || 0
                                  const pctNow = parseFloat(newPct) || 0
                                  const gramsNow = calsNow > 0 && pctNow > 0 ? String(Math.round((calsNow * (pctNow / 100)) / m.kcalPerG)) : ""
                                  m.setGrams(gramsNow)
                                }}
                                className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none w-full"
                              />
                              <span className="text-xs text-gray-400 shrink-0">%</span>
                            </div>
                            {grams !== null ? (
                              <div className="flex items-center gap-1 px-1">
                                <span className={`text-sm font-black ${m.colour}`}>{grams}g</span>
                                <span className="text-xs text-gray-400">per day</span>
                              </div>
                            ) : (
                              <div className="px-1">
                                <span className="text-xs text-gray-300 italic">{calorieTarget ? "enter %" : "set calories first"}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const total = (parseFloat(proteinPct) || 0) + (parseFloat(carbsPct) || 0) + (parseFloat(fatsPct) || 0)
                      const over = total > 100
                      const exact = total === 100
                      return (
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${over ? "bg-red-50 border-red-200" : exact ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                          <span className={`text-xs font-semibold ${over ? "text-red-600" : exact ? "text-emerald-600" : "text-gray-500"}`}>Total: {total}%</span>
                          <span className={`text-xs font-medium ${over ? "text-red-500" : exact ? "text-emerald-500" : "text-gray-400"}`}>
                            {over ? "Exceeds 100% — adjust values" : exact ? "Perfect split ✓" : `${100 - total}% remaining`}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Water target input inside edit mode */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Water Target</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-[180px]">
                      <Droplets size={14} className="text-blue-400 shrink-0" />
                      <input
                        type="number"
                        placeholder="e.g. 2000"
                        value={waterTargetInput}
                        onChange={e => setWaterTargetInput(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none w-full"
                      />
                      <span className="text-xs text-gray-400 shrink-0">ml</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {parseInt(waterTargetInput) >= 1000 ? `= ${(parseInt(waterTargetInput) / 1000).toFixed(1)}L` : ""}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* DISPLAY MODE */
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Calories", value: calorieTarget, unit: "kcal", colour: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                    { label: "Protein",  value: proteinTarget, unit: "g",    colour: "text-red-500",    bg: "bg-red-50",    border: "border-red-100"    },
                    { label: "Carbs",    value: carbsTarget,   unit: "g",    colour: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100" },
                    { label: "Fats",     value: fatsTarget,    unit: "g",    colour: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
                  ].map(m => (
                    <div key={m.label} className={`${m.bg} border ${m.border} rounded-xl px-4 py-3 flex items-center justify-between`}>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{m.label}</p>
                        {m.value ? (
                          <p className={`text-xl font-black ${m.colour} mt-0.5`}>{m.value}<span className="text-xs font-medium text-gray-400 ml-1">{m.unit}</span></p>
                        ) : (
                          <p className="text-sm text-gray-300 italic mt-0.5">Not set</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Water target display */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-blue-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Water Target</p>
                      <p className="text-xl font-black text-blue-500 mt-0.5">
                        {waterTarget >= 1000 ? `${(waterTarget / 1000).toFixed(1)}L` : `${waterTarget}ml`}
                        <span className="text-xs font-medium text-gray-400 ml-1">per day</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── WATER TRACKING CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Droplets size={15} className="text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Water Intake</span>
              <span className="text-xs text-gray-400">— Today</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              waterPct >= 100 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              waterPct >= 50  ? "bg-blue-50 text-blue-600 border border-blue-200" :
              "bg-gray-100 text-gray-500 border border-gray-200"
            }`}>
              {todayWaterMl >= 1000 ? `${(todayWaterMl / 1000).toFixed(1)}L` : `${todayWaterMl}ml`} / {waterTarget >= 1000 ? `${(waterTarget / 1000).toFixed(1)}L` : `${waterTarget}ml`}
            </span>
          </div>
          <div className="px-6 py-5">
            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">{waterPct}% of daily target</span>
                {waterPct >= 100 && <span className="text-xs font-semibold text-emerald-600">Target reached ✓</span>}
              </div>
              <div className="h-3 bg-blue-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: waterPct === 0 ? "2px" : `${waterPct}%` }}
                />
              </div>
            </div>

            {/* Quick add buttons */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Add</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[150, 250, 330, 500, 750, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={async () => {
                      setSavingWater(true)
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        const { data: newLog, error } = await supabase
                          .from("water_logs")
                          .insert({ client_id: clientId, logged_by: user.id, amount_ml: amount, logged_date: todayStr })
                          .select()
                          .single()
                        if (error) throw error
                        setWaterLogs(prev => [newLog, ...prev])
                      } catch (e) { console.error(e) }
                      finally { setSavingWater(false) }
                    }}
                    disabled={savingWater}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    +{amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount input */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                <Droplets size={14} className="text-blue-400 shrink-0" />
                <input
                  type="number"
                  placeholder="Custom amount..."
                  value={newWaterAmount}
                  onChange={e => setNewWaterAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleLogWater() }}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setWaterUnit("ml")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${waterUnit === "ml" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  ml
                </button>
                <button
                  onClick={() => setWaterUnit("L")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${waterUnit === "L" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  L
                </button>
              </div>
              <button
                onClick={handleLogWater}
                disabled={savingWater || !newWaterAmount}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {savingWater ? "..." : "Log"}
              </button>
            </div>

            {/* Today's water log entries */}
            {todayWaterLogs.length > 0 && (
              <div className="border-t border-gray-50 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Today's Entries</p>
                <div className="space-y-1.5">
                  {todayWaterLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-blue-50/50 rounded-lg group">
                      <div className="flex items-center gap-2">
                        <Droplets size={12} className="text-blue-400" />
                        <span className="text-sm font-semibold text-blue-700">
                          {log.amount_ml >= 1000 ? `${(log.amount_ml / 1000).toFixed(1)}L` : `${log.amount_ml}ml`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteWaterLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── WEEKLY COMPLIANCE CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Weekly Compliance</span>
            </div>
            {calTarget > 0 && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                complianceRate >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                complianceRate >= 50 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                "bg-red-50 text-red-500 border border-red-200"
              }`}>
                {complianceRate}% compliance
              </span>
            )}
          </div>
          <div className="px-6 py-5">
            {calTarget === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 italic">Set a calorie target in Daily Targets above to track compliance</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-5">
                  {last7Days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{day.dayName}</span>
                      <span className={`text-xs font-bold ${day.isToday ? "text-indigo-600" : "text-gray-500"}`}>{day.dayNum}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        day.hit     ? "bg-emerald-500 border-emerald-500" :
                        day.over    ? "bg-red-100 border-red-300" :
                        day.under   ? "bg-amber-100 border-amber-300" :
                        day.isToday ? "bg-indigo-50 border-indigo-300 border-dashed" :
                        "bg-gray-100 border-gray-200"
                      }`}>
                        {day.hit ? (
                          <CheckCircle2 size={15} className="text-white" />
                        ) : day.dayTotal ? (
                          <span className="text-[10px] font-bold text-gray-600 leading-none">{day.dayTotal.calories}</span>
                        ) : day.isToday ? (
                          <span className="text-[10px] font-bold text-indigo-300">—</span>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </div>
                      {day.dayTotal ? (
                        <span className={`text-[10px] font-semibold ${
                          day.hit   ? "text-emerald-600" :
                          day.over  ? "text-red-500" :
                          "text-amber-500"
                        }`}>
                          {day.hit ? "On target" : day.over ? "Over" : "Low"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">{day.isToday ? "Today" : "—"}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-50">
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{avgCalories}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Avg kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{avgProtein}g</p>
                    <p className="text-xs text-gray-400 mt-0.5">Avg protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{complianceDays}/7</p>
                    <p className="text-xs text-gray-400 mt-0.5">Days on target</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-gray-900">{dailyTotals.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Days logged</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* ── CALORIE TREND CHART CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <TrendingUp size={15} className="text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Calorie Trend</span>
            </div>
            <select
              value={nutritionPeriod}
              onChange={e => setNutritionPeriod(e.target.value)}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="px-6 py-5">
            {calPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-gray-200" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No nutrition data yet</p>
                <p className="text-xs text-gray-300 mt-1">Data will appear here once the client starts logging food</p>
              </div>
            ) : (
              <div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-black text-gray-900">{calPoints[calPoints.length - 1]?.calories}<span className="text-sm font-medium text-gray-400 ml-1">kcal</span></span>
                    <span className="text-xs text-gray-400 ml-2">most recent day</span>
                  </div>
                  {calTarget > 0 && (
                    <span className="text-xs text-gray-400">Target: <span className="font-semibold text-gray-600">{calTarget} kcal</span></span>
                  )}
                </div>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: "120px" }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {calTarget > 0 && (
                    <line x1="0" y1={getChartY(calTarget)} x2={chartWidth} y2={getChartY(calTarget)} stroke="#f97316" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                  )}
                  {calSvgFill && <path d={calSvgFill} fill="url(#calGradient)" />}
                  {calSvgPath && <path d={calSvgPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                  {calPoints.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="5" fill="transparent" />
                      <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                      <title>{`${p.calories} kcal — ${new Date(p.date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" })}`}</title>
                    </g>
                  ))}
                </svg>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-300">{chartDates[0]?.date ? new Date(chartDates[0].date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" }) : ""}</span>
                  <span className="text-[10px] text-gray-300">{chartDates[chartDates.length - 1]?.date ? new Date(chartDates[chartDates.length - 1].date + "T00:00:00").toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit" }) : ""}</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── MEAL PLAN CARD ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Utensils size={15} className="text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Meal Plan</span>
            </div>
            <button onClick={() => navigate("/nutrition")} className="text-xs text-gray-400 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition font-medium">Change Plan</button>
          </div>
          <div className="px-6 py-5">
            {!mealPlan ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                <Utensils size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium text-sm">No meal plan assigned</p>
                <button onClick={() => navigate("/nutrition")} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">Assign Meal Plan</button>
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold text-gray-900">{mealPlan.name}</p>
                {mealPlan.description && <p className="text-sm text-gray-400 mt-1">{mealPlan.description}</p>}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Plan Targets</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "kcal",    value: mealPlan.daily_calories,         colour: "text-orange-500" },
                      { label: "protein", value: `${mealPlan.protein_target_g}g`, colour: "text-red-500"    },
                      { label: "carbs",   value: `${mealPlan.carbs_target_g}g`,   colour: "text-yellow-500" },
                      { label: "fats",    value: `${mealPlan.fats_target_g}g`,    colour: "text-blue-500"   },
                    ].map(m => (
                      <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                        <p className={`text-xl font-black ${m.colour}`}>{m.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── FOOD LOG FEED ── */}
        <SectionCard>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <FileText size={15} className="text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Food Log</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{filteredFoodLogs.length} entries</span>
          </div>
          <div className="px-6 py-4">
            {filteredFoodLogs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Utensils size={20} className="text-gray-200" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No food logged yet</p>
                <p className="text-xs text-gray-300 mt-1">Food entries will appear here once the client starts logging</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map(dateStr => {
                  const logs = groupedByDate[dateStr]
                  const dayTotal = dailyTotals.find(d => d.date === dateStr)
                  const isToday = dateStr === todayStr
                  const mealTypeOrder = ["breakfast", "lunch", "dinner", "snack", "other"]
                  const sortedLogs = [...logs].sort((a, b) => {
                    const aIdx = mealTypeOrder.indexOf(a.meal_type?.toLowerCase() ?? "other")
                    const bIdx = mealTypeOrder.indexOf(b.meal_type?.toLowerCase() ?? "other")
                    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
                  })
                  return (
                    <div key={dateStr}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            {isToday ? "Today" : new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
                          </span>
                          {calTarget > 0 && dayTotal && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              dayTotal.calories >= calTarget * 0.9 && dayTotal.calories <= calTarget * 1.1
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : dayTotal.calories < calTarget * 0.9
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : "bg-red-50 text-red-500 border border-red-200"
                            }`}>
                              {dayTotal.calories >= calTarget * 0.9 && dayTotal.calories <= calTarget * 1.1 ? "On target" :
                               dayTotal.calories < calTarget * 0.9 ? "Under target" : "Over target"}
                            </span>
                          )}
                        </div>
                        {dayTotal && (
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span><span className="font-semibold text-gray-700">{dayTotal.calories}</span> kcal</span>
                            <span><span className="font-semibold text-red-500">{dayTotal.protein}g</span> P</span>
                            <span><span className="font-semibold text-yellow-500">{dayTotal.carbs}g</span> C</span>
                            <span><span className="font-semibold text-blue-500">{dayTotal.fats}g</span> F</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {sortedLogs.map(log => {
                          const mealKey = log.meal_type?.toLowerCase() ?? "other"
                          const mealColour = MEAL_TYPE_COLOURS[mealKey] ?? MEAL_TYPE_COLOURS.other
                          return (
                            <div key={log.id} className="flex items-center gap-3 py-2.5 px-4 bg-gray-50/50 rounded-xl border border-gray-100">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 ${mealColour}`}>
                                {log.meal_type ?? "other"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{log.food_name}</p>
                                {log.brand && <p className="text-xs text-gray-400 truncate">{log.brand}</p>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
                                <span className="font-semibold text-gray-700">{Math.round(parseFloat(log.calories) || 0)} kcal</span>
                                <span className="hidden sm:block">P: <span className="text-red-500 font-medium">{Math.round(parseFloat(log.protein_g) || 0)}g</span></span>
                                <span className="hidden sm:block">C: <span className="text-yellow-500 font-medium">{Math.round(parseFloat(log.carbs_g) || 0)}g</span></span>
                                <span className="hidden sm:block">F: <span className="text-blue-500 font-medium">{Math.round(parseFloat(log.fats_g) || 0)}g</span></span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SectionCard>

      </div>
    )
  }

  function renderHabits() {
    const todayStr = new Date().toISOString().split("T")[0]

    const todayCompletedCount = habits.filter(habit =>
      habitLogs.some(l => l.habit_id === habit.id && l.completed_date === todayStr && l.completed)
    ).length

    const totalHabits = habits.length
    const completionPct = totalHabits > 0 ? Math.round((todayCompletedCount / totalHabits) * 100) : 0

    return (
      <div className="space-y-4">

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-800">Habit Tracking</h2>
          <button
            onClick={() => navigate("/habits")}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
          >
            <ChevronRight size={13} className="text-gray-400" /> Manage in Habit Tracker
          </button>
        </div>

        {totalHabits > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 bg-gray-50" style={{ borderBottom: "1px solid #d1d5db" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                  <Heart size={15} className="text-pink-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Today's Habits</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-black text-gray-900 leading-none">{todayCompletedCount}</span>
                    <span className="text-xl font-semibold text-gray-300 leading-none mb-0.5">/ {totalHabits}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">habits completed today</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-3xl font-black leading-none ${completionPct === 100 ? "text-emerald-500" : completionPct >= 50 ? "text-amber-500" : "text-red-400"}`}>{completionPct}%</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${completionPct === 100 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : completionPct >= 50 ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                    {completionPct === 100 ? "All done ✓" : completionPct >= 50 ? "In progress" : "Getting started"}
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: completionPct === 0 ? "0%" : `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {totalHabits === 0 && (
          <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white">
            <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <Heart size={24} className="text-pink-300" />
            </div>
            <p className="text-gray-700 font-semibold text-base">No habits assigned yet</p>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">Add habits for {client.full_name} to start tracking their daily consistency and streaks.</p>
            <button
              onClick={() => navigate("/habits")}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm"
            >
              Go to Habit Tracker
            </button>
          </div>
        )}

        {habits.map(habit => {
          const streak = calculateStreak(habit.id)
          const bestStreak = calculateBestStreak(habit.id)
          const weekCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed && l.completed_date >= getDateString(6)).length
          const monthCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed).length
          const completedToday = habitLogs.some(l => l.habit_id === habit.id && l.completed_date === todayStr && l.completed)

          return (
            <div key={habit.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
                    {habit.icon || "✅"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{habit.name}</p>
                      {completedToday && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Done today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{habit.frequency}</p>
                  </div>
                </div>
                {streak > 0 ? (
                  <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
                    <Flame size={13} /> {streak} day streak
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0">
                    No streak yet
                  </span>
                )}
              </div>

              <div className="px-6 py-5">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 14 days</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 14 }, (_, i) => {
                      const daysAgo = 13 - i
                      const dateStr = getDateString(daysAgo)
                      const isToday = daysAgo === 0
                      const completed = habitLogs.some(l => l.habit_id === habit.id && l.completed_date === dateStr && l.completed)
                      const dayLabel = new Date(dateStr + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                      return (
                        <div
                          key={dateStr}
                          title={`${dayLabel}${completed ? " — Completed" : " — Not completed"}`}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${completed ? "bg-emerald-500" : isToday ? "bg-white border-2 border-indigo-300 border-dashed" : "bg-gray-100"}`}
                        >
                          {completed && <CheckCircle2 size={13} className="text-white" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3" style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
                  <div className="" style={{ backgroundColor: "#e5e7eb", borderRadius: "12px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span className={`text-lg font-black ${habit.target_per_week && weekCount >= habit.target_per_week ? "text-emerald-600" : "text-gray-900"}`}>
                      {weekCount}{habit.target_per_week ? `/${habit.target_per_week}` : ""}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">This Week</span>
                  </div>
                  <div className="" style={{ backgroundColor: "#e5e7eb", borderRadius: "12px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span className="text-lg font-black text-gray-900">{monthCount}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">This Month</span>
                  </div>
                  <div className="" style={{ backgroundColor: "#e5e7eb", borderRadius: "12px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="flex items-center gap-0.5">
                      {streak > 0 && <Flame size={14} className="text-orange-400" />}
                      <span className="text-lg font-black text-gray-900">{streak}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">Streak</span>
                  </div>
                  <div className="" style={{ backgroundColor: "#e5e7eb", borderRadius: "12px", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span className="text-lg font-black text-gray-900">{bestStreak}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight">Best Ever</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

      </div>
    )
  }

  function renderCheckins() {
    const avgTraining = checkins.length > 0
      ? Math.round((checkins.reduce((sum, c) => sum + (c.training_score || 0), 0) / checkins.length) * 10) / 10
      : 0
    const avgEnergy = checkins.length > 0
      ? Math.round((checkins.reduce((sum, c) => sum + (c.energy_score || 0), 0) / checkins.length) * 10) / 10
      : 0
    const recentCheckins = checkins.slice(0, 4)
    const trend = recentCheckins.length >= 2
      ? recentCheckins[0].training_score - recentCheckins[recentCheckins.length - 1].training_score
      : 0

    return (
      <div className="space-y-4">

        {/* ── HEADER ROW ── */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-800">Check-in History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
            >
              <Send size={12} className="text-gray-400" /> {copied ? "Copied!" : "Send Check-in Link"}
            </button>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{checkins.length} total</span>
          </div>
        </div>

        {/* ── SUMMARY STATS CARD ── */}
        {checkins.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="flex flex-col items-center py-5 px-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avg Training</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-indigo-600 leading-none">{avgTraining}</span>
                  <span className="text-sm font-semibold text-gray-400 mb-0.5">/ 5</span>
                </div>
                <div className="flex gap-1.5 mt-2.5 max-w-[160px]">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-8 h-2.5 rounded-full ${n <= Math.round(avgTraining) ? "bg-indigo-500" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center py-5 px-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avg Energy</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-3xl font-black text-emerald-500 leading-none">{avgEnergy}</span>
                  <span className="text-sm font-semibold text-gray-400 mb-0.5">/ 5</span>
                </div>
                <div className="flex gap-1.5 mt-2.5 max-w-[160px]">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-8 h-2.5 rounded-full ${n <= Math.round(avgEnergy) ? "bg-emerald-500" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center py-5 px-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trend</span>
                <div className="flex items-end gap-1.5">
                  <span className={`text-3xl font-black leading-none ${trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}
                  </span>
                </div>
                <span className={`text-xs font-semibold mt-2.5 px-2.5 py-0.5 rounded-full ${
                  trend > 0 ? "bg-emerald-50 text-emerald-600" :
                  trend < 0 ? "bg-red-50 text-red-500" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {trend > 0 ? "Improving" : trend < 0 ? "Declining" : "Stable"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {checkins.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-indigo-300" />
            </div>
            <p className="text-gray-700 font-semibold text-base">No check-ins yet</p>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">Send {client.full_name} their check-in link to get started.</p>
            <button
              onClick={handleCopyLink}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-sm"
            >
              {copied ? "Copied!" : "Copy Check-in Link"}
            </button>
          </div>
        )}

        {/* ── CHECK-IN CARDS ── */}
        {checkins.map((ci, index) => {
          const blockerText = ci.blocker?.trim() ?? ""
          const hasBlocker = blockerText.length > 0 && !["none", "n/a", "na", "nil", "no", "-", "nothing"].includes(blockerText.toLowerCase())
          const trainingColour = ci.training_score >= 4 ? "text-emerald-600" : ci.training_score >= 3 ? "text-amber-500" : "text-red-400"
          const energyColour = ci.energy_score >= 4 ? "text-emerald-600" : ci.energy_score >= 3 ? "text-amber-500" : "text-red-400"
          const trainingBg = ci.training_score >= 4 ? "bg-emerald-500" : ci.training_score >= 3 ? "bg-amber-400" : "bg-red-400"
          const energyBg = ci.energy_score >= 4 ? "bg-emerald-500" : ci.energy_score >= 3 ? "bg-amber-400" : "bg-red-400"

          return (
            <div key={ci.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{formatDateLong(ci.submitted_at)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(ci.submitted_at)}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Check-in #{checkins.length - index}
                </span>
              </div>

              {/* Scores */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4 mb-5">

                  {/* Training Score */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Training</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-black leading-none ${trainingColour}`}>{ci.training_score}</span>
                      <span className="text-xs text-gray-400 font-medium">out of 5</span>
                    </div>
                    <div className="flex gap-1.5 max-w-[160px]">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-8 h-2.5 rounded-full ${n <= ci.training_score ? trainingBg : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold mt-2 text-gray-400">
                      {ci.training_score >= 4 ? "Great week" : ci.training_score >= 3 ? "Solid effort" : ci.training_score >= 2 ? "Struggled" : "Very tough week"}
                    </p>
                  </div>

                  {/* Energy Score */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Energy</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-black leading-none ${energyColour}`}>{ci.energy_score}</span>
                      <span className="text-xs text-gray-400 font-medium">out of 5</span>
                    </div>
                    <div className="flex gap-1.5 max-w-[160px]">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-8 h-2.5 rounded-full ${n <= ci.energy_score ? energyBg : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold mt-2 text-gray-400">
                      {ci.energy_score >= 4 ? "High energy" : ci.energy_score >= 3 ? "Feeling okay" : ci.energy_score >= 2 ? "Low energy" : "Exhausted"}
                    </p>
                  </div>
                </div>

                {/* Blockers */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Blockers / Notes</p>
                  {hasBlocker ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-900 leading-relaxed">{ci.blocker}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <p className="text-sm text-emerald-700 font-medium">Nothing to report — all clear</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        })}

      </div>
    )
  }

  function renderNotes() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-800">PT Notes</h2>
          <button
            onClick={() => setShowNoteForm(true)}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus size={15} /> Add Note
          </button>
        </div>

        {showNoteForm && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <textarea
              rows={4}
              autoFocus
              placeholder={`Add a note about ${client.full_name}...`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSaveNote}
                disabled={!notes.trim()}
                className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
              <button
                onClick={() => { setShowNoteForm(false); setNotes("") }}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {savedNotes.length === 0 && !showNoteForm ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-base">No notes yet</p>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">Add your first note about {client.full_name} — visible only to you.</p>
            <button
              onClick={() => setShowNoteForm(true)}
              className="mt-5 bg-black hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Add First Note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedNotes.map((note, i) => (
              <div key={note.id ?? i} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{formatDate(note.created_at)}</span>
                  <span className="text-xs text-gray-300">{timeAgo(note.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabContent = {
    overview:  renderOverview,
    training:  renderTraining,
    nutrition: renderNutrition,
    habits:    renderHabits,
    checkins:  renderCheckins,
    notes:     renderNotes,
  }

  // ── MAIN RENDER ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      <div className="bg-white border-b border-gray-100 shadow-sm">

        {/* Row 1: back + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap px-8 py-4 border-b border-gray-50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Send size={13} />
              {copied ? "Copied!" : "Send Check-in"}
            </button>
            <button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-sm">
              <Edit3 size={13} /> Edit Client
            </button>
          </div>
        </div>

        {/* Row 2: identity */}
        <div className="flex items-center gap-5 px-8 py-6">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg font-bold shrink-0 select-none">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{client.full_name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                {status}
              </span>
            </div>

            <div className="flex items-center gap-5 mt-1.5 flex-wrap">
              {client.goal && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Target size={13} className="text-gray-300" /> {client.goal}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Phone size={13} className="text-gray-300" /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={13} className="text-gray-300" /> {client.email}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Calendar size={13} className="text-gray-300" /> Joined {formatMonthYear(client.created_at)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                <Clock size={13} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">{checkins.length > 0 ? timeAgo(checkins[0].submitted_at) : "Never"}</span>
                <span className="text-xs text-gray-400">last check-in</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="text-sm font-semibold text-gray-800">{checkins.length}</span>
                <span className="text-xs text-gray-400">check-ins</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                <Heart size={13} className="text-pink-400" />
                <span className="text-sm font-semibold text-gray-800">{habits.length}</span>
                <span className="text-xs text-gray-400">habits</span>
              </div>
              {programAssignment && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                  <Dumbbell size={13} className="text-blue-400" />
                  <span className="text-sm font-semibold text-gray-800 max-w-[160px] truncate">{programAssignment.programs?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: tabs */}
        <div className="flex gap-1 border-t border-gray-50 overflow-x-auto scrollbar-hide px-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3.5 text-sm font-medium -mb-px transition border-b-2 ${
                activeTab === tab.id
                  ? "text-indigo-600 font-semibold border-indigo-600"
                  : "text-gray-400 hover:text-gray-600 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 py-8">
        {tabContent[activeTab]?.()}
      </div>

    </div>
  )
}
