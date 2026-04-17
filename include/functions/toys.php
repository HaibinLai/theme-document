<?php
/**
 * 小玩具导航 AJAX 管理
 * @author Haibin
 * @date 2026-04-17
 */

add_action( 'wp_ajax_toys_manage', 'nicen_theme_toys_manage' );

function nicen_theme_toys_manage() {
    // 验证权限和 nonce
    if ( ! current_user_can( 'administrator' ) ) {
        wp_send_json_error( '无权限' );
    }
    if ( ! wp_verify_nonce( $_POST['nonce'] ?? '', 'toys_nonce' ) ) {
        wp_send_json_error( 'nonce 验证失败' );
    }

    $op   = sanitize_text_field( $_POST['op'] ?? '' );
    $data = json_decode( stripslashes( $_POST['data'] ?? '{}' ), true );
    $toys = get_option( 'nicen_theme_toys', [] );

    switch ( $op ) {
        case 'add':
            $toy = nicen_theme_sanitize_toy( $data['toy'] ?? [] );
            if ( empty( $toy['name'] ) || empty( $toy['url'] ) ) {
                wp_send_json_error( '名称和链接不能为空' );
            }
            $toys[] = $toy;
            break;

        case 'update':
            $index = intval( $data['index'] ?? -1 );
            if ( ! isset( $toys[ $index ] ) ) {
                wp_send_json_error( '玩具不存在' );
            }
            $toy = nicen_theme_sanitize_toy( $data['toy'] ?? [] );
            if ( empty( $toy['name'] ) || empty( $toy['url'] ) ) {
                wp_send_json_error( '名称和链接不能为空' );
            }
            $toys[ $index ] = $toy;
            break;

        case 'delete':
            $index = intval( $data['index'] ?? -1 );
            if ( ! isset( $toys[ $index ] ) ) {
                wp_send_json_error( '玩具不存在' );
            }
            array_splice( $toys, $index, 1 );
            break;

        default:
            wp_send_json_error( '未知操作' );
    }

    update_option( 'nicen_theme_toys', $toys );
    wp_send_json_success();
}

function nicen_theme_sanitize_toy( $toy ) {
    return [
        'name'       => sanitize_text_field( $toy['name'] ?? '' ),
        'icon'       => wp_kses_post( $toy['icon'] ?? '' ),
        'desc'       => sanitize_text_field( $toy['desc'] ?? '' ),
        'url'        => sanitize_text_field( $toy['url'] ?? '' ),
        'admin_only' => ! empty( $toy['admin_only'] ),
    ];
}
