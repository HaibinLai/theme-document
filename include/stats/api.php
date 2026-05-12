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

/**
 * Top N 文章的日趋势（多折线图数据）
 */
function document_stats_trend_posts() {
	document_stats_check_permission();
	global $wpdb;

	$days      = min( 90, max( 7, intval( $_POST['days'] ?? 30 ) ) );
	$limit     = min( 10, max( 1, intval( $_POST['limit'] ?? 5 ) ) );
	$log_table = $wpdb->prefix . 'document_view_logs';
	$today     = current_time( 'Y-m-d' );

	$top_posts = $wpdb->get_results( $wpdb->prepare(
		"SELECT vl.post_id, p.post_title, SUM(vl.view_count) as total
		 FROM $log_table vl
		 INNER JOIN $wpdb->posts p ON vl.post_id = p.ID
		 WHERE vl.view_date >= DATE_SUB(%s, INTERVAL %d DAY)
		   AND p.post_type = 'post' AND p.post_status = 'publish'
		 GROUP BY vl.post_id
		 ORDER BY total DESC
		 LIMIT %d",
		$today, $days, $limit
	) );

	if ( empty( $top_posts ) ) {
		wp_send_json_success( [ 'labels' => [], 'posts' => [] ] );
	}

	$post_ids = array_map( function ( $r ) { return (int) $r->post_id; }, $top_posts );
	$ids_str  = implode( ',', $post_ids );

	$rows = $wpdb->get_results( $wpdb->prepare(
		"SELECT post_id, view_date, view_count
		 FROM $log_table
		 WHERE post_id IN ($ids_str) AND view_date >= DATE_SUB(%s, INTERVAL %d DAY)
		 ORDER BY view_date ASC",
		$today, $days
	) );

	$data_map = [];
	foreach ( $rows as $row ) {
		$data_map[ (int) $row->post_id ][ $row->view_date ] = (int) $row->view_count;
	}

	$labels = [];
	$start  = strtotime( "-{$days} days", strtotime( $today ) );
	$end    = strtotime( $today );
	for ( $ts = $start; $ts <= $end; $ts += 86400 ) {
		$labels[] = date( 'Y-m-d', $ts );
	}

	$colors = [ '#3eaf7c', '#e6a23c', '#409eff', '#f56c6c', '#9b59b6' ];
	$posts  = [];
	foreach ( $top_posts as $i => $p ) {
		$pid    = (int) $p->post_id;
		$values = [];
		foreach ( $labels as $d ) {
			$values[] = $data_map[ $pid ][ $d ] ?? 0;
		}
		$posts[] = [
			'id'    => $pid,
			'title' => $p->post_title,
			'color' => $colors[ $i % count( $colors ) ],
			'values' => $values,
		];
	}

	wp_send_json_success( [ 'labels' => $labels, 'posts' => $posts ] );
}
add_action( 'wp_ajax_stats_trend_posts', 'document_stats_trend_posts' );

/**
 * 文章底部 Sparkline — 服务端渲染内联 SVG
 */
function document_stats_render_sparkline( $post_id ) {
	global $wpdb;
	$log_table = $wpdb->prefix . 'document_view_logs';
	$today     = current_time( 'Y-m-d' );

	$rows = $wpdb->get_results( $wpdb->prepare(
		"SELECT view_date, view_count FROM $log_table
		 WHERE post_id = %d AND view_date >= DATE_SUB(%s, INTERVAL 30 DAY)
		 ORDER BY view_date ASC",
		$post_id, $today
	) );

	$map = [];
	foreach ( $rows as $r ) {
		$map[ $r->view_date ] = (int) $r->view_count;
	}

	$values = [];
	$start  = strtotime( '-30 days', strtotime( $today ) );
	$end    = strtotime( $today );
	for ( $ts = $start; $ts <= $end; $ts += 86400 ) {
		$values[] = $map[ date( 'Y-m-d', $ts ) ] ?? 0;
	}

	$total = array_sum( $values );
	$max   = max( 1, max( $values ) );
	$n     = count( $values );
	$w     = 200;
	$h     = 40;

	$points = [];
	for ( $i = 0; $i < $n; $i++ ) {
		$x = round( $i / ( $n - 1 ) * $w, 1 );
		$y = round( $h - ( $values[ $i ] / $max * ( $h - 4 ) ) - 2, 1 );
		$points[] = "$x,$y";
	}
	$polyline = implode( ' ', $points );
	$area     = "0,$h " . $polyline . " $w,$h";

	echo '<div class="sparkline-wrap">';
	echo '<div class="sparkline-info">';
	echo '<span class="sparkline-label">近 30 天阅读趋势</span>';
	echo '<span class="sparkline-total">共 ' . number_format( $total ) . ' 次浏览</span>';
	echo '</div>';
	echo '<svg class="sparkline-svg" viewBox="0 0 ' . $w . ' ' . $h . '" preserveAspectRatio="none">';
	echo '<polygon points="' . $area . '" fill="var(--theme-color, #3eaf7c)" opacity="0.15"/>';
	echo '<polyline points="' . $polyline . '" fill="none" stroke="var(--theme-color, #3eaf7c)" stroke-width="1.5" stroke-linejoin="round"/>';
	echo '</svg>';
	echo '</div>';
}
