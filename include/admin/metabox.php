<?php

/**
 * 自定义文章关键词和描述
 * @author 友人a丶
 */

if ( nicen_theme_config( 'document_article_tdk', false ) ) {
	add_action( 'add_meta_boxes', 'nicen_theme_kd_meta_box' );
	add_action( 'edit_post', 'nicen_document_kd_save_post' );
}

add_action( 'add_meta_boxes_post', 'nicen_theme_citation_meta_box' );
add_action( 'save_post_post', 'nicen_theme_save_citation_meta', 10, 2 );


/*
 * 文章引用信息开关。
 * */
function nicen_theme_citation_meta_box() {
	add_meta_box(
		'nicen_theme_citation_meta_box',
		'文章引用',
		'nicen_theme_citation_meta_box_callback',
		'post',
		'side',
		'default'
	);
}


function nicen_theme_citation_meta_box_callback( $post ) {
	$stored  = get_post_meta( $post->ID, 'nicen_show_citation', true );
	$checked = '0' !== $stored;
	wp_nonce_field( 'nicen_theme_save_citation', 'nicen_citation_nonce' );
	?>
    <input type="hidden" name="nicen_show_citation" value="0">
    <label>
        <input type="checkbox" name="nicen_show_citation" value="1" <?php checked( $checked ); ?>>
        在文章底部显示引用信息
    </label>
    <p class="description">历史文章默认开启；生活碎片分类始终不显示。</p>
	<?php
}


function nicen_theme_save_citation_meta( $post_id, $post ) {
	if ( ! isset( $_POST['nicen_citation_nonce'] )
		|| ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nicen_citation_nonce'] ) ), 'nicen_theme_save_citation' )
		|| ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
		|| wp_is_post_revision( $post_id )
		|| 'post' !== $post->post_type
		|| ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$citation_value = isset( $_POST['nicen_show_citation'] )
		? sanitize_text_field( wp_unslash( $_POST['nicen_show_citation'] ) )
		: '0';
	$show_citation = '1' === $citation_value ? '1' : '0';
	update_post_meta( $post_id, 'nicen_show_citation', $show_citation );
}


/**
 * 新增元框
 */
function nicen_theme_kd_meta_box() {
	add_meta_box( 'nicen_theme_kd_meta_box', "文章SEO", 'nicen_theme_kd_callback', 'page', 'normal', 'core' );
	add_meta_box( 'nicen_theme_kd_meta_box', "文章SEO", 'nicen_theme_kd_callback', 'post', 'normal', 'core' );
}


/**
 * @param $post
 * 自定义表单输出
 */
function nicen_theme_kd_callback( $post ) {
	$keywords    = get_post_meta( $post->ID, 'nicen_keywords', true );
	$description = get_post_meta( $post->ID, 'nicen_description', true );
	wp_nonce_field( basename( __FILE__ ), 'nicen_kd_nonce' );
	?>
    <div style="display: flex;padding:20px 10px;6px;gap: 25px;align-items: flex-start;">
     <textarea style="width: 50%;" placeholder="请输入文章关键词" rows="5" id="nicen_keywords"
               name="nicen_keywords"><?php echo esc_attr( $keywords ); ?></textarea>
        <textarea style="width: 50%;" placeholder="请输入文章描述" rows="5" id="nicen_description"
                  name="nicen_description"><?php echo esc_attr( $description ); ?></textarea>
    </div>

	<?php
}


/**
 * @param $post_id
 *
 * @return mixed|void
 * 保存元框数据
 */
function nicen_document_kd_save_post( $post_id ) {


	/* nonce数验证 */
	if ( ! isset( $_POST['nicen_kd_nonce'] ) || ! wp_verify_nonce( $_POST['nicen_kd_nonce'], basename( __FILE__ ) ) ) {
		return $post_id;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return $post_id;
	}

	/* 编辑文章的权限 */
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return $post_id;
	}


	/* 过滤数据 */
	$keywords    = sanitize_text_field( $_POST['nicen_keywords'] );
	$description = sanitize_text_field( $_POST['nicen_description'] );

	/* 更新数据 */
	update_post_meta( $post_id, 'nicen_keywords', $keywords );
	update_post_meta( $post_id, 'nicen_description', $description );
}
