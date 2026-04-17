<?php
/**
 * My Corner - AJAX management handler
 * @author Haibin
 * @date 2026-04-17
 */

add_action( 'wp_ajax_toys_manage', 'nicen_theme_toys_manage' );

function nicen_theme_toys_manage() {
    // Verify permission and nonce
    if ( ! current_user_can( 'administrator' ) ) {
        wp_send_json_error( 'Permission denied' );
    }
    if ( ! wp_verify_nonce( $_POST['nonce'] ?? '', 'toys_nonce' ) ) {
        wp_send_json_error( 'Nonce verification failed' );
    }

    $op   = sanitize_text_field( $_POST['op'] ?? '' );
    $data = json_decode( stripslashes( $_POST['data'] ?? '{}' ), true );
    $toys = get_option( 'nicen_theme_toys', [] );

    switch ( $op ) {
        case 'add':
            $toy = nicen_theme_sanitize_toy( $data['toy'] ?? [] );
            if ( empty( $toy['name'] ) || empty( $toy['url'] ) ) {
                wp_send_json_error( 'Name and URL are required' );
            }
            $toys[] = $toy;
            break;

        case 'update':
            $index = intval( $data['index'] ?? -1 );
            if ( ! isset( $toys[ $index ] ) ) {
                wp_send_json_error( 'Item not found' );
            }
            $toy = nicen_theme_sanitize_toy( $data['toy'] ?? [] );
            if ( empty( $toy['name'] ) || empty( $toy['url'] ) ) {
                wp_send_json_error( 'Name and URL are required' );
            }
            $toys[ $index ] = $toy;
            break;

        case 'delete':
            $index = intval( $data['index'] ?? -1 );
            if ( ! isset( $toys[ $index ] ) ) {
                wp_send_json_error( 'Item not found' );
            }
            array_splice( $toys, $index, 1 );
            break;

        case 'reorder':
            $from = intval( $data['from'] ?? -1 );
            $to   = intval( $data['to'] ?? -1 );
            if ( ! isset( $toys[ $from ] ) || ! isset( $toys[ $to ] ) ) {
                wp_send_json_error( 'Invalid index' );
            }
            $item = array_splice( $toys, $from, 1 )[0];
            array_splice( $toys, $to, 0, [ $item ] );
            break;

        default:
            wp_send_json_error( 'Unknown operation' );
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
