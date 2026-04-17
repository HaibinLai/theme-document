<?php

/*
 * 主题相关操作
 * @author 友人a丶
 * @date 2022-07-08
 * */

include_once get_template_directory() . '/include/themes/install.php'; //主题激活
include_once get_template_directory() . '/include/themes/initialize.php'; //初始化
include_once get_template_directory() . '/include/themes/load.php'; //加载外部文件
include_once get_template_directory() . '/include/themes/shortcode.php'; //短标签
include_once get_template_directory() . '/include/themes/emoji.php'; //其它
include_once get_template_directory() . '/include/themes/extra.php'; //其它
include_once get_template_directory() . '/include/todo/install.php'; //待办事项-数据库
include_once get_template_directory() . '/include/todo/api.php'; //待办事项-接口
include_once get_template_directory() . '/include/clipboard/install.php'; //剪贴板-数据库
include_once get_template_directory() . '/include/clipboard/api.php'; //剪贴板-接口
include_once get_template_directory() . '/include/snake/install.php'; //贪吃蛇-数据库
include_once get_template_directory() . '/include/snake/api.php'; //贪吃蛇-接口

