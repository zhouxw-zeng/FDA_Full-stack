# 相册 / 视频论坛管理后台

Vue3 + TypeScript + Pinia 实现的社区运营后台，覆盖登录鉴权、路由级权限、内容审批、商业化管理与行为分析。

## 技术选型

| 方向 | 方案 |
| --- | --- |
| 构建 | Webpack 5 + webpack-dev-server |
| 框架 | Vue 3（全部使用 `<script setup>` + Composition API） |
| 语言 | TypeScript（`strict`，模板同样参与类型检查） |
| 状态管理 | Pinia（user / permission / app 三个 store） |
| 路由 | Vue Router，静态路由 + 后端下发路由树动态挂载 |
| UI | Element Plus（基础控件）+ 自研通用组件 |
| 样式 | SCSS + CSS 变量主题令牌，支持浅色 / 深色 |
| 请求 | axios 封装（Bearer 注入 + refreshToken 自动续期） |
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

开发模式下 dev server 会自动拉起 `../server` 的 NestJS（`BackendDevServerPlugin`），
并清理上次残留的前后端进程。若后端已在别处运行，用 `BACKEND_AUTOSTART=false` 跳过。
后端依赖 MySQL，连接配置见 `server/.env`。

### 演示账号

| 账号 | 密码 | 角色 | 可见菜单 |
| --- | --- | --- | --- |
| `admin` | `123456` | 超级管理员 | 全部页面（routeIdGroup 1–13） |
| `user` | `123456` | 普通用户 | 仅个人信息（routeIdGroup 13） |

登录页提供一键填充按钮，用这两个账号可以直观看出菜单与 403 的差异。

## 功能范围

- 登录 / 退出：真实调用后端接口，`accessToken` + `refreshToken` 持久化，accessToken 过期静默续期
- 路由权限：后端下发路由树 + 角色 `routeIdGroup` 过滤后动态生成；越权访问落到 403，路径不存在落到 404
- 个人信息：资料编辑、密码修改（走 `PUT /users`），均带表单校验
- 论坛信息审批：待审动态队列，条件查询、批量通过、单条通过 / 驳回、详情抽屉含变更日志
- 论坛动态：全量列表、真实互动数据、下架 / 重新上架、单条与批量删除、变更日志留痕
- C 端用户审批：按审核状态 / VIP 等级 / 启停筛选，资料审批与账号启停
- 广告推广管理：投放计划增删改、对接方类型、预算消耗进度、启停投放状态
- 用户行为分析：活跃趋势、行为漏斗、设备 / 地域 / 时段分布（支持 7 / 14 / 30 天切换）
- 动态预览：直接读取真实动态与动态类型，支持素材大图预览
- AI 模型管理：接入信息与生成参数维护、关联 Skills、启用与默认模型切换
- Skills 管理：可直接上传 `.md` 文件，也可填写技能名称 / 描述 / 指令生成模板后保存；支持查看、下载与替换文件

## 目录结构

```
src
├── api          # 接口层，按领域拆分，统一走 request.ts
├── components   # 通用组件（表格 / 搜索 / 图表 / 审批 / 媒体预览等）
├── composables  # useTable / useConfirm / useChartTokens
├── constants    # 枚举文案与下拉选项
├── layout       # 侧边栏、顶栏、面包屑、内容区
├── mock         # 仅兜底后端尚未实现的业务接口
├── router       # 固定路由、守卫、动态路由构建、组件注册表
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

## 登录与动态路由

一次完整登录的链路：

1. `POST /api/auth/login` 返回 `accessToken`、`refreshToken`、有效期与用户信息（含 `roleId`、`roleName`、`routeIdGroup`）
2. 两个 token 写入 `localStorage`；请求拦截器为每个请求注入 `Authorization: Bearer <accessToken>`
3. accessToken 过期（401）时，响应拦截器用 refreshToken 静默换新令牌并重放原请求；并发的 401 共用同一个刷新请求，只有刷新失败才清空登录态并跳回登录页
4. `GET /api/routes/tree` 拉取全量路由树，按用户的 `routeIdGroup` 过滤后生成前端路由与侧边栏菜单
5. 跳转到拦截前的地址，或该角色的第一个可访问菜单

| 位置 | 作用 |
| --- | --- |
| `src/api/request.ts` | Bearer 注入、401 自动续期与重放、统一错误提示 |
| `src/stores/user.ts` | token 与用户信息持久化、登录 / 注销 / 资料与密码更新 |
| `src/stores/permission.ts` | 拉取路由树并按 routeIdGroup 生成路由 |
| `src/router/dynamic.ts` | 路由树 → vue-router 路由与菜单（目录节点挂布局，菜单节点挂页面） |
| `src/router/view-registry.ts` | 后端 `componentPath` → 页面组件，保持路由级懒加载 |
| `src/constants/icons.ts` | 后端图标名 → Element Plus 图标组件 |

动态路由统一以 `dyn:` 前缀命名，注销时按前缀移除，避免切换账号后残留上一个账号的权限。

### 后端接口现状

| 模块 | 状态 |
| --- | --- |
| `auth` | 已对接：登录、刷新、注销、当前用户信息 |
| `routes` | 已对接：`/routes/tree` 驱动动态路由 |
| `users` | 部分对接：个人资料与改密走 `PUT /users` |
| `forum` | 已对接：动态列表 / 审批 / 上下架 / 删除 / 动态类型 / 变更日志 |
| `customers` | 已对接：列表 / 详情 / 资料审批 / 启停 |
| `ads` | 已对接：投放计划增删改、状态流转、对接方类型 |
| `ai` | 已对接：模型配置、Skills（multipart 上传 md）、动态类型级别的技能库 |
| `roles` | 后端已实现，前端暂无页面 |
| 用户行为分析 | 后端未提供统计接口，仍由 `src/mock` 兜底 |

`USE_BUSINESS_MOCK` 目前只影响「用户行为分析」这一个页面（开发默认开启、生产关闭）。

约定的响应结构：

```ts
interface ApiResponse<T> {
  code: number; // 0 表示成功
  message: string;
  data: T;
}
```

业务错误码由 `request.ts` 统一提示，单个请求可用 `silent: true` 关闭提示。

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

动态素材由后端 `forum_dynamics.media` 返回，其中 `seed` 用于生成确定性缩略图（真实对象存储尚未接入），保证列表、预览与详情展示的是同一张素材。接入 CDN 地址后，把 `MediaThumb` 的渲染换成 `<img>` / `<video>` 即可。
