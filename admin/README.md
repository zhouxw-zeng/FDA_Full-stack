# 相册 / 视频论坛管理后台

Vue3 + TypeScript + Pinia 实现的社区运营后台，覆盖登录鉴权、路由级权限、内容审批、商业化管理与行为分析。

## 技术选型

| 方向 | 方案 |
| --- | --- |
| 构建 | Webpack 5 + webpack-dev-server |
| 框架 | Vue 3（全部使用 `<script setup>` + Composition API） |
| 语言 | TypeScript（`strict`，模板同样参与类型检查） |
| 状态管理 | Pinia（user / permission / app 三个 store） |
| 路由 | Vue Router 4，静态路由 + 按角色动态挂载 |
| UI | Element Plus（基础控件）+ 自研通用组件 |
| 样式 | SCSS + CSS 变量主题令牌，支持浅色 / 深色 |
| 请求 | axios 封装 + axios-mock-adapter 本地数据 |
| 图表 | ECharts（按需注册）+ vue-echarts |
| 规范 | ESLint 9 flat config + Prettier |

## 快速开始

```bash
pnpm install
pnpm dev
```

默认地址：`http://localhost:5173`

本工程也可以从仓库根目录启动：`npm run dev:admin`（等价于 `pnpm -C admin dev`）。
构建配置集中在 `webpack.config.cjs`，端口与接口前缀在 `.env` 中维护。

### 演示账号

| 账号 | 密码 | 角色 | 可见菜单 |
| --- | --- | --- | --- |
| `admin` | `123456` | 超级管理员 | 全部 |
| `forum` | `123456` | 论坛运营 | 工作台、论坛管理、用户管理、动态预览 |
| `ads` | `123456` | 广告运营 | 工作台、商业化、数据分析、动态预览 |

登录页提供一键填充按钮，可直接切换角色体验权限差异。

## 功能范围

- 登录 / 退出：token 持久化、过期自动跳转、登录页角色快捷填充
- 路由权限：`meta.roles` 声明可见角色，登录后按角色过滤并动态挂载；越权访问落到 403，路径不存在落到 404
- 个人信息：资料编辑、密码修改，均带表单校验
- 论坛信息审批：条件查询、批量通过、单条通过 / 驳回、详情抽屉、素材预览
- C 端用户审批：按状态与等级筛选、通过 / 驳回 / 封禁、批量通过
- 广告推广管理：投放计划增删改、预算消耗进度、启停投放状态
- 用户行为分析：活跃趋势、行为漏斗、设备 / 地域 / 时段分布（支持 7 / 14 / 30 天切换）
- 动态预览：按 C 端样式在手机框内还原动态排版，支持素材大图预览
- 论坛动态：列表展示、置顶标记、素材预览、单条与批量删除

## 目录结构

```
src
├── api          # 接口层，按领域拆分，统一走 request.ts
├── components   # 通用组件（表格 / 搜索 / 图表 / 审批 / 媒体预览等）
├── composables  # useTable / useConfirm / useChartTokens
├── constants    # 枚举文案与下拉选项
├── layout       # 侧边栏、顶栏、面包屑、内容区
├── mock         # 本地 mock 数据与路由拦截
├── router       # 路由表、守卫、权限过滤
├── stores       # Pinia：user / permission / app
├── styles       # 设计令牌、重置样式、Element Plus 收口
├── types        # 领域类型与 router meta 扩展
├── utils        # 存储、格式化、路径工具
└── views        # 各业务页面
```

## 通用组件

页面尽量只声明数据和交互，渲染细节收敛到 `src/components`：

| 组件 | 职责 |
| --- | --- |
| `DataTable` | 泛型表格容器，列声明 + 插槽 + 分页 + 空状态 |
| `SearchPanel` | 查询条件布局与查询 / 重置动作 |
| `ChartPanel` | ECharts 容器，内置主题令牌与空状态 |
| `StatCard` | 指标卡，含趋势与色调 |
| `MediaThumb` | 确定性媒体缩略图，列表与预览保持一致 |
| `MediaPreviewDialog` | 图集 / 视频预览，支持键盘左右切换 |
| `AuditDialog` | 通过 / 驳回弹窗，驳回原因必填并提供常用原因 |
| `StatusTag` / `UserAvatar` / `EmptyState` / `PageHeader` | 状态、头像、空态、页头 |

## 对接真实后端

1. 修改 `.env.development`：`USE_MOCK=false`
2. 在 `.env` 中把 `API_BASE_URL` 指向后端地址（默认 `/api`，部署时可由网关或反向代理转发）
3. `src/api/*` 已经按领域封装好请求方法，mock 关闭后即为真实接口调用

约定的响应结构：

```ts
interface ApiResponse<T> {
  code: number; // 0 表示成功
  message: string;
  data: T;
}
```

401 会触发全局登出并跳回登录页；业务错误码由 `request.ts` 统一提示，单个请求可用 `silent: true` 关闭提示。

## 代码规范说明

阿里前端规约（f2e-spec）目前没有官方 ESLint 9 flat config 版本，因此这里把规约中可执行的核心约束（命名与声明、`curly`、`eqeqeq`、统一类型导入、组合式 API 风格、单文件块顺序）落到 `eslint.config.mjs`，格式化由 Prettier 统一负责，并用 `eslint-config-prettier` 关闭冲突规则。

```bash
pnpm lint         # 规则检查
pnpm format       # 格式化
pnpm typecheck    # 类型检查
pnpm smoke        # 端到端冒烟（需先 pnpm dev）
pnpm verify       # typecheck + lint + build
```

`pnpm smoke` 用本机已安装的 Chrome / Edge（通过 `playwright-core` 驱动，不下载浏览器）
走一遍登录、逐页渲染、深色主题和 403 路由权限，截图输出到 `.smoke/`。
可用 `CHROME_PATH` 指定浏览器路径，用 `SMOKE_BASE_URL` 指定目标地址。

## 关于媒体素材

真实项目中媒体地址来自后端；当前 mock 只返回 `seed`，前端据此生成确定性抽象画面，保证列表、预览与详情展示的是同一张素材。接入真实数据后，把 `MediaThumb` 的渲染替换成 `<img>` / `<video>` 即可。
