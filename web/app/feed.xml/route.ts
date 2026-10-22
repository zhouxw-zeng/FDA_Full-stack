import { siteConfig } from '@/app/site-config';
import { posts } from '@/content/posts';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function GET() {
  const items = posts
    .map(
      (post) => `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${siteConfig.url}/blog/${post.slug}</link>
          <guid isPermaLink="true">${siteConfig.url}/blog/${post.slug}</guid>
          <description>${escapeXml(post.excerpt)}</description>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('')}
        </item>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(siteConfig.name)}建设笔记</title>
        <link>${siteConfig.url}/blog</link>
        <description>${escapeXml(siteConfig.description)}</description>
        <language>zh-CN</language>
        <lastBuildDate>${new Date('2026-10-22').toUTCString()}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
