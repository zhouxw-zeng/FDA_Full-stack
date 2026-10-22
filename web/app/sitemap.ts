import type { MetadataRoute } from 'next';

import { siteConfig } from '@/app/site-config';
import { posts } from '@/content/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const postEntries = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date('2026-10-22'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date('2026-10-22'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/search`,
      lastModified: new Date('2026-10-22'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...postEntries,
  ];
}
