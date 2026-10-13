USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS forum_dynamics (
  id VARCHAR(32) NOT NULL COMMENT '动态ID',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '发布用户ID',
  content TEXT NOT NULL COMMENT '动态内容',
  media JSON NOT NULL COMMENT '媒体素材数组',
  topic VARCHAR(100) NOT NULL COMMENT '话题',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  comment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论数',
  share_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '转发数',
  pinned TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶：1是，0否',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '发布时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  KEY idx_forum_dynamics_customer_id (customer_id),
  KEY idx_forum_dynamics_topic (topic),
  KEY idx_forum_dynamics_pinned (pinned),
  KEY idx_forum_dynamics_created_at (created_at),
  CONSTRAINT fk_forum_dynamics_customer_id
    FOREIGN KEY (customer_id) REFERENCES customer_users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'C端论坛动态表';

INSERT INTO forum_dynamics (
  id,
  customer_id,
  content,
  media,
  topic,
  like_count,
  comment_count,
  share_count,
  pinned,
  created_at
)
VALUES
  (
    'D-5000',
    1,
    '昨晚在老码头蹲了两个小时，等到了想要的蓝调时刻，分享几张成片。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-5000',
        'kind', 'album',
        'title', '老码头蓝调时刻',
        'seed', 1024,
        'size', 4280000
      ),
      JSON_OBJECT(
        'id', 'M-5001',
        'kind', 'video',
        'title', '蓝调延时短片',
        'seed', 2048,
        'duration', 86,
        'size', 12800000
      )
    ),
    '城市夜景',
    1280,
    96,
    42,
    1,
    DATE_SUB(NOW(6), INTERVAL 2 HOUR)
  ),
  (
    'D-5001',
    2,
    '第一次尝试用 35mm 扫街，出片率比想象中高，欢迎交流构图。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-5002',
        'kind', 'album',
        'title', '三十五毫米扫街',
        'seed', 3072,
        'size', 3650000
      )
    ),
    '今日随手拍',
    860,
    54,
    18,
    0,
    DATE_SUB(NOW(6), INTERVAL 6 HOUR)
  ),
  (
    'D-5002',
    3,
    '整理了一份暗调人像的调色参数，需要源文件的评论区留言。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-5003',
        'kind', 'album',
        'title', '暗调人像调色',
        'seed', 4096,
        'size', 5200000
      ),
      JSON_OBJECT(
        'id', 'M-5004',
        'kind', 'album',
        'title', '暗调人像成片',
        'seed', 5120,
        'size', 4860000
      ),
      JSON_OBJECT(
        'id', 'M-5005',
        'kind', 'video',
        'title', '调色过程录屏',
        'seed', 6144,
        'duration', 248,
        'size', 18600000
      )
    ),
    '人像写真',
    2360,
    188,
    76,
    1,
    DATE_SUB(NOW(6), INTERVAL 1 DAY)
  ),
  (
    'D-5003',
    3,
    '航拍要注意的空域问题，简单列了几条新手最容易踩的坑。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-5006',
        'kind', 'video',
        'title', '航拍空域注意事项',
        'seed', 7168,
        'duration', 192,
        'size', 15600000
      )
    ),
    '航拍视角',
    1540,
    112,
    64,
    0,
    DATE_SUB(NOW(6), INTERVAL 2 DAY)
  )
ON DUPLICATE KEY UPDATE
  customer_id = VALUES(customer_id),
  content = VALUES(content),
  media = VALUES(media),
  topic = VALUES(topic),
  like_count = VALUES(like_count),
  comment_count = VALUES(comment_count),
  share_count = VALUES(share_count),
  pinned = VALUES(pinned),
  created_at = VALUES(created_at);

SELECT
  id,
  customer_id,
  content,
  JSON_LENGTH(media) AS media_count,
  topic,
  like_count,
  comment_count,
  share_count,
  pinned,
  created_at
FROM forum_dynamics
ORDER BY created_at DESC;
