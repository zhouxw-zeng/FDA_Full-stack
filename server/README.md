# NestJS API

## 1. 数据库

当前项目使用 MySQL 8.0 的 `mysqldb` 数据库，主要表如下：

- `admin_roles`: 后台角色表
- `admin_users`: 后台用户表
- `auth_tokens`: accessToken / refreshToken 登录状态表

表结构 SQL：

- `sql/admin_users.sql`
- `sql/auth_tokens.sql`

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

## 3. Token 验证

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

## 4. 用户管理接口

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

## 5. 角色管理接口

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

## 6. 路由管理接口

所有接口都需要 Bearer accessToken。

| 方法 | 地址 | 说明 |
| --- | --- | --- |
| POST | `/api/routes` | 创建路由 |
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

## 7. Nginx

Windows 版 Nginx 示例见 `deploy/nginx.conf.example`。开发阶段可以直接使用 NestJS 和 Vite 的开发服务器，不需要先配置 Nginx。
