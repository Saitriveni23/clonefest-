'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPIDEY_SECRET_KEY = 'SPIDEY-WEB-999';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website! 🕷️🕸️';

// 8 Waypoints covering the 4 corners + perimeter web hubs across the entire screen
interface Waypoint {
  name: string;
  top: string;
  left: string;
  pose: 'hanging' | 'swinging' | 'crawling' | 'crouching';
}

export function SpidermanAgent() {
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const waypoints: Waypoint[] = [
    // 1. Top-Left Corner
    { name: 'top-left', top: '30px', left: '35px', pose: 'hanging' },
    // 2. Top-Center Web Hub
    { name: 'top-center', top: '25px', left: 'calc(50vw - 40px)', pose: 'hanging' },
    // 3. Top-Right Corner
    { name: 'top-right', top: '30px', left: 'calc(100vw - 115px)', pose: 'swinging' },
    // 4. Right-Center Web Hub
    { name: 'right-center', top: 'calc(50vh - 50px)', left: 'calc(100vw - 115px)', pose: 'crawling' },
    // 5. Bottom-Right Corner
    { name: 'bottom-right', top: 'calc(100vh - 130px)', left: 'calc(100vw - 115px)', pose: 'crawling' },
    // 6. Bottom-Center Web Hub
    { name: 'bottom-center', top: 'calc(100vh - 130px)', left: 'calc(50vw - 40px)', pose: 'crouching' },
    // 7. Bottom-Left Corner
    { name: 'bottom-left', top: 'calc(100vh - 130px)', left: '35px', pose: 'crouching' },
    // 8. Left-Center Web Hub
    { name: 'left-center', top: 'calc(50vh - 50px)', left: '35px', pose: 'crawling' }
  ];

  // Web-shooter "THWIP!" sound synthesizer
  const playThwipSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, ctx.currentTime);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(ctx.currentTime + 0.15);
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

  // Traversal loop around the whole spiderweb network every 4.5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (showBubble) return;

      setIsSwinging(true);
      playThwipSound();

      setTimeout(() => {
        setCurrentWaypointIndex((prev) => (prev + 1) % waypoints.length);
        setIsSwinging(false);
      }, 1600);
    }, 4500);

    return () => clearInterval(interval);
  }, [showBubble, waypoints.length]);

  const currentWaypoint = waypoints[currentWaypointIndex];

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
      {/* FULL WEB APPLICATION SPIDER WEB MESH (Covering Entire Web App)            */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none">
        
        {/* Giant Central & Connecting Spiderweb Mesh */}
        <svg
          className="w-full h-full text-purple-400/20 drop-shadow-[0_0_10px_rgba(192,132,252,0.35)]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {/* Main Diagonal & Cross Structural Radial Lines across entire screen */}
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

          {/* Top-Left Corner Intricate Radial Web */}
          <path d="M 120 0 Q 110 35 90 70 Q 70 90 35 110 Q 0 120 0 120" />
          <path d="M 240 0 Q 220 70 180 140 Q 140 180 70 220 Q 0 240 0 240" />
          <path d="M 360 0 Q 330 105 270 210 Q 210 270 105 330 Q 0 360 0 360" />
          <path d="M 480 0 Q 440 140 360 280 Q 280 360 140 440 Q 0 480 0 480" />

          {/* Top-Right Corner Intricate Radial Web */}
          <path d="M 1320 0 Q 1330 35 1350 70 Q 1370 90 1405 110 Q 1440 120 1440 120" />
          <path d="M 1200 0 Q 1220 70 1260 140 Q 1300 180 1370 220 Q 1440 240 1440 240" />
          <path d="M 1080 0 Q 1110 105 1170 210 Q 1230 270 1335 330 Q 1440 360 1440 360" />
          <path d="M 960 0 Q 1000 140 1080 280 Q 1160 360 1300 440 Q 1440 480 1440 480" />

          {/* Bottom-Left Corner Intricate Radial Web */}
          <path d="M 120 900 Q 110 865 90 830 Q 70 810 35 790 Q 0 780 0 780" />
          <path d="M 240 900 Q 220 830 180 760 Q 140 720 70 680 Q 0 660 0 660" />
          <path d="M 360 900 Q 330 795 270 690 Q 210 630 105 570 Q 0 540 0 540" />
          <path d="M 480 900 Q 440 760 360 620 Q 280 540 140 460 Q 0 420 0 420" />

          {/* Bottom-Right Corner Intricate Radial Web */}
          <path d="M 1320 900 Q 1330 865 1350 830 Q 1370 810 1405 790 Q 1440 780 1440 780" />
          <path d="M 1200 900 Q 1220 830 1260 760 Q 1300 720 1370 680 Q 1440 660 1440 660" />
          <path d="M 1080 900 Q 1110 795 1170 690 Q 1230 630 1335 570 Q 1440 540 1440 540" />
          <path d="M 960 900 Q 1000 760 1080 620 Q 1160 540 1300 460 Q 1440 420 1440 420" />

          {/* Glowing Spider Web Nodes */}
          <circle cx="720" cy="450" r="4" fill="#c084fc" />
          <circle cx="440" cy="275" r="2.5" fill="#38bdf8" />
          <circle cx="1000" cy="275" r="2.5" fill="#38bdf8" />
          <circle cx="440" cy="625" r="2.5" fill="#38bdf8" />
          <circle cx="1000" cy="625" r="2.5" fill="#38bdf8" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* SPIDER-MAN TRAVERSING THE FULL SPIDERWEB NETWORK                          */}
      {/* ========================================================================= */}
      <div
        className="fixed z-40 select-none cursor-pointer transition-all duration-[1600ms] ease-in-out"
        style={{
          top: currentWaypoint.top,
          left: currentWaypoint.left
        }}
      >
        {/* Dynamic Hanging Web Line */}
        {(currentWaypoint.pose === 'hanging' || currentWaypoint.pose === 'swinging') && (
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1.5px] h-36 bg-gradient-to-b from-purple-400/40 via-white/90 to-white shadow-[0_0_8px_#c084fc] pointer-events-none" />
        )}

        {/* Interactive Speech Bubble (Light Purple Aesthetic & Never Mirrored) */}
        {showBubble && (
          <div
            className={`absolute w-72 sm:w-80 p-4 rounded-2xl bg-[#17132a] text-[#f5f3ff] border-2 border-purple-400 shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-scale-in text-left z-50 cursor-default ${
              currentWaypoint.name.includes('bottom') ? '-top-56' : 'top-24'
            } ${currentWaypoint.name.includes('right') ? '-left-64 sm:-left-72' : 'left-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bubble Arrow */}
            <div
              className={`absolute w-3.5 h-3.5 bg-[#17132a] border-purple-400 rotate-45 ${
                currentWaypoint.name.includes('bottom')
                  ? '-bottom-2 border-r-2 border-b-2'
                  : '-top-2 border-l-2 border-t-2'
              } ${currentWaypoint.name.includes('right') ? 'right-6' : 'left-6'}`}
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
                  Spider-Man encrypted a secret note in the web network!
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

        {/* Spider-Man Avatar Character Sprite */}
        <div
          onClick={handleClickSpiderman}
          className={`relative w-20 h-24 flex flex-col items-center justify-center group hover:scale-110 transition-transform ${
            isSwinging ? 'animate-wiggle' : ''
          }`}
          title="Click Spider-Man to decrypt his secret message! 🕷️"
        >
          {/* Upside Down Hanging Spider-Man (Top Positions) */}
          {(currentWaypoint.pose === 'hanging' || currentWaypoint.pose === 'swinging') ? (
            <div className="flex flex-col items-center transform rotate-180">
              {/* Head with Spider Mask & Big White Eyes */}
              <div className="relative w-12 h-14 bg-red-600 rounded-[50%_50%_45%_45%] border-2 border-black shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center justify-center overflow-hidden">
                {/* Web Pattern on Mask */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black" />
                  <div className="absolute inset-2 rounded-full border border-black" />
                </div>

                {/* Big Angled White Spidey Eyes with Black Borders */}
                <div className="relative z-10 flex justify-between w-9 px-0.5">
                  <div className="w-3.5 h-4.5 bg-white border-2 border-black rounded-[2px_12px_4px_12px] transform -rotate-12 shadow-inner" />
                  <div className="w-3.5 h-4.5 bg-white border-2 border-black rounded-[12px_2px_12px_4px] transform rotate-12 shadow-inner" />
                </div>
              </div>

              {/* Red & Blue Suit Body */}
              <div className="w-10 h-8 bg-red-600 border-2 border-black rounded-t-lg -mt-1 flex items-center justify-between px-1 relative">
                <div className="w-2 h-full bg-blue-600" />
                <div className="w-2.5 h-3 bg-black rounded-full" />
                <div className="w-2 h-full bg-blue-600" />
              </div>

              {/* Crossed Hanging Legs */}
              <div className="flex -mt-0.5">
                <div className="w-4 h-6 bg-blue-600 border border-black rounded-full transform -rotate-25" />
                <div className="w-4 h-6 bg-blue-600 border border-black rounded-full transform rotate-25" />
              </div>
            </div>
          ) : (
            /* Crouching / Wall-Crawling Spider-Man (Bottom & Side Positions) */
            <div className="flex flex-col items-center">
              {/* Head */}
              <div className="relative w-12 h-13 bg-red-600 rounded-[50%_50%_45%_45%] border-2 border-black shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black" />
                  <div className="absolute inset-2 rounded-full border border-black" />
                </div>
                <div className="relative z-10 flex justify-between w-9 px-0.5">
                  <div className="w-3.5 h-4.5 bg-white border-2 border-black rounded-[2px_12px_4px_12px] transform -rotate-12" />
                  <div className="w-3.5 h-4.5 bg-white border-2 border-black rounded-[12px_2px_12px_4px] transform rotate-12" />
                </div>
              </div>

              {/* Crouching Body & Arms */}
              <div className="relative w-14 h-8 flex items-center justify-center -mt-1">
                <div className="w-3.5 h-5 bg-red-600 border border-black rounded-full transform -rotate-45" />
                <div className="w-8 h-7 bg-red-600 border-2 border-black rounded-sm flex items-center justify-between px-1">
                  <div className="w-1.5 h-full bg-blue-600" />
                  <div className="w-2 h-2.5 bg-black rounded-full" />
                  <div className="w-1.5 h-full bg-blue-600" />
                </div>
                <div className="w-3.5 h-5 bg-red-600 border border-black rounded-full transform rotate-45" />
              </div>

              {/* Crouched Legs */}
              <div className="flex justify-between w-12 -mt-1">
                <div className="w-4 h-3.5 bg-blue-600 border border-black rounded-full" />
                <div className="w-4 h-3.5 bg-blue-600 border border-black rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
