<?php
/**
 * Doom FPS - Database Table
 * @author Haibin
 * @date 2026-04-18
 */

function document_doom_create_table() {
	global $wpdb;
	$table   = $wpdb->prefix . 'document_doom_scores';
	$charset = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table (
		id         BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
		player_name VARCHAR(50)        NOT NULL,
		score      INT(11)             NOT NULL DEFAULT 0,
		kills      INT(11)             NOT NULL DEFAULT 0,
		duration   INT(11)             NOT NULL DEFAULT 0,
		created_at DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_score   (score DESC),
		KEY idx_created (created_at)
	) $charset;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

add_action( 'after_switch_theme', 'document_doom_create_table' );

add_action( 'init', function () {
	global $wpdb;
	$table = $wpdb->prefix . 'document_doom_scores';
	if ( $wpdb->get_var( "SHOW TABLES LIKE '$table'" ) !== $table ) {
		document_doom_create_table();
	}
} );
