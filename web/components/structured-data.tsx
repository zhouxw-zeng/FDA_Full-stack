import { siteConfig } from '@/app/site-config';

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  slug,
  date,
  tags,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  date: string;
  tags: string[];
  image: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    inLanguage: 'zh-CN',
    image: `${siteConfig.url}${image}`,
    mainEntityOfPage: `${siteConfig.url}/blog/${slug}`,
    author: {
      '@type': 'Organization',
      name: siteConfig.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    keywords: tags.join(', '),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
