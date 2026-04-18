<?php
/**
 * Doom FPS - AJAX API
 * @author Haibin
 * @date 2026-04-18
 */

function document_doom_salt() {
	return 'doom_' . date( 'Y-m-d' ) . '_' . wp_salt( 'auth' );
}

/**
 * Submit score
 */
function document_doom_submit() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_doom_scores';

	$name     = sanitize_text_field( $_POST['name'] ?? '' );
	$score    = intval( $_POST['score'] ?? 0 );
	$kills    = intval( $_POST['kills'] ?? 0 );
	$duration = intval( $_POST['duration'] ?? 0 );
	$token    = sanitize_text_field( $_POST['token'] ?? '' );

	$name = mb_substr( trim( $name ), 0, 20 );
	if ( empty( $name ) ) {
		wp_send_json_error( 'Name is required' );
	}
	if ( $score < 0 || $score > 99999 ) {
		wp_send_json_error( 'Invalid score' );
	}
	if ( $duration < 0 || $duration > 36000 ) {
		wp_send_json_error( 'Invalid duration' );
	}

	// Anti-cheat token check
	$expected = md5( $score . '_' . $duration . '_' . md5( document_doom_salt() ) );
	if ( $token !== $expected ) {
		wp_send_json_error( 'Invalid token' );
	}

	// Rate limit: 1 submission per 5 seconds per IP
	$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
	$transient_key = 'doom_rate_' . md5( $ip );
	if ( get_transient( $transient_key ) ) {
		wp_send_json_error( 'Too fast, please wait' );
	}
	set_transient( $transient_key, 1, 5 );

	$wpdb->insert( $table, [
		'player_name' => $name,
		'score'       => $score,
		'kills'       => $kills,
		'duration'    => $duration,
	], [ '%s', '%d', '%d', '%d' ] );

	$id = $wpdb->insert_id;

	$rank = $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*) + 1 FROM $table WHERE score > %d", $score
	) );

	document_doom_cleanup();

	wp_send_json_success( [
		'id'   => $id,
		'rank' => intval( $rank ),
	] );
}
add_action( 'wp_ajax_doom_submit', 'document_doom_submit' );
add_action( 'wp_ajax_nopriv_doom_submit', 'document_doom_submit' );

/**
 * Get leaderboard
 */
function document_doom_leaderboard() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_doom_scores';

	$type = sanitize_text_field( $_POST['type'] ?? 'alltime' );

	$where = '';
	$limit = 20;
	if ( $type === 'weekly' ) {
		$where = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
		$limit = 10;
	}

	$rows = $wpdb->get_results(
		"SELECT player_name, score, kills, duration, created_at FROM $table $where ORDER BY score DESC, duration ASC LIMIT $limit",
		ARRAY_A
	);

	wp_send_json_success( $rows ?: [] );
}
add_action( 'wp_ajax_doom_leaderboard', 'document_doom_leaderboard' );
add_action( 'wp_ajax_nopriv_doom_leaderboard', 'document_doom_leaderboard' );

/**
 * Cleanup old and excess scores
 */
function document_doom_cleanup() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_doom_scores';

	$wpdb->query( "DELETE FROM $table WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 WEEK)" );

	$keep_ids = $wpdb->get_col( "SELECT id FROM $table ORDER BY score DESC, duration ASC LIMIT 20" );
	if ( ! empty( $keep_ids ) ) {
		$ids_str = implode( ',', array_map( 'intval', $keep_ids ) );
		$wpdb->query( "DELETE FROM $table WHERE id NOT IN ($ids_str)" );
	}
}
