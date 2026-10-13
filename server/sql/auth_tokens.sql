USE mysqldb;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '登录状态记录ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  access_token_hash CHAR(64) NOT NULL COMMENT 'accessToken SHA-256 哈希',
  refresh_token_hash CHAR(64) NOT NULL COMMENT 'refreshToken SHA-256 哈希',
  access_expires_at DATETIME(6) NOT NULL COMMENT 'accessToken 过期时间',
  refresh_expires_at DATETIME(6) NOT NULL COMMENT 'refreshToken 过期时间',
  last_used_at DATETIME(6) NULL COMMENT '最近校验时间',
  revoked_at DATETIME(6) NULL COMMENT '注销时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '编辑时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_auth_tokens_access_hash (access_token_hash),
  UNIQUE KEY uk_auth_tokens_refresh_hash (refresh_token_hash),
  KEY idx_auth_tokens_user_id (user_id),
  KEY idx_auth_tokens_refresh_status (refresh_expires_at, revoked_at),
  CONSTRAINT fk_auth_tokens_user_id
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '后台用户登录状态表';
