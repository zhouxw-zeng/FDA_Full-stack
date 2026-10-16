USE mysqldb;

SET NAMES utf8mb4;

INSERT INTO forum_dynamics (
  id,
  customer_id,
  type_id,
  content,
  media,
  topic,
  like_count,
  comment_count,
  share_count,
  pinned,
  audit_status,
  enabled,
  created_at
)
VALUES
  (
    'D-6001',
    8,
    1,
    '清晨沿着街道慢慢走了一圈，光线刚好落在旧墙和树叶上，顺手记录下今天的第一组画面。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6001',
        'kind', 'album',
        'title', '清晨街角的光',
        'url', '/local-files/image/2026-10-16/images/OIP-C.webp',
        'seed', 6001,
        'size', 14290
      )
    ),
    '今日随手拍',
    328,
    26,
    12,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 1 HOUR)
  ),
  (
    'D-6002',
    8,
    2,
    '入夜后的城市像重新换了一层颜色，路灯、车流和玻璃反射叠在一起，很适合慢慢观察。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6002',
        'kind', 'album',
        'title', '夜色中的反射',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(1).webp',
        'seed', 6002,
        'size', 12324
      )
    ),
    '城市夜景',
    512,
    41,
    18,
    1,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 3 HOUR)
  ),
  (
    'D-6003',
    8,
    3,
    '这次拍摄没有刻意摆姿势，只保留了自然的表情和侧逆光，画面比想象中更耐看。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6003',
        'kind', 'album',
        'title', '自然侧光人像',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(2).webp',
        'seed', 6003,
        'size', 9592
      ),
      JSON_OBJECT(
        'id', 'M-6004',
        'kind', 'album',
        'title', '街边人像',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(3).webp',
        'seed', 6004,
        'size', 8658
      )
    ),
    '人像写真',
    786,
    68,
    31,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 5 HOUR)
  ),
  (
    'D-6004',
    8,
    4,
    '从高处看城市，熟悉的道路和建筑变成了另一种尺度，云层也刚好留出了一点空间。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6005',
        'kind', 'album',
        'title', '云端下的城市',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(4).webp',
        'seed', 6005,
        'size', 26594
      )
    ),
    '航拍视角',
    936,
    72,
    48,
    1,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 8 HOUR)
  ),
  (
    'D-6005',
    8,
    1,
    '今天没有特别安排，只是把路上遇到的细节存下来，回过头看反而组成了一段完整的日常。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6006',
        'kind', 'album',
        'title', '日常片段',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(5).webp',
        'seed', 6006,
        'size', 6348
      )
    ),
    '今日随手拍',
    246,
    19,
    8,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 1 DAY)
  ),
  (
    'D-6006',
    8,
    2,
    '雨后的灯光被路面拉得很长，平时熟悉的路口也有了一点电影感。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6007',
        'kind', 'album',
        'title', '雨夜路口',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(6).webp',
        'seed', 6007,
        'size', 18242
      )
    ),
    '城市夜景',
    678,
    54,
    22,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 28 HOUR)
  ),
  (
    'D-6007',
    8,
    3,
    '柔和的光从侧边打过来，保留了皮肤和衣物的细节，也更接近当时看到的感觉。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6008',
        'kind', 'album',
        'title', '柔和光线人像',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(7).webp',
        'seed', 6008,
        'size', 26742
      )
    ),
    '人像写真',
    1042,
    88,
    39,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 2 DAY)
  ),
  (
    'D-6008',
    8,
    5,
    '整理素材时发现，不同时间拍下的画面放在一起会产生新的联系，于是做了一次简单组合。',
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'M-6009',
        'kind', 'album',
        'title', '素材组合记录',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(8).webp',
        'seed', 6009,
        'size', 11616
      ),
      JSON_OBJECT(
        'id', 'M-6010',
        'kind', 'album',
        'title', '光影细节',
        'url', '/local-files/image/2026-10-16/images/OIP-C%20(9).webp',
        'seed', 6010,
        'size', 24350
      )
    ),
    '其他',
    455,
    37,
    16,
    0,
    'approved',
    1,
    DATE_SUB(NOW(6), INTERVAL 3 DAY)
  )
ON DUPLICATE KEY UPDATE
  customer_id = VALUES(customer_id),
  type_id = VALUES(type_id),
  content = VALUES(content),
  media = VALUES(media),
  topic = VALUES(topic),
  like_count = VALUES(like_count),
  comment_count = VALUES(comment_count),
  share_count = VALUES(share_count),
  pinned = VALUES(pinned),
  audit_status = VALUES(audit_status),
  enabled = VALUES(enabled),
  created_at = VALUES(created_at);

SELECT
  id,
  customer_id,
  type_id,
  topic,
  JSON_LENGTH(media) AS media_count,
  audit_status,
  enabled,
  created_at
FROM forum_dynamics
WHERE id LIKE 'D-60%'
ORDER BY id;
