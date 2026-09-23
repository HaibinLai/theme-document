<?php
/**
 * WordPress 数据导出工具
 *
 * 导出当前数据库中的全部表，适合迁移到新的 WordPress 数据库。
 */

function document_export_admin_menu() {
	add_submenu_page(
		'document_theme',
		'数据导出',
		'数据导出',
		'manage_options',
		'document-data-export',
		'document_export_admin_page'
	);
}
add_action( 'admin_menu', 'document_export_admin_menu' );

function document_export_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>博客数据导出</h1>
		<p>下载一个包含完整数据库备份和导入说明的 ZIP 文件。</p>
		<p>备份包括文章、页面、评论、用户、分类、标签、媒体记录、站点设置，以及主题和插件创建的数据库表。</p>
		<p><strong>提示：</strong>图片、附件等实际文件位于服务器的 <code>wp-content/uploads</code> 目录，需要另外复制到新站点。</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="document_export_database">
			<?php wp_nonce_field( 'document_export_database' ); ?>
			<?php submit_button( '下载完整数据备份', 'primary', 'submit', false ); ?>
		</form>
	</div>
	<?php
}

function document_export_sql_value( $value ) {
	global $wpdb;

	if ( null === $value ) {
		return 'NULL';
	}

	return "'" . $wpdb->_real_escape( (string) $value ) . "'";
}

function document_export_database_sql( $file ) {
	global $wpdb;

	$tables = $wpdb->get_col( 'SHOW TABLES' );
	if ( empty( $tables ) ) {
		return new WP_Error( 'no_tables', '没有找到可导出的数据库表。' );
	}

	$handle = fopen( $file, 'wb' );
	if ( ! $handle ) {
		return new WP_Error( 'open_failed', '无法创建数据库备份文件。' );
	}

	fwrite( $handle, "-- WordPress database export\n-- Generated: " . current_time( 'mysql' ) . "\n\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n" );

	foreach ( $tables as $table ) {
		$quoted_table = '`' . str_replace( '`', '``', $table ) . '`';
		$create       = $wpdb->get_row( "SHOW CREATE TABLE $quoted_table", ARRAY_N );
		if ( empty( $create[1] ) ) {
			continue;
		}

		fwrite( $handle, "DROP TABLE IF EXISTS $quoted_table;\n" );
		fwrite( $handle, $create[1] . ";\n\n" );

		$offset = 0;
		$limit  = 500;
		while ( true ) {
			$rows = $wpdb->get_results( "SELECT * FROM $quoted_table LIMIT $offset, $limit", ARRAY_A );
			if ( empty( $rows ) ) {
				break;
			}

			foreach ( $rows as $row ) {
				$columns = array_map(
					function ( $column ) {
						return '`' . str_replace( '`', '``', $column ) . '`';
					},
					array_keys( $row )
				);
				$values = array_map( 'document_export_sql_value', array_values( $row ) );
				fwrite( $handle, "INSERT INTO $quoted_table (" . implode( ',', $columns ) . ") VALUES (" . implode( ',', $values ) . ");\n" );
			}

			$offset += $limit;
			if ( count( $rows ) < $limit ) {
				break;
			}
		}

		fwrite( $handle, "\n" );
	}

	fwrite( $handle, "SET FOREIGN_KEY_CHECKS=1;\n" );
	fclose( $handle );

	return true;
}

function document_export_database_readme() {
	return "博客数据迁移说明\n\n"
		. "1. 将 wp-content/uploads 整个目录复制到新站点对应位置。\n"
		. "2. 在新站点创建数据库，并使用 phpMyAdmin、Adminer 或 MySQL 客户端导入 database.sql。\n"
		. "3. 修改新站点的 wp-config.php，使数据库名称、用户名、密码和表前缀匹配。\n"
		. "4. 复制并启用主题和需要的插件。\n"
		. "5. 登录后台后到 设置 > 固定链接，直接点击一次保存，刷新链接规则。\n\n"
		. "database.sql 包含当前数据库中的全部表：文章、页面、评论、用户、设置、媒体记录，以及主题和插件数据。\n"
		. "实际图片、附件和其他上传文件不在 SQL 中，必须单独复制 uploads 目录。\n";
}

function document_export_handle_database() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( '你没有权限导出博客数据。', 403 );
	}
	check_admin_referer( 'document_export_database' );

	if ( ! class_exists( 'ZipArchive' ) ) {
		wp_die( '服务器没有启用 ZipArchive，无法生成 ZIP 备份。请先启用 PHP zip 扩展。', 500 );
	}

	$zip_path = wp_tempnam( 'document-blog-export' );
	$sql_path = wp_tempnam( 'document-blog-database' );
	if ( ! $zip_path || ! $sql_path ) {
		wp_die( '无法创建临时备份文件。', 500 );
	}

	$result = document_export_database_sql( $sql_path );
	if ( is_wp_error( $result ) ) {
		@unlink( $zip_path );
		@unlink( $sql_path );
		wp_die( esc_html( $result->get_error_message() ), 500 );
	}

	$zip = new ZipArchive();
	if ( true !== $zip->open( $zip_path, ZipArchive::OVERWRITE ) ) {
		@unlink( $zip_path );
		@unlink( $sql_path );
		wp_die( '无法创建 ZIP 备份文件。', 500 );
	}

	$zip->addFile( $sql_path, 'database.sql' );
	$zip->addFromString( 'README.txt', document_export_database_readme() );
	$zip->addFromString(
		'manifest.json',
		wp_json_encode(
			[
				'generated_at' => current_time( 'mysql' ),
				'site_url'     => home_url( '/' ),
				'table_count'  => count( (array) $GLOBALS['wpdb']->get_col( 'SHOW TABLES' ) ),
				'uploads'      => 'wp-content/uploads must be copied separately',
			],
			JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
		)
	);
	$zip->close();

	$filename = 'wordpress-backup-' . gmdate( 'Y-m-d-His' ) . '.zip';
	nocache_headers();
	header( 'Content-Type: application/zip' );
	header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
	header( 'Content-Length: ' . filesize( $zip_path ) );
	readfile( $zip_path );

	@unlink( $zip_path );
	@unlink( $sql_path );
	exit;
}
add_action( 'admin_post_document_export_database', 'document_export_handle_database' );
