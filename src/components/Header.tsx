'use client';

import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Shield, Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full border-b border-panel-border backdrop-blur-md bg-panel-bg sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all bg-zinc-950">
            <img src="/logo.png" alt="CipherDrop Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none tracking-tight text-text-main">
              Cipher<span className="text-teal-400 font-extrabold">Drop</span>
            </span>
            <span className="text-[10px] text-text-ghost tracking-wider font-semibold uppercase mt-0.5 animate-pulse">
              Secure Share
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Server</span>
          </div>

          <Link
            href="/"
            className="text-sm font-medium text-text-muted hover:text-text-main transition-colors py-1.5 px-3.5 rounded-lg hover:bg-btn-sec-bg"
          >
            Create Paste
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
