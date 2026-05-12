<?php

/*
 * Service Worker 支持
 * 通过 WordPress rewrite 将 /sw.js 映射到主题内的 SW 文件
 */

add_action( 'init', 'nicen_sw_rewrite_rules' );
function nicen_sw_rewrite_rules() {
	add_rewrite_rule( '^sw\.js$', 'index.php?nicen_sw=1', 'top' );
	add_rewrite_rule( '^offline$', 'index.php?nicen_offline=1', 'top' );
}

add_filter( 'query_vars', 'nicen_sw_query_vars' );
function nicen_sw_query_vars( $vars ) {
	$vars[] = 'nicen_sw';
	$vars[] = 'nicen_offline';
	return $vars;
}

add_action( 'template_redirect', 'nicen_sw_template_redirect' );
function nicen_sw_template_redirect() {
	if ( get_query_var( 'nicen_sw' ) ) {
		$file = get_template_directory() . '/common/sw/sw.js';
		$min  = get_template_directory() . '/common/sw/sw.min.js';
		if ( file_exists( $min ) ) {
			$file = $min;
		}

		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Service-Worker-Allowed: /' );
		header( 'Cache-Control: no-cache' );
		echo '/* Document Theme v' . DOCUMENT_VERSION . " */\n";
		readfile( $file );
		exit;
	}

	if ( get_query_var( 'nicen_offline' ) ) {
		status_header( 200 );
		include get_template_directory() . '/template/page/offline.php';
		exit;
	}
}

add_action( 'after_switch_theme', 'nicen_sw_flush_rules' );
function nicen_sw_flush_rules() {
	nicen_sw_rewrite_rules();
	flush_rewrite_rules();
}
