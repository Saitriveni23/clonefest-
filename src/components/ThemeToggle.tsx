'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover active:scale-95 transition-all text-text-muted hover:text-text-main cursor-pointer"
      aria-label="Toggle visual theme"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
    </button>
  );
}
