'use client'

import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

// Runs in <head> before first paint so the page never flashes the wrong theme.
// Dark unless the visitor has switched to light themselves.
export const themeInitScript = `try{document.documentElement.dataset.theme=localStorage.getItem('${STORAGE_KEY}')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  const apply = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t
    setThemeState(t)
  }, [])

  useEffect(() => {
    setThemeState(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
    apply(next)
  }, [apply])

  return { theme, toggle }
}
