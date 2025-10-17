"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  themes?: string[]
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  themes = ["light", "dark"],
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const pathname = usePathname()

  // Check if current page is login or register
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password"

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove(...themes)

    if (disableTransitionOnChange) {
      root.classList.add("transition-none")
      window.setTimeout(() => {
        root.classList.remove("transition-none")
      }, 0)
    }

    // Always use dark theme for auth pages
    if (isAuthPage) {
      root.classList.add("dark")
      if (attribute !== "class") root.setAttribute(attribute, "dark")
      return
    }

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      if (attribute !== "class") root.setAttribute(attribute, systemTheme)
      return
    }

    root.classList.add(theme)
    if (attribute !== "class") root.setAttribute(attribute, theme)
  }, [theme, attribute, enableSystem, disableTransitionOnChange, pathname, isAuthPage, themes])

  useEffect(() => {
    // Skip loading saved theme for auth pages
    if (isAuthPage) return

    const savedTheme = localStorage.getItem(storageKey) as Theme | null

    if (savedTheme) {
      setTheme(savedTheme)
    } else if (enableSystem) {
      setTheme("system")
    }
  }, [storageKey, enableSystem, isAuthPage])

  useEffect(() => {
    // Don't persist theme changes for auth pages
    if (isAuthPage) return

    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey, isAuthPage])

  return (
    <ThemeProviderContext.Provider
      value={{
        // If on auth page, always report "dark" as the current theme
        theme: isAuthPage ? "dark" : theme,
        setTheme,
      }}
      {...props}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
