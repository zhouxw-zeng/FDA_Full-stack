# 广告推广对接方案

> 适用范围：本仓库 `admin/`（Vue3 管理后台）+ `server/`（NestJS API）
> 现状：广告模块只有前端页面与 mock（`admin/src/views/advertising/list/index.vue`、`admin/src/api/ad.ts`、`admin/src/mock/index.ts`），后端尚未实现。
> 目标：把「广告推广管理」接成可审核、可投放、可计费、可对账的闭环，并预留第三方广告平台对接能力。

## 一、目标与范围

### 1.1 目标

1. 管理后台可维护广告主、投放计划、素材、预算与周期，并支持审核与启停。
2. C 端有稳定的取量接口（serve）与曝光 / 点击 / 转化上报链路。
3. 预算与计费可控，支持超投保护、阈值告警、自动暂停。
4. 数据可汇总到日维度，后台列表与看板读取聚合结果，不直接扫明细。
5. 预留统一适配层，可按同一套接口接入巨量引擎、腾讯广告、百度营销、AdMob 等平台。

### 1.2 范围

- 纳入：广告主 / 计划 / 素材 CRUD、审核、投放决策、事件上报、计费、日汇总、第三方同步与对账。
- 暂不纳入（按需追加）：DSP 实时竞价（RTB）、程序化直连、复杂人群包售卖、跨端归因模型。

### 1.3 前置假设

- 计费方式以后端配置为准，建议先支持 `CPM`（千次曝光）与 `CPC`（点击），其余 `CPT` / `CPD` 作为枚举预留。
- C 端由本仓库之外的 App / Web 接入，本文给出接口契约，不负责 C 端实现。
- 需要 Redis 用于投放频控、去重与预算预扣；若当前环境没有 Redis，阶段一可先用 MySQL 幂等 + 定时任务降级，阶段二补 Redis。

## 二、现状盘点与差距

| 维度 | 现状 | 差距 |
| --- | --- | --- |
| 管理后台页面 | 广告列表、新建 / 编辑、启停、删除已实现（走 mock） | 无素材管理、无审核、无报表详情 |
| 前端接口封装 | `admin/src/api/ad.ts` 已定义 CRUD 与状态接口 | 后端无对应 controller，开发环境靠 mock |
| 数据模型 | 前端 `AdCampaign` 有 12 个字段，含展示用的 `seed` | `seed` 只用于前端占位，后端模型不应落库 |
| 后端 | 无 `ads` 模块、无 SQL 表、无定时任务 | 需从零补齐 entity / dto / service / controller / sql |
| 投放链路 | 无 | 缺 serve 决策、曝光点击上报、计费与汇总 |
| 第三方 | 无 | 缺 OAuth、素材与计划同步、报表拉取、转化回传 |

### 2.1 前端字段到后端模型的映射

| 前端字段 | 后端字段 | 说明 |
| --- | --- | --- |
| `id` | `campaign_no` | 对外编号，形如 `A-7001`，与自增主键分开 |
| `name` | `name` | 计划名称 |
| `advertiser` | `advertiser_id` + 关联名 | 前端展示名由关联查询返回 |
| `placement` | `placement` | `feed` / `banner` / `video_pre` / `splash` |
| `status` | `status` | `draft` / `running` / `paused` / `ended`，新增 `rejected` |
| `budget` | `budget_total` | 计划总预算 |
| `spent` | `spent_total` | 已消耗，来自计费汇总 |
| `impressions` | `impressions` | 曝光累计，来自日汇总 |
| `clicks` | `clicks` | 点击累计，来自日汇总 |
| `startAt` / `endAt` | `start_at` / `end_at` | 投放周期 |
| `seed` | 不落库 | 仅前端占位纹理使用 |

## 三、总体架构

