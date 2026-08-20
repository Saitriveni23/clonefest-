import { Header } from '@/components/Header';
import { PasteForm } from '@/components/PasteForm';
import { ShieldAlert, Key, Zap, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Main content body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-semibold uppercase tracking-wider animate-float">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Secure Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.1] md:leading-[1.15]">
            Zero-Knowledge <br className="hidden sm:inline" />
            <span className="text-gradient">Secure Note Sharing</span>
          </h1>
          
          <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            Encrypt your sensitive text, source code, or files entirely in your browser before storing. The decryption key never leaves your system.
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
