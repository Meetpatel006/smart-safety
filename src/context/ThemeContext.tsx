import React, { createContext, useContext } from 'react'

export type AppTheme = {
  colors: {
    primary: string
    secondary: string
    surface: string
    background: string
    error: string
    [key: string]: string
  }
}

// Minimal theme used across the app. Adjust tokens to match your design.
const defaultTheme: AppTheme = {
  colors: {
    primary: '#0077CC',
    secondary: '#FF7A00',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    error: '#D11A2A',
  },
}

const ThemeContext = createContext<AppTheme>(defaultTheme)

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  return <ThemeContext.Provider value={defaultTheme}>{children}</ThemeContext.Provider>
}

export const useAppTheme = () => useContext(ThemeContext)

export default ThemeContext
