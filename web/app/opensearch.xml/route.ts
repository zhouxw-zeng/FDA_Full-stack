import { siteConfig } from '@/app/site-config';

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
      <ShortName>${siteConfig.shortName}</ShortName>
      <Description>搜索 ${siteConfig.name} 的建设笔记</Description>
      <InputEncoding>UTF-8</InputEncoding>
      <Url type="text/html" template="${siteConfig.url}/search?q={searchTerms}" />
    </OpenSearchDescription>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/opensearchdescription+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}
