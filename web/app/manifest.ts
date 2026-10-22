import type { MetadataRoute } from 'next';

import { siteConfig } from '@/app/site-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f3ee',
    theme_color: '#d65336',
    lang: 'zh-CN',
    icons: [
      {
        src: '/brand-mark.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
