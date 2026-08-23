'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SPIDEY_SECRET_KEY = 'SPIDEY-WEB-999';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website! 🕷️🕸️';

// 4 Corner Waypoints
interface Waypoint {
  name: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  top: string;
  left: string;
  pose: 'hanging' | 'swinging' | 'crawling' | 'crouching';
  webAnchor: { x: string; y: string };
}

export function SpidermanAgent() {
  const [currentCornerIndex, setCurrentCornerIndex] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [keyError, setKeyError] = useState(false);

  const waypoints: Waypoint[] = [
    {
      name: 'top-left',
      top: '30px',
      left: '35px',
      pose: 'hanging',
      webAnchor: { x: '0px', y: '0px' }
    },
    {
      name: 'top-right',
      top: '30px',
      left: 'calc(100vw - 115px)',
      pose: 'swinging',
      webAnchor: { x: '100vw', y: '0px' }
    },
    {
      name: 'bottom-right',
      top: 'calc(100vh - 130px)',
      left: 'calc(100vw - 115px)',
      pose: 'crawling',
      webAnchor: { x: '100vw', y: '100vh' }
    },
    {
      name: 'bottom-left',
      top: 'calc(100vh - 130px)',
      left: '35px',
      pose: 'crouching',
      webAnchor: { x: '0px', y: '100vh' }
    }
  ];

  // Web-shooter "THWIP!" sound synthesizer
  const playThwipSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // High-frequency fast noise burst (Web shooter "Thwip!")
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

  // Roam around the 4 corners in sequence every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (showBubble) return;

      setIsSwinging(true);
      playThwipSound();

      setTimeout(() => {
        setCurrentCornerIndex((prev) => (prev + 1) % waypoints.length);
        setIsSwinging(false);
      }, 1800);
    }, 4800);

    return () => clearInterval(interval);
  }, [showBubble, waypoints.length]);

  const currentWaypoint = waypoints[currentCornerIndex];

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
      {/* 4-CORNER GLOWING SPIDER WEBS FILLING THE APP                             */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
        {/* Top-Left Corner Web */}
        <svg
          className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 text-purple-400/25 drop-shadow-[0_0_12px_rgba(192,132,252,0.4)]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {/* Radial strands */}
          <line x1="0" y1="0" x2="200" y2="0" />
          <line x1="0" y1="0" x2="190" y2="60" />
          <line x1="0" y1="0" x2="160" y2="120" />
          <line x1="0" y1="0" x2="120" y2="160" />
          <line x1="0" y1="0" x2="60" y2="190" />
          <line x1="0" y1="0" x2="0" y2="200" />
          {/* Concentric arcs */}
          <path d="M 40 0 Q 38 12 32 24 Q 24 32 12 38 Q 0 40 0 40" />
          <path d="M 80 0 Q 76 24 64 48 Q 48 64 24 76 Q 0 80 0 80" />
          <path d="M 120 0 Q 114 36 96 72 Q 72 96 36 114 Q 0 120 0 120" />
          <path d="M 160 0 Q 152 48 128 96 Q 96 128 48 152 Q 0 160 0 160" />
          <path d="M 200 0 Q 190 60 160 120 Q 120 160 60 190 Q 0 200 0 200" />
        </svg>

        {/* Top-Right Corner Web */}
        <svg
          className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 text-purple-400/25 drop-shadow-[0_0_12px_rgba(192,132,252,0.4)] transform scale-x-[-1]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <line x1="0" y1="0" x2="200" y2="0" />
          <line x1="0" y1="0" x2="190" y2="60" />
          <line x1="0" y1="0" x2="160" y2="120" />
          <line x1="0" y1="0" x2="120" y2="160" />
          <line x1="0" y1="0" x2="60" y2="190" />
          <line x1="0" y1="0" x2="0" y2="200" />
          <path d="M 40 0 Q 38 12 32 24 Q 24 32 12 38 Q 0 40 0 40" />
          <path d="M 80 0 Q 76 24 64 48 Q 48 64 24 76 Q 0 80 0 80" />
          <path d="M 120 0 Q 114 36 96 72 Q 72 96 36 114 Q 0 120 0 120" />
          <path d="M 160 0 Q 152 48 128 96 Q 96 128 48 152 Q 0 160 0 160" />
          <path d="M 200 0 Q 190 60 160 120 Q 120 160 60 190 Q 0 200 0 200" />
        </svg>

        {/* Bottom-Left Corner Web */}
        <svg
          className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 text-purple-400/25 drop-shadow-[0_0_12px_rgba(192,132,252,0.4)] transform scale-y-[-1]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <line x1="0" y1="0" x2="200" y2="0" />
          <line x1="0" y1="0" x2="190" y2="60" />
          <line x1="0" y1="0" x2="160" y2="120" />
          <line x1="0" y1="0" x2="120" y2="160" />
          <line x1="0" y1="0" x2="60" y2="190" />
          <line x1="0" y1="0" x2="0" y2="200" />
          <path d="M 40 0 Q 38 12 32 24 Q 24 32 12 38 Q 0 40 0 40" />
          <path d="M 80 0 Q 76 24 64 48 Q 48 64 24 76 Q 0 80 0 80" />
          <path d="M 120 0 Q 114 36 96 72 Q 72 96 36 114 Q 0 120 0 120" />
          <path d="M 160 0 Q 152 48 128 96 Q 96 128 48 152 Q 0 160 0 160" />
          <path d="M 200 0 Q 190 60 160 120 Q 120 160 60 190 Q 0 200 0 200" />
        </svg>

        {/* Bottom-Right Corner Web */}
        <svg
          className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 text-purple-400/25 drop-shadow-[0_0_12px_rgba(192,132,252,0.4)] transform scale-x-[-1] scale-y-[-1]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <line x1="0" y1="0" x2="200" y2="0" />
          <line x1="0" y1="0" x2="190" y2="60" />
          <line x1="0" y1="0" x2="160" y2="120" />
          <line x1="0" y1="0" x2="120" y2="160" />
          <line x1="0" y1="0" x2="60" y2="190" />
          <line x1="0" y1="0" x2="0" y2="200" />
          <path d="M 40 0 Q 38 12 32 24 Q 24 32 12 38 Q 0 40 0 40" />
          <path d="M 80 0 Q 76 24 64 48 Q 48 64 24 76 Q 0 80 0 80" />
          <path d="M 120 0 Q 114 36 96 72 Q 72 96 36 114 Q 0 120 0 120" />
          <path d="M 160 0 Q 152 48 128 96 Q 96 128 48 152 Q 0 160 0 160" />
          <path d="M 200 0 Q 190 60 160 120 Q 120 160 60 190 Q 0 200 0 200" />
        </svg>

        {/* Perimeter Neon Cyber Web Traces */}
        <div className="absolute inset-0 border border-purple-500/10" />
      </div>

      {/* ========================================================================= */}
      {/* SPIDER-MAN ROAMING THE 4 CORNERS                                          */}
      {/* ========================================================================= */}
      <div
        className="fixed z-40 select-none cursor-pointer transition-all duration-[1800ms] ease-in-out"
        style={{
          top: currentWaypoint.top,
          left: currentWaypoint.left
        }}
      >
        {/* Dynamic Hanging Web Line attached to ceiling/corner */}
        {(currentWaypoint.pose === 'hanging' || currentWaypoint.pose === 'swinging') && (
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1.5px] h-32 bg-gradient-to-b from-purple-400/40 via-white/80 to-white shadow-[0_0_8px_#c084fc] pointer-events-none" />
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
                  Your friendly neighborhood Spider-Man encrypted a secret note in the web!
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
          {/* Upside Down Hanging Spider-Man (Top Corners) */}
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
                {/* Blue Side Panels */}
                <div className="w-2 h-full bg-blue-600" />
                {/* Chest Spider Emblem */}
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
            /* Crouching / Wall-Crawling Spider-Man (Bottom Corners) */
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
                {/* Left Arm on ground */}
                <div className="w-3.5 h-5 bg-red-600 border border-black rounded-full transform -rotate-45" />
                {/* Torso */}
                <div className="w-8 h-7 bg-red-600 border-2 border-black rounded-sm flex items-center justify-between px-1">
                  <div className="w-1.5 h-full bg-blue-600" />
                  <div className="w-2 h-2.5 bg-black rounded-full" />
                  <div className="w-1.5 h-full bg-blue-600" />
                </div>
                {/* Right Arm shooting web */}
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
