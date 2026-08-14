<?php

/*
 * 文章链接优化
 */

function nicen_theme_slug_has_chinese( $text ) {
	return is_string( $text ) && preg_match( '/\p{Han}/u', $text );
}

function nicen_theme_slug_needs_pinyin( $slug ) {
	return $slug === '' || nicen_theme_slug_has_chinese( $slug ) || preg_match( '/%e[0-9a-f]/i', $slug );
}

function nicen_theme_title_to_pinyin_slug( $title ) {
	if ( ! nicen_theme_slug_has_chinese( $title ) || ! class_exists( 'Transliterator' ) ) {
		return '';
	}

	$transliterator = Transliterator::create( 'Han-Latin; Latin-ASCII; Lower()' );
	if ( ! $transliterator ) {
		return '';
	}

	$slug = $transliterator->transliterate( $title );
	$slug = preg_replace( '/[^a-z0-9]+/i', '-', $slug );
	$slug = trim( strtolower( $slug ), '-' );

	return $slug;
}

function nicen_theme_use_pinyin_post_slug( $data, $postarr ) {
	if ( ( $data['post_type'] ?? '' ) !== 'post' || ( $data['post_status'] ?? '' ) === 'auto-draft' ) {
		return $data;
	}

	$title = $data['post_title'] ?? '';
	if ( ! nicen_theme_slug_has_chinese( $title ) || ! nicen_theme_slug_needs_pinyin( $data['post_name'] ?? '' ) ) {
		return $data;
	}

	$slug = nicen_theme_title_to_pinyin_slug( $title );
	if ( $slug !== '' ) {
		$data['post_name'] = $slug;
	}

	return $data;
}

add_filter( 'wp_insert_post_data', 'nicen_theme_use_pinyin_post_slug', 20, 2 );
