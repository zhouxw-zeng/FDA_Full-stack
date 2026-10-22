import {
  ArrowRight,
  ChatCircleDots,
  CheckCircle,
  Code,
  Heart,
  MagnifyingGlass,
  NotePencil,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { posts } from '@/content/posts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '家庭动态小助手 - 全栈家庭社区与 AI 创作',
  description:
    '查看家庭动态小助手的完整产品能力与技术架构。移动端记录、社区互动、私信、AI 创作与运营后台，一套可部署的全栈项目。',
  alternates: {
    canonical: '/',
  },
};

const capabilities = [
  {
    title: '记录',
    copy: '图文与视频动态、九宫格素材、待审状态和记录列表，移动端完成完整发布流程。',
    icon: NotePencil,
  },
  {
    title: '回应',
    copy: '点赞、收藏、评论、关注与私信实时串联，让来自家人的反馈被及时看见。',
    icon: Heart,
  },
  {
    title: '治理',
    copy: '审批、上下架、用户状态与操作记录统一进入运营后台，权限和内容边界清楚。',
    icon: ShieldCheck,
  },
  {
    title: '创作',
    copy: '用带上下文与 Skills 的 AI 对话补充文案灵感，再通过流式响应逐步返回结果。',
    icon: Sparkle,
  },
];

