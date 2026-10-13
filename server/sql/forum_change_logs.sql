USE mysqldb;

SET NAMES utf8mb4;

-- 给动态补充审批状态和启用状态。
SET @has_audit_status = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND column_name = 'audit_status'
);
SET @sql = IF(
  @has_audit_status = 0,
  'ALTER TABLE forum_dynamics ADD COLUMN audit_status ENUM(''pending'', ''approved'', ''rejected'') NOT NULL DEFAULT ''pending'' AFTER pinned',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_enabled = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND column_name = 'enabled'
);
SET @sql = IF(
  @has_enabled = 0,
  'ALTER TABLE forum_dynamics ADD COLUMN enabled TINYINT NOT NULL DEFAULT 0 COMMENT ''启用状态：1启用，0禁用'' AFTER audit_status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 已有动态默认为审批通过并启用。
UPDATE forum_dynamics
SET audit_status = 'approved',
    enabled = 1;

SET @has_audit_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND index_name = 'idx_forum_dynamics_audit_status'
);
SET @sql = IF(
  @has_audit_index = 0,
  'ALTER TABLE forum_dynamics ADD KEY idx_forum_dynamics_audit_status (audit_status, enabled)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 论坛动态变更记录表。
CREATE TABLE IF NOT EXISTS forum_change_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '变更记录ID',
  target_type VARCHAR(32) NOT NULL DEFAULT 'forum_dynamic' COMMENT '目标记录类型',
  target_id VARCHAR(32) NOT NULL COMMENT '动态记录ID',
  owner_id BIGINT UNSIGNED NOT NULL COMMENT '动态所属C端用户ID',
  editor_id BIGINT UNSIGNED NOT NULL COMMENT '动态编辑者ID',
  editor_type ENUM('customer', 'admin') NOT NULL COMMENT '编辑者类型',
  action VARCHAR(32) NOT NULL COMMENT '变更动作',
  changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '变更时间',
  remark VARCHAR(500) NULL COMMENT '变更备注',
  attachments TEXT NULL COMMENT '附件链接文本，由前端自行解析',
  PRIMARY KEY (id),
  KEY idx_forum_change_logs_target_id (target_id),
  KEY idx_forum_change_logs_owner_id (owner_id),
  KEY idx_forum_change_logs_editor (editor_type, editor_id),
  KEY idx_forum_change_logs_action (action),
  KEY idx_forum_change_logs_changed_at (changed_at)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '论坛动态变更记录表';

SELECT
  id,
  target_type,
  target_id,
  owner_id,
  editor_id,
  editor_type,
  action,
  changed_at,
  remark,
  attachments
FROM forum_change_logs
ORDER BY changed_at DESC;
