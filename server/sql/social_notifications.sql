USE mysqldb;

SET NAMES utf8mb4;

-- 关注通知不关联具体动态，放开 dynamic_id 非空限制
ALTER TABLE forum_activity_notifications
  MODIFY COLUMN dynamic_id VARCHAR(32) NULL COMMENT '关联动态ID，关注通知为空';

-- 通知类型新增「关注」
ALTER TABLE forum_activity_notifications
  MODIFY COLUMN type ENUM('dynamic_like', 'dynamic_comment', 'comment_reply', 'user_follow')
    NOT NULL COMMENT '通知类型';
