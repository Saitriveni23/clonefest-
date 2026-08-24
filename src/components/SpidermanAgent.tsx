'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPIDEY_SECRET_KEY = 'SPIDEY-WEB-999';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website! 🕷️🕸️';

// Top hanging waypoints along the ceiling
interface HangingPosition {
  xPercent: number;
  webHeightPx: number;
}

const HANGING_POSITIONS: HangingPosition[] = [
  { xPercent: 12, webHeightPx: 140 },  // Top-Left hanging
  { xPercent: 82, webHeightPx: 160 },  // Top-Right hanging
  { xPercent: 48, webHeightPx: 120 }   // Top-Center hanging
];

interface SpidermanAgentProps {
  isLanding?: boolean;
}

export function SpidermanAgent({ isLanding = true }: SpidermanAgentProps) {
  const [posIdx, setPosIdx] = useState(1); // Default to Top-Right

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

  // Change hanging positions periodically across ceiling
  useEffect(() => {
    if (!isLanding || showBubble) return;

    const interval = setInterval(() => {
      setPosIdx((prev) => (prev + 1) % HANGING_POSITIONS.length);
      playThwipSound();
    }, 7000);

    return () => clearInterval(interval);
  }, [isLanding, showBubble]);

  const currentPos = HANGING_POSITIONS[posIdx];

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

  return (
    <>
      {/* ========================================================================= */}
      {/* FULL WEB APPLICATION SPIDER WEB MESH BACKGROUND                           */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none">
        <svg
          className={`w-full h-full transition-opacity duration-700 ${
            isLanding
              ? 'text-purple-400/[0.18] drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]'
              : 'text-purple-400/[0.06] drop-shadow-none'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.85"
        >
          {/* Main Diagonal & Radial Structural Silk Strands */}
          <line x1="0" y1="0" x2="1440" y2="900" strokeDasharray="4 4" />
          <line x1="1440" y1="0" x2="0" y2="900" strokeDasharray="4 4" />
          <line x1="720" y1="0" x2="720" y2="900" />
          <line x1="0" y1="450" x2="1440" y2="450" />
          <line x1="360" y1="0" x2="1080" y2="900" strokeDasharray="5 5" />
          <line x1="1080" y1="0" x2="360" y2="900" strokeDasharray="5 5" />

          {/* Central Radiating Giant Web Spiral Layers */}
          <ellipse cx="720" cy="450" rx="140" ry="90" strokeDasharray="5 3" />
          <ellipse cx="720" cy="450" rx="280" ry="180" />
          <ellipse cx="720" cy="450" rx="420" ry="270" strokeDasharray="7 4" />
          <ellipse cx="720" cy="450" rx="560" ry="360" />
          <ellipse cx="720" cy="450" rx="700" ry="450" strokeDasharray="9 5" />
          <ellipse cx="720" cy="450" rx="840" ry="540" />

          {/* Corner Spider Web Radiations */}
          <path d="M 120 0 Q 110 35 90 70 Q 70 90 35 110 Q 0 120 0 120" />
          <path d="M 240 0 Q 220 70 180 140 Q 140 180 70 220 Q 0 240 0 240" strokeDasharray="4 2" />
          <path d="M 360 0 Q 330 105 270 210 Q 210 270 105 330 Q 0 360 0 360" />

          <path d="M 1320 0 Q 1330 35 1350 70 Q 1370 90 1405 110 Q 1440 120 1440 120" />
          <path d="M 1200 0 Q 1220 70 1260 140 Q 1300 180 1370 220 Q 1440 240 1440 240" strokeDasharray="4 2" />
          <path d="M 1080 0 Q 1110 105 1170 210 Q 1230 270 1335 330 Q 1440 360 1440 360" />

          <path d="M 120 900 Q 110 865 90 830 Q 70 810 35 790 Q 0 780 0 780" />
          <path d="M 240 900 Q 220 830 180 760 Q 140 720 70 680 Q 0 660 0 660" strokeDasharray="4 2" />
          <path d="M 360 900 Q 330 795 270 690 Q 210 630 105 570 Q 0 540 0 540" />

          <path d="M 1320 900 Q 1330 865 1350 830 Q 1370 810 1405 790 Q 1440 780 1440 780" />
          <path d="M 1200 900 Q 1220 830 1260 760 Q 1300 720 1370 680 Q 1440 660 1440 660" strokeDasharray="4 2" />
          <path d="M 1080 900 Q 1110 795 1170 690 Q 1230 630 1335 570 Q 1440 540 1440 540" />

          {/* Web Nodes */}
          <circle cx="720" cy="450" r="3" fill="#c084fc" fillOpacity="0.6" />
          <circle cx="440" cy="275" r="2" fill="#38bdf8" fillOpacity="0.5" />
          <circle cx="1000" cy="275" r="2" fill="#38bdf8" fillOpacity="0.5" />
          <circle cx="440" cy="625" r="2" fill="#38bdf8" fillOpacity="0.5" />
          <circle cx="1000" cy="625" r="2.5" fill="#38bdf8" fillOpacity="0.5" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* ICONIC UPSIDE-DOWN HANGING SPIDER-MAN (Suspended from top webline)       */}
      {/* ========================================================================= */}
      {isLanding && (
        <div
          className="fixed top-0 z-40 select-none cursor-pointer transition-all duration-[1200ms] ease-in-out"
          style={{
            left: `${currentPos.xPercent}%`
          }}
        >
          {/* Hanging Pendulum Assembly */}
          <div className="flex flex-col items-center animate-spidey-hang">
            
            {/* Top Ceiling Anchor Web Splat */}
            <div className="relative w-8 h-3 flex items-center justify-center">
              <div className="w-6 h-2 bg-purple-400/40 rounded-full blur-[1px]" />
              <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </div>

            {/* Glowing Braided Spider Silk Hanging Webline */}
            <div
              className="relative w-[3px] bg-gradient-to-b from-white via-purple-200 to-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
              style={{
                height: `${currentPos.webHeightPx}px`
              }}
            >
              {/* Wrapped outer fibers */}
              <div className="absolute inset-0 bg-purple-400/50 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 6px)' }} />
            </div>

            {/* Upside Down Hanging Spider-Man Character */}
            <div
              onClick={handleClickSpiderman}
              className="relative w-24 h-32 flex items-center justify-center group hover:scale-105 transition-transform -mt-2"
              title="Click hanging Spider-Man to decrypt his secret key! 🕷️"
            >
              {/* Full-Body SVG Upside-Down Hanging Spider-Man */}
              <svg
                className="w-full h-full drop-shadow-[0_8px_20px_rgba(239,68,68,0.7)]"
                viewBox="0 0 100 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* --- TOP: CROSSED HANGING LEGS & RED BOOTS (Clinging to Web) --- */}
                {/* Web Strand Passing Through Legs */}
                <line x1="50" y1="0" x2="50" y2="40" stroke="#ffffff" strokeWidth="3" opacity="0.9" />

                {/* Left Leg Crossed */}
                <path
                  d="M 50 36 L 36 22 L 28 8 L 40 4 L 46 16 L 50 28 Z"
                  fill="#2563eb"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* Left Red Boot (Clinging onto web) */}
                <path
                  d="M 28 8 L 40 4 L 46 16 L 36 22 Z"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2"
                />

                {/* Right Leg Crossed */}
                <path
                  d="M 50 36 L 64 22 L 72 8 L 60 4 L 54 16 L 50 28 Z"
                  fill="#2563eb"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* Right Red Boot (Clinging onto web) */}
                <path
                  d="M 72 8 L 60 4 L 54 16 L 64 22 Z"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2"
                />

                {/* --- MIDDLE: TORSO & WAIST (UPSIDE DOWN) --- */}
                {/* Blue Hips & Sides */}
                <path
                  d="M 36 36 L 32 64 L 68 64 L 64 36 Z"
                  fill="#2563eb"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* Red Chest & Center Vest */}
                <path
                  d="M 40 36 L 38 64 L 62 64 L 60 36 Z"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* Chest Spider Emblem */}
                <ellipse cx="50" cy="50" rx="2.5" ry="3.5" fill="#000000" />
                <path d="M 50 48 L 43 43 M 50 50 L 42 50 M 50 52 L 44 58 M 50 48 L 57 43 M 50 50 L 58 50 M 50 52 L 56 58" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" />

                {/* --- ARMS: ONE HOLDING WEB, ONE WAVING / RELAXING --- */}
                {/* Left Arm (Holding the webline) */}
                <path
                  d="M 33 58 L 22 48 L 44 32 L 48 36 L 30 54 Z"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2"
                />

                {/* Right Arm (Folded / Waving Relaxed Pose) */}
                <path
                  d="M 67 58 L 78 52 L 84 62 L 78 68 L 72 58 Z"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2"
                />

                {/* --- BOTTOM: HEAD & SPIDER MASK (Looking forward) --- */}
                <ellipse
                  cx="50"
                  cy="86"
                  rx="18"
                  ry="21"
                  fill="#dc2626"
                  stroke="#000000"
                  strokeWidth="2.2"
                />

                {/* Mask Webbing Lines */}
                <line x1="50" y1="65" x2="50" y2="107" stroke="#000000" strokeWidth="1" opacity="0.5" />
                <line x1="32" y1="86" x2="68" y2="86" stroke="#000000" strokeWidth="1" opacity="0.5" />
                <ellipse cx="50" cy="86" rx="11" ry="13" stroke="#000000" strokeWidth="1" opacity="0.4" fill="none" />

                {/* Large Angled White Spidey Eyes */}
                {/* Left Eye */}
                <path
                  d="M 46 82 Q 41 74 36 77 Q 34 85 43 94 Q 47 91 46 82 Z"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="2.5"
                />
                {/* Right Eye */}
                <path
                  d="M 54 82 Q 59 74 64 77 Q 66 85 57 94 Q 53 91 54 82 Z"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* Interactive Speech Bubble (Directly Below Hanging Spider-Man) */}
          {showBubble && (
            <div
              className="absolute top-full -left-28 sm:-left-32 w-72 sm:w-80 p-4 rounded-2xl bg-[#17132a] text-[#f5f3ff] border-2 border-purple-400 shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-scale-in text-left z-50 cursor-default mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bubble Arrow pointing Up to Hanging Spidey */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#17132a] border-l-2 border-t-2 border-purple-400 rotate-45" />

              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/25 mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  <span className="text-xs font-black text-purple-200 uppercase tracking-wider font-mono">
                    🕷️ Hanging Spidey&apos;s Secret
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
                    Spider-Man is hanging out with an encrypted secret! Paste the key to decrypt:
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
        </div>
      )}
    </>
  );
}
