<?php

/*
 * 读者邮件订阅申请与审核
 */

function document_email_subscribe_table() {
	global $wpdb;

	return $wpdb->prefix . 'document_email_subscribers';
}

function document_email_subscribe_create_table() {
	global $wpdb;

	$table           = document_email_subscribe_table();
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE $table (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		email varchar(190) NOT NULL,
		name varchar(120) DEFAULT '',
		status varchar(20) NOT NULL DEFAULT 'pending',
		ip varchar(45) DEFAULT '',
		user_agent varchar(255) DEFAULT '',
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		approved_at datetime DEFAULT NULL,
		approved_by bigint(20) unsigned DEFAULT 0,
		PRIMARY KEY (id),
		UNIQUE KEY uk_email (email),
		KEY idx_status (status),
		KEY idx_created (created_at)
	) $charset_collate;";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}

function document_email_subscribe_maybe_create_table() {
	global $wpdb;

	$table = document_email_subscribe_table();
	if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) {
		document_email_subscribe_create_table();
	}
}

add_action( 'after_switch_theme', 'document_email_subscribe_create_table' );
add_action( 'init', 'document_email_subscribe_maybe_create_table' );

function document_email_subscribe_enabled() {
	return (int) nicen_theme_config( 'document_email_subscribe_open', false ) === 1;
}

function document_email_subscribe_slug() {
	return 'subscribe';
}

function document_email_subscribe_url() {
	return home_url( '/' . document_email_subscribe_slug() . '/' );
}

function document_email_subscribe_add_rewrite_rule() {
	add_rewrite_rule( '^' . document_email_subscribe_slug() . '/?$', 'index.php?document_email_subscribe_page=1', 'top' );
}

function document_email_subscribe_query_vars( $vars ) {
	$vars[] = 'document_email_subscribe_page';

	return $vars;
}

function document_email_subscribe_maybe_flush_rewrite() {
	$version = '20260815';
	if ( get_option( 'document_email_subscribe_rewrite_version' ) === $version ) {
		return;
	}

	document_email_subscribe_add_rewrite_rule();
	flush_rewrite_rules( false );
	update_option( 'document_email_subscribe_rewrite_version', $version );
}

add_action( 'init', 'document_email_subscribe_add_rewrite_rule' );
add_action( 'init', 'document_email_subscribe_maybe_flush_rewrite', 20 );
add_filter( 'query_vars', 'document_email_subscribe_query_vars' );

function document_email_subscribe_redirect( $url, $status ) {
	wp_safe_redirect( add_query_arg( 'document_subscribe', $status, $url ?: document_email_subscribe_url() ) );
	exit;
}

function document_email_subscribe_form_signature( $timestamp ) {
	return wp_hash( absint( $timestamp ) . '|document_email_subscribe' );
}

function document_email_subscribe_verify_form_signature( $timestamp, $signature ) {
	$timestamp = absint( $timestamp );
	if ( ! $timestamp || ! $signature ) {
		return false;
	}

	$expected = document_email_subscribe_form_signature( $timestamp );
	if ( ! hash_equals( $expected, $signature ) ) {
		return false;
	}

	$age = time() - $timestamp;

	return $age >= 2 && $age <= HOUR_IN_SECONDS;
}

function document_email_subscribe_is_rate_limited( $email, $ip ) {
	if ( get_transient( 'document_email_subscribe_ip_' . md5( $ip ) ) ) {
		return true;
	}

	if ( get_transient( 'document_email_subscribe_email_' . md5( strtolower( $email ) ) ) ) {
		return true;
	}

	global $wpdb;
	$table   = document_email_subscribe_table();
	$day_ago = date( 'Y-m-d H:i:s', current_time( 'timestamp' ) - DAY_IN_SECONDS );
	$pending = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM $table WHERE ip = %s AND status = 'pending' AND created_at >= %s",
			$ip,
			$day_ago
		)
	);

	return $pending >= 5;
}

function document_email_subscribe_mark_rate_limit( $email, $ip ) {
	set_transient( 'document_email_subscribe_ip_' . md5( $ip ), 1, 10 * MINUTE_IN_SECONDS );
	set_transient( 'document_email_subscribe_email_' . md5( strtolower( $email ) ), 1, HOUR_IN_SECONDS );
}

