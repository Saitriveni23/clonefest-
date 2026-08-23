import { Header } from '@/components/Header';
import { PasteForm } from '@/components/PasteForm';
import { ShieldAlert, KeyRound, Flame, EyeOff, Radio, PenLine, SlidersHorizontal, Link2 } from 'lucide-react';

interface CreationPageTemplateProps {
  defaultMethod: 'direct' | 'threshold' | 'chat' | 'stego' | 'slack';
}

export function CreationPageTemplate({ defaultMethod }: CreationPageTemplateProps) {
  return (
    <div className="flex flex-col min-h-screen scanlines bg-[#05070a] text-zinc-300 font-mono">
      <Header />

      {/* Main content body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Tactical Agency Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            Cryptographic Intelligence Portal
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Deploy encrypted payloads with absolute deniability. Zero-knowledge architecture guarantees your intel remains classified until decryption.
          </p>
          <p className="text-xs text-zinc-500 max-w-lg mx-auto leading-relaxed font-sans">
            In plain terms: CipherDrop is a secure pastebin. Write a note or upload a file below, it gets encrypted <span className="text-teal-400">in your browser</span> before it ever leaves your device, and you get a link to share. Only someone with that exact link can decrypt it — not even our server can read it.
          </p>
        </section>

        {/* How It Works Guide */}
        <section className="mb-12">
          <h2 className="text-center text-[10px] font-bold text-text-ghost uppercase tracking-[0.2em] mb-5">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-5 text-left space-y-2 relative">
              <span className="absolute top-4 right-4 text-2xl font-black text-white/5">1</span>
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <PenLine className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-text-main">Write your secret</h3>
              <p className="text-[11px] text-text-ghost leading-relaxed">
                Type text or code, attach a file, record a voice note, or draw a sketch in the form below.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5 text-left space-y-2 relative">
              <span className="absolute top-4 right-4 text-2xl font-black text-white/5">2</span>
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <SlidersHorizontal className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="text-sm font-bold text-text-main">Choose protection</h3>
              <p className="text-[11px] text-text-ghost leading-relaxed">
                Optionally set an expiry time, a password, or &quot;Burn After Reading&quot; so it self-destructs after one view.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5 text-left space-y-2 relative">
              <span className="absolute top-4 right-4 text-2xl font-black text-white/5">3</span>
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                <Link2 className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-sm font-bold text-text-main">Share the link</h3>
              <p className="text-[11px] text-text-ghost leading-relaxed">
                Hit &quot;Securely Create Paste&quot; and send the generated link to whoever needs to read it.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5 text-left space-y-2 relative">
              <span className="absolute top-4 right-4 text-2xl font-black text-white/5">4</span>
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-text-main">They open & decrypt</h3>
              <p className="text-[11px] text-text-ghost leading-relaxed">
                The recipient&apos;s browser decrypts it locally. If you enabled burn-after-read, it&apos;s then wiped forever.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left HUD sidebar */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="glass-panel rounded-lg p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-400 opacity-50" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <h3 className="font-mono text-xs text-violet-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Security Protocol
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <KeyRound className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-text-main">AES-256-GCM</h4>
                    <p className="text-[11px] text-text-ghost leading-relaxed">Military-grade encryption applied client-side.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Flame className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-text-main">Self-Destruction</h4>
                    <p className="text-[11px] text-text-ghost leading-relaxed">Payloads automatically vaporize upon read or expiry.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <EyeOff className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-text-main">Zero Tracking</h4>
                    <p className="text-[11px] text-text-ghost leading-relaxed">No IP logging. No analytics. No traces left behind.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-lg p-5">
              <h3 className="text-[10px] text-text-ghost mb-3 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-ghost">Network</span>
                  <span className="text-[11px] font-semibold text-emerald-400">SECURE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-ghost">Entropy Pool</span>
                  <span className="text-[11px] font-semibold text-emerald-400">99.9%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Paste creation form */}
          <div className="lg:col-span-9 space-y-3">
            <div className="flex items-center justify-end gap-2 px-1">
              <span className="text-[10px] font-mono text-text-ghost uppercase tracking-wider">T-Terminal_Active</span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <PasteForm defaultMethod={defaultMethod} />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-panel-border bg-panel-bg mt-16 text-center text-xs text-text-ghost">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CipherDrop. Built for CloneFest — Rebuild the Legacy.</p>
          <div className="flex gap-4">
            <span className="hover:text-text-main transition-colors cursor-default">Privacy Deniability</span>
            <span className="hover:text-text-main transition-colors cursor-default">Secure Audited Cryptography</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
