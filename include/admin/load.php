<?php

/*
 * 后台主题设置页面，外部文件加载
 * */
function nicen_theme_admin_load_source() {


    $root = get_template_directory(); //主题路径
    $url  = get_template_directory_uri();//主题url
    global $desination_configs;


    wp_enqueue_script( 'vuejs', $url . '/assets/theme/vue.min.js', false );
    wp_enqueue_script( 'moments', $url . '/assets/theme/moment.min.js' );

    wp_enqueue_script( 'antd', $url . '/assets/theme/antd.min.js', [ 'jquery' ] );
    wp_enqueue_script( 'Vcolorpicker', $url . '/common/admin/colorpicker.js', [ 'vuejs' ], filemtime( $root . '/common/admin/colorpicker.js' ), true );

    wp_enqueue_style( 'antdcss', $url . '/assets/theme/antd.min.css' );

    wp_enqueue_style( 'admincss', $url . '/common/admin/admin.css', array(), filemtime( $root . '/common/admin/admin.css' ) );
    wp_enqueue_script( 'adminjs', $url . '/common/admin/admin.js', [
        'vuejs',
        'Vcolorpicker',
        'wp-i18n',
        'wp-hooks',
        'media-editor'
    ], filemtime( $root . '/common/admin/admin.js' ) );
    wp_enqueue_script( 'loadjs', $url . '/common/admin/load.js', [
        'vuejs',
        'Vcolorpicker',
        'wp-i18n',
        'wp-hooks',
        'media-editor'
    ], filemtime( $root . '/common/admin/load.js' ) );

    wp_enqueue_script( 'axios', $url . '/assets/theme/axios.min.js' );
    wp_enqueue_media(); //加载媒体选择器


    /*
     * 内联的js代码
     * */
    wp_add_inline_script( "adminjs", vsprintf( 'const THEME_CONFIG=%s;', [ json_encode( $desination_configs ) ] ), 'before' );

}


/*
 * 后台加载样式和脚本
 * */
if ( strpos( $_SERVER['QUERY_STRING'] ?? "", 'document_theme' ) !== false ) {
    add_action( 'admin_enqueue_scripts', 'nicen_theme_admin_load_source' ); //加载前台资源文件
}


/*
 * 小工具页面的外部文件
 * */
function nicen_theme_widget_admin_load() {

    $root = get_template_directory(); //主题路径
    $url  = get_template_directory_uri();//主题url
    wp_enqueue_style( 'widgetcss', $url . '/common/widget/widget.css', array(), filemtime( $root . '/common/widget/widget.css' ) );
    wp_enqueue_style( 'jqueryuicss', $url . '/assets/theme/jquery-ui.min.css', array() );
    wp_enqueue_script( 'widgetjs', $url . '/common/widget/widget.js', array(
        'jquery-ui-tabs',
        'jquery-ui-datepicker'
    ), filemtime( $root . '/common/widget/widget.js' ), true );

}


/*
 * 小工具页面加载脚本和样式
 * */
if ( strpos( $_SERVER['SCRIPT_NAME'] ?? "", 'widgets.php' ) !== false ) {
    add_action( 'admin_enqueue_scripts', 'nicen_theme_widget_admin_load' ); //加载前台资源文件
}


