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
		archived tinyint(1) NOT NULL DEFAULT 0,
		archived_at datetime DEFAULT NULL,
		priority varchar(10) NOT NULL DEFAULT 'medium',
		importance tinyint(1) NOT NULL DEFAULT 3,
		due_date date DEFAULT NULL,
		sort_order int(11) NOT NULL DEFAULT 0,
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_completed (completed),
		KEY idx_archived (archived),
		KEY idx_priority (priority),
		KEY idx_importance (importance),
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

/* 升级：为已有表添加 importance 字段 */
function document_todo_maybe_add_importance() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_todos';
	$column = $wpdb->get_results( "SHOW COLUMNS FROM $table_name LIKE 'importance'" );
	if ( empty( $column ) ) {
		$wpdb->query( "ALTER TABLE $table_name ADD COLUMN importance tinyint(1) NOT NULL DEFAULT 3 AFTER priority" );
		$wpdb->query( "ALTER TABLE $table_name ADD KEY idx_importance (importance)" );
	}
}
add_action( 'init', 'document_todo_maybe_add_importance' );

/* 升级：为已有表添加归档字段 */
function document_todo_maybe_add_archive() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_todos';
	$column     = $wpdb->get_results( "SHOW COLUMNS FROM $table_name LIKE 'archived'" );

	if ( empty( $column ) ) {
		$wpdb->query( "ALTER TABLE $table_name ADD COLUMN archived tinyint(1) NOT NULL DEFAULT 0 AFTER completed" );
		$wpdb->query( "ALTER TABLE $table_name ADD COLUMN archived_at datetime DEFAULT NULL AFTER archived" );
		$wpdb->query( "ALTER TABLE $table_name ADD KEY idx_archived (archived)" );
	}
}
add_action( 'init', 'document_todo_maybe_add_archive' );

/** 已完成且截止日期过去至少七天的事项自动归档；手动恢复的事项除外。 */
function document_todo_auto_archive() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';
	$cutoff = current_datetime()->modify( '-7 days' )->format( 'Y-m-d' );
	return $wpdb->query( $wpdb->prepare(
		"UPDATE $table SET archived = 1, archived_at = %s
		 WHERE completed = 1 AND archived = 0 AND archived_at IS NULL
		 AND due_date IS NOT NULL AND due_date <> '0000-00-00' AND due_date <= %s",
		current_time( 'mysql' ),
		$cutoff
	) );
}
add_action( 'document_todo_daily_archive', 'document_todo_auto_archive' );

function document_todo_schedule_archive() {
	if ( ! wp_next_scheduled( 'document_todo_daily_archive' ) ) {
		wp_schedule_event( time(), 'daily', 'document_todo_daily_archive' );
	}
}
add_action( 'init', 'document_todo_schedule_archive', 20 );

function document_todo_unschedule_archive() {
	wp_clear_scheduled_hook( 'document_todo_daily_archive' );
}
add_action( 'switch_theme', 'document_todo_unschedule_archive' );
