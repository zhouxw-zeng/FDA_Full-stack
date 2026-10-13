USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ad_partner_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '对接方类型ID',
  type_name VARCHAR(100) NOT NULL COMMENT '对接方类型名称',
  type_code VARCHAR(50) NOT NULL COMMENT '对接方类型编码',
  remark VARCHAR(255) NULL COMMENT '备注',
  integration_url VARCHAR(500) NULL COMMENT '第三方广告对接文档网址',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0启用，1禁用',
  requires_key TINYINT NOT NULL DEFAULT 0 COMMENT '是否需要第三方Key：1需要，0不需要',
  key_id VARCHAR(255) NULL COMMENT '第三方Key ID，待人工补充',
  key_secret VARCHAR(500) NULL COMMENT '第三方Key Secret，待人工补充',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_ad_partner_types_name (type_name),
  UNIQUE KEY uk_ad_partner_types_code (type_code),
  KEY idx_ad_partner_types_status (status)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '广告对接方类型表';

-- 兼容已存在但缺少 integration_url 的旧表。
SET @has_integration_url = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ad_partner_types'
    AND column_name = 'integration_url'
);
SET @sql = IF(
  @has_integration_url = 0,
  'ALTER TABLE ad_partner_types ADD COLUMN integration_url VARCHAR(500) NULL COMMENT ''第三方广告对接文档网址'' AFTER remark',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO ad_partner_types (
  type_name,
  type_code,
  remark,
  integration_url,
  status,
  requires_key,
  key_id,
  key_secret
)
VALUES
  (
    '自有广告',
    'SELF',
    '平台自有广告投放',
    NULL,
    0,
    0,
    NULL,
    NULL
  ),
  (
    '巨量引擎',
    'OCEAN_ENGINE',
    '字节跳动旗下广告平台',
    'https://open.oceanengine.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    '腾讯广告',
    'TENCENT_ADS',
    '腾讯广告开放平台',
    'https://developers.e.qq.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    '百度营销',
    'BAIDU_MARKETING',
    '百度营销开放平台',
    'https://dev2.baidu.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    '快手磁力引擎',
    'KUAISHOU_MAGNETIC',
    '快手广告开放平台',
    'https://open.kuaishou.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    '小红书聚光',
    'XIAOHONGSHU_JUGUANG',
    '小红书商业化开放平台',
    'https://open.xiaohongshu.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    '阿里妈妈',
    'ALIMAMA',
    '阿里巴巴广告开放平台',
    'https://open.alimama.com/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    'Google Ads',
    'GOOGLE_ADS',
    'Google Ads API 文档',
    'https://developers.google.com/google-ads/api/docs/start',
    0,
    1,
    NULL,
    NULL
  ),
  (
    'Meta Marketing API',
    'META_MARKETING',
    'Meta 广告营销 API 文档',
    'https://developers.facebook.com/docs/marketing-apis/',
    0,
    1,
    NULL,
    NULL
  ),
  (
    'TikTok Ads API',
    'TIKTOK_ADS',
    'TikTok 广告商业 API 文档',
    'https://business-api.tiktok.com/portal/docs',
    0,
    1,
    NULL,
    NULL
  )
ON DUPLICATE KEY UPDATE
  type_name = VALUES(type_name),
  remark = VALUES(remark),
  integration_url = VALUES(integration_url),
  status = VALUES(status),
  requires_key = VALUES(requires_key);

UPDATE ad_partner_types
SET integration_url = CASE type_code
  WHEN 'OCEAN_ENGINE' THEN 'https://open.oceanengine.com/'
  WHEN 'TENCENT_ADS' THEN 'https://developers.e.qq.com/'
  WHEN 'BAIDU_MARKETING' THEN 'https://dev2.baidu.com/'
  WHEN 'KUAISHOU_MAGNETIC' THEN 'https://open.kuaishou.com/'
  WHEN 'XIAOHONGSHU_JUGUANG' THEN 'https://open.xiaohongshu.com/'
  WHEN 'ALIMAMA' THEN 'https://open.alimama.com/'
  WHEN 'GOOGLE_ADS' THEN 'https://developers.google.com/google-ads/api/docs/start'
  WHEN 'META_MARKETING' THEN 'https://developers.facebook.com/docs/marketing-apis/'
  WHEN 'TIKTOK_ADS' THEN 'https://business-api.tiktok.com/portal/docs'
  ELSE integration_url
END
WHERE integration_url IS NULL;

SELECT
  id,
  type_name,
  type_code,
  remark,
  integration_url,
  status,
  requires_key,
  key_id,
  key_secret,
  created_at,
  updated_at
FROM ad_partner_types
ORDER BY id;
