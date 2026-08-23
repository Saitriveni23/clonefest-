import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

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
  title: 'CipherDrop — Zero-Knowledge Secure Sharing',
  description: 'A secure, minimalist pastebin where the server has zero knowledge of your pasted data. Encrypted and decrypted client-side in the browser.',
  keywords: 'secure paste, pastebin, zero-knowledge, aes-256-gcm, secure notes, cipherdrop',
  openGraph: {
    title: 'CipherDrop — Zero-Knowledge Secure Sharing',
    description: 'A modern, zero-knowledge secure text and code sharing platform.',
    url: 'https://cipherdrop.vercel.app',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.add('dark')
                document.documentElement.classList.remove('light')
                localStorage.theme = 'dark';
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <div className="glow-bg" />
          <div className="relative z-10 min-h-full flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
