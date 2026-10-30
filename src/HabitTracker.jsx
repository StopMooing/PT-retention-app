import { useState, useEffect } from "react";
import { Plus, Check, ChevronRight, Target, Trash2, Flame, Users } from "lucide-react";
import { supabase } from "./supabase";
import { PageTitle, SectionLabel, Card, Button, Chip, Ring, Avatar, Sheet, EmptyState, Field } from "./ui";
import { Loading, Toast, BackLink, TextArea, FilterChips, ConfirmRemove } from "./tools/kit";
import { useToast } from "./tools/useToast";
import { toLocalDateStr, daysAgoStr, habitStreak, habitBestStreak } from "./tools/dates";

// The client's own habit icons. Emoji are fine here: they are the client's, not labels.
const ICONS = ["✅", "💧", "🏃", "💪", "🥗", "😴", "🧘", "📚", "🚫", "🎯", "⚡", "🌅", "💊"];
const FREQUENCIES = [
  { label: "Daily",           value: "Daily",         target: 7 },
  { label: "5 times a week",  value: "5x per week",   target: 5 },
  { label: "4 times a week",  value: "4x per week",   target: 4 },
  { label: "3 times a week",  value: "3x per week",   target: 3 },
  { label: "Weekdays",        value: "Weekdays only", target: 5 },
];
const EMPTY_HABIT = { name: "", description: "", icon: "✅", frequency: "Daily", target_per_week: 7 };

function frequencyLabel(value) {
  return FREQUENCIES.find(f => f.value.toLowerCase() === String(value ?? "").toLowerCase())?.label ?? value ?? "";
}

