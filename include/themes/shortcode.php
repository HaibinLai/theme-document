<?php

/*
 * 短标签
 * */

/*
 * 短标签处理
 * */
function nicen_theme_prepare_mermaid_source( $content ) {
	$content = str_replace( [ '<p>', '</p>' ], '', $content ?? '' );
	$content = preg_replace( '/<br\s*\/?>/i', "\n", $content );
	$content = html_entity_decode( $content, ENT_QUOTES, 'UTF-8' );

	return trim( $content );
}

function nicen_theme_mermaid_block( $content ) {
	return '<div class="mermaid">' . esc_html( nicen_theme_prepare_mermaid_source( $content ) ) . '</div>';
}

function nicen_theme_render_mermaid_fences( $content ) {
	if ( stripos( $content, '```mermaid' ) === false && stripos( $content, '~~~mermaid' ) === false ) {
		return $content;
	}

	return preg_replace_callback( '/(^|\R)(```|~~~)mermaid[ \t]*\R([\s\S]*?)\R\2(?=\R|$)/i', function ( $matches ) {
		return $matches[1] . nicen_theme_mermaid_block( $matches[3] );
	}, $content );
}

add_filter( 'the_content', 'nicen_theme_render_mermaid_fences', 8 );

function nicen_theme_split_slugs( $value ) {
	if ( empty( $value ) ) {
		return [];
	}

	$slugs = array_map( 'trim', explode( ',', $value ) );
	$slugs = array_filter( $slugs );

	return array_map( 'sanitize_title', $slugs );
}

function nicen_theme_extract_fragment_images( $content ) {
	$images = [];

	$content = preg_replace_callback( '/<figure\b[^>]*>[\s\S]*?<img\b[^>]*>[\s\S]*?<\/figure>/i', function ( $matches ) use ( &$images ) {
		preg_match_all( '/<img\b[^>]*>/i', $matches[0], $img_matches );

		foreach ( $img_matches[0] as $img ) {
			$images[] = nicen_theme_parse_fragment_image( $img );
		}

		return '';
	}, $content );

	$content = preg_replace_callback( '/<img\b[^>]*>/i', function ( $matches ) use ( &$images ) {
		$images[] = nicen_theme_parse_fragment_image( $matches[0] );

		return '';
	}, $content );

	$images = array_values( array_filter( $images, function ( $image ) {
		return ! empty( $image['full'] );
	} ) );

	return [
		'content' => $content,
		'images'  => $images,
	];
}

function nicen_theme_parse_fragment_image( $img ) {
	$image = [
		'thumb' => '',
		'full'  => '',
		'alt'   => '',
	];

	if ( preg_match( '/\ssrc=["\']([^"\']+)["\']/i', $img, $src ) ) {
		$image['full'] = html_entity_decode( $src[1], ENT_QUOTES, 'UTF-8' );
		$image['thumb'] = $image['full'];
	}

	if ( preg_match( '/\salt=["\']([^"\']*)["\']/i', $img, $alt ) ) {
		$image['alt'] = html_entity_decode( $alt[1], ENT_QUOTES, 'UTF-8' );
	}

	if ( preg_match( '/wp-image-(\d+)/i', $img, $attachment ) ) {
		$attachment_id = absint( $attachment[1] );
		$thumb         = wp_get_attachment_image_src( $attachment_id, 'medium_large' );
		$full          = wp_get_attachment_image_src( $attachment_id, 'large' );

		if ( $thumb ) {
			$image['thumb'] = $thumb[0];
		}

		if ( $full ) {
			$image['full'] = $full[0];
		}
	}

	return $image;
}

function nicen_theme_fragment_featured_image( $post_id ) {
	if ( ! has_post_thumbnail( $post_id ) ) {
		return null;
	}

	return [
		'thumb' => get_the_post_thumbnail_url( $post_id, 'medium_large' ),
		'full'  => get_the_post_thumbnail_url( $post_id, 'large' ),
		'alt'   => get_the_title( $post_id ),
	];
}

