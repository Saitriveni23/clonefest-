import { Header } from '@/components/Header';
import { PasteView } from '@/components/PasteView';

interface PastePageProps {
  params: Promise<{ id: string }>;
}

export default async function PastePage({ params }: PastePageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <PasteView id={id} />
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
