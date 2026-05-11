<?php

/*
 * 短标签
 * */

/*
 * 短标签处理
 * */
function nicen_theme_init_shortcode()
{


	static $h1_count = 0;
	static $h2_count = 0;
	static $h3_count = 0;

	function h1($atts, $content = null, $code = "")
	{

		global $h1_count;
		$h1_count++;

		return '<h2 id="h2' . $h1_count . '">' . $content . '</h2>';
	}

	add_shortcode('h1', 'h1');

	function h2($atts, $content = null, $code = "")
	{

		global $h2_count;
		$h2_count++;

		return '<h3 id="h3' . $h2_count . '">' . $content . '</h3>';
	}

	add_shortcode('h2', 'h2');

	function h3($atts, $content = null, $code = "")
	{

		global $h3_count;
		$h3_count++;

		return '<h4 id="h4' . $h3_count . '">' . $content . '</h4>';
	}

	add_shortcode('h3', 'h3');

	function success($atts, $content = null, $code = "")
	{

		$content = do_shortcode($content);

		if (isset($atts['title'])) {
			$title = '<div class="title">'
			         . do_shortcode($atts['title']) .
			         '</div>';
		} else {
			$title = '';
		}

		return '<div class="custom-container success">
  ' . $title . '
    <div class="content">
      ' . $content . '
    </div>
</div>';
	}

	add_shortcode('success', 'success');

	function error($atts, $content = null, $code = "")
	{

		$content = do_shortcode($content);

		if (isset($atts['title'])) {
			$title = '<div class="title">'
			         . do_shortcode($atts['title']) .
			         '</div>';
		} else {
			$title = '';
		}


		return '<div class="custom-container error">
  ' . $title . '
    <div class="content">
      ' . $content . '
    </div>
</div>';
	}

	add_shortcode('error', 'error');

	function alerts($atts, $content = null, $code = "")
	{

		$content = do_shortcode($content);

		if (isset($atts['title'])) {
			$title = '<div class="title">'
			         . do_shortcode($atts['title']) .
			         '</div>';
		} else {
			$title = '';
		}

		return '<div class="custom-container alert">
  ' . $title . '
    <div class="content">
      ' . $content . '
    </div>
</div>';
	}

	add_shortcode('alert', 'alerts');

	function lightbox($atts, $content = null, $code = "")
	{
		$title = do_shortcode($atts['title']);

		if (strpos($content, 'class') === false) {
			$content = str_replace("<img", '<img loading="lazy" class="viewerLightBox"', $content);
		} else {
			$content = preg_replace("/class=\"(.*?)\"/", "loading=\"lazy\" class=\"$1 viewerLightBox\"", $content);
		}

		return '<div class="container-image">
   		' . $content . '
    <div class="image-info"> ' . $title . '</div>
</div>';
	}

	add_shortcode('lightbox', 'lightbox');


	function mark($atts, $content = null, $code = "")
	{
		return '<code class="code">' . $content . '</code>';
	}

	add_shortcode('mark', 'mark');


	function runcode_shortcode($atts, $content = null, $code = "")
	{
		$atts = shortcode_atts(array('lang' => 'javascript'), $atts, 'runcode');
		$lang = strtolower(trim($atts['lang']));

		if (!in_array($lang, array('python', 'javascript', 'js', 'html'))) {
			$lang = 'javascript';
		}

		$labels = array('python' => 'Python', 'javascript' => 'JavaScript', 'js' => 'JavaScript', 'html' => 'HTML');
		$label = $labels[$lang];

		$content = str_replace(array('<p>', '</p>'), '', $content);
		$content = preg_replace('/<br\s*\/?>/', "\n", $content);
		$content = html_entity_decode($content, ENT_QUOTES, 'UTF-8');
		$content = trim($content);

		return '<div class="runcode-block" data-lang="' . esc_attr($lang) . '">'
			. '<div class="runcode-header">'
			. '<span class="runcode-lang">' . $label . '</span>'
			. '<div class="runcode-actions">'
			. '<button class="runcode-run" type="button">&#9654; Run</button>'
			. '<button class="runcode-clear" type="button">Clear</button>'
			. '</div>'
			. '</div>'
			. '<textarea class="runcode-editor" spellcheck="false">' . esc_textarea($content) . '</textarea>'
			. '<div class="runcode-output" style="display:none">'
			. '<div class="runcode-output-header"><span>Output</span></div>'
			. '<pre class="runcode-output-content"></pre>'
			. '</div>'
			. '</div>';
	}

	add_shortcode('runcode', 'runcode_shortcode');

	function nicen_model_viewer( $atts ) {
		$atts = shortcode_atts( [
			'src'        => '',
			'width'      => '100%',
			'height'     => '400px',
			'poster'     => '',
			'autorotate' => 'true',
		], $atts, '3d' );

		if ( empty( $atts['src'] ) ) {
			return '';
		}

		$src        = esc_url( $atts['src'] );
		$width      = esc_attr( $atts['width'] );
		$height     = esc_attr( $atts['height'] );
		$poster     = $atts['poster'] ? 'poster="' . esc_url( $atts['poster'] ) . '"' : '';
		$autorotate = $atts['autorotate'] === 'true' ? 'auto-rotate' : '';

		return '<div class="model-viewer-container" style="width:' . $width . ';height:' . $height . ';">
			<model-viewer src="' . $src . '" ' . $poster . ' ' . $autorotate . '
				camera-controls touch-action="pan-y"
				shadow-intensity="1" shadow-softness="1"
				style="width:100%;height:100%;">
			</model-viewer>
		</div>';
	}

	add_shortcode( '3d', 'nicen_model_viewer' );

	static $plot3d_count = 0;

	function nicen_plot3d( $atts ) {
		global $plot3d_count;
		$plot3d_count++;

		$atts = shortcode_atts( [
			'src'    => '',
			'width'  => '100%',
			'height' => '500px',
		], $atts, 'plot3d' );

		if ( empty( $atts['src'] ) ) {
			return '';
		}

		$src    = esc_url( $atts['src'] );
		$width  = esc_attr( $atts['width'] );
		$height = esc_attr( $atts['height'] );
		$id     = 'plotly-' . $plot3d_count;

		return '<div class="plotly-container" id="' . $id . '" data-src="' . $src . '" style="width:' . $width . ';height:' . $height . ';">'
			. '<div class="plotly-loading">加载 3D 图表中...</div>'
			. '</div>';
	}

	add_shortcode( 'plot3d', 'nicen_plot3d' );

	function nicen_img_compare( $atts ) {
		$atts = shortcode_atts( [
			'before'       => '',
			'after'        => '',
			'before_label' => 'Before',
			'after_label'  => 'After',
			'width'        => '100%',
		], $atts, 'compare' );

		if ( empty( $atts['before'] ) || empty( $atts['after'] ) ) {
			return '';
		}

		$before       = esc_url( $atts['before'] );
		$after        = esc_url( $atts['after'] );
		$before_label = esc_html( $atts['before_label'] );
		$after_label  = esc_html( $atts['after_label'] );
		$width        = esc_attr( $atts['width'] );

		return '<div class="img-compare" style="width:' . $width . ';">'
			. '<div class="img-compare-after">'
			. '<img src="' . $after . '" alt="' . $after_label . '" draggable="false">'
			. '<span class="img-compare-label img-compare-label-after">' . $after_label . '</span>'
			. '</div>'
			. '<div class="img-compare-before">'
			. '<img src="' . $before . '" alt="' . $before_label . '" draggable="false">'
			. '<span class="img-compare-label img-compare-label-before">' . $before_label . '</span>'
			. '</div>'
			. '<div class="img-compare-handle">'
			. '<div class="img-compare-handle-line"></div>'
			. '<div class="img-compare-handle-circle"><span>&#x2B0C;</span></div>'
			. '<div class="img-compare-handle-line"></div>'
			. '</div>'
			. '</div>';
	}

	add_shortcode( 'compare', 'nicen_img_compare' );

}

add_action('after_setup_theme', 'nicen_theme_init_shortcode'); //新增短标签处理
