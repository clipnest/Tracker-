import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../db/database';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await db.settings.get('theme');
      if (savedTheme) {
        setThemeState(savedTheme.value as Theme);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      let activeTheme: ResolvedTheme = 'dark';
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } else {
        activeTheme = theme as ResolvedTheme;
      }
      
      setResolvedTheme(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await db.settings.put({ key: 'theme', value: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
