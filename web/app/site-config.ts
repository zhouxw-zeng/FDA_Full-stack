export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001';

export const siteConfig = {
  name: '家庭动态小助手',
  shortName: '家庭动态',
  title: '家庭动态小助手 - 全栈家庭社区与 AI 创作',
  description:
    '一个完整可部署的家庭社区项目，包含移动端动态、社交互动、私信、AI 创作、运营后台与 NestJS API。',
  url: siteUrl,
  locale: 'zh_CN',
  keywords: [
    '家庭社区',
    '家庭动态',
    '全栈项目',
    'Vue 3',
    'Vite 4',
    'Next.js',
    'NestJS',
    'AI 创作',
    '内容审核',
    '服务端渲染',
  ],
  author: {
    name: '家庭动态小助手项目组',
    role: '全栈产品与工程',
  },
};
