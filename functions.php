<?php

/**
 * 强制移除旧版 jQuery（jQuery 1.6.2 等）
 * 优先级设为 1，确保在其他脚本加载前执行
 */
function remove_old_jquery_conflicts() {
    // 移除所有可能注册的旧版 jQuery
    wp_deregister_script('jquery');
    wp_deregister_script('jquery-core');
    wp_deregister_script('jquery-migrate');
    
    // 重新注册 WordPress 自带的 jQuery（通常是 3.x 版本）
    wp_register_script('jquery-core', includes_url('/js/jquery/jquery.min.js'), false, null, false);
    wp_register_script('jquery-migrate', includes_url('/js/jquery/jquery-migrate.min.js'), array('jquery-core'), null, false);
    wp_register_script('jquery', false, array('jquery-core', 'jquery-migrate'), null, false);
}
add_action('wp_enqueue_scripts', 'remove_old_jquery_conflicts', 1);

/**
 * 移除通过 wp_footer 或 wp_head 直接输出的旧版 jQuery 脚本标签
 */
function remove_inline_old_jquery() {
    // 移除可能通过 wp_head 或 wp_footer 直接输出的 jQuery 1.6.2
    ob_start(function($buffer) {
        // 移除包含 jquery-1.6.2 或类似旧版本的 script 标签
        $buffer = preg_replace(
            '/<script[^>]*src=["\'][^"\']*jquery[^"\']*1\.(6|5|4|3|2|1)[^"\']*["\'][^>]*><\/script>/i',
            '<!-- 已移除旧版 jQuery -->',
            $buffer
        );
        return $buffer;
    });
}
// 注意：这个函数需要在输出前执行，但可能会影响性能，谨慎使用

/**
 * 主题脚本加载函数
 * 注意：如果主题已有 nicen_theme_load_source() 函数，此函数可能会冲突
 * 如果发现冲突，请注释掉此函数，使用主题原有的加载方式
 */
function mytheme_enqueue_scripts() {
    // jQuery - 使用 WordPress 自带的 jQuery，确保版本正确
    wp_enqueue_script('jquery');

    // Swiper
    wp_enqueue_script('swiper', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js', array(), null, true);
    wp_enqueue_style('swiper-style', 'https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css');

    // 你的主题脚本 - 修复路径：从 /js/main.js 改为 /common/main.js
    // 注意：主题已有 /common/main.js 的加载（在 nicen_theme_load_source 中）
    // 如果出现重复加载，请注释掉下面这行
    // wp_enqueue_script('theme-main', get_template_directory_uri() . '/common/main.js', array('jquery', 'swiper'), filemtime(get_template_directory() . '/common/main.js'), true);
}
// 如果主题已有加载函数，请注释掉下面这行以避免冲突
// add_action('wp_enqueue_scripts', 'mytheme_enqueue_scripts');



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

