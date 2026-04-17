<?php
/**
 * 待办事项 - AJAX 接口
 * @author Haibin
 * @date 2026-04-17
 */

/**
 * 权限校验
 */
function document_todo_check_permission() {
	if ( ! current_user_can( 'administrator' ) ) {
		wp_send_json_error( '无权限', 403 );
	}
}

/**
 * 获取待办列表
 */
function document_todo_list() {
	document_todo_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';

	$rows = $wpdb->get_results(
		"SELECT * FROM $table ORDER BY sort_order ASC, created_at DESC",
		ARRAY_A
	);

	wp_send_json_success( $rows ?: [] );
}
add_action( 'wp_ajax_todo_list', 'document_todo_list' );

/**
 * 创建待办
 */
function document_todo_create() {
	document_todo_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';

	$title    = sanitize_text_field( $_POST['title'] ?? '' );
	$priority = sanitize_text_field( $_POST['priority'] ?? 'medium' );
	$due_date = sanitize_text_field( $_POST['due_date'] ?? '' );

	if ( empty( $title ) ) {
		wp_send_json_error( '标题不能为空' );
	}

	if ( ! in_array( $priority, [ 'high', 'medium', 'low' ] ) ) {
		$priority = 'medium';
	}

	$data = [
		'title'    => $title,
		'priority' => $priority,
		'due_date' => $due_date ?: null,
	];
	$format = [ '%s', '%s', '%s' ];

	$wpdb->insert( $table, $data, $format );
	$id = $wpdb->insert_id;

	$row = $wpdb->get_row(
		$wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ),
		ARRAY_A
	);

	wp_send_json_success( $row );
}
add_action( 'wp_ajax_todo_create', 'document_todo_create' );

/**
 * 更新待办
 */
function document_todo_update() {
	document_todo_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';

	$id = intval( $_POST['id'] ?? 0 );
	if ( ! $id ) {
		wp_send_json_error( 'ID无效' );
	}

	$update = [];
	$format = [];

	if ( isset( $_POST['title'] ) ) {
		$update['title'] = sanitize_text_field( $_POST['title'] );
		$format[]        = '%s';
	}
	if ( isset( $_POST['completed'] ) ) {
		$update['completed'] = intval( $_POST['completed'] ) ? 1 : 0;
		$format[]            = '%d';
	}
	if ( isset( $_POST['priority'] ) ) {
		$p = sanitize_text_field( $_POST['priority'] );
		if ( in_array( $p, [ 'high', 'medium', 'low' ] ) ) {
			$update['priority'] = $p;
			$format[]           = '%s';
		}
	}
	if ( isset( $_POST['due_date'] ) ) {
		$update['due_date'] = sanitize_text_field( $_POST['due_date'] ) ?: null;
		$format[]           = '%s';
	}

	if ( empty( $update ) ) {
		wp_send_json_error( '没有要更新的字段' );
	}

	$wpdb->update( $table, $update, [ 'id' => $id ], $format, [ '%d' ] );

	$row = $wpdb->get_row(
		$wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ),
		ARRAY_A
	);

	wp_send_json_success( $row );
}
add_action( 'wp_ajax_todo_update', 'document_todo_update' );

/**
 * 删除待办
 */
function document_todo_delete() {
	document_todo_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';

	$id = intval( $_POST['id'] ?? 0 );
	if ( ! $id ) {
		wp_send_json_error( 'ID无效' );
	}

	$wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );
	wp_send_json_success( [ 'deleted' => $id ] );
}
add_action( 'wp_ajax_todo_delete', 'document_todo_delete' );

/**
 * 批量更新排序
 */
function document_todo_reorder() {
	document_todo_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_todos';

	$orders = json_decode( stripslashes( $_POST['orders'] ?? '[]' ), true );
	if ( ! is_array( $orders ) ) {
		wp_send_json_error( '数据格式错误' );
	}

	foreach ( $orders as $item ) {
		$wpdb->update(
			$table,
			[ 'sort_order' => intval( $item['sort_order'] ) ],
			[ 'id' => intval( $item['id'] ) ],
			[ '%d' ],
			[ '%d' ]
		);
	}

	wp_send_json_success( true );
}
add_action( 'wp_ajax_todo_reorder', 'document_todo_reorder' );
