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
                <h2 style="margin-bottom: 20px;">待办事项</h2>

                <!-- 添加区域 -->
                <div class="todo-add">
                    <input type="text" id="todo-input" class="todo-add-input" placeholder="添加新的待办事项..." autocomplete="off">
                    <select id="todo-priority" class="todo-add-select">
                        <option value="medium">中优先级</option>
                        <option value="high">高优先级</option>
                        <option value="low">低优先级</option>
                    </select>
                    <input type="date" id="todo-date" class="todo-add-date">
                    <button id="todo-add-btn" class="todo-add-btn">添加</button>
                </div>

                <!-- 筛选栏 -->
                <div class="todo-filters">
                    <button class="todo-filter-btn active" data-filter="all">全部</button>
                    <button class="todo-filter-btn" data-filter="active">未完成</button>
                    <button class="todo-filter-btn" data-filter="completed">已完成</button>
                </div>

                <!-- 统计 -->
                <div id="todo-stats" class="todo-stats"></div>

                <!-- 列表 -->
                <div id="todo-list" class="todo-list">
                    <div class="todo-loading">加载中...</div>
                </div>
            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