export default function HabitTracker() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [clientHabitCounts, setClientHabitCounts] = useState({})
  const [clientCompletedToday, setClientCompletedToday] = useState({})
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabit, setNewHabit] = useState(EMPTY_HABIT)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [habitsLoading, setHabitsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [formError, setFormError] = useState("")
  const [toast, showToast] = useToast()

  // Local dates, never toISOString(): that is UTC and lags a day every Adelaide morning.
  const today = toLocalDateStr()
  const thirtyDaysAgoStr = daysAgoStr(30)

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
        const todayStr = toLocalDateStr()

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
            .eq('completed_date', todayStr)
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
          const { data: logsData } = await supabase
            .from('habit_logs')
            .select('*')
            .in('habit_id', fetchedHabits.map(h => h.id))
            .gte('completed_date', daysAgoStr(30))

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
      const { data } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habits.map(h => h.id))
        .gte('completed_date', thirtyDaysAgoStr)
      setHabitLogs(data ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  function openAddHabit() {
    setNewHabit(EMPTY_HABIT)
    setFormError("")
    setShowAddHabit(true)
  }

  async function handleSaveHabit(e) {
    e?.preventDefault()
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

      showToast(`${newHabit.name.trim()} added`)
      setShowAddHabit(false)
      setNewHabit(EMPTY_HABIT)

      const { data: updated } = await supabase
        .from('habits')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      const updatedHabits = updated ?? []
      setHabits(updatedHabits)
      setClientHabitCounts(prev => ({ ...prev, [selectedClient.id]: updatedHabits.length }))
    } catch (err) {
      console.error(err)
      showToast("Could not add the habit. Please try again.", "bad")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleComplete(habit) {
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

  async function handleDeleteHabit(habit) {
    try {
      await supabase.from('habits').update({ is_active: false }).eq('id', habit.id)
      const updatedHabits = habits.filter(h => h.id !== habit.id)
      setHabits(updatedHabits)
      setClientHabitCounts(prev => ({ ...prev, [selectedClient.id]: updatedHabits.length }))
      showToast(`${habit.name} removed`)
    } catch (e) {
      console.error(e)
      showToast("Could not remove the habit.", "bad")
    }
  }

  const totalActiveHabits = Object.values(clientHabitCounts).reduce((a, b) => a + b, 0)
  const totalCompletedToday = Object.values(clientCompletedToday).reduce((a, b) => a + b, 0)
  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = daysAgoStr(6 - i)
    const d = new Date(dateStr + 'T00:00:00')
    return { dateStr, letter: d.toLocaleDateString('en-AU', { weekday: 'narrow' }), num: d.getDate(), isToday: i === 6 }
  })
  const isDone = (habitId, dateStr) => habitLogs.some(l => l.habit_id === habitId && l.completed_date === dateStr && l.completed)

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageTitle title="Habits" />
        <Loading />
      </div>
    )
  }

  // ─── Client list (left on desktop, its own screen on a phone) ───

  const clientList = (
    <div className={`${selectedClient ? 'hidden md:flex' : 'flex'} flex-col gap-3 min-w-0`}>
      {totalActiveHabits > 0 && (
        <Card className="flex items-center gap-4">
          <Ring value={totalCompletedToday / totalActiveHabits} size={56} stroke={6}>
            <span className="text-xs font-bold text-ink tabular-nums">{Math.round((totalCompletedToday / totalActiveHabits) * 100)}%</span>
          </Ring>
          <div className="min-w-0">
            <p className="font-display text-[28px] leading-tight text-ink tabular-nums">
              {totalCompletedToday}<span className="font-sans text-sm font-semibold text-muted"> of {totalActiveHabits}</span>
            </p>
            <p className="text-[13px] text-muted">habits done today, all clients</p>
          </div>
        </Card>
      )}

      <SectionLabel className="mt-2">Clients</SectionLabel>
      {clients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No clients yet" body="Add a client from the dashboard, then give them a habit or two." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-line">
            {clients.map(client => {
              const habitCount = clientHabitCounts[client.id] || 0
              const completedToday = clientCompletedToday[client.id] || 0
              const isSelected = selectedClient?.id === client.id
              return (
                <li key={client.id}>
                  <button
                    onClick={() => setSelectedClient(client)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full min-h-[64px] px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${isSelected ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
                  >
                    <Avatar name={client.full_name ?? ''} src={client.profile_photo_url} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink truncate">{client.full_name}</span>
                      <span className="block text-[13px] text-muted">
                        {habitCount > 0 ? `${completedToday} of ${habitCount} done today` : 'No habits yet'}
                      </span>
                    </span>
                    {habitCount > 0 && (
                      <Ring value={completedToday / habitCount} size={28} stroke={4} />
                    )}
                    <ChevronRight size={18} className="text-faint shrink-0" />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )

  // ─── One client's habits ───

  const detail = !selectedClient ? (
    <div className="hidden md:block">
      <Card>
        <EmptyState icon={Target} title="Choose a client" body="Pick someone on the left to see their week and add habits." />
      </Card>
    </div>
  ) : (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="md:hidden -mb-2">
        <BackLink onClick={() => setSelectedClient(null)}>All clients</BackLink>
      </div>
      <div className="flex items-center gap-3">
        <Avatar name={selectedClient.full_name ?? ''} src={selectedClient.profile_photo_url} size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold text-ink truncate">{selectedClient.full_name}</h2>
          <p className="text-[13px] text-muted">
            {habits.length > 0
              ? `${habits.filter(h => isDone(h.id, today)).length} of ${habits.length} done today`
              : 'No habits yet'}
          </p>
        </div>
        {habits.length > 0 && <Button size="sm" onClick={openAddHabit}><Plus size={16} /> Add habit</Button>}
      </div>

      {habitsLoading ? (
        <Loading />
      ) : habits.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No habits yet"
            body={`Small daily wins keep ${selectedClient.full_name?.split(' ')[0] ?? 'clients'} coming back. Start with one.`}
            action={<Button onClick={openAddHabit}><Plus size={18} /> Add habit</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Weekly grid: one row per habit, last 7 days. Today's cell can be ticked. */}
          <div>
            <SectionLabel>Last 7 days</SectionLabel>
            <Card padded={false} className="px-3 sm:px-4 py-3">
              <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,32px)] sm:grid-cols-[minmax(0,1fr)_repeat(7,40px)] gap-x-1 sm:gap-x-2 gap-y-2 items-center">
                <span />
                {days.map(d => (
                  <span key={d.dateStr} className={`flex flex-col items-center text-[11px] leading-tight ${d.isToday ? 'text-accent font-bold' : 'text-muted'}`}>
                    <span>{d.letter}</span>
                    <span className="tabular-nums">{d.num}</span>
                  </span>
                ))}
                {habits.map(habit => (
                  <HabitGridRow key={habit.id} habit={habit} days={days} isDone={isDone} onToggleToday={() => handleToggleComplete(habit)} />
                ))}
              </div>
              <p className="text-[12px] text-faint mt-3 px-1">Tap today's circle to tick a habit off for your client.</p>
            </Card>
          </div>

          <div>
            <SectionLabel>Habits</SectionLabel>
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-line">
                {habits.map(habit => {
                  const streak = habitStreak(habitLogs, habit.id, today)
                  const best = habitBestStreak(habitLogs, habit.id)
                  const weekCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed && l.completed_date >= daysAgoStr(6)).length
                  const monthCount = habitLogs.filter(l => l.habit_id === habit.id && l.completed).length
                  const target = habit.target_per_week || 7
                  return (
                    <li key={habit.id} className="px-4 py-3 flex items-start gap-3">
                      <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-lg shrink-0">
                        {habit.icon || '✅'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-ink truncate">{habit.name}</p>
                        <p className="text-[13px] text-muted">{frequencyLabel(habit.frequency)}{habit.description ? ` · ${habit.description}` : ''}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Chip tone={weekCount >= target ? 'accent' : 'neutral'}>{weekCount} of {target} this week</Chip>
                          {streak > 0 && <Chip tone="accent"><Flame size={12} /> {streak} day streak</Chip>}
                          {best > 1 && <Chip>Best {best} days</Chip>}
                          <Chip>{monthCount} in 30 days</Chip>
                        </div>
                      </div>
                      <ConfirmRemove icon={Trash2} label={`Remove ${habit.name}`} onConfirm={() => handleDeleteHabit(habit)} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Habits" />
      <div className="grid gap-5 md:grid-cols-[320px_minmax(0,1fr)] items-start">
        {clientList}
        {detail}
      </div>

      <Sheet
        open={showAddHabit}
        onClose={() => setShowAddHabit(false)}
        title={selectedClient ? `New habit for ${selectedClient.full_name?.split(' ')[0] ?? 'client'}` : 'New habit'}
        footer={
          <Button type="submit" form="new-habit-form" size="lg" block disabled={saving}>
            {saving ? 'Adding…' : 'Add habit'}
          </Button>
        }
      >
        <form id="new-habit-form" onSubmit={handleSaveHabit} className="flex flex-col gap-5">
          <div>
            <Field
              label="Habit" autoFocus placeholder="e.g. Drink 3L of water"
              value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
            />
            {formError && <p className="text-sm text-bad mt-1.5">{formError}</p>}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-1.5">How often</p>
            <FilterChips
              className="flex-wrap overflow-visible"
              options={FREQUENCIES.map(f => ({ value: f.value, label: f.label }))}
              value={newHabit.frequency}
              onChange={v => setNewHabit({ ...newHabit, frequency: v, target_per_week: FREQUENCIES.find(f => f.value === v).target })}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink mb-1.5">Icon</p>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={newHabit.icon === emoji}
                  onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors border ${
                    newHabit.icon === emoji ? 'bg-accent-soft border-accent' : 'bg-surface-2 border-transparent hover:border-line-strong'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <TextArea
            label="Note for your client (optional)" rows={2} placeholder="What does this habit involve?"
            value={newHabit.description} onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
          />
        </form>
      </Sheet>

      <Toast toast={toast} />
    </div>
  )
}

function HabitGridRow({ habit, days, isDone, onToggleToday }) {
  return (
    <>
      <span className="flex items-center gap-2 min-w-0 pr-1">
        <span className="text-base shrink-0">{habit.icon || '✅'}</span>
        <span className="text-[14px] font-semibold text-ink truncate">{habit.name}</span>
      </span>
      {days.map(d => {
        const done = isDone(habit.id, d.dateStr)
        const cell = `w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center transition-colors`
        if (d.isToday) {
          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={onToggleToday}
              aria-pressed={done}
              aria-label={`${habit.name} today: ${done ? 'done, tap to undo' : 'tap to tick off'}`}
              className={`${cell} ${done ? 'bg-accent text-on-accent' : 'border-2 border-dashed border-accent text-accent hover:bg-accent-soft'}`}
            >
              {done && <Check size={16} strokeWidth={3} />}
            </button>
          )
        }
        return (
          <span key={d.dateStr} title={d.dateStr} className={`${cell} ${done ? 'bg-accent text-on-accent' : 'bg-surface-2'}`}>
            {done && <Check size={14} strokeWidth={3} />}
          </span>
        )
      })}
    </>
  )
}
