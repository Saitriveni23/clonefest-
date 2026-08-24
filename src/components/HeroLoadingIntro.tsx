'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

interface HeroLoadingIntroProps {
  onComplete: () => void;
}

export function HeroLoadingIntro({ onComplete }: HeroLoadingIntroProps) {
  const [activeFrame, setActiveFrame] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Fast automatic progression through 5 frames
    const t1 = setTimeout(() => setActiveFrame(2), 500);
    const t2 = setTimeout(() => setActiveFrame(3), 1000);
    const t3 = setTimeout(() => setActiveFrame(4), 1500);
    const t4 = setTimeout(() => setActiveFrame(5), 2000);
    const t5 = setTimeout(() => setIsFadingOut(true), 2700);
    const t6 = setTimeout(() => {
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onCompleteRef.current();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070811] text-[#f0f0ff] p-4 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cybernetic Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-[80px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 text-center space-y-1 mb-6 sm:mb-10">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/40">
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase">
            CIPHER<span className="text-purple-400 font-black">DROP</span> • <span className="text-[#9b9bbf] font-normal">ANIMATIONS</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#9b9bbf] font-medium">
          Privacy in Motion. Security in Every Frame.
        </p>
      </div>

      {/* Main Display Stage for Current Frame */}
      <div className="relative z-10 w-full max-w-lg mb-6">
        <div className="rounded-3xl p-8 border border-purple-500/25 bg-[#0e1020]/90 backdrop-blur-2xl shadow-2xl shadow-purple-900/40 flex flex-col items-center justify-center min-h-[260px]">
          
          {/* FRAME 1: INIT */}
          {activeFrame === 1 && (
            <div className="flex flex-col items-center space-y-4 animate-scale-in">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-20 h-20 text-purple-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeDasharray="3 3" className="animate-pulse" />
                </svg>
                <div className="absolute w-2 h-2 rounded-full bg-purple-400/60 animate-ping" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-purple-400/80 tracking-widest uppercase">
                  1. INIT
                </span>
                <p className="text-[11px] text-[#9b9bbf]">Initializing cryptographic sandbox...</p>
              </div>
            </div>
          )}

          {/* FRAME 2: DROP IMPACT */}
          {activeFrame === 2 && (
            <div className="flex flex-col items-center space-y-4 animate-scale-in">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-20 h-20 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <div className="absolute -bottom-1 w-16 h-3 rounded-full bg-purple-500/50 blur-sm animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-purple-300 tracking-widest uppercase">
                  2. DROP IMPACT
                </span>
                <p className="text-[11px] text-[#9b9bbf]">Zero-knowledge secret payload anchored...</p>
              </div>
            </div>
          )}

          {/* FRAME 3: RIPPLE EXPAND */}
          {activeFrame === 3 && (
            <div className="flex flex-col items-center space-y-4 animate-scale-in">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute w-24 h-10 rounded-full border-2 border-purple-500/70 animate-ping" style={{ animationDuration: '1.2s' }} />
                <div className="absolute w-16 h-6 rounded-full border border-purple-400/80 animate-pulse" />
                <svg className="w-20 h-20 text-purple-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.9)] relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-indigo-300 tracking-widest uppercase">
                  3. RIPPLE EXPAND
                </span>
                <p className="text-[11px] text-[#9b9bbf]">Diffusing local entropy into key derivation...</p>
              </div>
            </div>
          )}

          {/* FRAME 4: ENCRYPTION FORMING */}
          {activeFrame === 4 && (
            <div className="flex flex-col items-center space-y-4 animate-scale-in">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-purple-400/60 animate-spin" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-2 rounded-full border border-dotted border-teal-400/40 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                
                <div className="absolute top-0 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                <div className="absolute bottom-0 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                <div className="absolute left-0 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                <div className="absolute right-0 w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />

                <svg className="w-18 h-18 text-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,1)] relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-teal-300 tracking-widest uppercase">
                  4. ENCRYPTION FORMING
                </span>
                <p className="text-[11px] text-[#9b9bbf]">Forming 256-bit Galois/Counter Mode cipher...</p>
              </div>
            </div>
          )}

          {/* FRAME 5: READY */}
          {activeFrame === 5 && (
            <div className="flex flex-col items-center space-y-4 animate-scale-in">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-xl animate-pulse" />
                <svg className="w-22 h-22 text-purple-300 drop-shadow-[0_0_35px_rgba(168,85,247,1)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#0e1020]" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black tracking-widest text-white uppercase">
                  CIPHER<span className="text-purple-400">DROP</span>
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frame Step Carousel Bar */}
      <div className="relative z-10 w-full max-w-3xl">
        <div className="text-[11px] font-mono font-bold text-[#9b9bbf] uppercase tracking-wider mb-2.5 text-center sm:text-left">
          1. HERO LOADING ANIMATION
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {[
            { frame: 1, title: '1. INIT' },
            { frame: 2, title: '2. DROP IMPACT' },
            { frame: 3, title: '3. RIPPLE EXPAND' },
            { frame: 4, title: '4. ENCRYPTION FORMING' },
            { frame: 5, title: '5. READY' },
          ].map(item => (
            <button
              key={item.frame}
              type="button"
              onClick={() => setActiveFrame(item.frame as any)}
              className={`p-2.5 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[85px] sm:min-h-[100px] ${
                activeFrame === item.frame
                  ? 'border-purple-500/80 bg-purple-600/20 shadow-lg shadow-purple-600/30 scale-105'
                  : 'border-white/5 bg-black/40 hover:border-purple-500/30 hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${activeFrame === item.frame ? 'text-purple-300' : 'text-[#5c5c80]'}`} viewBox="0 0 24 24" fill={item.frame >= 2 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-tight mt-1 ${
                activeFrame === item.frame ? 'text-white' : 'text-[#9b9bbf]'
              }`}>
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="relative z-10 mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
      >
        <span>Enter CipherDrop</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
