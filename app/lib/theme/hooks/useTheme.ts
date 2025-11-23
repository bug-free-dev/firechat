'use client';

import { useTheme as useNextTheme } from 'next-themes';

import { getNextTheme,Theme } from '../utils';

export function useTheme() {
  const { theme: rawTheme, setTheme, systemTheme } = useNextTheme();

  const effectiveTheme: Theme = (rawTheme === 'system' ? (systemTheme as Theme) : (rawTheme as Theme)) || 'dark';

  const toggleTheme = () => {
    if (!rawTheme) return;
    setTheme(getNextTheme(rawTheme as Theme));
  };

  return { theme: effectiveTheme, toggleTheme, rawTheme, setTheme };
}
