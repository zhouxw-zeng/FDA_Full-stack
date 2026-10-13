USE mysqldb;

SET NAMES utf8mb4;

SET @has_system_prompt = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_model_configs'
    AND column_name = 'system_prompt'
);
SET @sql = IF(
  @has_system_prompt = 0,
  'ALTER TABLE ai_model_configs ADD COLUMN system_prompt TEXT NULL COMMENT ''模型默认System Prompt'' AFTER extra_config',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS ai_skills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '技能ID',
  skill_code VARCHAR(50) NOT NULL COMMENT '技能编码',
  skill_name VARCHAR(100) NOT NULL COMMENT '技能名称',
  system_prompt TEXT NOT NULL COMMENT '技能System Prompt',
  description VARCHAR(500) NULL COMMENT '技能说明',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0启用，1禁用',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_skills_code (skill_code),
  UNIQUE KEY uk_ai_skills_name (skill_name),
  KEY idx_ai_skills_status (status)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI通用技能表';

CREATE TABLE IF NOT EXISTS ai_model_skills (
  model_config_id BIGINT UNSIGNED NOT NULL COMMENT '模型配置ID',
  skill_id BIGINT UNSIGNED NOT NULL COMMENT '技能ID',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (model_config_id, skill_id),
  KEY idx_ai_model_skills_skill_id (skill_id),
  CONSTRAINT fk_ai_model_skills_model
    FOREIGN KEY (model_config_id) REFERENCES ai_model_configs (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_model_skills_skill
    FOREIGN KEY (skill_id) REFERENCES ai_skills (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'AI模型与技能关联表';

INSERT INTO ai_skills (
  id,
  skill_code,
  skill_name,
  system_prompt,
  description,
  status
)
VALUES
  (
    1,
    'GENERAL_ASSISTANT',
    '通用助手',
    '你是全栈 FDE 管理后台的 AI 助手。回答要准确、简洁、可执行，优先使用中文。',
    '适用于后台问答、运营助手和通用文本处理',
    0
  ),
  (
    2,
    'IMAGE_SHORT_CAPTION',
    '图片短描述',
    '请根据用户上传的图片只返回一段简短中文文本，不要解释过程，不要输出 Markdown 列表。',
    '适用于上传图片后快速生成短文本描述',
    0
  ),
  (
    3,
    'DOCUMENT_SUMMARY',
    '文档概述',
    '请对上传附件生成结构化概述，提炼重点信息、风险点和待办事项。',
    '适用于文档、日志和文本附件概述',
    0
  ),
  (
    4,
    'OPERATION_ANALYSIS',
    '运营分析',
    '你是运营数据分析助手，请根据输入数据给出关键指标解释、异常点和优化建议。',
    '适用于运营数据解读和分析建议',
    0
  )
ON DUPLICATE KEY UPDATE
  skill_name = VALUES(skill_name),
  system_prompt = VALUES(system_prompt),
  description = VALUES(description),
  status = VALUES(status);

INSERT IGNORE INTO ai_model_skills (model_config_id, skill_id)
VALUES
  (1, 1),
  (1, 3),
  (2, 1);

UPDATE ai_model_configs
SET system_prompt = '你是全栈 FDE 管理后台的 AI 助手。请遵循用户选择的技能说明，并给出简洁可靠的结果。'
WHERE id = 1 AND (system_prompt IS NULL OR system_prompt = '');

SELECT
  id,
  skill_code,
  skill_name,
  description,
  status,
  created_at,
  updated_at
FROM ai_skills
ORDER BY id;
