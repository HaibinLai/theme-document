<?php
/**
 * 阅读统计 - AJAX API
 */

function document_stats_check_permission() {
	if ( ! is_user_logged_in() ) {
		wp_send_json_error( '请先登录', 403 );
	}
}

/**
 * 概览：总浏览量、今日浏览、文章总数、篇均浏览
 */
function document_stats_overview() {
	document_stats_check_permission();
	global $wpdb;

	$log_table = $wpdb->prefix . 'document_view_logs';
	$today     = current_time( 'Y-m-d' );

	$total_views = (int) $wpdb->get_var(
		"SELECT COALESCE(SUM(meta_value+0), 0) FROM $wpdb->postmeta
		 WHERE meta_key = 'post_views_count'"
	);

	$total_posts = (int) $wpdb->get_var(
		"SELECT COUNT(*) FROM $wpdb->posts
		 WHERE post_type = 'post' AND post_status = 'publish'"
	);

	$today_views = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT COALESCE(SUM(view_count), 0) FROM $log_table WHERE view_date = %s",
		$today
	) );

	$avg_views = $total_posts > 0 ? round( $total_views / $total_posts ) : 0;

	wp_send_json_success( [
		'total_views' => $total_views,
		'today_views' => $today_views,
		'total_posts' => $total_posts,
		'avg_views'   => $avg_views,
	] );
}
add_action( 'wp_ajax_stats_overview', 'document_stats_overview' );

/**
 * 热门文章 Top N
 */
function document_stats_popular() {
	document_stats_check_permission();
	global $wpdb;

	$limit  = min( 50, max( 1, intval( $_POST['limit'] ?? 20 ) ) );
	$period = sanitize_text_field( $_POST['period'] ?? 'all' );

	if ( $period !== 'all' && in_array( $period, [ '7', '30', '90' ] ) ) {
		$log_table = $wpdb->prefix . 'document_view_logs';
		$days      = intval( $period );
		$rows      = $wpdb->get_results( $wpdb->prepare(
			"SELECT p.ID, p.post_title, p.post_date, SUM(vl.view_count) as views
			 FROM $log_table vl
			 INNER JOIN $wpdb->posts p ON vl.post_id = p.ID
			 WHERE vl.view_date >= DATE_SUB(%s, INTERVAL %d DAY)
			   AND p.post_type = 'post' AND p.post_status = 'publish'
			 GROUP BY vl.post_id
			 ORDER BY views DESC
			 LIMIT %d",
			current_time( 'Y-m-d' ), $days, $limit
		) );
	} else {
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT p.ID, p.post_title, p.post_date, CAST(pm.meta_value AS UNSIGNED) as views
			 FROM $wpdb->posts p
			 INNER JOIN $wpdb->postmeta pm ON p.ID = pm.post_id AND pm.meta_key = 'post_views_count'
			 WHERE p.post_type = 'post' AND p.post_status = 'publish'
			 ORDER BY views DESC
			 LIMIT %d",
			$limit
		) );
	}

	$items = [];
	foreach ( $rows as $row ) {
		$items[] = [
			'id'        => (int) $row->ID,
			'title'     => $row->post_title,
			'views'     => (int) $row->views,
			'date'      => date( 'Y-m-d', strtotime( $row->post_date ) ),
			'permalink' => get_permalink( $row->ID ),
		];
	}

	wp_send_json_success( $items );
}
add_action( 'wp_ajax_stats_popular', 'document_stats_popular' );

/**
 * 访问趋势（每日浏览量）
 */
function document_stats_trend() {
	document_stats_check_permission();
	global $wpdb;

	$days      = min( 90, max( 7, intval( $_POST['days'] ?? 30 ) ) );
	$log_table = $wpdb->prefix . 'document_view_logs';
	$today     = current_time( 'Y-m-d' );

	$rows = $wpdb->get_results( $wpdb->prepare(
		"SELECT view_date, SUM(view_count) as views
		 FROM $log_table
		 WHERE view_date >= DATE_SUB(%s, INTERVAL %d DAY)
		 GROUP BY view_date
		 ORDER BY view_date ASC",
		$today, $days
	) );

	$map = [];
	foreach ( $rows as $row ) {
		$map[ $row->view_date ] = (int) $row->views;
	}

	$labels = [];
	$values = [];
	$start  = strtotime( "-{$days} days", strtotime( $today ) );
	$end    = strtotime( $today );

	for ( $ts = $start; $ts <= $end; $ts += 86400 ) {
		$d        = date( 'Y-m-d', $ts );
		$labels[] = $d;
		$values[] = $map[ $d ] ?? 0;
	}

	wp_send_json_success( [
		'labels' => $labels,
		'values' => $values,
	] );
}
add_action( 'wp_ajax_stats_trend', 'document_stats_trend' );