function document_email_subscribe_handle_request() {
	if ( ! document_email_subscribe_enabled() ) {
		document_email_subscribe_redirect( wp_get_referer(), 'closed' );
	}

	$redirect = isset( $_POST['redirect_to'] ) ? esc_url_raw( wp_unslash( $_POST['redirect_to'] ) ) : wp_get_referer();
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['document_email_subscribe_nonce'] ?? '' ) ), 'document_email_subscribe' ) ) {
		document_email_subscribe_redirect( $redirect, 'invalid' );
	}

	if ( trim( (string) wp_unslash( $_POST['document_email_subscribe_hp'] ?? '' ) ) !== '' ) {
		document_email_subscribe_redirect( $redirect, 'invalid' );
	}

	$started   = absint( $_POST['document_email_subscribe_started'] ?? 0 );
	$signature = sanitize_text_field( wp_unslash( $_POST['document_email_subscribe_signature'] ?? '' ) );
	if ( ! document_email_subscribe_verify_form_signature( $started, $signature ) ) {
		document_email_subscribe_redirect( $redirect, 'invalid' );
	}

	$email = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
	$name  = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );

	if ( ! is_email( $email ) ) {
		document_email_subscribe_redirect( $redirect, 'invalid' );
	}

	document_email_subscribe_maybe_create_table();

	global $wpdb;
	$table = document_email_subscribe_table();
	$now   = current_time( 'mysql' );
	$ip    = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) );
	$agent = substr( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ?? '' ) ), 0, 255 );

	if ( document_email_subscribe_is_rate_limited( $email, $ip ) ) {
		document_email_subscribe_redirect( $redirect, 'limited' );
	}

	$existing = $wpdb->get_row( $wpdb->prepare( "SELECT id, status FROM $table WHERE email = %s", $email ) );
	if ( $existing && $existing->status === 'approved' ) {
		document_email_subscribe_redirect( $redirect, 'already' );
	}

	if ( $existing ) {
		$ok = $wpdb->update(
			$table,
			[
				'name'       => $name,
				'status'     => 'pending',
				'ip'         => $ip,
				'user_agent' => $agent,
				'updated_at' => $now,
			],
			[ 'id' => (int) $existing->id ],
			[ '%s', '%s', '%s', '%s', '%s' ],
			[ '%d' ]
		);
	} else {
		$ok = $wpdb->insert(
			$table,
			[
				'email'      => $email,
				'name'       => $name,
				'status'     => 'pending',
				'ip'         => $ip,
				'user_agent' => $agent,
				'created_at' => $now,
				'updated_at' => $now,
			],
			[ '%s', '%s', '%s', '%s', '%s', '%s', '%s' ]
		);
	}

	if ( $ok !== false ) {
		document_email_subscribe_mark_rate_limit( $email, $ip );
	}

	document_email_subscribe_redirect( $redirect, $ok === false ? 'error' : 'pending' );
}

add_action( 'admin_post_document_email_subscribe', 'document_email_subscribe_handle_request' );
add_action( 'admin_post_nopriv_document_email_subscribe', 'document_email_subscribe_handle_request' );

function document_email_subscribe_status_message() {
	$status = sanitize_key( wp_unslash( $_GET['document_subscribe'] ?? '' ) );
	$messages = [
		'pending' => '订阅申请已提交，等待站长批准。',
		'already' => '这个邮箱已经在订阅列表中。',
		'invalid' => '订阅失败，请检查邮箱地址后再试。',
		'limited' => '提交太频繁，请稍后再试。',
		'closed' => '订阅入口暂时关闭。',
		'error' => '订阅失败，请稍后再试。',
	];

	return $messages[ $status ] ?? '';
}

