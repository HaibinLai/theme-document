<?php

function mytheme_enqueue_scripts() {
    // jQuery
    wp_enqueue_script('jquery');

    // Swiper
    wp_enqueue_script('swiper', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js', array(), null, true);
    wp_enqueue_style('swiper-style', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css');

    // 你的主题脚本
    wp_enqueue_script('theme-main', get_template_directory_uri() . '/js/main.js', array('jquery', 'swiper'), null, true);
}
add_action('wp_enqueue_scripts', 'mytheme_enqueue_scripts');



/*
 *
 * 主题初始化
 * @author 友人a丶
 * @date 2022-06-06
 * @life，加油
 * */
include_once get_template_directory() . '/include/config.php'; //加载一些通用方法
include_once get_template_directory() . '/include/functions/common.php'; //加载一些通用方法
include_once get_template_directory() . '/include/response/response.php'; //处理前端ajax请求
include_once get_template_directory() . '/include/themes/theme.php'; //主题钩子
include_once get_template_directory() . '/include/admin/admin.php'; //后台钩子
include_once get_template_directory() . '/include/widget/widget.php';//加载小部件
include_once get_template_directory() . '/include/functions/smtp.php';//加载smtp
include_once get_template_directory() . '/include/class/CommentsWalker.php';//自定义评论输出
include_once get_template_directory() . '/include/functions/initialize.php';//覆盖wordpress默认设置

