<?php

/*
 * 评论页面模板
 * @author 友人a丶
 * @date 2022-07-08
 * */


/*
 * 如果需要显示评论
 * */

if ( nicen_theme_showComments() ) {

	/*如果开启了评论*/
	if ( comments_open() ) {

		//是否登录
		$isLogin = is_user_logged_in();
		//获取管理员用户信息
		$adminUserInfo    = wp_get_current_user();
		$currentCommenter = wp_get_current_commenter();

		//参数
		$nickname = $isLogin ? ( $adminUserInfo->exists() ? $adminUserInfo->display_name : '' ) : htmlspecialchars( $currentCommenter['comment_author'] );
		$email    = $isLogin ? ( $adminUserInfo->exists() ? $adminUserInfo->user_email : '' ) : htmlspecialchars( $currentCommenter['comment_author_email'] );
		$webUrl   = $isLogin ? site_url() : htmlspecialchars( $currentCommenter['comment_author_url'] );
		$default  = get_template_directory_uri() . '/assets/images/avatar.svg?ver=' . filemtime( get_template_directory() . '/assets/images/avatar.svg' );
		$avatar   = $isLogin ? ( get_avatar_url( $adminUserInfo->ID ) ?? $default ) : $default;

		$reply_to_id = isset( $_GET['replytocom'] ) ? (int) $_GET['replytocom'] : false;

		if ( $reply_to_id ) {
			$comment = get_comment( $reply_to_id );
		}//获取当前回复的评论


		?>

        <div class="div-info">
            <div class="header">
                <ul>
                    <li class="active"><div class="mark"></div>Comments</li>
                    <!-- <li>修改记录</li>-->
                </ul>
            </div>
            <form class="comment-form" action="/wp-comments-post.php" method="post">
                <!--评论表单头部元素-->
                <div class="comment-header">
                    <!--评论者信息-->
                    <div class="comment-person">
                        <div class="comment-avatar">
                            <img src="<?php echo $avatar ?>" alt="默认头像" title="默认头像"/>
                        </div>
                        <div class="comment-info">
                            <div class="comment-info-top"><?php echo $isLogin ? $nickname : '恨相知晚'; ?></div>
                            <div class="comment-info-bottom"><?php echo ( ! $comment ) ? 'Join the discussion!' : 'Reply to ' . $comment->comment_author . '\'s comment'; ?></div>
                        </div>
                    </div>
                    <div class="comment-loginout">
						<?php if ( $comment ) {
							cancel_comment_reply_link( 'Cancel Reply' );
						} ?>
                        <a style="display: <?php echo $isLogin ? 'block' : 'none' ?>" title="Logout"
                           href="<?php echo wp_logout_url( apply_filters( 'the_permalink', get_permalink(), '' ) ); ?>">Logout</a>
                    </div>
                </div>
                <div class="comment-form-main">
					<?php wp_nonce_field( 'unfiltered-html-comment_' . get_the_ID(), '_wp_unfiltered_html_comment', false ); ?>
                    <input type="hidden" name="comment_parent"
                           value=" <?php echo $reply_to_id ? $comment->comment_ID : ''; ?>">
                    <input type="hidden" name="comment_post_ID" value="<?php echo get_the_ID(); ?>"
                           id="comment_post_ID">
                    <div class="comment-textarea">
                        <textarea id="comment_content" name="comment" maxlength="65525"
                                  placeholder="Three words, comfort yourself, cold words, stick to yourself" rows="5"
                                  class="comment-content"></textarea>

                        <i class="iconfont icon-biaoqing emoji"></i>

						<?php get_template_part( './template/index/emoji' ); ?>

                    </div>

                    <div class="comment-container">
                        <input placeholder="Nickname" name="author" type="text" class="comment-name"
                               value="<?php echo $nickname ?>"
                               required/>
                        <input placeholder="Email" name="email" type="email" class="comment-mail"
                               value="<?php echo $email ?>"
                               required/>
                        <input placeholder="Website" name="url" type="url" class="comment-url"
                               value="<?php echo $webUrl ?>"
                               required/>
                    </div>
                </div>
                <div class="comment-form-footer">
                    <button type="submit">Submit</button>
                </div>
            </form>

            <!--输出评论-->
			<?php if ( have_comments() ) { ?>
                <div class="comment_list">
                    <ul class="front">
	                    <?php wp_list_comments( [
		                    'style'             => 'ul',
		                    'type'              => 'all',
		                    'reverse_top_level' => true,
		                    'reverse_children'  => true,
		                    'walker'            => ( new CommentsWalker() )
	                    ] ); ?>
                    </ul>
                </div>
				<?php if ( get_comment_pages_count() > 1 ) { ?>
                    <div class="pagination">
						<?php paginate_comments_links( [ 'prev_next' => false ] ); ?>
                    </div>
				<?php } ?>
			<?php } ?>
        </div>

		<?php

	} else { ?>
        <div class="div-info">
            <div class="header" style="padding: 20px 20px 0 20px;text-align: center;border: none;">
                Comments are not open, cannot receive messages!
            </div>
        </div>
		<?php
	} ?>

	<?php
}