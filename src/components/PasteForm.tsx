'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { encryptData, generateKey } from '@/lib/crypto';
import { splitKey } from '@/lib/sss';
import { encodeTextInImage, decodeTextFromImage } from '@/lib/stego';
import { 
  FileText, Code, Lock, Unlock, Calendar, 
  Trash2, Upload, X, Copy, Check, QrCode, ArrowRight, ShieldCheck, Loader2,
  Share2, Users2, MessageSquareCode, Image as ImageIcon, Bot, Download, Eye,
  Mic, Square, Volume2, AlertCircle, Fingerprint, RefreshCw, Cpu, Globe, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Toast, ToastType } from './Toast';
import { Tooltip } from './Tooltip';

const LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'cpp', label: 'C++' },
  { value: 'markdown', label: 'Markdown' },
];

const EXPIRATIONS = [
  { value: '300', label: '5 Minutes' },
  { value: '3600', label: '1 Hour' },
  { value: '86400', label: '1 Day' },
  { value: '604800', label: '1 Week' },
  { value: '2592000', label: '1 Month' },
  { value: 'never', label: 'Never' },
];

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoding
}

async function hashSha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Scan text for sensitive patterns and return human-readable warnings */
function scanForPii(text: string): string[] {
  const warnings: string[] = [];
  const checks: [RegExp, string][] = [
    [/(?:password|passwd|pwd)\s*[:=]\s*\S+/i, '🔑 Possible plaintext password detected'],
    [/(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*\S+/i, '🗝️ API key/secret detected'],
    [/AKIA[0-9A-Z]{16}/i, '☁️ AWS Access Key ID detected'],
    [/(?:-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/i, '🔐 Private key block detected'],
    [/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i, '📧 Email address detected'],
    [/\b(?:\d[ -]?){15,16}\b/, '💳 Potential credit card number detected'],
    [/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}/i, '🐙 GitHub Personal Access Token detected'],
    [/sk-[a-zA-Z0-9]{40,}/i, '🤖 OpenAI API key pattern detected'],
    [/(?:SSN|social.?security)\D{0,5}\d{3}[-.\s]\d{2}[-.\s]\d{4}/i, '🪪 SSN pattern detected'],
    [/(?:xox[baprs]-)[0-9A-Za-z\-]+/i, '💬 Slack token detected'],
  ];
  for (const [pattern, message] of checks) {
    if (pattern.test(text)) warnings.push(message);
  }
  return warnings;
}


export function PasteForm({ defaultMethod = 'direct' }: { defaultMethod?: 'direct' | 'threshold' | 'chat' | 'stego' | 'slack' }) {
  const router = useRouter();

  // Method tab: direct paste vs advanced extensions
  const [method, setMethod] = useState<'direct' | 'threshold' | 'chat' | 'stego' | 'slack'>(defaultMethod);

  useEffect(() => {
    setMethod(defaultMethod);
  }, [defaultMethod]);

  // Load user settings on mount
  useEffect(() => {
    try {
      const savedExpiry = localStorage.getItem('cipherdrop:default-expiry');
      if (savedExpiry) {
        setExpiration(savedExpiry);
      }
    } catch (e) {
      console.warn('Failed to load default retention settings:', e);
    }
  }, []);

  // Form input fields
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [format, setFormat] = useState<'plaintext' | 'code' | 'markdown'>('plaintext');
  const [language, setLanguage] = useState('plaintext');
  const [expiration, setExpiration] = useState('86400');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<FileAttachment | null>(null);

  // Threshold SSS inputs
  const [thresholdN, setThresholdN] = useState(2);
  const [sharesM, setSharesM] = useState(3);

  // Stego image input
  const [stegoBaseImage, setStegoBaseImage] = useState<string | null>(null);
  
  // Slack command input
  const [slackUser, setSlackUser] = useState('john_doe');

  // Decoy Plausible Deniability states
  const [isDecoyEnabled, setIsDecoyEnabled] = useState(false);
  const [decoyText, setDecoyText] = useState('');
  const [decoyPassword, setDecoyPassword] = useState('');

  // Dead Man Switch states
  const [isDeadMan, setIsDeadMan] = useState(false);
  const [deadManInterval, setDeadManInterval] = useState('86400');
  const [deadManKey, setDeadManKey] = useState('');

  // Time-locked CPU puzzle and Duress self-destruct states
  const [isTimeLocked, setIsTimeLocked] = useState(false);
  const [duressKey, setDuressKey] = useState('');

  // Sketchpad states and refs
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawingLine] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Honeypot Trap states
  const [isHoneypotTrapEnabled, setIsHoneypotTrapEnabled] = useState(false);

  // Rate-limiting and Geo-fencing options
  const [maxAttempts, setMaxAttempts] = useState('0');
  const [allowedCountries, setAllowedCountries] = useState('');

  // OTP Gate toggle
  const [otpRequired, setOtpRequired] = useState(false);

  // Time-release scheduled date
  const [releaseAfterDate, setReleaseAfterDate] = useState('');

  // AI PII Scanner state
  const [piiWarnings, setPiiWarnings] = useState<string[]>([]);
  const [piiChecked, setPiiChecked] = useState(false);

  // QR Scan limit and Biometric gate form state
  const [scanLimitInput, setScanLimitInput] = useState('0');
  const [biometricRequired, setBiometricRequired] = useState(false);

  // Guided Setup task wizard
  const [selectedTask, setSelectedTask] = useState<'text' | 'file' | 'voice' | 'sketch' | 'vault' | 'chat'>('text');
  const [showAdvancedOverrides, setShowAdvancedOverrides] = useState(false);

  const applyTaskBlueprint = (task: 'text' | 'file' | 'voice' | 'sketch' | 'vault' | 'chat') => {
    setSelectedTask(task);
    setSuccessMode(null);

    // Reset advanced overrides
    setIsDecoyEnabled(false);
    setIsDeadMan(false);
    setIsTimeLocked(false);
    setIsDrawingEnabled(false);
    setMaxAttempts('0');
    setAllowedCountries('');
    setOtpRequired(false);
    setReleaseAfterDate('');
    setScanLimitInput('0');
    setBiometricRequired(false);

    if (task === 'text') {
      setMethod('direct');
      setFile(null);
      setBurnAfterRead(true);
      setMaxAttempts('3'); // Auto-destruct guess shield
    } else if (task === 'file') {
      setMethod('direct');
      setBurnAfterRead(false);
      setBiometricRequired(true); // Requiring biometric touch ID
    } else if (task === 'voice') {
      setMethod('direct');
      setFile(null);
      setBurnAfterRead(false);
      setScanLimitInput('1'); // Destroy after 1 scan
    } else if (task === 'sketch') {
      setMethod('direct');
      setFile(null);
      setIsDrawingEnabled(true); // Show canvas
      setBurnAfterRead(false);
    } else if (task === 'vault') {
      setMethod('threshold'); // Shamir multi-custodian
      setFile(null);
      setBurnAfterRead(false);
    } else if (task === 'chat') {
      setMethod('chat'); // Polling Chat Room
      setFile(null);
      setBurnAfterRead(false);
    }
  };

  const addToHistory = (item: {
    id: string;
    title: string;
    type: string;
    shareUrl: string;
    manageUrl?: string;
  }) => {
    try {
      if (typeof window === 'undefined') return;
      const historyStr = localStorage.getItem('cipherdrop:history') || '[]';
      const history = JSON.parse(historyStr);
      history.unshift({
        ...item,
        date: new Date().toISOString(),
      });
      localStorage.setItem('cipherdrop:history', JSON.stringify(history.slice(0, 50)));
      window.dispatchEvent(new Event('cipherdrop:history-change'));
    } catch (e) {
      console.error('Failed to save to history:', e);
    }
  };

  // Audio recording states and refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Query supported container formats
      let selectedMimeType = '';
      const types = ['audio/mp4', 'audio/aac', 'audio/webm', 'audio/ogg'];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }
      
      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      const actualMimeType = recorder.mimeType || selectedMimeType || 'audio/webm';
      audioChunksRef.current = [];

      recorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const reader = new FileReader();
        reader.onload = () => {
          const extension = actualMimeType.split('/')[1]?.split(';')[0] || 'webm';
          setFile({
            name: `voice_memo.${extension}`,
            type: actualMimeType,
            size: audioBlob.size,
            data: reader.result as string,
          });
          setToast({ message: 'Voice memo recorded successfully!', type: 'success' });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to access microphone.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Canvas Sketching helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#a78bfa'; // violet line color
    setIsDrawingLine(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingLine = () => {
    setIsDrawingLine(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSketchDataUrl(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSketchDataUrl(null);
  };

  // Live Obfuscated encryption preview
  const getLiveScramble = (val: string) => {
    if (!val) return 'matrix_ready_awaiting_keystrokes...';
    try {
      const base = btoa(unescape(encodeURIComponent(val.substring(0, 150))));
      return base.replace(/./g, (c, i) => (i % 5 === 0 ? ' ' : c)).substring(0, 120);
    } catch (e) {
      return 'obfuscating_buffer_stream...';
    }
  };

  // Stego Sub-mode & Decode states
  const [stegoSubMode, setStegoSubMode] = useState<'encode' | 'decode'>('encode');
  const [decodedStegoUrl, setDecodedStegoUrl] = useState('');
  const [isDecodingStego, setIsDecodingStego] = useState(false);
  const stegoDecodeRef = useRef<HTMLInputElement>(null);

  const handleDecodeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsDecodingStego(true);
    setDecodedStegoUrl('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const decoded = await decodeTextFromImage(reader.result as string);
        setDecodedStegoUrl(decoded);
        setToast({ message: 'Covert link decoded successfully!', type: 'success' });
        triggerConfetti();
      } catch (err: any) {
        console.error(err);
        setToast({ message: err.message || 'Failed to decode stego image.', type: 'error' });
      } finally {
        setIsDecodingStego(false);
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  // Tab states for markdown preview
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Submit and modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Outputs (Success screens)
  const [successMode, setSuccessMode] = useState<'direct' | 'threshold' | 'chat' | 'stego' | 'slack' | null>(null);
  const [directShareUrl, setDirectShareUrl] = useState('');
  const [directManageUrl, setDirectManageUrl] = useState('');
  const [thresholdUrls, setThresholdUrls] = useState<string[]>([]);
  const [chatUrl, setChatUrl] = useState('');
  const [stegoPngUrl, setStegoPngUrl] = useState('');
  const [slackResponseText, setSlackResponseText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stegoImageRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Upstash Redis free tier REST API payload size limit is 1MB. 
    // Base64 encoding + encryption adds ~33% size overhead. 
    // We restrict attachments to 700KB to guarantee database writes succeed.
    if (uploadedFile.size > 700 * 1024) {
      setToast({
        message: 'File size must be under 700KB due to database payload constraints (1MB max).',
        type: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        data: reader.result as string,
      });
      setToast({
        message: `File "${uploadedFile.name}" attached successfully!`,
        type: 'success',
      });
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleStegoImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStegoBaseImage(reader.result as string);
      setToast({ message: 'Cover image uploaded. CipherText will be embedded inside.', type: 'success' });
    };
    reader.readAsDataURL(uploadedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file && method !== 'slack') {
      setToast({ message: 'Please enter some text or upload a file.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (method === 'direct') {
        // Direct share includes management token (Secure Inbox)
        const keyHex = generateKey();
        const manageKey = generateKey();
        const manageKeyHash = await hashSha256(manageKey);

        let finalCiphertext = '';
        let finalIv = '';

        if (isDecoyEnabled) {
          if (!decoyPassword || !password) {
            throw new Error('Both real password and decoy password are required for decoy vaults.');
          }

          // 1. Encrypt Real Payload
          const realPayload = {
            verification: 'cipherdrop-verify',
            title: title.trim() || 'Untitled Paste',
            text: text,
            format: format,
            language: format === 'code' ? language : 'plaintext',
            file: file,
            is_time_locked: isTimeLocked,
            sketch: sketchDataUrl || null,
          };
          const realEnc = await encryptData(JSON.stringify(realPayload), keyHex, password);

          // 2. Encrypt Decoy Payload
          const decoyPayload = {
            verification: 'cipherdrop-verify',
            title: title.trim() || 'Decoy Paste',
            text: decoyText,
            format: 'plaintext',
            language: 'plaintext',
            file: null,
            is_time_locked: isTimeLocked,
            sketch: null,
          };
          const decoyEnc = await encryptData(JSON.stringify(decoyPayload), keyHex, decoyPassword);

          // 3. Wrap both ciphertexts in plain JSON structure
          const wrapper = {
            is_decoy_vault: true,
            real_ciphertext: realEnc.ciphertext,
            real_iv: realEnc.iv,
            decoy_ciphertext: decoyEnc.ciphertext,
            decoy_iv: decoyEnc.iv,
          };

          finalCiphertext = JSON.stringify(wrapper);
          finalIv = 'decoy-vault-wrapper-iv';
        } else {
          // Standard direct share encryption
          const payload = {
            verification: 'cipherdrop-verify',
            title: title.trim() || 'Untitled Paste',
            text: text,
            format: format,
            language: format === 'code' ? language : 'plaintext',
            file: file,
            is_time_locked: isTimeLocked,
            sketch: sketchDataUrl || null,
          };
          const enc = await encryptData(
            JSON.stringify(payload),
            keyHex,
            password ? password : undefined
          );
          finalCiphertext = enc.ciphertext;
          finalIv = enc.iv;
        }

        const expires_in_seconds = expiration === 'never' ? null : parseInt(expiration);
        
        let check_in_key_hash = null;
        if (isDeadMan) {
          if (!deadManKey) {
            throw new Error('A check-in key is required for Dead Man switches.');
          }
          check_in_key_hash = await hashSha256(deadManKey);
        }

        let duress_key_hash = null;
        if (duressKey) {
          duress_key_hash = await hashSha256(duressKey);
        }

        const response = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciphertext: finalCiphertext,
            iv: finalIv,
            expires_in_seconds,
            burn_after_read: isDeadMan ? false : burnAfterRead,
            password_protected: isDecoyEnabled || !!password,
            manage_key_hash: manageKeyHash,
            is_dead_man: isDeadMan,
            check_in_interval: isDeadMan ? Number(deadManInterval) : null,
            check_in_key_hash,
            duress_key_hash,
            max_attempts: maxAttempts ? Number(maxAttempts) : 0,
            allowed_countries: allowedCountries || null,
            otp_required: otpRequired,
            release_after: releaseAfterDate ? new Date(releaseAfterDate).getTime() : null,
            scan_limit: scanLimitInput ? Number(scanLimitInput) : 0,
            biometric_required: biometricRequired,
          }),
        });

        if (!response.ok) throw new Error('Failed to create paste.');
        const data = await response.json();

        setDirectShareUrl(`${window.location.origin}/p/${data.id}#${keyHex}`);
        const deadManHashFragment = isDeadMan ? `&checkin=${deadManKey}` : '';
        const duressHashFragment = duressKey ? `&duress=${duressKey}` : '';
        const mUrl = `${window.location.origin}/p/${data.id}/manage#${manageKey}${deadManHashFragment}${duressHashFragment}`;
        setDirectManageUrl(mUrl);
        setSuccessMode('direct');
        triggerConfetti();

        // Auto-copy recipient link if user settings preference is enabled
        const autoCopy = localStorage.getItem('cipherdrop:autocopy') !== 'false';
        if (autoCopy) {
          navigator.clipboard.writeText(`${window.location.origin}/p/${data.id}#${keyHex}`)
            .then(() => {
              setToast({ message: 'Secure link generated and copied to clipboard!', type: 'success' });
            })
            .catch(() => {});
        }

        addToHistory({
          id: data.id,
          title: title.trim() || 'Classified Text / Secrets',
          type: selectedTask,
          shareUrl: `${window.location.origin}/p/${data.id}#${keyHex}`,
          manageUrl: mUrl,
        });

      } else if (method === 'threshold') {
        // SSS Threshold split
        const keyHex = generateKey();
        const payload = {
          verification: 'cipherdrop-verify',
          title: title.trim() || 'Threshold Vault',
          text: text,
          format: format,
          language: format === 'code' ? language : 'plaintext',
          file: file,
        };

        const { ciphertext, iv } = await encryptData(JSON.stringify(payload), keyHex);
        const expires_in_seconds = expiration === 'never' ? null : parseInt(expiration);

        const response = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciphertext,
            iv,
            expires_in_seconds,
            burn_after_read: false, // Governance vaults shouldn't burn on single views
            password_protected: false,
          }),
        });

        if (!response.ok) throw new Error('Failed to create vault.');
        const data = await response.json();

        // Split key Hex client-side using SSS
        const shares = splitKey(keyHex, thresholdN, sharesM);
        const urls = shares.map(share => `${window.location.origin}/p/${data.id}#${share}`);
        setThresholdUrls(urls);
        setSuccessMode('threshold');
        triggerConfetti();

        addToHistory({
          id: data.id,
          title: title.trim() || 'Threshold Vault split',
          type: 'vault',
          shareUrl: `${window.location.origin}/p/${data.id}`,
        });

      } else if (method === 'chat') {
        // Chat room creation (polls E2E)
        const keyHex = generateKey();
        
        // Initial chat state is an empty array encrypted
        const { ciphertext, iv } = await encryptData(JSON.stringify([]), keyHex);
        const expires_in_seconds = expiration === 'never' ? 86400 : parseInt(expiration);

        const response = await fetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages_json: JSON.stringify({ ciphertext, iv }),
            expires_in_seconds,
          }),
        });

        if (!response.ok) throw new Error('Failed to create ephemeral room.');
        const data = await response.json();

        const cUrl = `${window.location.origin}/t/${data.id}#${keyHex}`;
        setChatUrl(cUrl);
        setSuccessMode('chat');
        triggerConfetti();

        addToHistory({
          id: data.id,
          title: 'Secure Polling Chat Node',
          type: 'chat',
          shareUrl: cUrl,
        });

      } else if (method === 'stego') {
        // Hiding ciphertext in cover image PNG
        const keyHex = generateKey();
        const payload = {
          verification: 'cipherdrop-verify',
          title: title.trim() || 'Covert Note',
          text: text,
          format: format,
          language: format === 'code' ? language : 'plaintext',
          file: file,
        };

        const { ciphertext, iv } = await encryptData(
          JSON.stringify(payload),
          keyHex,
          password ? password : undefined
        );

        // Upload normal paste to get ID
        const expires_in_seconds = expiration === 'never' ? null : parseInt(expiration);
        const response = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciphertext,
            iv,
            expires_in_seconds,
            burn_after_read: burnAfterRead,
            password_protected: !!password,
          }),
        });

        if (!response.ok) throw new Error('Failed to create covert paste.');
        const data = await response.json();

        // Target content is: URL representation of paste link
        const targetString = `${window.location.origin}/p/${data.id}#${keyHex}`;

        // Embed in canvas
        const encodedPng = await encodeTextInImage(targetString, stegoBaseImage || undefined);
        setStegoPngUrl(encodedPng);
        setSuccessMode('stego');
        triggerConfetti();

        addToHistory({
          id: data.id,
          title: title.trim() || 'Covert Stego Image',
          type: 'stego',
          shareUrl: targetString,
        });

      } else if (method === 'slack') {
        // Slackcommand simulation
        const bodyFormData = new FormData();
        bodyFormData.append('text', `${text} ${expiration === 'never' ? '' : expiration}`);
        bodyFormData.append('user_name', slackUser);

        const response = await fetch('/api/slack/secret', {
          method: 'POST',
          body: bodyFormData,
        });

        if (!response.ok) throw new Error('Slack Bot simulation failed.');
        const data = await response.json();

        setSlackResponseText(data.text);
        setSuccessMode('slack');
        triggerConfetti();
      }

    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || 'Encryption flow failed.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Simple custom markdown renderer preview
  const renderMarkdownPreview = () => {
    if (!text) return <p className="text-text-ghost italic">No content to preview</p>;
    
    // Convert headings
    let html = text
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

  const handleCopyLink = async (url: string, index: number | null = null) => {
    try {
      await navigator.clipboard.writeText(url);
      if (index !== null) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setToast({ message: 'Secure link copied!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  return (
    <div className="w-full space-y-6">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Sharing Method Tabs */}
      <div className="flex flex-wrap bg-btn-sec-bg p-1 rounded-2xl border border-panel-border gap-1">
        {[
          { key: 'direct', label: 'Secure Inbox', icon: Share2, tooltip: 'The standard way to share a secret: one encrypted link for the recipient, plus a separate management link for you to track reads or revoke it.' },
          { key: 'threshold', label: 'Threshold Vault', icon: Users2, tooltip: 'Splits the decryption key into multiple shares. Requires several people to combine their shares before the secret can be unlocked.' },
          { key: 'chat', label: 'E2E Polling Chat', icon: MessageSquareCode, tooltip: 'Opens a temporary encrypted chat room link instead of a single note, for a back-and-forth conversation.' },
          { key: 'stego', label: 'Covert Stego', icon: ImageIcon, tooltip: 'Hides the secret link inside an ordinary-looking PNG image instead of sending a link directly.' },
          { key: 'slack', label: 'Slack Command', icon: Bot, tooltip: 'Simulates sharing a secret via a Slack "/secret" bot command.' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Tooltip key={tab.key} text={tab.tooltip} className="flex-1">
              <Link
                href={tab.key === 'direct' ? '/' : `/${tab.key}`}
                onClick={() => setSuccessMode(null)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  method === tab.key
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            </Tooltip>
          );
        })}
      </div>

      {/* Success View: Direct Link */}
      {successMode === 'direct' && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center space-y-6 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-main">Note Shared and Locked!</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Your paste is encrypted. Keep the management URL safe. It is your only ticket to view read receipts or trigger a Panic Revoke.
            </p>
          </div>

          {burnAfterRead && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 max-w-md mx-auto flex items-start gap-3 text-left">
              <span className="text-rose-400 font-bold text-base mt-0.5">⚠️</span>
              <div className="flex-1 text-[11px] leading-relaxed text-rose-300">
                <span className="font-bold block uppercase tracking-wider mb-0.5">Burn-On-Read Active</span>
                The recipient link will only work **EXACTLY ONCE**. If you open the link yourself, the secret note will be self-destructed and the recipient won't be able to read it.
              </div>
            </div>
          )}

          <div className="space-y-4 max-w-md mx-auto">
            {/* Recipient Share Link */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-text-ghost uppercase">1. Recipient Share Link (Zero-Knowledge)</span>
              <div className="flex bg-btn-sec-bg border border-panel-border p-1 rounded-xl items-center justify-between">
                <span className="text-xs font-mono text-teal-400 truncate pl-3 pr-2 select-all">{directShareUrl}</span>
                <button
                  onClick={() => handleCopyLink(directShareUrl)}
                  className="p-2.5 rounded-lg bg-btn-sec-hover text-text-main flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">Copy</span>
                </button>
              </div>
            </div>

            {/* Sender Management Link */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-rose-400 uppercase">2. Sender Management Link (Receipts & Revoke)</span>
              <div className="flex bg-btn-sec-bg border border-rose-500/20 p-1 rounded-xl items-center justify-between">
                <span className="text-xs font-mono text-rose-400/90 truncate pl-3 pr-2 select-all">{directManageUrl}</span>
                <button
                  onClick={() => handleCopyLink(directManageUrl)}
                  className="p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">Copy</span>
                </button>
              </div>
            </div>

            {/* Honeypot Decoy Trap Link */}
            {isHoneypotTrapEnabled && (
              <div className="space-y-1.5 text-left animate-slide-in">
                <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  3. Decoy Honeypot Trap Link (Silent Intruder Log)
                </span>
                <div className="flex bg-btn-sec-bg border border-amber-500/20 p-1 rounded-xl items-center justify-between">
                  <span className="text-xs font-mono text-amber-400/90 truncate pl-3 pr-2 select-all">
                    {directShareUrl.replace('#', '?trap=1#')}
                  </span>
                  <button
                    onClick={() => handleCopyLink(directShareUrl.replace('#', '?trap=1#'))}
                    className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase">Copy</span>
                  </button>
                </div>
                <p className="text-[9px] text-text-ghost leading-normal">
                  ⚠️ Share this trap link ONLY where you expect intruders (e.g. leaked emails, dummy files). If opened, it silently logs details and displays them in your command dashboard.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setSuccessMode(null)}
              className="px-6 py-3 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Create Another
            </button>
            <a
              href={directShareUrl}
              className="btn-gradient px-6 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Open Paste
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Success View: Threshold split */}
      {successMode === 'threshold' && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center space-y-6 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Users2 className="w-7 h-7 text-indigo-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-main">Threshold Split Generated!</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Any <strong className="text-violet-400">{thresholdN} of the {sharesM}</strong> approvers listed below must paste their links together on the vault page to reconstruct the AES decryption key.
            </p>
          </div>

          <div className="space-y-3 max-w-lg mx-auto text-left">
            {thresholdUrls.map((url, i) => (
              <div key={i} className="space-y-1">
                <span className="text-[9px] font-bold text-text-ghost uppercase">Share keyholder #{i + 1} link</span>
                <div className="flex bg-btn-sec-bg border border-panel-border p-1 rounded-xl items-center justify-between">
                  <span className="text-xs font-mono text-violet-400 truncate pl-3 pr-2">{url}</span>
                  <button
                    onClick={() => handleCopyLink(url, i)}
                    className="p-2.5 rounded-lg bg-btn-sec-hover text-text-main flex items-center gap-1 cursor-pointer shrink-0 min-w-[70px] justify-center"
                  >
                    {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[9px] font-bold uppercase">{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setSuccessMode(null)}
              className="px-6 py-3 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Create Another Vault
            </button>
          </div>
        </div>
      )}

      {/* Success View: Chat Room */}
      {successMode === 'chat' && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center space-y-6 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto border border-teal-500/20">
            <MessageSquareCode className="w-7 h-7 text-teal-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-main">E2E chat room initialized!</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Share the URL. Both users will load, enter nicknames, and type in a zero-knowledge polling Signal-like thread.
            </p>
          </div>

          <div className="flex bg-btn-sec-bg border border-panel-border p-1 rounded-xl items-center justify-between max-w-md mx-auto">
            <span className="text-xs font-mono text-teal-400 truncate pl-3 pr-2 select-all">{chatUrl}</span>
            <button
              onClick={() => handleCopyLink(chatUrl)}
              className="p-2.5 rounded-lg bg-btn-sec-hover text-text-main flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase">Copy Link</span>
            </button>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setSuccessMode(null)}
              className="px-6 py-3 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Create Another Room
            </button>
            <a
              href={chatUrl}
              className="btn-gradient px-6 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Enter Chat Room
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Success View: Stego */}
      {successMode === 'stego' && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center space-y-6 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto border border-violet-500/20">
            <ImageIcon className="w-7 h-7 text-violet-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-text-main">Covert Stego PNG Created!</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              The encrypted key and paste reference have been steganographically hidden in the LSB pixels of this gradient image. Download it and send it to your recipient.
            </p>
          </div>

          {/* Stego PNG render */}
          <div className="p-3 bg-btn-sec-bg border border-panel-border rounded-xl inline-block shadow-inner max-w-xs mx-auto">
            <img src={stegoPngUrl} alt="Steganography Drop" className="w-48 h-48 rounded-lg" />
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setSuccessMode(null)}
              className="px-6 py-3 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Create Another
            </button>
            <a
              href={stegoPngUrl}
              download="cipherdrop_covert_secret.png"
              className="btn-gradient px-6 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Secure PNG
            </a>
          </div>
        </div>
      )}

      {/* Success View: Slack command response */}
      {successMode === 'slack' && (
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-left space-y-6 animate-scale-in">
          <div className="flex items-center gap-2 border-b border-panel-border pb-4">
            <Bot className="w-6 h-6 text-amber-500" />
            <h3 className="text-base font-bold text-text-main">Simulated Slack WebHook Response</h3>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-text-ghost uppercase font-semibold">Slack Channel Message Rendering</span>
            {/* Render chat balloon resembling slack client */}
            <div className="bg-slate-950 border border-panel-border p-4 rounded-xl space-y-3 font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white uppercase select-none">
                  CD
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200">CipherDrop Bot</span>
                  <span className="text-[10px] text-slate-500 ml-2">App • Just Now</span>
                </div>
              </div>
              <div className="pl-10 text-xs leading-relaxed text-slate-300">
                {/* Format markdown in slack response string */}
                <p className="font-semibold text-slate-100">🔐 Secure Secret shared by @{slackUser} via CipherDrop:</p>
                <p className="text-slate-400 mt-1">This note is zero-knowledge encrypted and will self-destruct upon reading.</p>
                
                {/* Parse secure URL out of the text to show as clickable */}
                {(() => {
                  const urlMatch = slackResponseText.match(/<(.*?)\|/);
                  const url = urlMatch ? urlMatch[1] : '#';
                  return (
                    <div className="mt-3">
                      <a
                        href={url}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-bold hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        👉 Click here to decrypt note
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSuccessMode(null)}
              className="px-6 py-3 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Trigger Another Command
            </button>
          </div>
        </div>
      )}

      {/* Main Creation Form (Only shows if no successMode) */}
      {!successMode && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          {/* Method title and descriptions */}
          <div className="text-left space-y-1">
            <h3 className="text-lg font-bold text-text-main">
              {method === 'direct' && 'Secure Inbox (Receipts & Revoke)'}
              {method === 'threshold' && 'Threshold Governance Vault'}
              {method === 'chat' && 'Ephemeral End-to-End Chat Thread'}
              {method === 'stego' && 'Covert Steganography Drop'}
              {method === 'slack' && 'Slack Deliver Command Bot'}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {method === 'direct' && 'Share secure zero-knowledge paste. Includes tracking read status receipts and a Panic Revoke override key.'}
              {method === 'threshold' && 'AES Decryption Key is split into M keyholder shares using Shamir Secret Sharing. At least N keyholders must input their parts concurrently to decrypt.'}
              {method === 'chat' && 'Creates a temporary end-to-end client-encrypted conversation. Message data polls every 2s, updating on chat nodes in real time. Decrypted strictly in browser.'}
              {method === 'stego' && 'Ciphertext payload is hidden inside the least significant bits of a generated gradient image canvas. Send the PNG image directly to recipients.'}
              {method === 'slack' && 'Simulate sending credentials using `/secret [key] [expires]` from Slack. We encrypt server-side and render the public Slack message response.'}
            </p>
          </div>

          {/* Stego Sub-mode Selector & Encoder/Decoder */}
          {method === 'stego' && (
            <div className="space-y-4">
              <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setStegoSubMode('encode');
                    setDecodedStegoUrl('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    stegoSubMode === 'encode' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Hide Secret (Encode)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStegoSubMode('decode');
                    setDecodedStegoUrl('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    stegoSubMode === 'decode' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Extract Secret (Decode)
                </button>
              </div>

              {stegoSubMode === 'encode' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">Cover Image Selection (Optional)</span>
                  </div>
                  {stegoBaseImage ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 animate-slide-in">
                      <span className="text-xs text-teal-400 font-bold">Custom Cover Image selected</span>
                      <button
                        type="button"
                        onClick={() => setStegoBaseImage(null)}
                        className="p-1.5 rounded-lg hover:bg-btn-sec-hover text-text-muted hover:text-text-main"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => stegoImageRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-input-border hover:border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Custom PNG Cover Image (Otherwise generates premium gradient on submission)
                    </button>
                  )}
                  <input
                    type="file"
                    ref={stegoImageRef}
                    onChange={handleStegoImageSelect}
                    className="hidden"
                    accept="image/png"
                  />
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-btn-sec-bg border border-panel-border text-center">
                  <span className="text-xs font-semibold text-text-muted block mb-2">Upload Steganographic PNG</span>
                  
                  {decodedStegoUrl ? (
                    <div className="space-y-4 animate-scale-in text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-text-main">Covert Secret Extracted!</span>
                        <p className="text-[10px] text-text-ghost">The embedded zero-knowledge paste link was retrieved successfully.</p>
                      </div>
                      
                      <div className="flex bg-slate-950 border border-panel-border p-1 rounded-xl items-center justify-between max-w-sm mx-auto">
                        <span className="text-xs font-mono text-teal-400 truncate pl-3 pr-2 select-all">{decodedStegoUrl}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(decodedStegoUrl)}
                          className="p-2 rounded-lg bg-btn-sec-hover text-text-main flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setDecodedStegoUrl('')}
                          className="px-4 py-2 border border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-main rounded-xl text-[10px] font-bold cursor-pointer"
                        >
                          Decode Another
                        </button>
                        <a
                          href={decodedStegoUrl}
                          className="btn-gradient px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          Decipher Note
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isDecodingStego}
                      onClick={() => stegoDecodeRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-input-border hover:border-panel-border bg-btn-sec-bg/50 hover:bg-btn-sec-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
                    >
                      {isDecodingStego ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Extracting Bits from Pixels...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-violet-400" />
                          Select Covert PNG Image to Decrypt
                        </>
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    ref={stegoDecodeRef}
                    onChange={handleDecodeImage}
                    className="hidden"
                    accept="image/png"
                  />
                </div>
              )}
            </div>
          )}

          {/* Conditional rendering for other form fields */}
          {(method !== 'stego' || stegoSubMode === 'encode') && (
            <>
              {/* SSS configuration row */}
              {method === 'threshold' && (
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Threshold (N approvers required)</label>
                <input
                  type="number"
                  min={2}
                  max={sharesM}
                  value={thresholdN}
                  onChange={(e) => setThresholdN(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted">Total Keyholder Shares (M split parts)</label>
                <input
                  type="number"
                  min={thresholdN}
                  max={10}
                  value={sharesM}
                  onChange={(e) => setSharesM(Math.max(thresholdN, parseInt(e.target.value) || thresholdN))}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>
          )}

          {/* Slack User inputs */}
          {method === 'slack' && (
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-text-muted">Simulate Slack User Name</label>
              <input
                type="text"
                placeholder="slack_username"
                value={slackUser}
                onChange={(e) => setSlackUser(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
              />
            </div>
          )}

          {/* Main content forms (Title, Text, Expiry, Password) - hidden for Chat format which starts empty */}
          {method !== 'chat' && (
            <>
              {/* Title & Format Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-text-muted block text-left">
                    Title (Optional & Encrypted)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter paste title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-muted block text-left">
                    Format
                  </label>
                  <div className="flex bg-btn-sec-bg p-1 rounded-xl border border-panel-border">
                    {(['plaintext', 'code', 'markdown'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setFormat(t);
                          if (t === 'markdown') setLanguage('markdown');
                          else if (t === 'plaintext') setLanguage('plaintext');
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                          format === t
                            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        {t === 'plaintext' ? 'Text' : t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Editor Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {format === 'code' ? (
                      <Code className="w-4 h-4 text-violet-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-teal-400" />
                    )}
                    <span className="text-sm font-semibold text-text-main capitalize">
                      {format === 'code' ? 'Source Code Editor' : format === 'markdown' ? 'Markdown Document' : 'Secure Text'}
                    </span>
                  </div>

                  {/* Markdown tabs */}
                  {format === 'markdown' && (
                    <div className="flex bg-btn-sec-bg rounded-lg p-0.5 border border-panel-border">
                      <button
                        type="button"
                        onClick={() => setEditorTab('edit')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          editorTab === 'edit'
                            ? 'bg-btn-sec-hover text-text-main'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          editorTab === 'preview'
                            ? 'bg-btn-sec-hover text-text-main'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  )}

                  {/* Language dropdown (if code format) */}
                  {format === 'code' && (
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-input-bg border border-input-border text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 text-text-main"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value} className="bg-bg-main text-text-main">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Editor Textarea or Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 relative">
                    {format === 'markdown' && editorTab === 'preview' ? (
                      <div className="w-full min-h-[320px] max-h-[500px] overflow-y-auto glass-input rounded-xl p-5 border border-input-border">
                        {renderMarkdownPreview()}
                      </div>
                    ) : (
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={
                          format === 'code'
                            ? '// Paste or write code sample here...'
                            : format === 'markdown'
                            ? '# My Markdown document\n\nWrite secure documentation here...'
                            : 'Type or paste secure content here...'
                        }
                        className="w-full h-80 glass-input rounded-xl p-4 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                      />
                    )}
                  </div>
                  
                  {/* Real-time cipher scrambling transparency matrix */}
                  <div className="lg:col-span-1 glass-panel rounded-xl p-5 border-emerald-500/20 bg-emerald-500/5 font-mono text-xs text-left flex flex-col space-y-3 h-80 overflow-hidden select-none">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Cipher Scramble Buffer
                      </span>
                      <span className="text-emerald-500/50 text-[9px]">GCM-256</span>
                    </div>
                    <div className="flex-1 overflow-y-auto text-emerald-400/90 whitespace-pre-wrap break-all leading-normal">
                      {getLiveScramble(text)}
                    </div>
                    <div className="border-t border-emerald-500/20 pt-2 text-[9px] text-emerald-500/50 flex justify-between">
                      <span>BYTES: {new TextEncoder().encode(text).length}</span>
                      <span>STATUS: ENCRYPT_STREAM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* File upload attachment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">
                    Zero-Knowledge Attachments (700KB Max)
                  </span>
                </div>

                {file ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 animate-slide-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                        {file.name.startsWith('voice_memo.') ? <Volume2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-text-main truncate max-w-xs sm:max-w-md">
                          {file.name.startsWith('voice_memo.') ? 'Secure Voice Note Memo' : file.name}
                        </span>
                        <span className="text-xs text-text-ghost">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown Type'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg hover:bg-btn-sec-hover text-text-muted hover:text-text-main transition-colors"
                      aria-label="Remove attached file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 animate-pulse text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-semibold text-rose-400">
                        Recording Voice Memo... {recordingDuration}s
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop & Save
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <Tooltip text="Attach a file (max 700KB) — it's encrypted client-side and bundled alongside your text." className="w-full">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-input-border hover:border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-violet-400" />
                          Attach Secure File (700KB Max)
                        </button>
                      </Tooltip>

                      <Tooltip text="Record an audio memo from your microphone to send instead of, or alongside, text." className="w-full">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-input-border hover:border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all cursor-pointer"
                        >
                          <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                          Record Voice Memo
                        </button>
                      </Tooltip>

                      <Tooltip text="Open a drawing canvas for diagrams or signatures — the sketch is encrypted along with your note." className="w-full">
                        <button
                          type="button"
                          onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
                          className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed transition-all cursor-pointer text-xs font-semibold ${
                            isDrawingEnabled
                              ? 'border-violet-500 bg-violet-500/10 text-violet-400 font-bold'
                              : 'border-input-border hover:border-panel-border bg-btn-sec-bg hover:bg-btn-sec-hover text-text-muted hover:text-text-main'
                          }`}
                        >
                          <Cpu className="w-4 h-4 text-sky-400" />
                          Draw Secure Sketch
                        </button>
                      </Tooltip>
                    </div>

                    {isDrawingEnabled && (
                      <div className="p-4 rounded-xl border border-panel-border bg-btn-sec-bg/25 space-y-3 animate-slide-in text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-sky-400 animate-pulse" />
                            Secure Sketching Canvas Board
                          </span>
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg cursor-pointer transition-all"
                          >
                            Clear Board
                          </button>
                        </div>
                        
                        <div className="border border-input-border rounded-xl overflow-hidden bg-bg-main">
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={250}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawingLine}
                            onMouseLeave={stopDrawingLine}
                            className="w-full h-64 bg-bg-main cursor-crosshair block"
                          />
                        </div>
                        <p className="text-[9px] text-text-ghost">
                          Draw diagrams, signatures, or visual notes on the board. The sketch is fully encrypted client-side alongside your text secrets.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </>
          )}

          {/* Advanced Cryptographic Innovations Accordion (Only for Direct Mode) */}
          {method === 'direct' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedOverrides(!showAdvancedOverrides)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer font-mono"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  {showAdvancedOverrides 
                    ? '▼ HIDE ADVANCED SECURITY OVERRIDES' 
                    : '▶ SHOW ADVANCED SECURITY OVERRIDES (COERCION DECOY, DEAD MAN, FENCES, BIOMETRIC)'
                  }
                </span>
                <span className="text-[10px] text-zinc-600">
                  {showAdvancedOverrides ? 'COLLAPSE' : 'EXPAND PANEL'}
                </span>
              </button>
            </div>
          )}

          {method === 'direct' && showAdvancedOverrides && (
            <div className="space-y-6 pt-4 border-t border-panel-border text-left animate-slide-in">
              <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wider font-mono">
                Cryptographic Innovation Layers
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Decoy Vault Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDecoyEnabled(!isDecoyEnabled);
                    if (!isDecoyEnabled) {
                      setPassword('');
                    }
                  }}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    isDecoyEnabled 
                      ? 'border-violet-500/30 bg-violet-500/5' 
                      : 'border-panel-border bg-btn-sec-bg/50 hover:bg-btn-sec-hover'
                  }`}
                >
                  <Fingerprint className={`w-6 h-6 shrink-0 mt-0.5 ${isDecoyEnabled ? 'text-violet-400' : 'text-text-ghost'}`} />
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-bold text-text-main">Plausible Deniability Decoy Vault</span>
                    <span className="text-[9px] text-text-ghost">Decrypts decoy or real secrets depending on which password is entered.</span>
                  </div>
                </button>

                {/* Dead Man's Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDeadMan(!isDeadMan)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    isDeadMan 
                      ? 'border-amber-500/30 bg-amber-500/5' 
                      : 'border-panel-border bg-btn-sec-bg/50 hover:bg-btn-sec-hover'
                  }`}
                >
                  <AlertCircle className={`w-6 h-6 shrink-0 mt-0.5 ${isDeadMan ? 'text-amber-400' : 'text-text-ghost'}`} />
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-bold text-text-main">Dead Man's Switch (Auto-Release)</span>
                    <span className="text-[9px] text-text-ghost">Auto-releases note details only if whistleblower fails to check in before timer expiry.</span>
                  </div>
                </button>

                {/* Time-Locked CPU Puzzle Toggle */}
                <button
                  type="button"
                  onClick={() => setIsTimeLocked(!isTimeLocked)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    isTimeLocked 
                      ? 'border-sky-500/30 bg-sky-500/5' 
                      : 'border-panel-border bg-btn-sec-bg/50 hover:bg-btn-sec-hover'
                  }`}
                >
                  <Cpu className={`w-6 h-6 shrink-0 mt-0.5 ${isTimeLocked ? 'text-sky-400' : 'text-text-ghost'}`} />
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs font-bold text-text-main">Time-Locked CPU Puzzle</span>
                    <span className="text-[9px] text-text-ghost">Requires recipient browser computation for 4s before revealing note.</span>
                  </div>
                </button>
              </div>

              {/* Decoy Fields */}
              {isDecoyEnabled && (
                <div className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-4 animate-slide-in">
                  <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    Decoy Configuration Panel
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-text-muted">Real Password (Required)</label>
                      <input
                        type="password"
                        placeholder="Password for the genuine secret..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:ring-violet-500"
                        required={isDecoyEnabled}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-text-muted">Decoy Password (Required)</label>
                      <input
                        type="password"
                        placeholder="Password for the decoy story..."
                        value={decoyPassword}
                        onChange={(e) => setDecoyPassword(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:ring-violet-500"
                        required={isDecoyEnabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-text-muted">Decoy Hidden Message</label>
                    <textarea
                      placeholder="Type the fake/decoy story to show when decoy password is used..."
                      value={decoyText}
                      onChange={(e) => setDecoyText(e.target.value)}
                      className="w-full h-24 glass-input rounded-xl p-4 text-xs font-sans focus:ring-violet-500 resize-none"
                      required={isDecoyEnabled}
                    />
                  </div>
                </div>
              )}

              {isDeadMan && (
                <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4 animate-slide-in">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Whistleblower Dead Man Switch Config
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-text-muted">Dead Man Check-in Key (Required)</label>
                      <input
                        type="password"
                        placeholder="Key used to confirm you are safe..."
                        value={deadManKey}
                        onChange={(e) => setDeadManKey(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:ring-amber-500"
                        required={isDeadMan}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-text-muted">Check-in Reset Interval</label>
                      <select
                        value={deadManInterval}
                        onChange={(e) => setDeadManInterval(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-main"
                      >
                        <option value="300" className="bg-bg-main">5 Minutes (Debug/Testing)</option>
                        <option value="3600" className="bg-bg-main">1 Hour</option>
                        <option value="86400" className="bg-bg-main">1 Day</option>
                        <option value="604800" className="bg-bg-main">1 Week</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Duress Self-Destruct Switch */}
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3 animate-slide-in">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 animate-pulse" />
                  Duress Self-Destruct Key (Optional coercion override)
                </span>
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-[9px] text-text-ghost">Entering this key on the management page immediately deletes the secret.</label>
                  <input
                    type="password"
                    placeholder="Enter Coercion Duress PIN..."
                    value={duressKey}
                    onChange={(e) => setDuressKey(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Advanced Guess limits and Geofencing parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-panel-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Guess Attempt Limit (Auto-Destruct)
                  </label>
                  <input
                    type="number"
                    placeholder="Attempts allowed (e.g. 3, or 0 for unlimited)..."
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs focus:ring-rose-500"
                    min="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5 font-mono">
                    <Globe className="w-4 h-4 text-sky-400" />
                    Geo-Fence: Restricted Countries
                  </label>
                  <input
                    type="text"
                    placeholder="Comma separated codes (e.g. US, IN, GB)..."
                    value={allowedCountries}
                    onChange={(e) => setAllowedCountries(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs focus:ring-sky-500"
                  />
                </div>

                {/* OTP Gate toggle container */}
                <div 
                  onClick={() => setOtpRequired(!otpRequired)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    otpRequired 
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-sm' 
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer font-mono">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    OTP Identity Gate
                    <span className="text-[10px] text-zinc-500 font-normal ml-1 font-sans">(Require 6-digit verification)</span>
                  </label>
                  <button
                    id="toggle-otp-required"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOtpRequired(!otpRequired);
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${otpRequired ? 'bg-cyan-500' : 'bg-btn-sec-bg border border-panel-border'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${otpRequired ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Time-release date/time picker */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    Schedule Time-Release
                    <span className="text-[10px] text-text-ghost font-normal ml-1 font-sans">(Leave blank for instant access)</span>
                  </label>
                  <input
                    id="time-release-input"
                    type="datetime-local"
                    value={releaseAfterDate}
                    onChange={e => setReleaseAfterDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs focus:ring-violet-500 text-text-main"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                {/* QR Scan Limit */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-orange-400" />
                    Self-Destructing QR — Scan Limit
                    <span className="text-[10px] text-text-ghost font-normal ml-1 font-sans">(0 = unlimited)</span>
                  </label>
                  <input
                    id="scan-limit-input"
                    type="number"
                    min="0"
                    placeholder="Max QR scans before burn (e.g. 3)..."
                    value={scanLimitInput}
                    onChange={e => setScanLimitInput(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs focus:ring-orange-500"
                  />
                </div>

                {/* Biometric Gate toggle container */}
                <div 
                  onClick={() => setBiometricRequired(!biometricRequired)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    biometricRequired 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-sm' 
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer font-mono">
                    <span className="text-base mr-1">🫆</span>
                    Biometric Gate
                    <span className="text-[10px] text-zinc-500 font-normal ml-1 font-sans">(Face ID / Touch ID)</span>
                  </label>
                  <button
                    id="toggle-biometric-required"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBiometricRequired(!biometricRequired);
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${biometricRequired ? 'bg-emerald-500' : 'bg-btn-sec-bg border border-panel-border'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${biometricRequired ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Honeypot Decoy Trap toggle container */}
                <div 
                  onClick={() => setIsHoneypotTrapEnabled(!isHoneypotTrapEnabled)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isHoneypotTrapEnabled 
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 shadow-sm' 
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Deploy Decoy Honeypot Trap
                    <span className="text-[10px] text-zinc-500 font-normal ml-1 font-sans">(Silent alarm access link)</span>
                  </label>
                  <button
                    id="toggle-honeypot-trap"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHoneypotTrapEnabled(!isHoneypotTrapEnabled);
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isHoneypotTrapEnabled ? 'bg-rose-500' : 'bg-btn-sec-bg border border-panel-border'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isHoneypotTrapEnabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AI PII Content Scanner ── */}
          {method === 'direct' && text && (
            <div className="mt-2 border-t border-panel-border pt-4 space-y-2">
              <button
                id="scan-pii-btn"
                type="button"
                onClick={() => {
                  const warnings = scanForPii(text);
                  setPiiWarnings(warnings);
                  setPiiChecked(true);
                }}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors font-semibold"
              >
                <Bot className="w-4 h-4" />
                🔍 Scan for PII / Sensitive Data
              </button>
              {piiChecked && (
                <div className={`p-3 rounded-xl text-xs border ${piiWarnings.length === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                  {piiWarnings.length === 0 ? (
                    <p>✅ No sensitive patterns found. Safe to encrypt.</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-rose-200">⚠️ Sensitive content detected:</p>
                      {piiWarnings.map((w, i) => <p key={i}>{w}</p>)}
                      <p className="text-text-ghost mt-2">Review carefully before sharing. Content will still be encrypted.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}



          {/* Expiration, Password, & Security Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-panel-border">
            {/* Expiration dropdown */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-400" />
                Expiration
              </label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-text-main"
              >
                {EXPIRATIONS.map((exp) => (
                  <option key={exp.value} value={exp.value} className="bg-bg-main text-text-main">
                    {exp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password option (hide for Threshold, Slack command, and Decoy vault) */}
            {method !== 'threshold' && method !== 'slack' && !isDecoyEnabled && (
              <div className="space-y-2 text-left">
                <label className="text-sm font-semibold text-text-muted flex items-center gap-1.5">
                  {password ? (
                    <Lock className="w-4 h-4 text-emerald-400 animate-pulse" />
                  ) : (
                    <Unlock className="w-4 h-4 text-text-ghost" />
                  )}
                  Secret Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Add extra encryption layer..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                />
                {/* Password Strength Meter */}
                {password && (() => {
                  const len = password.length;
                  const hasUpper = /[A-Z]/.test(password);
                  const hasLower = /[a-z]/.test(password);
                  const hasNum = /[0-9]/.test(password);
                  const hasSymbol = /[^A-Za-z0-9]/.test(password);
                  const charsetSize = (hasUpper ? 26 : 0) + (hasLower ? 26 : 0) + (hasNum ? 10 : 0) + (hasSymbol ? 32 : 0);
                  const entropy = charsetSize > 0 ? Math.floor(len * Math.log2(charsetSize)) : 0;
                  const level = entropy < 28 ? 0 : entropy < 50 ? 1 : entropy < 70 ? 2 : entropy < 100 ? 3 : 4;
                  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
                  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];
                  const textColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400', 'text-emerald-300'];
                  const crackTimes = ['< 1 second', '< 1 minute', '< 1 hour', '< 1 year', 'Centuries'];
                  return (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= level ? colors[level] : 'bg-panel-border'}`} />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className={`font-bold ${textColors[level]}`}>{labels[level]}</span>
                        <span className="text-text-ghost">{entropy} bits · crack: {crackTimes[level]}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Burn after reading (hide for Chat/Threshold options) */}
            {method !== 'chat' && method !== 'threshold' && (
              <div className="flex items-end pb-1 text-left col-span-1">
                <label className="flex items-center gap-3 w-full glass-input rounded-xl px-4 py-3.5 cursor-pointer hover:bg-btn-sec-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={burnAfterRead}
                    onChange={(e) => setBurnAfterRead(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-input-bg border-input-border focus:ring-violet-500 focus:ring-offset-0 focus:ring-2"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Burn After Reading
                    </span>
                    <span className="text-[10px] text-text-ghost">
                      Self-destructs on first view
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4">
            <Tooltip text="Encrypts everything above in your browser, then uploads only the ciphertext — the server never sees your plaintext." className="w-full md:w-auto">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto btn-gradient font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securing Channel Data...
                  </>
                ) : (
                  <>
                    {method === 'chat' && 'Create Chat Thread Link'}
                    {method !== 'chat' && 'Securely Create Paste'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </Tooltip>
          </div>
          </>
          )}
        </form>
      )}
    </div>
  );
}
