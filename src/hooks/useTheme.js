// 主題切換 Hook — 深色/亮色模式
import { useState, useEffect, useCallback } from 'react'

const THEME_KEY = 'cs-platform-theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // 靜默失敗
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
  }, [])

  return { theme, isDark: theme === 'dark', toggleTheme, setTheme }
}
