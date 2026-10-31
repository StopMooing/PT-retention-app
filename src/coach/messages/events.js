// Small in-page signals so the nav badge, inbox, dashboard and profile agree on unread
// messages without each opening its own live connection.
//   READ:     a thread was marked read. detail: { clientId }
//   INCOMING: a new message arrived (from the shell's live feed). detail: message row
import { useEffect, useState } from 'react'

export const READ = 'unfnshd:messages-read'
export const INCOMING = 'unfnshd:message-in'

export function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export function useMessageEvent(name, handler) {
  useEffect(() => {
    const fn = (e) => handler(e.detail)
    window.addEventListener(name, fn)
    return () => window.removeEventListener(name, fn)
  }, [name, handler])
}

// True on screens 768px and wider (the coach sidebar layout).
export function useIsDesktop() {
  const query = '(min-width: 768px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setWide(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return wide
}