function nicen_theme_render_fragments( $atts = [] ) {
	static $rendering_fragments = false;

	if ( $rendering_fragments ) {
		return '';
	}

	$rendering_fragments = true;
	$atts = shortcode_atts( [
		'category'       => 'fragments,life-fragments',
		'tag'            => '',
		'posts_per_page' => 20,
	], $atts, 'fragments' );

	$category_slugs = nicen_theme_split_slugs( $atts['category'] );
	$tag_slugs      = nicen_theme_split_slugs( $atts['tag'] );
	$per_page       = max( 1, min( 50, absint( $atts['posts_per_page'] ) ) );

	$tax_query = [];

	if ( ! empty( $category_slugs ) ) {
		$tax_query[] = [
			'taxonomy' => 'category',
			'field'    => 'slug',
			'terms'    => $category_slugs,
		];
	}

	if ( ! empty( $tag_slugs ) ) {
		$tax_query[] = [
			'taxonomy' => 'post_tag',
			'field'    => 'slug',
			'terms'    => $tag_slugs,
		];
	}

	if ( count( $tax_query ) > 1 ) {
		$tax_query['relation'] = 'AND';
	}

	$query_args = [
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => $per_page,
		'ignore_sticky_posts' => true,
		'orderby'             => 'date',
		'order'               => 'DESC',
	];

	if ( ! empty( $tax_query ) ) {
		$query_args['tax_query'] = $tax_query;
	}

	$fragments = new WP_Query( $query_args );

	ob_start();
	?>
	<div class="fragments-list">
		<?php if ( $fragments->have_posts() ) : ?>
			<?php $current_month = ''; ?>
			<?php while ( $fragments->have_posts() ) : $fragments->the_post(); ?>
				<?php
				$post_id     = get_the_ID();
				$author_id   = get_post_field( 'post_author', $post_id );
				$post_month  = get_the_date( 'Y.m' );
				$raw_content = get_the_content( null, false, $post_id );
				$parts       = nicen_theme_extract_fragment_images( $raw_content );
				$images      = $parts['images'];
				$featured    = nicen_theme_fragment_featured_image( $post_id );

				if ( $featured ) {
					array_unshift( $images, $featured );
				}

				$images = array_slice( $images, 0, 9 );
				$text   = apply_filters( 'the_content', $parts['content'] );
				?>
				<?php if ( $post_month !== $current_month ) : ?>
					<div class="fragment-month"><?php echo esc_html( $post_month ); ?></div>
					<?php $current_month = $post_month; ?>
				<?php endif; ?>
				<article class="fragment-item">
					<div class="fragment-avatar">
						<?php echo get_avatar( $author_id, 48 ); ?>
					</div>
					<div class="fragment-body">
						<div class="fragment-author">
							<a href="<?php echo esc_url( get_author_posts_url( $author_id ) ); ?>">
								<?php echo esc_html( get_the_author_meta( 'display_name', $author_id ) ); ?>
							</a>
						</div>
						<?php if ( trim( wp_strip_all_tags( $text ) ) || get_the_title() ) : ?>
							<div class="fragment-content-wrap">
								<?php if ( get_the_title() ) : ?>
									<h2 class="fragment-title">
										<a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
									</h2>
								<?php endif; ?>
								<div class="fragment-content">
									<?php echo $text; ?>
								</div>
								<button type="button" class="fragment-expand" aria-expanded="false">展开</button>
							</div>
						<?php endif; ?>
						<?php if ( ! empty( $images ) ) : ?>
							<div class="fragment-media fragment-media-count-<?php echo esc_attr( min( count( $images ), 9 ) ); ?>" data-count="<?php echo esc_attr( count( $images ) ); ?>">
								<?php foreach ( $images as $image ) : ?>
									<button type="button" class="fragment-thumb" data-full="<?php echo esc_url( $image['full'] ); ?>" aria-label="Open image">
										<img loading="lazy" src="<?php echo esc_url( $image['thumb'] ); ?>" alt="<?php echo esc_attr( $image['alt'] ); ?>">
									</button>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>
						<div class="fragment-meta">
							<a href="<?php the_permalink(); ?>">
								<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
									<?php echo esc_html( nicen_theme_timeToString( get_the_time( 'Y-m-d H:i:s' ) ) ); ?>
								</time>
							</a>
							<a href="<?php the_permalink(); ?>#comments"><?php echo esc_html( get_comments_number() ); ?> Comments</a>
						</div>
					</div>
				</article>
			<?php endwhile; ?>
			<?php wp_reset_postdata(); ?>
		<?php else : ?>
			<div class="fragments-empty">No fragments yet.</div>
		<?php endif; ?>
	</div>
	<?php

	$rendering_fragments = false;

	return ob_get_clean();
}

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

	function nicen_mermaid( $atts, $content = null, $code = "" ) {
		return nicen_theme_mermaid_block( $content );
	}

	add_shortcode( 'mermaid', 'nicen_mermaid' );

	add_shortcode( 'fragments', 'nicen_theme_render_fragments' );

}

add_action('after_setup_theme', 'nicen_theme_init_shortcode'); //新增短标签处理
