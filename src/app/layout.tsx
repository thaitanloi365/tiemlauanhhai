import type { Metadata } from 'next';
import { Lora, Montserrat } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@/app/globals.css';
import { Providers } from '@/components/providers';

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-heading',
});

function getMetadataBase() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawSiteUrl) return new URL('http://localhost:3000');
  try {
    return new URL(rawSiteUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
}

const metadataBase = getMetadataBase();

export const metadata: Metadata = {
  title: {
    default: 'Tiệm Lẩu Anh Hai',
    template: '%s | Tiệm Lẩu Anh Hai',
  },
  description: 'Thực đơn lẩu và đặt món trực tuyến',
  metadataBase,
  alternates: {
    canonical: '/',
  },
  applicationName: 'Tiệm Lẩu Anh Hai',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/logo.png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Tiệm Lẩu Anh Hai',
    title: 'Tiệm Lẩu Anh Hai',
    description: 'Thực đơn lẩu và đặt món trực tuyến',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Logo Tiệm Lẩu Anh Hai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tiệm Lẩu Anh Hai',
    description: 'Thực đơn lẩu và đặt món trực tuyến',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${montserrat.variable} ${lora.variable}`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
