<?php
/*
 * 友情链接页面模板
 * @author 友人a丶
 * @date 2024-01-18
 */

get_header();

/* 获取友情链接数据 */
$bookmarks = get_bookmarks( array(
	'orderby' => 'name',
	'order'   => 'ASC'
) );

$default_friend_image = get_template_directory_uri() . '/assets/images/avatar.svg';
$friend_site_icon      = static function ( $site_url ) use ( $default_friend_image ) {
	$parts = wp_parse_url( $site_url );
	if ( empty( $parts['host'] ) ) {
		return $default_friend_image;
	}

	$scheme = 'https';
	$port   = isset( $parts['port'] ) ? ':' . (int) $parts['port'] : '';

	return $scheme . '://' . $parts['host'] . $port . '/favicon.ico';
};

/* 转换为JavaScript可用的数据格式 */
$friend_links = array_map( function ( $link ) use ( $friend_site_icon, $default_friend_image ) {
	$fallback_image = $friend_site_icon( $link->link_url );

	return array(
		'name'           => $link->link_name,
		'image'          => $link->link_image ?: $fallback_image,
		'fallback_image' => $fallback_image,
		'default_image'  => $default_friend_image,
		'description'    => $link->link_description ?: '',
		'url'            => $link->link_url ?: ''
	);
}, $bookmarks );
?>

<?php if ( ! empty( $friend_links ) ): ?>
    <div id="friend-graph" class="friend-graph">
        <ul class="friend-links" style="display: none;">
            <li class="current-site"
                data-name="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>"
                data-image="<?php echo esc_url( get_site_icon_url() ); ?>"
                data-fallback-image="<?php echo esc_url( home_url( '/favicon.ico' ) ); ?>"
                data-default-image="<?php echo esc_url( $default_friend_image ); ?>"
                data-description="<?php echo esc_attr( get_bloginfo( 'description' ) ); ?>">
            </li>
			<?php foreach ( $friend_links as $link ): ?>
                <li class="friend-link"
                    data-name="<?php echo esc_attr( $link['name'] ); ?>"
                    data-image="<?php echo esc_url( $link['image'] ); ?>"
                    data-fallback-image="<?php echo esc_url( $link['fallback_image'] ); ?>"
                    data-default-image="<?php echo esc_url( $link['default_image'] ); ?>"
                    data-description="<?php echo esc_attr( $link['description'] ); ?>"
                    data-url="<?php echo esc_url( $link['url'] ); ?>">
                    <a title="<?php echo esc_attr( $link['name']  ); ?>" href="<?php echo esc_url( $link['url'] ); ?>"><?php echo esc_html( $link['name'] ); ?></a>
                </li>
			<?php endforeach; ?>
        </ul>
    </div>
<?php else: ?>
    <p class="text-center">暂无友情链接</p>
<?php endif; ?>

<?php get_footer(); ?>
