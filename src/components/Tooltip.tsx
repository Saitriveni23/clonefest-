'use client';

import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

/** Hover/focus tooltip wrapper. Wrap a single button/control with a short explanation of what it does. */
export function Tooltip({ text, children, className = '' }: TooltipProps) {
  return (
    <span className={`relative inline-flex group/tooltip ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-panel-border text-[10px] leading-snug text-text-main text-center opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:scale-100 transition-all duration-150 z-50 shadow-lg"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-zinc-950 border-b border-r border-panel-border rotate-45" />
      </span>
    </span>
  );
}
