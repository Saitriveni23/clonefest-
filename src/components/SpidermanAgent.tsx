'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPIDEY_SECRET_KEY = 'SPIDEY-WEB-999';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website! 🕷️🕸️';

interface SpidermanAgentProps {
  isLanding?: boolean;
}

export function SpidermanAgent({ isLanding = true }: SpidermanAgentProps) {
  // Decryption bubble state
  const [showSecretModal, setShowSecretModal] = useState(false);
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

  const handleClickSpiderman = (e: React.MouseEvent) => {
    e.stopPropagation();
    playThwipSound();
    confetti({
      particleCount: 45,
      spread: 70,
      colors: ['#ef4444', '#3b82f6', '#c084fc', '#ffffff']
    });
    setShowSecretModal(true);
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
      {/* FIXED POSITION: SPIDER-MAN HANGING BY HANDS & SAYING "HIEE!"              */}
      {/* ========================================================================= */}
      {isLanding && (
        <div
          className="fixed top-0 left-[13%] sm:left-[14%] z-40 select-none cursor-pointer"
        >
          {/* Pendular Sway Assembly */}
          <div
            onClick={handleClickSpiderman}
            className="flex flex-col items-center animate-spidey-hang group"
            title="Click Spider-Man to decrypt his secret key! 🕷️"
          >
            {/* Cute Floating "Hiee!" Speech Bubble */}
            <div className="absolute left-20 top-[148px] px-3 py-1 rounded-xl bg-purple-900/90 border border-purple-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.8)] text-white text-xs font-mono font-bold flex items-center gap-1.5 animate-bounce pointer-events-none z-50">
              <span className="text-purple-300">Hiee!</span>
              <span>👋</span>
              {/* Pointer arrow to Spidey */}
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-900 border-l border-b border-purple-400/60 rotate-45" />
            </div>

            {/* Unified SVG: Glowing Anchor + Silk Rope + Spider-Man Holding Rope */}
            <svg
              className="w-32 h-[260px] drop-shadow-[0_8px_20px_rgba(239,68,68,0.6)] overflow-visible"
              viewBox="0 0 120 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 1. TOP CEILING ANCHOR SPLAT */}
              <ellipse cx="38" cy="4" rx="14" ry="4" fill="rgba(192, 132, 252, 0.4)" />
              <circle cx="38" cy="4" r="3" fill="#ffffff" />

              {/* 2. GLOWING SPIDER SILK ROPE (Drops directly into Left Hand at x:38, y:138) */}
              <line
                x1="38"
                y1="4"
                x2="38"
                y2="140"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              />
              <line
                x1="38"
                y1="4"
                x2="38"
                y2="140"
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.8"
              />

              {/* 3. LEFT HAND & ARM (Full Length Equal to Right Arm) */}
              {/* Left Hand Knuckles wrapped around rope */}
              <ellipse cx="38" cy="138" rx="5.5" ry="5" fill="#dc2626" stroke="#000000" strokeWidth="1.5" />
              {/* Left Arm extending from Shoulder (x:46, y:176) up to Hand (x:38, y:138) */}
              <path d="M 33 140 L 26 156 L 38 178 L 48 174 L 43 140 Z" fill="#dc2626" stroke="#000000" strokeWidth="2" />

              {/* 4. RIGHT ARM & HAND WAVING (Equal Length Reach) */}
              <g className="animate-spidey-wave">
                {/* Right Arm reaching UP & OUT */}
                <path d="M 76 176 L 90 162 L 98 144 L 92 140 L 84 154 L 70 170 Z" fill="#dc2626" stroke="#000000" strokeWidth="2" />
                {/* Right Waving Palm */}
                <ellipse cx="98" cy="144" rx="5.5" ry="5" fill="#dc2626" stroke="#000000" strokeWidth="1.5" />
                {/* Waving Fingers */}
                <path d="M 96 140 L 98 134 M 99 140 L 102 135 M 101 142 L 106 138 M 95 144 L 93 142" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* 5. HEAD & SPIDER MASK (Centered and Completely Unobstructed) */}
              <ellipse
                cx="62"
                cy="166"
                rx="14"
                ry="17"
                fill="#dc2626"
                stroke="#000000"
                strokeWidth="2.2"
              />

              {/* Mask Webbing Lines */}
              <line x1="62" y1="149" x2="62" y2="183" stroke="#000000" strokeWidth="1" opacity="0.5" />
              <line x1="48" y1="166" x2="76" y2="166" stroke="#000000" strokeWidth="1" opacity="0.5" />
              <ellipse cx="62" cy="166" rx="9" ry="10" stroke="#000000" strokeWidth="1" opacity="0.4" fill="none" />

              {/* Large Angled White Spidey Eyes */}
              {/* Left Eye */}
              <path
                d="M 58 164 Q 54 158 50 160 Q 48 167 56 172 Q 59 170 58 164 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="2.2"
              />
              {/* Right Eye */}
              <path
                d="M 66 164 Q 70 158 74 160 Q 76 167 68 172 Q 65 170 66 164 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="2.2"
              />

              {/* 6. TORSO & RED/BLUE SUIT */}
              {/* Blue Side Panels */}
              <path d="M 46 178 L 50 206 L 74 206 L 78 178 Z" fill="#2563eb" stroke="#000000" strokeWidth="2" />
              {/* Red Center Vest */}
              <path d="M 54 178 L 52 206 L 72 206 L 70 178 Z" fill="#dc2626" stroke="#000000" strokeWidth="2" />
              {/* Chest Spider Emblem */}
              <ellipse cx="62" cy="190" rx="2.5" ry="3.5" fill="#000000" />
              <path d="M 62 188 L 55 183 M 62 190 L 54 190 M 62 192 L 56 198 M 62 188 L 69 183 M 62 190 L 70 190 M 62 192 L 68 198" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" />

              {/* 7. LEGS & RED BOOTS HANGING FREELY BELOW */}
              {/* Left Leg */}
              <path d="M 50 206 L 44 224 L 38 238 L 50 240 L 54 226 L 58 208 Z" fill="#2563eb" stroke="#000000" strokeWidth="2" />
              {/* Left Red Boot */}
              <path d="M 44 224 L 38 238 L 50 240 L 54 226 Z" fill="#dc2626" stroke="#000000" strokeWidth="2" />

              {/* Right Leg */}
              <path d="M 74 206 L 80 224 L 86 238 L 74 240 L 70 226 L 66 208 Z" fill="#2563eb" stroke="#000000" strokeWidth="2" />
              {/* Right Red Boot */}
              <path d="M 80 224 L 86 238 L 74 240 L 70 226 Z" fill="#dc2626" stroke="#000000" strokeWidth="2" />
            </svg>
          </div>

          {/* Interactive Decryption Card (Opens upon clicking Spider-Man or "Hiee!") */}
          {showSecretModal && (
            <div
              className="absolute top-full -left-20 sm:-left-24 w-72 sm:w-80 p-4 rounded-2xl bg-[#17132a] text-[#f5f3ff] border-2 border-purple-400 shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-scale-in text-left z-50 cursor-default mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bubble Arrow pointing Up */}
              <div className="absolute -top-2 left-28 w-3.5 h-3.5 bg-[#17132a] border-l-2 border-t-2 border-purple-400 rotate-45" />

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
                  onClick={() => setShowSecretModal(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isDecrypted ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-purple-200/90 leading-tight">
                    Spider-Man is hanging out with an encrypted secret! Paste the key below to decrypt:
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
