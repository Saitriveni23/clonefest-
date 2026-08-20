'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Clock, Eye, Trash2, Loader2, 
  CheckCircle, ArrowLeft, Lock, Calendar, EyeOff,
  RefreshCw, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Toast, ToastType } from '@/components/Toast';

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

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    // Extract keys from URL hash fragment
    const hash = window.location.hash;
    let mKey = '';
    let cKey = '';
    
    if (hash) {
      const cleanHash = hash.substring(1);
      const parts = cleanHash.split('&');
      mKey = parts[0];
      const checkinPart = parts.find(p => p.startsWith('checkin='));
      if (checkinPart) {
        cKey = checkinPart.split('=')[1];
      }
    }

    setManageKey(mKey);
    if (cKey) {
      setCheckInKey(cKey);
    }

    if (!mKey) {
      setErrorMsg('No management key found in the URL. Ensure you have the complete link.');
      setIsLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const hashedKey = await sha256(mKey);
        const response = await fetch(`/api/pastes/${id}?manageKey=${hashedKey}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This paste no longer exists, was already self-destructed/burned, or expired.');
          }
          throw new Error('Failed to retrieve management details.');
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error occurred fetching status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [id]);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Back button */}
      <div className="flex justify-start">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors bg-btn-sec-bg px-3.5 py-2 rounded-xl border border-panel-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Creator
        </Link>
      </div>

      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8">
        {/* Title */}
        <div className="flex items-center gap-3 border-b border-panel-border pb-5 text-left">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Lock className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-text-main">Paste Governance & Receipt</h2>
            <span className="text-[10px] text-text-ghost uppercase font-semibold tracking-wider">
              Control Panel • ID: {metadata?.id}
            </span>
          </div>
        </div>

        {/* Read Receipt Status Visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl flex flex-col text-left space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Read Receipt Status</span>
              {isRead ? (
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Opened
                </span>
              ) : (
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                  Unread
                </span>
              )}
            </div>

            {isRead ? (
              <div className="space-y-1">
                <p className="text-2xl font-black text-text-main flex items-center gap-2">
                  <Eye className="w-7 h-7 text-emerald-400" />
                  Read Confirmed
                </p>
                <p className="text-xs text-text-ghost">
                  Recipient read this paste at: <br />
                  <span className="font-semibold text-text-muted">
                    {metadata?.read_at ? new Date(metadata.read_at).toLocaleString() : 'Unknown Time'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-black text-text-main flex items-center gap-2">
                  <EyeOff className="w-7 h-7 text-amber-400" />
                  Still Encrypted
                </p>
                <p className="text-xs text-text-ghost">
                  Nobody has accessed this paste yet. The secret is sitting safe in the database.
                </p>
              </div>
            )}
          </div>

          {/* Paste Info Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col text-left space-y-4">
            <span className="text-xs font-semibold text-text-muted">Paste Settings</span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>Created: {metadata ? new Date(metadata.created_at).toLocaleString() : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>
                  Expires: {metadata?.expires_at ? new Date(metadata.expires_at).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>
                  Self-Destruct (Burn): {metadata?.burn_after_read ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dead Man's Switch Whistleblower check-in form */}
        {metadata?.is_dead_man && (
          <div className="pt-6 border-t border-panel-border space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                Whistleblower Switch Check-In
              </h3>
              <p className="text-xs text-text-ghost leading-relaxed">
                Keep this switch locked by checking in before the countdown expires. Failing to check in will release the decryption keys to anyone who has the share link.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-text-ghost uppercase font-bold">Release Countdown</span>
                <p className="text-base font-bold text-amber-400">
                  {metadata.check_in_due ? new Date(metadata.check_in_due).toLocaleString() : 'Expired / Released'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-text-ghost uppercase font-bold">Check-In Interval</span>
                <p className="text-xs text-text-muted">
                  Every {metadata.check_in_interval ? (metadata.check_in_interval / 3600).toFixed(1) : ''} hours
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckIn} className="flex gap-2.5 max-w-md">
              <input
                type="password"
                placeholder="Enter Check-In Key..."
                value={checkInKey}
                onChange={(e) => setCheckInKey(e.target.value)}
                className="flex-1 glass-input rounded-xl px-4 py-3 text-xs"
                required
              />
              <button
                type="submit"
                disabled={isCheckingIn}
                className="btn-gradient px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check-In
              </button>
            </form>
          </div>
        )}

        {/* Panic Revoke Action */}
        <div className="pt-4 border-t border-panel-border space-y-4 text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              Panic Revoke Note
            </h3>
            <p className="text-xs text-text-ghost leading-relaxed">
              Think you sent the note to the wrong person, or want to revoke access early? Hitting the panic button wipes the encrypted database record immediately.
            </p>
          </div>

          <button
            onClick={handlePanicRevoke}
            disabled={isRevoking}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/20 hover:scale-[1.01] active:scale-100 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isRevoking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Revoking Note...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Trigger Panic Revoke (Wipe Secret)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
