USE mysqldb;

SET NAMES utf8mb4;

SET @has_title = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND column_name = 'title'
);
SET @sql = IF(
  @has_title = 0,
  'ALTER TABLE forum_dynamics ADD COLUMN title VARCHAR(200) NULL COMMENT ''动态标题'' AFTER type_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO forum_dynamics (
  id,
  customer_id,
  type_id,
  title,
  content,
  media,
  topic,
  like_count,
  comment_count,
  favorite_count,
  share_count,
  pinned,
  audit_status,
  enabled,
  created_at
)
WITH RECURSIVE seq(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1
  FROM seq
  WHERE n < 50
)
SELECT
  CONCAT('D-', 7000 + n),
  8,
  1 + MOD(n - 1, 5),
  CONCAT('虚拟数据', n),
  CONCAT('这是第 ', n, ' 条虚拟动态数据，用于列表分页、详情展示和交互联调测试。'),
  JSON_ARRAY(
    JSON_OBJECT(
      'id', CONCAT('M-', 7000 + n, '-1'),
      'kind', 'album',
      'title', '虚拟素材1',
      'url', '/local-files/image/2026-10-16/images/OIP-C.webp',
      'seed', 7000 + n * 10 + 1,
      'size', 14290
    ),
    JSON_OBJECT(
      'id', CONCAT('M-', 7000 + n, '-2'),
      'kind', 'album',
      'title', '虚拟素材2',
      'url', '/local-files/image/2026-10-16/images/OIP-C%20(1).webp',
      'seed', 7000 + n * 10 + 2,
      'size', 12324
    ),
    JSON_OBJECT(
      'id', CONCAT('M-', 7000 + n, '-3'),
      'kind', 'album',
      'title', '虚拟素材3',
      'url', '/local-files/image/2026-10-16/images/OIP-C%20(2).webp',
      'seed', 7000 + n * 10 + 3,
      'size', 9592
    )
  ),
  '虚拟数据',
  0,
  0,
  0,
  0,
  0,
  'approved',
  1,
  DATE_SUB(NOW(6), INTERVAL n MINUTE)
FROM seq
ON DUPLICATE KEY UPDATE
  customer_id = VALUES(customer_id),
  type_id = VALUES(type_id),
  title = VALUES(title),
  content = VALUES(content),
  media = VALUES(media),
  topic = VALUES(topic),
  audit_status = VALUES(audit_status),
  enabled = VALUES(enabled),
  created_at = VALUES(created_at);

SELECT
  COUNT(*) AS virtual_dynamic_count,
  MIN(title) AS first_title,
  MAX(title) AS last_title,
  MIN(JSON_LENGTH(media)) AS min_media_count,
  MAX(JSON_LENGTH(media)) AS max_media_count
FROM forum_dynamics
WHERE id LIKE 'D-70%';
