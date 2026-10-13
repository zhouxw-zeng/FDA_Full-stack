USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '广告计划ID',
  name VARCHAR(200) NOT NULL COMMENT '广告计划名称',
  advertiser VARCHAR(100) NOT NULL COMMENT '广告主名称',
  partner_type_id BIGINT UNSIGNED NULL COMMENT '广告对接方类型ID',
  placement ENUM('feed', 'banner', 'video_pre', 'splash') NOT NULL COMMENT '投放位置',
  status ENUM('running', 'paused', 'ended', 'draft') NOT NULL DEFAULT 'draft'
    COMMENT '广告状态',
  budget DECIMAL(14, 2) NOT NULL DEFAULT 0 COMMENT '预算',
  spent DECIMAL(14, 2) NOT NULL DEFAULT 0 COMMENT '已消耗',
  impressions BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '曝光量',
  clicks BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点击量',
  start_at DATETIME(6) NOT NULL COMMENT '开始时间',
  end_at DATETIME(6) NOT NULL COMMENT '结束时间',
  seed INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '前端展示种子',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  KEY idx_ad_campaigns_partner_type_id (partner_type_id),
  KEY idx_ad_campaigns_placement (placement),
  KEY idx_ad_campaigns_status (status),
  KEY idx_ad_campaigns_time (start_at, end_at),
  CONSTRAINT fk_ad_campaigns_partner_type_id
    FOREIGN KEY (partner_type_id) REFERENCES ad_partner_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '广告投放计划表';

-- 示例数据与 ad_partner_types 的固定初始 ID 一一对应。
INSERT INTO ad_campaigns (
  id,
  name,
  advertiser,
  partner_type_id,
  placement,
  status,
  budget,
  spent,
  impressions,
  clicks,
  start_at,
  end_at,
  seed
)
VALUES
  (
    1,
    '自有广告 · 秋季器材促销',
    '星野影像器材',
    1,
    'feed',
    'running',
    80000.00,
    36500.00,
    1280000,
    18600,
    DATE_SUB(NOW(6), INTERVAL 7 DAY),
    DATE_ADD(NOW(6), INTERVAL 21 DAY),
    1001
  ),
  (
    2,
    '巨量引擎 · 短视频拉新计划',
    '云顶旅行',
    2,
    'video_pre',
    'running',
    160000.00,
    73600.00,
    2860000,
    42800,
    DATE_SUB(NOW(6), INTERVAL 5 DAY),
    DATE_ADD(NOW(6), INTERVAL 25 DAY),
    1002
  ),
  (
    3,
    '腾讯广告 · 朋友圈品牌曝光',
    '一刻咖啡',
    3,
    'banner',
    'running',
    96000.00,
    40200.00,
    1450000,
    21600,
    DATE_SUB(NOW(6), INTERVAL 10 DAY),
    DATE_ADD(NOW(6), INTERVAL 14 DAY),
    1003
  ),
  (
    4,
    '百度营销 · 搜索获客计划',
    '远山户外',
    4,
    'feed',
    'paused',
    68000.00,
    32450.00,
    860000,
    15400,
    DATE_SUB(NOW(6), INTERVAL 12 DAY),
    DATE_ADD(NOW(6), INTERVAL 18 DAY),
    1004
  ),
  (
    5,
    '快手磁力引擎 · 同城推广',
    '轻旅民宿',
    5,
    'feed',
    'running',
    52000.00,
    24800.00,
    980000,
    13200,
    DATE_SUB(NOW(6), INTERVAL 3 DAY),
    DATE_ADD(NOW(6), INTERVAL 27 DAY),
    1005
  ),
  (
    6,
    '小红书聚光 · 内容种草计划',
    '光合相机租赁',
    6,
    'banner',
    'running',
    74000.00,
    35600.00,
    1120000,
    19600,
    DATE_SUB(NOW(6), INTERVAL 4 DAY),
    DATE_ADD(NOW(6), INTERVAL 26 DAY),
    1006
  ),
  (
    7,
    '阿里妈妈 · 电商大促投放',
    '一刻咖啡',
    7,
    'banner',
    'paused',
    188000.00,
    94200.00,
    2360000,
    51600,
    DATE_SUB(NOW(6), INTERVAL 15 DAY),
    DATE_ADD(NOW(6), INTERVAL 15 DAY),
    1007
  ),
  (
    8,
    'Google Ads · 海外流量测试',
    '云顶旅行',
    8,
    'feed',
    'draft',
    240000.00,
    0.00,
    0,
    0,
    DATE_ADD(NOW(6), INTERVAL 2 DAY),
    DATE_ADD(NOW(6), INTERVAL 32 DAY),
    1008
  ),
  (
    9,
    'Meta Marketing API · 品牌出海',
    '星野影像器材',
    9,
    'video_pre',
    'draft',
    260000.00,
    0.00,
    0,
    0,
    DATE_ADD(NOW(6), INTERVAL 5 DAY),
    DATE_ADD(NOW(6), INTERVAL 35 DAY),
    1009
  ),
  (
    10,
    'TikTok Ads API · 海外短视频投放',
    '轻旅民宿',
    10,
    'video_pre',
    'draft',
    210000.00,
    0.00,
    0,
    0,
    DATE_ADD(NOW(6), INTERVAL 7 DAY),
    DATE_ADD(NOW(6), INTERVAL 37 DAY),
    1010
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  advertiser = VALUES(advertiser),
  partner_type_id = VALUES(partner_type_id),
  placement = VALUES(placement),
  status = VALUES(status),
  budget = VALUES(budget),
  spent = VALUES(spent),
  impressions = VALUES(impressions),
  clicks = VALUES(clicks),
  start_at = VALUES(start_at),
  end_at = VALUES(end_at),
  seed = VALUES(seed);

SELECT
  id,
  name,
  advertiser,
  partner_type_id,
  placement,
  status,
  budget,
  spent,
  impressions,
  clicks,
  start_at,
  end_at,
  seed
FROM ad_campaigns
ORDER BY id;
