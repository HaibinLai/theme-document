<?php
/**
 * 阅读统计 - 页面模板
 * Template Name: 阅读统计
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
            <div class="stats-container">

                <div class="stats-header">
                    <h2>阅读统计</h2>
                    <p>博客访问数据概览</p>
                </div>

                <div class="stats-overview" id="stats-overview">
                    <div class="stats-card">
                        <div class="stats-card-value" id="stats-total-views">--</div>
                        <div class="stats-card-label">总浏览量</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-value" id="stats-today-views">--</div>
                        <div class="stats-card-label">今日浏览</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-value" id="stats-total-posts">--</div>
                        <div class="stats-card-label">文章总数</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-value" id="stats-avg-views">--</div>
                        <div class="stats-card-label">篇均浏览</div>
                    </div>
                </div>

                <div class="stats-section">
                    <div class="stats-section-header">
                        <h3>访问趋势</h3>
                        <div class="stats-period-selector" id="stats-period-selector">
                            <button class="stats-period-btn" data-days="7">7天</button>
                            <button class="stats-period-btn active" data-days="30">30天</button>
                            <button class="stats-period-btn" data-days="90">90天</button>
                        </div>
                    </div>
                    <div class="stats-chart-wrap" id="stats-chart-wrap">
                        <div class="stats-loading">加载中...</div>
                    </div>
                </div>

                <div class="stats-section">
                    <div class="stats-section-header">
                        <h3>热门文章</h3>
                    </div>
                    <div class="stats-table-wrap" id="stats-popular-wrap">
                        <div class="stats-loading">加载中...</div>
                    </div>
                </div>

            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
