'use client';

import { ArrowUpRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type SearchPost = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
};

type SearchState = 'idle' | 'loading' | 'ready' | 'error';

function externalSearchUrl(engine: 'baidu' | 'bing' | 'google', query: string) {
  const encoded = encodeURIComponent(query);
  if (engine === 'baidu') return `https://www.baidu.com/s?wd=${encoded}`;
  if (engine === 'bing') return `https://www.bing.com/search?q=${encoded}`;
  return `https://www.google.com/search?q=${encoded}`;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPost[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => inputRef.current?.focus(), 20);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const keyword = query.trim();
    if (!open || !keyword) {
      setResults([]);
      setState('idle');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState('loading');
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search request failed');
        const data = (await response.json()) as { posts: SearchPost[] };
        setResults(data.posts);
        setState('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setState('error');
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  return (
    <>
      <button
        className="icon-button"
        type="button"
        aria-label="打开站内搜索"
        title="搜索文章，快捷键 Ctrl K"
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass size={20} />
      </button>

      {open ? (
        <div
          className="search-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
          >
            <div className="search-dialog__header">
              <div>
                <h2 id="search-dialog-title">搜索建设笔记</h2>
                <p>输入产品、架构或关键词，结果由服务端内容索引生成。</p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="关闭搜索"
                title="关闭搜索"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label className="search-field">
              <span className="sr-only">搜索关键词</span>
              <MagnifyingGlass size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：SSR、Vue 3、内容审核"
                autoComplete="off"
              />
              <kbd>ESC</kbd>
            </label>

            <div className="search-results" aria-live="polite">
              {state === 'idle' ? (
                <div className="search-empty">
                  <p>试试从产品能力、技术架构或搜索优化开始。</p>
                  <div className="quick-links">
                    {['SSR', 'Vue 3', '搜索', '内容运营'].map((item) => (
                      <button key={item} type="button" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {state === 'loading' ? (
                <div className="search-skeleton" aria-label="正在搜索">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}

              {state === 'error' ? (
                <p className="inline-error">搜索暂时不可用，请稍后重试或打开完整搜索页。</p>
              ) : null}

              {state === 'ready' && results.length === 0 ? (
                <div className="search-empty">
                  <p>没有找到匹配的建设笔记。</p>
                  <Link href={`/search?q=${encodeURIComponent(query)}`} onClick={() => setOpen(false)}>
                    打开完整搜索页
                  </Link>
                </div>
              ) : null}

              {state === 'ready' && results.length > 0 ? (
                <div className="search-result-list">
                  {results.map((post) => (
                    <Link
                      key={post.slug}
                      className="search-result"
                      href={`/blog/${post.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      <span>
                        <strong>{post.title}</strong>
                        <small>{post.excerpt}</small>
                      </span>
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {query.trim() ? (
              <div className="external-search">
                <span>继续站外搜索</span>
                <a href={externalSearchUrl('baidu', query)} target="_blank" rel="noreferrer">
                  百度
                </a>
                <a href={externalSearchUrl('bing', query)} target="_blank" rel="noreferrer">
                  必应
                </a>
                <a href={externalSearchUrl('google', query)} target="_blank" rel="noreferrer">
                  Google
                </a>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
