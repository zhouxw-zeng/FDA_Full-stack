/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_partner_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '对接方类型ID',
  `type_name` varchar(100) NOT NULL COMMENT '对接方类型名称',
  `type_code` varchar(50) NOT NULL COMMENT '对接方类型编码',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `integration_url` varchar(500) DEFAULT NULL COMMENT '第三方广告对接文档网址',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0启用，1禁用',
  `requires_key` tinyint NOT NULL DEFAULT '0' COMMENT '是否需要第三方Key：1需要，0不需要',
  `key_id` varchar(255) DEFAULT NULL COMMENT '第三方Key ID，待人工补充',
  `key_secret` varchar(500) DEFAULT NULL COMMENT '第三方Key Secret，待人工补充',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ad_partner_types_name` (`type_name`),
  UNIQUE KEY `uk_ad_partner_types_code` (`type_code`),
  KEY `idx_ad_partner_types_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='广告对接方类型表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_campaigns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '广告计划ID',
  `name` varchar(200) NOT NULL COMMENT '广告计划名称',
  `advertiser` varchar(100) NOT NULL COMMENT '广告主名称',
  `partner_type_id` bigint unsigned DEFAULT NULL COMMENT '广告对接方类型ID',
  `placement` enum('feed','banner','video_pre','splash') NOT NULL COMMENT '投放位置',
  `status` enum('running','paused','ended','draft') NOT NULL DEFAULT 'draft' COMMENT '广告状态',
  `budget` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT '预算',
  `spent` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT '已消耗',
  `impressions` bigint unsigned NOT NULL DEFAULT '0' COMMENT '曝光量',
  `clicks` bigint unsigned NOT NULL DEFAULT '0' COMMENT '点击量',
  `start_at` datetime(6) NOT NULL COMMENT '开始时间',
  `end_at` datetime(6) NOT NULL COMMENT '结束时间',
  `seed` int unsigned NOT NULL DEFAULT '1' COMMENT '前端展示种子',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_ad_campaigns_partner_type_id` (`partner_type_id`),
  KEY `idx_ad_campaigns_placement` (`placement`),
  KEY `idx_ad_campaigns_status` (`status`),
  KEY `idx_ad_campaigns_time` (`start_at`,`end_at`),
  CONSTRAINT `fk_ad_campaigns_partner_type_id` FOREIGN KEY (`partner_type_id`) REFERENCES `ad_partner_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='广告投放计划表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_roles` (
  `role_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '角色 ID',
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `role_remark` varchar(255) DEFAULT NULL COMMENT '角色备注',
  `route_id_group` json NOT NULL COMMENT '角色可访问的页面路由 ID 组',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_admin_roles_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台管理角色表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_routes` (
  `route_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '路由信息ID',
  `route_name` varchar(100) NOT NULL COMMENT '路由名称',
  `icon` varchar(100) DEFAULT NULL COMMENT '路由图标',
  `route_path` varchar(255) NOT NULL COMMENT '路由 path',
  `component_path` varchar(255) DEFAULT NULL COMMENT '文件指向地址',
  `pid` bigint unsigned DEFAULT NULL COMMENT '父路由ID',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：启用0，禁用1',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  `route_type` tinyint NOT NULL DEFAULT '0' COMMENT '类型：0目录，1菜单',
  PRIMARY KEY (`route_id`),
  UNIQUE KEY `uk_admin_routes_route_name` (`route_name`),
  UNIQUE KEY `uk_admin_routes_route_path` (`route_path`),
  KEY `idx_admin_routes_pid` (`pid`),
  KEY `idx_admin_routes_type_status` (`route_type`,`status`),
  CONSTRAINT `fk_admin_routes_pid` FOREIGN KEY (`pid`) REFERENCES `admin_routes` (`route_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台路由信息表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `username` varchar(50) NOT NULL COMMENT 'Login username',
  `password_hash` varchar(255) NOT NULL COMMENT 'bcrypt password hash',
  `nickname` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL COMMENT 'Email address',
  `phone` varchar(20) DEFAULT NULL COMMENT 'Phone number',
  `avatar` varchar(500) DEFAULT NULL COMMENT 'Avatar URL',
  `department` varchar(100) DEFAULT NULL COMMENT 'Department',
  `bio` varchar(80) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1 enabled, 0 disabled',
  `last_login_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_users_username` (`username`),
  UNIQUE KEY `uk_admin_users_email` (`email`),
  KEY `idx_admin_users_role_status` (`status`),
  KEY `idx_admin_users_role_id` (`role_id`),
  CONSTRAINT `fk_admin_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '登录状态记录ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `access_token_hash` char(64) NOT NULL COMMENT 'accessToken SHA-256 哈希',
  `refresh_token_hash` char(64) NOT NULL COMMENT 'refreshToken SHA-256 哈希',
  `access_expires_at` datetime(6) NOT NULL COMMENT 'accessToken 过期时间',
  `refresh_expires_at` datetime(6) NOT NULL COMMENT 'refreshToken 过期时间',
  `last_used_at` datetime(6) DEFAULT NULL COMMENT '最近校验时间',
  `revoked_at` datetime(6) DEFAULT NULL COMMENT '注销时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '编辑时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_auth_tokens_access_hash` (`access_token_hash`),
  UNIQUE KEY `uk_auth_tokens_refresh_hash` (`refresh_token_hash`),
  KEY `idx_auth_tokens_user_id` (`user_id`),
  KEY `idx_auth_tokens_refresh_status` (`refresh_expires_at`,`revoked_at`),
  CONSTRAINT `fk_auth_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台用户登录状态表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'C端用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `nickname` varchar(50) NOT NULL COMMENT '昵称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像地址',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `password_hash` varchar(255) DEFAULT NULL COMMENT '移动端登录密码bcrypt哈希',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `gender` tinyint NOT NULL DEFAULT '0' COMMENT '性别：0未知，1男，2女',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `region` varchar(100) DEFAULT NULL COMMENT '所在地区',
  `signature` varchar(255) DEFAULT NULL COMMENT '个人签名',
  `vip_level` tinyint NOT NULL DEFAULT '1' COMMENT 'VIP等级：1-5',
  `audit_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审批状态',
  `enabled` tinyint NOT NULL DEFAULT '0' COMMENT '启用状态：1启用，0禁用',
  `audit_remark` varchar(255) DEFAULT NULL COMMENT '审批备注',
  `audited_at` datetime(6) DEFAULT NULL COMMENT '审批时间',
  `audited_by` bigint unsigned DEFAULT NULL COMMENT '审批管理员ID',
  `dynamic_count` int unsigned NOT NULL DEFAULT '0' COMMENT '发布动态数量',
  `last_login_at` datetime(6) DEFAULT NULL COMMENT '最近登录时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '注册时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_users_phone` (`phone`),
  UNIQUE KEY `uk_customer_users_username` (`username`),
  UNIQUE KEY `uk_customer_users_email` (`email`),
  KEY `idx_customer_users_audit_status` (`audit_status`),
  KEY `idx_customer_users_enabled` (`enabled`),
  KEY `idx_customer_users_vip_level` (`vip_level`),
  KEY `fk_customer_users_audited_by` (`audited_by`),
  CONSTRAINT `fk_customer_users_audited_by` FOREIGN KEY (`audited_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_customer_users_vip_level` CHECK ((`vip_level` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C端用户信息表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_auth_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '移动端登录状态ID',
  `customer_id` bigint unsigned NOT NULL COMMENT 'C端用户ID',
  `access_token_hash` char(64) NOT NULL COMMENT 'accessToken SHA-256 哈希',
  `refresh_token_hash` char(64) NOT NULL COMMENT 'refreshToken SHA-256 哈希',
  `access_expires_at` datetime(6) NOT NULL COMMENT 'accessToken 过期时间',
  `refresh_expires_at` datetime(6) NOT NULL COMMENT 'refreshToken 过期时间',
  `last_used_at` datetime(6) DEFAULT NULL COMMENT '最近校验时间',
  `revoked_at` datetime(6) DEFAULT NULL COMMENT '注销时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_auth_access_hash` (`access_token_hash`),
  UNIQUE KEY `uk_customer_auth_refresh_hash` (`refresh_token_hash`),
  KEY `idx_customer_auth_customer_id` (`customer_id`),
  KEY `idx_customer_auth_refresh_status` (`refresh_expires_at`,`revoked_at`),
  CONSTRAINT `fk_customer_auth_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='移动端用户登录状态表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_model_configs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '模型配置ID',
  `provider_code` varchar(50) NOT NULL COMMENT '厂商编码，例如 DEEPSEEK',
  `provider_name` varchar(100) NOT NULL COMMENT '厂商名称',
  `base_url` varchar(500) NOT NULL COMMENT 'OpenAI兼容接口Base URL',
  `api_key` varchar(1000) DEFAULT NULL COMMENT 'API Key，可留空后人工维护',
  `model_name` varchar(100) NOT NULL COMMENT '模型标识',
  `display_name` varchar(100) NOT NULL COMMENT '显示名称',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0启用，1禁用',
  `is_default` tinyint NOT NULL DEFAULT '0' COMMENT '是否默认模型：1是，0否',
  `max_tokens` int unsigned NOT NULL DEFAULT '2048' COMMENT '最大输出Token',
  `temperature` decimal(3,2) NOT NULL DEFAULT '0.70' COMMENT '温度',
  `timeout_ms` int unsigned NOT NULL DEFAULT '60000' COMMENT '请求超时毫秒',
  `extra_config` json DEFAULT NULL COMMENT '扩展配置',
  `system_prompt` text COMMENT '模型默认System Prompt',
  `skill_ids` json NOT NULL COMMENT '绑定的技能ID组',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_model_provider_model` (`provider_code`,`model_name`),
  KEY `idx_ai_model_status_default` (`status`,`is_default`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI模型配置表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_skills` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '技能ID',
  `skill_name` varchar(100) NOT NULL COMMENT '技能名称',
  `file_name` varchar(255) NOT NULL COMMENT 'Markdown文件名',
  `file_content` longtext NOT NULL COMMENT 'Markdown文件内容',
  `file_url` varchar(500) DEFAULT NULL COMMENT '本地文件地址',
  `description` varchar(500) DEFAULT NULL COMMENT '技能说明',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0启用，1禁用',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_skills_name` (`skill_name`),
  KEY `idx_ai_skills_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI通用技能表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_model_skills` (
  `model_config_id` bigint unsigned NOT NULL COMMENT '模型配置ID',
  `skill_id` bigint unsigned NOT NULL COMMENT '技能ID',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`model_config_id`,`skill_id`),
  KEY `idx_ai_model_skills_skill_id` (`skill_id`),
  CONSTRAINT `fk_ai_model_skills_model` FOREIGN KEY (`model_config_id`) REFERENCES `ai_model_configs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_model_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `ai_skills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI模型与技能关联表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `admin_user_id` bigint unsigned DEFAULT NULL COMMENT 'B端管理员ID（历史兼容）',
  `customer_id` bigint unsigned DEFAULT NULL COMMENT '移动端C端用户ID',
  `model_config_id` bigint unsigned DEFAULT NULL COMMENT '模型配置ID',
  `title` varchar(200) NOT NULL COMMENT '会话标题',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_ai_chat_sessions_admin` (`admin_user_id`,`updated_at`),
  KEY `fk_ai_chat_sessions_model` (`model_config_id`),
  KEY `idx_ai_chat_sessions_customer` (`customer_id`,`updated_at`),
  CONSTRAINT `fk_ai_chat_sessions_admin_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_chat_sessions_customer_user` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_chat_sessions_model` FOREIGN KEY (`model_config_id`) REFERENCES `ai_model_configs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI聊天会话表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` bigint unsigned NOT NULL COMMENT '会话ID',
  `role` enum('system','user','assistant') NOT NULL COMMENT '消息角色',
  `content` longtext NOT NULL COMMENT '消息内容',
  `attachments` json DEFAULT NULL COMMENT '附件信息',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ai_chat_messages_session` (`session_id`,`created_at`),
  CONSTRAINT `fk_ai_chat_messages_session` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI聊天消息表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_usage_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '用量记录ID',
  `model_config_id` bigint unsigned DEFAULT NULL COMMENT '模型配置ID',
  `provider_code` varchar(50) NOT NULL COMMENT '厂商编码',
  `model_name` varchar(100) NOT NULL COMMENT '模型标识',
  `scene` varchar(50) NOT NULL COMMENT '使用场景',
  `request_id` varchar(100) DEFAULT NULL COMMENT '第三方请求ID',
  `prompt_tokens` int unsigned NOT NULL DEFAULT '0' COMMENT '输入Token',
  `completion_tokens` int unsigned NOT NULL DEFAULT '0' COMMENT '输出Token',
  `total_tokens` int unsigned NOT NULL DEFAULT '0' COMMENT '总Token',
  `latency_ms` int unsigned NOT NULL DEFAULT '0' COMMENT '耗时毫秒',
  `status` enum('success','failed') NOT NULL DEFAULT 'success' COMMENT '调用状态',
  `error_message` varchar(1000) DEFAULT NULL COMMENT '错误信息',
  `admin_user_id` bigint unsigned DEFAULT NULL COMMENT '操作管理员ID',
  `customer_id` bigint unsigned DEFAULT NULL COMMENT '移动端C端用户ID',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ai_usage_model_created` (`model_config_id`,`created_at`),
  KEY `idx_ai_usage_provider_created` (`provider_code`,`created_at`),
  KEY `idx_ai_usage_status` (`status`),
  KEY `idx_ai_usage_customer_created` (`customer_id`,`created_at`),
  CONSTRAINT `fk_ai_usage_customer_user` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_usage_model_config` FOREIGN KEY (`model_config_id`) REFERENCES `ai_model_configs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI调用用量记录表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_quota_accounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '额度账户ID',
  `provider_code` varchar(50) NOT NULL COMMENT '厂商编码',
  `quota_limit` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT '额度上限，0表示不限',
  `used_amount` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT '已使用额度',
  `currency` varchar(10) NOT NULL DEFAULT 'TOKEN' COMMENT '额度单位',
  `refresh_strategy` enum('manual','daily','monthly') NOT NULL DEFAULT 'manual' COMMENT '刷新策略',
  `last_refreshed_at` datetime(6) DEFAULT NULL COMMENT '最近刷新时间',
  `next_refresh_at` datetime(6) DEFAULT NULL COMMENT '下次刷新时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_quota_provider` (`provider_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='AI额度账户表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_dynamic_types` (
  `type_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '动态类型ID',
  `type_name` varchar(100) NOT NULL COMMENT '动态类型名称',
  `type_remark` varchar(255) DEFAULT NULL COMMENT '动态类型备注',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0启用，1禁用',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `uk_forum_dynamic_types_name` (`type_name`),
  KEY `idx_forum_dynamic_types_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='论坛动态类型表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_dynamics` (
  `id` varchar(32) NOT NULL COMMENT '动态ID',
  `customer_id` bigint unsigned NOT NULL COMMENT '发布用户ID',
  `type_id` bigint unsigned NOT NULL,
  `title` varchar(200) DEFAULT NULL COMMENT '动态标题',
  `content` text NOT NULL COMMENT '动态内容',
  `media` json NOT NULL COMMENT '媒体素材数组',
  `topic` varchar(100) NOT NULL COMMENT '话题',
  `like_count` int unsigned NOT NULL DEFAULT '0' COMMENT '点赞数',
  `comment_count` int unsigned NOT NULL DEFAULT '0' COMMENT '评论数',
  `favorite_count` int unsigned NOT NULL DEFAULT '0' COMMENT '收藏数',
  `share_count` int unsigned NOT NULL DEFAULT '0' COMMENT '转发数',
  `pinned` tinyint NOT NULL DEFAULT '0' COMMENT '是否置顶：1是，0否',
  `audit_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `enabled` tinyint NOT NULL DEFAULT '0' COMMENT '启用状态：1启用，0禁用',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '发布时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '修改时间',
  PRIMARY KEY (`id`),
  KEY `idx_forum_dynamics_customer_id` (`customer_id`),
  KEY `idx_forum_dynamics_topic` (`topic`),
  KEY `idx_forum_dynamics_pinned` (`pinned`),
  KEY `idx_forum_dynamics_created_at` (`created_at`),
  KEY `idx_forum_dynamics_type_id` (`type_id`),
  KEY `idx_forum_dynamics_audit_status` (`audit_status`,`enabled`),
  CONSTRAINT `fk_forum_dynamics_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_forum_dynamics_type_id` FOREIGN KEY (`type_id`) REFERENCES `forum_dynamic_types` (`type_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C端论坛动态表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_change_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '变更记录ID',
  `target_type` varchar(32) NOT NULL DEFAULT 'forum_dynamic' COMMENT '目标记录类型',
  `target_id` varchar(32) NOT NULL COMMENT '动态记录ID',
  `owner_id` bigint unsigned NOT NULL COMMENT '动态所属C端用户ID',
  `editor_id` bigint unsigned NOT NULL COMMENT '动态编辑者ID',
  `editor_type` enum('customer','admin') NOT NULL COMMENT '编辑者类型',
  `action` varchar(32) NOT NULL COMMENT '变更动作',
  `changed_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '变更时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '变更备注',
  `attachments` text COMMENT '附件链接文本，由前端自行解析',
  PRIMARY KEY (`id`),
  KEY `idx_forum_change_logs_target_id` (`target_id`),
  KEY `idx_forum_change_logs_owner_id` (`owner_id`),
  KEY `idx_forum_change_logs_editor` (`editor_type`,`editor_id`),
  KEY `idx_forum_change_logs_action` (`action`),
  KEY `idx_forum_change_logs_changed_at` (`changed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='论坛动态变更记录表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_dynamic_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dynamic_id` varchar(32) NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dynamic_likes_user` (`dynamic_id`,`customer_id`),
  KEY `idx_dynamic_likes_customer` (`customer_id`,`created_at`),
  CONSTRAINT `fk_dynamic_likes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dynamic_likes_dynamic` FOREIGN KEY (`dynamic_id`) REFERENCES `forum_dynamics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态点赞当前状态表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_dynamic_favorites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dynamic_id` varchar(32) NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dynamic_favorites_user` (`dynamic_id`,`customer_id`),
  KEY `idx_dynamic_favorites_customer` (`customer_id`,`created_at`),
  CONSTRAINT `fk_dynamic_favorites_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dynamic_favorites_dynamic` FOREIGN KEY (`dynamic_id`) REFERENCES `forum_dynamics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态收藏当前状态表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_dynamic_share_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dynamic_id` varchar(32) NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `channel` varchar(50) DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dynamic_shares_request` (`request_id`),
  KEY `idx_dynamic_shares_dynamic` (`dynamic_id`,`created_at`),
  KEY `idx_dynamic_shares_customer` (`customer_id`,`created_at`),
  CONSTRAINT `fk_dynamic_shares_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dynamic_shares_dynamic` FOREIGN KEY (`dynamic_id`) REFERENCES `forum_dynamics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态分享事件表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dynamic_id` varchar(32) NOT NULL,
  `root_id` bigint unsigned DEFAULT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `reply_to_customer_id` bigint unsigned DEFAULT NULL,
  `content` text NOT NULL,
  `audit_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `like_count` int unsigned NOT NULL DEFAULT '0',
  `reply_count` int unsigned NOT NULL DEFAULT '0',
  `deleted_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_comments_dynamic` (`dynamic_id`,`root_id`,`created_at`,`id`),
  KEY `idx_comments_parent` (`parent_id`,`created_at`,`id`),
  KEY `idx_comments_customer` (`customer_id`,`created_at`),
  KEY `fk_comments_reply_to` (`reply_to_customer_id`),
  CONSTRAINT `fk_comments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_dynamic` FOREIGN KEY (`dynamic_id`) REFERENCES `forum_dynamics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_reply_to` FOREIGN KEY (`reply_to_customer_id`) REFERENCES `customer_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态评论表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_interaction_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dynamic_id` varchar(32) NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `action` enum('like','unlike','favorite','unfavorite','share','comment','delete_comment') NOT NULL,
  `target_id` varchar(64) DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_interaction_events_dynamic` (`dynamic_id`,`created_at`),
  KEY `idx_interaction_events_customer` (`customer_id`,`created_at`),
  KEY `idx_interaction_events_action` (`action`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态互动事件流水表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_activity_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recipient_id` bigint unsigned NOT NULL,
  `actor_id` bigint unsigned NOT NULL,
  `type` enum('dynamic_like','dynamic_comment','comment_reply','user_follow') NOT NULL COMMENT '通知类型',
  `dynamic_id` varchar(32) DEFAULT NULL COMMENT '关联动态ID，关注通知为空',
  `target_id` varchar(64) DEFAULT NULL,
  `is_read` tinyint NOT NULL DEFAULT '0',
  `withdrawn_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_notification` (`recipient_id`,`actor_id`,`type`,`dynamic_id`,`target_id`),
  KEY `idx_activity_recipient` (`recipient_id`,`is_read`,`created_at`),
  KEY `idx_activity_dynamic` (`dynamic_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态互动作者通知表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_follows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '关注记录ID',
  `follower_id` bigint unsigned NOT NULL COMMENT '关注发起用户ID',
  `following_id` bigint unsigned NOT NULL COMMENT '被关注用户ID',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_follows_pair` (`follower_id`,`following_id`),
  KEY `idx_customer_follows_following` (`following_id`,`created_at`),
  CONSTRAINT `fk_customer_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_follows_following` FOREIGN KEY (`following_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C端用户关注关系表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_im_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '私信消息ID',
  `sender_id` bigint unsigned NOT NULL COMMENT '发送用户ID',
  `recipient_id` bigint unsigned NOT NULL COMMENT '接收用户ID',
  `content` text NOT NULL COMMENT '消息内容',
  `delivery_mode` enum('guestbook','chat') NOT NULL DEFAULT 'guestbook' COMMENT '留言模式或好友聊天模式',
  `request_id` varchar(100) DEFAULT NULL COMMENT '客户端幂等请求ID',
  `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '是否已读：1是，0否',
  `read_at` datetime(6) DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '发送时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_im_request` (`request_id`),
  KEY `idx_customer_im_sender` (`sender_id`,`recipient_id`,`created_at`),
  KEY `idx_customer_im_recipient` (`recipient_id`,`sender_id`,`created_at`),
  KEY `idx_customer_im_unread` (`recipient_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_customer_im_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_im_sender` FOREIGN KEY (`sender_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C端用户留言与聊天消息表';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `customer_a_id` bigint unsigned NOT NULL COMMENT '较小的用户ID',
  `customer_b_id` bigint unsigned NOT NULL COMMENT '较大的用户ID',
  `last_message_id` bigint unsigned DEFAULT NULL COMMENT '最后一条消息ID',
  `last_message_at` datetime(6) DEFAULT NULL COMMENT '最后一条消息时间',
  `pinned_by_a` tinyint NOT NULL DEFAULT '0' COMMENT 'A用户是否置顶',
  `pinned_by_b` tinyint NOT NULL DEFAULT '0' COMMENT 'B用户是否置顶',
  `deleted_by_a` tinyint NOT NULL DEFAULT '0' COMMENT 'A用户是否隐藏会话',
  `deleted_by_b` tinyint NOT NULL DEFAULT '0' COMMENT 'B用户是否隐藏会话',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_conversation_pair` (`customer_a_id`,`customer_b_id`),
  KEY `idx_customer_conversation_a` (`customer_a_id`,`last_message_at`),
  KEY `idx_customer_conversation_b` (`customer_b_id`,`last_message_at`),
  CONSTRAINT `fk_customer_conversation_a` FOREIGN KEY (`customer_a_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_customer_conversation_b` FOREIGN KEY (`customer_b_id`) REFERENCES `customer_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C端用户一对一会话表';
/*!40101 SET character_set_client = @saved_cs_client */;
