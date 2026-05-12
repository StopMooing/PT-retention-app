import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Plus, X, Flame, CheckCircle2, Circle, ChevronRight, Target, Calendar, TrendingUp, Award, Trash2, Edit3, MoreHorizontal } from "lucide-react";

export default function HabitTracker() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [clientHabitCounts, setClientHabitCounts] = useState({})
  const [clientCompletedToday, setClientCompletedToday] = useState({})
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: "", description: "", icon: "✅", frequency: "Daily", target_per_week: 7 })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [habitsLoading, setHabitsLoading] = useState(false)
  const [openMenuHabitId, setOpenMenuHabitId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [formError, setFormError] = useState("")

  const getTodayString = () => new Date().toISOString().split('T')[0]

  const getDateString = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  const calculateStreak = (habitId) => {
    const dates = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .map(l => l.completed_date)
      .sort()
      .reverse()

    let streak = 0
    let checkDate = getTodayString()
    for (const date of dates) {
      if (date === checkDate) {
        streak++
        const d = new Date(checkDate + 'T00:00:00')
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split('T')[0]
      } else if (date < checkDate) {
        break
      }
    }
    return streak
  }

  const calculateBestStreak = (habitId) => {
    const dates = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .map(l => l.completed_date)
      .sort()

    if (dates.length === 0) return 0
    let best = 1
    let current = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00')
      const curr = new Date(dates[i] + 'T00:00:00')
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        current++
        if (current > best) best = current
      } else if (diff > 1) {
        current = 1
      }
    }
    return best
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenMenuHabitId(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Auto-dismiss banners
  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(""), 3000)
    return () => clearTimeout(t)
  }, [successMsg])

  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(""), 5000)
    return () => clearTimeout(t)
  }, [errorMsg])

  // Fetch clients + summary data on mount
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUser(user)

        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('pt_id', user.id)
          .order('created_at', { ascending: false })

        const clientList = clientData ?? []
        setClients(clientList)
        if (clientList.length === 0) { setLoading(false); return }

        const clientIds = clientList.map(c => c.id)
        const today = new Date().toISOString().split('T')[0]

        const { data: habitsData } = await supabase
          .from('habits')
          .select('id, client_id')
          .in('client_id', clientIds)
          .eq('is_active', true)

        const habitCounts = {}
        const allHabitIds = []
        ;(habitsData ?? []).forEach(h => {
          habitCounts[h.client_id] = (habitCounts[h.client_id] || 0) + 1
          allHabitIds.push(h.id)
        })
        setClientHabitCounts(habitCounts)

        if (allHabitIds.length > 0) {
          const { data: todayLogs } = await supabase
            .from('habit_logs')
            .select('habit_id, client_id, completed')
            .in('habit_id', allHabitIds)
            .eq('completed_date', today)
            .eq('completed', true)

          const completedCounts = {}
          ;(todayLogs ?? []).forEach(l => {
            completedCounts[l.client_id] = (completedCounts[l.client_id] || 0) + 1
          })
          setClientCompletedToday(completedCounts)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Fetch habits + logs when selected client changes
  useEffect(() => {
    if (!selectedClient) return
    async function fetchHabits() {
      setHabitsLoading(true)
      try {
        const { data: habitsData } = await supabase
          .from('habits')
          .select('*')
          .eq('client_id', selectedClient.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        const fetchedHabits = habitsData ?? []
        setHabits(fetchedHabits)

        if (fetchedHabits.length > 0) {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

          const { data: logsData } = await supabase
            .from('habit_logs')
            .select('*')
            .in('habit_id', fetchedHabits.map(h => h.id))
            .gte('completed_date', thirtyDaysAgoStr)

          setHabitLogs(logsData ?? [])
        } else {
          setHabitLogs([])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setHabitsLoading(false)
      }
    }
    fetchHabits()
  }, [selectedClient])

  async function refetchLogs() {
    if (habits.length === 0) return
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habits.map(h => h.id))
        .gte('completed_date', thirtyDaysAgo.toISOString().split('T')[0])
      setHabitLogs(data ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSaveHabit() {
    if (!newHabit.name.trim()) { setFormError("Please enter a habit name"); return }
    setFormError("")
    setSaving(true)
    try {
      const { error } = await supabase.from('habits').insert({
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        icon: newHabit.icon,
        frequency: newHabit.frequency,
        target_per_week: newHabit.target_per_week,
        client_id: selectedClient.id,
        created_by: currentUser.id,
        is_active: true,
      })
      if (error) throw error

      setSuccessMsg("Habit created successfully!")
      setShowAddHabit(false)
      setNewHabit({ name: "", description: "", icon: "✅", frequency: "Daily", target_per_week: 7 })

      const { data: updated } = await supabase
        .from('habits')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      const updatedHabits = updated ?? []
      setHabits(updatedHabits)
      setClientHabitCounts(prev => ({ ...prev, [selectedClient.id]: updatedHabits.length }))
    } catch (e) {
      console.error(e)
      setErrorMsg("Failed to create habit. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleComplete(habit) {
    const today = getTodayString()
    const existingLog = habitLogs.find(l => l.habit_id === habit.id && l.completed_date === today && l.completed)

    // Optimistic update
    if (existingLog) {
      setHabitLogs(prev => prev.filter(l => !(l.habit_id === habit.id && l.completed_date === today)))
      setClientCompletedToday(prev => ({
        ...prev,
        [selectedClient.id]: Math.max(0, (prev[selectedClient.id] || 0) - 1),
      }))
    } else {
      setHabitLogs(prev => [
        ...prev,
        { id: `optimistic-${Date.now()}`, habit_id: habit.id, client_id: selectedClient.id, completed_date: today, completed: true },
      ])
      setClientCompletedToday(prev => ({
        ...prev,
        [selectedClient.id]: (prev[selectedClient.id] || 0) + 1,
      }))
    }

    try {
      if (existingLog) {
        await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('completed_date', today)
      } else {
        await supabase.from('habit_logs').insert({
          habit_id: habit.id,
          client_id: selectedClient.id,
          completed_date: today,
          completed: true,
        })
      }
      await refetchLogs()
    } catch (e) {
      console.error(e)
      await refetchLogs()
    }
  }

  async function handleDeleteHabit(habitId) {
    try {
      await supabase.from('habits').update({ is_active: false }).eq('id', habitId)
      const updatedHabits = habits.filter(h => h.id !== habitId)
      setHabits(updatedHabits)
      setClientHabitCounts(prev => ({ ...prev, [selectedClient.id]: updatedHabits.length }))
    } catch (e) {
      console.error(e)
      setErrorMsg("Failed to delete habit.")
    }
  }

  // Summary stats
  const totalActiveHabits = Object.values(clientHabitCounts).reduce((a, b) => a + b, 0)
  const totalCompletedToday = Object.values(clientCompletedToday).reduce((a, b) => a + b, 0)
  const todayRate = totalActiveHabits > 0 ? Math.round((totalCompletedToday / totalActiveHabits) * 100) : 0
  const bestStreakOverall = habits.length > 0 ? Math.max(...habits.map(h => calculateStreak(h.id))) : 0

  const today = getTodayString()
  const selectedHabitCount = clientHabitCounts[selectedClient?.id] || 0
  const selectedCompletedToday = clientCompletedToday[selectedClient?.id] || 0

  const ICONS = ["💧", "🏃", "💪", "🥗", "😴", "🧘", "📚", "🚫", "🎯", "⚡", "🌅", "💊"]
  const FREQUENCIES = [
    { label: "Daily",        value: "Daily",        target: 7 },
    { label: "5x per week",  value: "5x per week",  target: 5 },
    { label: "4x per week",  value: "4x per week",  target: 4 },
    { label: "3x per week",  value: "3x per week",  target: 3 },
    { label: "Weekdays only",value: "Weekdays only", target: 5 },
  ]

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <Target size={16} className="text-green-500" />
            <span className="text-lg font-black text-gray-900">{totalActiveHabits}</span>
            <span className="text-xs text-gray-500 ml-1">Active Habits</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-lg font-black text-gray-900">{totalCompletedToday}</span>
            <span className="text-xs text-gray-500 ml-1">Completed Today</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-lg font-black text-gray-900">{bestStreakOverall}</span>
            <span className="text-xs text-gray-500 ml-1">Best Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-lg font-black text-gray-900">{todayRate}%</span>
            <span className="text-xs text-gray-500 ml-1">Today's Rate</span>
          </div>
        </div>
      </div>

      {/* ── Panels ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left panel — client list ── */}
        <div className="w-[300px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Clients</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{clients.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {clients.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">No clients yet</p>
                <p className="text-xs text-gray-300 mt-1">Add clients from the Dashboard</p>
              </div>
            ) : (
              clients.map(client => {
                const habitCount = clientHabitCounts[client.id] || 0
                const completedToday = clientCompletedToday[client.id] || 0
                const isSelected = selectedClient?.id === client.id
                const allDone = habitCount > 0 && completedToday === habitCount

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-l-4 border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {client.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 truncate">{client.full_name}</span>
                      </div>
                      {habitCount > 0 ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {completedToday}/{habitCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic shrink-0 ml-2">No habits</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: habitCount > 0 ? `${(completedToday / habitCount) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {habitCount > 0 ? Math.round((completedToday / habitCount) * 100) : 0}%
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!selectedClient ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-sm shadow-sm">
                <Target size={40} className="text-green-300 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold text-lg">Select a client</p>
                <p className="text-sm text-gray-400 mt-2">Choose a client from the left to view and manage their habits</p>
              </div>
            </div>
          ) : (
            <>
              {/* Client habit header */}
              <div className="bg-white border-b border-gray-200 px-6 py-5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {selectedClient.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">{selectedClient.full_name}</span>
                      <span className="text-sm text-gray-500">{selectedHabitCount} active habits · {selectedCompletedToday} completed today</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddHabit(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    <Plus size={16} />
                    Add Habit
                  </button>
                </div>

                {/* Week overview */}
                <div className="mt-4 flex items-center gap-3">
                  {Array.from({ length: 7 }, (_, i) => {
                    const daysAgo = 6 - i
                    const dateStr = getDateString(daysAgo)
                    const d = new Date(dateStr + 'T00:00:00')
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNum = d.getDate()
                    const isToday = daysAgo === 0

                    const completedCount = habitLogs.filter(l => l.completed_date === dateStr && l.completed).length
                    const totalHabits = habits.length
                    const allCompleted = totalHabits > 0 && completedCount >= totalHabits
                    const someCompleted = completedCount > 0 && !allCompleted

                    return (
                      <div key={dateStr} className="flex flex-col items-center gap-1.5">
                        <span className={`text-xs uppercase ${isToday ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {dayName}
                        </span>
                        <span className={`text-xs font-medium ${isToday ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                          {dayNum}
                        </span>
                        <div className={`w-6 h-6 rounded-full ${
                          allCompleted ? 'bg-green-500' :
                          someCompleted ? 'bg-green-200' :
                          'bg-gray-100 border border-gray-200'
                        }`} />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">

                {/* Banners */}
                {successMsg && (
                  <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-200 text-green-800 text-sm rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 size={16} className="text-green-600 mr-2 shrink-0" />
                      {successMsg}
                    </div>
                    <button onClick={() => setSuccessMsg("")} className="ml-2 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}
                {errorMsg && (
                  <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-200 text-red-800 text-sm rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                      <X size={16} className="text-red-600 mr-2 shrink-0" />
                      {errorMsg}
                    </div>
                    <button onClick={() => setErrorMsg("")} className="ml-2 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Add habit form */}
                {showAddHabit && (
                  <div className="mx-6 mt-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-base font-bold text-gray-900">New Habit</span>
                      <button
                        onClick={() => { setShowAddHabit(false); setFormError("") }}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Habit Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Drink 3L of water"
                          value={newHabit.name}
                          onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                        />
                        {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description (optional)</label>
                        <textarea
                          rows={2}
                          placeholder="What does this habit involve?"
                          value={newHabit.description}
                          onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Icon</label>
                        <div className="flex flex-wrap gap-2">
                          {ICONS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-pointer transition ${
                                newHabit.icon === emoji
                                  ? 'bg-green-100 border-2 border-green-500'
                                  : 'bg-gray-50 border border-gray-200 hover:border-green-300'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Frequency</label>
                        <div className="flex flex-wrap gap-2">
                          {FREQUENCIES.map(f => (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => setNewHabit({ ...newHabit, frequency: f.value, target_per_week: f.target })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                newHabit.frequency === f.value
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={handleSaveHabit}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Creating…' : 'Create Habit'}
                        </button>
                        <button
                          onClick={() => { setShowAddHabit(false); setFormError("") }}
                          disabled={saving}
                          className="px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Habits list */}
                <div className="px-6 py-5 space-y-3">
                  {habitsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                    </div>
                  ) : habits.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                      <Target size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No habits assigned yet</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                        Click + Add Habit to create the first habit for {selectedClient.full_name}
                      </p>
                      <button
                        onClick={() => setShowAddHabit(true)}
                        className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                      >
                        <Plus size={16} />
                        Add First Habit
                      </button>
                    </div>
                  ) : (
                    habits.map(habit => {
                      const streak = calculateStreak(habit.id)
                      const bestStreak = calculateBestStreak(habit.id)
                      const todayCompleted = habitLogs.some(
                        l => l.habit_id === habit.id && l.completed_date === today && l.completed
                      )
                      const weekCount = habitLogs.filter(
                        l => l.habit_id === habit.id && l.completed && l.completed_date >= getDateString(6)
                      ).length
                      const monthCount = habitLogs.filter(
                        l => l.habit_id === habit.id && l.completed
                      ).length

                      return (
                        <div
                          key={habit.id}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Card header */}
                          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">
                                {habit.icon || '✅'}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-base font-bold text-gray-900">{habit.name}</span>
                                <span className="text-xs text-gray-400 mt-0.5">{habit.frequency}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {streak > 0 ? (
                                <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                  <Flame size={12} />
                                  {streak} day streak
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No streak yet</span>
                              )}
                              <div className="relative">
                                <button
                                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuHabitId(openMenuHabitId === habit.id ? null : habit.id)
                                  }}
                                >
                                  <MoreHorizontal size={16} className="text-gray-400" />
                                </button>
                                {openMenuHabitId === habit.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[128px]">
                                    <button
                                      className="w-full text-sm text-gray-700 px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                                      onClick={(e) => { e.stopPropagation(); setOpenMenuHabitId(null) }}
                                    >
                                      <Edit3 size={14} />
                                      Edit
                                    </button>
                                    <button
                                      className="w-full text-sm text-red-600 px-4 py-2 hover:bg-red-50 flex items-center gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteHabit(habit.id)
                                        setOpenMenuHabitId(null)
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="px-5 py-4">
                            {/* Today toggle */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-semibold text-gray-700">Today</span>
                              {todayCompleted ? (
                                <button
                                  onClick={() => handleToggleComplete(habit)}
                                  className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition hover:bg-green-700"
                                >
                                  <CheckCircle2 size={16} />
                                  Completed!
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleComplete(habit)}
                                  className="flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl transition hover:bg-green-50 hover:text-green-600 hover:border-green-300 border border-gray-200"
                                >
                                  <Circle size={16} />
                                  Mark Complete
                                </button>
                              )}
                            </div>

                            {/* Last 7 days */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-400 mr-1">Last 7 days</span>
                              {Array.from({ length: 7 }, (_, i) => {
                                const daysAgo = 6 - i
                                const dateStr = getDateString(daysAgo)
                                const d = new Date(dateStr + 'T00:00:00')
                                const dayLetter = d.toLocaleDateString('en-US', { weekday: 'short' })[0]
                                const isToday = daysAgo === 0
                                const completed = habitLogs.some(
                                  l => l.habit_id === habit.id && l.completed_date === dateStr && l.completed
                                )
                                return (
                                  <div key={dateStr} className="flex flex-col items-center gap-1" title={dateStr}>
                                    <span className="text-[10px] text-gray-400">{dayLetter}</span>
                                    {completed ? (
                                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle2 size={12} className="text-white" />
                                      </div>
                                    ) : isToday ? (
                                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-green-400 border-dashed" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-100" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* Stats row */}
                            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4">
                              <div className="flex flex-col items-center">
                                <span className={`text-lg font-black ${weekCount >= habit.target_per_week ? 'text-green-600' : 'text-gray-900'}`}>
                                  {weekCount}/{habit.target_per_week}
                                </span>
                                <span className="text-xs text-gray-400 mt-0.5 text-center">This Week</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-black text-gray-900">{monthCount}</span>
                                <span className="text-xs text-gray-400 mt-0.5 text-center">This Month</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-black text-gray-900">{bestStreak}</span>
                                <span className="text-xs text-gray-400 mt-0.5 text-center">Best Streak</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
