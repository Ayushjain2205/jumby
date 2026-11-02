import type { Metadata, Viewport } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jumby.app'),
  title: 'Jumby - A world of games made by everyone',
  description: 'Jumby is a creative gaming platform where anyone can play, create, and share games together.',
  keywords: ['jumby', 'games', 'tiktok for games', 'instant games', 'play create share together'],
  authors: [{ name: 'Jumby' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F0F0F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${poppins.variable} ${inter.variable}`}>
      <body className="h-full w-full overflow-hidden bg-jumby-ink text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
