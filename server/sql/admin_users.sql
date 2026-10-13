USE mysqldb;

SET NAMES utf8mb4;

-- 角色表
CREATE TABLE IF NOT EXISTS admin_roles (
  role_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
  role_remark VARCHAR(255) NULL COMMENT '角色备注',
  route_id_group JSON NOT NULL COMMENT '角色页面路由ID组',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '编辑时间',
  PRIMARY KEY (role_id),
  UNIQUE KEY uk_admin_roles_role_name (role_name)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '后台角色表';

-- 初始化角色
INSERT INTO admin_roles (
  role_id,
  role_name,
  role_remark,
  route_id_group
)
VALUES
  (
    1,
    '超级管理员',
    '拥有后台全部页面权限',
    JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
  ),
  (
    2,
    '普通用户',
    '仅可访问个人信息页面',
    JSON_ARRAY(13)
  ),
  (
    3,
    '论坛运营',
    '负责论坛内容审批和用户管理',
    JSON_ARRAY(1, 2, 3, 4, 5, 6, 11, 12, 13)
  ),
  (
    4,
    '广告运营',
    '负责广告投放和行为分析',
    JSON_ARRAY(1, 7, 8, 9, 10, 11, 12, 13)
  )
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  role_remark = VALUES(role_remark),
  route_id_group = VALUES(route_id_group);

-- 用户表
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '登录账号',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt密码哈希',
  nickname VARCHAR(20) NOT NULL COMMENT '昵称',
  email VARCHAR(100) NOT NULL COMMENT '邮箱',
  phone VARCHAR(20) NULL COMMENT '手机号',
  avatar VARCHAR(500) NULL COMMENT '头像地址',
  department VARCHAR(100) NULL COMMENT '所属部门',
  bio VARCHAR(80) NULL COMMENT '个人简介',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '单一角色ID',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用，0禁用',
  last_login_at DATETIME(6) NULL COMMENT '最近登录时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '编辑时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_users_username (username),
  UNIQUE KEY uk_admin_users_email (email),
  KEY idx_admin_users_role_id (role_id),
  CONSTRAINT fk_admin_users_role_id
    FOREIGN KEY (role_id) REFERENCES admin_roles (role_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = '后台用户信息表';

-- 两个用户：密码均为 123456，用户ID由自增主键生成
INSERT INTO admin_users (
  username,
  password_hash,
  nickname,
  email,
  phone,
  avatar,
  department,
  bio,
  role_id,
  status,
  last_login_at
)
VALUES
  (
    'admin',
    '$2b$12$PU0XektcrFCUhGNC/eRbB.P5MGowcX7gW.fXdqRqvciGlBNJTu2Hm',
    'Avin',
    'lin.zhiyuan@album-forum.dev',
    '13800000001',
    '',
    '平台运营中心',
    '负责论坛内容治理与审核策略。',
    1,
    1,
    DATE_SUB(NOW(6), INTERVAL 2 HOUR)
  ),
  (
    'user',
    '$2b$12$PU0XektcrFCUhGNC/eRbB.P5MGowcX7gW.fXdqRqvciGlBNJTu2Hm',
    '普通用户',
    'user@example.com',
    '13800000002',
    '',
    '业务运营部',
    '普通后台用户。',
    2,
    1,
    DATE_SUB(NOW(6), INTERVAL 5 HOUR)
  )
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  nickname = VALUES(nickname),
  email = VALUES(email),
  phone = VALUES(phone),
  avatar = VALUES(avatar),
  department = VALUES(department),
  bio = VALUES(bio),
  role_id = VALUES(role_id),
  status = VALUES(status),
  last_login_at = VALUES(last_login_at);

SELECT
  u.id,
  u.username,
  u.nickname,
  u.email,
  u.phone,
  u.department,
  u.role_id,
  r.role_name,
  r.route_id_group,
  u.status,
  u.last_login_at,
  u.created_at
FROM admin_users AS u
JOIN admin_roles AS r ON r.role_id = u.role_id
ORDER BY u.id;
