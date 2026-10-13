# NestJS API

## 1. 数据库

当前项目使用 MySQL 8.0 的 `mysqldb` 数据库，主要表如下：

- `admin_roles`: 后台角色表
- `admin_users`: 后台用户表
- `auth_tokens`: accessToken / refreshToken 登录状态表
- `admin_routes`: 后台路由表
- `customer_users`: C 端用户表
- `forum_dynamic_types`: 动态类型表
- `forum_dynamics`: 动态表
- `forum_change_logs`: 动态变更记录表

表结构 SQL：

- `sql/admin_users.sql`
- `sql/auth_tokens.sql`
- `sql/admin_routes.sql`
- `sql/customer_users.sql`
- `sql/forum_dynamics.sql`
- `sql/forum_dynamic_types.sql`
- `sql/forum_change_logs.sql`
- `sql/ad_partner_types.sql`（待确认后执行）
- `sql/ad_campaigns.sql`（待确认后执行）

本地 `server/.env` 已配置为：

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=fde_app
DB_PASSWORD=你的数据库密码
DB_DATABASE=mysqldb
DB_SYNCHRONIZE=false
DB_TIMEZONE=+08:00
```

生产环境不要开启 TypeORM 自动同步，表结构变更应通过 SQL 或 migration 管理。

## 2. 启动服务

```powershell
cd server
npm install
npm run start:dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- 健康检查: `http://localhost:3000/api/health`

所有成功响应统一为：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

## 3. 分页约定

所有扁平列表接口统一使用：

- `page`：页码，默认 `1`
- `size`：每页数量，默认 `15`，最大 `100`
- `pageSize`：兼容旧前端的别名

统一返回：

```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "size": 15,
  "pageSize": 15
}
```

## 4. Token 验证

除以下公开接口外，其余接口都必须在请求头携带 accessToken：

```http
Authorization: Bearer <accessToken>
```

公开接口：

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 账号密码登录 |
| POST | `/api/auth/refresh` | 使用 refreshToken 刷新 |
| GET | `/api/health` | 健康检查 |

登录示例：

```json
{
  "username": "admin",
  "password": "123456"
}
```

登录成功会返回 `accessToken`、`refreshToken`、有效期和当前用户信息。数据库只保存 token 的 SHA-256 哈希，刷新 token 时会立即注销旧会话记录。

注销接口：

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

## 5. 用户管理接口

所有接口都需要 Bearer accessToken。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/users` | 创建用户 |
| GET | `/api/users?page=1&pageSize=10&keyword=alice` | 分页查询用户 |
| GET | `/api/users/:id` | 查询用户详情 |
| PUT | `/api/users` | 更新用户，ID 从 Body 传入 |
| DELETE | `/api/users/:id` | 删除用户 |

创建用户示例：

```json
{
  "username": "operator",
  "email": "operator@example.com",
  "password": "ChangeMe123!",
  "nickname": "内容运营",
  "roleId": "2",
  "phone": "13800138000",
  "department": "内容运营部",
  "bio": "负责社区内容审核。",
  "status": 1
}
```

密码使用 bcrypt 哈希后写入 `password_hash`，接口响应不会返回密码或密码哈希。

更新用户请求示例：

```json
{
  "id": "2",
  "nickname": "新昵称",
  "status": 1
}
```

## 6. 角色管理接口

所有接口都需要 Bearer accessToken。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/roles` | 创建角色 |
| GET | `/api/roles?page=1&pageSize=10&keyword=运营` | 分页查询角色 |
| GET | `/api/roles/:id` | 查询角色详情 |
| PUT | `/api/roles` | 更新角色，ID 从 Body 传入 |
| DELETE | `/api/roles/:id` | 删除角色 |

角色页面权限通过 `admin_routes.route_id` 数值 ID 数组保存，例如：

```json
{
  "roleName": "内容审核员",
  "roleRemark": "负责论坛内容和用户审核",
  "routeIdGroup": [1, 3, 13]
}
```

角色已分配给用户时不能删除，接口会返回 HTTP `409`。

更新角色请求示例：

```json
{
  "id": "3",
  "roleRemark": "更新后的角色备注",
  "routeIdGroup": [1, 3, 13]
}
```

## 7. C 端用户接口

所有接口都需要 Bearer accessToken。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| GET | `/api/customers` | 分页查询 C 端用户 |
| GET | `/api/customers/:id` | 查询用户详情 |
| PUT | `/api/customers/audit` | 审批用户，ID 从 Body 传入 |
| PUT | `/api/customers/status` | 启用或禁用用户，ID 从 Body 传入 |

查询参数支持：

- `page`
- `pageSize`
- `keyword`：用户名、昵称、手机号、邮箱
- `auditStatus`：`pending`、`approved`、`rejected`
- `enabled`：`1` 启用、`0` 禁用
- `vipLevel`：`1` 到 `5`

审批示例：

```json
{
  "id": "1",
  "status": "approved",
  "remark": "资料审核通过"
}
```

启用或禁用示例：

```json
{
  "id": "1",
  "enabled": 1
}
```

审批被驳回时用户会自动禁用；只有审批状态为 `approved` 的用户才能启用。

## 8. 广告模块接口

所有接口都需要 Bearer accessToken。