function document_email_subscribe_render_form( $redirect_to = '' ) {
	if ( ! document_email_subscribe_enabled() ) {
		return;
	}

	$message     = document_email_subscribe_status_message();
	$redirect_to = $redirect_to ?: document_email_subscribe_url();
	$started     = time();
	$signature   = document_email_subscribe_form_signature( $started );
	?>
    <section class="email-subscribe">
        <div class="email-subscribe-main">
            <h2>Subscribe by email</h2>
            <p>Get a short email when a new post is published. Every subscription is approved manually.</p>
            <?php if ( $message ) { ?>
                <p class="email-subscribe-message"><?php echo esc_html( $message ); ?></p>
            <?php } ?>
            <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
                <input type="hidden" name="action" value="document_email_subscribe">
                <input type="hidden" name="redirect_to" value="<?php echo esc_url( $redirect_to ); ?>">
                <input type="hidden" name="document_email_subscribe_started" value="<?php echo esc_attr( $started ); ?>">
                <input type="hidden" name="document_email_subscribe_signature" value="<?php echo esc_attr( $signature ); ?>">
				<?php wp_nonce_field( 'document_email_subscribe', 'document_email_subscribe_nonce' ); ?>
                <input class="email-subscribe-hp" type="text" name="document_email_subscribe_hp" value="" tabindex="-1" autocomplete="new-password" aria-hidden="true">
                <input type="text" name="name" placeholder="Name (optional)" autocomplete="name">
                <input type="email" name="email" placeholder="Email address" autocomplete="email" required>
                <button type="submit">Subscribe</button>
            </form>
        </div>
    </section>
	<?php
}

function document_email_subscribe_render_page() {
	if ( ! get_query_var( 'document_email_subscribe_page' ) ) {
		return;
	}

	status_header( 200 );
	nocache_headers();
	get_header();
	?>
    <main class="main-container email-subscribe-page" role="main">
        <div class="main-main">
            <article class="main-content">
                <header class="email-subscribe-page-header">
                    <p class="email-subscribe-eyebrow"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></p>
                    <h1>Email Subscription</h1>
                    <p>Leave your email here if you want new-post reminders. I review each request before it joins the mailing list.</p>
                </header>
				<?php document_email_subscribe_render_form( document_email_subscribe_url() ); ?>
                <section class="email-subscribe-guard">
                    <h2>How this is protected</h2>
                    <p>Requests use WordPress nonces, a hidden honeypot field, a signed time check, IP/email rate limits, and manual approval in the dashboard.</p>
                </section>
            </article>
        </div>
    </main>
	<?php
	get_footer();
	exit;
}

add_action( 'template_redirect', 'document_email_subscribe_render_page' );

function document_email_subscribe_approved_emails() {
	global $wpdb;

	$table = document_email_subscribe_table();
	$emails = $wpdb->get_col( "SELECT email FROM $table WHERE status = 'approved' ORDER BY approved_at DESC, created_at DESC" );

	return array_values( array_filter( array_map( 'sanitize_email', (array) $emails ), 'is_email' ) );
}

function document_email_subscribe_admin_menu() {
	add_submenu_page(
		'document_theme',
		'邮件订阅',
		'邮件订阅',
		'manage_options',
		'document-email-subscribe',
		'document_email_subscribe_admin_page'
	);
}

add_action( 'admin_menu', 'document_email_subscribe_admin_menu' );

function document_email_subscribe_handle_admin_action() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to manage subscriptions.', 'default' ) );
	}

	check_admin_referer( 'document_email_subscribe_admin_action' );

	$id     = absint( $_POST['subscriber_id'] ?? 0 );
	$action = sanitize_key( wp_unslash( $_POST['subscriber_action'] ?? '' ) );
	if ( ! $id ) {
		wp_safe_redirect( wp_get_referer() ?: admin_url( 'admin.php?page=document-email-subscribe' ) );
		exit;
	}

	global $wpdb;
	$table = document_email_subscribe_table();
	$now   = current_time( 'mysql' );

	if ( $action === 'approve' ) {
		$wpdb->update(
			$table,
			[
				'status'      => 'approved',
				'updated_at'  => $now,
				'approved_at' => $now,
				'approved_by' => get_current_user_id(),
			],
			[ 'id' => $id ],
			[ '%s', '%s', '%s', '%d' ],
			[ '%d' ]
		);
	} elseif ( $action === 'reject' ) {
		$wpdb->update(
			$table,
			[
				'status'      => 'rejected',
				'updated_at'  => $now,
				'approved_at' => null,
				'approved_by' => 0,
			],
			[ 'id' => $id ],
			[ '%s', '%s', '%s', '%d' ],
			[ '%d' ]
		);
	} elseif ( $action === 'delete' ) {
		$wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );
	}

	wp_safe_redirect( wp_get_referer() ?: admin_url( 'admin.php?page=document-email-subscribe' ) );
	exit;
}

