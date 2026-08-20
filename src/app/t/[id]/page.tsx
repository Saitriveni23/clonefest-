import { Header } from '@/components/Header';
import ChatPanel from './ChatPanel';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <ChatPanel id={id} />
      </main>
    </div>
  );
}
