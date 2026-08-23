'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Laugh, ShieldAlert, Laptop, Lock, RefreshCw, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FunnySecret {
  title: string;
  quote: string;
  mission: string;
  mood: string;
  action: string;
}

const SHINCHAN_SECRETS: FunnySecret[] = [
  {
    title: 'OPERATION: CHOCOBI HEIST 🍫',
    quote: '"Hehehe! Mom hid the royal Chocobi stash behind the green bell peppers because she knows I will never look there... BUT I OUTSMARTED HER!"',
    mission: 'Objective: Retrieve 3 boxes of Chocobi without triggering Mom\'s (Misae) supersonic ear-pull jutsu.',
    mood: 'Level: S-Rank Sneak 🥷',
    action: 'Buri Buri Stealth Mode Activated!'
  },
  {
    title: 'DECRYPTED ACTION KAMEN INTEL ⚡',
    quote: '"ACTION BEAAAMMM! 💥 Wahahaha! Action Kamen told me that if you write clean code and don\'t leave bugs, you get extra dessert!"',
    mission: 'Secret: The strongest password in the world is: ActionKamenBeam999! (Don\'t tell Himawari!)',
    mood: 'Power: 99,999 Kamen Energy',
    action: 'Action Kamen Pose!'
  },
  {
    title: 'SUPER HACKER SHINCHAN REPORT 💻',
    quote: '"I successfully breached the mainframe of the refrigerator door lock! The payload obtained: 1 strawberry pudding cup and half a sausage."',
    mission: 'Counter-Measure: If Mom asks, blame Shiro. Good boy Shiro will take one for the team 🐶.',
    mood: 'Status: Fridge Breached 🍮',
    action: 'Typing 240 WPM on toy laptop'
  },
  {
    title: 'THE LEGENDARY BURI BURI CIPHER 🐷',
    quote: '"I am the heroic pig Buriburi Zaemon! I will protect your encrypted files... for the small fee of 10 billion million yen! Also I only fight on the winning side!"',
    mission: 'Terms: Payment must be upfront in Chocobi or shiny golden coins.',
    mood: 'Loyalty: 0% (Will run away)',
    action: 'Drawing sword and running away'
  },
  {
    title: 'CLASSIFIED LOVE LETTER TO NANAKO-ONEESAN 💌',
    quote: '"Dear Nanako-oneesan... when I grow up and become a cyber secret agent with a real laptop, let\'s eat natto with scallions together forever! ❤️"',
    mission: 'Top Secret: Kazama-kun must NEVER find this draft or he will call it immature.',
    mood: 'Heart Rate: 300 BPM 🥰',
    action: 'Blushing furiously & wiggling'
  },
  {
    title: 'WARNING: MOM RAGE DETECTION 🚨',
    quote: '"ALERT! Mom discovered the drawing I made on her favorite dress with permanent marker... I told her it was abstract art but she is preparing the head-drill!"',
    mission: 'Emergency Protocol: Hide in the laundry basket or pretend to be asleep immediately!',
    mood: 'Threat Level: APOCALYPTIC 🏃‍♂️💨',
    action: 'Running in circles'
  }
];

