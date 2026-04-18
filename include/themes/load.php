<?php


/*
 * 获取压缩版文件路径（如果存在 .min.js/.min.css 就用，否则用原版）
 * */
function nicen_theme_min_path( $file_path ) {
	$root = get_template_directory();
	$ext  = pathinfo( $file_path, PATHINFO_EXTENSION );
	$min  = preg_replace( '/\.' . $ext . '$/', '.min.' . $ext, $file_path );
	if ( file_exists( $root . $min ) ) {
		return $min;
	}
	return $file_path;
}

/*
 * 外部文件加载
 * */
function nicen_theme_load_source() {


	$root = get_template_directory(); //主题路径
	$url  = get_template_directory_uri();//主题url

	/* 底部推荐区域 */
	if ( is_active_sidebar( 'content_down' ) ) {
		wp_enqueue_script( 'swiper', $url . '/assets/theme/swiper-bundle.js', false, null, true );
		wp_enqueue_style( 'swiper-styles', $url . '/assets/theme/swiper-bundle.css' );
	}


	/*主题的JS*/
	wp_enqueue_script( 'jquery' );

	/* 内联的js */
	wp_add_inline_script( "jquery", 'window.$ = jQuery;', 'after' );

	wp_enqueue_script( 'enquire', $url . nicen_theme_min_path( '/assets/theme/enquire.js' ), false, null, true );


	wp_enqueue_script( 'main-sub', $url . nicen_theme_min_path( '/common/inline/main.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/main.js' ) ), true );

	wp_enqueue_script( 'main', $url . nicen_theme_min_path( '/common/main.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/main.js' ) ), true );


	/*主题的style.css - 加载压缩版*/
	$style_path = nicen_theme_min_path( '/style.css' );
	if ( $style_path !== '/style.css' ) {
		wp_enqueue_style( 'main-styles', $url . $style_path, array(), filemtime( $root . $style_path ) );
	} else {
		wp_enqueue_style( 'main-styles', get_stylesheet_uri(), array(), filemtime( $root . '/style.css' ) );
	}

	/*
	 * 去除无用的css
	 * */
	wp_dequeue_style( 'wp-block-library' );


	/*
	 * 是否显示文章目录
	 * */
	if ( is_single() ) {
		if ( nicen_theme_config( "document_single_show_catalog", false ) ) {
			wp_enqueue_script( 'main-monitor', $url . nicen_theme_min_path( '/common/inline/monitor.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/monitor.js' ) ), true );
		}
		if ( is_active_sidebar( 'content_down' ) ) {
			wp_enqueue_script( 'page-swiper', $url . nicen_theme_min_path( '/common/inline/swiper.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/swiper.js' ) ), true );
		}
	}


	if ( is_home() ) {
		if ( nicen_theme_config( "document_show_left_nav", false ) ) {
			wp_enqueue_script( 'main-monitor', $url . nicen_theme_min_path( '/common/inline/monitor.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/monitor.js' ) ), true );
		}
	}
	if ( is_category() || is_tag() || is_search() ) {
		if ( nicen_theme_config( "document_show_else_left_nav", false ) ) {
			wp_enqueue_script( 'main-monitor', $url . nicen_theme_min_path( '/common/inline/monitor.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/monitor.js' ) ), true );
		}
	}
	/*
	 * 文章页面加载的资源
	 * */
	if ( is_single() ) {

		wp_enqueue_script( 'viewerjs', $url . '/common/viewer/viewer.min.js', array(), filemtime( $root . '/common/viewer/viewer.min.js' ), true );
		wp_enqueue_script( 'prism', $url . nicen_theme_min_path( '/common/prism/prism.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/prism/prism.js' ) ), true );
		wp_enqueue_style( 'prism', $url . nicen_theme_min_path( '/common/prism/prism.css' ), array(), filemtime( $root . nicen_theme_min_path( '/common/prism/prism.css' ) ) );
		wp_enqueue_style( 'viewercss', $url . '/common/viewer/viewer.min.css', array(), filemtime( $root . '/common/viewer/viewer.min.css' ) );

	}


	/*
	 * 主页轮播相关资源加载
	 * */
	if ( is_home() ) {
		wp_enqueue_style( 'swiper_self', $url . nicen_theme_min_path( '/common/swiper/swiper.css' ), array(), filemtime( $root . nicen_theme_min_path( '/common/swiper/swiper.css' ) ) );
		wp_enqueue_script( 'swiper_self', $url . nicen_theme_min_path( '/common/swiper/swiper.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/swiper/swiper.js' ) ), true );
		wp_enqueue_script( 'swiper', $url . '/assets/theme/swiper-bundle.js', false, null, true );
		wp_enqueue_style( 'swiper-styles', $url . '/assets/theme/swiper-bundle.css' );
		/*
		 * 内联的js代码
		 * */
		wp_add_inline_script( "main", vsprintf( 'const DYNAMIC=%s;const IN_HOME=true;', [ nicen_theme_config( 'document_dynamic', false ) ] ), 'before' );

	} else {
		wp_add_inline_script( "main", 'const DYNAMIC=false;const IN_HOME=false;', 'before' );
	}


	/*
	 * 文章ID
	 * */
	if ( is_singular() ) {

		wp_enqueue_script( 'main-emoji', $url . nicen_theme_min_path( '/common/inline/emoji.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/inline/emoji.js' ) ), true );

		/*
		 * 内联的js
		 * */
		wp_add_inline_script( "main-sub", preg_replace( '/\s/', '', vsprintf( '
			window._ts = %d;
			window.Current = "%s";'
			, [ time(), get_the_ID() ] ) ), 'before' );

		/* 阅读数同步和提交 */
		wp_enqueue_script( 'single-view', $url . nicen_theme_min_path( '/common/inline/view.js' ), [ 'main-sub' ], filemtime( $root . nicen_theme_min_path( '/common/inline/view.js' ) ), true );


	} else {
		wp_enqueue_script( 'main-index', $url . nicen_theme_min_path( '/common/inline/index.js' ), array( 'main' ), filemtime( $root . nicen_theme_min_path( '/common/inline/index.js' ) ), true );
		/*
		 * 内联的js代码
		 * */
		wp_add_inline_script( "main-index", vsprintf( 'const Auto_load_index=%s;const Auto_load_else=%s;', [
			nicen_theme_config( 'document_paginate_auto_load_index', false ),
			nicen_theme_config( 'document_paginate_auto_load_else', false )
		] ), 'before' );

	}

	/*
	 * 内联的js
	 * */
	wp_add_inline_script( "main-sub", preg_replace( '/\s/', '', vsprintf( '
			window.ROOT = "%s";
			window.HOME = "%s";'
		, [ $url, home_url() ] ) ), 'before' );

	/*
	 * Clipboard listener - loaded globally for logged-in users
	 */
	if ( is_user_logged_in() ) {
		wp_enqueue_script( 'clipboard-listener', $url . nicen_theme_min_path( '/common/clipboard/clipboard-listener.js' ), array(), filemtime( $root . nicen_theme_min_path( '/common/clipboard/clipboard-listener.js' ) ), true );
		wp_add_inline_script( 'clipboard-listener', 'window.CLIPBOARD_AJAX="' . admin_url( 'admin-ajax.php' ) . '";', 'before' );
	}

	/*
	 * 内联的css
	 * */
	wp_add_inline_style( "main-styles", vsprintf( '.personal{--theme-color:%s;--theme-header-bg-color:%s;--theme-header-font-color:%s;--theme-sub-menu-bg-color:%s;--theme-sub-menu-font-color:%s;--theme-header-border-color:%s;--theme-header-shadow-color:%s;--theme-footer-bg-color: %s;--theme-footer-font-color: %s;--theme-bg-color: %s;}',
		[
			nicen_theme_config( 'document_theme_color', false ),
			nicen_theme_config( 'document_header_bg_color', false ),
			nicen_theme_config( 'document_header_font_color', false ),
			nicen_theme_config( 'document_sub_menu_bg_color', false ),
			nicen_theme_config( 'document_sub_menu_font_color', false ),
			nicen_theme_config( 'document_header_border_color', false ),
			nicen_theme_config( 'document_header_shadow_color', false ),
			nicen_theme_config( 'document_footer_bg_color', false ),
			nicen_theme_config( 'document_footer_font_color', false ),
			nicen_theme_config( 'document_theme_bg_color', false )
		] ) );


	/*
	 * 动态加载页面资源
	 *
	 */

	$template = get_page_template_slug( get_queried_object_id() );
	foreach ( PAGES as $key => $value ) {

		/*
		 * 判断当前页面是不是指定的模板
		 * */
		if ( strpos( $template, $value['template'] ) === false ) {
			continue;
		}

		/*
		 * 是否有样式依赖
		 * */
		if ( isset( $value['dependent']['styles'] ) ) {

			foreach ( $value['dependent']['styles'] as $style ) {

				/*
				 * 如果不是外部文件
				 * */
				if ( strpos( $style, 'http' ) === false ) {
					$min_style = nicen_theme_min_path( $style );
					$ver = filemtime( $root . $min_style );
					wp_enqueue_style( $key, $url . $min_style, array(), $ver );
				} else {
					wp_enqueue_style( $key, $style, array() );
				}
			}
		}

		/*
		 * 是否有脚本依赖
		 * */
		if ( isset( $value['dependent']['scripts'] ) ) {
			foreach ( $value['dependent']['scripts'] as $script ) {

				/*
				 * 如果不是外部文件
				 * */
				if ( strpos( $script, 'http' ) === false ) {
					$min_script = nicen_theme_min_path( $script );
					$ver = filemtime( $root . $min_script );
					wp_enqueue_script( $key, $url . $min_script, array(), $ver, true );
				} else {
					wp_enqueue_script( $key, $script, array(), null, true );
				}
			}
		}

		/*
		 * Snake Game: inject anti-cheat salt before game script
		 */
		if ( $key === 'Snake Game' ) {
			$snake_salt = md5( 'snake_' . date( 'Y-m-d' ) . '_' . wp_salt( 'auth' ) );
			wp_add_inline_script( $key, 'window.SNAKE_DAY_SALT="' . $snake_salt . '";window.SNAKE_AJAX="' . admin_url( 'admin-ajax.php' ) . '";', 'before' );
		}

		/*
		 * Doom FPS: inject anti-cheat salt before game script
		 */
		if ( $key === 'Doom FPS' ) {
			$doom_salt = md5( 'doom_' . date( 'Y-m-d' ) . '_' . wp_salt( 'auth' ) );
			wp_add_inline_script( $key, 'window.DOOM_DAY_SALT="' . $doom_salt . '";window.DOOM_AJAX="' . admin_url( 'admin-ajax.php' ) . '";', 'before' );
		}
	}

}

