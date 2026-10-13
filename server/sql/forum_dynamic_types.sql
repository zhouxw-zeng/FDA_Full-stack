USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS forum_dynamic_types (
  type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '动态类型ID',
  type_name VARCHAR(100) NOT NULL COMMENT '动态类型名称',
  type_remark VARCHAR(255) NULL COMMENT '动态类型备注',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0启用，1禁用',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (type_id),
  UNIQUE KEY uk_forum_dynamic_types_name (type_name),
  KEY idx_forum_dynamic_types_status (status)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '论坛动态类型表';

INSERT INTO forum_dynamic_types (
  type_id,
  type_name,
  type_remark,
  status
)
VALUES
  (1, '今日随手拍', '日常随手记录内容', 0),
  (2, '城市夜景', '城市夜景与灯光内容', 0),
  (3, '人像写真', '人像摄影与写真内容', 0),
  (4, '航拍视角', '航拍与高空视角内容', 0),
  (5, '其他', '未归类的动态内容', 0)
ON DUPLICATE KEY UPDATE
  type_name = VALUES(type_name),
  type_remark = VALUES(type_remark),
  status = VALUES(status);

-- 给已有 forum_dynamics 增加 type_id，并兼容脚本重复执行。
SET @has_type_id = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND column_name = 'type_id'
);
SET @sql = IF(
  @has_type_id = 0,
  'ALTER TABLE forum_dynamics ADD COLUMN type_id BIGINT UNSIGNED NULL AFTER customer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE forum_dynamics AS dynamic
LEFT JOIN forum_dynamic_types AS type ON type.type_name = dynamic.topic
SET dynamic.type_id = type.type_id
WHERE dynamic.type_id IS NULL;

UPDATE forum_dynamics
SET type_id = 5
WHERE type_id IS NULL;

ALTER TABLE forum_dynamics
  MODIFY COLUMN type_id BIGINT UNSIGNED NOT NULL;

SET @has_type_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND index_name = 'idx_forum_dynamics_type_id'
);
SET @sql = IF(
  @has_type_index = 0,
  'ALTER TABLE forum_dynamics ADD KEY idx_forum_dynamics_type_id (type_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_type_fk = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'forum_dynamics'
    AND constraint_name = 'fk_forum_dynamics_type_id'
    AND constraint_type = 'FOREIGN KEY'
);
SET @sql = IF(
  @has_type_fk = 0,
  'ALTER TABLE forum_dynamics
   ADD CONSTRAINT fk_forum_dynamics_type_id
   FOREIGN KEY (type_id) REFERENCES forum_dynamic_types (type_id)
   ON UPDATE CASCADE
   ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT
  type_id,
  type_name,
  type_remark,
  status,
  created_at,
  updated_at
FROM forum_dynamic_types
ORDER BY type_id;
