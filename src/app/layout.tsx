import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { ServiceWorker } from '@/components/pwa/ServiceWorker';

export const metadata: Metadata = {
  title: {
    default: 'CHESS MASTER AI – Aggressive Chess Academy',
    template: '%s · CHESS MASTER AI',
  },
  description:
    'ZERO TO HERO – Master the art of attacking chess. Program catur 48 jam dalam Bahasa Melayu untuk pemula mutlak.',
  applicationName: 'CHESS MASTER AI',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Chess Master AI', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/logo.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0e1211',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ms">
      <body>
        <AppShell>{children}</AppShell>
        <ServiceWorker />
      </body>
    </html>
  );
}
