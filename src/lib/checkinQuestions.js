// A coach's own weekly check-in questions, asked after the built-in ones. The client's
// answers are saved on the check-in itself as [{ q, kind, a }], so changing or removing a
// question later never changes a past check-in.
import { supabase } from '../supabase'

export const MAX_QUESTIONS = 5
export const BUILT_IN = ['How did training go? (1 to 5)', 'How was your energy? (1 to 5)', 'Anything getting in the way?']
export const KINDS = [{ value: 'text', label: 'Written answer' }, { value: 'scale', label: '1 to 5' }]

const COLS = 'id, coach_id, question, kind, position, created_at'

export async function fetchQuestions(coachId) {
  if (!coachId) return []
  const { data, error } = await supabase.from('checkin_questions').select(COLS).eq('coach_id', coachId).order('position').order('created_at')
  if (error) throw error
  return data ?? []
}

export async function addQuestion(coachId, question, kind, position) {
  const q = question.trim().slice(0, 200)
  if (!q) return { error: 'empty' }
  const { data, error } = await supabase.from('checkin_questions').insert({ coach_id: coachId, question: q, kind, position }).select(COLS).single()
  return error ? { error } : { row: data }
}

export async function removeQuestion(id) {
  const { data, error } = await supabase.from('checkin_questions').delete().eq('id', id).select('id')
  return error || !data?.length ? { error: error ?? new Error('no row deleted') } : {}
}

// The answered questions only, ready to save on the check-in (null when none).
export function toAnswers(questions, answers) {
  const out = questions
    .map((q) => {
      const a = answers[q.id]
      if (q.kind === 'scale') return a >= 1 && a <= 5 ? { q: q.question, kind: 'scale', a } : null
      const t = String(a ?? '').trim().slice(0, 1000)
      return t ? { q: q.question, kind: 'text', a: t } : null
    })
    .filter(Boolean)
  return out.length ? out : null
}

// Answers saved on a check-in, safe to render.
export function answersOf(checkin) {
  return Array.isArray(checkin?.answers) ? checkin.answers.filter((x) => x && x.q && x.a != null && x.a !== '') : []
}
