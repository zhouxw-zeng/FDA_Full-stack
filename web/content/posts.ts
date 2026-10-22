export type PostSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
  image: string;
  imageAlt: string;
  featured?: boolean;
  sections: PostSection[];
};

export const posts: Post[] = [
  {
    slug: 'server-first-homepage',
    title: '为什么官网首屏必须由服务器先输出',
    excerpt: '首屏 SSR 不是框架选项，而是搜索抓取、分享预览和弱网体验的共同底线。',
    date: '2026-10-18',
    readingTime: '6 分钟',
    tags: ['Next.js', 'SSR', 'SEO'],
    image: '/images/note-ssr.jpg',
    imageAlt: '显示代码的笔记本电脑',
    featured: true,
    sections: [
      {
        heading: '首屏内容先到浏览器',
        paragraphs: [
          '搜索爬虫与社交平台通常只读取最初返回的 HTML。如果品牌介绍、文章标题和结构化数据都要等客户端脚本执行后才出现，外部系统就可能在内容尚未生成时离开页面。',
          '这个官网把首页、博客列表、文章详情和搜索页放在 Next.js 服务端组件中。标题、摘要、链接、JSON-LD 和 Open Graph 信息随 HTML 一起返回，客户端只接管搜索弹层等独立交互。',
        ],
        list: [
          '首屏内容无需等待 JavaScript 即可阅读',
          '文章页输出 BlogPosting 结构化数据',
          '搜索页根据查询参数在服务端生成结果',
          '站点地图、RSS 和 OpenSearch 由应用路由直接维护',
        ],
      },
      {
        heading: '不要让所有组件都变成客户端组件',
        paragraphs: [
          '服务端组件负责内容和元数据，客户端组件负责键盘快捷键、弹层、输入状态与用户反馈。边界越清晰，首屏 JavaScript 越少，后续搜索交互也越容易维护。',
        ],
      },
    ],
  },
  {
    slug: 'community-operations-loop',
    title: '把社区互动做成可运营的闭环',
    excerpt: '发布、审核、互动、通知与内容治理，需要共享同一套数据模型和权限边界。',
    date: '2026-10-14',
    readingTime: '8 分钟',
    tags: ['产品设计', 'NestJS', '内容运营'],
    image: '/images/note-community.jpg',
    imageAlt: '安静的家庭客厅与绿植',
    sections: [
      {
        heading: '内容从进入系统那一刻就需要状态',
        paragraphs: [
          '家庭社区并不只是一个瀑布流页面。动态提交后会进入待审批状态，运营人员通过后台完成任务，审核结果再决定它是否出现在公开内容流中。点赞、收藏、评论、关注和分享都需要围绕同一条内容记录展开。',
          '如果移动端和管理端各自建立一套状态定义，审批、上下架和删除很快会出现语义不一致。项目选择在 NestJS 服务层统一管理内容状态，并把移动端与后台端鉴权分开。',
        ],
      },
      {
        heading: '通知系统要跟随业务事件',
        paragraphs: [
          '点赞、评论和关注不仅修改数据库，也会创建对应用户的通知。Socket.IO 负责把新事件推送到在线用户，离线用户则在下次打开应用时读取未读列表。',
          '这样做的收益不是“实时”两个字，而是用户能及时知道自己记录的内容得到了回应。',
        ],
      },
    ],
  },
  {
    slug: 'next-and-vue-boundary',
    title: '在 Next.js 与 Vue 之间划一条清晰的边界',
    excerpt: '官网与产品端不必共用同一个渲染框架，关键是让它们各自承担最擅长的工作。',
    date: '2026-10-09',
    readingTime: '5 分钟',
    tags: ['架构', 'Vue 3', 'Vite 4'],
    image: '/images/note-stack.jpg',
    imageAlt: '服务器主板与电子元件细节',
    sections: [
      {
        heading: '官网优先搜索与内容',
        paragraphs: [
          'Next.js 适合承担营销页、博客、文章详情和搜索结果的服务器渲染。页面级元数据、站点地图和结构化数据都能放在同一条服务端内容链路里。',
          '产品演示则保留 Vue 3 的组件习惯与交互方式。Vite 4 负责独立构建，最终静态资源嵌入官网的演示区域。这样既保留现有 Vue 工程经验，也不让 React 与 Vue 在同一个组件树里互相迁就。',
        ],
        list: [
          'Next.js 管内容、SEO 与首屏 HTML',
          'Vue 3 管产品演示与高频交互',
          'Vite 4 独立构建演示资源',
          'NestJS 继续作为统一 API 边界',
        ],
      },
      {
        heading: '边界比统一更重要',
        paragraphs: [
          '技术选型不是为了把所有代码塞进一个框架，而是让每层职责可解释。只要接口、构建产物和部署路径稳定，官网与产品端可以独立发布。',
        ],
      },
    ],
  },
  {
    slug: 'external-keyword-search',
    title: '让站内搜索成为外部关键词的入口',
    excerpt: '页面搜索不只需要结果，还需要可抓取的查询页、清晰的语义标签和站外继续搜索出口。',
    date: '2026-10-02',
    readingTime: '7 分钟',
    tags: ['搜索', 'SEO', 'OpenSearch'],
    image: '/images/note-search.jpg',
    imageAlt: '图书馆里的木质书架',
    sections: [
      {
        heading: '搜索页应该是一张可索引的内容页',
        paragraphs: [
          '很多站点的搜索结果只在客户端弹出，外部系统无法发现查询页。这里把查询参数保留在 /search?q= 中，由服务端返回标题、摘要和匹配文章链接。',
          '同时提供 OpenSearch 描述文件，浏览器可以把本站加入搜索提供者。每篇文章输出关键词与 BlogPosting 数据，站点地图列出全部公开页面，RSS 则给内容聚合器一个稳定入口。',
        ],
      },
      {
        heading: '站外搜索是补充而不是替代',
        paragraphs: [
          '站内搜索解决已知内容的定位，站外搜索帮助用户继续寻找背景资料。搜索页因此保留百度、必应和 Google 的继续搜索链接，并用当前关键词自动带入查询。',
          '这条路径不应打断页面语义和隐私边界。只有用户点击时才会离开站点，搜索词也不会在页面加载时自动发送给第三方。',
        ],
      },
    ],
  },
];

export const postBySlug = (slug: string) => posts.find((post) => post.slug === slug);

export function searchPosts(query: string) {
  const keyword = query.trim().toLocaleLowerCase('zh-CN');
  if (!keyword) {
    return [];
  }

  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.excerpt,
      post.tags.join(' '),
      post.sections.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
        ...(section.list ?? []),
      ]).join(' '),
    ]
      .join(' ')
      .toLocaleLowerCase('zh-CN');

    return haystack.includes(keyword);
  });
}
