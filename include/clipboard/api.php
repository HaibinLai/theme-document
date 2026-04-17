<?php
/**
 * Clipboard Helper - AJAX API
 * @author Haibin
 * @date 2026-04-17
 */

/**
 * Permission check - any logged-in user
 */
function document_clipboard_check_permission() {
	if ( ! is_user_logged_in() ) {
		wp_send_json_error( 'Not logged in', 403 );
	}
}

/**
 * Save text entry (from global listener or manual paste)
 */
function document_clipboard_save() {
	document_clipboard_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';

	$content = wp_unslash( $_POST['content'] ?? '' );
	if ( empty( trim( $content ) ) ) {
		wp_send_json_error( 'Empty content' );
	}

	// Limit text to 1MB
	if ( strlen( $content ) > 1048576 ) {
		wp_send_json_error( 'Text too large (max 1MB)' );
	}

	// Deduplicate: skip if same content was saved in last 3 seconds
	$user_id = get_current_user_id();
	$recent = $wpdb->get_var( $wpdb->prepare(
		"SELECT id FROM $table WHERE user_id = %d AND type = 'text' AND content = %s AND created_at > DATE_SUB(NOW(), INTERVAL 3 SECOND) LIMIT 1",
		$user_id, $content
	));
	if ( $recent ) {
		wp_send_json_success( [ 'deduplicated' => true ] );
	}

	$wpdb->insert( $table, [
		'user_id' => $user_id,
		'type'    => 'text',
		'content' => $content,
	], [ '%d', '%s', '%s' ] );

	// Keep only last 200 entries per user
	document_clipboard_cleanup( $user_id );

	$row = $wpdb->get_row( $wpdb->prepare(
		"SELECT * FROM $table WHERE id = %d", $wpdb->insert_id
	), ARRAY_A );

	wp_send_json_success( $row );
}
add_action( 'wp_ajax_clipboard_save', 'document_clipboard_save' );

/**
 * Upload file (<10MB)
 */
function document_clipboard_upload() {
	document_clipboard_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';

	if ( empty( $_FILES['file'] ) ) {
		wp_send_json_error( 'No file uploaded' );
	}

	$file = $_FILES['file'];
	$max_size = 10 * 1024 * 1024; // 10MB

	if ( $file['error'] !== UPLOAD_ERR_OK ) {
		wp_send_json_error( 'Upload error: ' . $file['error'] );
	}
	if ( $file['size'] > $max_size ) {
		wp_send_json_error( 'File too large (max 10MB)' );
	}

	$user_id = get_current_user_id();
	$upload_dir = wp_upload_dir();
	$clipboard_dir = $upload_dir['basedir'] . '/clipboard/' . $user_id;

	if ( ! file_exists( $clipboard_dir ) ) {
		wp_mkdir_p( $clipboard_dir );
		// Protect directory
		file_put_contents( $clipboard_dir . '/.htaccess', "Options -Indexes\n" );
	}

	// Sanitize filename and make unique
	$filename = sanitize_file_name( $file['name'] );
	$ext = pathinfo( $filename, PATHINFO_EXTENSION );
	$base = pathinfo( $filename, PATHINFO_FILENAME );
	$dest = $clipboard_dir . '/' . $filename;
	$i = 1;
	while ( file_exists( $dest ) ) {
		$dest = $clipboard_dir . '/' . $base . '-' . $i . '.' . $ext;
		$i++;
	}

	if ( ! move_uploaded_file( $file['tmp_name'], $dest ) ) {
		wp_send_json_error( 'Failed to save file' );
	}

	// Store relative path
	$relative_path = str_replace( $upload_dir['basedir'], '', $dest );

	$wpdb->insert( $table, [
		'user_id'  => $user_id,
		'type'     => 'file',
		'filename' => sanitize_file_name( basename( $dest ) ),
		'filepath' => $relative_path,
		'filesize' => $file['size'],
	], [ '%d', '%s', '%s', '%s', '%d' ] );

	document_clipboard_cleanup( $user_id );

	$row = $wpdb->get_row( $wpdb->prepare(
		"SELECT * FROM $table WHERE id = %d", $wpdb->insert_id
	), ARRAY_A );

	// Add download URL
	$row['download_url'] = $upload_dir['baseurl'] . $relative_path;

	wp_send_json_success( $row );
}
add_action( 'wp_ajax_clipboard_upload', 'document_clipboard_upload' );

/**
 * List clipboard history for current user
 */
