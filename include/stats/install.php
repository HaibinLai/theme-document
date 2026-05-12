<?php
/**
 * 阅读统计 - 数据库表
 */

function document_stats_create_table() {
	global $wpdb;
	$table_name      = $wpdb->prefix . 'document_view_logs';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table_name (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		post_id bigint(20) unsigned NOT NULL,
		view_date date NOT NULL,
		view_count int(11) unsigned NOT NULL DEFAULT 1,
		PRIMARY KEY (id),
		UNIQUE KEY uk_post_date (post_id, view_date),
		KEY idx_view_date (view_date),
		KEY idx_post_id (post_id)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

add_action( 'after_switch_theme', 'document_stats_create_table' );

function document_stats_maybe_create_table() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_view_logs';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table_name'" ) !== $table_name ) {
		document_stats_create_table();
	}
}
add_action( 'init', 'document_stats_maybe_create_table' );
