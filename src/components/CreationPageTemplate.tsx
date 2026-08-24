'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { encryptData, generateKey } from '@/lib/crypto';
import { splitKey } from '@/lib/sss';
import {
  ShieldCheck, Lock, Unlock, KeyRound, Flame, EyeOff, Radio,
  PenLine, SlidersHorizontal, Link2, ChevronRight, Copy, Check,
  QrCode, ArrowRight, ArrowLeft, ShieldAlert, FileText, Code, Upload, X,
  Trash2, Search, MoreHorizontal, Clock, RefreshCw, AlertTriangle,
  Mic, Square, Volume2, Bot, Sparkles, ExternalLink, Terminal as TerminalIcon,
  Video, VideoOff, Camera, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Toast, ToastType } from './Toast';
import { Tooltip } from './Tooltip';
import { HeroLoadingIntro } from './HeroLoadingIntro';
import { SecurityRecommendationEngine, SecurityConfig } from './SecurityRecommendationEngine';
import { SpidermanAgent } from './SpidermanAgent';

interface CreationPageTemplateProps {
  defaultMethod?: 'direct' | 'threshold' | 'chat' | 'stego' | 'slack';
}

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
}

interface ArchiveItem {
  id: string;
  code: string;
  title: string;
  type: string;
  status: 'active' | 'viewed' | 'destroyed';
  shareUrl: string;
  manageUrl?: string;
  date: string;
  expiryText: string;
  protectionText: string;
}

