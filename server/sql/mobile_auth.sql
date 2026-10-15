USE mysqldb;

SET NAMES utf8mb4;

SET @has_password_hash = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'customer_users'
    AND column_name = 'password_hash'
);
SET @sql = IF(
  @has_password_hash = 0,
  'ALTER TABLE customer_users ADD COLUMN password_hash VARCHAR(255) NULL COMMENT ''移动端登录密码bcrypt哈希'' AFTER phone',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS customer_auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '移动端登录状态ID',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'C端用户ID',
  access_token_hash CHAR(64) NOT NULL COMMENT 'accessToken SHA-256 哈希',
  refresh_token_hash CHAR(64) NOT NULL COMMENT 'refreshToken SHA-256 哈希',
  access_expires_at DATETIME(6) NOT NULL COMMENT 'accessToken 过期时间',
  refresh_expires_at DATETIME(6) NOT NULL COMMENT 'refreshToken 过期时间',
  last_used_at DATETIME(6) NULL COMMENT '最近校验时间',
  revoked_at DATETIME(6) NULL COMMENT '注销时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_auth_access_hash (access_token_hash),
  UNIQUE KEY uk_customer_auth_refresh_hash (refresh_token_hash),
  KEY idx_customer_auth_customer_id (customer_id),
  KEY idx_customer_auth_refresh_status (refresh_expires_at, revoked_at),
  CONSTRAINT fk_customer_auth_customer_id
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '移动端用户登录状态表';

SELECT
  id,
  phone,
  nickname,
  vip_level,
  audit_status,
  enabled,
  created_at
FROM customer_users
ORDER BY id;
