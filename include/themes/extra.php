<?php




/*
 * 替换Gravatar头像镜像站地址
 * */
function nicen_theme_replace_https_avatar($avatar)
{
	
    $Image = get_option('document_Gravatar');
    //~ 替换为 https 的域名
    $avatar = str_replace(array(
        'secure.gravatar.com/avatar',
        "www.gravatar.com/avatar",
        "0.gravatar.com/avatar",
        "1.gravatar.com/avatar",
        "2.gravatar.com/avatar"
    ), $Image, $avatar);
    //~ 替换为 https 协议
    $avatar = str_replace("http://", "https://", $avatar);

    return $avatar;
}

/*
 * 替换Gravatar镜像站地址
 * */
add_filter('get_avatar', 'nicen_theme_replace_https_avatar');
add_filter( 'um_user_avatar_url_filter', 'nicen_theme_replace_https_avatar', 1 );
add_filter( 'bp_gravatar_url', 'nicen_theme_replace_https_avatar', 1 );
add_filter( 'get_avatar_url', 'nicen_theme_replace_https_avatar', 1 );

/*
 * 修改文字摘要字数
 * */
function nicen_theme_article_excerpt_lengths($length)
{
    return nicen_theme_config('document_index_excerpt_number', false);
}


/*修改文章摘要的数量*/
add_filter('excerpt_length', 'nicen_theme_article_excerpt_lengths', 999);


/*
 * 首页使用主题自己的分页数量，并在查询阶段排除不显示的栏目。
 * 这样被隐藏的文章不会占用每页名额。
 * */
function nicen_theme_customize_home_query( $query ) {
	if ( is_admin() || ! $query->is_main_query() || ! $query->is_home() ) {
		return;
	}

	$posts_per_page = absint( nicen_theme_config( 'document_home_posts_per_page', false ) );
	$query->set( 'posts_per_page', max( 1, min( 50, $posts_per_page ?: 20 ) ) );

	$hidden_terms = array_values( array_filter( array_map(
		'absint',
		explode( ',', (string) nicen_theme_config( 'document_no_display', false ) )
	) ) );

	if ( ! empty( $hidden_terms ) ) {
		$query->set( 'category__not_in', $hidden_terms );
		$query->set( 'tag__not_in', $hidden_terms );
	}
}

add_action( 'pre_get_posts', 'nicen_theme_customize_home_query' );


