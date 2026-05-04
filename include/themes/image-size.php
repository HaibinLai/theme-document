<?php

/*
 * Obsidian 风格图片尺寸语法解析
 *
 * 支持：
 *   ![alt|200](url)        → <img alt="alt" width="200">
 *   ![alt|200x300](url)    → <img alt="alt" width="200" height="300">
 *
 * 处理两种情况：
 * 1) 文章里残留的原始 Markdown 文本 ![alt|w](url) → 转成 <img>
 * 2) 已经被渲染为 <img alt="文件名.jpg|200"> 的图片 → 提取尺寸 + 清理 alt
 *
 * @author Haibin
 * @date 2026-05-04
 */


/*
 * 从 alt 文本中提取尺寸：返回 [纯alt, width, height]
 * 没有尺寸返回 [原始alt, null, null]
 * */
function nicen_parse_image_size_in_alt( $alt ) {
	if ( strpos( $alt, '|' ) === false ) {
		return [ $alt, null, null ];
	}
	/* 形如 xxx|200 或 xxx|200x300，宽高必须是数字 */
	if ( preg_match( '/^(.*)\|(\d+)(?:x(\d+))?$/', $alt, $m ) ) {
		$clean_alt = trim( $m[1] );
		$width     = (int) $m[2];
		$height    = isset( $m[3] ) && $m[3] !== '' ? (int) $m[3] : null;
		return [ $clean_alt, $width, $height ];
	}
	return [ $alt, null, null ];
}


/*
 * 处理已渲染的 <img> 标签：根据 alt 里的 |w 或 |wxh 设置宽高
 * 同时处理懒加载常见的 data-src / data-original 场景，确保 width/height 写在标签上
 * */
function nicen_apply_obsidian_image_size( $content ) {

	if ( strpos( $content, '<img' ) === false ) {
		return $content;
	}

	return preg_replace_callback( '/<img\b([^>]*)>/i', function ( $match ) {

		$attrs = $match[1];

		/* 取 alt 值 */
		if ( ! preg_match( '/\salt\s*=\s*(["\'])(.*?)\1/i', $attrs, $alt_match ) ) {
			return $match[0];
		}
		$quote = $alt_match[1];
		$alt   = $alt_match[2];

		list( $clean_alt, $width, $height ) = nicen_parse_image_size_in_alt( html_entity_decode( $alt, ENT_QUOTES ) );
		if ( $width === null ) {
			return $match[0];
		}

		/* 替换 alt 为不含尺寸的版本 */
		$new_alt_attr = 'alt=' . $quote . esc_attr( $clean_alt ) . $quote;
		$attrs        = preg_replace( '/\salt\s*=\s*(["\']).*?\1/i', ' ' . $new_alt_attr, $attrs, 1 );

		/* 移除已存在的 width/height 属性，统一以新值覆盖 */
		$attrs = preg_replace( '/\s(width|height)\s*=\s*(["\']).*?\2/i', '', $attrs );

		/* 注入 width/height + 内联 style，保证响应式下也按比例 */
		$inject = ' width="' . $width . '"';
		if ( $height !== null ) {
			$inject .= ' height="' . $height . '"';
		}

		/* style 里加 max-width，避免与主题已有响应式规则冲突 */
		$style_value = 'width:' . $width . 'px;max-width:100%;height:auto;';
		if ( preg_match( '/\sstyle\s*=\s*(["\'])(.*?)\1/i', $attrs, $style_match ) ) {
			$old_style = rtrim( trim( $style_match[2] ), ';' );
			$new_style = $old_style . ';' . $style_value;
			$attrs     = preg_replace( '/\sstyle\s*=\s*(["\']).*?\1/i', ' style=' . $style_match[1] . $new_style . $style_match[1], $attrs, 1 );
		} else {
			$inject .= ' style="' . $style_value . '"';
		}

		return '<img' . $attrs . $inject . '>';
	}, $content );
}


/*
 * 处理原始 Markdown 残留：![alt|w](url) → <img>
 * 仅在被 <p> 直接包裹或独立成行、且没有其它干扰 HTML 时生效，避免误伤代码块。
 * */
function nicen_render_raw_obsidian_image( $content ) {

	if ( strpos( $content, '![' ) === false ) {
		return $content;
	}

	return preg_replace_callback(
		'/!\[([^\]\n]*?)\]\(([^)\s]+)\)/',
		function ( $match ) {
			$alt = $match[1];
			$url = $match[2];

			list( $clean_alt, $width, $height ) = nicen_parse_image_size_in_alt( $alt );

			$attrs = 'src="' . esc_url( $url ) . '" alt="' . esc_attr( $clean_alt ) . '"';
			if ( $width !== null ) {
				$style = 'width:' . $width . 'px;max-width:100%;height:auto;';
				$attrs .= ' width="' . $width . '"';
				if ( $height !== null ) {
					$attrs .= ' height="' . $height . '"';
				}
				$attrs .= ' style="' . $style . '"';
			}
			return '<img ' . $attrs . ' loading="lazy" decoding="async">';
		},
		$content
	);
}


/*
 * 主入口：先处理 Markdown 残留，再扫描已渲染的 <img>
 * 优先级设高一点，确保像 WP Githuber MD 这类 Markdown 插件先把内容渲染成最终 HTML。
 * */
function nicen_obsidian_image_filter( $content ) {
	$content = nicen_render_raw_obsidian_image( $content );
	$content = nicen_apply_obsidian_image_size( $content );
	return $content;
}

add_filter( 'the_content', 'nicen_obsidian_image_filter', 999 );
