import { ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';

import { siteConfig } from '@/app/site-config';
import { searchPosts } from '@/content/posts';

type SearchPageProps = {
  searchParams: {
    q?: string | string[];
  };
};

function readQuery(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = readQuery(searchParams.q);
  const title = query ? `搜索：${query}` : '搜索建设笔记';

  return {
    title,
    description: query
      ? `在家庭动态小助手建设笔记中搜索 ${query}，查看 SSR、全栈架构、Vue 3、Next.js 与内容运营相关文章。`
      : '搜索家庭动态小助手建设笔记，支持站内文章结果与百度、必应、Google 外部搜索。',
    keywords: query
      ? [query, '家庭动态小助手', '建设笔记', '全栈项目', 'SSR']
      : siteConfig.keywords,
    alternates: {
      canonical: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    },
    robots: query
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

const popularKeywords = ['SSR', 'Vue 3', 'Next.js', '内容审核', '搜索', 'NestJS'];

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = readQuery(searchParams.q);
  const results = query ? searchPosts(query) : [];
  const encoded = encodeURIComponent(query);

  return (
    <main id="main-content">
      <section className="search-page-hero">
        <div className="section-shell">
          <p className="section-index">站内与站外搜索</p>
          <h1>从一个关键词，找到内容、背景和下一步。</h1>
          <form className="search-page-form" action="/search" method="get" role="search">
            <label htmlFor="search-page-input">搜索关键词</label>
            <div className="search-page-form__field">
              <MagnifyingGlass size={22} aria-hidden="true" />
              <input
                id="search-page-input"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="输入 SSR、Vue、审核或搜索"
              />
              <button className="button button--primary" type="submit">
                搜索
              </button>
            </div>
          </form>
          <div className="keyword-list" aria-label="热门关键词">
            {popularKeywords.map((keyword) => (
              <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`}>
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--ruled search-results-page">
        <div className="section-shell search-results-layout">
          <div>
            <div className="search-results-heading">
              <p>{query ? `关键词：${query}` : '等待输入关键词'}</p>
              <span>{query ? `${results.length} 篇相关文章` : '站内文章索引'}</span>
            </div>

            {!query ? (
              <div className="search-page-empty">
                <h2>输入一个具体问题，会更容易找到内容。</h2>
                <p>可以搜索技术名词、产品能力或文章中的完整概念。</p>
              </div>
            ) : null}

            {query && results.length === 0 ? (
              <div className="search-page-empty">
                <h2>站内还没有直接匹配的文章。</h2>
                <p>可以缩短关键词，或者使用右侧的外部搜索继续查找。</p>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="search-page-list">
                {results.map((post, index) => (
                  <article key={post.slug}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="post-meta">
                        {post.date} / {post.readingTime}
                      </p>
                      <h2>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p>{post.excerpt}</p>
                      <p className="post-tags">{post.tags.join(' / ')}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="external-results">
            <p>继续站外搜索</p>
            <h2>把当前关键词带到更广泛的索引中。</h2>
            <p>只有点击链接时才会跳转，页面加载不会向第三方发送关键词。</p>
            <div className="external-results__links">
              <a
                href={query ? `https://www.baidu.com/s?wd=${encoded}` : 'https://www.baidu.com'}
                target="_blank"
                rel="noreferrer"
              >
                百度
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a
                href={query ? `https://www.bing.com/search?q=${encoded}` : 'https://www.bing.com'}
                target="_blank"
                rel="noreferrer"
              >
                必应
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a
                href={query ? `https://www.google.com/search?q=${encoded}` : 'https://www.google.com'}
                target="_blank"
                rel="noreferrer"
              >
                Google
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
            <div className="external-results__meta">
              <a href="/opensearch.xml">OpenSearch 描述文件</a>
              <a href="/feed.xml">RSS 订阅</a>
              <a href="/sitemap.xml">完整站点地图</a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
