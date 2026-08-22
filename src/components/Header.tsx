'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { History, Settings, Trash2, ExternalLink, X, ShieldAlert } from 'lucide-react';

function UtcClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().substring(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden xl:flex flex-col items-end leading-none mr-1">
      <span className="font-mono text-[9px] text-text-ghost tracking-widest">SYS.TIME [UTC]</span>
      <span className="font-mono text-xs text-text-muted tabular-nums">{time ?? '--:--:--'}</span>
    </div>
  );
}

export function Header() {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // Settings states
  const [defaultExpiry, setDefaultExpiry] = useState('86400');
  const [scanlinesActive, setScanlinesActive] = useState(false);
  const [autoCopy, setAutoCopy] = useState(true);

  // Load local history log
  const loadHistory = () => {
    try {
      const historyStr = localStorage.getItem('cipherdrop:history') || '[]';
      setHistoryItems(JSON.parse(historyStr));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
    const handleHistoryChange = () => loadHistory();
    window.addEventListener('cipherdrop:history-change', handleHistoryChange);
    return () => window.removeEventListener('cipherdrop:history-change', handleHistoryChange);
  }, []);

  // Load preferences on mount
  useEffect(() => {
    try {
      const expiry = localStorage.getItem('cipherdrop:default-expiry') || '86400';
      const scan = localStorage.getItem('cipherdrop:scanlines') === 'true';
      const copy = localStorage.getItem('cipherdrop:autocopy') !== 'false';
      setDefaultExpiry(expiry);
      setScanlinesActive(scan);
      setAutoCopy(copy);

      if (scan) {
        document.body.classList.add('scanlines-active');
      } else {
        document.body.classList.remove('scanlines-active');
      }
    } catch (e) {}
  }, []);

  const saveSetting = (key: string, val: string) => {
    try {
      localStorage.setItem(key, val);
      if (key === 'cipherdrop:scanlines') {
        if (val === 'true') {
          document.body.classList.add('scanlines-active');
        } else {
          document.body.classList.remove('scanlines-active');
        }
      }
    } catch (e) {}
  };

  const deleteHistoryItem = (id: string) => {
    try {
      const updated = historyItems.filter((item) => item.id !== id);
      localStorage.setItem('cipherdrop:history', JSON.stringify(updated));
      setHistoryItems(updated);
    } catch (e) {}
  };

  const clearHistory = () => {
    try {
      localStorage.setItem('cipherdrop:history', '[]');
      setHistoryItems([]);
    } catch (e) {}
  };

  return (
    <header className="w-full border-b border-panel-border backdrop-blur-xl bg-panel-bg sticky top-0 z-50 transition-colors duration-300 shadow-[0_1px_10px_rgba(167,139,250,0.08)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all bg-zinc-950">
              <img src="/logo.png" alt="CipherDrop Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-lg leading-none tracking-tighter uppercase text-text-main hidden sm:inline">
              Cipher<span className="text-teal-400">Drop</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-btn-sec-bg border border-panel-border rounded-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse-teal" />
            <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest opacity-90">ZKS Operational</span>
          </div>
        </div>

        <nav className="hidden lg:flex gap-8 items-center shrink-0">
          <Link
            href="/"
            className="relative font-sans text-base font-bold text-teal-400 pb-1 glow-sm"
          >
            Terminal
            <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
          </Link>
          <button
            onClick={() => {
              loadHistory();
              setIsArchiveOpen(true);
            }}
            className="font-sans text-base font-medium text-text-ghost hover:text-text-main cursor-pointer transition-colors"
          >
            Archive
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="font-sans text-base font-medium text-text-ghost hover:text-text-main cursor-pointer transition-colors"
          >
            Settings
          </button>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <UtcClock />
          <Tooltip text="Switch between light and dark appearance">
            <ThemeToggle />
          </Tooltip>
          <div className="hidden md:flex items-center px-3 py-1.5 bg-rose-500/10 border border-rose-500/30">
            <span className="font-mono text-[10px] text-rose-400 uppercase tracking-wider">TOP SECRET // CLASSIFIED</span>
          </div>
        </div>
      </div>

      {/* Archive Modal */}
      {isArchiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel max-w-2xl w-full p-6 space-y-6 text-left border-teal-500/20 bg-zinc-950/95 relative rounded-2xl max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsArchiveOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 font-bold p-1 bg-zinc-900 rounded-lg cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-10 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <History className="w-5 h-5 text-teal-400" />
                Terminal Secret Dispatch Log
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                CLASSIFIED DATA: Dispatch history is strictly cached client-side in this local browser node's storage. No index is shared or synced with the server.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {historyItems.length === 0 ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-xs text-zinc-500 font-mono">LOG REGISTER EMPTY</p>
                  <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">No secret links have been created or logged on this device yet.</p>
                </div>
              ) : (
                historyItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-zinc-700/80 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 text-teal-400">
                          {item.type || 'TEXT'}
                        </span>
                        <span className="text-xs font-bold text-zinc-200 truncate max-w-[200px]">{item.title}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Hashed Node: <span className="font-mono text-zinc-400">{item.id}</span> · Dispatched: {new Date(item.date).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={item.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 flex items-center gap-1 border border-zinc-800 cursor-pointer"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                      {item.manageUrl && (
                        <a
                          href={item.manageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-[10px] font-bold text-rose-400 flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                        >
                          Manage
                        </a>
                      )}
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {historyItems.length > 0 && (
              <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
                <button
                  onClick={clearHistory}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 text-[10px] font-bold text-rose-400 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  WIPE ALL SECRETS DISPATCH HISTORY
                </button>
                <span className="text-[10px] text-zinc-600 font-mono">COUNT: {historyItems.length} ITEMS</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 text-left border-zinc-800 bg-zinc-950/95 relative rounded-2xl">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 font-bold p-1 bg-zinc-900 rounded-lg cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-10 border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                <Settings className="w-5 h-5 text-teal-400" />
                Terminal Interface settings
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                Adjust client-side operational preferences. All choices save locally to your device node.
              </p>
            </div>

            <div className="space-y-5">
              {/* Default Expiry dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block font-mono">DEFAULT RETENTION LIFETIME</label>
                <select
                  value={defaultExpiry}
                  onChange={(e) => {
                    setDefaultExpiry(e.target.value);
                    saveSetting('cipherdrop:default-expiry', e.target.value);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="300">5 Minutes (Operational testing)</option>
                  <option value="3600">1 Hour</option>
                  <option value="86400">1 Day</option>
                  <option value="604800">1 Week</option>
                  <option value="never">Never (Keep until manual revocation)</option>
                </select>
                <p className="text-[9px] text-zinc-500">New creations will pre-select this retention period.</p>
              </div>

              {/* Tactical Scanlines Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/40">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-bold text-zinc-300 font-mono">TACTICAL HUD SCANLINES</span>
                  <span className="text-[9px] text-zinc-500">Inject overlay scanline screen filter styling.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !scanlinesActive;
                    setScanlinesActive(next);
                    saveSetting('cipherdrop:scanlines', next ? 'true' : 'false');
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${scanlinesActive ? 'bg-teal-500' : 'bg-zinc-800 border border-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${scanlinesActive ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Auto copy links toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/40">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-xs font-bold text-zinc-300 font-mono">AUTO-COPY ON GENERATION</span>
                  <span className="text-[9px] text-zinc-500">Auto-copy the recipient link to your clipboard upon creation.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoCopy;
                    setAutoCopy(next);
                    saveSetting('cipherdrop:autocopy', next ? 'true' : 'false');
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${autoCopy ? 'bg-teal-500' : 'bg-zinc-800 border border-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoCopy ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-xs font-bold text-zinc-950 transition-all cursor-pointer font-mono"
              >
                APPLY PREFERENCES
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