```
                         ┌────────────────────────────┐
   管理后台 admin ──────▶ │  /api/ads/**  管理接口      │
                         │  计划 / 素材 / 审核 / 报表   │
                         └──────────────┬─────────────┘
                                        │
                          ┌─────────────▼─────────────┐
   第三方平台 ◀──同步/回传──│   ads 模块（NestJS）        │
   巨量/腾讯/百度/AdMob     │   计划·素材·预算·计费·对账   │
                          └─────────────┬─────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
┌───────▼────────┐            ┌─────────▼─────────┐            ┌────────▼────────┐
│ /ad-serve      │            │ /ad-events        │            │ 定时任务         │
│ 取量决策        │            │ 曝光/点击/转化上报 │            │ 汇总·扣费·对账   │
└───────┬────────┘            └─────────┬─────────┘            └────────┬────────┘
        │                               │                               │
        └───────────────┬───────────────┴───────────────┬───────────────┘
                        │                               │
                 ┌──────▼──────┐                 ┌──────▼──────┐
                 │   MySQL     │                 │   Redis     │
                 │ 明细+日汇总  │                 │ 去重·频控·预算│
                 └─────────────┘                 └─────────────┘
```

### 3.1 两条对接线

- **自有广告位直投**：本站 / App 内广告位，由本仓库 serve 接口出量，事件上报后本地计费。优先级最高。
- **第三方平台对接**：把第三方作为广告主来源或流量变现方，负责计划同步、素材送审、报表拉取与转化回传。按平台逐个接入。

## 四、数据模型设计

建表 SQL 放在 `server/sql/`，与现有 `customers` / `forum` 表的风格保持一致：`bigint unsigned` 主键、蛇形字段、`datetime(6)` 时间、`utf8mb4`。

### 4.1 广告主 `ad_advertisers`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint unsigned PK | 自增主键 |
| `name` | varchar(100) unique | 广告主名称 |
| `industry` | varchar(50) | 行业 |
| `contact_name` / `contact_phone` / `contact_email` | varchar | 联系人信息 |
| `qualification_url` | varchar(500) | 营业执照等资质 |
| `status` | tinyint default 1 | 1 启用 / 0 停用 |
| `created_at` / `updated_at` | datetime(6) | 时间戳 |

### 4.2 投放计划 `ad_campaigns`

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint unsigned PK | 自增主键 |
| `campaign_no` | varchar(32) unique | 对外编号，如 `A-7001` |
| `name` | varchar(100) | 计划名称 |
| `advertiser_id` | bigint unsigned | 关联广告主 |
| `placement` | enum | `feed` / `banner` / `video_pre` / `splash` |
| `status` | enum | `draft` / `running` / `paused` / `ended` / `rejected` |
| `billing_type` | enum | `cpm` / `cpc` / `cpt` / `cpd` |
| `bid_price` | decimal(10,2) | 出价（CPM 为千次曝光价，CPC 为单次点击价） |
| `budget_total` | decimal(12,2) | 总预算 |
| `budget_daily` | decimal(12,2) null | 日预算，可空 |
| `spent_total` | decimal(12,2) default 0 | 已消耗 |
| `impressions` / `clicks` | bigint default 0 | 累计投放数据 |
| `start_at` / `end_at` | datetime(6) | 投放周期 |
| `targeting` | json null | 地域 / 设备 / 时段 / 人群定向 |
| `audit_status` | enum | `pending` / `approved` / `rejected` |
| `audit_remark` | varchar(255) null | 审核备注 |
| `audited_by` / `audited_at` | bigint / datetime null | 审核人、审核时间 |
| `created_by` / `updated_by` | bigint | 操作人 |
| `created_at` / `updated_at` / `deleted_at` | datetime(6) | 时间戳，删除用软删 |

索引：`idx_status_placement_period (status, placement, start_at, end_at)` 支撑 serve 决策；`idx_advertiser (advertiser_id)`。

### 4.3 素材 `ad_creatives`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint unsigned PK | 自增主键 |
| `campaign_id` | bigint unsigned | 关联计划 |
| `type` | enum | `image` / `video` / `html` |
| `title` | varchar(100) | 素材标题 |
| `asset_url` | varchar(500) | 素材地址 |
| `landing_url` | varchar(500) | 落地页 |
| `asset_spec` | varchar(20) | 规格，如 `1080x1920` |
| `weight` | int default 1 | 同计划多素材的权重 |
| `status` | enum | `pending` / `approved` / `rejected` / `offline` |
| `audit_remark` | varchar(255) null | 审核备注 |
| `created_at` / `updated_at` | datetime(6) | 时间戳 |

