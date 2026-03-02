import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tiệm Lẩu Anh Hai',
    short_name: 'Lẩu Anh Hai',
    description: 'Thực đơn lẩu và đặt món trực tuyến',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'vi',
    icons: [
      {
        src: '/favicon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        src: '/logo.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
  };
}
