USE mysqldb;

SET NAMES utf8mb4;

SET @has_session_customer = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_chat_sessions'
    AND column_name = 'customer_id'
);
SET @sql = IF(
  @has_session_customer = 0,
  'ALTER TABLE ai_chat_sessions ADD COLUMN customer_id BIGINT UNSIGNED NULL COMMENT ''移动端C端用户ID'' AFTER admin_user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE ai_chat_sessions
  MODIFY admin_user_id BIGINT UNSIGNED NULL COMMENT 'B端管理员ID（历史兼容）';

SET @has_session_customer_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_chat_sessions'
    AND index_name = 'idx_ai_chat_sessions_customer'
);
SET @sql = IF(
  @has_session_customer_index = 0,
  'ALTER TABLE ai_chat_sessions ADD KEY idx_ai_chat_sessions_customer (customer_id, updated_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_session_customer_fk = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'ai_chat_sessions'
    AND constraint_name = 'fk_ai_chat_sessions_customer_user'
    AND constraint_type = 'FOREIGN KEY'
);
SET @sql = IF(
  @has_session_customer_fk = 0,
  'ALTER TABLE ai_chat_sessions ADD CONSTRAINT fk_ai_chat_sessions_customer_user FOREIGN KEY (customer_id) REFERENCES customer_users (id) ON UPDATE CASCADE ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_usage_customer = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_usage_records'
    AND column_name = 'customer_id'
);
SET @sql = IF(
  @has_usage_customer = 0,
  'ALTER TABLE ai_usage_records ADD COLUMN customer_id BIGINT UNSIGNED NULL COMMENT ''移动端C端用户ID'' AFTER admin_user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_usage_customer_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_usage_records'
    AND index_name = 'idx_ai_usage_customer_created'
);
SET @sql = IF(
  @has_usage_customer_index = 0,
  'ALTER TABLE ai_usage_records ADD KEY idx_ai_usage_customer_created (customer_id, created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_usage_customer_fk = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'ai_usage_records'
    AND constraint_name = 'fk_ai_usage_customer_user'
    AND constraint_type = 'FOREIGN KEY'
);
SET @sql = IF(
  @has_usage_customer_fk = 0,
  'ALTER TABLE ai_usage_records ADD CONSTRAINT fk_ai_usage_customer_user FOREIGN KEY (customer_id) REFERENCES customer_users (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT
  table_name,
  column_name,
  is_nullable,
  column_comment
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('ai_chat_sessions', 'ai_usage_records')
  AND column_name IN ('admin_user_id', 'customer_id')
ORDER BY table_name, column_name;
