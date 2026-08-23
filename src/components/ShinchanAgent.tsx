'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Sparkles, X, Check, Copy, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const SHINCHAN_SECRET_KEY = 'SHINCHAN-KEY-777';
const REVEALED_MESSAGE = 'Now you know how to decrypt. Enjoy encrypting with the website!';

export function ShinchanAgent() {
  const [posX, setPosX] = useState(80);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [turnCount, setTurnCount] = useState(0);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isWalking, setIsWalking] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isDancing, setIsDancing] = useState(false);

  // Interactive secret decryption state
  const [showBubble, setShowBubble] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [keyError, setKeyError] = useState(false);

  // Comedic sound effect
  const playSound = (type: 'beep' | 'success' | 'snore') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'snore') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  };

  // Roaming loop (Shinchan walks, takes turns, counts 2 rounds and falls asleep)
  useEffect(() => {
    const interval = setInterval(() => {
      // If user opened the interaction bubble or Shinchan is sleeping after 2 rounds, pause roaming
      if (showBubble || isSleeping) return;

      const rand = Math.random();

      if (rand < 0.15) {
        setIsWalking(false);
        setIsTyping(true);
      } else if (rand < 0.22) {
        setIsWalking(false);
        setIsTyping(false);
        setIsDancing(true);
        setTimeout(() => setIsDancing(false), 1000);
      } else {
        setIsWalking(true);
        setIsTyping(false);

        setPosX((prev) => {
          const maxW = typeof window !== 'undefined' ? window.innerWidth - 130 : 800;
          let step = 48;
          let nextX = direction === 'right' ? prev + step : prev - step;

          if (nextX >= maxW) {
            setDirection('left');
            nextX = maxW - 25;
            setTurnCount((tc) => {
              const nextTurns = tc + 1;
              // 4 turns = 2 full round trips
              if (nextTurns >= 4) {
                setIsSleeping(true);
                setIsWalking(false);
                setIsTyping(false);
              }
              return nextTurns;
            });
          } else if (nextX <= 30) {
            setDirection('right');
            nextX = 45;
            setTurnCount((tc) => {
              const nextTurns = tc + 1;
              if (nextTurns >= 4) {
                setIsSleeping(true);
                setIsWalking(false);
                setIsTyping(false);
              }
              return nextTurns;
            });
          }

          return nextX;
        });
      }
    }, 700);

    return () => clearInterval(interval);
  }, [direction, showBubble, isSleeping]);

  const handleClickShinchan = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If sleeping, wake up!
    if (isSleeping) {
      setIsSleeping(false);
      setTurnCount(0);
      playSound('beep');
      setShowBubble(true);
      return;
    }

    playSound('beep');
    setShowBubble(true);
  };

  const handleCopyKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(SHINCHAN_SECRET_KEY);
      setIsCopied(true);
      setInputKey(SHINCHAN_SECRET_KEY);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      setInputKey(SHINCHAN_SECRET_KEY);
    }
  };

  const handleDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().toUpperCase() === SHINCHAN_SECRET_KEY) {
      playSound('success');
      setIsDecrypted(true);
      setKeyError(false);
      setIsDancing(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: {
          x: Math.min(Math.max(posX / (typeof window !== 'undefined' ? window.innerWidth : 1000), 0.1), 0.9),
          y: 0.85
        },
        colors: ['#c084fc', '#a855f7', '#38bdf8', '#f43f5e']
      });
    } else {
      setKeyError(true);
    }
  };

  const handleResetDecryption = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDecrypted(false);
    setInputKey('');
    setKeyError(false);
  };

  return (
    <div
      className="fixed bottom-3 z-40 transition-all duration-700 ease-linear select-none"
      style={{
        left: `${posX}px`
        // NOTE: Outer container is NEVER transformed/scaled so text is NEVER reversed!
      }}
    >
      {/* Speech Bubble (Always rendered normally without mirroring) */}
      {showBubble && (
        <div
          className="absolute -top-52 sm:-top-56 left-1/2 -translate-x-1/2 w-72 sm:w-80 p-4 rounded-2xl bg-[#17132a] text-[#f5f3ff] border-2 border-purple-400 shadow-[0_16px_48px_rgba(0,0,0,0.8)] animate-scale-in text-left z-50 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Light Purple Arrow Pointing to Shinchan */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#17132a] border-r-2 border-b-2 border-purple-400 rotate-45" />

          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/25 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span className="text-xs font-black text-purple-200 uppercase tracking-wider font-mono">
                Shin-chan&apos;s Secret Key
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
            /* Interactive Decryption Prompt */
            <div className="space-y-3">
              <p className="text-[11px] text-purple-200/90 leading-tight">
                Shin-chan encrypted a secret message! Paste the key below to decrypt:
              </p>

              {/* Secret Key Badge with Copy Action */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-300">
                <span className="font-bold tracking-wider">{SHINCHAN_SECRET_KEY}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>

              {/* Decrypt Input Form */}
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
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Decrypt</span>
                  </button>
                </div>

                {keyError && (
                  <p className="text-[10px] text-rose-400 font-mono">
                    ⚠️ Invalid key. Copy & paste: {SHINCHAN_SECRET_KEY}
                  </p>
                )}
              </form>
            </div>
          ) : (
            /* Decrypted Message Result */
            <div className="space-y-3 animate-scale-in">
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-400/40 text-left space-y-1">
                <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Message Decrypted Locally</span>
                </div>
                <p className="text-xs font-bold text-white leading-relaxed pt-0.5">
                  &ldquo;{REVEALED_MESSAGE}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-purple-300">
                  🎉 Decryption complete!
                </span>
                <button
                  type="button"
                  onClick={handleResetDecryption}
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

      {/* Shinchan Character (Only this sub-element flips direction, keeping bubble un-mirrored) */}
      <div
        onClick={handleClickShinchan}
        style={{
          transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
        }}
        className="cursor-pointer group select-none"
      >
        {isSleeping ? (
          /* Shinchan Lying Down Sleeping State after 2 rounds */
          <div className="relative w-24 h-14 flex items-end justify-center animate-pulse">
            {/* Floating Zzz */}
            <div className="absolute -top-7 right-2 text-purple-300 font-bold font-mono text-xs animate-bounce pointer-events-none">
              Zzz... 😴
            </div>

            {/* Sleeping Body Lying Down on Floor */}
            <div className="relative flex items-center">
              {/* Head with sleepy closed eyes */}
              <div className="w-12 h-9 bg-[#ffd7b5] rounded-[45%_45%_50%_50%] border-2 border-black relative flex items-center justify-center p-0.5">
                {/* Hair */}
                <div className="absolute -left-1 w-3 h-8 bg-black rounded-l-md" />
                {/* Closed sleepy eyes */}
                <div className="flex gap-2">
                  <div className="w-2.5 h-0.5 bg-black rounded-full" />
                  <div className="w-2.5 h-0.5 bg-black rounded-full" />
                </div>
                {/* Rosy Cheek */}
                <div className="absolute bottom-1 right-2 w-2 h-1.5 bg-pink-400/80 rounded-full" />
              </div>

              {/* Red Shirt Body lying flat */}
              <div className="w-10 h-7 bg-red-600 border-2 border-black -ml-1 rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-3 bg-purple-300 rounded-sm" />
              </div>

              {/* Yellow Shorts */}
              <div className="w-6 h-6 bg-purple-300 border-2 border-black -ml-0.5 rounded-r-md" />

              {/* Feet tucked */}
              <div className="w-3 h-3 bg-[#ffd7b5] border border-black rounded-full -ml-0.5" />
            </div>

            {/* Resting Cyber Laptop Beside Him */}
            <div className="absolute -left-2 bottom-0 w-6 h-4 bg-slate-900 border border-purple-400 rounded-sm p-0.5 shadow-sm">
              <div className="w-full h-2 bg-purple-950 rounded-[1px] flex items-center justify-center">
                <span className="text-[5px] font-mono text-purple-300">Zz</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Walking / Standing / Typing Shinchan Avatar */
          <div
            className={`relative w-20 h-22 flex flex-col items-center justify-end group-hover:scale-105 transition-transform ${
              isDancing ? 'animate-wiggle' : isWalking ? 'animate-walk' : ''
            }`}
          >
            {/* Sunglasses */}
            <div className="absolute top-2.5 z-20 flex gap-1">
              <div className="w-4 h-2.5 bg-black rounded-sm border border-purple-300 shadow-sm" />
              <div className="w-1.5 h-0.5 bg-black mt-1" />
              <div className="w-4 h-2.5 bg-black rounded-sm border border-purple-300 shadow-sm" />
            </div>

            {/* Shinchan Face & Cheeks */}
            <div className="relative w-16 h-12 bg-[#ffd7b5] rounded-[50%_50%_45%_45%] border-2 border-black shadow-md flex flex-col items-center justify-between p-1 z-10">
              <div className="absolute -top-2.5 w-15 h-5 bg-black rounded-[50%_50%_20%_20%]" />

              {/* Eyebrows */}
              <div className="flex justify-between w-11 mt-1 z-10">
                <div className="w-4 h-1.5 bg-black rounded-full transform -rotate-12" />
                <div className="w-4 h-1.5 bg-black rounded-full transform rotate-12" />
              </div>

              {/* Sparkle Eyes */}
              <div className="flex justify-between w-9 mt-0.5 z-10">
                <div className="w-2.5 h-3 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
                </div>
                <div className="w-2.5 h-3 bg-black rounded-full relative flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
                </div>
              </div>

              {/* Grin & Rosy Cheeks */}
              <div className="w-full flex items-center justify-between px-1 -mt-1">
                <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
                <div className="w-3 h-1.5 border-b-2 border-black rounded-full" />
                <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
              </div>
            </div>

            {/* Red Shirt Body */}
            <div className="relative w-12 h-8 bg-red-600 border-2 border-black rounded-t-lg -mt-1 z-10 flex items-center justify-center">
              <div className="w-2 h-4 bg-purple-300 border border-black rounded-sm" />
            </div>

            {/* Light Purple Shorts */}
            <div className="w-11 h-4 bg-purple-300 border-2 border-black -mt-0.5 z-10 flex justify-around">
              <div className="w-3.5 h-full border-r border-black" />
            </div>

            {/* Feet */}
            <div className="flex justify-between w-8 -mt-0.5 z-0">
              <div className="w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full" />
              <div className="w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full" />
            </div>

            {/* Glowing Cyber Laptop */}
            <div className="absolute -right-3 bottom-4 z-30 flex items-center justify-center transform -rotate-12 group-hover:scale-110 transition-transform">
              <div className="w-7 h-5 bg-slate-900 border border-purple-400 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.8)] p-0.5 flex flex-col items-center justify-between">
                <div className="w-full h-3 bg-purple-950 rounded-[1px] flex items-center justify-center overflow-hidden">
                  <span className="text-[6px] font-mono text-purple-300 font-bold leading-none animate-pulse">
                    {isTyping ? '0101' : 'CIPH'}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-700 rounded-[1px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