export function ShinchanAgent() {
  const [posX, setPosX] = useState(60);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isWalking, setIsWalking] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showClickBubble, setShowClickBubble] = useState(false);
  const [clickMessage, setClickMessage] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [currentSecretIndex, setCurrentSecretIndex] = useState(0);
  const [isDancing, setIsDancing] = useState(false);

  const funnyChowMessages = [
    "CHOW TIME! 🍫 Chocobi biscuits successfully encrypted!",
    "Oho! You caught Secret Agent Nohara! 🕵️‍♂️",
    "ACTION BEAM! ⚡ 99,999 Kamen Energy activated!",
    "Buri Buri Buri Buri~ 🍑 Decrypting secret snacks!",
    "Don't tell Mom (Misae) I'm using her laptop! 🤫",
    "Shiro says 'Woof!' (Translation: Code is 100% secure) 🐶"
  ];

  // Synthesize a fun comedic beep sound using Web Audio API
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

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // Fast Roaming loop (650ms ticker)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOpenModal) return;

      const rand = Math.random();

      if (rand < 0.15) {
        // Brief typing on laptop
        setIsWalking(false);
        setIsTyping(true);
      } else if (rand < 0.22) {
        // Quick dance
        setIsWalking(false);
        setIsTyping(false);
        setIsDancing(true);
        setTimeout(() => setIsDancing(false), 1200);
      } else {
        // Fast walking across screen
        setIsWalking(true);
        setIsTyping(false);

        setPosX((prev) => {
          const maxW = typeof window !== 'undefined' ? window.innerWidth - 120 : 800;
          let step = 48; // Faster, larger steps
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
  }, [direction, isOpenModal]);

  const handleClickShinchan = () => {
    playFunnySound();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: {
        x: Math.min(Math.max(posX / (typeof window !== 'undefined' ? window.innerWidth : 1000), 0.1), 0.9),
        y: 0.85
      },
      colors: ['#ef4444', '#facc15', '#a855f7', '#38bdf8', '#22c55e']
    });

    const chosenChow = funnyChowMessages[Math.floor(Math.random() * funnyChowMessages.length)];
    setClickMessage(chosenChow);
    setShowClickBubble(true);

    setCurrentSecretIndex(Math.floor(Math.random() * SHINCHAN_SECRETS.length));
    setIsOpenModal(true);
  };

  const handleNextSecret = () => {
    playFunnySound();
    setCurrentSecretIndex((prev) => (prev + 1) % SHINCHAN_SECRETS.length);
    const chosenChow = funnyChowMessages[Math.floor(Math.random() * funnyChowMessages.length)];
    setClickMessage(chosenChow);
  };

  const secret = SHINCHAN_SECRETS[currentSecretIndex];

  return (
    <>
      {/* Fast Roaming Shinchan */}
      <div
        className="fixed bottom-3 z-40 transition-all duration-700 ease-linear select-none cursor-pointer group"
        style={{
          left: `${posX}px`,
          transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
        }}
        onClick={handleClickShinchan}
      >
        {/* Floating Comic Speech Bubble (Appears only after clicking / on hover prompt) */}
        {showClickBubble && (
          <div
            className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3.5 py-1.5 rounded-full bg-yellow-400 text-black font-black text-xs shadow-2xl border-2 border-black animate-bounce group-hover:scale-105 transition-transform pointer-events-none"
            style={{
              transform: direction === 'left' ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)'
            }}
          >
            {clickMessage}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-yellow-400 border-r-2 border-b-2 border-black rotate-45" />
          </div>
        )}

        {/* Shinchan Character Sprite Avatar with Laptop */}
        <div className={`relative w-20 h-22 flex flex-col items-center justify-end ${isDancing ? 'animate-wiggle' : isWalking ? 'animate-walk' : ''}`}>
          
          {/* Secret Agent Sunglasses (Toggle on hover / active) */}
          <div className="absolute top-2.5 z-20 flex gap-1">
            <div className="w-4 h-2.5 bg-black rounded-sm border border-yellow-300 shadow-sm" />
            <div className="w-1.5 h-0.5 bg-black mt-1" />
            <div className="w-4 h-2.5 bg-black rounded-sm border border-yellow-300 shadow-sm" />
          </div>

          {/* Shinchan Face & Iconic Big Cheeks */}
          <div className="relative w-16 h-12 bg-[#ffd7b5] rounded-[50%_50%_45%_45%] border-2 border-black shadow-md flex flex-col items-center justify-between p-1 z-10">
            {/* Black iconic cropped hair */}
            <div className="absolute -top-2.5 w-15 h-5 bg-black rounded-[50%_50%_20%_20%]" />
            
            {/* Expressive big Shinchan eyebrows */}
            <div className="flex justify-between w-11 mt-1 z-10">
              <div className="w-4 h-1.5 bg-black rounded-full transform -rotate-12" />
              <div className="w-4 h-1.5 bg-black rounded-full transform rotate-12" />
            </div>

            {/* Big sparkle eyes */}
            <div className="flex justify-between w-9 mt-0.5 z-10">
              <div className="w-2.5 h-3 bg-black rounded-full relative flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
              <div className="w-2.5 h-3 bg-black rounded-full relative flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
            </div>

            {/* Cheeky grin & Rosy Cheeks */}
            <div className="w-full flex items-center justify-between px-1 -mt-1">
              <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
              <div className="w-3 h-1.5 border-b-2 border-black rounded-full" />
              <div className="w-2.5 h-2 bg-pink-400/80 rounded-full blur-[0.5px]" />
            </div>
          </div>

          {/* Iconic Red Shirt Body */}
          <div className="relative w-12 h-8 bg-red-600 border-2 border-black rounded-t-lg -mt-1 z-10 flex items-center justify-center">
            {/* Tiny tie or Agent Badge */}
            <div className="w-2 h-4 bg-yellow-400 border border-black rounded-sm" />
          </div>

          {/* Iconic Yellow Shorts */}
          <div className="w-11 h-4 bg-yellow-400 border-2 border-black -mt-0.5 z-10 flex justify-around">
            <div className="w-3.5 h-full border-r border-black" />
          </div>

          {/* Cute Little Feet */}
          <div className="flex justify-between w-8 -mt-0.5 z-0">
            <div className={`w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full ${isWalking ? 'animate-bounce' : ''}`} />
            <div className={`w-3.5 h-2 bg-[#ffd7b5] border border-black rounded-full ${isWalking ? 'animate-bounce delay-75' : ''}`} />
          </div>

          {/* Tiny Glowing Cyber Laptop in Hands! */}
          <div className="absolute -right-3 bottom-4 z-30 flex items-center justify-center transform -rotate-12 group-hover:scale-110 transition-transform">
            <div className="w-7 h-5 bg-slate-900 border border-purple-400 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.8)] p-0.5 flex flex-col items-center justify-between">
              {/* Screen with green cyber code */}
              <div className="w-full h-3 bg-purple-950 rounded-[1px] flex items-center justify-center overflow-hidden">
                <span className="text-[6px] font-mono text-emerald-400 font-bold leading-none animate-pulse">
                  {isTyping ? '0101...' : 'CHOC'}
                </span>
              </div>
              {/* Keyboard base */}
              <div className="w-full h-1 bg-slate-700 rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Funny Shinchan Classified Vault Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-scale-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-yellow-400/70 text-left shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #151128 0%, #0a0817 100%)',
              boxShadow: '0 20px 80px rgba(234, 179, 8, 0.3)'
            }}
          >
            {/* Background Chocobi Glow */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-yellow-400/20 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-300 text-xl shadow-lg shadow-yellow-400/30">
                  🎒
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      AGENT SHIN-CHAN&apos;S CLASSIFIED VAULT
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-black">
                      TOP SECRET
                    </span>
                  </div>
                  <p className="text-xs text-yellow-300/80 font-mono mt-0.5">
                    Encrypted with 256-Bit Action Kamen Protection
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Secret Content Card */}
            <div className="space-y-4">
              {/* Secret Title Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
                  {secret.title}
                </span>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  {secret.mood}
                </span>
              </div>

              {/* Quote Bubble */}
              <div className="p-4 rounded-2xl bg-black/60 border border-yellow-400/30 relative text-left">
                <p className="text-sm font-medium text-[#fef08a] italic leading-relaxed">
                  {secret.quote}
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-[#9b9bbf] leading-relaxed">
                  <strong className="text-white block mb-0.5">Tactical Objective:</strong>
                  {secret.mission}
                </div>
              </div>

              {/* Character Animated Reaction */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-xs text-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏃‍♂️</span>
                  <span><strong>Current Status:</strong> {secret.action}</span>
                </div>
                <span className="font-mono text-[10px] text-yellow-400/70">CONFIDENTIAL</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleNextSecret}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Crack Another Secret! ({currentSecretIndex + 1}/{SHINCHAN_SECRETS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="py-3 px-4 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
