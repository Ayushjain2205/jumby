import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jumby.app'),
  title: 'Jumby - TikTok for Games',
  description: 'Instant micro-games at your fingertips. Play, remix, and generate games with AI.',
  keywords: ['games', 'tiktok for games', 'instant games', 'ai games', 'remix', 'web games'],
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
  themeColor: '#06070d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-black">
      <body className="h-full w-full overflow-hidden bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
