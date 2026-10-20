USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customer_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  customer_a_id BIGINT UNSIGNED NOT NULL COMMENT '较小的用户ID',
  customer_b_id BIGINT UNSIGNED NOT NULL COMMENT '较大的用户ID',
  last_message_id BIGINT UNSIGNED NULL COMMENT '最后一条消息ID',
  last_message_at DATETIME(6) NULL COMMENT '最后一条消息时间',
  pinned_by_a TINYINT NOT NULL DEFAULT 0 COMMENT 'A用户是否置顶',
  pinned_by_b TINYINT NOT NULL DEFAULT 0 COMMENT 'B用户是否置顶',
  deleted_by_a TINYINT NOT NULL DEFAULT 0 COMMENT 'A用户是否隐藏会话',
  deleted_by_b TINYINT NOT NULL DEFAULT 0 COMMENT 'B用户是否隐藏会话',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_conversation_pair (customer_a_id, customer_b_id),
  KEY idx_customer_conversation_a (customer_a_id, last_message_at),
  KEY idx_customer_conversation_b (customer_b_id, last_message_at),
  CONSTRAINT fk_customer_conversation_a
    FOREIGN KEY (customer_a_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_conversation_b
    FOREIGN KEY (customer_b_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'C端用户一对一会话表';
