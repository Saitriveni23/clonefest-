'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';

function UtcClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().substring(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden xl:flex flex-col items-end leading-none mr-1">
      <span className="font-mono text-[9px] text-text-ghost tracking-widest">SYS.TIME [UTC]</span>
      <span className="font-mono text-xs text-text-muted tabular-nums">{time ?? '--:--:--'}</span>
    </div>
  );
}

export function Header() {
  return (
    <header className="w-full border-b border-panel-border backdrop-blur-xl bg-panel-bg sticky top-0 z-50 transition-colors duration-300 shadow-[0_1px_10px_rgba(167,139,250,0.08)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all bg-zinc-950">
              <img src="/logo.png" alt="CipherDrop Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg leading-none tracking-tighter uppercase text-text-main hidden sm:inline">
              Cipher<span className="text-teal-400">Drop</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-btn-sec-bg border border-panel-border rounded-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse-teal" />
            <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest opacity-90">ZKS Operational</span>
          </div>
        </div>

        <nav className="hidden lg:flex gap-8 items-center shrink-0">
          <Link
            href="/"
            className="relative font-sans text-base font-bold text-teal-400 pb-1 glow-sm"
          >
            Terminal
            <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
          </Link>
          <span className="font-sans text-base font-medium text-text-ghost cursor-default select-none">
            Archive
          </span>
          <span className="font-sans text-base font-medium text-text-ghost cursor-default select-none">
            Settings
          </span>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <UtcClock />
          <Tooltip text="Switch between light and dark appearance">
            <ThemeToggle />
          </Tooltip>
          <div className="hidden md:flex items-center px-3 py-1.5 bg-rose-500/10 border border-rose-500/30">
            <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wider">TOP SECRET // CLASSIFIED</span>
          </div>
        </div>
      </div>
    </header>
  );
}
