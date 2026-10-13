USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ai_model_configs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模型配置ID',
  provider_code VARCHAR(50) NOT NULL COMMENT '厂商编码，例如 DEEPSEEK',
  provider_name VARCHAR(100) NOT NULL COMMENT '厂商名称',
  base_url VARCHAR(500) NOT NULL COMMENT 'OpenAI兼容接口Base URL',
  api_key VARCHAR(1000) NULL COMMENT 'API Key，可留空后人工维护',
  model_name VARCHAR(100) NOT NULL COMMENT '模型标识',
  display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0启用，1禁用',
  is_default TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认模型：1是，0否',
  max_tokens INT UNSIGNED NOT NULL DEFAULT 2048 COMMENT '最大输出Token',
  temperature DECIMAL(3, 2) NOT NULL DEFAULT 0.70 COMMENT '温度',
  timeout_ms INT UNSIGNED NOT NULL DEFAULT 60000 COMMENT '请求超时毫秒',
  extra_config JSON NULL COMMENT '扩展配置',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_model_provider_model (provider_code, model_name),
  KEY idx_ai_model_status_default (status, is_default)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI模型配置表';

INSERT INTO ai_model_configs (
  id,
  provider_code,
  provider_name,
  base_url,
  api_key,
  model_name,
  display_name,
  status,
  is_default,
  max_tokens,
  temperature,
  timeout_ms,
  extra_config
)
VALUES
  (
    1,
    'DEEPSEEK',
    'DeepSeek',
    'https://api.deepseek.com/v1',
    NULL,
    'deepseek-chat',
    'DeepSeek Chat',
    0,
    1,
    2048,
    0.70,
    60000,
    JSON_OBJECT('compatibility', 'openai')
  ),
  (
    2,
    'DEEPSEEK',
    'DeepSeek',
    'https://api.deepseek.com/v1',
    NULL,
    'deepseek-reasoner',
    'DeepSeek Reasoner',
    0,
    0,
    4096,
    0.60,
    90000,
    JSON_OBJECT('compatibility', 'openai')
  )
ON DUPLICATE KEY UPDATE
  provider_name = VALUES(provider_name),
  base_url = VALUES(base_url),
  display_name = VALUES(display_name),
  status = VALUES(status),
  max_tokens = VALUES(max_tokens),
  temperature = VALUES(temperature),
  timeout_ms = VALUES(timeout_ms),
  extra_config = VALUES(extra_config);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  admin_user_id BIGINT UNSIGNED NOT NULL COMMENT 'B端管理员ID',
  model_config_id BIGINT UNSIGNED NULL COMMENT '模型配置ID',
  title VARCHAR(200) NOT NULL COMMENT '会话标题',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  KEY idx_ai_chat_sessions_admin (admin_user_id, updated_at),
  CONSTRAINT fk_ai_chat_sessions_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_chat_sessions_model
    FOREIGN KEY (model_config_id) REFERENCES ai_model_configs (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI聊天会话表';

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  session_id BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
  role ENUM('system', 'user', 'assistant') NOT NULL COMMENT '消息角色',
  content LONGTEXT NOT NULL COMMENT '消息内容',
  attachments JSON NULL COMMENT '附件信息',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_ai_chat_messages_session (session_id, created_at),
  CONSTRAINT fk_ai_chat_messages_session
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI聊天消息表';

CREATE TABLE IF NOT EXISTS ai_usage_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用量记录ID',
  model_config_id BIGINT UNSIGNED NULL COMMENT '模型配置ID',
  provider_code VARCHAR(50) NOT NULL COMMENT '厂商编码',
  model_name VARCHAR(100) NOT NULL COMMENT '模型标识',
  scene VARCHAR(50) NOT NULL COMMENT '使用场景',
  request_id VARCHAR(100) NULL COMMENT '第三方请求ID',
  prompt_tokens INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输入Token',
  completion_tokens INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输出Token',
  total_tokens INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '总Token',
  latency_ms INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '耗时毫秒',
  status ENUM('success', 'failed') NOT NULL DEFAULT 'success' COMMENT '调用状态',
  error_message VARCHAR(1000) NULL COMMENT '错误信息',
  admin_user_id BIGINT UNSIGNED NULL COMMENT '操作管理员ID',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_ai_usage_model_created (model_config_id, created_at),
  KEY idx_ai_usage_provider_created (provider_code, created_at),
  KEY idx_ai_usage_status (status),
  CONSTRAINT fk_ai_usage_model_config
    FOREIGN KEY (model_config_id) REFERENCES ai_model_configs (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI调用用量记录表';

CREATE TABLE IF NOT EXISTS ai_quota_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '额度账户ID',
  provider_code VARCHAR(50) NOT NULL COMMENT '厂商编码',
  quota_limit DECIMAL(14, 2) NOT NULL DEFAULT 0 COMMENT '额度上限，0表示不限',
  used_amount DECIMAL(14, 2) NOT NULL DEFAULT 0 COMMENT '已使用额度',
  currency VARCHAR(10) NOT NULL DEFAULT 'TOKEN' COMMENT '额度单位',
  refresh_strategy ENUM('manual', 'daily', 'monthly') NOT NULL DEFAULT 'manual'
    COMMENT '刷新策略',
  last_refreshed_at DATETIME(6) NULL COMMENT '最近刷新时间',
  next_refresh_at DATETIME(6) NULL COMMENT '下次刷新时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_quota_provider (provider_code)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI额度账户表';

INSERT INTO ai_quota_accounts (
  id,
  provider_code,
  quota_limit,
  used_amount,
  currency,
  refresh_strategy
)
VALUES
  (1, 'DEEPSEEK', 0.00, 0.00, 'TOKEN', 'manual')
ON DUPLICATE KEY UPDATE
  quota_limit = VALUES(quota_limit),
  currency = VALUES(currency),
  refresh_strategy = VALUES(refresh_strategy);

SELECT
  id,
  provider_code,
  provider_name,
  base_url,
  model_name,
  display_name,
  status,
  is_default
FROM ai_model_configs
ORDER BY id;

SELECT
  id,
  provider_code,
  quota_limit,
  used_amount,
  currency,
  refresh_strategy,
  last_refreshed_at,
  next_refresh_at
FROM ai_quota_accounts
ORDER BY id;
