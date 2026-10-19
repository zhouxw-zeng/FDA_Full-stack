USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customer_follows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关注记录ID',
  follower_id BIGINT UNSIGNED NOT NULL COMMENT '关注发起用户ID',
  following_id BIGINT UNSIGNED NOT NULL COMMENT '被关注用户ID',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '关注时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_follows_pair (follower_id, following_id),
  KEY idx_customer_follows_following (following_id, created_at),
  CONSTRAINT fk_customer_follows_follower
    FOREIGN KEY (follower_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_follows_following
    FOREIGN KEY (following_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'C端用户关注关系表';

CREATE TABLE IF NOT EXISTS customer_im_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '私信消息ID',
  sender_id BIGINT UNSIGNED NOT NULL COMMENT '发送用户ID',
  recipient_id BIGINT UNSIGNED NOT NULL COMMENT '接收用户ID',
  content TEXT NOT NULL COMMENT '消息内容',
  delivery_mode ENUM('guestbook', 'chat') NOT NULL DEFAULT 'guestbook'
    COMMENT '留言模式或好友聊天模式',
  request_id VARCHAR(100) NULL COMMENT '客户端幂等请求ID',
  is_read TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读：1是，0否',
  read_at DATETIME(6) NULL COMMENT '阅读时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '发送时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_im_request (request_id),
  KEY idx_customer_im_sender (sender_id, recipient_id, created_at),
  KEY idx_customer_im_recipient (recipient_id, sender_id, created_at),
  KEY idx_customer_im_unread (recipient_id, is_read, created_at),
  CONSTRAINT fk_customer_im_sender
    FOREIGN KEY (sender_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_im_recipient
    FOREIGN KEY (recipient_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'C端用户留言与聊天消息表';