/*
 * 前台加载样式和脚本
 * */
add_action( 'wp_enqueue_scripts', 'nicen_theme_load_source' ); //加载前台资源文件

/*
 * 为所有前端 JS 添加 defer 属性
 * defer = 浏览器并行下载 JS，但等 HTML 解析完毕后再按顺序执行
 * 效果：页面首屏渲染不再被 JS 下载阻塞，白屏时间大幅缩短
 *
 * 排除的脚本：
 * - jQuery 相关：许多内联脚本依赖 jQuery 立即可用，defer 会导致 $ is not defined
 * - wp-includes 下的脚本：WordPress 核心脚本，不宜修改加载方式
 * */
function nicen_theme_add_defer_to_scripts( $tag, $handle, $src ) {

	/* 只处理前端页面 */
	if ( is_admin() ) {
		return $tag;
	}

	/* 不给 jQuery 加 defer，因为很多 inline script 依赖它立即执行 */
	$no_defer = [ 'jquery', 'jquery-core', 'jquery-migrate' ];
	if ( in_array( $handle, $no_defer ) ) {
		return $tag;
	}

	/* 已经有 defer 或 async 的不重复添加 */
	if ( strpos( $tag, ' defer' ) !== false || strpos( $tag, ' async' ) !== false ) {
		return $tag;
	}

	/* 添加 defer 属性 */
	return str_replace( ' src=', ' defer src=', $tag );
}
add_filter( 'script_loader_tag', 'nicen_theme_add_defer_to_scripts', 10, 3 );


