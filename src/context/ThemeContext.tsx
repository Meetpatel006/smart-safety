import React, { createContext, useContext } from 'react'

const theme = {
	colors: {
		primary: '#0077CC',
		secondary: '#FF7A00',
		surface: '#FFFFFF',
		background: '#FFFFFF',
		error: '#D11A2A',
	},
}

const ThemeContext = createContext(theme)

type ThemeProviderProps = {
	children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => (
	<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
)

export const useAppTheme = () => useContext(ThemeContext)


