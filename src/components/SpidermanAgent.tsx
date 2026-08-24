'use client';

import React from 'react';

export function SpidermanAgent() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Delicate, Light Cyber Spiderweb Mesh */}
      <svg
        className="w-full h-full text-purple-400/[0.08] dark:text-purple-300/[0.07]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      >
        {/* Main Diagonal & Cross Structural Radial Lines */}
        <line x1="0" y1="0" x2="1440" y2="900" />
        <line x1="1440" y1="0" x2="0" y2="900" />
        <line x1="720" y1="0" x2="720" y2="900" />
        <line x1="0" y1="450" x2="1440" y2="450" />
        <line x1="360" y1="0" x2="1080" y2="900" />
        <line x1="1080" y1="0" x2="360" y2="900" />
        <line x1="0" y1="225" x2="1440" y2="675" />
        <line x1="0" y1="675" x2="1440" y2="225" />

        {/* Central Radiating Giant Web Spiral Layers */}
        <ellipse cx="720" cy="450" rx="140" ry="90" strokeDasharray="4 4" />
        <ellipse cx="720" cy="450" rx="280" ry="180" />
        <ellipse cx="720" cy="450" rx="420" ry="270" strokeDasharray="6 4" />
        <ellipse cx="720" cy="450" rx="560" ry="360" />
        <ellipse cx="720" cy="450" rx="700" ry="450" strokeDasharray="8 5" />
        <ellipse cx="720" cy="450" rx="840" ry="540" />

        {/* Corner Spider Web Radiations */}
        <path d="M 120 0 Q 110 35 90 70 Q 70 90 35 110 Q 0 120 0 120" />
        <path d="M 240 0 Q 220 70 180 140 Q 140 180 70 220 Q 0 240 0 240" />
        <path d="M 360 0 Q 330 105 270 210 Q 210 270 105 330 Q 0 360 0 360" />

        <path d="M 1320 0 Q 1330 35 1350 70 Q 1370 90 1405 110 Q 1440 120 1440 120" />
        <path d="M 1200 0 Q 1220 70 1260 140 Q 1300 180 1370 220 Q 1440 240 1440 240" />
        <path d="M 1080 0 Q 1110 105 1170 210 Q 1230 270 1335 330 Q 1440 360 1440 360" />

        <path d="M 120 900 Q 110 865 90 830 Q 70 810 35 790 Q 0 780 0 780" />
        <path d="M 240 900 Q 220 830 180 760 Q 140 720 70 680 Q 0 660 0 660" />
        <path d="M 360 900 Q 330 795 270 690 Q 210 630 105 570 Q 0 540 0 540" />

        <path d="M 1320 900 Q 1330 865 1350 830 Q 1370 810 1405 790 Q 1440 780 1440 780" />
        <path d="M 1200 900 Q 1220 830 1260 760 Q 1300 720 1370 680 Q 1440 660 1440 660" />
        <path d="M 1080 900 Q 1110 795 1170 690 Q 1230 630 1335 570 Q 1440 540 1440 540" />

        {/* Delicate Web Intersection Nodes */}
        <circle cx="720" cy="450" r="2.5" fill="#c084fc" opacity="0.3" />
        <circle cx="440" cy="275" r="1.5" fill="#38bdf8" opacity="0.25" />
        <circle cx="1000" cy="275" r="1.5" fill="#38bdf8" opacity="0.25" />
        <circle cx="440" cy="625" r="1.5" fill="#38bdf8" opacity="0.25" />
        <circle cx="1000" cy="625" r="1.5" fill="#38bdf8" opacity="0.25" />
      </svg>
    </div>
  );
}
