// Start date and training days for putting a program on the calendar. Used by the client's
// Start program sheet and the coach's assign, change program and fill schedule sheets.
// Controlled: the parent keeps startDate and trainingDays and checks planReady().
import { Field } from '../ui'
import { toLocalDateStr, addDays } from '../client/dates.js'
import { isoWeekday, defaultStartDate, requiredDays, planSummary, planReady } from './schedule.js'

const cx = (...c) => c.filter(Boolean).join(' ')
const WEEKDAYS = [[1, 'Mon', 'Monday'], [2, 'Tue', 'Tuesday'], [3, 'Wed', 'Wednesday'], [4, 'Thu', 'Thursday'], [5, 'Fri', 'Friday'], [6, 'Sat', 'Saturday'], [7, 'Sun', 'Sunday']]
const pill = (on) => cx('h-9 px-3.5 rounded-full text-sm font-bold transition-colors', on ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink hover:brightness-95')

export default function StartPlanFields({ dayCount, weeks, startDate, onStartDate, trainingDays, onTrainingDays, today = toLocalDateStr() }) {
  const need = requiredDays(dayCount)
  const nextMonday = isoWeekday(today) === 1 ? addDays(today, 7) : defaultStartDate(today)
  const quick = [['Today', today], ['Tomorrow', addDays(today, 1)], ['Next Monday', nextMonday]]
    .filter(([, d], i, all) => all.findIndex(([, x]) => x === d) === i)
  const picked = trainingDays.length
  const ready = planReady({ dayCount, startDate, trainingDays, today })

  function toggle(n) {
    onTrainingDays(trainingDays.includes(n) ? trainingDays.filter((d) => d !== n) : [...trainingDays, n].sort((a, b) => a - b))
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink mb-2">Start date</p>
        <div className="flex flex-wrap gap-2 mb-2.5">
          {quick.map(([label, d]) => (
            <button key={label} type="button" aria-pressed={startDate === d} onClick={() => onStartDate(d)} className={pill(startDate === d)}>{label}</button>
          ))}
        </div>
        <Field type="date" aria-label="Start date" min={today} value={startDate} onChange={(e) => e.target.value && onStartDate(e.target.value)} />
        {startDate && startDate < today && <p className="text-[13px] text-warn mt-1.5">Pick today or a later day.</p>}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="text-sm font-semibold text-ink">Training days</p>
          <p className={cx('text-[13px] tabular-nums', picked === need ? 'text-muted' : 'text-warn font-semibold')}>
            {picked === need ? `${need} ${need === 1 ? 'day' : 'days'} a week` : `Pick ${need} ${need === 1 ? 'day' : 'days'} (${picked} picked)`}
          </p>
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Training days">
          {WEEKDAYS.map(([n, short, long]) => {
            const on = trainingDays.includes(n)
            return (
              <button
                key={n}
                type="button"
                aria-pressed={on}
                aria-label={long}
                onClick={() => toggle(n)}
                className={cx('h-11 rounded-full text-[13px] font-bold transition-colors', on ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink')}
              >
                {short}
              </button>
            )
          })}
        </div>
      </div>

      {ready && (
        <p className="text-[15px] font-semibold text-ink bg-accent-soft rounded-[14px] px-4 py-3 tabular-nums">
          {planSummary({ dayCount, weeks, startDate })}
        </p>
      )}
    </div>
  )
}