async function hashSha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function CreationPageTemplate({ defaultMethod = 'direct' }: CreationPageTemplateProps) {
  const [activeTab, setActiveTab] = useState<'landing' | 'terminal' | 'archive' | 'settings'>('landing');

  // Hero Intro loading animation (5-frame revolving animation on initial load)
  const [showHeroIntro, setShowHeroIntro] = useState(true);

  // Security Recommendation Engine wizard modal
  const [showRecommendationEngine, setShowRecommendationEngine] = useState(false);

  // Terminal mode: Text vs File vs Code vs Voice vs Video
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'code' | 'voice' | 'video'>('text');

  // Input states
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [file, setFile] = useState<FileAttachment | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  // Protections
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('');
  const [burnAfterReading, setBurnAfterReading] = useState(true);
  const [expiryOption, setExpiryOption] = useState(() => {
    if (typeof window === 'undefined') return '600';
    try { return localStorage.getItem('cipherdrop:default-expiry') || '600'; } catch { return '600'; }
  }); // defaults to the persisted Settings preference, falling back to 10 minutes
  const [paranoidMode, setParanoidMode] = useState(false);

  // Sketchpad state
  const [showSketchpad, setShowSketchpad] = useState(false);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Video recording state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoRecordingDuration, setVideoRecordingDuration] = useState(0);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const videoRecorderRef = useRef<any>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<any>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // System Log state
  const [logs, setLogs] = useState<string[]>([
    '> welcome to cipherdrop terminal',
    '> all encryption happens in your browser',
    '> nothing is sent in plaintext',
    "> type 'help' to see commands"
  ]);
  const [cliInput, setCliInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const cliInputRef = useRef<HTMLInputElement | null>(null);

  // Capsule Created Success State
  const [createdCapsule, setCreatedCapsule] = useState<{
    id: string;
    code: string;
    shareUrl: string;
    manageUrl?: string;
    expiryText: string;
    protectionText: string;
    isShamir?: boolean;
    shares?: string[];
  } | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [passwordWarningDismissed, setPasswordWarningDismissed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedManageLink, setCopiedManageLink] = useState(false);

  // Archive items state
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'viewed' | 'destroyed'>('active');
  const [archiveSearch, setArchiveSearch] = useState('');

  // Settings — persisted to localStorage so "Apply Preferences" actually sticks across visits
  const [defaultExpirySetting, setDefaultExpirySetting] = useState(() => {
    if (typeof window === 'undefined') return '600';
    try { return localStorage.getItem('cipherdrop:default-expiry') || '600'; } catch { return '600'; }
  });
  const [autoCopySetting, setAutoCopySetting] = useState(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('cipherdrop:autocopy') !== 'false'; } catch { return true; }
  });
  const [scanlinesSetting, setScanlinesSetting] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('cipherdrop:scanlines') === 'true'; } catch { return false; }
  });

  // Apply/remove the CRT scanline overlay whenever the setting changes (incl. on mount)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('scanlines-active', scanlinesSetting);
  }, [scanlinesSetting]);

  // Stop camera stream safely
  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (videoLiveRef.current) {
      videoLiveRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoRecording(false);
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
  };

  // Turn off camera if user leaves video mode
  useEffect(() => {
    if (inputMode !== 'video') {
      stopCamera();
    }
  }, [inputMode]);

  // Convert attached file data to Blob ObjectURL for flawless preview playback
  useEffect(() => {
    if (!file?.data) {
      setPreviewObjectUrl(null);
      return;
    }

    const rawData = file.data;
    if (rawData.startsWith('data:')) {
      try {
        const parts = rawData.split(',');
        const mimeHeader = parts[0];
        const base64Data = parts[1];

        let mimeType = 'video/mp4';
        const match = mimeHeader.match(/:(.*?);/);
        if (match && match[1]) {
          mimeType = match[1].split(';')[0].trim();
        } else if (file.type) {
          mimeType = file.type.split(';')[0].trim();
        }

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setPreviewObjectUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (e) {
        console.warn('Failed to convert preview base64 to ObjectURL:', e);
        setPreviewObjectUrl(rawData);
      }
    } else {
      setPreviewObjectUrl(rawData);
    }
  }, [file?.data, file?.type]);

  // Synchronize live camera stream to video viewfinder whenever camera state becomes active
  useEffect(() => {
    if (isCameraActive && videoStreamRef.current && videoLiveRef.current) {
      if (videoLiveRef.current.srcObject !== videoStreamRef.current) {
        videoLiveRef.current.srcObject = videoStreamRef.current;
      }
      videoLiveRef.current.muted = true;
      videoLiveRef.current.playsInline = true;
      videoLiveRef.current.play().catch(err => {
        console.warn('Viewfinder play warning:', err);
      });
    }
  }, [isCameraActive]);

  // Clean up all streams on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/wav'];
      const selectedMime = mimeTypes.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || 'audio/webm';
      
      const options = { mimeType: selectedMime };
      const recorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime });
        const ext = selectedMime.includes('mp4') ? 'mp4' : selectedMime.includes('ogg') ? 'ogg' : selectedMime.includes('wav') ? 'wav' : 'webm';
        const reader = new FileReader();
        reader.onload = () => {
          setFile({
            name: `classified_voice_memo.${ext}`,
            type: selectedMime,
            size: audioBlob.size,
            data: reader.result as string
          });
          addLog(`> attached voice capsule: ${(audioBlob.size / 1024).toFixed(1)} KB`);
          setToast({ message: 'Encrypted voice memo recorded!', type: 'success' });
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(t => t.stop());
            audioStreamRef.current = null;
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      addLog('> voice recording started [MAX 60s]...');
    } catch (err: any) {
      console.error('Recording start error:', err);
      setToast({ message: 'Microphone access denied: ' + (err.message || 'Please check browser permissions'), type: 'error' });
      addLog('> [ERR] microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Video recording handlers
  const startCamera = async () => {
    try {
      stopCamera();
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
          audio: true
        });
      } catch (e) {
        // Fallback 1: video + audio without resolution constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e2) {
          // Fallback 2: video only
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (!stream) {
        throw new Error('No camera stream available');
      }

      videoStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        videoLiveRef.current.muted = true;
        videoLiveRef.current.playsInline = true;
        try {
          await videoLiveRef.current.play();
        } catch (e) {}
      }
      addLog('> camera viewfinder active [READY]');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setToast({ message: 'Camera access denied or unavailable. Please allow camera permissions in your browser.', type: 'error' });
      addLog('> [ERR] camera access denied or unavailable');
    }
  };

  const startVideoRecording = async () => {
    if (isVideoRecording || (videoRecorderRef.current && videoRecorderRef.current.state === 'recording')) {
      return;
    }

    try {
      let stream = videoStreamRef.current;
      const isStreamActive = stream && stream.active && stream.getVideoTracks().some(t => t.readyState === 'live');

      if (!isStreamActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
          });
        } catch (e) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e2) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }
        videoStreamRef.current = stream;
        setIsCameraActive(true);
      }

      if (!stream) {
        throw new Error('Camera stream is not available');
      }

      if (videoLiveRef.current && videoLiveRef.current.srcObject !== stream) {
        videoLiveRef.current.srcObject = stream;
        videoLiveRef.current.muted = true;
        videoLiveRef.current.playsInline = true;
        try {
          await videoLiveRef.current.play();
        } catch (e) {}
      }

      // Safe MediaRecorder instantiation with codec negotiation
      const candidateMimes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];

      let recorder: MediaRecorder | null = null;
      let selectedMime = '';

      if (typeof MediaRecorder !== 'undefined') {
        for (const mime of candidateMimes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
            try {
              recorder = new MediaRecorder(stream, { mimeType: mime });
              selectedMime = mime;
              break;
            } catch (e) {}
          }
        }
      }

      if (!recorder) {
        try {
          recorder = new MediaRecorder(stream);
          selectedMime = recorder.mimeType || '';
        } catch (e: any) {
          throw new Error('MediaRecorder not supported on this browser: ' + (e.message || ''));
        }
      }

      videoChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setTimeout(() => {
          const chunks = videoChunksRef.current;
          const cleanMime = (selectedMime || recorder?.mimeType || chunks[0]?.type || 'video/mp4').split(';')[0].trim();
          const videoBlob = new Blob(chunks, { type: cleanMime });

          if (videoBlob.size === 0) {
            setToast({ message: 'Recording stopped before video data was captured. Please hold for at least 1-2 seconds.', type: 'error' });
            return;
          }

          if (videoBlob.size > 10 * 1024 * 1024) {
            setToast({
              message: `Video size (${(videoBlob.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit. Please record a shorter clip.`,
              type: 'error'
            });
            return;
          }

          const ext = cleanMime.includes('webm') ? 'webm' : 'mp4';
          const reader = new FileReader();
          reader.onload = () => {
            setFile({
              name: `classified_video_memo.${ext}`,
              type: cleanMime,
              size: videoBlob.size,
              data: reader.result as string
            });
            addLog(`> attached video capsule: ${(videoBlob.size / 1024).toFixed(1)} KB`);
            setToast({ message: 'Encrypted video capsule recorded!', type: 'success' });
            stopCamera();
          };
          reader.readAsDataURL(videoBlob);
        }, 80);
      };

      videoRecorderRef.current = recorder;
      
      // Start recording: WebM supports timeslices; MP4/Safari performs best with continuous buffer flush on stop
      try {
        if (selectedMime.includes('webm')) {
          recorder.start(500);
        } else {
          recorder.start();
        }
      } catch (e) {
        recorder.start();
      }

      setIsVideoRecording(true);
      setVideoRecordingDuration(0);

      videoTimerRef.current = setInterval(() => {
        setVideoRecordingDuration(prev => {
          if (prev >= 29) {
            stopVideoRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      addLog('> video recording started [MAX 30s]...');
    } catch (err: any) {
      console.error('Video recording start error:', err);
      setToast({ message: 'Failed to start video recording: ' + (err.message || 'Check browser permissions'), type: 'error' });
      addLog('> [ERR] video recording error: ' + (err.message || 'unknown'));
      setIsVideoRecording(false);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      try {
        videoRecorderRef.current.stop();
      } catch (e) {}
      setIsVideoRecording(false);
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    if (uploaded.size > 10 * 1024 * 1024) {
      setToast({ message: `Video must be under 10MB (Selected: ${(uploaded.size / (1024 * 1024)).toFixed(1)}MB).`, type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: uploaded.name,
        type: uploaded.type || 'video/mp4',
        size: uploaded.size,
        data: reader.result as string
      });
      addLog(`> attached video file: ${uploaded.name} (${(uploaded.size / 1024).toFixed(1)} KB)`);
      setToast({ message: `Video "${uploaded.name}" attached successfully!`, type: 'success' });
      stopCamera();
    };
    reader.readAsDataURL(uploaded);
  };

  // Load Archive from local storage
  const loadArchive = () => {
    try {
      const stored = localStorage.getItem('cipherdrop:history');
      if (stored) {
        setArchiveItems(JSON.parse(stored));
      } else {
        // Initial demo seed if empty
        const initialSeeds: ArchiveItem[] = [
          {
            id: '7F91A2B3',
            code: 'CD-7F91A2B3',
            title: 'Project Credentials',
            type: 'text',
            status: 'active',
            shareUrl: '#',
            date: new Date().toISOString(),
            expiryText: '10m remaining',
            protectionText: 'Burn after read'
          },
          {
            id: 'B482E19A',
            code: 'CD-B482E19A',
            title: 'API Keys Backup',
            type: 'code',
            status: 'active',
            shareUrl: '#',
            date: new Date(Date.now() - 3600000).toISOString(),
            expiryText: '2h remaining',
            protectionText: 'Password protected'
          },
          {
            id: 'C912D830',
            code: 'CD-C912D830',
            title: 'Private Notes',
            type: 'text',
            status: 'viewed',
            shareUrl: '#',
            date: new Date(Date.now() - 7200000).toISOString(),
            expiryText: 'Viewed just now',
            protectionText: 'Burn after read'
          },
          {
            id: 'A19349FA',
            code: 'CD-A19349FA',
            title: 'Old Config',
            type: 'file',
            status: 'destroyed',
            shareUrl: '#',
            date: new Date(Date.now() - 86400000).toISOString(),
            expiryText: 'Destroyed after reading',
            protectionText: 'Zero Knowledge'
          }
        ];
        setArchiveItems(initialSeeds);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadArchive();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'archive' || tabParam === 'settings' || tabParam === 'terminal' || tabParam === 'landing') {
        setActiveTab(tabParam as any);
        setShowHeroIntro(false);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'archive') {
      loadArchive();
    }
  }, [activeTab]);

  // Append system log
  const addLog = (line: string) => {
    setLogs(prev => [...prev, line]);
    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  // Handle live logs on inputs
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.length % 25 === 0 && val.length > 0) {
      addLog(`> payload buffer: ${val.length} chars (markdown encoded)`);
    }
  };

  // Interactive Terminal CLI Command Processor
  const handleCliCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = cliInput.trim();
    if (!raw) return;

    setLogs(prev => [...prev, `> ${raw}`]);
    setCliInput('');

    const [action, ...args] = raw.toLowerCase().split(' ');
    const fullArg = args.join(' ');

    switch (action) {
      case 'help':
      case '?':
        setLogs(prev => [
          ...prev,
          '┌────────── AVAILABLE TERMINAL COMMANDS ──────────┐',
          '│ help        - show this list of available commands',
          '│ clear       - clear console log buffer',
          '│ mode <type> - switch mode (text|file|code|voice|video)',
          '│ burn <on|off> - toggle burn-after-reading',
          '│ pass <pwd>  - set capsule password protection',
          '│ expire <sec>- set retention (300, 600, 3600, never)',
          '│ score       - calculate live security score',
          '│ advisor     - launch 6-step guided security advisor',
          '│ encrypt     - generate and drop encrypted capsule',
          '│ archive     - open capsule archive and history',
          '│ status      - print client cryptographic state',
          '└─────────────────────────────────────────────────┘'
        ]);
        break;

      case 'clear':
      case 'cls':
        setLogs([
          '> console cleared',
          "> type 'help' to see commands"
        ]);
        break;

      case 'mode':
        if (['text', 'file', 'code', 'voice', 'video'].includes(fullArg)) {
          setInputMode(fullArg as any);
          setLogs(prev => [...prev, `✓ input mode switched to: [${fullArg.toUpperCase()}]`]);
        } else {
          setLogs(prev => [...prev, '[ERR] invalid mode. Choose: text, file, code, voice, video']);
        }
        break;

      case 'burn':
        if (fullArg === 'on' || fullArg === 'true' || fullArg === '1') {
          setBurnAfterReading(true);
          setLogs(prev => [...prev, '✓ burn-after-reading ENABLED']);
        } else if (fullArg === 'off' || fullArg === 'false' || fullArg === '0') {
          setBurnAfterReading(false);
          setLogs(prev => [...prev, '✓ burn-after-reading DISABLED']);
        } else {
          setLogs(prev => [...prev, '[ERR] usage: burn on | burn off']);
        }
        break;

      case 'pass':
      case 'password':
        if (fullArg) {
          setPasswordProtection(true);
          setPassword(fullArg);
          setLogs(prev => [...prev, `✓ password set: [${fullArg}] (PBKDF2-SHA256)`]);
        } else {
          setPasswordProtection(false);
          setPassword('');
          setLogs(prev => [...prev, '✓ password protection removed']);
        }
        break;

      case 'expire':
      case 'expiry':
        if (['300', '600', '3600', '86400', '604800', 'never'].includes(fullArg)) {
          setExpiryOption(fullArg);
          setLogs(prev => [...prev, `✓ retention lifetime set: [${fullArg === 'never' ? 'NEVER' : fullArg + 's'}]`]);
        } else {
          setLogs(prev => [...prev, '[ERR] usage: expire <300|600|3600|86400|604800|never>']);
        }
        break;

      case 'score':
        const sc = calculateSecurityScore();
        setLogs(prev => [
          ...prev,
          `✓ SECURITY RATING: ${sc}/100 [${sc >= 80 ? 'MAXIMUM' : sc >= 60 ? 'STRONG' : 'MODERATE'}]`,
          `  AES-256-GCM: ACTIVE | Burn: ${burnAfterReading ? 'YES' : 'NO'} | Pass: ${passwordProtection ? 'YES' : 'NO'}`
        ]);
        break;

      case 'advisor':
      case 'guide':
        setShowRecommendationEngine(true);
        setLogs(prev => [...prev, '> launched 6-step guided security advisor wizard']);
        break;

      case 'encrypt':
      case 'generate':
      case 'drop':
        handleGenerateCapsule();
        break;

      case 'archive':
      case 'history':
        setActiveTab('archive');
        setLogs(prev => [...prev, '> switched to archive view']);
        break;

      case 'status':
        setLogs(prev => [
          ...prev,
          '✓ CRYPTO ENGINE: WebCrypto API (Hardware-Accelerated)',
          '✓ CIPHER SUITE: AES-256-GCM Authenticated 128-bit tag',
          '✓ KEY DERIVATION: PBKDF2-HMAC-SHA256 (100,000 iterations)',
          '✓ ZERO KNOWLEDGE: Client-side local encryption buffer verified'
        ]);
        break;

      default:
        setLogs(prev => [
          ...prev,
          `[ERR] unknown command: '${action}'. Type 'help' to see all available commands.`
        ]);
        break;
    }

    setTimeout(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  // Calculate dynamic security score (0 - 100)
  const calculateSecurityScore = () => {
    let score = 50; // Base for client AES-256-GCM + Zero-knowledge
    if (passwordProtection) score += 20;
    if (burnAfterReading) score += 15;
    if (expiryOption === '300' || expiryOption === '600') score += 9;
    else if (expiryOption === '3600') score += 5;
    if (paranoidMode) score = 100;
    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  // Handle Capsule Generation
  const handleGenerateCapsule = async () => {
    if (!text.trim() && !file && !sketchDataUrl) {
      setToast({ message: 'Please write a secret, attach a file, or create a sketch.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    addLog('> create capsule');
    addLog('  Initializing...');

    try {
      // Simulate/Trigger terminal cryptographic step logs
      await new Promise(r => setTimeout(r, 120));
      addLog('  ✓ AES-256-GCM');
      const keyHex = generateKey();
      
      await new Promise(r => setTimeout(r, 120));
      addLog('  ✓ Key generated');
      const manageKey = generateKey();
      const manageKeyHash = await hashSha256(manageKey);

      await new Promise(r => setTimeout(r, 120));
      addLog('  ✓ Secure random IV');

      const payload = {
        verification: 'cipherdrop-verify',
        title: title.trim() || 'Encrypted Secret Capsule',
        text: text,
        format: inputMode === 'code' ? 'code' : 'plaintext',
        language: inputMode === 'code' ? codeLanguage : 'plaintext',
        file: file,
        sketch: sketchDataUrl
      };

      await new Promise(r => setTimeout(r, 150));
      addLog('  ✓ Client-side encryption');

      const { ciphertext, iv } = await encryptData(
        JSON.stringify(payload),
        keyHex,
        passwordProtection ? password : undefined
      );

      let shares: string[] = [];
      if (paranoidMode) {
        shares = splitKey(keyHex, 2, 3);
        addLog('  ✓ Shamir (2-of-3) key split complete');
      }

      // Upload to server
      const expiresSec = expiryOption === 'never' ? null : parseInt(expiryOption, 10);
      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext,
          iv,
          password_protected: passwordProtection,
          burn_after_read: burnAfterReading,
          expires_in_seconds: expiresSec,
          manage_key_hash: manageKeyHash
        })
      });

      if (!res.ok) {
        throw new Error('Server storage failed.');
      }

      const data = await res.json();
      const capsuleId = data.id;
      const capsuleCode = `CD-${capsuleId.substring(0, 8).toUpperCase()}`;

      addLog('  ✓ Capsule ready');
      addLog(`> dispatch node: ${capsuleCode}`);

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = paranoidMode
        ? `${origin}/cd/${capsuleId}#${shares[0]}`
        : `${origin}/cd/${capsuleId}#${keyHex}`;
      // The management dashboard lives at /p/[id]/manage and reads its key from the hash
      // fragment (never sent to the server) — not a /cd/... route or a ?manage= query param,
      // which don't exist/aren't read anywhere and would silently 404 into the plain decrypt view.
      const manageUrl = `${origin}/p/${capsuleId}/manage#${manageKey}`;

      const protectionSummary = [
        passwordProtection ? 'Password' : null,
        burnAfterReading ? 'Burn After Read' : null,
        paranoidMode ? 'Shamir Vault' : null
      ].filter(Boolean).join(' • ') || 'Zero-Knowledge';

      const expiryLabels: Record<string, string> = {
        '300': '5 minutes',
        '600': '10 minutes',
        '3600': '1 hour',
        '86400': '1 day',
        '604800': '1 week',
        'never': 'Never'
      };
      const expiryText = expiryLabels[expiryOption] || '10 minutes';

      const newCapsule = {
        id: capsuleId,
        code: capsuleCode,
        shareUrl,
        manageUrl,
        expiryText,
        protectionText: protectionSummary,
        isShamir: paranoidMode,
        shares
      };

      setCreatedCapsule(newCapsule);
      setPasswordWarningDismissed(false);

      // Save to local archive
      const newArchiveItem: ArchiveItem = {
        id: capsuleId,
        code: capsuleCode,
        title: title.trim() || 'Encrypted Secret Capsule',
        type: inputMode,
        status: 'active',
        shareUrl,
        manageUrl,
        date: new Date().toISOString(),
        expiryText: `${expiryText} remaining`,
        protectionText: protectionSummary
      };

      const updatedArchive = [newArchiveItem, ...archiveItems.filter(i => i.id !== capsuleId)];
      setArchiveItems(updatedArchive);
      try {
        localStorage.setItem('cipherdrop:history', JSON.stringify(updatedArchive));
      } catch (e) {}

      // Auto copy
      if (autoCopySetting) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setToast({ message: 'Capsule created & link copied to clipboard!', type: 'success' });
        } catch (e) {
          setToast({ message: 'Capsule created successfully!', type: 'success' });
        }
      } else {
        setToast({ message: 'Capsule created successfully!', type: 'success' });
      }

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      addLog(`> ERROR: ${err.message || 'Encryption failed'}`);
      setToast({ message: err.message || 'Failed to create capsule', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setText('');
    setTitle('');
    setFile(null);
    setSketchDataUrl(null);
    setPassword('');
    setPasswordProtection(false);
    setBurnAfterReading(true);
    setParanoidMode(false);
    setCreatedCapsule(null);
    setLogs([
      '> welcome to cipherdrop terminal',
      '> all encryption happens in your browser',
      '> nothing is sent in plaintext',
      "> type 'help' to see commands",
      '> system ready for new secret payload'
    ]);
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    if (uploaded.size > 700 * 1024) {
      setToast({ message: 'File must be under 700KB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: uploaded.name,
        type: uploaded.type || 'application/octet-stream',
        size: uploaded.size,
        data: reader.result as string
      });
      addLog(`> attached file: ${uploaded.name} (${(uploaded.size / 1024).toFixed(1)} KB)`);
      setToast({ message: `File "${uploaded.name}" attached.`, type: 'success' });
    };
    reader.readAsDataURL(uploaded);
  };



  // Canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c084fc';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
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

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b14] text-[#f0f0ff] font-sans selection:bg-purple-600/40">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCreatedCapsule(null);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

        {/* ========================================================= */}
        {/* LANDING PAGE VIEW (Matching Screenshot 1 & 2)             */}
        {/* ========================================================= */}
        {activeTab === 'landing' && (
          <div className="space-y-20 sm:space-y-28 py-6 sm:py-12 animate-slide-up">
            {/* Hero Section */}
            <section className="text-center space-y-6 max-w-3xl mx-auto">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c084fc',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-knowledge encrypted capsules</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
                Drop a secret.<br />
                <span className="text-gradient-vivid">Only they can open it.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#9b9bbf] leading-relaxed max-w-xl mx-auto">
                CipherDrop encrypts your text, code, or files right in your browser before anything is sent anywhere.
                We never see the plaintext — not even for a second.
              </p>

              <div className="pt-2 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('terminal');
                    setShowRecommendationEngine(true);
                  }}
                  className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                    boxShadow: '0 8px 32px rgba(124, 58, 237, 0.5)'
                  }}
                >
                  <span>Open the Terminal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <a
                  href="#how-it-works"
                  className="text-xs font-medium text-[#5c5c80] hover:text-[#9b9bbf] flex flex-col items-center gap-1 transition-colors mt-2"
                >
                  <span>Scroll to see how it works</span>
                  <span className="text-base animate-bounce">↓</span>
                </a>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="space-y-6 max-w-5xl mx-auto pt-6">
              <h2 className="section-label text-center">How It Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: PenLine,
                    label: 'Write',
                    desc: 'Write your secret or upload a file.',
                    color: 'text-purple-400',
                    bg: 'rgba(139, 92, 246, 0.1)'
                  },
                  {
                    icon: SlidersHorizontal,
                    label: 'Protect',
                    desc: 'Add password, set expiry, and extra protections.',
                    color: 'text-blue-400',
                    bg: 'rgba(59, 130, 246, 0.1)'
                  },
                  {
                    icon: Link2,
                    label: 'Share',
                    desc: 'Get a link or QR code and share it securely.',
                    color: 'text-teal-400',
                    bg: 'rgba(45, 212, 191, 0.1)'
                  },
                  {
                    icon: Flame,
                    label: 'Decrypt',
                    desc: 'They open it, decrypt locally, and it\'s gone.',
                    color: 'text-rose-400',
                    bg: 'rgba(244, 63, 94, 0.1)'
                  }
                ].map((step, idx) => (
                  <div
                    key={step.label}
                    className="glass-panel rounded-2xl p-6 text-left space-y-3 relative overflow-hidden group hover:border-purple-500/30 transition-all"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/5"
                      style={{ background: step.bg }}
                    >
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-white">{step.label}</h3>
                    <p className="text-xs text-[#9b9bbf] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Zero-Knowledge Architecture Section */}
            <section className="glass-panel-elevated rounded-3xl p-6 sm:p-10 space-y-8 max-w-5xl mx-auto border border-purple-500/20">
              <h2 className="section-label text-center">Zero-Knowledge Architecture</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Node 1: Browser */}
                <div
                  className="rounded-2xl p-6 space-y-3 text-center border"
                  style={{
                    background: 'rgba(139, 92, 246, 0.06)',
                    borderColor: 'rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <p className="text-xs font-bold text-white uppercase tracking-wider">YOUR BROWSER</p>
                  <div className="space-y-1.5 text-xs text-[#9b9bbf]">
                    <p className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" /> Encrypts
                    </p>
                    <p className="flex items-center justify-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-purple-400" /> Decrypts
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="badge badge-active">🛡️ Zero Knowledge</span>
                  </div>
                </div>

                {/* Node 2: Server */}
                <div
                  className="rounded-2xl p-6 space-y-3 text-center border relative"
                  style={{
                    background: 'rgba(10, 11, 20, 0.95)',
                    borderColor: 'rgba(120, 80, 255, 0.3)',
                    boxShadow: '0 0 30px rgba(124, 58, 237, 0.15)'
                  }}
                >
                  <p className="text-xs font-bold text-white uppercase tracking-wider">CIPHERDROP SERVER</p>
                  <p className="text-xs text-[#9b9bbf]">Stores only encrypted data</p>
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {/* Node 3: Recipient */}
                <div
                  className="rounded-2xl p-6 space-y-3 text-center border"
                  style={{
                    background: 'rgba(139, 92, 246, 0.06)',
                    borderColor: 'rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <p className="text-xs font-bold text-white uppercase tracking-wider">RECIPIENT BROWSER</p>
                  <div className="space-y-1.5 text-xs text-[#9b9bbf]">
                    <p className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-400" /> Encrypts
                    </p>
                    <p className="flex items-center justify-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-teal-400" /> Decrypts Locally
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="badge badge-active">🛡️ Zero Knowledge</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white tracking-wide"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  We never see your plaintext. Ever.
                </span>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TERMINAL VIEW (Matching Screenshot 3)                     */}
        {/* ========================================================= */}
        {activeTab === 'terminal' && (
          <div className="space-y-6 animate-slide-up">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(120, 80, 255, 0.12)' }}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('landing')}
                  className="btn-ghost px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-[#9b9bbf] hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-white/5"
                  title="Return to Welcome Home Page"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
                  <span>Back to Home</span>
                </button>

                <div className="border-l border-white/10 pl-3">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">TERMINAL</h1>
                  <p className="text-[11px] text-[#9b9bbf]">Create a new encrypted capsule</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowRecommendationEngine(true)}
                  className="btn-ghost px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-pointer shadow-sm"
                  title="Open 6-Step Guided Security Advisor"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Security Advisor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('archive')}
                  className="btn-ghost px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recent</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn-ghost px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                  <span>+ New</span>
                </button>
              </div>
            </div>

            {/* CAPSULE CREATED POPUP / CARD */}
            {createdCapsule && (
              <div
                className="glass-panel-elevated rounded-3xl p-6 sm:p-8 text-center space-y-6 border border-purple-500/40 animate-scale-in"
                style={{ background: 'rgba(14, 16, 32, 0.95)', boxShadow: '0 12px 60px rgba(124, 58, 237, 0.35)' }}
              >
                <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-300">
                  <Check className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black tracking-wider text-white uppercase">CAPSULE CREATED</h2>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-sm font-bold">
                    <span>{createdCapsule.code}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(createdCapsule.code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="hover:text-white cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Share Link Row */}
                <div className="max-w-xl mx-auto space-y-2 text-left">
                  <span className="text-[11px] font-bold text-[#9b9bbf]">Share your capsule</span>
                  <div className="flex bg-black/40 border border-purple-500/30 rounded-xl p-1.5 items-center justify-between gap-2">
                    <input
                      readOnly
                      value={createdCapsule.shareUrl}
                      className="bg-transparent text-xs text-teal-300 font-mono px-2 py-1 outline-none w-full truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(createdCapsule.shareUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                        setToast({ message: 'Capsule link copied!', type: 'success' });
                      }}
                      className="btn-primary px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Manage Link Row — private, sender-only key to revoke/check read receipts */}
                {createdCapsule.manageUrl && (
                  <div className="max-w-xl mx-auto space-y-2 text-left">
                    <span className="text-[11px] font-bold text-[#9b9bbf]">Manage link (keep private — do not share)</span>
                    <div className="flex bg-black/40 border border-rose-500/30 rounded-xl p-1.5 items-center justify-between gap-2">
                      <input
                        readOnly
                        value={createdCapsule.manageUrl}
                        className="bg-transparent text-xs text-rose-300 font-mono px-2 py-1 outline-none w-full truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(createdCapsule.manageUrl!);
                          setCopiedManageLink(true);
                          setTimeout(() => setCopiedManageLink(false), 2000);
                          setToast({ message: 'Manage link copied!', type: 'success' });
                        }}
                        className="btn-ghost px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                      >
                        {copiedManageLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedManageLink ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="btn-ghost px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Show QR Code</span>
                  </button>

                  <a
                    href={createdCapsule.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-400" />
                    <span>Open Decryption Page</span>
                  </a>

                  {createdCapsule.manageUrl && (
                    <a
                      href={createdCapsule.manageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:text-white"
                    >
                      <KeyRound className="w-4 h-4 text-rose-400" />
                      <span>Manage Capsule</span>
                    </a>
                  )}
                </div>

                {/* Metadata Row */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl text-xs text-[#9b9bbf] max-w-xl mx-auto border"
                  style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(120, 80, 255, 0.15)' }}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Expiry: {createdCapsule.expiryText}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span className="truncate">{createdCapsule.protectionText}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Created: Just now</span>
                  </div>
                </div>

                {/* Warning callout */}
                {passwordProtection && !passwordWarningDismissed && (
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 max-w-xl mx-auto flex items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="text-xs text-amber-200">
                        <strong className="block font-bold">Save your password</strong>
                        <span className="text-[11px] text-amber-300/80">We can&apos;t recover it for you.</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordWarningDismissed(true);
                        setToast({ message: 'Acknowledged.', type: 'info' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer"
                    >
                      I Understand
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3-COLUMN MAIN TERMINAL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* -------------------------------------------------- */}
              {/* COLUMN 1 (LEFT): SYSTEM_LOG Terminal (4 cols)      */}
              {/* -------------------------------------------------- */}
              <div className="lg:col-span-4 flex flex-col glass-panel-elevated rounded-2xl overflow-hidden border border-purple-500/20">
                {/* Title Bar */}
                <div
                  className="px-4 py-3 flex items-center justify-between border-b"
                  style={{ background: 'rgba(10, 11, 20, 0.8)', borderColor: 'rgba(120, 80, 255, 0.15)' }}
                >
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300">
                    <TerminalIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>SYSTEM_LOG</span>
                  </div>

                  {/* macOS dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>

                {/* Console Log Body */}
                <div
                  ref={logContainerRef}
                  onClick={() => cliInputRef.current?.focus()}
                  className="p-4 font-mono text-xs text-left overflow-y-auto space-y-1.5 flex-1 min-h-[300px] max-h-[440px] bg-black/60 select-text cursor-text"
                >
                  {logs.map((line, idx) => {
                    const isSuccess = line.includes('✓') || line.includes('READY');
                    const isError = line.includes('ERROR') || line.includes('[ERR]');
                    const isPrompt = line.startsWith('>');
                    const isBox = line.startsWith('┌') || line.startsWith('│') || line.startsWith('└');
                    return (
                      <p
                        key={idx}
                        className={`leading-relaxed ${
                          isSuccess
                            ? 'text-emerald-400 font-semibold'
                            : isError
                            ? 'text-rose-400 font-semibold'
                            : isBox
                            ? 'text-purple-300/90 whitespace-pre'
                            : isPrompt
                            ? 'text-[#c084fc] font-bold'
                            : 'text-[#9b9bbf]'
                        }`}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Interactive CLI Command Input Line */}
                <form
                  onSubmit={handleCliCommand}
                  className="flex items-center gap-2 px-3 py-2 border-t bg-black/85"
                  style={{ borderColor: 'rgba(120, 80, 255, 0.2)' }}
                  onClick={() => cliInputRef.current?.focus()}
                >
                  <span className="text-[#c084fc] font-mono text-xs font-black shrink-0">&gt;</span>
                  <input
                    ref={cliInputRef}
                    type="text"
                    value={cliInput}
                    onChange={e => setCliInput(e.target.value)}
                    placeholder="type 'help', 'score', 'mode code', 'clear'..."
                    className="bg-transparent text-xs font-mono text-white placeholder:text-[#5c5c80] outline-none w-full flex-1 caret-purple-400"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-[10px] font-mono text-purple-300 uppercase cursor-pointer"
                  >
                    Enter
                  </button>
                </form>

                {/* Status footer */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between text-[11px] font-mono border-t"
                  style={{ background: 'rgba(10, 11, 20, 0.9)', borderColor: 'rgba(120, 80, 255, 0.15)' }}
                >
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    STATUS: READY
                  </span>
                  <span className="text-[#5c5c80] uppercase tracking-wider">LOCAL_ENV</span>
                </div>
              </div>

              {/* -------------------------------------------------- */}
              {/* COLUMN 2 (MIDDLE): Capsule Composer (5 cols)       */}
              {/* -------------------------------------------------- */}
              <div className="lg:col-span-5 space-y-5">
                <div
                  className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 border border-purple-500/20"
                  style={{ background: 'rgba(14, 16, 32, 0.85)' }}
                >
                  {/* Mode Selector Tabs */}
                  <div
                    className="flex p-1 rounded-xl gap-1 border overflow-x-auto"
                    style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(120, 80, 255, 0.15)' }}
                  >
                    {[
                      { id: 'text', label: 'Text', icon: FileText },
                      { id: 'file', label: 'File', icon: Upload },
                      { id: 'code', label: 'Code', icon: Code },
                      { id: 'voice', label: 'Voice', icon: Mic },
                      { id: 'video', label: 'Video', icon: Camera }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setInputMode(tab.id as any);
                          addLog(`> switched input mode to: [${tab.label.toUpperCase()}]`);
                        }}
                        className={`flex-1 min-w-[55px] py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          inputMode === tab.id
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'text-[#9b9bbf] hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Optional Title */}
                  <div className="space-y-1 text-left">
                    <input
                      type="text"
                      placeholder={
                        inputMode === 'voice'
                          ? 'Voice Note Title (Optional)'
                          : inputMode === 'video'
                          ? 'Video Capsule Title (Optional)'
                          : 'Title or Reference (Optional)'
                      }
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full glass-input px-3.5 py-2 text-xs rounded-xl"
                    />
                  </div>

                  {/* Input Mode: TEXT */}
                  {inputMode === 'text' && (
                    <div className="space-y-2 text-left">
                      <div className="relative rounded-xl overflow-hidden border border-purple-500/20 bg-black/40">
                        <textarea
                          rows={6}
                          placeholder="Type your secret here..."
                          value={text}
                          onChange={handleTextChange}
                          className="w-full p-3.5 text-xs text-[#f0f0ff] bg-transparent outline-none resize-none placeholder:text-[#5c5c80] font-sans"
                        />
                        {/* Formatting toolbar bar */}
                        <div className="px-3 py-2 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] text-[#5c5c80]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setText(t => t + ' **bold** ')}
                              className="font-bold hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              title="Bold"
                            >
                              B
                            </button>
                            <button
                              type="button"
                              onClick={() => setText(t => t + ' *italic* ')}
                              className="italic hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              title="Italic"
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => setText(t => t + '\n- Item ')}
                              className="hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                              title="Bullet List"
                            >
                              • List
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSketchpad(!showSketchpad)}
                              className="hover:text-purple-300 px-1.5 py-0.5 rounded cursor-pointer text-purple-400 font-semibold"
                            >
                              ✏️ Sketch
                            </button>
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-purple-400/80">MARKDOWN</span>
                        </div>
                      </div>

                      {/* Sketchpad Drawer */}
                      {showSketchpad && (
                        <div className="p-3 rounded-xl border border-purple-500/30 bg-black/70 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-300">Hand-Drawn Sketch Payload</span>
                            <button
                              type="button"
                              onClick={clearCanvas}
                              className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                            >
                              Clear Canvas
                            </button>
                          </div>
                          <canvas
                            ref={canvasRef}
                            width={340}
                            height={120}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full h-28 bg-[#0a0b14] border border-purple-500/20 rounded-lg cursor-crosshair"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Mode: FILE */}
                  {inputMode === 'file' && (
                    <div className="space-y-4 text-left">
                      {file ? (
                        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                              {file.type.startsWith('audio/') || file.name.includes('voice') ? (
                                <Mic className="w-5 h-5" />
                              ) : file.type.startsWith('video/') || file.name.includes('video') ? (
                                <Camera className="w-5 h-5" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                                {file.name}
                              </div>
                              <div className="text-[11px] text-[#9b9bbf] font-mono">
                                {(file.size / 1024).toFixed(1)} KB • {file.type || 'application/octet-stream'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              addLog('> removed attached file');
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-[#9b9bbf] hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove attachment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block p-6 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-center cursor-pointer transition-all">
                          <Upload className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                          <span className="text-xs font-bold text-white block">
                            Upload Encrypted Payload File
                          </span>
                          <span className="text-[11px] text-[#5c5c80] block mt-1">
                            Max size 700KB. Any file type.
                          </span>
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </label>
                      )}

                      {/* Quick Media Recording Shortcuts */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('voice');
                            addLog('> switched to: [VOICE NOTE]');
                          }}
                          className="p-2.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-500/10 flex items-center justify-center gap-2 text-xs font-semibold text-[#9b9bbf] hover:text-purple-300 transition-all cursor-pointer"
                        >
                          <Mic className="w-4 h-4 text-purple-400" />
                          <span>Voice Memo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('video');
                            addLog('> switched to: [VIDEO CAPSULE]');
                          }}
                          className="p-2.5 rounded-xl border border-purple-500/20 bg-black/40 hover:bg-purple-500/10 flex items-center justify-center gap-2 text-xs font-semibold text-[#9b9bbf] hover:text-purple-300 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-purple-400" />
                          <span>Video Capsule</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input Mode: CODE */}
                  {inputMode === 'code' && (
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#9b9bbf]">Language Syntax</span>
                        <select
                          value={codeLanguage}
                          onChange={e => setCodeLanguage(e.target.value)}
                          className="bg-black/60 border border-purple-500/20 text-xs rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                        >
                          <option value="javascript">JavaScript / TypeScript</option>
                          <option value="python">Python</option>
                          <option value="rust">Rust</option>
                          <option value="go">Go</option>
                          <option value="sql">SQL</option>
                          <option value="json">JSON</option>
                          <option value="html">HTML / CSS</option>
                          <option value="plaintext">Plain Text</option>
                        </select>
                      </div>

                      <textarea
                        rows={7}
                        placeholder="// Paste code here..."
                        value={text}
                        onChange={handleTextChange}
                        className="w-full p-3.5 text-xs text-teal-300 font-mono bg-black/60 border border-purple-500/20 rounded-xl outline-none resize-none placeholder:text-[#5c5c80]"
                      />
                    </div>
                  )}

                  {/* Input Mode: VOICE */}
                  {inputMode === 'voice' && (
                    <div className="space-y-4 text-left animate-slide-in">
                      {file && (file.type.startsWith('audio/') || file.name.includes('voice')) ? (
                        /* Voice Memo Ready / Playback Card */
                        <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                <Mic className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>Voice Memo Ready</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ATTACHED
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#9b9bbf] font-mono mt-0.5">
                                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'audio/webm'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFile(null);
                                addLog('> cleared voice memo');
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#9b9bbf] hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Recording"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Audio Player Preview */}
                          <div className="p-3 rounded-xl bg-black/60 border border-purple-500/20">
                            <audio controls src={file.data} className="w-full h-9 rounded" />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-all border border-purple-500/20"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Re-record Memo
                            </button>
                            <span className="text-[11px] font-mono text-purple-400/80">
                              🔒 AES-256-GCM Encrypted
                            </span>
                          </div>
                        </div>
                      ) : isRecording ? (
                        /* Active Recording View */
                        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <span className="relative flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                            </span>
                            <span className="text-xs font-mono font-bold tracking-wider text-rose-300 uppercase">
                              LIVE AUDIO RECORDING IN PROGRESS
                            </span>
                          </div>

                          {/* Timer */}
                          <div className="font-mono text-3xl font-black text-white tracking-widest">
                            00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
                            <span className="text-xs text-[#9b9bbf] font-normal ml-2">/ 01:00 MAX</span>
                          </div>

                          {/* Animated Equalizer Wave */}
                          <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                            {[40, 75, 95, 60, 100, 85, 45, 90, 70, 100, 65, 80, 50, 95, 30].map((h, i) => (
                              <div
                                key={i}
                                className="w-1.5 bg-gradient-to-t from-rose-500 to-purple-400 rounded-full animate-pulse"
                                style={{
                                  height: `${h}%`,
                                  animationDelay: `${(i * 0.08).toFixed(2)}s`,
                                  animationDuration: '0.6s'
                                }}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={stopRecording}
                            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            Stop & Save Voice Memo
                          </button>
                        </div>
                      ) : (
                        /* Idle Voice Studio View */
                        <div className="p-6 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 text-center space-y-4 transition-all">
                          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 shadow-inner">
                            <Mic className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">Record Secure Voice Capsule</h4>
                            <p className="text-xs text-[#9b9bbf] max-w-xs mx-auto">
                              Record an encrypted voice memo from your microphone (Max 60s). Encrypted client-side.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={startRecording}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95 transition-all"
                          >
                            <Mic className="w-4 h-4" />
                            Start Voice Recording
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Mode: VIDEO */}
                  {inputMode === 'video' && (
                    <div className="space-y-4 text-left animate-slide-in">
                      {file && (file.type.startsWith('video/') || file.name.includes('video')) ? (
                        /* Video Capsule Ready / Preview Card */
                        <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                <Camera className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>Video Capsule Ready</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ATTACHED
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#9b9bbf] font-mono mt-0.5">
                                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'video/webm'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFile(null);
                                addLog('> cleared video capsule');
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#9b9bbf] hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Recording"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Video Player Preview */}
                          <div className="relative rounded-xl overflow-hidden bg-black/80 border border-purple-500/20 aspect-video flex items-center justify-center">
                            <video
                              controls
                              playsInline
                              src={previewObjectUrl || file.data}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-all border border-purple-500/20"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Retake Video
                            </button>
                            <span className="text-[11px] font-mono text-purple-400/80">
                              🔒 Client-Side AES-256-GCM
                            </span>
                          </div>
                        </div>
                      ) : isCameraActive ? (
                        /* Live Viewfinder / Active Recording View */
                        <div className="p-4 rounded-2xl border border-purple-500/30 bg-black/80 space-y-3">
                          {/* Cyber Viewfinder with HUD */}
                          <div className="relative rounded-xl overflow-hidden bg-black border border-purple-500/30 aspect-video flex items-center justify-center group">
                            <video
                              ref={(el) => {
                                videoLiveRef.current = el;
                                if (el && videoStreamRef.current && el.srcObject !== videoStreamRef.current) {
                                  el.srcObject = videoStreamRef.current;
                                  el.muted = true;
                                  el.playsInline = true;
                                  el.play().catch(() => {});
                                }
                              }}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover transform -scale-x-100"
                            />

                            {/* Cyber HUD Overlays */}
                            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                              {/* Top HUD */}
                              <div className="flex items-center justify-between">
                                {isVideoRecording ? (
                                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-600/90 text-white font-mono text-[11px] font-bold tracking-wider animate-pulse shadow-lg">
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    REC 00:{videoRecordingDuration < 10 ? `0${videoRecordingDuration}` : videoRecordingDuration} / 00:30
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    VIEWFINDER READY
                                  </div>
                                )}
                                <div className="text-[10px] font-mono text-purple-300/80 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                                  HD 24FPS • 640x480
                                </div>
                              </div>

                              {/* Viewfinder Reticle / Corners */}
                              <div className="flex justify-between items-center opacity-40 text-purple-400 font-mono text-xs">
                                <span>┌</span>
                                <span>┐</span>
                              </div>
                              <div className="flex justify-between items-center opacity-40 text-purple-400 font-mono text-xs">
                                <span>└</span>
                                <span>┘</span>
                              </div>

                              {/* Bottom HUD */}
                              <div className="flex items-center justify-between text-[10px] font-mono text-[#9b9bbf]">
                                <span>ZERO-KNOWLEDGE BUFFER</span>
                                <span>MAX: 30s (~500KB)</span>
                              </div>
                            </div>
                          </div>

                          {/* Viewfinder Controls */}
                          <div className="flex items-center gap-2 pt-1">
                            {isVideoRecording ? (
                              <button
                                type="button"
                                onClick={stopVideoRecording}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
                              >
                                <Square className="w-4 h-4 fill-white" />
                                Stop & Save Video
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={startVideoRecording}
                                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                  Record Video (30s Max)
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#9b9bbf] hover:text-white transition-all cursor-pointer border border-white/10"
                                  title="Turn Off Camera"
                                >
                                  <VideoOff className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Idle Video Studio View */
                        <div className="p-6 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5 text-center space-y-4 transition-all">
                          <input
                            ref={videoFileInputRef}
                            type="file"
                            accept="video/*,.mp4,.webm,.mov,.mkv"
                            className="hidden"
                            onChange={handleVideoFileUpload}
                          />

                          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 shadow-inner">
                            <Camera className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">Record or Attach Secure Video Capsule</h4>
                            <p className="text-xs text-[#9b9bbf] max-w-xs mx-auto">
                              Record live from your camera (Max 30s) or upload an existing video clip (Max 10MB).
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95 transition-all"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Enable Camera & Record</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => videoFileInputRef.current?.click()}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 border border-purple-500/30 cursor-pointer active:scale-95 transition-all"
                            >
                              <Upload className="w-4 h-4 text-purple-400" />
                              <span>Upload Video File (10MB)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PROTECTION SECTION */}
                  <div className="space-y-3 pt-2 border-t text-left" style={{ borderColor: 'rgba(120, 80, 255, 0.12)' }}>
                    <span className="section-label">PROTECTION</span>

                    {/* Password protection toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-white">Password protection</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !passwordProtection;
                            setPasswordProtection(next);
                            addLog(`> config: password protection [${next ? 'ENABLED' : 'DISABLED'}]`);
                          }}
                          className={`toggle-track ${passwordProtection ? 'on' : 'off'}`}
                        >
                          <span className="toggle-thumb" />
                        </button>
                      </div>

                      {passwordProtection && (
                        <input
                          type="password"
                          placeholder="Set capsule passkey..."
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full glass-input px-3.5 py-2 text-xs rounded-xl animate-slide-up"
                        />
                      )}
                    </div>

                    {/* Burn after reading toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-xs font-semibold text-white">Burn after reading</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !burnAfterReading;
                          setBurnAfterReading(next);
                          addLog(`> config: burn after reading [${next ? 'ENABLED' : 'DISABLED'}]`);
                        }}
                        className={`toggle-track ${burnAfterReading ? 'on' : 'off'}`}
                      >
                        <span className="toggle-thumb" />
                      </button>
                    </div>

                    {/* Set expiry dropdown */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-semibold text-white">Set expiry</span>
                      </div>
                      <select
                        value={expiryOption}
                        onChange={e => {
                          setExpiryOption(e.target.value);
                          addLog(`> config: expiry set to [${e.target.options[e.target.selectedIndex].text}]`);
                        }}
                        className="bg-black/60 border border-purple-500/20 text-xs rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
                      >
                        <option value="300">5 minutes</option>
                        <option value="600">10 minutes</option>
                        <option value="3600">1 hour</option>
                        <option value="86400">1 day</option>
                        <option value="604800">1 week</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>

                  {/* GENERATE CAPSULE BUTTON */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGenerateCapsule}
                    className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Encrypting & Generating...' : 'Generate Capsule'}</span>
                  </button>

                  {/* Paranoid Mode Toggle */}
                  <div
                    className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-left"
                    style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                        Paranoid Mode
                      </span>
                      <p className="text-[10px] text-[#9b9bbf]">
                        Maximum security. Key split via Shamir&apos;s Secret Sharing (2-of-3 custodians).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !paranoidMode;
                        setParanoidMode(next);
                        addLog(`> config: paranoid mode [${next ? 'ENABLED' : 'DISABLED'}]`);
                      }}
                      className={`toggle-track ${paranoidMode ? 'on' : 'off'}`}
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------- */}
              {/* COLUMN 3 (RIGHT): Security Score Card (3 cols)     */}
              {/* -------------------------------------------------- */}
              <div className="lg:col-span-3">
                <div
                  className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 text-left border border-purple-500/20 h-full"
                  style={{ background: 'rgba(14, 16, 32, 0.85)' }}
                >
                  <p className="section-label">SECURITY SCORE</p>

                  {/* Circular Arc Meter */}
                  <div className="flex flex-col items-center py-2">
                    <svg width="130" height="75" viewBox="0 0 130 75" className="overflow-visible">
                      <path
                        d="M 12 70 A 52 52 0 0 1 118 70"
                        fill="none"
                        stroke="rgba(120,80,255,0.15)"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 12 70 A 52 52 0 0 1 118 70"
                        fill="none"
                        stroke="url(#purpleTealGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.PI * 52}`}
                        strokeDashoffset={`${Math.PI * 52 * (1 - securityScore / 100)}`}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                      <defs>
                        <linearGradient id="purpleTealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#2dd4bf" />
                        </linearGradient>
                      </defs>
                      <text x="65" y="68" textAnchor="middle" fill="#ffffff" fontSize="26" fontWeight="900">
                        {securityScore}
                      </text>
                    </svg>

                    <p className="text-xs font-bold text-emerald-400 -mt-0.5 flex items-center gap-1">
                      <span>✓</span> {securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Strong' : 'Standard'}
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> AES-256-GCM Encryption
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className={`flex items-center gap-1.5 ${passwordProtection ? 'text-white' : 'text-[#5c5c80]'}`}>
                        {passwordProtection ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-[#5c5c80]" />}
                        Password Protected
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className={`flex items-center gap-1.5 ${burnAfterReading ? 'text-white' : 'text-[#5c5c80]'}`}>
                        {burnAfterReading ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-[#5c5c80]" />}
                        Burn After Read
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Short Expiry ({expiryOption === '600' ? '10m' : expiryOption === '300' ? '5m' : 'Custom'})
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Zero-Knowledge
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>

                    <div className="flex items-center justify-between text-[#9b9bbf]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> No Tracking / No Logs
                      </span>
                      <span className="text-[10px] text-[#5c5c80]">ⓘ</span>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div
                    className="p-3 rounded-xl border text-[11px] text-[#9b9bbf] leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(120,80,255,0.12)' }}
                  >
                    🔒 Keep your link and password safe. CipherDrop can&apos;t recover them if lost.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ARCHIVE VIEW (Matching Screenshot 4)                      */}
        {/* ========================================================= */}
        {activeTab === 'archive' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-slide-up text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(120, 80, 255, 0.12)' }}>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Archive</h1>
                <p className="text-xs text-[#9b9bbf] mt-0.5">Manage your created capsules. Encrypted metadata only.</p>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-black/40" style={{ borderColor: 'rgba(120, 80, 255, 0.15)' }}>
                <Search className="w-3.5 h-3.5 text-[#5c5c80]" />
                <input
                  type="text"
                  placeholder="Search capsules..."
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-[#5c5c80] outline-none w-44"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div
              className="inline-flex p-1 rounded-xl gap-1 border"
              style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(120, 80, 255, 0.12)' }}
            >
              {(['active', 'viewed', 'destroyed'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setArchiveFilter(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    archiveFilter === tab
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-[#9b9bbf] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {archiveItems
                .filter(item => {
                  const matchesFilter = item.status === archiveFilter;
                  const matchesSearch = item.title.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                    item.code.toLowerCase().includes(archiveSearch.toLowerCase());
                  return matchesFilter && matchesSearch;
                })
                .map(item => (
                  <div
                    key={item.id}
                    className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'viewed'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.type === 'code' ? (
                          <Code className="w-5 h-5" />
                        ) : item.type === 'file' ? (
                          <Upload className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{item.title}</p>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-xs text-[#5c5c80] truncate mt-0.5">
                          {item.expiryText} • {item.protectionText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`badge ${
                          item.status === 'active'
                            ? 'badge-active'
                            : item.status === 'viewed'
                            ? 'badge-viewed'
                            : 'badge-destroyed'
                        }`}
                      >
                        {item.status}
                      </span>

                      {item.shareUrl && item.shareUrl !== '#' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(item.shareUrl);
                            setToast({ message: 'Capsule link copied!', type: 'success' });
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9b9bbf] hover:text-white cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}

                      {item.manageUrl && (
                        <a
                          href={item.manageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9b9bbf] hover:text-white cursor-pointer"
                          title="Manage Capsule"
                        >
                          <KeyRound className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SETTINGS VIEW                                             */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6 animate-slide-up text-left">
            <div className="border-b pb-4" style={{ borderColor: 'rgba(120, 80, 255, 0.12)' }}>
              <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
              <p className="text-xs text-[#9b9bbf] mt-0.5">Client-side operational preferences. Saved locally.</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-6">
              {/* Default Expiry */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#9b9bbf] uppercase tracking-wider block">Default Retention Lifetime</label>
                <select
                  value={defaultExpirySetting}
                  onChange={e => setDefaultExpirySetting(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/20 text-xs rounded-xl p-3 text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="300">5 Minutes</option>
                  <option value="600">10 Minutes (Recommended)</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">1 Day</option>
                  <option value="604800">1 Week</option>
                  <option value="never">Never (Manual Revoke)</option>
                </select>
              </div>

              {/* Auto copy links toggle */}
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(120, 80, 255, 0.1)' }}>
                <div>
                  <span className="text-xs font-bold text-white block">Auto-Copy on Generation</span>
                  <span className="text-[10px] text-[#5c5c80]">Automatically copy recipient links to your clipboard.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoCopySetting(!autoCopySetting)}
                  className={`toggle-track ${autoCopySetting ? 'on' : 'off'}`}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>

              {/* Tactical Scanlines */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-xs font-bold text-white block">Tactical HUD Scanlines</span>
                  <span className="text-[10px] text-[#5c5c80]">Overlay subtle CRT scanline filter.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanlinesSetting(!scanlinesSetting)}
                  className={`toggle-track ${scanlinesSetting ? 'on' : 'off'}`}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('cipherdrop:default-expiry', defaultExpirySetting);
                  localStorage.setItem('cipherdrop:autocopy', String(autoCopySetting));
                  localStorage.setItem('cipherdrop:scanlines', String(scanlinesSetting));
                } catch {
                  // localStorage unavailable — settings just won't persist across visits
                }
                setExpiryOption(defaultExpirySetting);
                setToast({ message: 'Settings saved to browser node.', type: 'success' });
                setActiveTab('terminal');
              }}
              className="btn-primary w-full py-3.5 rounded-xl text-xs font-bold"
            >
              Apply Preferences
            </button>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQrModal && createdCapsule && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div
            className="glass-panel-elevated max-w-sm w-full p-6 rounded-3xl text-center space-y-4 border border-purple-500/30"
            style={{ background: 'rgba(14, 16, 32, 0.95)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white">Capsule QR Code</span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-[#5c5c80] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdCapsule.shareUrl)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

            <p className="text-xs text-[#9b9bbf]">Scan with mobile camera to decrypt capsule.</p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Hero Loading Intro 5-Frame Revolving Animation on Initial Load */}
      {showHeroIntro && (
        <HeroLoadingIntro onComplete={() => setShowHeroIntro(false)} />
      )}

      {/* 6-Step Security Recommendation Engine Wizard */}
      {showRecommendationEngine && (
        <SecurityRecommendationEngine
          onApplyRecommendation={(config: SecurityConfig) => {
            setInputMode(config.inputMode);
            setBurnAfterReading(config.burnAfterReading);
            setExpiryOption(config.expiryOption);
            setPasswordProtection(config.passwordProtection);
            setParanoidMode(config.paranoidMode);
            setShowRecommendationEngine(false);
            addLog(`> applied security advisor configuration`);
            addLog(`  mode: [${config.inputMode.toUpperCase()}] | burn: [${config.burnAfterReading ? 'YES' : 'NO'}] | expiry: [${config.expiryOption}s]`);
            setToast({ message: 'Security recommendations applied!', type: 'success' });
          }}
          onCustomizeAll={() => {
            setShowRecommendationEngine(false);
            addLog(`> customized fields mode enabled`);
            setToast({ message: 'All fields unlocked for custom configuration.', type: 'info' });
          }}
          onSkip={() => {
            setShowRecommendationEngine(false);
            addLog(`> skipped security advisor (manual mode)`);
          }}
        />
      )}

      {/* Footer */}
      <footer
        className="w-full py-6 mt-16 text-center text-xs"
        style={{ borderTop: '1px solid rgba(120, 80, 255, 0.1)', color: '#5c5c80' }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} CipherDrop — Zero-knowledge secure sharing.</p>
          <div className="flex gap-4">
            <span>Privacy Deniability</span>
            <span>AES-256-GCM Zero-Knowledge</span>
          </div>
        </div>
      </footer>

      {/* Spider-Man & Web Animation (Interactive on Landing, subtle light web on Terminal) */}
      <SpidermanAgent isLanding={activeTab === 'landing'} />
    </div>
  );
}
