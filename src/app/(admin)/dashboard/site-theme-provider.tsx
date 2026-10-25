"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react"

export const siteThemes = {
  violet: {
    name: "Ungu Cendekia",
    accent: "#6d28d9",
    hover: "#5b21b6",
    soft: "#f5f3ff",
    text: "#5b21b6",
  },
  ocean: {
    name: "Biru Bahari",
    accent: "#0369a1",
    hover: "#075985",
    soft: "#f0f9ff",
    text: "#075985",
  },
  forest: {
    name: "Hijau Akademik",
    accent: "#047857",
    hover: "#065f46",
    soft: "#ecfdf5",
    text: "#065f46",
  },
  amber: {
    name: "Emas Prestasi",
    accent: "#b45309",
    hover: "#92400e",
    soft: "#fffbeb",
    text: "#92400e",
  },
} as const

export type SiteTheme = keyof typeof siteThemes

type SiteThemeContextValue = {
  theme: SiteTheme
  setTheme: (theme: SiteTheme) => void
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null)
const STORAGE_KEY = "school-profile-theme"
const CHANGE_EVENT = "school-profile-theme-change"

function isSiteTheme(value: string | null): value is SiteTheme {
  return value !== null && Object.hasOwn(siteThemes, value)
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function getStoredTheme(): SiteTheme {
  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  return isSiteTheme(storedTheme) ? storedTheme : "violet"
}

function getServerTheme(): SiteTheme {
  return "violet"
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, getServerTheme)
  const setTheme = useCallback((nextTheme: SiteTheme) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  useEffect(() => {
    const palette = siteThemes[theme]
    const root = document.documentElement
    root.dataset.schoolTheme = theme
    root.style.setProperty("--school-accent", palette.accent)
    root.style.setProperty("--school-accent-hover", palette.hover)
    root.style.setProperty("--school-accent-soft", palette.soft)
    root.style.setProperty("--school-accent-text", palette.text)
  }, [theme])

  return (
    <SiteThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </SiteThemeContext.Provider>
  )
}

export function useSiteTheme() {
  const context = useContext(SiteThemeContext)
  if (!context) throw new Error("useSiteTheme must be used within SiteThemeProvider")
  return context
}
