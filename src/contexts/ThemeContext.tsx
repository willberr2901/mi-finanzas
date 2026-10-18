import { createContext, useContext, useEffect, useState } from 'react';
import { usePrefs } from '../utils/prefs';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

/** Aplica el tema elegido en Ajustes (oscuro, claro o automático según el celular). */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [prefs, setPrefs] = usePrefs();
  const [sys, setSys] = useState<Theme>(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const on = () => setSys(mq.matches ? 'light' : 'dark');
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  const theme: Theme = prefs.theme === 'system' ? sys : prefs.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F2F4FA' : '#0B1026');
  }, [theme]);

  const toggleTheme = () => setPrefs({ theme: theme === 'dark' ? 'light' : 'dark' });

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
