<?php

/*
 * 左侧边栏内容
 * */


/*
 * 是否显示
 * */
if ( nicen_theme_showCatelog() ) {

	$catelog = nicen_theme_navigator();

	if ( ! empty( $catelog ) ) {

		?>
        <div id="space">
            <aside class="main-left" id="navigator" aria-label="Table of contents" data-reader-ignore="true">
                <div class="main-top">
                    <ul>
                        <li class="active">🗂️ Table of Contents</li>
                        <!-- <li>修改记录</li>-->
                    </ul>
                    <i class="iconfont icon-daohang-caidan"></i>
                </div>
                <div class="scroll">
                    <div class="line"></div>
                    <!--文章导航-->
                    <ul>
						<?php echo $catelog; ?>
                    </ul>
                </div>

                <div class="icp-beian" aria-hidden="true" data-nosnippet>
                    <div role="button" tabindex="-1">
                        <span class="number"><?php echo nicen_theme_getPostNice( get_the_ID() ); ?></span>
                        <span class="like-icon" aria-hidden="true"></span>
                    </div>
                </div>
            </aside>
        </div>
		<?php
	}
}
