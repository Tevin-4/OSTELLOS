/* ─── ThemeProvider.jsx ────────────────────────────── */
import { createContext, useContext } from 'react';

export const ThemeContext = createContext('light');

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}

export default function ThemeProvider({ children }) {
  return <ThemeContext.Provider value={'light'}>{children}</ThemeContext.Provider>;
};