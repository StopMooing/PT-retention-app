// Light / dark mode. The first paint is set by the script in index.html; this keeps it
// in sync afterwards. 'system' means follow the phone.
import { useEffect, useState } from 'react'

const KEY = 'unfnshd-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemeChoice() {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

function apply(choice) {
  const mode = choice === 'system' ? (media().matches ? 'dark' : 'light') : choice
  document.documentElement.setAttribute('data-theme', mode)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', mode === 'dark' ? '#121212' : '#F3F1EC')
  return mode
}

export function setThemeChoice(choice) {
  try {
    if (choice === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
  } catch {
    // Private browsing: the choice lasts until the tab closes, which is fine.
  }
  apply(choice)
  window.dispatchEvent(new Event('unfnshd-theme'))
}

// Returns { choice, mode, setChoice } and re-renders when the theme changes anywhere.
export function useTheme() {
  const [choice, setChoice] = useState(getThemeChoice)
  const [mode, setMode] = useState(() => document.documentElement.getAttribute('data-theme') || 'light')

  useEffect(() => {
    const sync = () => {
      const c = getThemeChoice()
      setChoice(c)
      setMode(apply(c))
    }
    const mq = media()
    mq.addEventListener('change', sync)
    window.addEventListener('unfnshd-theme', sync)
    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('unfnshd-theme', sync)
    }
  }, [])

  return { choice, mode, setChoice: setThemeChoice }
}
