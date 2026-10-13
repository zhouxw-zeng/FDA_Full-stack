USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admin_routes (
  route_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '路由信息ID',
  route_name VARCHAR(100) NOT NULL COMMENT '路由名称',
  icon VARCHAR(100) NULL COMMENT '路由图标',
  route_path VARCHAR(255) NOT NULL COMMENT '路由 path',
  component_path VARCHAR(255) NULL COMMENT '文件指向地址',
  pid BIGINT UNSIGNED NULL COMMENT '父路由ID',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：启用0，禁用1',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  route_type TINYINT NOT NULL DEFAULT 0 COMMENT '类型：0目录，1菜单',
  PRIMARY KEY (route_id),
  UNIQUE KEY uk_admin_routes_route_name (route_name),
  UNIQUE KEY uk_admin_routes_route_path (route_path),
  KEY idx_admin_routes_pid (pid),
  KEY idx_admin_routes_type_status (route_type, status),
  CONSTRAINT fk_admin_routes_pid
    FOREIGN KEY (pid) REFERENCES admin_routes (route_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '后台路由信息表';

INSERT INTO admin_routes (
  route_id,
  route_name,
  icon,
  route_path,
  component_path,
  pid,
  status,
  route_type
)
VALUES
  (
    1,
    '工作台',
    'DataBoard',
    '/dashboard',
    '@/views/dashboard/index.vue',
    NULL,
    0,
    1
  ),
  (
    2,
    '论坛管理',
    'ChatLineSquare',
    '/forum',
    '@/layout/index.vue',
    NULL,
    0,
    0
  ),
  (
    3,
    '论坛信息审批',
    'DocumentChecked',
    '/forum/approval',
    '@/views/forum/approval/index.vue',
    2,
    0,
    1
  ),
  (
    4,
    '论坛动态',
    'ChatLineSquare',
    '/forum/dynamics',
    '@/views/forum/dynamics/index.vue',
    2,
    0,
    1
  ),
  (
    5,
    '用户管理',
    'UserFilled',
    '/customer',
    '@/layout/index.vue',
    NULL,
    0,
    0
  ),
  (
    6,
    'C端用户审批',
    'User',
    '/customer/approval',
    '@/views/customer/approval/index.vue',
    5,
    0,
    1
  ),
  (
    7,
    '商业化',
    'Promotion',
    '/advertising',
    '@/layout/index.vue',
    NULL,
    0,
    0
  ),
  (
    8,
    '广告推广管理',
    'Promotion',
    '/advertising/list',
    '@/views/advertising/list/index.vue',
    7,
    0,
    1
  ),
  (
    9,
    '数据分析',
    'TrendCharts',
    '/analytics',
    '@/layout/index.vue',
    NULL,
    0,
    0
  ),
  (
    10,
    '用户行为分析',
    'TrendCharts',
    '/analytics/behavior',
    '@/views/analytics/behavior/index.vue',
    9,
    0,
    1
  ),
  (
    11,
    '内容工具',
    'View',
    '/preview',
    '@/layout/index.vue',
    NULL,
    0,
    0
  ),
  (
    12,
    '动态预览',
    'View',
    '/preview/dynamic',
    '@/views/preview/dynamic/index.vue',
    11,
    0,
    1
  ),
  (
    13,
    '个人信息',
    'User',
    '/profile',
    '@/views/profile/index.vue',
    NULL,
    0,
    1
  )
ON DUPLICATE KEY UPDATE
  route_name = VALUES(route_name),
  icon = VALUES(icon),
  route_path = VALUES(route_path),
  component_path = VALUES(component_path),
  pid = VALUES(pid),
  status = VALUES(status),
  route_type = VALUES(route_type);

-- 角色权限组改为 admin_routes.route_id 数值 ID 数组。
UPDATE admin_roles
SET route_id_group = JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
WHERE role_id = 1;

UPDATE admin_roles
SET route_id_group = JSON_ARRAY(13)
WHERE role_id = 2;

UPDATE admin_roles
SET route_id_group = JSON_ARRAY(1, 2, 3, 4, 5, 6, 11, 12, 13)
WHERE role_id = 3;

UPDATE admin_roles
SET route_id_group = JSON_ARRAY(1, 7, 8, 9, 10, 11, 12, 13)
WHERE role_id = 4;

SELECT
  route_id,
  route_name,
  icon,
  route_path,
  component_path,
  pid,
  status,
  route_type,
  created_at,
  updated_at
FROM admin_routes
ORDER BY route_id;