const stack = [
  {
    label: '内容与 SEO',
    detail: 'Next.js 14 Server Components',
    description: '首屏 HTML、文章页面、搜索结果、站点地图与结构化数据。',
    icon: Code,
  },
  {
    label: '产品演示',
    detail: 'Vue 3 + Vite 4',
    description: '独立构建的交互界面，保留现有 Vue 组件和开发习惯。',
    icon: ChatCircleDots,
  },
  {
    label: '业务 API',
    detail: 'NestJS + TypeORM',
    description: '双端鉴权、内容状态、Socket.IO 推送、文件与 AI 能力。',
    icon: CheckCircle,
  },
  {
    label: '数据与存储',
    detail: 'MySQL 8.0 + 本地文件',
    description: '结构化业务数据、上传素材与可替换的部署边界。',
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const recentPosts = posts.filter((post) => post.slug !== featured.slug).slice(0, 2);

  return (
    <main id="main-content">
      <section className="hero">
        <div className="section-shell hero__grid">
          <div className="hero__copy">
            <p className="hero__kicker">全栈家庭社区项目</p>
            <h1>把家庭动态，做成一套真正完整的社区。</h1>
            <p className="hero__lede">
              记录、互动、私信、AI 创作与运营审核，统一在一个可部署的全栈项目里。
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/#showcase">
                查看产品演示
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button button--secondary" href="/blog">
                阅读建设笔记
              </Link>
            </div>
          </div>

          <div className="hero__visual" aria-label="产品界面预览">
            <div className="hero__visual-glass">
              <Image
                src="/images/product-preview.png"
                alt="家庭动态小助手产品界面预览，包含动态卡片、搜索与 AI 助手"
                fill
                priority
                sizes="(max-width: 820px) 100vw, 46vw"
              />
            </div>
            <div className="hero__visual-note">
              <span>真实界面</span>
              <span>Vue 3 交互演示</span>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="section section--ruled">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-index">产品能力</p>
            <h2>从发布一条动态，到形成可运营的社区。</h2>
            <p>
              功能不是彼此孤立的页面。记录产生互动，互动产生通知，审核与权限决定内容如何被看见。
            </p>
          </div>

          <div className="capability-grid">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              const variant =
                index === 0
                  ? 'capability-card--photo'
                  : index === 2
                    ? 'capability-card--accent'
                    : '';

              return (
                <article className={`capability-card ${variant}`} key={capability.title}>
                  {index === 0 ? (
                    <div className="capability-card__photo">
                      <Image
                        src="/images/note-community.jpg"
                        alt="安静的家庭客厅与绿植"
                        fill
                        sizes="(max-width: 760px) 100vw, 42vw"
                      />
                    </div>
                  ) : null}
                  <div className="capability-card__body">
                    <Icon size={24} weight="regular" aria-hidden="true" />
                    <h3>{capability.title}</h3>
                    <p>{capability.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="product-note">
            <p>移动端覆盖 H5、微信小程序与 App 构建，管理后台负责运营、审核和 AI 配置。</p>
            <Link href="/#showcase">
              查看产品演示
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="architecture" className="section section--ink">
        <div className="section-shell architecture-grid">
          <div className="architecture-copy">
            <p className="section-index">系统架构</p>
            <h2>官网负责表达，产品负责使用，服务端负责边界。</h2>
            <p>
              官网与产品端各自构建，通过稳定的接口与静态资源衔接。搜索与内容留在 Next.js，Vue
              演示保留独立生命周期。
            </p>
            <div className="architecture-facts">
              <span>服务端首屏</span>
              <span>独立演示构建</span>
              <span>双端鉴权</span>
            </div>
          </div>

          <div className="stack-board" aria-label="技术架构模块">
            {stack.map((item, index) => {
              const Icon = item.icon;
              return (
                <article className="stack-row" key={item.detail}>
                  <div className="stack-row__number">{String(index + 1).padStart(2, '0')}</div>
                  <Icon size={22} aria-hidden="true" />
                  <div>
                    <h3>{item.label}</h3>
                    <strong>{item.detail}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="showcase" className="section section--showcase">
        <div className="section-shell">
          <div className="showcase-heading">
            <div>
              <p className="section-index">可交互产品演示</p>
              <h2>直接浏览动态，试着点赞和切换 AI 标签。</h2>
            </div>
            <p>
              这个区域由独立的 Vue 3 + Vite 4 应用构建，嵌入 Next.js 官网。所有按钮都能实际点击。
            </p>
          </div>

          <div className="showcase-frame">
            <div className="showcase-frame__bar">
              <span>showcase / 家庭动态</span>
              <span>Vue 3 · Vite 4</span>
            </div>
            <iframe
              src="/showcase/"
              title="家庭动态小助手 Vue 3 可交互产品演示"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="section section--ruled">
        <div className="section-shell">
          <div className="section-heading section-heading--compact">
            <p className="section-index">建设笔记</p>
            <h2>关于 SSR、社区架构和技术边界的记录。</h2>
            <Link className="text-link" href="/blog">
              浏览全部文章
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="notes-layout">
            <article className="featured-note">
              <Link href={`/blog/${featured.slug}`} className="featured-note__image">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  sizes="(max-width: 760px) 100vw, 52vw"
                />
              </Link>
              <div className="featured-note__body">
                <p>{featured.tags.join(' / ')}</p>
                <h3>
                  <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h3>
                <span>{featured.excerpt}</span>
                <Link className="text-link" href={`/blog/${featured.slug}`}>
                  阅读全文
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <div className="note-list">
              {recentPosts.map((post) => (
                <article className="note-row" key={post.slug}>
                  <p>
                    {post.date} / {post.readingTime}
                  </p>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <span>{post.excerpt}</span>
                  <Link className="text-link" href={`/blog/${post.slug}`}>
                    阅读文章
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="search-cta">
        <div className="section-shell search-cta__grid">
          <div>
            <p className="section-index">关键词搜索</p>
            <h2>站内找到答案，站外继续查证。</h2>
            <p>
              搜索页由服务端生成，支持 OpenSearch、RSS 与结构化数据，也为百度、必应和 Google
              保留继续搜索入口。
            </p>
          </div>
          <div className="search-cta__panel">
            <form action="/search" method="get" role="search">
              <label htmlFor="home-search">搜索建设笔记</label>
              <div className="search-cta__field">
                <MagnifyingGlass size={20} aria-hidden="true" />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="输入关键词，例如 SSR"
                />
                <button className="button button--primary" type="submit">
                  搜索
                </button>
              </div>
            </form>
            <p>公开搜索入口：/search?q=关键词 · /opensearch.xml · /feed.xml</p>
          </div>
        </div>
      </section>
    </main>
  );
}
