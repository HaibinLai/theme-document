<?php

/*
 * 文章底部模板
 * @author 友人a丶
 * @date 2022-07-08
 * */


$next     = get_next_post();//下一篇文章
$previous = get_previous_post();//上一篇
?>

<footer>
    <div class="article-footer">


        <!--版权-->
		<?php if ( nicen_theme_config( "document_show_copyright", false ) ) { ?>
            <div class="copyright">
				<?php echo get_copyright(); ?>
            </div>
		<?php } ?>
        <!--赞赏-->
		<?php
		$show_subscribe_link = function_exists( 'document_email_subscribe_enabled' ) && document_email_subscribe_enabled() && function_exists( 'document_email_subscribe_url' );
		if ( nicen_theme_config( "document_show_donate", false ) || $show_subscribe_link ) { ?>
			<?php
			$donate_url   = nicen_theme_config( 'document_donate_url', false );
			$donate_label = 'See my github';
			if ( $show_subscribe_link ) {
				$donate_url   = document_email_subscribe_url();
				$donate_label = 'Subscribe by email';
			}
			?>
            <div class="donate">
                <a href="<?php echo esc_url( $donate_url ); ?>">
                    <button><?php echo esc_html( $donate_label ); ?></button>
                </a>
            </div>
		<?php } ?>
        <!--文章引用-->
		<?php if ( nicen_theme_should_show_post_citation() ) {
			$citation = nicen_theme_get_post_citation();
			if ( ! empty( $citation ) ) { ?>
                <section class="article-citation" aria-labelledby="article-citation-title">
                    <h2 id="article-citation-title">如果您需要引用本文，请参考：</h2>
                    <div class="citation-entry citation-plain">
                        <p><?php echo esc_html( $citation['author'] ); ?>. (<?php echo esc_html( $citation['date'] ); ?>).
                            《<?php echo esc_html( $citation['title'] ); ?>》[Blog post]. Retrieved from
                            <a href="<?php echo esc_url( $citation['url'] ); ?>"><?php echo esc_html( $citation['url'] ); ?></a>
                        </p>
                        <button class="citation-copy" type="button"
                                data-citation-copy="<?php echo esc_attr( $citation['plain'] ); ?>"
                                title="复制普通引用" aria-label="复制普通引用">
                            <i class="iconfont icon-fuzhi" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="citation-entry citation-bibtex">
                        <pre><code><?php echo esc_html( $citation['bibtex'] ); ?></code></pre>
                        <button class="citation-copy" type="button"
                                data-citation-copy="<?php echo esc_attr( $citation['bibtex'] ); ?>"
                                title="复制 BibTeX" aria-label="复制 BibTeX">
                            <i class="iconfont icon-fuzhi" aria-hidden="true"></i>
                        </button>
                    </div>
                    <span class="citation-copy-status" role="status" aria-live="polite"></span>
                </section>
			<?php }
		} ?>
        <!--标签-->
        <div class="label">
            <i class="iconfont icon-biaoqian"></i>
            <ul>
				<?php
				/*遍历输出标签*/
				$tags = get_the_tags();

				if ( empty( $tags ) ) {
					echo "<li>暂无标签</li>";
				} else {

					/*
					 * 遍历标签
					 * */
					foreach ( $tags as $tag ) {

						$name = $tag->name; //标签名
						$link = get_term_link( $tag->term_id ); //标签链接

						echo "<li><a title='" . $name . "' href='" . $link . "'>" . $name . "</a></li>";
					}


				}
				?>
            </ul>
        </div>
        <?php if ( nicen_theme_config( "document_single_show_sparkline", false ) ) { ?>
            <?php document_stats_render_sparkline( get_the_ID() ); ?>
        <?php } ?>
    </div>

	<?php
	$equal         = nicen_theme_config( "document_assiciate_type", false ) == 1 ? false : true;
	$next_post     = get_previous_post( $equal );
	$previous_post = get_next_post( $equal );
	?>


    <div class="footer-nav">
        <div class="to">
            <span class="text">Previous</span>
			<?php if ( ! empty( $next_post ) ) { ?>
                <a href="<?php echo get_permalink( $next_post->ID ) ?>"
                   title="<?php echo $next_post->post_title ?>"><?php echo $next_post->post_title ?></a>
			<?php } else { ?>
                <a href="/" title="首页">End</a>
			<?php } ?>
        </div>
        <div class="to right">
            <span class="text">Next</span>
			<?php if ( ! empty( $previous_post ) ) { ?>
                <a href="<?php echo get_permalink( $previous_post->ID ) ?>"
                   title="<?php echo $previous_post->post_title ?>"><?php echo $previous_post->post_title ?></a>
			<?php } else { ?>
                <a href="/" title="首页">End</a>
			<?php } ?>
        </div>
    </div>
</footer>
