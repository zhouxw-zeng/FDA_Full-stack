USE mysqldb;

SET NAMES utf8mb4;

SET @has_skill_ids = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_model_configs'
    AND column_name = 'skill_ids'
);
SET @sql = IF(
  @has_skill_ids = 0,
  'ALTER TABLE ai_model_configs ADD COLUMN skill_ids JSON NULL COMMENT ''绑定的技能ID组'' AFTER system_prompt',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE ai_model_configs AS model
SET model.skill_ids = COALESCE(
  (
    SELECT JSON_ARRAYAGG(model_skill.skill_id)
    FROM ai_model_skills AS model_skill
    WHERE model_skill.model_config_id = model.id
  ),
  JSON_ARRAY()
)
WHERE model.skill_ids IS NULL;

UPDATE ai_model_configs
SET skill_ids = JSON_ARRAY()
WHERE skill_ids IS NULL;

ALTER TABLE ai_model_configs
  MODIFY COLUMN skill_ids JSON NOT NULL COMMENT '绑定的技能ID组';

SELECT
  id,
  provider_code,
  model_name,
  system_prompt,
  skill_ids
FROM ai_model_configs
ORDER BY id;