广告计划接口：

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/ads` | 创建广告计划 |
| GET | `/api/ads` | 分页查询广告计划 |
| GET | `/api/ads/:id` | 查询广告计划详情 |
| PUT | `/api/ads` | 更新广告计划，ID 从 Body 传入 |
| PUT | `/api/ads/status` | 更新广告状态，ID 从 Body 传入 |
| DELETE | `/api/ads/:id` | 删除广告计划 |

广告对接方类型接口：

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/ads/partner-types` | 创建对接方类型 |
| GET | `/api/ads/partner-types` | 分页查询对接方类型 |
| GET | `/api/ads/partner-types/:id` | 查询对接方类型详情 |
| PUT | `/api/ads/partner-types` | 更新对接方类型，ID 从 Body 传入 |
| DELETE | `/api/ads/partner-types/:id` | 删除对接方类型 |

第三方对接方支持 `requiresKey`、`integrationUrl`、`keyId`、`keySecret` 字段。需要第三方 Key 的类型可以先将 Key 留空，后续人工维护。

广告 SQL 已执行：

- `sql/ad_partner_types.sql`
- `sql/ad_campaigns.sql`

已初始化对接方类型：

| 对接方 | 对接文档 |
| --- | --- |
| 巨量引擎 | `https://open.oceanengine.com/` |
| 腾讯广告 | `https://developers.e.qq.com/` |
| 百度营销 | `https://dev2.baidu.com/` |
| 快手磁力引擎 | `https://open.kuaishou.com/` |
| 小红书聚光 | `https://open.xiaohongshu.com/` |
| 阿里妈妈 | `https://open.alimama.com/` |
| Google Ads | `https://developers.google.com/google-ads/api/docs/start` |
| Meta Marketing API | `https://developers.facebook.com/docs/marketing-apis/` |
| TikTok Ads API | `https://business-api.tiktok.com/portal/docs` |

广告计划示例覆盖自有广告和上述主要第三方厂商，可直接用于查询、编辑和状态流转联调。

## 9. 动态模块接口

所有接口都需要 Bearer accessToken，路径与前端 mock 保持一致。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| GET | `/api/forum/dynamics` | 分页查询动态 |
| GET | `/api/forum/dynamics/:id` | 查询动态详情 |
| PUT | `/api/forum/dynamics` | 编辑动态并记录变更 |
| PUT | `/api/forum/dynamics/audit` | 审批动态 |
| PUT | `/api/forum/dynamics/status` | 下架或启用动态 |
| DELETE | `/api/forum/dynamics/:id` | 删除动态 |
| GET | `/api/forum/media/preview` | 查询动态媒体预览素材 |

动态查询参数：

- `page`
- `pageSize`
- `keyword`：内容、发布人昵称、动态 ID
- `topic`：话题
- `pinned`：`true` 或 `false`

动态类型管理接口：

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/forum/dynamic-types` | 创建动态类型 |
| GET | `/api/forum/dynamic-types` | 分页查询动态类型 |
| GET | `/api/forum/dynamic-types/:id` | 查询动态类型详情 |
| PUT | `/api/forum/dynamic-types` | 更新动态类型，ID 从 Body 传入 |
| DELETE | `/api/forum/dynamic-types/:id` | 删除动态类型 |

动态类型名称唯一。类型名称更新时会同步更新关联动态的 `topic`，类型仍被动态引用时不能删除。

审批动态示例：

```json
{
  "id": "D-5000",
  "status": "approved",
  "remark": "内容审核通过",
  "attachments": "https://example.com/audit.png"
}
```

下架或启用示例：

```json
{
  "id": "D-5000",
  "enabled": 0,
  "remark": "违反社区规范，执行下架",
  "attachments": "https://example.com/evidence.png"
}
```

动态编辑示例：

```json
{
  "id": "D-5000",
  "content": "更新后的动态内容",
  "typeId": 2,
  "editorType": "customer",
  "editorId": "1",
  "remark": "C 端用户编辑动态",
  "attachments": "https://example.com/source.jpg"
}
```

### 变更记录

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/forum/change-logs` | 新增变更记录 |
| GET | `/api/forum/change-logs` | 分页查询变更记录 |
| GET | `/api/forum/change-logs/:id` | 查询变更记录详情 |

记录字段：

- `targetType`：目标记录类型，默认 `forum_dynamic`
- `targetId`：动态记录 ID
- `ownerId`：动态所属 C 端用户 ID
- `editorId`：编辑者 ID
- `editorType`：`customer` 或 `admin`
- `action`：`edit`、`audit`、`offline`、`enable` 等
- `changedAt`：变更时间
- `remark`：备注
- `attachments`：附件链接文本，由前端自行解析

审批、下架、启用和编辑动态时会自动写入变更记录。

## 10. 路由管理接口

所有接口都需要 Bearer accessToken。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/routes` | 创建路由 |
| GET | `/api/routes` | 分页查询扁平路由 |
| GET | `/api/routes/tree` | 查询树形路由 |
| GET | `/api/routes/:id` | 查询路由详情 |
| PUT | `/api/routes` | 更新路由，ID 从 Body 传入 |
| DELETE | `/api/routes/:id` | 删除路由 |

更新路由请求示例：

```json
{
  "id": 3,
  "routeName": "论坛信息审批",
  "icon": "DocumentChecked",
  "routePath": "/forum/approval",
  "componentPath": "@/views/forum/approval/index.vue",
  "pid": 2,
  "status": 0,
  "routeType": 1
}
```

## 11. Nginx

Windows 版 Nginx 示例见 `deploy/nginx.conf.example`。开发阶段可以直接使用 NestJS 和 Vite 的开发服务器，不需要先配置 Nginx。
