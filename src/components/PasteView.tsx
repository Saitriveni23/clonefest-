'use client';

import React, { useState, useEffect } from 'react';
import { decryptData } from '@/lib/crypto';
import { reconstructKey } from '@/lib/sss';
import { 
  Lock, Unlock, Clock, FileText, 
  Trash2, Download, Copy, Check, QrCode, ShieldAlert,
  Loader2, Printer, AlertTriangle, Key, Users2, Plus, Volume2
} from 'lucide-react';
import { Toast, ToastType } from './Toast';

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
}

export function PasteView({ id }: PasteViewProps) {
  // Whistleblower dead man locked states
  const [isDeadManLocked, setIsDeadManLocked] = useState(false);
  const [deadManCheckInDue, setDeadManCheckInDue] = useState<number | null>(null);

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
            throw new Error('This paste does not exist, has expired, or was already burned.');
          }
          throw new Error('Failed to retrieve paste from server.');
        }

        const data = await response.json();

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
        console.error(err);
        setErrorMsg(err.message || 'An error occurred.');
        setIsLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

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
            setPayload(parsedPayload);
            setToast({ message: 'Genuine vault decrypted successfully!', type: 'success' });
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
            setPayload(parsedPayload);
            setToast({ message: 'Decoy vault decrypted successfully! (Plausible Deniability)', type: 'info' });
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

      setPayload(parsedPayload);
      setToast({ message: 'Paste decrypted successfully!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setDecryptionError(true);
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

      setPayload(parsedPayload);
      setToast({ message: 'Vault unlocked successfully via combined shares!', type: 'success' });
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
      <div className="max-w-md mx-auto py-12 px-6 glass-panel rounded-2xl border-panel-border bg-btn-sec-bg/5 text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto border border-violet-500/20">
          <Lock className="w-6 h-6 text-violet-400" />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-main">Password Protected Paste</h3>
          <p className="text-xs text-text-muted">
            This paste requires a password for client-side decryption. The server does not know this password.
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleDecrypt();
          }}
          className="space-y-4"
        >
          <input
            type="password"
            placeholder="Enter decryption password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full glass-input rounded-xl px-4 py-3 text-sm"
            required
            autoFocus
          />

          {decryptionError && (
            <p className="text-xs text-rose-400 font-semibold animate-pulse">
              Decryption failed. Please check the password or URL key.
            </p>
          )}

          <button
            type="submit"
            disabled={isDecrypting}
            className="w-full btn-gradient font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {isDecrypting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Decrypting Client-Side...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Unlock & Decrypt
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
        <div className="glass-panel border-amber-500/20 bg-amber-500/5 px-4 py-3 rounded-xl flex items-center gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-main">Burn After Reading Active</span>
            <span className="text-[10px] text-text-muted">
              This copy is the only copy. It has been permanently deleted from the database. Closing this page means the content is lost forever!
            </span>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col text-left space-y-1.5">
          <h2 className="text-xl font-bold text-text-main tracking-tight">{payload?.title || 'Untitled Paste'}</h2>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
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
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover active:scale-95 text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button
            onClick={() => setShowQr(!showQr)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover active:scale-95 text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            QR Share
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover active:scale-95 text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer hidden sm:block"
            title="Print Page"
          >
            <Printer className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>

      {/* QR Code display */}
      {showQr && (
        <div className="glass-panel p-6 rounded-2xl text-center space-y-3 animate-slide-in">
          <h4 className="text-sm font-semibold text-text-main">Scan to Open on Mobile Device</h4>
          <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
            <img
              src={`https://chart.googleapis.com/chart?cht=qr&chs=180&chl=${encodeURIComponent(window.location.href)}`}
              alt="QR Code Link"
              className="w-40 h-40"
            />
          </div>
          <p className="text-[10px] text-text-ghost max-w-xs mx-auto">
            Scan this QR code with your mobile camera to load this zero-knowledge encrypted note.
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          {/* Top editor border bar */}
          <div className="bg-btn-sec-bg px-6 py-3 border-b border-panel-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Decrypted Content</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Decrypted Client-Side (Zero-Knowledge)
            </span>
          </div>

          <div className="p-6 md:p-8 overflow-x-auto min-h-[300px]">
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
              <button
                onClick={handleDownloadFile}
                className="w-full sm:w-auto btn-gradient font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Decrypted File
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
