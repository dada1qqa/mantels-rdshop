-- Migración completa para TiDB Cloud - 13 tablas
-- Compatible con TiDB (sin ON UPDATE CURRENT_TIMESTAMP, JSON defaults con JSON_OBJECT())

-- ============================================================
-- TABLA: banners
-- ============================================================
CREATE TABLE `banners` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500),
  `image_url` varchar(500) NOT NULL,
  `image_alt` varchar(255),
  `button_text` varchar(100),
  `button_href` varchar(500),
  `sort_order` int DEFAULT 0,
  `is_active` boolean DEFAULT true,
  `starts_at` datetime(6),
  `ends_at` datetime(6),
  `location` varchar(20) NOT NULL DEFAULT 'home',
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_banners_location` ON `banners` (`location`);
CREATE INDEX `idx_banners_active` ON `banners` (`is_active`);
CREATE INDEX `idx_banners_dates` ON `banners` (`starts_at`, `ends_at`);

-- ============================================================
-- TABLA: customization_versions
-- ============================================================
CREATE TABLE `customization_versions` (
  `id` char(36) NOT NULL,
  `version_number` int NOT NULL,
  `theme_settings` json NOT NULL,
  `site_settings` json NOT NULL,
  `menu_items` json NOT NULL,
  `banners` json NOT NULL,
  `change_summary` text,
  `created_by` char(36),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_customization_versions_number` ON `customization_versions` (`version_number`);

