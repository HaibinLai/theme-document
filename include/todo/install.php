<?php
/**
 * 待办事项 - 数据库表创建
 * @author Haibin
 * @date 2026-04-17
 */

function document_todo_create_table() {
	global $wpdb;
	$table_name      = $wpdb->prefix . 'document_todos';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table_name (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		title varchar(500) NOT NULL DEFAULT '',
		completed tinyint(1) NOT NULL DEFAULT 0,
		priority varchar(10) NOT NULL DEFAULT 'medium',
		due_date date DEFAULT NULL,
		sort_order int(11) NOT NULL DEFAULT 0,
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_completed (completed),
		KEY idx_priority (priority),
		KEY idx_sort_order (sort_order)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

/* 主题激活时创建表 */
add_action( 'after_switch_theme', 'document_todo_create_table' );

/* 如果表不存在则自动创建 */
function document_todo_maybe_create_table() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_todos';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table_name'" ) !== $table_name ) {
		document_todo_create_table();
	}
}
add_action( 'init', 'document_todo_maybe_create_table' );
