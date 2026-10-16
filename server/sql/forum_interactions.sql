USE mysqldb;

SET NAMES utf8mb4;

SET @has_favorite_count = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND column_name = 'favorite_count'
);
SET @sql = IF(
  @has_favorite_count = 0,
  'ALTER TABLE forum_dynamics ADD COLUMN favorite_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT ''收藏数'' AFTER comment_count',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS forum_dynamic_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dynamic_id VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_dynamic_likes_user (dynamic_id, customer_id),
  KEY idx_dynamic_likes_customer (customer_id, created_at),
  CONSTRAINT fk_dynamic_likes_dynamic
    FOREIGN KEY (dynamic_id) REFERENCES forum_dynamics (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_dynamic_likes_customer
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态点赞当前状态表';

CREATE TABLE IF NOT EXISTS forum_dynamic_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dynamic_id VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_dynamic_favorites_user (dynamic_id, customer_id),
  KEY idx_dynamic_favorites_customer (customer_id, created_at),
  CONSTRAINT fk_dynamic_favorites_dynamic
    FOREIGN KEY (dynamic_id) REFERENCES forum_dynamics (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_dynamic_favorites_customer
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态收藏当前状态表';

CREATE TABLE IF NOT EXISTS forum_dynamic_share_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dynamic_id VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  channel VARCHAR(50) NULL,
  request_id VARCHAR(100) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_dynamic_shares_request (request_id),
  KEY idx_dynamic_shares_dynamic (dynamic_id, created_at),
  KEY idx_dynamic_shares_customer (customer_id, created_at),
  CONSTRAINT fk_dynamic_shares_dynamic
    FOREIGN KEY (dynamic_id) REFERENCES forum_dynamics (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_dynamic_shares_customer
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态分享事件表';

CREATE TABLE IF NOT EXISTS forum_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dynamic_id VARCHAR(32) NOT NULL,
  root_id BIGINT UNSIGNED NULL,
  parent_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  reply_to_customer_id BIGINT UNSIGNED NULL,
  content TEXT NOT NULL,
  audit_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  reply_count INT UNSIGNED NOT NULL DEFAULT 0,
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_comments_dynamic (dynamic_id, root_id, created_at, id),
  KEY idx_comments_parent (parent_id, created_at, id),
  KEY idx_comments_customer (customer_id, created_at),
  CONSTRAINT fk_comments_dynamic
    FOREIGN KEY (dynamic_id) REFERENCES forum_dynamics (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_customer
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_reply_to
    FOREIGN KEY (reply_to_customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态评论表';

CREATE TABLE IF NOT EXISTS forum_interaction_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dynamic_id VARCHAR(32) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  action ENUM(
    'like',
    'unlike',
    'favorite',
    'unfavorite',
    'share',
    'comment',
    'delete_comment'
  ) NOT NULL,
  target_id VARCHAR(64) NULL,
  request_id VARCHAR(100) NULL,
  metadata JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_interaction_events_dynamic (dynamic_id, created_at),
  KEY idx_interaction_events_customer (customer_id, created_at),
  KEY idx_interaction_events_action (action, created_at)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态互动事件流水表';

CREATE TABLE IF NOT EXISTS forum_activity_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  type ENUM('dynamic_like', 'dynamic_comment', 'comment_reply') NOT NULL,
  dynamic_id VARCHAR(32) NOT NULL,
  target_id VARCHAR(64) NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  withdrawn_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_activity_notification (
    recipient_id,
    actor_id,
    type,
    dynamic_id,
    target_id
  ),
  KEY idx_activity_recipient (recipient_id, is_read, created_at),
  KEY idx_activity_dynamic (dynamic_id, created_at)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '动态互动作者通知表';

SELECT
  id,
  favorite_count,
  like_count,
  comment_count,
  share_count
FROM forum_dynamics
ORDER BY id;
