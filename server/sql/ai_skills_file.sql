USE mysqldb;

SET NAMES utf8mb4;

SET @has_file_name = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND column_name = 'file_name'
);
SET @sql = IF(
  @has_file_name = 0,
  'ALTER TABLE ai_skills ADD COLUMN file_name VARCHAR(255) NULL COMMENT ''Markdown文件名'' AFTER skill_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_file_content = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND column_name = 'file_content'
);
SET @sql = IF(
  @has_file_content = 0,
  'ALTER TABLE ai_skills ADD COLUMN file_content LONGTEXT NULL COMMENT ''Markdown文件内容'' AFTER file_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE ai_skills
SET file_name = CONCAT(skill_name, '.md')
WHERE file_name IS NULL OR file_name = '';

UPDATE ai_skills
SET file_content = system_prompt
WHERE (file_content IS NULL OR file_content = '')
  AND system_prompt IS NOT NULL;

UPDATE ai_skills
SET file_content = '# 技能说明\n\n请在管理后台维护该 Markdown 技能文件。'
WHERE file_content IS NULL OR file_content = '';

ALTER TABLE ai_skills
  MODIFY COLUMN file_name VARCHAR(255) NOT NULL COMMENT 'Markdown文件名',
  MODIFY COLUMN file_content LONGTEXT NOT NULL COMMENT 'Markdown文件内容';

SET @has_skill_code_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND index_name = 'uk_ai_skills_code'
);
SET @sql = IF(
  @has_skill_code_index = 1,
  'ALTER TABLE ai_skills DROP INDEX uk_ai_skills_code',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_skill_code = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND column_name = 'skill_code'
);
SET @sql = IF(
  @has_skill_code = 1,
  'ALTER TABLE ai_skills DROP COLUMN skill_code',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_system_prompt = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND column_name = 'system_prompt'
);

SET @sql = IF(
  @has_system_prompt = 1,
  'ALTER TABLE ai_skills DROP COLUMN system_prompt',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT
  id,
  skill_name,
  description,
  file_name,
  CHAR_LENGTH(file_content) AS file_content_length,
  status,
  created_at,
  updated_at
FROM ai_skills
ORDER BY id;
