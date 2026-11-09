// A coach's own video for an exercise: an uploaded clip or a YouTube link (exercise_media).
// The coach adds it on the Exercises page; their clients see it when they open that
// exercise in a workout. Row level security returns only the coach's own videos to the
// coach, and only their coach's videos to a client.
import { supabase } from '../supabase'

const BUCKET = 'exercise-videos'
export const MAX_VIDEO_MB = 50

// The 11-character id from any YouTube link (watch, youtu.be, shorts, embed), or null.
export function youtubeId(url) {
  const m = String(url || '').trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export async function fetchExerciseVideo(exerciseId) {
  const { data, error } = await supabase.from('exercise_media').select('id, kind, url, coach_id').eq('exercise_id', exerciseId).limit(1)
  if (error) { console.error('Exercise video load error:', error); return null }
  return data?.[0] ?? null
}

// Which exercises this coach has a video for: Set of exercise ids.
export async function fetchMyVideoIds(coachId) {
  const { data, error } = await supabase.from('exercise_media').select('exercise_id').eq('coach_id', coachId)
  if (error) { console.error('Exercise videos load error:', error); return new Set() }
  return new Set((data ?? []).map((r) => r.exercise_id))
}

function storagePath(url) {
  const marker = `/object/public/${BUCKET}/`
  const i = String(url).indexOf(marker)
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null
}

async function removeFileOf(media) {
  if (media?.kind !== 'upload') return
  const path = storagePath(media.url)
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

async function save(coachId, exerciseId, kind, url, previous) {
  const { data, error } = await supabase.from('exercise_media')
    .upsert({ coach_id: coachId, exercise_id: exerciseId, kind, url, created_at: new Date().toISOString() }, { onConflict: 'coach_id,exercise_id' })
    .select('id, kind, url, coach_id').single()
  if (error) return { error }
  if (previous && previous.url !== url) await removeFileOf(previous)
  return { media: data }
}

export async function saveYoutubeVideo(coachId, exerciseId, link, previous) {
  const id = youtubeId(link)
  if (!id) return { error: new Error('not_youtube') }
  return save(coachId, exerciseId, 'youtube', `https://www.youtube.com/watch?v=${id}`, previous)
}

export async function uploadExerciseVideo(coachId, exerciseId, file, previous) {
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return { error: new Error('too_big') }
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
  const path = `${coachId}/${exerciseId}-${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'video/mp4', upsert: false })
  if (upErr) return { error: upErr }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return save(coachId, exerciseId, 'upload', data.publicUrl, previous)
}

export async function removeExerciseVideo(media) {
  const { error } = await supabase.from('exercise_media').delete().eq('id', media.id)
  if (error) return { error }
  await removeFileOf(media)
  return {}
}
