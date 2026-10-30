import { useCallback, useEffect, useRef, useState } from 'react'

/* Show a short message for a few seconds. Pair with <Toast toast={toast} /> from kit.jsx. */
export function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((message, tone = 'good') => {
    clearTimeout(timer.current)
    setToast({ message, tone, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), tone === 'bad' ? 5000 : 3000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return [toast, show]
}

