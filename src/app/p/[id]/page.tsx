import { Header } from '@/components/Header';
import { PasteView } from '@/components/PasteView';

interface PastePageProps {
  params: Promise<{ id: string }>;
}

export default async function PastePage({ params }: PastePageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0b14' }}>
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Viewing Capsule banner */}
        <div
          className="flex items-center justify-between px-4 py-2 rounded-xl mb-6"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-rose-400 text-sm">🔥</span>
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Viewing Capsule</span>
          </div>
          <span className="text-[10px] text-[#5c5c80]">This capsule will self-destruct after reading</span>
        </div>

        <PasteView id={id} />
      </main>

      <footer
        className="w-full py-6 mt-16 text-center text-xs"
        style={{ borderTop: '1px solid rgba(120,80,255,0.1)', color: '#5c5c80' }}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} CipherDrop — Zero-knowledge secure sharing.</p>
          <div className="flex gap-4">
            <span>Privacy Deniability</span>
            <span>AES-256-GCM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