function document_clipboard_list() {
	document_clipboard_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';
	$user_id = get_current_user_id();

	$page = max( 1, intval( $_POST['page'] ?? 1 ) );
	$per_page = 50;
	$offset = ( $page - 1 ) * $per_page;

	$search = sanitize_text_field( $_POST['search'] ?? '' );

	$where = $wpdb->prepare( "WHERE user_id = %d", $user_id );
	if ( $search ) {
		$like = '%' . $wpdb->esc_like( $search ) . '%';
		$where .= $wpdb->prepare( " AND (content LIKE %s OR filename LIKE %s)", $like, $like );
	}

	$type_filter = sanitize_text_field( $_POST['type'] ?? '' );
	if ( $type_filter && in_array( $type_filter, [ 'text', 'file' ] ) ) {
		$where .= $wpdb->prepare( " AND type = %s", $type_filter );
	}

	$total = $wpdb->get_var( "SELECT COUNT(*) FROM $table $where" );
	$rows = $wpdb->get_results(
		"SELECT * FROM $table $where ORDER BY created_at DESC LIMIT $per_page OFFSET $offset",
		ARRAY_A
	);

	// Add download URLs for files
	$upload_dir = wp_upload_dir();
	foreach ( $rows as &$row ) {
		if ( $row['type'] === 'file' && $row['filepath'] ) {
			$row['download_url'] = $upload_dir['baseurl'] . $row['filepath'];
		}
	}

	wp_send_json_success( [
		'items'    => $rows ?: [],
		'total'    => intval( $total ),
		'page'     => $page,
		'per_page' => $per_page,
	] );
}
add_action( 'wp_ajax_clipboard_list', 'document_clipboard_list' );

/**
 * Delete a clipboard entry
 */
function document_clipboard_delete() {
	document_clipboard_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';
	$user_id = get_current_user_id();

	$id = intval( $_POST['id'] ?? 0 );
	if ( ! $id ) {
		wp_send_json_error( 'Invalid ID' );
	}

	// Only delete own entries
	$row = $wpdb->get_row( $wpdb->prepare(
		"SELECT * FROM $table WHERE id = %d AND user_id = %d", $id, $user_id
	), ARRAY_A );

	if ( ! $row ) {
		wp_send_json_error( 'Entry not found' );
	}

	// Delete file from disk if it's a file entry
	if ( $row['type'] === 'file' && $row['filepath'] ) {
		$upload_dir = wp_upload_dir();
		$full_path = $upload_dir['basedir'] . $row['filepath'];
		if ( file_exists( $full_path ) ) {
			unlink( $full_path );
		}
	}

	$wpdb->delete( $table, [ 'id' => $id, 'user_id' => $user_id ], [ '%d', '%d' ] );
	wp_send_json_success( [ 'deleted' => $id ] );
}
add_action( 'wp_ajax_clipboard_delete', 'document_clipboard_delete' );

/**
 * Clear all clipboard entries for current user
 */
function document_clipboard_clear() {
	document_clipboard_check_permission();
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';
	$user_id = get_current_user_id();

	// Delete all files
	$files = $wpdb->get_results( $wpdb->prepare(
		"SELECT filepath FROM $table WHERE user_id = %d AND type = 'file' AND filepath IS NOT NULL",
		$user_id
	), ARRAY_A );

	$upload_dir = wp_upload_dir();
	foreach ( $files as $f ) {
		$full_path = $upload_dir['basedir'] . $f['filepath'];
		if ( file_exists( $full_path ) ) {
			unlink( $full_path );
		}
	}

	$wpdb->delete( $table, [ 'user_id' => $user_id ], [ '%d' ] );
	wp_send_json_success( [ 'cleared' => true ] );
}
add_action( 'wp_ajax_clipboard_clear', 'document_clipboard_clear' );

/**
 * Keep only latest 200 entries per user, delete oldest + their files
 */
function document_clipboard_cleanup( $user_id ) {
	global $wpdb;
	$table = $wpdb->prefix . 'document_clipboard';

	$count = $wpdb->get_var( $wpdb->prepare(
		"SELECT COUNT(*) FROM $table WHERE user_id = %d", $user_id
	));

	if ( $count > 200 ) {
		// Get IDs to delete (oldest beyond 200)
		$to_delete = $wpdb->get_results( $wpdb->prepare(
			"SELECT id, type, filepath FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT %d, %d",
			$user_id, 200, $count - 200
		), ARRAY_A );

		$upload_dir = wp_upload_dir();
		$ids = [];
		foreach ( $to_delete as $row ) {
			$ids[] = intval( $row['id'] );
			if ( $row['type'] === 'file' && $row['filepath'] ) {
				$full_path = $upload_dir['basedir'] . $row['filepath'];
				if ( file_exists( $full_path ) ) {
					unlink( $full_path );
				}
			}
		}

		if ( $ids ) {
			$ids_str = implode( ',', $ids );
			$wpdb->query( "DELETE FROM $table WHERE id IN ($ids_str)" );
		}
	}
}
