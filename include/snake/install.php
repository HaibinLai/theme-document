<?php
/**
 * Snake Game - Database table creation
 * @author Haibin
 * @date 2026-04-17
 */

function document_snake_create_table() {
	global $wpdb;
	$table_name      = $wpdb->prefix . 'document_snake_scores';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table_name (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		player_name varchar(50) NOT NULL,
		score int(11) NOT NULL DEFAULT 0,
		duration int(11) NOT NULL DEFAULT 0,
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_score (score),
		KEY idx_created (created_at)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

add_action( 'after_switch_theme', 'document_snake_create_table' );

function document_snake_maybe_create_table() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_snake_scores';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table_name'" ) !== $table_name ) {
		document_snake_create_table();
	}
}
add_action( 'init', 'document_snake_maybe_create_table' );
