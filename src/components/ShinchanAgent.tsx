'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FunnySecret {
  title: string;
  quote: string;
  mission: string;
}

const SHINCHAN_SECRETS: FunnySecret[] = [
  {
    title: 'CHOCOBI HEIST 🍫',
    quote: 'Hehehe! Mom hid the Chocobi behind the green bell peppers... BUT I OUTSMARTED HER!',
    mission: 'Objective: Eat all 3 boxes before Misae finds out.'
  },
  {
    title: 'ACTION KAMEN INTEL ⚡',
    quote: 'ACTION BEAAAMMM! 💥 Action Kamen said clean code compiles on the first try!',
    mission: 'Secret Passkey: ActionKamenBeam999! 🤫'
  },
  {
    title: 'SUPER HACKER SHINCHAN 💻',
    quote: 'Fridge lock mainframe breached! Obtained: 1 pudding cup and half a sausage.',
    mission: 'Blame Shiro if Mom gets mad 🐶.'
  },
  {
    title: 'BURI BURI CIPHER 🐷',
    quote: 'Buriburi Zaemon will protect your files... for 10 billion million yen!',
    mission: 'Will run away if things get dangerous 🏃‍♂️'
  },
  {
    title: 'LETTER TO NANAKO 💌',
    quote: 'Nanako-oneesan... when I grow up with a real laptop, let\'s eat natto together! ❤️',
    mission: 'Keep this away from Kazama-kun!'
  },
  {
    title: 'MOM RAGE ALERT 🚨',
    quote: 'Mom saw my drawing on her dress with marker... Head-drill protocol imminent!',
    mission: 'Hide in the laundry basket immediately!'
  }
];

