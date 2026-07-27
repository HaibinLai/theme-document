<?php

/*
 * 评论反垃圾防护
 * @date 2026-05-10
 * */

add_filter( 'preprocess_comment', 'nicen_antispam_check' );
add_action( 'init', 'nicen_antispam_block_banned_visitors', 0 );

function nicen_antispam_get_blocklist() {
	return apply_filters( 'nicen_theme_comment_blocklist', [
		'emails' => [
			'36836008@outlook.com',
		],
		'ips' => [
			'113.16.16.177',
		],
		'content_markers' => [
			'binance.bh',
		],
		'permanent_content_markers' => [
			'www.binance.com',
		],
	] );
}

function nicen_antispam_get_request_ip() {
	$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) );

	return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '';
}

function nicen_antispam_contains_marker( $commentdata, $markers ) {
	$content    = strtolower( (string) ( $commentdata['comment_content'] ?? '' ) );
	$author_url = strtolower( (string) ( $commentdata['comment_author_url'] ?? '' ) );

	foreach ( (array) $markers as $marker ) {
		$marker = strtolower( trim( (string) $marker ) );
		if ( $marker !== '' && ( strpos( $content, $marker ) !== false || strpos( $author_url, $marker ) !== false ) ) {
			return true;
		}
	}

	return false;
}

function nicen_antispam_ip_option_name( $ip ) {
	return 'nicen_theme_blocked_ip_' . md5( $ip );
}

function nicen_antispam_is_ip_banned( $ip ) {
	if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
		return false;
	}

	return false !== get_option( nicen_antispam_ip_option_name( $ip ), false );
}

function nicen_antispam_ban_ip( $ip ) {
	if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
		return;
	}

	update_option(
		nicen_antispam_ip_option_name( $ip ),
		[
			'ip'         => $ip,
			'blocked_at' => current_time( 'mysql', true ),
		],
		false
	);
}

function nicen_antispam_block_banned_visitors() {
	if ( current_user_can( 'manage_options' ) ) {
		return;
	}

	$ip = nicen_antispam_get_request_ip();
	if ( ! nicen_antispam_is_ip_banned( $ip ) ) {
		return;
	}

	status_header( 403 );
	nocache_headers();
	wp_die( '访问被拒绝。', '禁止访问', [ 'response' => 403 ] );
}

function nicen_antispam_is_blocked( $commentdata, $ip, $blocklist = null ) {
	$blocklist = is_array( $blocklist ) ? $blocklist : nicen_antispam_get_blocklist();
	$email     = strtolower( trim( $commentdata['comment_author_email'] ?? '' ) );

	if ( in_array( $email, $blocklist['emails'], true ) || in_array( $ip, $blocklist['ips'], true ) ) {
		return true;
	}

	return nicen_antispam_contains_marker( $commentdata, $blocklist['content_markers'] ?? [] );
}

function nicen_antispam_check( $commentdata ) {

	if ( current_user_can( 'manage_options' ) ) {
		return $commentdata;
	}

	$content   = $commentdata['comment_content'];
	$ip        = nicen_antispam_get_request_ip();
	$blocklist = nicen_antispam_get_blocklist();

	if ( nicen_antispam_contains_marker( $commentdata, $blocklist['permanent_content_markers'] ?? [] ) ) {
		nicen_antispam_ban_ip( $ip );
		wp_die( '评论提交失败。', '评论被拦截', [ 'back_link' => true, 'response' => 403 ] );
	}

	if ( nicen_antispam_is_blocked( $commentdata, $ip, $blocklist ) ) {
		wp_die( '评论提交失败。', '评论被拦截', array( 'back_link' => true, 'response' => 403 ) );
	}

	// 蜜罐字段检测
	if ( ! empty( $_POST['website_url'] ) ) {
		wp_die( '评论提交失败：检测到异常请求。', '评论被拦截', array( 'back_link' => true, 'response' => 403 ) );
	}

	// 提交时间检测（< 3秒）
	if ( isset( $_POST['comment_timestamp'] ) && is_numeric( $_POST['comment_timestamp'] ) ) {
		$elapsed = time() - intval( $_POST['comment_timestamp'] );
		if ( $elapsed < 3 ) {
			wp_die( '评论提交失败：提交速度过快，请稍后再试。', '评论被拦截', array( 'back_link' => true, 'response' => 429 ) );
		}
	}

	// 频率限制（同一 IP 60秒内只能评论一次）
	$transient_key = 'comment_cooldown_' . md5( $ip );
	if ( get_transient( $transient_key ) ) {
		wp_die( '评论提交失败：您的评论过于频繁，请 60 秒后再试。', '评论被拦截', array( 'back_link' => true, 'response' => 429 ) );
	}
	set_transient( $transient_key, 1, 60 );

	// 评论长度检测（> 10000 字）
	if ( mb_strlen( $content, 'UTF-8' ) > 10000 ) {
		wp_die( '评论提交失败：评论内容过长，请控制在 10000 字以内。', '评论被拦截', array( 'back_link' => true, 'response' => 400 ) );
	}

	// 链接数量检测（> 10 个）
	$link_count = preg_match_all( '/https?:\/\/|<a\s/i', $content, $matches );
	if ( $link_count > 10 ) {
		wp_die( '评论提交失败：评论中包含过多链接，最多允许 10 个。', '评论被拦截', array( 'back_link' => true, 'response' => 400 ) );
	}

	return $commentdata;
}
