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
