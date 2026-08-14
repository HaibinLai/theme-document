<?php

/*
 * 文章发布/更新邮件通知
 */

function nicen_theme_post_notify_enabled() {
	return (int) nicen_theme_config( 'document_post_notify_open', false ) === 1;
}

function nicen_theme_post_notify_update_enabled() {
	return (int) nicen_theme_config( 'document_post_notify_update_open', false ) === 1;
}

function nicen_theme_post_notify_recipients() {
	$raw = (string) nicen_theme_config( 'document_post_notify_recipients', false );
	if ( trim( $raw ) === '' ) {
		return [];
	}

	$items = preg_split( '/[\s,;，；]+/', $raw );
	$emails = [];

	foreach ( $items as $item ) {
		$email = sanitize_email( trim( $item ) );
		if ( is_email( $email ) ) {
			$emails[] = $email;
		}
	}

	return array_values( array_unique( $emails ) );
}

function nicen_theme_post_notify_from_email() {
	$from = sanitize_email( (string) nicen_theme_config( 'document_post_notify_from_email', false ) );
	if ( is_email( $from ) ) {
		return $from;
	}

	$smtp_account = sanitize_email( (string) nicen_theme_config( 'document_smtp_acccount', false ) );
	if ( is_email( $smtp_account ) ) {
		return $smtp_account;
	}

	return get_option( 'admin_email' );
}

function nicen_theme_post_notify_should_skip( $post ) {
	if ( ! $post instanceof WP_Post || $post->post_type !== 'post' || $post->post_status !== 'publish' ) {
		return true;
	}

	if ( wp_is_post_revision( $post->ID ) || wp_is_post_autosave( $post->ID ) ) {
		return true;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return true;
	}

	return false;
}

function nicen_theme_post_notify_excerpt( $post ) {
	$excerpt = has_excerpt( $post ) ? $post->post_excerpt : wp_trim_words( wp_strip_all_tags( $post->post_content ), 80, '...' );

	return trim( $excerpt );
}

function nicen_theme_post_notify_send( $post_id, $type = 'updated' ) {
	if ( ! nicen_theme_post_notify_enabled() ) {
		return;
	}

	$post = get_post( $post_id );
	if ( nicen_theme_post_notify_should_skip( $post ) ) {
		return;
	}

	$recipients = nicen_theme_post_notify_recipients();
	if ( empty( $recipients ) ) {
		return;
	}

	$sent_key    = '_document_post_notify_last_sent';
	$fingerprint = $type . ':' . $post->post_modified_gmt;
	if ( get_post_meta( $post_id, $sent_key, true ) === $fingerprint ) {
		return;
	}

	$blog_name = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
	$title     = wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES );
	$url       = get_permalink( $post );
	$label     = $type === 'published' ? 'New post' : 'Post updated';
	$subject   = sprintf( '[%s] %s: %s', $blog_name, $label, $title );
	$from      = nicen_theme_post_notify_from_email();
	$headers   = [
		'From: "' . $blog_name . '" <' . $from . '>',
		'Content-Type: text/html; charset=' . get_option( 'blog_charset' ),
	];

	$message = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.65;color:#222;background:#f6f7f9;padding:32px 0;">'
	           . '<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">'
	           . '<div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">'
	           . '<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">' . esc_html( $label ) . '</p>'
	           . '<h1 style="margin:0;font-size:24px;line-height:1.35;color:#111827;">' . esc_html( $title ) . '</h1>'
	           . '</div>'
	           . '<div style="padding:24px 28px;">'
	           . '<p style="margin:0 0 18px;color:#374151;">' . esc_html( nicen_theme_post_notify_excerpt( $post ) ) . '</p>'
	           . '<p style="margin:0 0 24px;"><a href="' . esc_url( $url ) . '" style="display:inline-block;background:#3eaf7c;color:#fff;text-decoration:none;padding:10px 16px;border-radius:5px;">Read the post</a></p>'
	           . '<p style="margin:0;color:#9ca3af;font-size:12px;">This email was sent automatically by ' . esc_html( $blog_name ) . '.</p>'
	           . '</div>'
	           . '</div>'
	           . '</div>';

	if ( wp_mail( $recipients, $subject, $message, $headers ) ) {
		update_post_meta( $post_id, $sent_key, $fingerprint );
	}
}

function nicen_theme_post_notify_on_status_change( $new_status, $old_status, $post ) {
	if ( $new_status === 'publish' && $old_status !== 'publish' ) {
		nicen_theme_post_notify_send( $post->ID, 'published' );
	}
}

function nicen_theme_post_notify_on_update( $post_id, $post_after, $post_before ) {
	if ( ! nicen_theme_post_notify_update_enabled() ) {
		return;
	}

	if ( $post_before->post_status !== 'publish' || $post_after->post_status !== 'publish' ) {
		return;
	}

	if ( $post_before->post_modified_gmt === $post_after->post_modified_gmt ) {
		return;
	}

	nicen_theme_post_notify_send( $post_id, 'updated' );
}

add_action( 'transition_post_status', 'nicen_theme_post_notify_on_status_change', 10, 3 );
add_action( 'post_updated', 'nicen_theme_post_notify_on_update', 10, 3 );
