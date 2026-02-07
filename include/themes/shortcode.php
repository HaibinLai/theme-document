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

}

add_action('after_setup_theme', 'nicen_theme_init_shortcode'); //新增短标签处理

/*
 * 处理图片宽度格式：![描述|宽度](URL)
 * */
function nicen_theme_process_image_width($content) {
	// 匹配格式：![描述|宽度](URL)
	// 例如：![5a6f5946a91d749fd21712674072fb15.jpg|400](https://example.com/image.png)
	// 注意：这个格式需要在 markdown 解析之前处理，因为标准 markdown 不支持 | 分隔符
	$pattern = '/!\[([^\]]*)\|(\d+)\]\(([^\)]+)\)/';
	
	return preg_replace_callback($pattern, function($matches) {
		$alt = $matches[1]; // 图片描述
		$width = intval($matches[2]); // 宽度值（像素）
		$url = $matches[3]; // 图片URL
		
		// 返回带有宽度属性的img标签
		// 使用内联样式确保宽度生效，同时保持响应式（max-width: 100%）
		return '<img src="' . esc_url($url) . '" alt="' . esc_attr($alt) . '" style="width: ' . $width . 'px; max-width: 100%; height: auto; display: block; margin: 0 auto;" loading="lazy" class="viewerLightBox" />';
	}, $content);
}

// 在内容输出前处理图片宽度格式，优先级设为5，确保在其他过滤器之前处理
add_filter('the_content', 'nicen_theme_process_image_width', 5);
