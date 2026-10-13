# 全栈 FDE 学习工程

一个仓库里放着两个互相独立的工程，根目录只负责统一启动指令。

| 目录 | 说明 | 构建 / 运行 |
| --- | --- | --- |
| `admin/` | 前端管理后台（相册 / 视频论坛） | Vue 3 + TypeScript + Pinia + Element Plus，Webpack 5 |
| `server/` | 后端 API | NestJS + TypeORM + MySQL，npm 管理 |

## 前置条件

- Node.js >= 20
- 前端用 pnpm，后端用 npm
- 后端需要本地 MySQL 8.0，连接配置见 `server/.env` 与 `server/README.md`

## 一次性安装依赖

```powershell
pnpm -C admin install        # 前端依赖
npm --prefix server install  # 后端依赖（若尚未安装）
```

## 启动

```powershell
# 一条命令启动 Webpack 和 NestJS，Ctrl+C 一起退出
pnpm run dev

# 也可以只启动后端
pnpm run dev:server  # 后端：NestJS → http://localhost:3000/api
```

几点说明：

- `pnpm run dev` 会先由 Webpack 检查 `5173` 和 `3000` 端口，若旧服务仍占用端口会先结束旧进程，再启动 Webpack 和 NestJS
- 后端由 `admin/webpack.config.cjs` 中的 `BackendDevServerPlugin` 启动，根目录脚本不再单独启动后端
- 前端默认使用本地 mock；演示账号 `admin` / `forum` / `ads`，密码 `123456`
- 前端要连真实后端时，把 `admin/.env.development` 里的 `USE_MOCK` 改成 `false`
- 后端需要 MySQL 就绪；数据库没配好时 `dev:server` 会启动失败，此时只跑 `dev:admin` 即可

## 构建与检查

```powershell
npm run build:admin      # webpack 生产构建 → admin/dist
npm run build:server     # nest build        → server/dist
npm run typecheck:admin  # vue-tsc 类型检查
npm run lint:admin       # ESLint 检查
npm run smoke:admin      # 端到端冒烟（需先启动 dev:admin）
```

前端构建配置在 `admin/webpack.config.cjs`，代理与端口在 `admin/.env` 中维护。
