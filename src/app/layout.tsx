import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'CipherDrop — Drop a secret. Only they can open it.',
  description: 'Zero-knowledge encrypted capsules. AES-256-GCM encryption happens entirely in your browser — nothing is sent in plaintext.',
  keywords: 'secure paste, pastebin, zero-knowledge, aes-256-gcm, secure notes, cipherdrop, encrypted',
  openGraph: {
    title: 'CipherDrop — Drop a secret. Only they can open it.',
    description: 'Zero-knowledge encrypted capsules. AES-256-GCM encryption happens entirely in your browser.',
    url: 'https://cipherdrop.app',
    siteName: 'CipherDrop',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0a0b14]">
        <div className="glow-bg" />
        <div className="relative z-10 min-h-full flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
