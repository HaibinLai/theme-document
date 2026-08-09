<?php

/**
 * Register a paste-based Markdown to WP Githuber MD KaTeX converter.
 */
function document_register_math_converter_page() {
	add_management_page(
		'Markdown 公式转换',
		'公式转换',
		'edit_posts',
		'document-katex-converter',
		'document_render_math_converter_page'
	);
}

add_action( 'admin_menu', 'document_register_math_converter_page' );

/**
 * Load converter assets only on its Tools page.
 *
 * @param string $hook_suffix Current admin page hook.
 */
function document_load_math_converter_assets( $hook_suffix ) {
	if ( 'tools_page_document-katex-converter' !== $hook_suffix ) {
		return;
	}

	$root = get_template_directory();
	$url  = get_template_directory_uri();

	wp_enqueue_style(
		'document-math-converter',
		$url . '/common/admin/math-converter.css',
		array(),
		filemtime( $root . '/common/admin/math-converter.css' )
	);

	wp_enqueue_script(
		'document-math-converter',
		$url . '/common/admin/math-converter.js',
		array(),
		filemtime( $root . '/common/admin/math-converter.js' ),
		true
	);
}

add_action( 'admin_enqueue_scripts', 'document_load_math_converter_assets' );

/**
 * Render the converter. Conversion stays in the browser and never writes posts.
 */
function document_render_math_converter_page() {
	?>
	<div class="wrap document-math-converter">
		<h1>Markdown 公式转换</h1>
		<p class="description">将文章 Markdown 粘贴到左侧，转换后会生成 WP Githuber MD 可识别的 <code>katex</code> 代码块和 <code>`$...$`</code> 行内公式。已有代码块、图片和链接会保持原样。</p>

		<div class="document-math-converter__toolbar">
			<button type="button" class="button button-primary" id="document-math-convert">转换</button>
			<button type="button" class="button" id="document-math-copy" disabled>复制结果</button>
			<button type="button" class="button" id="document-math-clear">清空</button>
			<span id="document-math-status" role="status" aria-live="polite"></span>
		</div>

		<div class="document-math-converter__workspace">
			<label>
				<span>Markdown 原文</span>
				<textarea id="document-math-source" spellcheck="false" placeholder="$$&#10;2^{28}=268435456&#10;$$"></textarea>
			</label>
			<label>
				<span>KaTeX 结果</span>
				<textarea id="document-math-result" spellcheck="false" readonly></textarea>
			</label>
		</div>
	</div>
	<?php
}
