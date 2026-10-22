import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__name">家庭动态小助手</p>
          <p className="site-footer__copy">
            一个把家庭记录、社区互动、AI 创作与内容运营放进同一套全栈工程的项目。
          </p>
        </div>
        <div className="site-footer__links" aria-label="页脚导航">
          <Link href="/blog">建设笔记</Link>
          <Link href="/search">搜索</Link>
          <a href="/feed.xml">RSS</a>
          <a href="/sitemap.xml">站点地图</a>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© 2026 家庭动态小助手项目组</span>
        <span>Next.js 14 服务端渲染 · Vue 3 + Vite 4 产品演示</span>
      </div>
    </footer>
  );
}
