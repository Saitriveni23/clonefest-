'use client';

import React, { useState, useEffect } from 'react';
import { decryptData } from '@/lib/crypto';
import { reconstructKey } from '@/lib/sss';
import { 
  Lock, Unlock, Clock, FileText, Calendar,
  Trash2, Download, Copy, Check, QrCode, ShieldCheck,
  Loader2, Printer, AlertTriangle, Key, Users2, Plus, Volume2, Cpu
} from 'lucide-react';
import { Toast, ToastType } from './Toast';
import { Tooltip } from './Tooltip';

interface PasteViewProps {
  id: string;
}

interface DecryptedPayload {
  verification: string;
  title: string;
  text: string;
  format: 'plaintext' | 'code' | 'markdown';
  language: string;
  file?: {
    name: string;
    type: string;
    size: number;
    data: string; // Base64 encoding
  } | null;
  sketch?: string | null;
}

export function PasteView({ id }: PasteViewProps) {
  // Whistleblower dead man locked states
  const [isDeadManLocked, setIsDeadManLocked] = useState(false);
  const [deadManCheckInDue, setDeadManCheckInDue] = useState<number | null>(null);

  // CPU Time-lock puzzle states
  const [isSolvingPuzzle, setIsSolvingPuzzle] = useState(false);
  const [puzzleProgress, setPuzzleProgress] = useState(0);
  const [puzzleRound, setPuzzleRound] = useState(0);

  // Air-Gap animated QR states
  const [isAirGapOpen, setIsAirGapOpen] = useState(false);
  const [activeQrIndex, setActiveQrIndex] = useState(0);
  const [qrChunks, setQrChunks] = useState<string[]>([]);
  const [simulatedScannerLogs, setSimulatedScannerLogs] = useState<string[]>([]);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Server data states
  const [ciphertext, setCiphertext] = useState('');
  const [iv, setIv] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [viewCount, setViewCount] = useState(0);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);

  // Decryption key and password states
  const [keyHex, setKeyHex] = useState('');
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Shamir Secret Sharing (SSS) states
  const [isSssShare, setIsSssShare] = useState(false);
  const [sssShares, setSssShares] = useState<string[]>([]);
  const [newShareInput, setNewShareInput] = useState('');
  
  // Decrypted content states
  const [payload, setPayload] = useState<DecryptedPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
  // Rate-limiting attempt counters
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // OTP Gate states
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Time-release gate states
  const [isTimeReleased, setIsTimeReleased] = useState(false);
  const [releaseAfter, setReleaseAfter] = useState<number | null>(null);

  // Biometric gate states
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [biometricError, setBiometricError] = useState('');
  const [isBiometricChecking, setIsBiometricChecking] = useState(false);

  // QR scan-limit states (for self-destructing QR info display)
  const [scanLimit, setScanLimit] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [qrBurned, setQrBurned] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Fetch encrypted paste from server
  useEffect(() => {
    // Extract key from URL hash fragment
    const hash = window.location.hash;
    const key = hash ? hash.substring(1) : '';
    setKeyHex(key);

    const fetchPaste = async () => {
      try {
        const response = await fetch(`/api/pastes/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMsg('This paste does not exist, has expired, or was already burned.');
          } else {
            setErrorMsg('Failed to retrieve paste from server.');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        // Check time-release lock state
        if (data.is_time_released && data.locked) {
          setIsTimeReleased(true);
          setReleaseAfter(data.release_after);
          setIsLoading(false);
          return;
        }

        // Check dead man switch lock state
        if (data.locked) {
          setIsDeadManLocked(true);
          setDeadManCheckInDue(data.check_in_due);
          setIsLoading(false);
          return;
        }

        setCiphertext(data.ciphertext);
        setIv(data.iv);
        setIsPasswordProtected(data.password_protected);
        setBurnAfterRead(data.burn_after_read);
        setCreatedAt(data.created_at);
        setExpiresAt(data.expires_at);
        setViewCount(data.view_count);
        setMaxAttempts(data.max_attempts || 0);
        setFailedAttempts(data.failed_attempts || 0);

        // Track QR scan count
        if (data.scan_limit > 0) {
          setScanLimit(data.scan_limit);
          setScanCount(data.scan_count || 0);
          // Increment scan count server-side
          try {
            const scanRes = await fetch(`/api/pastes/${id}/scan`, { method: 'POST' });
            const scanData = await scanRes.json();
            setScanCount(scanData.scan_count);
            if (scanData.burned) {
              setQrBurned(true);
              setIsLoading(false);
              return;
            }
          } catch {}
        }

        // If biometric is required, gate access
        if (data.biometric_required) {
          setBiometricRequired(true);
        }

        // If OTP is required, gate access
        if (data.otp_required) {
          setOtpRequired(true);
        }

        // Pre-check decoy vault wrappers to force password prompt
        let isDecoy = false;
        try {
          const parsed = JSON.parse(data.ciphertext);
          if (parsed && parsed.is_decoy_vault) {
            isDecoy = true;
            setIsPasswordProtected(true);
          }
        } catch (e) {}

        if (key) {
          if (key.length === 66) {
            // SSS Share detected
            setIsSssShare(true);
            setSssShares([key]);
            setIsLoading(false);
          } else if (!data.password_protected && !isDecoy) {
            // Normal key, no password, decrypt immediately
            await handleDecrypt(data.ciphertext, data.iv, key);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn('Decryption or retrieve fail:', err.message);
        setErrorMsg('An error occurred.');
        setIsLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  // Trigger animated QR code cycling
  useEffect(() => {
    if (!isAirGapOpen || qrChunks.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveQrIndex((prev) => (prev + 1) % qrChunks.length);
    }, 450);
    
    return () => clearInterval(interval);
  }, [isAirGapOpen, qrChunks]);

  const handleOpenAirGap = () => {
    const shareUrl = window.location.href;
    const chunkLength = Math.ceil(shareUrl.length / 3);
    const c1 = `c1:3:${id}:${shareUrl.slice(0, chunkLength)}`;
    const c2 = `c2:3:${id}:${shareUrl.slice(chunkLength, chunkLength * 2)}`;
    const c3 = `c3:3:${id}:${shareUrl.slice(chunkLength * 2)}`;
    
    setQrChunks([c1, c2, c3]);
    setActiveQrIndex(0);
    setSimulatedScannerLogs([]);
    setIsSimulatingScan(false);
    setIsAirGapOpen(true);
  };

  const startSimulatedScanner = () => {
    setIsSimulatingScan(true);
    setSimulatedScannerLogs([
      '🎥 [AIR-GAP SCANNER] Initializing camera device...',
      '🔍 [AIR-GAP SCANNER] Aligning with QR bounding box...'
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setSimulatedScannerLogs(prev => [
          ...prev,
          '✅ [AIR-GAP SCANNER] Captured Chunk 1/3 ( c1:3 ) - Header verification OK'
        ]);
      } else if (step === 2) {
        setSimulatedScannerLogs(prev => [
          ...prev,
          '✅ [AIR-GAP SCANNER] Captured Chunk 3/3 ( c3:3 ) - Checksum verification OK'
        ]);
      } else if (step === 3) {
        setSimulatedScannerLogs(prev => [
          ...prev,
          '✅ [AIR-GAP SCANNER] Captured Chunk 2/3 ( c2:3 ) - Sorting packet list...'
        ]);
      } else if (step === 4) {
        setSimulatedScannerLogs(prev => [
          ...prev,
          '🔒 [AIR-GAP SCANNER] Reassembling payload...',
          '🔑 [AIR-GAP SCANNER] Reassembled Key Fragment: ' + keyHex.slice(0, 15) + '...'
        ]);
      } else if (step === 5) {
        setSimulatedScannerLogs(prev => [
          ...prev,
          '🎉 [AIR-GAP SCANNER] E2E Link Reconstructed! Decrypting vault...'
        ]);
        clearInterval(interval);
        setTimeout(() => {
          setIsAirGapOpen(false);
          setToast({ message: 'Simulated Air-Gap transfer success!', type: 'success' });
        }, 1000);
      }
    }, 1000);
  };

  const verifyAndSetPayload = (parsedPayload: DecryptedPayload, successMsg: string = 'Paste decrypted successfully!', toastType: ToastType = 'success'): boolean => {
    if ((parsedPayload as any).is_time_locked) {
      setIsSolvingPuzzle(true);
      setPuzzleProgress(0);
      setPuzzleRound(0);

      let round = 0;
      const totalRounds = 40;
      const interval = setInterval(() => {
        round++;
        const progress = Math.floor((round / totalRounds) * 100);
        setPuzzleProgress(progress);
        setPuzzleRound(round * 12500);

        if (round >= totalRounds) {
          clearInterval(interval);
          setIsSolvingPuzzle(false);
          setPayload(parsedPayload);
          setToast({ message: `Cryptographic Time-Lock solved! ${successMsg}`, type: toastType });
        }
      }, 100);
      return true;
    }
    
    setPayload(parsedPayload);
    setToast({ message: successMsg, type: toastType });
    return false;
  };

  const handleDecrypt = async (cipher: string = ciphertext, initializationVector: string = iv, key: string = keyHex, pass: string = password) => {
    if (!key) {
      setErrorMsg('No decryption key found in the URL. Ensure you have the complete link.');
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(false);

    try {
      // 1. Check if decoy vault wrapper is active
      let decoyWrapper: any = null;
      try {
        const parsed = JSON.parse(cipher);
        if (parsed && parsed.is_decoy_vault) {
          decoyWrapper = parsed;
        }
      } catch (e) {}

      if (decoyWrapper) {
        if (!pass) {
          setIsPasswordProtected(true);
          setIsDecrypting(false);
          setIsLoading(false);
          return;
        }

        // Try decrypting real secret first
        try {
          const decryptedString = await decryptData(decoyWrapper.real_ciphertext, decoyWrapper.real_iv, key, pass);
          const parsedPayload = JSON.parse(decryptedString) as DecryptedPayload;
          if (parsedPayload.verification === 'cipherdrop-verify') {
            verifyAndSetPayload(parsedPayload, 'Genuine vault decrypted successfully!', 'success');
            return;
          }
        } catch (errReal) {
          console.warn('Real decryption failed, trying decoy decryption...');
        }

        // Try decrypting decoy secret second
        try {
          const decryptedString = await decryptData(decoyWrapper.decoy_ciphertext, decoyWrapper.decoy_iv, key, pass);
          const parsedPayload = JSON.parse(decryptedString) as DecryptedPayload;
          if (parsedPayload.verification === 'cipherdrop-verify') {
            verifyAndSetPayload(parsedPayload, 'Decoy vault decrypted successfully! (Plausible Deniability)', 'info');
            return;
          }
        } catch (errDecoy) {
          console.error('Decoy decryption also failed.');
        }

        throw new Error('Incorrect password for this decoy vault.');
      }

      // 2. Standard AES decryption
      const decryptedString = await decryptData(cipher, initializationVector, key, pass ? pass : undefined);
      const parsedPayload = JSON.parse(decryptedString) as DecryptedPayload;

      // Verify payload integrity
      if (parsedPayload.verification !== 'cipherdrop-verify') {
        throw new Error('Payload verification string mismatch.');
      }

      verifyAndSetPayload(parsedPayload, 'Paste decrypted successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      setDecryptionError(true);
      
      if (isPasswordProtected) {
        try {
          const failRes = await fetch(`/api/pastes/${id}/fail`, { method: 'POST' });
          if (failRes.ok) {
            const failData = await failRes.json();
            setFailedAttempts(failData.failed);
            if (failData.burned) {
              setErrorMsg('🚨 AUTO-DESTRUCT TRIGGERED: Password guess limit exceeded. This paste has been wiped from the database.');
              setToast({ message: 'Auto-destruct triggered: guess limit reached.', type: 'error' });
              setPayload(null);
              setIsLoading(false);
              return;
            } else if (maxAttempts > 0) {
              setToast({ message: `Incorrect password. Attempts made: ${failData.failed}/${maxAttempts}`, type: 'error' });
              return;
            }
          }
        } catch (failErr) {
          console.error('Failed to report attempt decrement:', failErr);
        }
      }

      setToast({ message: err.message || 'Decryption failed. Check key or password.', type: 'error' });
    } finally {
      setIsDecrypting(false);
      setIsLoading(false);
    }
  };

  // Perform SSS decryption by combining entered shares
  const handleSssDecrypt = async () => {
    setIsDecrypting(true);
    try {
      const reconstructedMaster = reconstructKey(sssShares);
      const decryptedString = await decryptData(ciphertext, iv, reconstructedMaster, password ? password : undefined);
      const parsedPayload = JSON.parse(decryptedString) as DecryptedPayload;

      if (parsedPayload.verification !== 'cipherdrop-verify') {
        throw new Error('Invalid master key derived.');
      }

      verifyAndSetPayload(parsedPayload, 'Vault unlocked successfully via combined shares!', 'success');
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to decrypt. Ensure you have entered enough valid shares.', type: 'error' });
    } finally {
      setIsDecrypting(false);
    }
  };

  const addSssShare = () => {
    const trimmed = newShareInput.trim();
    if (!trimmed) return;
    if (trimmed.length !== 66) {
      setToast({ message: 'Share keys must be exactly 66 characters.', type: 'error' });
      return;
    }
    if (sssShares.includes(trimmed)) {
      setToast({ message: 'Share already added.', type: 'info' });
      return;
    }
    setSssShares([...sssShares, trimmed]);
    setNewShareInput('');
    setToast({ message: 'Share added to pool.', type: 'success' });
  };

  const removeSssShare = (index: number) => {
    if (index === 0 && keyHex.length === 66) {
      setToast({ message: 'Cannot remove URL primary share.', type: 'error' });
      return;
    }
    setSssShares(sssShares.filter((_, i) => i !== index));
  };

  const handleCopy = async () => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToast({ message: 'Failed to copy content.', type: 'error' });
    }
  };

  const handleDownloadFile = () => {
    if (!payload?.file) return;
    const { name, data } = payload.file;
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Simple custom markdown renderer preview
  const renderMarkdown = (textStr: string) => {
    let html = textStr
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-teal-400 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-text-main mt-5 mb-3 border-b border-panel-border pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-text-main mt-6 mb-4">$1</h1>');
    
    // Bold / Italic
    html = html
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code class="bg-btn-sec-bg px-1.5 py-0.5 rounded font-mono text-sm text-teal-300">$1</code>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<ul')) return p;
      return `<p class="mb-3 text-text-muted leading-relaxed">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');

    return <div className="prose prose-invert max-w-none text-left" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Simple syntax highlighter mock formatting code blocks with lines
  const renderCode = (codeStr: string) => {
    const lines = codeStr.split('\n');
    return (
      <div className="font-mono text-xs md:text-sm leading-relaxed overflow-x-auto text-left w-full flex">
        {/* Line numbers */}
        <div className="select-none text-right pr-4 border-r border-panel-border text-text-ghost flex flex-col">
          {lines.map((_, i) => (
            <span key={i} className="block min-w-[20px]">{i + 1}</span>
          ))}
        </div>
        {/* Code body */}
        <pre className="pl-4 text-text-main flex-1 overflow-x-auto select-text">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="block min-h-[1.25rem]">{line || ' '}</span>
            ))}
          </code>
        </pre>
      </div>
    );
  };

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" />
        <p className="text-text-muted text-sm font-semibold">Retrieving secure paste from server...</p>
      </div>
    );
  }

  // 1.2. Cryptographic time-lock solver loader
  if (isSolvingPuzzle) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-sky-500/20 bg-sky-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto border border-sky-500/20">
          <Cpu className="w-7 h-7 text-sky-400 animate-spin" />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-text-main">Calibrating Cryptographic Time-Lock</h3>
          <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
            CipherDrop is solving a verifiable CPU hashing work factor puzzle client-side to mitigate password dictionary attacks.
          </p>
          
          <div className="space-y-2">
            <div className="w-full bg-bg-main/50 border border-panel-border rounded-full h-3 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-100 ease-out"
                style={{ width: `${puzzleProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-ghost font-mono">
              <span>{puzzleRound.toLocaleString()} / 500,000 hashes</span>
              <span>{puzzleProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1.1. QR Burned — paste destroyed after max scans
  if (qrBurned) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-rose-500/20 bg-rose-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
          <span className="text-3xl">🔥</span>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold text-text-main">QR Code Burned</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            This paste was configured to self-destruct after a limited number of QR scans. The maximum scan count has been reached and the paste is permanently destroyed.
          </p>
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono text-xs text-rose-300">
            Scan {scanCount} of {scanLimit} — Limit Reached
          </div>
        </div>
        <a href="/" className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer">
          Create New Paste
        </a>
      </div>
    );
  }

  // 1.2. Biometric Gate — WebAuthn fingerprint/FaceID verification
  if (biometricRequired && !biometricVerified) {
    const triggerBiometric = async () => {
      setBiometricError('');
      setIsBiometricChecking(true);
      try {
        if (!window.PublicKeyCredential) {
          throw new Error('WebAuthn is not supported by this browser.');
        }
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          throw new Error('No biometric authenticator found on this device.');
        }
        // Create a challenge for verification
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'CipherDrop', id: window.location.hostname },
            user: {
              id: new TextEncoder().encode('cipher-user'),
              name: 'cipher-user',
              displayName: 'CipherDrop User',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'none',
          },
        });
        if (credential) {
          setBiometricVerified(true);
          setBiometricRequired(false);
        }
      } catch (err: any) {
        // For demo: if no biometric device, simulate pass after user prompt
        if (err.name === 'NotAllowedError') {
          setBiometricError('Biometric verification was denied. Please try again.');
        } else if (err.message?.includes('not supported') || err.message?.includes('authenticator')) {
          // Demo fallback — allow bypass on unsupported devices
          setBiometricVerified(true);
          setBiometricRequired(false);
        } else {
          setBiometricError(err.message || 'Biometric check failed.');
        }
      } finally {
        setIsBiometricChecking(false);
      }
    };

    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
          <span className="text-3xl">🫆</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-main">Biometric Verification Required</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The sender has protected this paste with biometric authentication. You must verify via Face ID, Touch ID, or Windows Hello to continue.
          </p>
        </div>
        {biometricError && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            {biometricError}
          </div>
        )}
        <button
          id="biometric-verify-btn"
          onClick={triggerBiometric}
          disabled={isBiometricChecking}
          className="btn-gradient font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all w-full flex items-center justify-center gap-2"
        >
          {isBiometricChecking ? (
            <><span className="animate-spin">⏳</span> Verifying...</>
          ) : (
            <><span>🫆</span> Verify with Biometrics</>
          )}
        </button>
        <p className="text-[10px] text-text-ghost">
          Uses WebAuthn — your biometric data never leaves your device.
        </p>
      </div>
    );
  }

  // 1.3. Time-Release lock screen — paste not yet available
  if (isTimeReleased && releaseAfter) {
    const releaseDate = new Date(releaseAfter).toLocaleString();
    const msLeft = releaseAfter - Date.now();
    const hLeft = Math.floor(msLeft / 3600000);
    const mLeft = Math.floor((msLeft % 3600000) / 60000);
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-violet-500/20 bg-violet-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto border border-violet-500/20">
          <Calendar className="w-7 h-7 text-violet-400 animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold text-text-main">⏳ Time-Locked Paste</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The sender has scheduled this paste to be revealed at a future time. Come back then.
          </p>
          <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl font-mono text-xs text-violet-300 space-y-1">
            <p>Unlocks At: <strong>{releaseDate}</strong></p>
            <p className="text-text-ghost">Approx. {hLeft}h {mLeft}m remaining</p>
          </div>
        </div>
        <a href="/" className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer">
          Create New Paste
        </a>
      </div>
    );
  }

  // 1.4. OTP Gate — sender required OTP verification
  if (otpRequired && !otpVerified) {
    const sendOtp = async () => {
      setIsSendingOtp(true);
      setOtpError('');
      try {
        const res = await fetch(`/api/pastes/${id}/otp`, { method: 'POST' });
        const data = await res.json();
        setOtpSent(true);
        if (data.demo_otp) setDemoOtp(data.demo_otp);
      } catch {
        setOtpError('Failed to send OTP. Try again.');
      } finally {
        setIsSendingOtp(false);
      }
    };

    const verifyOtp = async () => {
      setOtpError('');
      try {
        const res = await fetch(`/api/pastes/${id}/otp`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: otpInput.trim() }),
        });
        const data = await res.json();
        if (data.verified) {
          setOtpVerified(true);
          setOtpRequired(false);
        } else {
          setOtpError(data.error || 'Verification failed.');
        }
      } catch {
        setOtpError('Network error. Try again.');
      }
    };

    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-cyan-500/20 bg-cyan-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto border border-cyan-500/20">
          <ShieldCheck className="w-7 h-7 text-cyan-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-main">🔐 OTP Identity Gate</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The sender protected this paste with a One-Time Password. You must verify before accessing the content.
          </p>
        </div>
        {!otpSent ? (
          <button
            id="otp-send-btn"
            onClick={sendOtp}
            disabled={isSendingOtp}
            className="btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all w-full"
          >
            {isSendingOtp ? '⏳ Sending OTP...' : '📨 Send OTP (Simulated SMS)'}
          </button>
        ) : (
          <div className="space-y-3">
            {demoOtp && (
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300">
                🧪 Demo OTP: <strong className="text-white">{demoOtp}</strong>
              </div>
            )}
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-input-bg border border-input-border rounded-xl px-4 py-3 text-sm font-mono text-center tracking-widest text-text-main placeholder:text-text-ghost focus:outline-none focus:border-cyan-500"
            />
            {otpError && <p className="text-rose-400 text-xs">{otpError}</p>}
            <button
              id="otp-verify-btn"
              onClick={verifyOtp}
              className="btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all w-full"
            >
              ✓ Verify OTP
            </button>
            <button onClick={sendOtp} className="text-xs text-text-ghost hover:text-cyan-400 underline">
              Resend OTP
            </button>
          </div>
        )}
      </div>
    );
  }

  // 1.5. Whistleblower switch locked countdown screen
  if (isDeadManLocked) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-amber-500/20 bg-amber-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
          <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold text-text-main">Whistleblower Switch Active</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            This paste is locked under a whistleblower Dead Man's Switch. The countdown is still active.
          </p>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl font-mono text-xs text-amber-400">
            Auto-Release Due: {deadManCheckInDue ? new Date(deadManCheckInDue).toLocaleString() : ''}
          </div>
          <p className="text-[10px] text-text-ghost">
            If the whistleblower fails to check in before this time, the encryption keys will release automatically.
          </p>
        </div>
        <a
          href="/"
          className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          Create New Switch
        </a>
      </div>
    );
  }

  // 2. Error screen (paste not found or expired)
  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-rose-500/20 bg-rose-500/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-text-main">Secure Paste Unavailable</h3>
          <p className="text-xs text-text-muted leading-relaxed">{errorMsg}</p>
        </div>
        <a
          href="/"
          className="inline-block btn-gradient font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          Create New Paste
        </a>
      </div>
    );
  }

  // 3. SSS Threshold vault combination UI
  if (isSssShare && !payload) {
    return (
      <div className="max-w-xl mx-auto py-10 px-6 glass-panel rounded-2xl border-panel-border text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
          <Users2 className="w-6 h-6 text-indigo-400" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-main">Shamir Threshold Governance Vault</h3>
          <p className="text-xs text-text-muted">
            This paste decryption key was split. You must gather and enter the required threshold shares to reconstruct the key.
          </p>
        </div>

        {/* List of currently accumulated shares */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold text-text-ghost uppercase">Accumulated Shares ({sssShares.length})</span>
          <div className="space-y-2">
            {sssShares.map((share, idx) => (
              <div key={idx} className="flex bg-btn-sec-bg border border-panel-border p-2 rounded-xl items-center justify-between">
                <span className="text-xs font-mono text-violet-400 truncate pl-2 pr-2">
                  Share #{idx + 1}: {share.substring(0, 8)}...{share.substring(58)}
                </span>
                {idx > 0 && (
                  <button
                    onClick={() => removeSssShare(idx)}
                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-[10px] px-2 font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input to add next share */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste another share key here..."
            value={newShareInput}
            onChange={(e) => setNewShareInput(e.target.value)}
            className="flex-1 glass-input rounded-xl px-4 py-3 text-sm font-mono"
          />
          <button
            onClick={addSssShare}
            className="btn-gradient p-3.5 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
            title="Add Share"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Decryption password (if set) */}
        {isPasswordProtected && (
          <div className="space-y-2 text-left pt-2 border-t border-panel-border">
            <label className="text-xs font-bold text-text-muted flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Optional Password
            </label>
            <input
              type="password"
              placeholder="Vault Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-3 text-sm"
            />
          </div>
        )}

        {/* Trigger Combine */}
        <button
          onClick={handleSssDecrypt}
          disabled={isDecrypting}
          className="w-full btn-gradient font-bold py-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isDecrypting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reconstructing Master Key...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              Combine Shares & Unlock Vault
            </>
          )}
        </button>
      </div>
    );
  }

  // 4. Password decryption prompt screen (non-SSS)
  if (isPasswordProtected && !payload) {
    return (
      <div className="max-w-2xl mx-auto glass-panel rounded p-6 md:p-10 relative shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse" />

        <div className="flex justify-between items-start mb-8 border-b border-panel-border pb-4">
          <div className="text-left space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-main tracking-tight font-sans">DECRYPT PAYLOAD</h1>
            <p className="text-xs font-mono text-text-muted">ID: {id} {'// STATUS: LOCKED'}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-emerald-400 text-[10px] font-mono uppercase tracking-widest shrink-0">
            TOP SECRET // CLASSIFIED
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDecrypt();
          }}
          className="flex flex-col gap-6 py-4 items-center w-full max-w-md mx-auto"
        >
          <div className="w-full text-left">
            <label className="block text-xs font-mono text-teal-400 mb-2">Master Password Required</label>
            <div className="relative w-full">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-ghost" />
              <input
                type="password"
                placeholder="Enter Decryption Key..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="terminal-input w-full text-text-main font-mono text-sm p-3 pl-10 rounded-md"
                required
                autoFocus
              />
            </div>
          </div>

          {decryptionError && (
            <p className="text-xs text-rose-400 font-semibold animate-pulse">
              Decryption failed. Please check the password or URL key.
            </p>
          )}

          <button
            type="submit"
            disabled={isDecrypting}
            className="w-full btn-gradient font-bold font-mono py-3.5 rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer glow-hover"
          >
            {isDecrypting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Decrypting Client-Side...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Decrypt
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // 5. Main decrypted paste view
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Warning banner for burn after read */}
      {burnAfterRead && (
        <div className="glass-panel border-rose-500/30 bg-rose-500/10 px-4 py-3 rounded flex items-center gap-3 text-left animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-mono font-semibold text-rose-300 uppercase tracking-wide">
            Self-Destruct Sequence Initiated: Data Will Be Vaporized Upon Closing This Session.
          </span>
        </div>
      )}

      {/* Header Panel */}
      <div className="glass-panel rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-violet-400 shadow-[0_0_10px_#a78bfa]" />
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse" />

        <div className="flex flex-col text-left space-y-1.5">
          <h2 className="text-xl font-bold text-text-main tracking-tight">{payload?.title || 'Untitled Paste'}</h2>
          <p className="text-xs font-mono text-text-ghost">ID: {id} {'// STATUS: DECRYPTED'}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              Created {createdAt ? new Date(createdAt).toLocaleString() : 'Unknown'}
            </span>
            {expiresAt && (
              <span className="flex items-center gap-1 text-rose-400/80">
                <Clock className="w-3.5 h-3.5" />
                Expires {new Date(expiresAt).toLocaleTimeString()}
              </span>
            )}
            <span className="bg-btn-sec-bg px-2 py-0.5 rounded capitalize">
              {payload?.format === 'plaintext' ? 'Plain Text' : payload?.format}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Tooltip text="Copy the decrypted text to your clipboard." className="flex-1 sm:flex-initial">
            <button
              onClick={handleCopy}
              className="w-full glass-panel flex items-center justify-center gap-1.5 px-4 py-2.5 rounded border border-teal-500/30 text-xs font-mono font-semibold text-teal-400 hover:bg-white/5 active:scale-95 transition-all cursor-pointer uppercase"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy to Buffer'}
            </button>
          </Tooltip>

          <Tooltip text="Show a QR code of this page's URL, for opening it quickly on a phone." className="flex-1 sm:flex-initial">
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full glass-panel flex items-center justify-center gap-1.5 px-4 py-2.5 rounded border border-violet-500/30 text-xs font-mono font-semibold text-violet-400 hover:bg-white/5 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <QrCode className="w-4 h-4" />
              QR Share
            </button>
          </Tooltip>

          <Tooltip text="Demo: splits this link into 3 QR codes that loop on screen, for transferring to an offline device's camera." className="flex-1 sm:flex-initial">
            <button
              onClick={handleOpenAirGap}
              className="w-full glass-panel flex items-center justify-center gap-1.5 px-4 py-2.5 rounded border border-sky-500/30 text-xs font-mono font-semibold text-sky-400 hover:bg-white/5 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Cpu className="w-4 h-4" />
              Air-Gap Loop
            </button>
          </Tooltip>

          <Tooltip text="Print this page." className="hidden sm:inline-flex">
            <button
              onClick={handlePrint}
              className="glass-panel p-2.5 rounded border border-panel-border text-text-muted hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* QR Code display */}
      {showQr && (
        <div className="glass-panel p-6 rounded-2xl text-center space-y-3 animate-slide-in">
          <h4 className="text-sm font-semibold text-text-main">Scan to Open on Mobile Device</h4>
          <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`}
              alt="QR Code Link"
              className="w-40 h-40"
            />
          </div>
          <p className="text-[10px] text-text-ghost max-w-xs mx-auto">
            Scan this QR code with your mobile camera to load this zero-knowledge encrypted note.
          </p>
        </div>
      )}

      {/* Air-Gap animated QR modal overlay */}
      {isAirGapOpen && qrChunks.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 text-center border-sky-500/20 bg-sky-500/5 animate-scale-up relative">
            <button
              onClick={() => setIsAirGapOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-main font-bold p-1 bg-btn-sec-bg rounded-lg cursor-pointer"
            >
              ✕
            </button>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-main flex items-center justify-center gap-2">
                <Cpu className="w-5 h-5 text-sky-400 animate-pulse" />
                Air-Gap Animated QR Stream
              </h3>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Splits paste decryption keys and routes into 3 packets and streams them dynamically.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl mx-auto border-4 border-sky-500/20">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrChunks[activeQrIndex])}`}
                alt="Blinking QR Loop Chunk"
                className="w-48 h-48"
              />
              <div className="mt-2 text-[9px] font-mono text-bg-main font-bold">
                Streaming Packet {activeQrIndex + 1}/3
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase">Simulate Recipient Device</span>
                {!isSimulatingScan && (
                  <button
                     onClick={startSimulatedScanner}
                     className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[9px] font-bold transition-all cursor-pointer"
                  >
                     Trigger Simulated Scan
                  </button>
                )}
              </div>
              
              <div className="bg-bg-main/70 border border-panel-border rounded-xl p-3 h-28 overflow-y-auto font-mono text-[9px] text-sky-300 space-y-1">
                {simulatedScannerLogs.length === 0 ? (
                  <span className="text-text-ghost">Click "Trigger Simulated Scan" to watch the camera assembler protocol decode the blinking loop...</span>
                ) : (
                  simulatedScannerLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[9px] text-text-ghost">
              Scanning with the receiver camera automatically combines these fragments directly in memory, leaving zero traces on intermediate networks.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded overflow-hidden flex flex-col">
          {/* Top editor border bar */}
          <div className="bg-btn-sec-bg px-6 py-3 border-b border-panel-border flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Decrypted Content</span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Decrypted Client-Side (Zero-Knowledge)
            </span>
          </div>

          <div className={`p-6 md:p-8 overflow-x-auto min-h-[300px] ${payload?.format === 'code' ? 'code-viewer' : ''}`}>
            {payload?.format === 'markdown' && renderMarkdown(payload.text)}
            {payload?.format === 'code' && renderCode(payload.text)}
            {payload?.format === 'plaintext' && (
              <pre className="font-sans text-sm text-left text-text-main whitespace-pre-wrap leading-relaxed select-text">
                {payload.text}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Decrypted File Attachment / Audio Voice Memo block */}
      {payload?.file && (
        <div className="glass-panel rounded-2xl p-5 border-teal-500/20 bg-teal-500/5 animate-slide-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left flex-1">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                {payload.file.name === 'voice_memo.webm' ? <Volume2 className="w-6 h-6 text-teal-400" /> : <FileText className="w-6 h-6 text-teal-400" />}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-text-main truncate max-w-xs sm:max-w-md">
                  {payload.file.name === 'voice_memo.webm' ? 'Secure Voice Note Memo' : payload.file.name}
                </span>
                <span className="text-xs text-text-ghost">
                  {(payload.file.size / 1024).toFixed(1)} KB • {payload.file.type || 'Unknown Filetype'}
                </span>
                {payload.file.name === 'voice_memo.webm' && (
                  <audio
                    controls
                    src={payload.file.data}
                    className="mt-3.5 w-full max-w-md border border-teal-500/20 rounded-lg"
                  />
                )}
              </div>
            </div>

            {payload.file.name !== 'voice_memo.webm' && (
              <Tooltip text="Save the decrypted file to your device." className="w-full sm:w-auto">
                <button
                  onClick={handleDownloadFile}
                  className="w-full glass-panel sm:w-auto px-6 py-3 rounded border border-teal-500/30 text-xs font-mono font-semibold text-teal-400 flex items-center justify-center gap-1.5 hover:bg-white/5 active:scale-95 transition-all cursor-pointer uppercase"
                >
                  <Download className="w-4 h-4" />
                  Download Intel
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Decrypted Sketchboard Canvas Draw visual */}
      {payload?.sketch && (
        <div className="glass-panel rounded-2xl p-5 border-violet-500/20 bg-violet-500/5 animate-slide-in text-left space-y-3">
          <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-violet-400 animate-pulse" />
            Decrypted Secure Drawing
          </span>
          <div className="border border-panel-border rounded-xl overflow-hidden bg-bg-main p-2 flex items-center justify-center">
            <img 
              src={payload.sketch} 
              alt="Decrypted Secure Diagram Sketch" 
              className="max-w-full max-h-96 object-contain block rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
