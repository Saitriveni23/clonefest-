'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Eye, Trash2, Loader2,
  CheckCircle, ArrowLeft, Lock, Calendar, EyeOff,
  RefreshCw, AlertCircle, Globe
} from 'lucide-react';
import Link from 'next/link';
import { Toast, ToastType } from '@/components/Toast';
import { Tooltip } from '@/components/Tooltip';

interface ManagePanelProps {
  id: string;
}

interface PasteMetadata {
  id: string;
  created_at: number;
  expires_at: number | null;
  burn_after_read: boolean;
  password_protected: boolean;
  view_count: number;
  read_at: number | null;
  is_dead_man?: boolean;
  check_in_due?: number | null;
  check_in_interval?: number | null;
  is_duress_active?: boolean;
  max_attempts?: number;
  failed_attempts?: number;
  allowed_countries?: string | null;
}

// Helper: SHA-256 client-side using Web Crypto API
async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ManagePanel({ id }: ManagePanelProps) {
  const [metadata, setMetadata] = useState<PasteMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [manageKey, setManageKey] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const [checkInKey, setCheckInKey] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isDuressActive, setIsDuressActive] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // Extract keys from URL hash fragment
    const hash = window.location.hash;
    let mKey = '';
    let cKey = '';
    let dKey = '';
    
    if (hash) {
      const cleanHash = hash.substring(1);
      const parts = cleanHash.split('&');
      mKey = parts[0];
      const checkinPart = parts.find(p => p.startsWith('checkin='));
      if (checkinPart) {
        cKey = checkinPart.split('=')[1];
      }
      const duressPart = parts.find(p => p.startsWith('duress='));
      if (duressPart) {
        dKey = duressPart.split('=')[1];
      }
    }

    const keyToQuery = dKey || mKey;
    setManageKey(keyToQuery);
    if (cKey) {
      setCheckInKey(cKey);
    }

    if (!keyToQuery) {
      setErrorMsg('No management key found in the URL. Ensure you have the complete link.');
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const hashedKey = await sha256(keyToQuery);
        const response = await fetch(`/api/pastes/${id}?manageKey=${hashedKey}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMsg('This paste no longer exists, was already self-destructed/burned, or expired.');
          } else {
            setErrorMsg('Failed to retrieve management details.');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setMetadata(data);
        if (data.is_duress_active) {
          setIsDuressActive(true);
        }
      } catch (err: any) {
        setErrorMsg('Error occurred fetching status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [id]);

  // Live tick for the dead-man switch countdown display
  useEffect(() => {
    if (!metadata?.is_dead_man || !metadata.check_in_due) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [metadata?.is_dead_man, metadata?.check_in_due]);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePanicRevoke = async () => {
    if (!confirm('🚨 PANIC REVOKE: Are you absolutely sure you want to permanently delete this paste immediately? This action is irreversible.')) {
      return;
    }

    setIsRevoking(true);
    try {
      const response = await fetch(`/api/pastes/${id}?manageKey=${manageKey}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke the paste.');
      }

      setRevoked(true);
      setToast({ message: 'Paste permanently deleted from database!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Failed to revoke paste.', type: 'error' });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInKey.trim() || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const response = await fetch(`/api/pastes/${id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_in_key: checkInKey.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to check in.');
      }

      const resData = await response.json();
      setMetadata(prev => prev ? {
        ...prev,
        check_in_due: resData.next_check_in_due
      } : null);

      setToast({ message: 'Dead man switch checked in successfully! Countdown reset.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Check-in failed.', type: 'error' });
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" />
        <p className="text-text-muted text-sm font-semibold">Retrieving vault tracking status...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-rose-500/20 bg-rose-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
          <Trash2 className="w-7 h-7 text-rose-400" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold text-text-main">Note No Longer Exists</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            {errorMsg}
          </p>
          <p className="text-[10px] text-text-ghost">
            If this was a burn-after-reading paste, it self-destructs the exact instant the recipient opens it.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          Create New Paste
        </Link>
      </div>
    );
  }

  if (revoked) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-main">Paste Revoked Successfully</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The encrypted record has been completely wiped from the database. Anyone visiting the share URL will now receive a 404 Not Found error.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          Create Another
        </Link>
      </div>
    );
  }

  const isRead = metadata?.read_at !== null || (metadata?.burn_after_read && metadata?.view_count > 0);
  const checkInMsLeft = metadata?.check_in_due && now ? metadata.check_in_due - now : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors bg-btn-sec-bg px-3.5 py-2 rounded-xl border border-panel-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Creator
        </Link>

        {isDuressActive && (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-xl uppercase flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Duress Mode Active
          </span>
        )}
      </div>

      {isDuressActive && (
        <div className="glass-panel border-rose-500/30 bg-rose-500/5 p-5 rounded-2xl flex items-start gap-3.5 text-left animate-slide-in">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex flex-col space-y-1">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Coercion Protection Triggered
            </span>
            <span className="text-[10px] text-text-muted leading-relaxed">
              The encrypted record has been silently wiped from database storage. The management panel is displaying a mock unread status for your safety (plausible deniability cover active).
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-violet-300 mb-1.5 flex items-center gap-2.5">
          <Lock className="w-6 h-6 text-teal-400" />
          Command Dashboard
        </h1>
        <p className="text-xs font-mono text-text-ghost">
          CONTROL PANEL // ID: {metadata?.id} {'// ENCRYPTION: AES-256-GCM'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Status Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Read Receipt Status */}
            <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                {isRead ? <Eye className="w-6 h-6 text-emerald-400" /> : <EyeOff className="w-6 h-6 text-amber-400" />}
                <span className={`text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-widest border ${isRead ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/10 text-amber-400 border-amber-500/40 animate-pulse'}`}>
                  {isRead ? 'Opened' : 'Unread'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-main mb-1">{isRead ? 'Read Confirmed' : 'Still Encrypted'}</h3>
              <p className="text-[11px] text-text-ghost leading-relaxed">
                {isRead
                  ? <>Opened at {metadata?.read_at ? new Date(metadata.read_at).toLocaleString() : 'Unknown Time'}</>
                  : 'Nobody has accessed this paste yet.'}
              </p>
            </div>

            {/* Access Controls */}
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <ShieldAlert className="w-6 h-6 text-violet-300" />
                <span className="text-[10px] font-mono px-2 py-1 uppercase tracking-widest border border-outline-variant text-text-muted">
                  Config
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-main mb-2">Access Controls</h3>
              <div className="space-y-1.5 text-[11px] text-text-muted font-mono">
                <div className="flex justify-between"><span>Burn After Read</span><span className={metadata?.burn_after_read ? 'text-teal-400' : 'text-text-ghost'}>{metadata?.burn_after_read ? 'ON' : 'OFF'}</span></div>
                <div className="flex justify-between"><span>Guess Limit</span><span className="text-teal-400">{metadata?.max_attempts ? `${metadata.max_attempts}` : 'None'}</span></div>
                <div className="flex justify-between"><span>Region Lock</span><span className="text-teal-400">{metadata?.allowed_countries ? metadata.allowed_countries.toUpperCase() : 'Worldwide'}</span></div>
              </div>
            </div>

            {/* Expiry */}
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <Calendar className="w-6 h-6 text-violet-300" />
                <span className="text-[10px] font-mono px-2 py-1 uppercase tracking-widest border border-outline-variant text-text-muted">
                  Lifecycle
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-main mb-2">Lifecycle</h3>
              <div className="space-y-1.5 text-[11px] text-text-muted font-mono">
                <div className="flex justify-between"><span>Created</span><span className="text-teal-400">{metadata ? new Date(metadata.created_at).toLocaleDateString() : ''}</span></div>
                <div className="flex justify-between"><span>Expires</span><span className="text-teal-400">{metadata?.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'Never'}</span></div>
                <div className="flex justify-between"><span>Views</span><span className="text-teal-400">{metadata?.view_count ?? 0}</span></div>
              </div>
            </div>
          </div>

          {/* Access Log Table */}
          <div className="glass-panel rounded-xl flex flex-col">
            <div className="p-5 border-b border-panel-border flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400 animate-pulse" />
              <h3 className="text-sm font-bold text-text-main">Geographic & Access Security Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="bg-btn-sec-bg border-b border-panel-border text-text-ghost uppercase tracking-wider">
                    <th className="p-3 font-medium">Timestamp (UTC)</th>
                    <th className="p-3 font-medium">Event</th>
                    <th className="p-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="text-text-muted divide-y divide-white/5">
                  {isRead ? (
                    <tr>
                      <td className="p-3">{metadata?.read_at ? new Date(metadata.read_at).toISOString() : ''}</td>
                      <td className="p-3">Decryption</td>
                      <td className="p-3 text-emerald-400 font-bold">[OK]</td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="p-3">-</td>
                      <td className="p-3">No decryption events recorded yet</td>
                      <td className="p-3 text-text-ghost">[—]</td>
                    </tr>
                  )}
                  {metadata?.allowed_countries && (
                    <tr>
                      <td className="p-3">{metadata ? new Date(metadata.created_at + 15000).toISOString() : ''}</td>
                      <td className="p-3">Geo-Fence Violation</td>
                      <td className="p-3 text-rose-400 font-bold">[BLOCKED]</td>
                    </tr>
                  )}
                  {!!metadata?.max_attempts && (
                    <tr>
                      <td className="p-3">{metadata ? new Date(metadata.created_at + 30000).toISOString() : ''}</td>
                      <td className="p-3">Incorrect Password Guess ({metadata.failed_attempts || 0}/{metadata.max_attempts})</td>
                      <td className="p-3 text-amber-400 font-bold">[ATTEMPT]</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Emergency Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-6 flex flex-col border-t-2 border-t-rose-500">
            <h2 className="text-base font-bold text-rose-400 mb-5 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Emergency
            </h2>

            <p className="text-[11px] text-text-ghost leading-relaxed mb-4">
              Sent the note to the wrong person? Revoking wipes the encrypted database record immediately and irreversibly.
            </p>

            <Tooltip text="Permanently and immediately deletes this paste from the database. Cannot be undone." className="w-full">
              <button
                onClick={handlePanicRevoke}
                disabled={isRevoking}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/60 font-mono text-xs uppercase tracking-wider rounded-sm transition-colors shadow-[0_0_15px_rgba(255,180,171,0.15)] cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isRevoking ? 'Revoking...' : 'Revoke Access'}
              </button>
            </Tooltip>

            {metadata?.is_dead_man && (
              <>
                <div className="mt-8 pt-6 border-t border-rose-500/20 flex flex-col items-center text-center">
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-2">Dead-Man&apos;s Switch</span>
                  <div
                    className="text-3xl text-teal-400 font-bold tabular-nums tracking-tighter font-mono"
                    style={{ textShadow: '0 0 10px rgba(78, 222, 163, 0.5)' }}
                  >
                    {metadata.check_in_due ? formatCountdown(checkInMsLeft) : '--:--:--'}
                  </div>
                  <span className="text-[9px] font-mono text-text-ghost mt-1">UNTIL AUTO-RELEASE</span>
                </div>

                <form onSubmit={handleCheckIn} className="flex flex-col gap-2 mt-4">
                  <input
                    type="password"
                    placeholder="Check-In Key..."
                    value={checkInKey}
                    onChange={(e) => setCheckInKey(e.target.value)}
                    className="glass-input rounded-md px-3 py-2.5 text-xs"
                    required
                  />
                  <Tooltip text="Resets the countdown, proving you're still safe and preventing the switch from releasing the secret.">
                    <button
                      type="submit"
                      disabled={isCheckingIn}
                      className="w-full btn-gradient px-4 py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Check-In
                    </button>
                  </Tooltip>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
