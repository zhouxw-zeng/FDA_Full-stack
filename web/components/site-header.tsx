'use client';

import { List, X } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SearchDialog } from '@/components/search-dialog';

const navigation = [
  { href: '/#product', label: '产品能力' },
  { href: '/#architecture', label: '系统架构' },
  { href: '/#showcase', label: '交互演示' },
  { href: '/blog', label: '建设笔记' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href="/" aria-label="家庭动态小助手首页">
          <Image
            className="brand-lockup__mark"
            src="/brand-mark.png"
            width={32}
            height={32}
            alt=""
            priority
          />
          <span className="brand-lockup__name">家庭动态小助手</span>
        </Link>

        <nav className="desktop-nav" aria-label="主导航">
          {navigation.map((item) => (
            <Link key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <SearchDialog />
          <Link className="header-cta" href="/#showcase">
            查看产品演示
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="移动端导航">
          {navigation.map((item) => (
            <Link key={item.href} className="mobile-nav__link" href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="button button--primary mobile-nav__cta" href="/#showcase">
            查看产品演示
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
