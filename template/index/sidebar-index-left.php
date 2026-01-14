<?php

/*
 * 左侧边栏内容
 * */


/*
 * 是否显示
 * */

if ( nicen_theme_showArticleCate() ) {

	$catelog = nicen_theme_navigator();

	if ( ! empty( $catelog ) ) {

		?>
        <div id="space">
            <aside class="main-left isIndex" id="navigator">
                <div class="main-top">
                    <ul>
                        <li class="active">🗂️ Article Navigation</li>
                        <!-- <li>修改记录</li>-->
                    </ul>
                    <i class="iconfont icon-daohang-caidan"></i>
                </div>
                <div class="scroll index-scroll">
                    <div class="line"></div>
                    <!--文章导航-->
                    <ul>
						<?php echo $catelog; ?>
                    </ul>
                </div>
            </aside>
        </div>
		<?php
	}
}