export function ShinchanAgent() {
  const [posX, setPosX] = useState(80);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isWalking, setIsWalking] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showSecretBubble, setShowSecretBubble] = useState(false);
  const [currentSecretIndex, setCurrentSecretIndex] = useState(0);
  const [isDancing, setIsDancing] = useState(false);

  // Comedic sound effect
  const playFunnySound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // Fast Roaming loop
  useEffect(() => {
    const interval = setInterval(() => {
      // If user opened the speech bubble above Shinchan, pause movement temporarily so user can read
      if (showSecretBubble) return;

      const rand = Math.random();

      if (rand < 0.18) {
        // Brief typing on laptop
        setIsWalking(false);
        setIsTyping(true);
      } else if (rand < 0.28) {
        // Quick dance
        setIsWalking(false);
        setIsTyping(false);
        setIsDancing(true);
        setTimeout(() => setIsDancing(false), 1200);
      } else {
        // Fast walking
        setIsWalking(true);
        setIsTyping(false);

        setPosX((prev) => {
          const maxW = typeof window !== 'undefined' ? window.innerWidth - 130 : 800;
          let step = 48;
          let nextX = direction === 'right' ? prev + step : prev - step;

          if (nextX > maxW) {
            setDirection('left');
            nextX = maxW - 30;
          } else if (nextX < 30) {
            setDirection('right');
            nextX = 50;
          }

          return nextX;
        });
      }
    }, 750);

    return () => clearInterval(interval);
  }, [direction, showSecretBubble]);

  const handleClickShinchan = (e: React.MouseEvent) => {
    e.stopPropagation();
    playFunnySound();
    confetti({
      particleCount: 35,
      spread: 60,
      origin: {
        x: Math.min(Math.max(posX / (typeof window !== 'undefined' ? window.innerWidth : 1000), 0.1), 0.9),
        y: 0.85
      },
      colors: ['#ef4444', '#facc15', '#a855f7', '#38bdf8', '#22c55e']
    });

    setCurrentSecretIndex(prev => (prev + 1) % SHINCHAN_SECRETS.length);
    setShowSecretBubble(true);
  };

  const handleNextSecret = (e: React.MouseEvent) => {
    e.stopPropagation();
    playFunnySound();
    setCurrentSecretIndex(prev => (prev + 1) % SHINCHAN_SECRETS.length);
  };

  const handleCloseBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSecretBubble(false);
  };

  const secret = SHINCHAN_SECRETS[currentSecretIndex];

  return (
    <div
      className="fixed bottom-3 z-40 transition-all duration-700 ease-linear select-none"
      style={{
        left: `${posX}px`,
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
      }}
    >
      {/* Comic Speech Bubble Directly Above Shinchan's Head */}
      {showSecretBubble && (
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#131124] text-white border-2 border-yellow-400 shadow-[0_12px_36px_rgba(0,0,0,0.8)] animate-scale-in text-left z-50 cursor-default"
          style={{
            transform: direction === 'left' ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bubble Pointer Arrow pointing directly to Shinchan's head */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#131124] border-r-2 border-b-2 border-yellow-400 rotate-45" />

          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-yellow-400/20 mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-[11px] font-black text-yellow-300 tracking-wider uppercase font-mono">
                {secret.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNextSecret}
                className="px-2 py-0.5 rounded-md bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Next Secret"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Next</span>
              </button>
              <button
                type="button"
                onClick={handleCloseBubble}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-[#9b9bbf] hover:text-white cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quote & Mission */}
          <p className="text-xs font-semibold text-[#fef08a] italic leading-snug">
            &ldquo;{secret.quote}&rdquo;
          </p>

          <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-[#9b9bbf] flex items-center justify-between">
            <span className="truncate pr-1 text-purple-300 font-mono">
              💡 {secret.mission}
            </span>
            <span className="text-[9px] font-bold text-yellow-400/80 font-mono shrink-0">
              TOP SECRET
            </span>
          </div>
        </div>
      )}

      {/* Shinchan Character Sprite Avatar with Laptop */}
      <div
        onClick={handleClickShinchan}
        className={`relative w-20 h-22 flex flex-col items-center justify-end cursor-pointer group hover:scale-105 transition-transform ${
          isDancing ? 'animate-wiggle' : isWalking ? 'animate-walk' : ''
        }`}
        title="Click Secret Agent Shin-chan for classified snacks!"
      >
        {/* Secret Agent Sunglasses */}
        <div className="absolute top-2.5 z-20 flex gap-1">
          <div className="w-4 h-2.5 bg-black rounded-sm border border-yellow-300 shadow-sm" />
          <div className="w-1.5 h-0.5 bg-black mt-1" />
          <div className="w-4 h-2.5 bg-black rounded-sm border border-yellow-300 shadow-sm" />
        </div>

        {/* Shinchan Face & Iconic Big Cheeks */}
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

          {/* Cheeky Grin & Rosy Cheeks */}
          <div className="w-full flex items-center justify-between px-1 -mt-1">
            <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
            <div className="w-3 h-1.5 border-b-2 border-black rounded-full" />
            <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
          </div>
        </div>

        {/* Red Shirt Body */}
        <div className="relative w-12 h-8 bg-red-600 border-2 border-black rounded-t-lg -mt-1 z-10 flex items-center justify-center">
          <div className="w-2 h-4 bg-yellow-400 border border-black rounded-sm" />
        </div>

        {/* Yellow Shorts */}
        <div className="w-11 h-4 bg-yellow-400 border-2 border-black -mt-0.5 z-10 flex justify-around">
          <div className="w-3.5 h-full border-r border-black" />
        </div>

        {/* Little Feet */}
        <div className="flex justify-between w-8 -mt-0.5 z-0">
          <div className="w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full" />
          <div className="w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full" />
        </div>

        {/* Glowing Cyber Laptop */}
        <div className="absolute -right-3 bottom-4 z-30 flex items-center justify-center transform -rotate-12 group-hover:scale-110 transition-transform">
          <div className="w-7 h-5 bg-slate-900 border border-purple-400 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.8)] p-0.5 flex flex-col items-center justify-between">
            <div className="w-full h-3 bg-purple-950 rounded-[1px] flex items-center justify-center overflow-hidden">
              <span className="text-[6px] font-mono text-emerald-400 font-bold leading-none animate-pulse">
                {isTyping ? '0101' : 'CHOC'}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
