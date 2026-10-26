'use client'

import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

// Runs in <head> before first paint so the page never flashes the wrong theme.
export const themeInitScript = `try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`

const readStored = (): Theme | null => {
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch { return null }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  const apply = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t
    setThemeState(t)
  }, [])

  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
    // Follow the system setting until the visitor picks a theme themselves.
    const media = matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => { if (!readStored()) apply(e.matches ? 'light' : 'dark') }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [apply])

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
    apply(next)
  }, [apply])

  return { theme, toggle }
}