### 4.4 事件明细 `ad_events`（幂等，可分区）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `event_id` | varchar(64) PK | 客户端生成，服务端幂等 |
| `campaign_id` / `creative_id` | bigint unsigned | 归属 |
| `placement` | enum | 广告位 |
| `event_type` | enum | `impression` / `click` / `conversion` |
| `device_id` | varchar(64) | 设备标识 |
| `user_id` | bigint unsigned null | 登录用户 |
| `occurred_at` | datetime(6) | 客户端事件时间 |
| `server_at` | datetime(6) | 服务端接收时间 |
| `ip` / `ua` | varchar | 风控字段 |
| `cost` | decimal(10,4) | 该事件计费金额 |

索引：`(campaign_id, occurred_at)`、`(event_type, server_at)`。数据量上来后按 `server_at` 月分区，历史明细冷存。

### 4.5 日汇总 `ad_stats_daily`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `stat_date` | date | 统计日 |
| `campaign_id` / `creative_id` | bigint unsigned | 维度 |
| `placement` | enum | 广告位 |
| `impressions` / `clicks` / `conversions` | bigint | 指标 |
| `spent` | decimal(12,2) | 消耗 |

唯一键 `(stat_date, campaign_id, creative_id, placement)`，后台列表与看板只读这张表。

### 4.6 第三方配置 `ad_networks`

| 字段 | 说明 |
| --- | --- |
| `code` | `oceanengine` / `tencent` / `baidu` / `admob` |
| `name` / `status` | 平台名与启停 |
| `app_id` / `secret_encrypted` | 应用信息，密钥必须加密存储 |
| `access_token_encrypted` / `refresh_token_encrypted` | 令牌加密存储 |
| `token_expires_at` | 过期时间，用于自动刷新 |
| `config` | json，平台差异化参数 |

配套两张表：`ad_network_mappings`（本地计划 / 素材与第三方 ID 映射）、`ad_postbacks`（转化回传记录，含 `status` / `retry_count` / `response_body`）。

### 4.7 对账 `ad_reconcile_bills`

按 `network_id + stat_date` 记录 `external_cost`（平台账单）与 `local_cost`（本地计费），计算 `diff`，标记 `matched` / `diff` / `resolved`，差异超阈值触发告警。

## 五、接口设计

### 5.1 管理接口（前缀 `/api`，需 Bearer accessToken）

与现有 `admin/src/api/ad.ts` 保持路径与分页约定（`page` / `size` / `pageSize`，返回 `{ list, total, page, size, pageSize }`）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/ads` | 分页查询，支持 `keyword` / `placement` / `status` |
| POST | `/ads` | 新建计划，默认 `draft` |
| GET | `/ads/:id` | 计划详情（含广告主、素材、汇总） |
| PUT | `/ads` | 更新，ID 从 Body 传入（沿用本仓库更新约定） |
| PUT | `/ads/status` | 启用 / 暂停 |
| PUT | `/ads/audit` | 审核计划与素材 |
| DELETE | `/ads/:id` | 软删除 |
| GET/POST/PUT/DELETE | `/ads/creatives` | 素材管理 |
| GET | `/ads/:id/stats` | 报表，`granularity=day&from&to` |
| GET/POST | `/ads/advertisers` | 广告主管理 |
| GET/POST | `/ads/networks` | 第三方平台配置 |
| POST | `/ads/networks/:id/sync` | 手动触发同步 |
| GET | `/ads/reconcile` | 对账查询 |

响应统一走现有 `ResponseInterceptor`：`{ "code": 0, "message": "ok", "data": ... }`。

### 5.2 C 端投放接口

**取量决策**

```http
POST /api/ad-serve/decision
{
  "placement": "feed",
  "userId": "10086",
  "deviceId": "d-9f3c...",
  "context": { "region": "310000", "appVersion": "1.4.0" }
}
```

返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "campaignId": "A-7001",
    "creativeId": "C-12",
    "type": "image",
    "assetUrl": "https://cdn.example.com/1.jpg",
    "landingUrl": "https://example.com/landing",
    "impressionToken": "eyJ...",
    "clickToken": "eyJ...",
    "expiresAt": "2026-10-13T12:00:30+08:00"
  }
}
```

