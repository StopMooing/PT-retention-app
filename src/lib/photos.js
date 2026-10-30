// Progress photos live in the private "progress-photos" bucket. The app never shows a
// public link: it asks Supabase for short-lived signed links (1 hour) instead.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export const PHOTO_BUCKET = 'progress-photos'
const MARKER = /\/object\/(?:public|sign|authenticated)\/progress-photos\//

// Storage path for a progress photo row's photo_url. New rows store the bare path
// ("<uid>/progress/123.jpg"); older rows hold a full public URL, so take the part after
// "/object/public/progress-photos/". Returns null for anything that is not in the bucket.
export function photoPath(photoUrl) {
  if (!photoUrl) return null
  const m = photoUrl.match(MARKER)
  if (m) return decodeURIComponent(photoUrl.slice(m.index + m[0].length).split('?')[0])
  if (/^[a-z]+:/i.test(photoUrl)) return null
  return photoUrl.replace(/^\/+/, '')
}

// { [photo.id]: signedUrl } for a list of progress_photos rows. Rows still loading or
// that fail are simply missing from the map.
export function usePhotoUrls(photos) {
  // A string key, so the effect reruns only when the photos really change.
  const key = JSON.stringify((photos ?? []).map((p) => [p.id, photoPath(p.photo_url)]).filter(([, path]) => path))
  const [state, setState] = useState({ key: '', urls: {} })

  useEffect(() => {
    const list = JSON.parse(key)
    if (list.length === 0) return
    let cancelled = false
    supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list.map(([, path]) => path), 3600)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('Signed photo links error:', error); return }
        const urls = {}
        ;(data ?? []).forEach((d, i) => { if (d?.signedUrl) urls[list[i][0]] = d.signedUrl })
        setState({ key, urls })
      })
      .catch((e) => console.error('Signed photo links exception:', e))
    return () => { cancelled = true }
  }, [key])

  return state.key === key ? state.urls : {}
}
