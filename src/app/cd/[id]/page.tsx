import { Header } from '@/components/Header';
import { PasteView } from '@/components/PasteView';

interface CapsulePageProps {
  params: Promise<{ id: string }>;
}

export default async function CapsulePage({ params }: CapsulePageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b14] text-[#f0f0ff]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <PasteView id={id} />
      </main>

      <footer
        className="w-full py-6 mt-16 text-center text-xs"
        style={{ borderTop: '1px solid rgba(120,80,255,0.1)', color: '#5c5c80' }}
      >
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} CipherDrop — Zero-knowledge secure sharing.</p>
          <div className="flex gap-4">
            <span className="text-[#5c5c80]">Client-Side AES-256-GCM</span>
            <span className="text-[#5c5c80]">Zero-Knowledge Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
