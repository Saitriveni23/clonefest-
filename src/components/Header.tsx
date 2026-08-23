'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sun, Moon, Lock } from 'lucide-react';

interface HeaderProps {
  activeTab?: 'landing' | 'terminal' | 'archive' | 'settings';
  onTabChange?: (tab: 'landing' | 'terminal' | 'archive' | 'settings') => void;
  statusText?: string;
}

export function Header({
  activeTab = 'terminal',
  onTabChange,
  statusText = 'ENCRYPTED & READY'
}: HeaderProps) {
  const [isLightMode, setIsLightMode] = useState(false);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    if (typeof document !== 'undefined') {
      if (nextMode) {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
  };

  return (
    <header
      className="w-full sticky top-0 z-50 border-b backdrop-blur-2xl"
      style={{
        background: 'rgba(10, 11, 20, 0.9)',
        borderColor: 'rgba(120, 80, 255, 0.15)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onTabChange ? onTabChange('landing') : undefined}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer bg-transparent border-0 text-left"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              boxShadow: '0 0 16px rgba(124, 58, 237, 0.5)'
            }}
          >
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-black text-base tracking-tight text-white group-hover:text-purple-300 transition-colors uppercase">
            CIPHER<span className="text-gradient-purple font-black">DROP</span>
          </span>
        </button>

        {/* Center Nav tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {(['terminal', 'archive', 'settings'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange?.(tab)}
                className={`relative px-3.5 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-[#9b9bbf] hover:text-white hover:bg-white/5'
                }`}
                style={
                  isActive
                    ? {
                        background: 'rgba(139, 92, 246, 0.18)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        boxShadow: '0 0 16px rgba(139, 92, 246, 0.2)'
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid transparent'
                      }
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #2dd4bf)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side: Security Pill & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider select-none"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: '#a78bfa'
            }}
          >
            <Lock className="w-2.5 h-2.5 text-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{statusText}</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9b9bbf] hover:text-white hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
          >
            {isLightMode ? <Moon className="w-4 h-4 text-purple-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </div>
    </header>
  );
}
