import { Header } from '@/components/Header';
import { PasteForm } from '@/components/PasteForm';
import { ShieldAlert, Key, Zap, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen scanlines bg-[#05070a] text-zinc-300 font-mono">
      <Header />

      {/* Agency Tactical HUD Banner */}
      <div className="w-full bg-zinc-950 border-b border-zinc-800 text-[10px] px-4 py-2 flex flex-wrap justify-between items-center text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>STATUS: OPERATIONAL (SECURE GATEWAY)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>COVERT ROUTING: ACTIVE</span>
          <span>LEVEL: CLASSIFIED // TOP SECRET</span>
          <span>SYSTEM TIME: {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</span>
        </div>
      </div>

      {/* Main content body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
        
        {/* Tactical Agency Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
            <Lock className="w-3 h-3" />
            <span>CYBERSECURITY DEFENSE UNIT // DISPERSAL PROTOCOLS</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1] font-sans">
            Cipher<span className="text-teal-400">Drop</span> Cryptographic Intelligence Portal
          </h1>
          
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Coercion-resistant zero-knowledge secure node for agency intelligence sharing. All data is client-side encrypted before uploading. Senders retain full panic revoke overrides.
          </p>
        </section>

        {/* Paste creation form */}
        <section className="max-w-4xl mx-auto">
          <PasteForm />
        </section>

        {/* Features list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Key className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">AES-256-GCM</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Standard-grade client-side encryption. The encryption key is included in the URL fragment (#) and is never transmitted to our server.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">Self-Destruction</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Use the "Burn After Reading" option to delete your encrypted paste automatically the very first time it is accessed.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">Zero Tracking</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              No session tracking, no cookies, and no tracking analytics. We do not inspect, log, or parse any paste content.
            </p>
          </div>
        </section>

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
