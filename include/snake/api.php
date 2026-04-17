<?php
/**
 * Snake Game - AJAX API
 * @author Haibin
 * @date 2026-04-17
 */

/**
 * Daily salt for anti-cheat token
 */
function document_snake_salt() {
	return 'snake_' . date( 'Y-m-d' ) . '_' . wp_salt( 'auth' );
}

/**
 * Submit score
 */
function document_snake_submit() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_snake_scores';

	$name     = sanitize_text_field( $_POST['name'] ?? '' );
	$score    = intval( $_POST['score'] ?? 0 );
	$duration = intval( $_POST['duration'] ?? 0 );
	$token    = sanitize_text_field( $_POST['token'] ?? '' );

	// Validate name
	$name = mb_substr( trim( $name ), 0, 20 );
	if ( empty( $name ) ) {
		wp_send_json_error( 'Name is required' );
	}

	// Validate score
	if ( $score < 0 || $score > 9999 ) {
		wp_send_json_error( 'Invalid score' );
	}
	if ( $duration < 0 || $duration > 36000 ) {
		wp_send_json_error( 'Invalid duration' );
	}

	// Anti-cheat token check
	$expected = md5( $score . '_' . $duration . '_' . document_snake_salt() );
	if ( $token !== $expected ) {
		wp_send_json_error( 'Invalid token' );
	}

	// Rate limit: 1 submission per 5 seconds per IP
	$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
	$transient_key = 'snake_rate_' . md5( $ip );
	if ( get_transient( $transient_key ) ) {
		wp_send_json_error( 'Too fast, please wait' );
	}
	set_transient( $transient_key, 1, 5 );

	$wpdb->insert( $table, [
		'player_name' => $name,
		'score'       => $score,
		'duration'    => $duration,
	], [ '%s', '%d', '%d' ] );

	$id = $wpdb->insert_id;

	// Get rank
	$rank = $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*) + 1 FROM $table WHERE score > %d", $score
	) );

	wp_send_json_success( [
		'id'   => $id,
		'rank' => intval( $rank ),
	] );
}
add_action( 'wp_ajax_snake_submit', 'document_snake_submit' );
add_action( 'wp_ajax_nopriv_snake_submit', 'document_snake_submit' );

/**
 * Get leaderboard
 */
function document_snake_leaderboard() {
	global $wpdb;
	$table = $wpdb->prefix . 'document_snake_scores';

	$type  = sanitize_text_field( $_POST['type'] ?? 'alltime' );
	$limit = min( 50, max( 10, intval( $_POST['limit'] ?? 20 ) ) );

	$where = '';
	if ( $type === 'weekly' ) {
		$where = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
	}

	$rows = $wpdb->get_results(
		"SELECT player_name, score, duration, created_at FROM $table $where ORDER BY score DESC, duration ASC LIMIT $limit",
		ARRAY_A
	);

	wp_send_json_success( $rows ?: [] );
}
add_action( 'wp_ajax_snake_leaderboard', 'document_snake_leaderboard' );
add_action( 'wp_ajax_nopriv_snake_leaderboard', 'document_snake_leaderboard' );