add_action( 'admin_post_document_email_subscribe_admin_action', 'document_email_subscribe_handle_admin_action' );

function document_email_subscribe_admin_action_button( $id, $action, $label, $class = 'button' ) {
	?>
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-block;margin-right:6px;">
        <input type="hidden" name="action" value="document_email_subscribe_admin_action">
        <input type="hidden" name="subscriber_id" value="<?php echo esc_attr( $id ); ?>">
        <input type="hidden" name="subscriber_action" value="<?php echo esc_attr( $action ); ?>">
		<?php wp_nonce_field( 'document_email_subscribe_admin_action' ); ?>
        <button class="<?php echo esc_attr( $class ); ?>" type="submit"><?php echo esc_html( $label ); ?></button>
    </form>
	<?php
}

function document_email_subscribe_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	document_email_subscribe_maybe_create_table();

	global $wpdb;
	$table  = document_email_subscribe_table();
	$status = sanitize_key( wp_unslash( $_GET['status'] ?? 'pending' ) );
	if ( ! in_array( $status, [ 'pending', 'approved', 'rejected', 'all' ], true ) ) {
		$status = 'pending';
	}

	$where = $status === 'all' ? '' : $wpdb->prepare( 'WHERE status = %s', $status );
	$items = $wpdb->get_results( "SELECT * FROM $table $where ORDER BY created_at DESC LIMIT 200" );
	$counts = [
		'pending'  => (int) $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE status = 'pending'" ),
		'approved' => (int) $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE status = 'approved'" ),
		'rejected' => (int) $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE status = 'rejected'" ),
		'all'      => (int) $wpdb->get_var( "SELECT COUNT(*) FROM $table" ),
	];
	?>
    <div class="wrap">
        <h1>邮件订阅</h1>
        <p>读者提交邮箱后会先进入待审核列表。只有批准后的邮箱才会收到文章邮件通知。</p>
        <p class="subsubsub">
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=document-email-subscribe&status=pending' ) ); ?>">待审核 (<?php echo esc_html( $counts['pending'] ); ?>)</a> |
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=document-email-subscribe&status=approved' ) ); ?>">已批准 (<?php echo esc_html( $counts['approved'] ); ?>)</a> |
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=document-email-subscribe&status=rejected' ) ); ?>">已拒绝 (<?php echo esc_html( $counts['rejected'] ); ?>)</a> |
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=document-email-subscribe&status=all' ) ); ?>">全部 (<?php echo esc_html( $counts['all'] ); ?>)</a>
        </p>
        <table class="widefat striped">
            <thead>
            <tr>
                <th>邮箱</th>
                <th>名称</th>
                <th>状态</th>
                <th>IP</th>
                <th>申请时间</th>
                <th>操作</th>
            </tr>
            </thead>
            <tbody>
			<?php if ( empty( $items ) ) { ?>
                <tr><td colspan="6">暂无订阅申请。</td></tr>
			<?php } ?>
			<?php foreach ( $items as $item ) { ?>
                <tr>
                    <td><?php echo esc_html( $item->email ); ?></td>
                    <td><?php echo esc_html( $item->name ); ?></td>
                    <td><?php echo esc_html( $item->status ); ?></td>
                    <td><?php echo esc_html( $item->ip ); ?></td>
                    <td><?php echo esc_html( $item->created_at ); ?></td>
                    <td>
						<?php
						if ( $item->status !== 'approved' ) {
							document_email_subscribe_admin_action_button( $item->id, 'approve', '批准', 'button button-primary' );
						}
						if ( $item->status !== 'rejected' ) {
							document_email_subscribe_admin_action_button( $item->id, 'reject', '拒绝' );
						}
						document_email_subscribe_admin_action_button( $item->id, 'delete', '删除' );
						?>
                    </td>
                </tr>
			<?php } ?>
            </tbody>
        </table>
    </div>
	<?php
}
