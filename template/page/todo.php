<?php
/**
 * 待办事项页面模板
 * Template Name: 待办事项
 * @author Haibin
 * @date 2026-04-17
 */

/* 仅管理员可访问 */
if ( ! current_user_can( 'administrator' ) ) {
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
            <div class="todo-container">

                <!-- 标题区 -->
                <div class="todo-header">
                    <h2>&#128203; 待办事项</h2>
                    <p>管理你的任务，保持高效</p>
                </div>

                <!-- 添加区域 -->
                <div class="todo-add">
                    <input type="text" id="todo-input" class="todo-add-input" placeholder="输入新的待办事项，回车添加..." autocomplete="off">
                    <select id="todo-priority" class="todo-add-select">
                        <option value="thisweek">这周处理</option>
                        <option value="urgent">紧急</option>
                        <option value="twodays">这两天</option>
                        <option value="anytime">随时可以</option>
                    </select>
                    <div class="todo-add-importance">
                        <span>重要:</span>
                        <input type="range" id="todo-importance" min="1" max="5" value="3">
                        <span class="importance-label" id="todo-importance-label">★★★☆☆</span>
                    </div>
                    <input type="date" id="todo-date" class="todo-add-date">
                    <button id="todo-add-btn" class="todo-add-btn">+ 添加</button>
                </div>

                <!-- 番茄钟计时条容器（最多3个并行，一行展示） -->
                <div id="pomodoro-container" class="pomodoro-container"></div>

                <!-- 进度条 -->
                <div class="todo-progress">
                    <div class="todo-progress-bar" id="todo-progress-bar" style="width: 0%"></div>
                </div>

                <!-- 工具栏：视图切换 + 筛选 + 统计 -->
                <div class="todo-toolbar">
                    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                        <div class="todo-views">
                            <button class="todo-view-btn" data-view="list">&#128196; 列表</button>
                            <button class="todo-view-btn active" data-view="chart">&#128200; 矩阵</button>
                        </div>
                        <div class="todo-filters">
                            <button class="todo-filter-btn active" data-filter="all">全部</button>
                            <button class="todo-filter-btn" data-filter="active">未完成</button>
                            <button class="todo-filter-btn" data-filter="completed">已完成</button>
                        </div>
                    </div>
                    <div id="todo-stats" class="todo-stats"></div>
                </div>

                <!-- 列表视图 -->
                <div id="todo-list" class="todo-list" style="display:none;">
                    <div class="todo-loading">加载中...</div>
                </div>

                <!-- 2D矩阵视图 + 侧边栏 -->
                <div id="todo-matrix-wrap" class="todo-matrix-wrap">
                    <div id="todo-chart-wrap" class="todo-chart-wrap">
                        <canvas id="todo-chart"></canvas>
                    </div>
                    <div id="todo-sidebar" class="todo-sidebar"></div>
                </div>
            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
