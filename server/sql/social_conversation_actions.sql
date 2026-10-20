USE mysqldb;

SET NAMES utf8mb4;

SET @has_pinned_by_a = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_conversations'
    AND column_name = 'pinned_by_a'
);
SET @sql = IF(
  @has_pinned_by_a = 0,
  'ALTER TABLE customer_conversations ADD COLUMN pinned_by_a TINYINT NOT NULL DEFAULT 0 COMMENT ''A用户是否置顶'' AFTER last_message_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_pinned_by_b = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_conversations'
    AND column_name = 'pinned_by_b'
);
SET @sql = IF(
  @has_pinned_by_b = 0,
  'ALTER TABLE customer_conversations ADD COLUMN pinned_by_b TINYINT NOT NULL DEFAULT 0 COMMENT ''B用户是否置顶'' AFTER pinned_by_a',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_deleted_by_a = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_conversations'
    AND column_name = 'deleted_by_a'
);
SET @sql = IF(
  @has_deleted_by_a = 0,
  'ALTER TABLE customer_conversations ADD COLUMN deleted_by_a TINYINT NOT NULL DEFAULT 0 COMMENT ''A用户是否隐藏会话'' AFTER pinned_by_b',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_deleted_by_b = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_conversations'
    AND column_name = 'deleted_by_b'
);
SET @sql = IF(
  @has_deleted_by_b = 0,
  'ALTER TABLE customer_conversations ADD COLUMN deleted_by_b TINYINT NOT NULL DEFAULT 0 COMMENT ''B用户是否隐藏会话'' AFTER deleted_by_a',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT
  column_name,
  column_default,
  column_comment
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'customer_conversations'
  AND column_name IN ('pinned_by_a', 'pinned_by_b', 'deleted_by_a', 'deleted_by_b')
ORDER BY ordinal_position;
