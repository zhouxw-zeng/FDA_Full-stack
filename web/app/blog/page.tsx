import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { siteConfig } from '@/app/site-config';
import { posts } from '@/content/posts';

export const metadata: Metadata = {
  title: '建设笔记',
  description:
    '记录家庭动态小助手的 SSR、社区架构、Vue 与 Next.js 边界、关键词搜索和内容运营实践。',
  keywords: ['建设笔记', '全栈开发', 'SSR', 'Vue 3', 'Next.js', '内容运营', '关键词搜索'],
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    title: `建设笔记 | ${siteConfig.name}`,
    description: '从产品功能到技术边界，记录一套家庭社区如何被构建和运营。',
    url: '/blog',
    type: 'website',
  },
};

export default function BlogPage() {
  const [leadPost, ...remainingPosts] = posts;

  return (
    <main id="main-content">
      <section className="blog-hero">
        <div className="section-shell blog-hero__grid">
          <div>
            <p className="section-index">个人博客</p>
            <h1>写清楚每个系统为什么这样长。</h1>
            <p>
              这里记录产品取舍、服务端渲染、Vue 与 Next.js 的边界，以及关键词搜索如何从站内走向站外。
            </p>
          </div>
          <form className="blog-search" action="/search" method="get" role="search">
            <label htmlFor="blog-search-input">在建设笔记中搜索</label>
            <div className="blog-search__field">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <input
                id="blog-search-input"
                name="q"
                type="search"
                placeholder="SSR、搜索、内容治理"
              />
              <button className="button button--primary" type="submit">
                搜索
              </button>
            </div>
            <a href="/feed.xml">通过 RSS 订阅</a>
          </form>
        </div>
      </section>

      <section className="section section--ruled blog-index">
        <div className="section-shell">
          <article className="blog-lead">
            <Link className="blog-lead__image" href={`/blog/${leadPost.slug}`}>
              <Image
                src={leadPost.image}
                alt={leadPost.imageAlt}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 58vw"
              />
            </Link>
            <div className="blog-lead__body">
              <p className="post-meta">
                {leadPost.date} / {leadPost.readingTime}
              </p>
              <h2>
                <Link href={`/blog/${leadPost.slug}`}>{leadPost.title}</Link>
              </h2>
              <p>{leadPost.excerpt}</p>
              <p className="post-tags">{leadPost.tags.join(' / ')}</p>
              <Link className="button button--secondary" href={`/blog/${leadPost.slug}`}>
                阅读全文
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <div className="blog-list">
            {remainingPosts.map((post) => (
              <article className="blog-list__row" key={post.slug}>
                <div className="blog-list__meta">
                  <p>{post.date}</p>
                  <p>{post.readingTime}</p>
                </div>
                <div className="blog-list__body">
                  <h2>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p>{post.excerpt}</p>
                  <p className="post-tags">{post.tags.join(' / ')}</p>
                </div>
                <Link
                  className="icon-button blog-list__arrow"
                  href={`/blog/${post.slug}`}
                  aria-label={`阅读${post.title}`}
                  title={`阅读${post.title}`}
                >
                  <ArrowRight size={20} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
