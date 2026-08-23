'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPIDEY_SECRET_KEY = 'SPIDEY-WEB-999';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website! 🕷️🕸️';

interface Point {
  x: number; // percentage of viewport width
  y: number; // percentage of viewport height
}

const WAYPOINTS: Point[] = [
  { x: 5, y: 8 },      // Top-Left Corner
  { x: 88, y: 8 },     // Top-Right Corner
  { x: 88, y: 80 },    // Bottom-Right Corner
  { x: 5, y: 80 },     // Bottom-Left Corner
  { x: 48, y: 10 },    // Top-Center
  { x: 48, y: 78 }     // Bottom-Center
];

export function SpidermanAgent() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [targetIdx, setTargetIdx] = useState(1);
  const [spideyPos, setSpideyPos] = useState<Point>(WAYPOINTS[0]);
  const [isWebActive, setIsWebActive] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Decryption bubble state
  const [showBubble, setShowBubble] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [keyError, setKeyError] = useState(false);

  // Web-shooter "THWIP!" sound synthesizer
  const playThwipSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3600, ctx.currentTime);
      filter.Q.setValueAtTime(3.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  };

  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Real Web-Shooting & Zipping Cycle
  useEffect(() => {
    if (showBubble) return;

    const sequenceTimer = setInterval(() => {
      const nextTargetIdx = (currentIdx + 1) % WAYPOINTS.length;
      setTargetIdx(nextTargetIdx);

      // 1. Shoot realistic spider web line to target!
      setIsWebActive(true);
      playThwipSound();

      // 2. Zip Spidey along the realistic web line!
      setTimeout(() => {
        setIsZipping(true);
        setSpideyPos(WAYPOINTS[nextTargetIdx]);
      }, 600);

      // 3. Arrive, retract web, and land!
      setTimeout(() => {
        setIsWebActive(false);
        setIsZipping(false);
        setCurrentIdx(nextTargetIdx);
      }, 1650);
    }, 4500);

    return () => clearInterval(sequenceTimer);
  }, [currentIdx, showBubble]);

  const currentTargetPoint = WAYPOINTS[targetIdx];

  const handleClickSpiderman = (e: React.MouseEvent) => {
    e.stopPropagation();
    playThwipSound();
    confetti({
      particleCount: 45,
      spread: 70,
      colors: ['#ef4444', '#3b82f6', '#c084fc', '#ffffff']
    });
    setShowBubble(true);
  };

  const handleCopyKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(SPIDEY_SECRET_KEY);
      setIsCopied(true);
      setInputKey(SPIDEY_SECRET_KEY);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      setInputKey(SPIDEY_SECRET_KEY);
    }
  };

  const handleDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().toUpperCase() === SPIDEY_SECRET_KEY) {
      playSuccessSound();
      setIsDecrypted(true);
      setKeyError(false);
      confetti({
        particleCount: 65,
        spread: 80,
        colors: ['#ef4444', '#3b82f6', '#c084fc', '#2dd4bf']
      });
    } else {
      setKeyError(true);
    }
  };

  // Calculate coordinates for realistic braided web rope
  const x1 = spideyPos.x + 3;
  const y1 = spideyPos.y + 4;
  const x2 = currentTargetPoint.x + 3;
  const y2 = currentTargetPoint.y + 4;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 + 2; // subtle catenary sag

  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <>
      {/* ========================================================================= */}
      {/* FULL WEB APPLICATION SPIDER WEB MESH BACKGROUND                           */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none">
        <svg
          className="w-full h-full text-purple-400/20 drop-shadow-[0_0_10px_rgba(192,132,252,0.35)]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
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
          <ellipse cx="720" cy="450" rx="140" ry="90" strokeDasharray="6 3" />
          <ellipse cx="720" cy="450" rx="280" ry="180" />
          <ellipse cx="720" cy="450" rx="420" ry="270" strokeDasharray="8 4" />
          <ellipse cx="720" cy="450" rx="560" ry="360" />
          <ellipse cx="720" cy="450" rx="700" ry="450" strokeDasharray="10 5" />
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

          {/* Web Nodes */}
          <circle cx="720" cy="450" r="4" fill="#c084fc" />
          <circle cx="440" cy="275" r="2.5" fill="#38bdf8" />
          <circle cx="1000" cy="275" r="2.5" fill="#38bdf8" />
          <circle cx="440" cy="625" r="2.5" fill="#38bdf8" />
          <circle cx="1000" cy="625" r="2.5" fill="#38bdf8" />
        </svg>

        {/* ======================================================================= */}
        {/* REALISTIC MULTI-STRAND BRAIDED SPIDER SILK ROPE & IMPACT WEB NET        */}
        {/* ======================================================================= */}
        {isWebActive && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
            <defs>
              <filter id="silkGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Main Glowing Silk Core Rope */}
            <path
              d={`M ${x1}% ${y1}% Q ${midX}% ${midY}% ${x2}% ${y2}%`}
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              filter="url(#silkGlow)"
            />

            {/* 2. Braided Outer Silk Fibers (Woven wrapping strands) */}
            <path
              d={`M ${x1}% ${y1}% Q ${midX - 1}% ${midY - 1}% ${x2}% ${y2}%`}
              stroke="#e9d5ff"
              strokeWidth="2"
              strokeDasharray="8 4"
              fill="none"
            />
            <path
              d={`M ${x1}% ${y1}% Q ${midX + 1}% ${midY + 1}% ${x2}% ${y2}%`}
              stroke="#c084fc"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              fill="none"
            />

            {/* 3. Whispy Spider Silk Tendrils Branching along the Rope */}
            <path
              d={`M ${x1 + (deltaX * 0.3)}% ${y1 + (deltaY * 0.3)}% Q ${x1 + (deltaX * 0.35)}% ${y1 + (deltaY * 0.3) - 3}% ${x1 + (deltaX * 0.42)}% ${y1 + (deltaY * 0.42)}%`}
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              opacity="0.8"
            />
            <path
              d={`M ${x1 + (deltaX * 0.65)}% ${y1 + (deltaY * 0.65)}% Q ${x1 + (deltaX * 0.7)}% ${y1 + (deltaY * 0.7) + 3}% ${x1 + (deltaX * 0.78)}% ${y1 + (deltaY * 0.78)}%`}
              stroke="#ffffff"
              strokeWidth="1.2"
              fill="none"
              opacity="0.8"
            />

            {/* 4. Realistic Spider Web Anchor Net / Splat at Target Point */}
            <g transform={`translate(${x2 * (typeof window !== 'undefined' ? window.innerWidth / 100 : 12)}, ${y2 * (typeof window !== 'undefined' ? window.innerHeight / 100 : 8)})`}>
              {/* Radial Web Strands at anchor */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4;
                const r = 28;
                return (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={Math.cos(angle) * r}
                    y2={Math.sin(angle) * r}
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    filter="url(#silkGlow)"
                  />
                );
              })}

              {/* Concentric Web Rings at anchor */}
              <circle cx="0" cy="0" r="10" stroke="#ffffff" strokeWidth="1.5" fill="rgba(255,255,255,0.2)" strokeDasharray="3 2" />
              <circle cx="0" cy="0" r="20" stroke="#c084fc" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" className="animate-ping" />
            </g>
          </svg>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULL BODY SPIDER-MAN TRAVERSING AND ZIPPING TO THROWN WEB                 */}
      {/* ========================================================================= */}
      <div
        className="fixed z-40 select-none cursor-pointer transition-all duration-[1000ms] ease-out"
        style={{
          top: `${spideyPos.y}%`,
          left: `${spideyPos.x}%`,
          transform: isZipping ? `rotate(${angleDeg * 0.4}deg) scale(1.1)` : 'rotate(0deg) scale(1)'
        }}
      >
        {/* Interactive Speech Bubble */}
        {showBubble && (
          <div
            className={`absolute w-72 sm:w-80 p-4 rounded-2xl bg-[#17132a] text-[#f5f3ff] border-2 border-purple-400 shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-scale-in text-left z-50 cursor-default ${
              spideyPos.y > 50 ? '-top-56' : 'top-28'
            } ${spideyPos.x > 50 ? '-left-64 sm:-left-72' : 'left-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bubble Arrow */}
            <div
              className={`absolute w-3.5 h-3.5 bg-[#17132a] border-purple-400 rotate-45 ${
                spideyPos.y > 50
                  ? '-bottom-2 border-r-2 border-b-2'
                  : '-top-2 border-l-2 border-t-2'
              } ${spideyPos.x > 50 ? 'right-6' : 'left-6'}`}
            />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/25 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span className="text-xs font-black text-purple-200 uppercase tracking-wider font-mono">
                  🕷️ Spidey&apos;s Web Cipher
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowBubble(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-purple-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isDecrypted ? (
              <div className="space-y-3">
                <p className="text-[11px] text-purple-200/90 leading-tight">
                  Spider-Man shot a secret key across the web! Paste it below to decrypt:
                </p>

                {/* Secret Key Badge */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300">
                  <span className="font-bold tracking-wider">{SPIDEY_SECRET_KEY}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>

                {/* Decrypt Form */}
                <form onSubmit={handleDecrypt} className="space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Paste secret key here..."
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-purple-500/30 text-xs text-white font-mono placeholder:text-purple-300/40 outline-none focus:border-purple-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Decrypt</span>
                    </button>
                  </div>

                  {keyError && (
                    <p className="text-[10px] text-rose-400 font-mono">
                      ⚠️ Invalid key. Use: {SPIDEY_SECRET_KEY}
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="space-y-3 animate-scale-in">
                <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-400/40 text-left space-y-1">
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Web Decrypted Locally</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed pt-0.5">
                    &ldquo;{REVEALED_MESSAGE}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-purple-300">
                    🕸️ Thwip! Great job!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDecrypted(false);
                      setInputKey('');
                      setKeyError(false);
                    }}
                    className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Lock again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* DETAILED FULL-BODY SPIDER-MAN (Vector Character)                       */}
        {/* ======================================================================= */}
        <div
          onClick={handleClickSpiderman}
          className="relative w-24 h-28 flex items-center justify-center group hover:scale-110 transition-transform"
          title="Click Spider-Man to decrypt his secret message! 🕷️"
        >
          {/* Full Body SVG Spider-Man in Dynamic Web-Shooting / Swinging Action Pose */}
          <svg
            className="w-full h-full drop-shadow-[0_4px_16px_rgba(239,68,68,0.6)]"
            viewBox="0 0 100 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* --- LEGS & BOOTS --- */}
            <path
              d="M 38 72 L 26 92 L 18 106 L 30 108 L 36 94 L 44 76 Z"
              fill="#2563eb"
              stroke="#000000"
              strokeWidth="2"
            />
            <path
              d="M 26 92 L 18 106 L 30 108 L 36 94 Z"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2"
            />

            <path
              d="M 62 72 L 74 92 L 82 106 L 70 108 L 64 94 L 56 76 Z"
              fill="#2563eb"
              stroke="#000000"
              strokeWidth="2"
            />
            <path
              d="M 74 92 L 82 106 L 70 108 L 64 94 Z"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2"
            />

            {/* --- TORSO & CHEST --- */}
            <path
              d="M 32 46 L 38 74 L 62 74 L 68 46 Z"
              fill="#2563eb"
              stroke="#000000"
              strokeWidth="2"
            />
            <path
              d="M 40 44 L 38 74 L 62 74 L 60 44 Z"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2"
            />
            <line x1="50" y1="44" x2="50" y2="74" stroke="#000000" strokeWidth="1" opacity="0.6" />
            <line x1="40" y1="58" x2="60" y2="58" stroke="#000000" strokeWidth="1" opacity="0.6" />
            <line x1="42" y1="66" x2="58" y2="66" stroke="#000000" strokeWidth="1" opacity="0.6" />

            <ellipse cx="50" cy="56" rx="2.5" ry="3.5" fill="#000000" />
            <path d="M 50 54 L 43 49 M 50 56 L 42 56 M 50 58 L 44 64 M 50 54 L 57 49 M 50 56 L 58 56 M 50 58 L 56 64" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" />

            {/* --- ARMS & WEB SHOOTER WRISTS --- */}
            <path
              d="M 33 46 L 18 56 L 10 52 L 12 46 L 24 42 L 35 44 Z"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2"
            />

            <path
              d="M 67 46 L 82 40 L 94 36 L 96 42 L 86 48 L 65 48 Z"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2"
            />
            <circle cx="95" cy="38" r="3" fill="#ffffff" className="animate-ping" />

            {/* --- HEAD & SPIDER MASK --- */}
            <ellipse
              cx="50"
              cy="25"
              rx="17"
              ry="20"
              fill="#dc2626"
              stroke="#000000"
              strokeWidth="2.2"
            />

            <line x1="50" y1="5" x2="50" y2="45" stroke="#000000" strokeWidth="1" opacity="0.5" />
            <line x1="33" y1="25" x2="67" y2="25" stroke="#000000" strokeWidth="1" opacity="0.5" />
            <ellipse cx="50" cy="25" rx="10" ry="12" stroke="#000000" strokeWidth="1" opacity="0.4" fill="none" />

            {/* Large Angular Spidey Eyes */}
            <path
              d="M 46 22 Q 41 15 37 17 Q 35 24 43 32 Q 47 30 46 22 Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="2.5"
            />
            <path
              d="M 54 22 Q 59 15 63 17 Q 65 24 57 32 Q 53 30 54 22 Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>
    </>
  );
}
