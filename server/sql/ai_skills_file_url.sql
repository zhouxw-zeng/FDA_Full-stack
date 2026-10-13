USE mysqldb;

SET NAMES utf8mb4;

-- 技能文件改为先经 POST /api/files/upload 上传到本地文件仓，
-- ai_skills 保存返回地址；file_content 仍保留，AI 组装 system prompt 时会读取正文。
SET @has_file_url = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'ai_skills'
    AND column_name = 'file_url'
);
SET @sql = IF(
  @has_file_url = 0,
  'ALTER TABLE ai_skills ADD COLUMN file_url VARCHAR(500) NULL COMMENT ''本地文件地址'' AFTER file_content',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT
  id,
  skill_name,
  file_name,
  file_url,
  CHAR_LENGTH(file_content) AS file_content_length,
  status
FROM ai_skills
ORDER BY id;
