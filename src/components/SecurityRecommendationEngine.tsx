'use client';

import React, { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, Lock, Flame, Clock, KeyRound,
  CheckCircle2, ArrowRight, ArrowLeft, X, Sparkles, SlidersHorizontal,
  Code, FileText, Upload, Users, Eye, AlertTriangle
} from 'lucide-react';

export interface SecurityConfig {
  inputMode: 'text' | 'file' | 'code' | 'voice' | 'video';
  burnAfterReading: boolean;
  expiryOption: string;
  passwordProtection: boolean;
}

interface SecurityRecommendationEngineProps {
  onApplyRecommendation: (config: SecurityConfig) => void;
  onCustomizeAll: () => void;
  onSkip: () => void;
}

export function SecurityRecommendationEngine({
  onApplyRecommendation,
  onCustomizeAll,
  onSkip
}: SecurityRecommendationEngineProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // 6 question answers
  const [sharingType, setSharingType] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<string | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [views, setViews] = useState<string | null>(null);
  const [aftermath, setAftermath] = useState<string | null>(null);

  const [isGenerated, setIsGenerated] = useState(false);

  // Compute recommendation
  const computeRecommendation = (): {
    title: string;
    score: number;
    description: string;
    config: SecurityConfig;
    reasons: string[];
  } => {
    let mode: 'text' | 'file' | 'code' | 'voice' | 'video' = 'text';
    if (sharingType === 'code') mode = 'code';
    else if (sharingType === 'file' || sharingType === 'document') mode = 'file';

    let burn = false;
    if (views === 'one_time' || aftermath === 'burn_immediately' || aftermath === 'burn_after_first_read') {
      burn = true;
    }

    let expiry = '600'; // 10 minutes default
    if (duration === 'minutes') expiry = '300';
    else if (duration === 'hours') expiry = '3600';
    else if (duration === 'days') expiry = '86400';
    else if (duration === 'indefinitely') expiry = 'never';

    let password = false;
    if (sensitivity === 'confidential' || sensitivity === 'highly_sensitive' || sharingType === 'credentials') {
      password = true;
    }

    // Reasons breakdown
    const reasons: string[] = [
      'Client-side AES-256-GCM browser zero-knowledge encryption'
    ];

    if (burn) reasons.push('Burn-after-reading enabled for single-read ephemeral secrecy');
    if (password) reasons.push('Password key derivation recommended for sensitive payload');
    reasons.push(`Auto-expiration configured to ${duration || '10 minutes'}`);

    let title = 'Standard Zero-Knowledge Capsule';
    let score = 80;

    if (burn && password) {
      title = 'Ultra-Secure Ephemeral Capsule';
      score = 98;
    } else if (burn || sensitivity === 'highly_sensitive') {
      title = 'Self-Destruct Stealth Capsule';
      score = 92;
    } else if (password) {
      title = 'Password-Sealed Confidential Capsule';
      score = 88;
    }

    return {
      title,
      score,
      description: `Optimized security profile for ${sharingType || 'content'} shared with ${audience || 'recipient'}.`,
      config: {
        inputMode: mode,
        burnAfterReading: burn,
        expiryOption: expiry,
        passwordProtection: password
      },
      reasons
    };
  };

  const handleNext = (selectedVal: string) => {
    if (currentStep === 1) setSharingType(selectedVal);
    if (currentStep === 2) setSensitivity(selectedVal);
    if (currentStep === 3) setAudience(selectedVal);
    if (currentStep === 4) setDuration(selectedVal);
    if (currentStep === 5) setViews(selectedVal);
    if (currentStep === 6) {
      setAftermath(selectedVal);
      setIsGenerated(true);
      return;
    }
    setCurrentStep(s => s + 1);
  };

  const recommendation = computeRecommendation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-purple-500/30 text-left shadow-2xl relative overflow-hidden"
        style={{
          background: 'rgba(14, 16, 32, 0.96)',
          boxShadow: '0 20px 80px rgba(124, 58, 237, 0.35)'
        }}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/15 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Security Recommendation Engine
              </h3>
              <p className="text-[11px] text-[#9b9bbf]">
                {isGenerated ? 'Optimal Security Suite Generated' : `Step ${currentStep} of 6 • Guided Security Setup`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-[#9b9bbf] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Skip entire setup & configure manually"
          >
            <span>Skip All</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {!isGenerated ? (
          <div className="space-y-6">
            {/* Step Progress Bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>

            {/* QUESTION 1: What are you sharing? */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 1 / 6</span>
                  <h4 className="text-base font-bold text-white">What are you sharing?</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'code', label: 'Source Code' },
                    { id: 'text', label: 'Plain Text' },
                    { id: 'credentials', label: 'Credentials / Keys' },
                    { id: 'file', label: 'File Attachment' },
                    { id: 'document', label: 'Document / PDF' },
                    { id: 'other', label: 'Other Content' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 text-xs font-semibold text-[#f0f0ff] transition-all text-center cursor-pointer active:scale-95"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTION 2: How sensitive is the content? */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 2 / 6</span>
                  <h4 className="text-base font-bold text-white">How sensitive is the content?</h4>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'public', label: 'Public', desc: 'Non-sensitive information' },
                    { id: 'personal', label: 'Personal', desc: 'Standard private notes' },
                    { id: 'confidential', label: 'Confidential', desc: 'Business/personal secrets' },
                    { id: 'highly_sensitive', label: 'Highly Sensitive', desc: 'Passkeys, financial, classified' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 transition-all text-left cursor-pointer active:scale-95 space-y-1"
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-[#9b9bbf]">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTION 3: Who are you sharing it with? */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 3 / 6</span>
                  <h4 className="text-base font-bold text-white">Who are you sharing it with?</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'yourself', label: 'Just Yourself' },
                    { id: 'one_person', label: 'One Person' },
                    { id: 'team', label: 'A Trusted Team' },
                    { id: 'many', label: 'Many People' },
                    { id: 'public', label: 'Public Link' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 text-xs font-semibold text-[#f0f0ff] transition-all text-center cursor-pointer active:scale-95"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTION 4: How long should it remain accessible? */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 4 / 6</span>
                  <h4 className="text-base font-bold text-white">How long should it remain accessible?</h4>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'minutes', label: 'Minutes (5 - 10 min)', desc: 'Fast ephemeral sharing' },
                    { id: 'hours', label: 'Hours (1 - 2 hours)', desc: 'Short working session' },
                    { id: 'days', label: 'Days (1 - 7 days)', desc: 'Standard business handoff' },
                    { id: 'indefinitely', label: 'Indefinitely', desc: 'Until manually destroyed' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 transition-all text-left cursor-pointer active:scale-95 space-y-1"
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-[#9b9bbf]">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTION 5: How many times should it be opened? */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 5 / 6</span>
                  <h4 className="text-base font-bold text-white">How many times should it be opened?</h4>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'one_time', label: 'One Time Only', desc: 'Single read' },
                    { id: 'limited', label: 'Limited Views', desc: 'Few reads' },
                    { id: 'unlimited', label: 'Unlimited', desc: 'Within expiry' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 transition-all text-center cursor-pointer active:scale-95 space-y-1"
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-[#9b9bbf]">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUESTION 6: What should happen after it's accessed or expires? */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-slide-in">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">QUESTION 6 / 6</span>
                  <h4 className="text-base font-bold text-white">What should happen after it&apos;s accessed or expires?</h4>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'burn_after_first_read', label: 'Burn After First Read', desc: 'Auto-destruct upon decryption' },
                    { id: 'burn_immediately', label: 'Burn Immediately', desc: 'Zero retention on server' },
                    { id: 'expire', label: 'Expire on Timer', desc: 'Delete when duration ends' },
                    { id: 'keep', label: 'Keep Active', desc: 'Retain until limit' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleNext(opt.id)}
                      className="p-3.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-600/20 hover:border-purple-500/60 transition-all text-left cursor-pointer active:scale-95 space-y-1"
                    >
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-[#9b9bbf]">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-500/15">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
                  className="text-xs font-semibold text-[#9b9bbf] hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-semibold text-purple-400/80 hover:text-purple-300 hover:underline cursor-pointer"
              >
                Skip Recommendation (Manual Mode)
              </button>
            </div>
          </div>
        ) : (
          /* RESULT: Security Recommendation Card */
          <div className="space-y-6 animate-scale-in">
            <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                    SECURITY SCORE: {recommendation.score}/100
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {recommendation.title}
                  </h4>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-[#9b9bbf] leading-relaxed">
                {recommendation.description}
              </p>

              {/* Recommendations list */}
              <div className="space-y-1.5 pt-1">
                {recommendation.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#f0f0ff]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onApplyRecommendation(recommendation.config)}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)'
                }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Apply Recommendation & Start Writing</span>
              </button>

              <button
                type="button"
                onClick={onCustomizeAll}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#9b9bbf] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                <span>Customize All Fields Manually</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
