<?php
/**
 * Clipboard Helper - Page template
 * Template Name: Clipboard
 * @author Haibin
 * @date 2026-04-17
 */

if ( ! is_user_logged_in() ) {
	global $wp_query;
	$wp_query->set_404();
	status_header( 404 );
	get_template_part( 404 );
	exit;
}

get_header();
?>

<main class="main-container no-sidebar">
    <div class="main-main">
        <article class="main-content">
            <div class="cb-container">

                <!-- Header -->
                <div class="cb-header">
                    <h2>&#128203; Clipboard</h2>
                    <p>Your copy history & temporary file storage</p>
                </div>

                <!-- Input area: paste + upload -->
                <div class="cb-input-area">
                    <div class="cb-paste-area">
                        <textarea id="cb-paste-input" class="cb-textarea" placeholder="Paste or type text here..." rows="3"></textarea>
                        <button id="cb-paste-btn" class="cb-btn cb-btn-primary">Save Text</button>
                    </div>
                    <div class="cb-upload-area" id="cb-upload-area">
                        <div class="cb-upload-icon">&#128228;</div>
                        <div class="cb-upload-text">Drop file here or <label for="cb-file-input" class="cb-upload-link">browse</label></div>
                        <div class="cb-upload-hint">Max 10MB per file</div>
                        <input type="file" id="cb-file-input" style="display:none;">
                        <div class="cb-upload-progress" id="cb-upload-progress" style="display:none;">
                            <div class="cb-progress-bar" id="cb-progress-bar"></div>
                        </div>
                    </div>
                </div>

                <!-- Toolbar: search + filter + clear -->
                <div class="cb-toolbar">
                    <div class="cb-search-wrap">
                        <input type="text" id="cb-search" class="cb-search" placeholder="Search..." autocomplete="off">
                    </div>
                    <div class="cb-filters">
                        <button class="cb-filter-btn active" data-type="">All</button>
                        <button class="cb-filter-btn" data-type="text">Text</button>
                        <button class="cb-filter-btn" data-type="file">Files</button>
                    </div>
                    <div class="cb-toolbar-right">
                        <span id="cb-stats" class="cb-stats"></span>
                        <button id="cb-clear-btn" class="cb-btn cb-btn-danger" title="Clear all">&#128465; Clear All</button>
                    </div>
                </div>

                <!-- Clipboard list -->
                <div id="cb-list" class="cb-list">
                    <div class="cb-loading">Loading...</div>
                </div>

                <!-- Pagination -->
                <div id="cb-pagination" class="cb-pagination"></div>
            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
