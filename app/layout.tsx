import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Cinzel, MedievalSharp } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
});

const medievalSharp = MedievalSharp({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fantasy',
});

export const metadata: Metadata = {
  title: 'Fantasy Realm JRPG Engine',
  description: 'A Fantasy Core JRPG Engine built with Three.js and Next.js.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${cinzel.variable} ${medievalSharp.variable}`}>
      <body className="font-sans antialiased bg-[#07090e] text-amber-50 selection:bg-amber-500/30 selection:text-amber-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
