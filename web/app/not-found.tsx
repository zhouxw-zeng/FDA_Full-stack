import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <div className="section-shell">
        <p className="section-index">页面不存在</p>
        <h1>这条内容没有找到。</h1>
        <p>链接可能已经变化，返回首页或查看全部建设笔记。</p>
        <div className="hero__actions">
          <Link className="button button--primary" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            返回首页
          </Link>
          <Link className="button button--secondary" href="/blog">
            浏览建设笔记
          </Link>
        </div>
      </div>
    </main>
  );
}
