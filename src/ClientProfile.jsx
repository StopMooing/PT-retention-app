import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { ArrowLeft, User, Mail, Phone, Target, Calendar, Activity, CheckCircle2, Clock, Dumbbell, Utensils, Heart, MessageSquare, FileText, TrendingUp, Flame, Award, Edit3, Send, Plus, ChevronRight, AlertCircle, Circle } from "lucide-react";

const TABS = [
  { id: "overview",  label: "Overview"   },
  { id: "training",  label: "Training"   },
  { id: "nutrition", label: "Nutrition"  },
  { id: "habits",    label: "Habits"     },
  { id: "checkins",  label: "Check-ins"  },
  { id: "notes",     label: "Notes"      },
]

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

function statusBadgeClass(status) {
  switch (status) {
    case "Engaged":     return "bg-green-100 text-green-700 border border-green-200"
    case "Drifting":    return "bg-yellow-100 text-yellow-700 border border-yellow-200"
    case "At Risk":     return "bg-red-100 text-red-700 border border-red-200"
    default:            return "bg-gray-100 text-gray-600 border border-gray-200"
  }
}

function ScoreDots({ score }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`w-4 h-4 rounded-sm ${n <= score ? "bg-gray-800" : "bg-gray-100"}`} />
      ))}
    </div>
  )
}

