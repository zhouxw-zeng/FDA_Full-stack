import { NextResponse } from 'next/server';

import { searchPosts } from '@/content/posts';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  const posts = searchPosts(query)
    .slice(0, 6)
    .map(({ slug, title, excerpt, tags, date }) => ({ slug, title, excerpt, tags, date }));

  return NextResponse.json(
    { query, posts },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
