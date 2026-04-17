<?php
/**
 * Clipboard Helper - Database table creation
 * @author Haibin
 * @date 2026-04-17
 */

function document_clipboard_create_table() {
	global $wpdb;
	$table_name      = $wpdb->prefix . 'document_clipboard';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table_name (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		user_id bigint(20) unsigned NOT NULL,
		type varchar(10) NOT NULL DEFAULT 'text',
		content longtext,
		filename varchar(255) DEFAULT NULL,
		filepath varchar(500) DEFAULT NULL,
		filesize bigint(20) unsigned NOT NULL DEFAULT 0,
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_user_id (user_id),
		KEY idx_created (created_at),
		KEY idx_type (type)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

/* Create table on theme activation */
add_action( 'after_switch_theme', 'document_clipboard_create_table' );

/* Auto-create table if not exists */
function document_clipboard_maybe_create_table() {
	global $wpdb;
	$table_name = $wpdb->prefix . 'document_clipboard';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table_name'" ) !== $table_name ) {
		document_clipboard_create_table();
	}
}
add_action( 'init', 'document_clipboard_maybe_create_table' );