无可用广告时返回 `data: null`，由 C 端做兜底。决策逻辑：过滤 `running` + 时间窗内 + 预算未超 + 素材 `approved` + 位次匹配 → 定向命中 → 按 `eCPM = bid_price * 预估CTR` 与权重排序。

**事件上报**

```http
POST /api/ad-events/impression
{ "events": [ { "eventId": "e-1", "impressionToken": "...", "occurredAt": 1760000000000 } ] }

GET  /api/ad-events/click?token=<clickToken>   // 服务端计费后 302 到 landingUrl
POST /api/ad-events/conversion                  // 转化事件，用于回传第三方
```

- `impressionToken` / `clickToken` 用一次性签名（JWT 或 HMAC），含 `campaignId|creativeId|deviceId|nonce|exp`。
- 曝光计费需满足可见性：素材可见面积 ≥ 50% 且持续 ≥ 1 秒才上报。
- `eventId` 幂等，重复上报直接忽略。

### 5.3 第三方回调

`GET/POST /api/ad-callbacks/:network`，按平台校验签名，落到 `ad_postbacks`，与本地事件做归因匹配。

## 六、关键流程

### 6.1 计划生命周期

```
新建(draft) → 提交审核(pending) → 审核通过(approved) → 到达 start_at 自动 running
                                                     → 手动 paused / 恢复 running
                                                     → 到达 end_at 或预算耗尽 自动 ended
                                → 审核驳回(rejected) → 修改后重新提交
```

状态流转在 `ads.service.ts` 内统一校验，禁止从 `ended` 直接跳 `running`。

### 6.2 曝光与点击计费

1. serve 返回带签名的 token。
2. 客户端播放 / 展示达到可见性阈值后批量上报曝光。
3. 服务端校验签名与过期时间 → Redis `SETNX` 去重 → 写 `ad_events` → 计费。
4. 点击走服务端 302，先计费再跳转，避免客户端篡改。
5. 计费金额：`CPM` 按 `bid_price / 1000` 每次曝光；`CPC` 按 `bid_price` 每次点击。

### 6.3 预算控制与超投保护

- 计费前用 Redis 原子操作预扣：`decr` 剩余预算，返回不足则拒投。
- 消耗达 90% 告警，达 100% 自动 `paused` 并写操作日志。
- Redis 预扣值由定时任务（每 1 分钟）落库到 `spent_total` 与 `ad_stats_daily`，避免高频写主表。
- MySQL 侧保留最终一致性校验，日终以 `ad_events` 汇总值回补，修正漂移。

### 6.4 汇总与后台展示

- 事件写入后按小时增量聚合到 `ad_stats_daily`（可用定时任务 + 唯一键 upsert）。
- `GET /ads` 列表读 `ad_campaigns` 的累计字段；报表详情读 `ad_stats_daily`。
- 看板的 `runningAds` 改为按 `status = 'running'` 实时统计，替换 mock 里的固定值。

### 6.5 第三方对接流程

1. 配置平台应用信息，走 OAuth 获取 `access_token` / `refresh_token`，加密落库。
2. 定时任务在令牌到期前刷新。
3. 本地计划 / 素材审核通过后，通过适配层推送创建或更新，回写 `ad_network_mappings`。
4. 每日拉取平台报表写入 `ad_reconcile_bills`，与本地消耗比对。
5. 转化事件通过 `ad_postbacks` 回传，失败按指数退避重试，超过次数告警。

适配层接口（`ad-networks/adapters/ad-network.adapter.ts`）：

```ts
export interface AdNetworkAdapter {
  readonly code: string;
  getAuthUrl(state: string): string;
  exchangeToken(code: string): Promise<TokenPair>;
  refreshToken(network: AdNetwork): Promise<TokenPair>;
  createCampaign(campaign: AdCampaign): Promise<string>;
  updateCampaign(campaign: AdCampaign, externalId: string): Promise<void>;
  updateStatus(externalId: string, status: AdCampaignStatus): Promise<void>;
  uploadCreative(creative: AdCreative): Promise<string>;
  fetchReport(date: string): Promise<NetworkReportRow[]>;
  postConversion(event: AdEvent): Promise<void>;
}
```

