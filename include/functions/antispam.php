<?php

/*
 * 评论反垃圾防护
 * @date 2026-05-10
 * */

add_filter( 'preprocess_comment', 'nicen_antispam_check' );

function nicen_antispam_check( $commentdata ) {

	if ( current_user_can( 'manage_options' ) ) {
		return $commentdata;
	}

	$content = $commentdata['comment_content'];

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
	$ip            = $_SERVER['REMOTE_ADDR'];
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