export default function ClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [client, setClient]                   = useState(null)
  const [checkins, setCheckins]               = useState([])
  const [programAssignment, setProgramAssignment] = useState(null)
  const [habits, setHabits]                   = useState([])
  const [habitLogs, setHabitLogs]             = useState([])
  const [mealPlan, setMealPlan]               = useState(null)
  const [workoutLogs, setWorkoutLogs]         = useState([])
  const [activeTab, setActiveTab]             = useState("overview")
  const [loading, setLoading]                 = useState(true)
  const [notes, setNotes]                     = useState("")
  const [showNoteForm, setShowNoteForm]       = useState(false)
  const [savedNotes, setSavedNotes]           = useState([])
  const [copied, setCopied]                   = useState(false)

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
        const [clientRes, checkinsRes, programRes, habitsRes, mealPlanRes, workoutRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", clientId).single(),
          supabase.from("checkins").select("*").eq("client_id", clientId).order("submitted_at", { ascending: false }),
          supabase.from("program_assignments").select("*, programs(*)").eq("client_id", clientId).eq("is_active", true).limit(1),
          supabase.from("habits").select("*").eq("client_id", clientId).eq("is_active", true),
          supabase.from("meal_plans").select("*").eq("client_id", clientId).eq("is_active", true).limit(1),
          supabase.from("workout_logs").select("*").eq("client_id", clientId).order("logged_at", { ascending: false }).limit(10),
        ])

        setClient(clientRes.data)
        setCheckins(checkinsRes.data ?? [])
        setProgramAssignment(programRes.data?.[0] ?? null)
        const fetchedHabits = habitsRes.data ?? []
        setHabits(fetchedHabits)
        setMealPlan(mealPlanRes.data?.[0] ?? null)
        setWorkoutLogs(workoutRes.data ?? [])

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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-semibold">Client not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm text-green-600 hover:underline">Go back</button>
        </div>
      </div>
    )
  }

  const status = computeStatus(checkins)
  const today = new Date().toISOString().split("T")[0]

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/checkin/${clientId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSaveNote() {
    if (!notes.trim()) return
    setSavedNotes(prev => [{ text: notes.trim(), createdAt: new Date().toISOString() }, ...prev])
    setNotes("")
    setShowNoteForm(false)
  }

  // ── Tab content renderers ──────────────────────────────────────

  function renderOverview() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent check-ins */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle2 size={18} className="text-green-500 mr-2" />
              <span className="text-base font-bold text-gray-900">Recent Check-ins</span>
            </div>
            <button onClick={() => setActiveTab("checkins")} className="text-sm text-green-600 hover:text-green-700 font-medium">View all</button>
          </div>
          {checkins.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No check-ins yet</p>
          ) : (
            <div className="space-y-1">
              {checkins.slice(0, 3).map((ci, i) => (
                <div key={ci.id} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(ci.submitted_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(ci.submitted_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500">Training <span className="font-bold text-gray-800">{ci.training_score}/5</span></span>
                    <span className="text-xs text-gray-500">Energy <span className="font-bold text-gray-800">{ci.energy_score}/5</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active program */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <Dumbbell size={18} className="text-blue-500 mr-2" />
            <span className="text-base font-bold text-gray-900">Active Program</span>
          </div>
          {!programAssignment ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 italic mb-3">No program assigned</p>
              <button
                onClick={() => navigate("/program-builder")}
                className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl transition"
              >
                Assign Program
              </button>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-gray-900">{programAssignment.programs?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Started {formatDate(programAssignment.start_date)}</p>
              <button
                onClick={() => navigate("/program-builder")}
                className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                View Program <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Habit summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Heart size={18} className="text-pink-500 mr-2" />
              <span className="text-base font-bold text-gray-900">Habits</span>
            </div>
            <button onClick={() => setActiveTab("habits")} className="text-sm text-green-600 hover:text-green-700 font-medium">Manage</button>
          </div>
          {habits.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">No habits assigned yet</p>
          ) : (
            <div className="space-y-1">
              {habits.map(habit => {
                const completedToday = habitLogs.some(l => l.habit_id === habit.id && l.completed_date === today && l.completed)
                return (
                  <div key={habit.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon || "✅"}</span>
                      <span className="text-sm font-medium text-gray-900">{habit.name}</span>
                    </div>
                    {completedToday
                      ? <CheckCircle2 size={16} className="text-green-500" />
                      : <Circle size={16} className="text-gray-300" />
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <Utensils size={18} className="text-orange-500 mr-2" />
            <span className="text-base font-bold text-gray-900">Nutrition</span>
          </div>
          {!mealPlan ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 italic mb-3">No meal plan assigned</p>
              <button
                onClick={() => navigate("/nutrition")}
                className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl transition"
              >
                Assign Plan
              </button>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-gray-900">{mealPlan.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{mealPlan.daily_calories} kcal/day</p>
              <div className="flex gap-3 mt-3">
                {[
                  { label: "protein", value: `${mealPlan.protein_target_g}g`, colour: "text-red-500" },
                  { label: "carbs",   value: `${mealPlan.carbs_target_g}g`,   colour: "text-yellow-500" },
                  { label: "fats",    value: `${mealPlan.fats_target_g}g`,    colour: "text-blue-500"   },
                ].map(m => (
                  <div key={m.label} className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2 flex-1">
                    <span className={`text-sm font-bold ${m.colour}`}>{m.value}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderTraining() {
    return (
      <div className="space-y-6">
        {/* Assigned program */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <Dumbbell size={20} className="text-blue-500 mr-2" />
              <span className="text-lg font-bold text-gray-900">Assigned Program</span>
            </div>
            <button
              onClick={() => navigate("/program-builder")}
              className="text-sm text-gray-500 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
            >
              Change Program
            </button>
          </div>
          {!programAssignment ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Dumbbell size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No program assigned</p>
              <button
                onClick={() => navigate("/program-builder")}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                Assign Program
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xl font-black text-gray-900">{programAssignment.programs?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Started {formatDate(programAssignment.start_date)}</p>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-900">
                    {Math.floor((new Date() - new Date(programAssignment.start_date)) / 86400000)} days active
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-sm font-bold text-green-700">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workout history */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Workout History</h3>
          {workoutLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm italic">No workouts logged yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {workoutLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(log.logged_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.logged_at)}</p>
                  </div>
                  {log.completed ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Circle size={16} className="text-gray-300" />
                      <span className="text-xs text-gray-400">Incomplete</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderNutrition() {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center">
              <Utensils size={20} className="text-orange-500 mr-2" />
              <span className="text-lg font-bold text-gray-900">Meal Plan</span>
            </div>
            <button
              onClick={() => navigate("/nutrition")}
              className="text-sm text-gray-500 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
            >
              Change Plan
            </button>
          </div>
          {!mealPlan ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Utensils size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No meal plan assigned</p>
              <button
                onClick={() => navigate("/nutrition")}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                Assign Meal Plan
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xl font-black text-gray-900">{mealPlan.name}</p>
              {mealPlan.description && <p className="text-sm text-gray-500 mt-1">{mealPlan.description}</p>}
              <div className="mt-5">
                <p className="text-sm font-bold text-gray-700 mb-3">Daily Targets</p>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "kcal",    value: mealPlan.daily_calories,    colour: "text-orange-500" },
                    { label: "protein", value: `${mealPlan.protein_target_g}g`, colour: "text-red-500"    },
                    { label: "carbs",   value: `${mealPlan.carbs_target_g}g`,   colour: "text-yellow-500" },
                    { label: "fats",    value: `${mealPlan.fats_target_g}g`,    colour: "text-blue-500"   },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-black ${m.colour}`}>{m.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderHabits() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Habit Tracking</h2>
          <button
            onClick={() => navigate("/habits")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            <Heart size={14} />
            Manage Habits
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <Heart size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No habits assigned yet</p>
            <button
              onClick={() => navigate("/habits")}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              Go to Habit Tracker
            </button>
          </div>
        ) : (
          habits.map(habit => {
            const streak = calculateStreak(habit.id)
            const bestStreak = calculateBestStreak(habit.id)
            const weekCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed && l.completed_date >= getDateString(6)).length
            const monthCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed).length

            return (
              <div key={habit.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon || "✅"}</span>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-gray-900">{habit.name}</span>
                      <span className="text-xs text-gray-400">{habit.frequency}</span>
                    </div>
                  </div>
                  {streak > 0 ? (
                    <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Flame size={14} className="text-orange-500" />
                      {streak} day streak
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No streak</span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">Last 14 days</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: 14 }, (_, i) => {
                      const daysAgo = 13 - i
                      const dateStr = getDateString(daysAgo)
                      const isToday = daysAgo === 0
                      const completed = habitLogs.some(l => l.habit_id === habit.id && l.completed_date === dateStr && l.completed)
                      return (
                        <div
                          key={dateStr}
                          title={dateStr}
                          className={`w-5 h-5 rounded-full ${
                            completed ? "bg-green-500" :
                            isToday ? "bg-gray-100 border-2 border-green-400 border-dashed" :
                            "bg-gray-100"
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-black ${weekCount >= habit.target_per_week ? "text-green-600" : "text-gray-900"}`}>
                      {weekCount}/{habit.target_per_week}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">This Week</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-gray-900">{monthCount}</span>
                    <span className="text-xs text-gray-400 mt-0.5">This Month</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-gray-900">{bestStreak}</span>
                    <span className="text-xs text-gray-400 mt-0.5">Best Streak</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  function renderCheckins() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Check-in History</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{checkins.length} total</span>
        </div>

        {checkins.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <CheckCircle2 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No check-ins yet</p>
            <button
              onClick={handleCopyLink}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              {copied ? "Copied!" : "Copy Check-in Link"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {checkins.map((ci, index) => (
              <div key={ci.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-gray-900">{formatDateLong(ci.submitted_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(ci.submitted_at)}</p>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    Check-in #{index + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Training Score</p>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <ScoreDots score={ci.training_score} />
                      <span className="text-sm text-gray-600 font-medium">{ci.training_score}/5</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Energy Score</p>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <ScoreDots score={ci.energy_score} />
                      <span className="text-sm text-gray-600 font-medium">{ci.energy_score}/5</span>
                    </div>
                  </div>
                  {ci.blocker ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Blockers / Notes</p>
                      <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">{ci.blocker}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No blockers reported</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderNotes() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">PT Notes</h2>
          <button
            onClick={() => setShowNoteForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            <Plus size={16} />
            Add Note
          </button>
        </div>

        {showNoteForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <textarea
              rows={4}
              placeholder="Add a note about this client..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSaveNote}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                Save Note
              </button>
              <button
                onClick={() => { setShowNoteForm(false); setNotes("") }}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {savedNotes.length === 0 && !showNoteForm ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notes yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first note about {client.full_name}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedNotes.map((note, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-2">{formatDate(note.createdAt)} · {timeAgo(note.createdAt)}</p>
                <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
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

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Profile header */}
      <div className="bg-white border-b border-gray-200">

        {/* Row 1 — back + actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition">
              <Send size={14} />
              Send Check-in
            </button>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm">
              <Edit3 size={14} />
              Edit Client
            </button>
          </div>
        </div>

        {/* Row 2 — client identity */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-green-600 flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-sm">
              {client.full_name?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{client.full_name}</h1>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusBadgeClass(status)}`}>
                  {status}
                </span>
              </div>

              <div className="flex items-center gap-6 mt-2 flex-wrap">
                {client.goal && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Target size={14} className="text-gray-400" />
                    {client.goal}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail size={14} className="text-gray-400" />
                    {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Phone size={14} className="text-gray-400" />
                    {client.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar size={14} className="text-gray-400" />
                  Joined {formatMonthYear(client.created_at)}
                </span>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-900">
                    {checkins.length > 0 ? timeAgo(checkins[0].submitted_at) : "Never"}
                  </span>
                  <span className="text-xs text-gray-400 ml-0.5">Last Check-in</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-sm font-bold text-gray-900">{checkins.length}</span>
                  <span className="text-xs text-gray-400">Check-ins</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Heart size={14} className="text-pink-500" />
                  <span className="text-sm font-bold text-gray-900">{habits.length}</span>
                  <span className="text-xs text-gray-400">Habits</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Dumbbell size={14} className="text-blue-500" />
                  <span className="text-sm font-bold text-gray-900 truncate max-w-32">
                    {programAssignment ? programAssignment.programs?.name : "None"}
                  </span>
                  <span className="text-xs text-gray-400">Program</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex px-6 border-t border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === tab.id
                  ? "text-green-600 font-semibold border-green-600"
                  : "text-gray-500 hover:text-gray-700 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {tabContent[activeTab]?.()}
      </div>
    </div>
  )
}