## 七、安全、合规与风控

- **素材审核**：先机器校验（尺寸、格式、广告法禁用词、落地页可达），再人工复审；审核记录留存。
- **广告标识**：C 端展示需带「广告」标识，落地页不得伪装站内内容。
- **防作弊**：设备 / IP 频控、点击 30 秒内同素材去重、异常 UA 拦截、token 防伪造、服务端校验时间窗。
- **数据合规**：设备标识最小化采集，个人信息不落原始明文，密钥与令牌加密存储，明细按留存策略清理。
- **权限**：广告开关、预算调整、第三方密钥查看等高风险操作按现有角色 / 路由权限收紧，并记录操作日志。

## 八、排期与验收

| 阶段 | 内容 | 工期 | 验收标准 |
| --- | --- | --- | --- |
| 0 准备 | 确认计费方式、广告位口径、是否接第三方、Redis 可用性 | 1-2 天 | 决策项全部拍板，广告位清单定稿 |
| 1 后端基础 | `ads` 模块、建表 SQL、CRUD、审核、前端切真实接口 | 3-5 天 | 后台增删改查与审核全链路可用，mock 可关闭 |
| 2 投放与计费 | serve 决策、曝光 / 点击上报、Redis 去重、预算控制、日汇总 | 5-7 天 | 灰度广告位可出量并正确计费，超投为 0 |
| 3 第三方对接 | 适配层、OAuth、素材送审、报表拉取、转化回传 | 每平台 3-5 天 | 单平台计划可同步、报表可对、回传成功率 ≥ 99% |
| 4 对账与灰度 | 对账任务、监控告警、灰度放量 | 3 天 | 对账差异 < 1%，灰度 10% → 50% → 100% |

## 九、风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 超投 | 预算超支 | Redis 预扣 + 阈值自动暂停 + 日终回补 |
| 事件丢失 / 重复 | 计费不准 | 客户端补报 + `event_id` 幂等 + 服务端对账修正 |
| 平台 API 变更 | 同步失败 | 适配层隔离 + 契约测试 + 失败告警与重试 |
| 素材违规 | 合规风险 | 机审 + 人审双轨，违规下架并留痕 |
| 明细表膨胀 | 查询变慢 | 日汇总 + 月分区 + 冷热分离 |
| 决策接口性能 | C 端抖动 | 本地缓存候选计划、限流、超时降级为 `no_fill` |

## 十、落地清单

后端：

- `server/sql/ad_advertisers.sql`、`ad_campaigns.sql`、`ad_creatives.sql`、`ad_events.sql`、`ad_stats_daily.sql`、`ad_networks.sql`
- `server/src/ads/ads.module.ts`、`ads.controller.ts`、`ads.service.ts`
- `server/src/ads/ad-serve.controller.ts`、`ad-events.controller.ts`、`ad-callbacks.controller.ts`
- `server/src/ads/entities/*.entity.ts`、`server/src/ads/dto/*.dto.ts`
- `server/src/ads/adapters/*.adapter.ts`、`server/src/ads/tasks/*.task.ts`
- `server/src/app.module.ts` 注册 `AdsModule`

前端：

- 扩展 `admin/src/api/ad.ts`（素材、审核、报表、广告主、第三方）
- `admin/src/types/business.ts` 补充 `AdCreative` / `AdStats` / `AdNetwork` 类型
- `admin/src/views/advertising/list/index.vue` 增加素材管理、审核入口与报表抽屉
- `admin/src/types/index.ts`、`admin/src/constants/index.ts` 同步枚举与状态文案

## 十一、待确认决策

1. 计费方式：先做 `CPM` + `CPC`，还是只做其中一种？
2. 是否本期就接第三方？若接，优先级是巨量引擎、腾讯广告、百度营销还是 AdMob？
3. C 端广告位由哪一端接入，曝光可见性标准是否按 IAB（≥ 50% 面积、≥ 1 秒）执行？
4. 归因口径：点击后 7 天 / 曝光后 1 天是否为默认窗口？
5. Redis 是否可用；不可用时是否接受阶段一用 MySQL 幂等 + 定时任务降级？
