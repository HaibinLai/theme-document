<?php
/**
 * 阅读趋势 - 页面模板
 * Template Name: 阅读趋势
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
            <div class="trend-container">

                <div class="trend-header">
                    <h2>阅读趋势</h2>
                    <div class="trend-period-selector" id="trend-period-selector">
                        <button class="trend-period-btn" data-days="7">7天</button>
                        <button class="trend-period-btn active" data-days="30">30天</button>
                        <button class="trend-period-btn" data-days="90">90天</button>
                    </div>
                </div>

                <div class="trend-chart-wrap" id="trend-chart-wrap">
                    <div class="trend-loading">加载中...</div>
                </div>

                <div class="trend-legend" id="trend-legend"></div>

            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