-- ============================================================
-- TABLA: menu_items
-- ============================================================
CREATE TABLE `menu_items` (
  `id` char(36) NOT NULL,
  `label` varchar(100) NOT NULL,
  `href` varchar(500) NOT NULL,
  `icon` varchar(50),
  `parent_id` char(36),
  `location` varchar(20) NOT NULL DEFAULT 'main',
  `sort_order` int DEFAULT 0,
  `is_active` boolean DEFAULT true,
  `visibility_rule` varchar(20) NOT NULL DEFAULT 'all',
  `open_in_new_tab` boolean DEFAULT false,
  `description` text,
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_menu_items_parent_id` ON `menu_items` (`parent_id`);
CREATE INDEX `idx_menu_items_location` ON `menu_items` (`location`);
CREATE INDEX `idx_menu_items_sort_order` ON `menu_items` (`location`, `sort_order`);
CREATE INDEX `idx_menu_items_active` ON `menu_items` (`is_active`);

-- ============================================================
-- TABLA: notifications
-- ============================================================
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `request_id` char(36),
  `order_event_id` char(36),
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `read` boolean DEFAULT false,
  `action_url` varchar(500),
  `metadata` json DEFAULT (JSON_OBJECT()),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `read_at` datetime(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_notifications_user_id` ON `notifications` (`user_id`);
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user_id`, `read`);
CREATE INDEX `idx_notifications_created_at` ON `notifications` (`created_at`);

-- ============================================================
-- TABLA: order_events
-- ============================================================
CREATE TABLE `order_events` (
  `id` char(36) NOT NULL,
  `request_id` char(36) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50),
  `event_date` datetime NOT NULL,
  `start_time` datetime,
  `end_time` datetime,
  `end_date` datetime,
  `is_estimated` boolean DEFAULT false,
  `is_range` boolean DEFAULT false,
  `tolerance_days` int,
  `is_visible_to_customer` boolean DEFAULT true,
  `created_by` char(36),
  `metadata` json DEFAULT (JSON_OBJECT()),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_order_events_request_id` ON `order_events` (`request_id`);
CREATE INDEX `idx_order_events_event_date` ON `order_events` (`event_date`);
CREATE INDEX `idx_order_events_event_type` ON `order_events` (`event_type`);
CREATE INDEX `idx_order_events_visible` ON `order_events` (`is_visible_to_customer`);

-- ============================================================
-- TABLA: profiles
-- ============================================================
CREATE TABLE `profiles` (
  `id` char(36) NOT NULL,
  `full_name` varchar(255),
  `avatar_url` varchar(500),
  `phone` varchar(50),
  `address` text,
  `city` varchar(100),
  `country` varchar(100) DEFAULT 'República Dominicana',
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `notification_prefs` json DEFAULT (JSON_OBJECT(
    'orderUpdates', true,
    'paymentReminders', true,
    'deliveryUpdates', true,
    'promotions', false,
    'newsletter', false,
    'securityAlerts', true
  )),
  `preferences` json DEFAULT (JSON_OBJECT(
    'theme', 'system',
    'language', 'es-DO',
    'currency', 'DOP',
    'dateFormat', 'DD/MM/YYYY',
    'timeFormat', '24h'
  )),
  `email_notifications` json DEFAULT (JSON_OBJECT(
    'orderUpdates', true,
    'paymentReminders', true,
    'deliveryUpdates', true,
    'promotions', false,
    'newsletter', false,
    'securityAlerts', true
  )),
  `privacy_settings` json DEFAULT (JSON_OBJECT(
    'profileVisibility', 'private',
    'showOrderHistory', false,
    'analyticsConsent', true,
    'marketingConsent', false
  )),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_profiles_role` ON `profiles` (`role`);

-- ============================================================
-- TABLA: reminder_logs
-- ============================================================
CREATE TABLE `reminder_logs` (
  `id` char(36) NOT NULL,
  `request_id` char(36) NOT NULL,
  `order_event_id` char(36),
  `reminder_type` varchar(50) NOT NULL,
  `channel` varchar(50) DEFAULT 'notification',
  `sent_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `dedup_key` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reminder_logs_dedup_key_unique` (`dedup_key`)
);

CREATE INDEX `idx_reminder_logs_request_id` ON `reminder_logs` (`request_id`);
CREATE INDEX `idx_reminder_logs_dedup` ON `reminder_logs` (`dedup_key`);

-- ============================================================
-- TABLA: requests
-- ============================================================
CREATE TABLE `requests` (
  `id` char(36) NOT NULL,
  `request_code` varchar(50) NOT NULL,
  `user_id` char(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_url` varchar(1000),
  `product_image` varchar(500),
  `quantity` int DEFAULT 1,
  `estimated_price` int,
  `final_price` int,
  `currency` varchar(3) DEFAULT 'DOP',
  `status` varchar(50) NOT NULL DEFAULT 'recibida',
  `customer_name` varchar(255),
  `customer_phone` varchar(50),
  `customer_email` varchar(255),
  `shipping_address` text,
  `shipping_city` varchar(100),
  `shipping_country` varchar(100) DEFAULT 'República Dominicana',
  `notes` text,
  `admin_notes` text,
  `estimated_delivery_date` datetime,
  `estimated_delivery_end_date` datetime,
  `estimated_delivery_time` datetime,
  `estimated_delivery_end_time` datetime,
  `delivery_tolerance_days` int,
  `price_accepted` boolean DEFAULT false,
  `price_accepted_at` datetime(6),
  `paid_at` datetime(6),
  `purchased_at` datetime(6),
  `shipped_at` datetime(6),
  `delivered_at` datetime(6),
  `tracking_number` varchar(100),
  `tracking_url` varchar(500),
  `priority` int DEFAULT 0,
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `requests_request_code_unique` (`request_code`)
);

CREATE INDEX `idx_requests_user_id` ON `requests` (`user_id`);
CREATE INDEX `idx_requests_status` ON `requests` (`status`);
CREATE INDEX `idx_requests_request_code` ON `requests` (`request_code`);
CREATE INDEX `idx_requests_created_at` ON `requests` (`created_at`);

-- ============================================================
-- TABLA: sessions
-- ============================================================
CREATE TABLE `sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);

-- ============================================================
-- TABLA: site_settings
-- ============================================================
CREATE TABLE `site_settings` (
  `id` char(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` json NOT NULL DEFAULT (JSON_OBJECT()),
  `description` text,
  `is_public` boolean DEFAULT false,
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_unique` (`key`)
);

-- ============================================================
-- TABLA: theme_settings
-- ============================================================
CREATE TABLE `theme_settings` (
  `id` char(36) NOT NULL,
  `site_name` varchar(100) NOT NULL DEFAULT 'MantelsioRDshop',
  `site_tagline` varchar(255),
  `logo_url` varchar(500),
  `logo_dark_url` varchar(500),
  `favicon_url` varchar(500),
  `og_image_url` varchar(500),
  `footer_text` varchar(255),
  `color_primary` varchar(50) DEFAULT 'oklch(68% 0.28 330)',
  `color_secondary` varchar(50) DEFAULT 'oklch(72% 0.20 195)',
  `color_accent` varchar(50) DEFAULT 'oklch(62% 0.22 150)',
  `color_background` varchar(50) DEFAULT 'oklch(4% 0.015 270)',
  `color_card` varchar(50) DEFAULT 'oklch(10% 0.02 270)',
  `color_text_primary` varchar(50) DEFAULT 'oklch(98.5% 0.002 270)',
  `color_text_secondary` varchar(50) DEFAULT 'oklch(65% 0.02 270)',
  `color_border` varchar(50) DEFAULT 'oklch(16% 0.025 270)',
  `color_button_primary` varchar(50) DEFAULT 'oklch(68% 0.28 330)',
  `color_button_secondary` varchar(50) DEFAULT 'oklch(72% 0.20 195)',
  `color_link` varchar(50) DEFAULT 'oklch(72% 0.20 195)',
  `theme_mode` varchar(20) NOT NULL DEFAULT 'system',
  `border_radius` varchar(20) DEFAULT '1rem',
  `card_style` varchar(20) DEFAULT 'double-bezel',
  `visual_density` varchar(20) DEFAULT 'normal',
  `button_size` varchar(20) DEFAULT 'normal',
  `spacing_scale` varchar(20) DEFAULT 'normal',
  `font_primary` varchar(100) DEFAULT 'Plus Jakarta Sans',
  `font_base_size` varchar(20) DEFAULT '1rem',
  `font_heading_weight` varchar(10) DEFAULT '700',
  `font_heading_scale` varchar(20) DEFAULT '1.2',
  `header_show_logo` boolean DEFAULT true,
  `header_logo_size` varchar(20) DEFAULT 'normal',
  `header_alignment` varchar(20) DEFAULT 'center',
  `header_background_style` varchar(20) DEFAULT 'glass',
  `header_show_search` boolean DEFAULT false,
  `header_cta_text` varchar(100) DEFAULT 'Solicitar artículo',
  `header_cta_href` varchar(255) DEFAULT '/solicitar',
  `footer_show_contact` boolean DEFAULT true,
  `footer_show_social` boolean DEFAULT true,
  `footer_show_policies` boolean DEFAULT true,
  `footer_columns_layout` varchar(10) DEFAULT 'auto',
  `footer_contact_email` varchar(255),
  `footer_contact_phone` varchar(50),
  `footer_address` text,
  `is_published` boolean DEFAULT true,
  `published_at` datetime(6),
  `published_by` char(36),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` boolean DEFAULT false,
  `password_hash` varchar(255),
  `full_name` varchar(255),
  `avatar_url` varchar(500),
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `last_login_at` datetime(6),
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
);

CREATE INDEX `idx_users_email` ON `users` (`email`);

-- ============================================================
-- TABLA: verification_tokens
-- ============================================================
CREATE TABLE `verification_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` timestamp(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `verification_tokens_token_unique` (`token`)
);

CREATE INDEX `idx_verification_tokens_user_id` ON `verification_tokens` (`user_id`);
CREATE INDEX `idx_verification_tokens_token` ON `verification_tokens` (`token`);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_order_event_id_order_events_id_fk` FOREIGN KEY (`order_event_id`) REFERENCES `order_events`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `order_events` ADD CONSTRAINT `order_events_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `order_events` ADD CONSTRAINT `order_events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `reminder_logs` ADD CONSTRAINT `reminder_logs_request_id_requests_id_fk` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE `reminder_logs` ADD CONSTRAINT `reminder_logs_order_event_id_order_events_id_fk` FOREIGN KEY (`order_event_id`) REFERENCES `order_events`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE `verification_tokens` ADD CONSTRAINT `verification_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;