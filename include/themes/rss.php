<?php
/**
 * RSS 订阅优化
 * - 重新启用 Feed 自动发现链接
 * - 给 RSS 条目添加封面图（media:content）
 * - 优化摘要：带封面图 + 格式化文本
 */

add_action( 'wp_head', 'feed_links', 2 );

add_action( 'rss2_ns', function () {
	echo 'xmlns:media="http://search.yahoo.com/mrss/" ' . "\n";
} );

add_action( 'rss2_item', function () {
	global $post;
	$thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
	if ( ! $thumb ) {
		$number = preg_match( '/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $post->post_content, $m );
		if ( $number ) {
			$thumb = $m[1];
		}
	}
	if ( $thumb ) {
		echo '<media:content url="' . esc_url( $thumb ) . '" medium="image"/>' . "\n";
		echo '<media:thumbnail url="' . esc_url( $thumb ) . '"/>' . "\n";
	}
} );

add_filter( 'the_excerpt_rss', function ( $excerpt ) {
	global $post;

	$thumb = get_the_post_thumbnail_url( $post->ID, 'medium' );
	if ( ! $thumb ) {
		$number = preg_match( '/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $post->post_content, $m );
		if ( $number ) {
			$thumb = $m[1];
		}
	}

	$img_html = '';
	if ( $thumb ) {
		$img_html = '<p><img src="' . esc_url( $thumb ) . '" alt="' . esc_attr( get_the_title() ) . '" style="max-width:100%;height:auto;border-radius:8px;" /></p>';
	}

	if ( empty( trim( $excerpt ) ) ) {
		$excerpt = wp_trim_words( strip_shortcodes( $post->post_content ), 120, '...' );
	}

	return $img_html . '<p>' . esc_html( $excerpt ) . '</p>';
} );

add_filter( 'the_content_feed', function ( $content ) {
	global $post;

	$thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
	if ( ! $thumb ) {
		$number = preg_match( '/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $post->post_content, $m );
		if ( $number ) {
			$thumb = $m[1];
		}
	}

	if ( $thumb ) {
		$img = '<p><img src="' . esc_url( $thumb ) . '" alt="' . esc_attr( get_the_title() ) . '" style="max-width:100%;height:auto;border-radius:8px;" /></p>';
		$content = $img . $content;
	}

	return $content;
} );
