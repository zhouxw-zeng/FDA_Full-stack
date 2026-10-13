USE mysqldb;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customer_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'C端用户ID',
  username VARCHAR(50) NULL COMMENT '用户名',
  nickname VARCHAR(50) NOT NULL COMMENT '昵称',
  avatar VARCHAR(500) NULL COMMENT '头像地址',
  phone VARCHAR(20) NOT NULL COMMENT '手机号',
  email VARCHAR(100) NULL COMMENT '邮箱',
  gender TINYINT NOT NULL DEFAULT 0 COMMENT '性别：0未知，1男，2女',
  birthday DATE NULL COMMENT '生日',
  region VARCHAR(100) NULL COMMENT '所在地区',
  signature VARCHAR(255) NULL COMMENT '个人签名',
  vip_level TINYINT NOT NULL DEFAULT 1 COMMENT 'VIP等级：1-5',
  audit_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'
    COMMENT '审批状态',
  enabled TINYINT NOT NULL DEFAULT 0 COMMENT '启用状态：1启用，0禁用',
  audit_remark VARCHAR(255) NULL COMMENT '审批备注',
  audited_at DATETIME(6) NULL COMMENT '审批时间',
  audited_by BIGINT UNSIGNED NULL COMMENT '审批管理员ID',
  dynamic_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '发布动态数量',
  last_login_at DATETIME(6) NULL COMMENT '最近登录时间',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '注册时间',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_users_username (username),
  UNIQUE KEY uk_customer_users_phone (phone),
  UNIQUE KEY uk_customer_users_email (email),
  KEY idx_customer_users_audit_status (audit_status),
  KEY idx_customer_users_enabled (enabled),
  KEY idx_customer_users_vip_level (vip_level),
  CONSTRAINT fk_customer_users_audited_by
    FOREIGN KEY (audited_by) REFERENCES admin_users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT chk_customer_users_vip_level CHECK (vip_level BETWEEN 1 AND 5)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'C端用户信息表';

INSERT INTO customer_users (
  username,
  nickname,
  phone,
  email,
  gender,
  region,
  signature,
  vip_level,
  audit_status,
  enabled,
  dynamic_count
)
VALUES
  (
    'c_end_001',
    '光圈旅行者',
    '13810000001',
    'c_end_001@album-forum.dev',
    1,
    '上海',
    '记录城市与海岸线。',
    1,
    'pending',
    0,
    3
  ),
  (
    'c_end_002',
    '城市夜行',
    '13810000002',
    'c_end_002@album-forum.dev',
    0,
    '杭州',
    '夜景与胶片摄影爱好者。',
    3,
    'approved',
    1,
    28
  ),
  (
    'c_end_003',
    '海岛胶片',
    '13810000003',
    'c_end_003@album-forum.dev',
    2,
    '厦门',
    '用胶片保存海岛日常。',
    5,
    'approved',
    1,
    76
  )
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  avatar = VALUES(avatar),
  gender = VALUES(gender),
  birthday = VALUES(birthday),
  region = VALUES(region),
  signature = VALUES(signature),
  vip_level = VALUES(vip_level),
  audit_status = VALUES(audit_status),
  enabled = VALUES(enabled),
  dynamic_count = VALUES(dynamic_count),
  last_login_at = VALUES(last_login_at);

SELECT
  id,
  username,
  nickname,
  phone,
  email,
  region,
  vip_level,
  audit_status,
  enabled,
  dynamic_count,
  created_at
FROM customer_users
ORDER BY id;
