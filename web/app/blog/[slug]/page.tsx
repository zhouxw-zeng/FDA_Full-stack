import { ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/app/site-config';
import { ArticleJsonLd } from '@/components/structured-data';
import { postBySlug, posts } from '@/content/posts';

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: ArticlePageProps): Metadata {
  const post = postBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [...post.tags, '家庭动态小助手', '全栈项目', '建设笔记'],
    authors: [{ name: siteConfig.author.name }],
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [siteConfig.author.name],
      tags: post.tags,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 800,
          alt: post.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const post = postBySlug(params.slug);
  if (!post) notFound();

  const related = posts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <main id="main-content">
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        slug={post.slug}
        date={post.date}
        tags={post.tags}
        image={post.image}
      />

      <article>
        <header className="article-header">
          <div className="section-shell">
            <Link className="article-back" href="/blog">
              <ArrowLeft size={17} aria-hidden="true" />
              返回建设笔记
            </Link>
            <p className="post-meta">
              {post.date} / {post.readingTime}
            </p>
            <h1>{post.title}</h1>
            <p className="article-deck">{post.excerpt}</p>
            <div className="article-tags">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <div className="section-shell article-cover">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1120px"
          />
        </div>

        <div className="section-shell article-layout">
          <aside className="article-aside">
            <p>文章导航</p>
            <nav aria-label="文章目录">
              {post.sections.map((section, index) => (
                <a key={section.heading} href={`#section-${index + 1}`}>
                  {section.heading}
                </a>
              ))}
            </nav>
            <a href="/feed.xml">RSS 订阅</a>
          </aside>

          <div className="article-content">
            {post.sections.map((section, index) => (
              <section key={section.heading} id={`section-${index + 1}`}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <div className="article-end">
              <p>想直接看产品？演示区里的按钮全部可用。</p>
              <Link className="button button--primary" href="/#showcase">
                查看产品演示
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      <section className="section section--ruled related-notes">
        <div className="section-shell">
          <div className="section-heading section-heading--compact">
            <h2>继续阅读</h2>
          </div>
          <div className="related-grid">
            {related.map((item) => (
              <article key={item.slug}>
                <p className="post-meta">
                  {item.date} / {item.readingTime}
                </p>
                <h3>
                  <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                </h3>
                <p>{item.excerpt}</p>
                <Link className="text-link" href={`/blog/${item.slug}`}>
                  阅读文章
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
