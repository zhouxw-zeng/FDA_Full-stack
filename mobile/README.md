# 家庭动态小助手移动端

基于 uni-app 的 Vue3 + TypeScript 多端工程，适配微信小程序、H5 与 Android App。

## 常用命令

```bash
pnpm install
pnpm dev:h5
pnpm dev:mp-weixin
pnpm dev:app
pnpm typecheck
pnpm lint
```

## 配置

- API 地址：`.env` 中的 `VITE_API_BASE_URL`，默认 `/api`，与后台保持一致。
- 本地文件地址：`.env` 中的 `VITE_FILE_BASE_URL`，用于把 `/local-files/...` 头像地址解析为可访问的完整地址。
- H5 路由前缀：`.env` 中的 `VITE_ROUTER_BASE`，默认 `/mobile/`，已同步到 `manifest.json`。
- H5 开发端口：`.env` 中的 `DEV_PORT`，默认 `5173`；端口被占用时会自动递增到下一个可用端口。
- 微信小程序 `appid`、Android 打包配置填写在 `manifest.json`。

底部导航使用 `src/static/navtab` 下的普通与 `-active` 图标，采用纯图标模式。

个人信息页支持默认头像选择、本地头像上传和基础资料编辑；头像上传通过 easycom 通用 `common-upload` 组件调用 `/mobile-files/upload`。

登录与资料链路使用移动端真实接口：

- `POST /mobile-auth/login`
- `GET /mobile-auth/profile`
- `GET /mobile-auth/user-info`
- `PUT /mobile-auth/profile`
- `GET /customers/me`

个人信息和用户信息通过 `src/utils/cache.ts` 统一缓存，退出登录时会清空认证 token 与业务缓存。

## 通用图标

图标使用本地 Lucide 子集字体，避免引入大量 PNG 导致包体积膨胀。

```vue
<app-icon name="search" :size="40" color="#b76e79" />
```

重新生成图标：

```bash
pnpm icons:build
```

图标名称定义在 `src/constants/icons.ts`，生成脚本为 `scripts/generate-icons.mjs`。
