<?php
/**
 * 小玩具导航页面模板
 * Template Name: 小玩具
 * @author Haibin
 * @date 2026-04-17
 */

get_header();

$is_admin = current_user_can( 'administrator' );

/**
 * 玩具配置列表
 * 每项: name=名称, icon=emoji, desc=描述, url=链接, admin_only=是否仅管理员可见
 *
 * 管理员可在后台 "主题选项" 中管理，也可直接编辑此数组
 * admin_only = true  → 仅管理员可见（非管理员看不到该卡片）
 * admin_only = false → 所有人可见
 */
$toys = get_option( 'nicen_theme_toys', [] );

// 默认玩具列表（首次使用时初始化）
if ( empty( $toys ) ) {
    $toys = [
        [
            'name'       => '待办事项',
            'icon'       => '&#128203;',
            'desc'       => '管理日常任务，保持高效',
            'url'        => '/待办事项',
            'admin_only' => true,
        ],
    ];
    update_option( 'nicen_theme_toys', $toys );
}

// 非管理员过滤掉仅管理员可见的玩具
if ( ! $is_admin ) {
    $toys = array_filter( $toys, function( $toy ) {
        return empty( $toy['admin_only'] );
    });
}

// 如果非管理员且没有任何可见玩具，显示404
if ( ! $is_admin && empty( $toys ) ) {
    global $wp_query;
    $wp_query->set_404();
    status_header( 404 );
    get_template_part( 404 );
    exit;
}
?>

<main class="main-container no-sidebar">
    <div class="main-main">
        <article class="main-content">
            <div class="toys-container">

                <!-- 标题 -->
                <div class="toys-header">
                    <h2>&#127922; 小玩具</h2>
                    <p>点击卡片进入对应的小工具</p>
                </div>

                <!-- 卡片网格 -->
                <div class="toys-grid">
                    <?php foreach ( $toys as $index => $toy ) : ?>
                        <?php $toy_href = preg_match( '#^https?://#i', $toy['url'] ) ? $toy['url'] : home_url( $toy['url'] ); ?>
                        <a href="<?php echo esc_url( $toy_href ); ?>" class="toys-card" data-index="<?php echo $index; ?>"<?php echo preg_match( '#^https?://#i', $toy['url'] ) ? ' target="_blank" rel="noopener"' : ''; ?>>
                            <div class="toys-card-icon"><?php echo $toy['icon']; ?></div>
                            <div class="toys-card-name"><?php echo esc_html( $toy['name'] ); ?></div>
                            <div class="toys-card-desc"><?php echo esc_html( $toy['desc'] ); ?></div>
                            <?php if ( $is_admin && ! empty( $toy['admin_only'] ) ) : ?>
                                <span class="toys-card-badge" title="仅管理员可见">&#128274;</span>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>

                    <?php if ( $is_admin ) : ?>
                        <!-- 管理员专属：添加新玩具的卡片 -->
                        <div class="toys-card toys-card-add" id="toys-add-btn" title="添加新玩具">
                            <div class="toys-card-icon">&#10133;</div>
                            <div class="toys-card-name">添加玩具</div>
                        </div>
                    <?php endif; ?>
                </div>

            </div>
        </article>
    </div>
</main>

<?php if ( $is_admin ) : ?>
<!-- 管理员：添加/编辑弹窗 -->
<div class="toys-modal-overlay" id="toys-modal" style="display:none;">
    <div class="toys-modal">
        <div class="toys-modal-header">
            <h3 id="toys-modal-title">添加新玩具</h3>
            <button class="toys-modal-close" id="toys-modal-close">&times;</button>
        </div>
        <div class="toys-modal-body">
            <input type="hidden" id="toys-edit-index" value="-1">
            <label>名称
                <input type="text" id="toys-input-name" placeholder="例如：待办事项" autocomplete="off">
            </label>
            <label>图标 (Emoji)
                <input type="text" id="toys-input-icon" placeholder="例如：📋 或粘贴任意 emoji" autocomplete="off">
            </label>
            <label>描述
                <input type="text" id="toys-input-desc" placeholder="简短描述" autocomplete="off">
            </label>
            <label>链接路径
                <input type="text" id="toys-input-url" placeholder="例如：/待办事项" autocomplete="off">
            </label>
            <label class="toys-checkbox-label">
                <input type="checkbox" id="toys-input-admin"> 仅管理员可见
            </label>
        </div>
        <div class="toys-modal-footer">
            <button class="toys-btn toys-btn-delete" id="toys-delete-btn" style="display:none;">删除</button>
            <div style="flex:1;"></div>
            <button class="toys-btn toys-btn-cancel" id="toys-cancel-btn">取消</button>
            <button class="toys-btn toys-btn-save" id="toys-save-btn">保存</button>
        </div>
    </div>
</div>

<style>
/* ===== 小玩具导航页样式 ===== */
.toys-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 30px 20px 60px;
}
.toys-header {
    text-align: center;
    margin-bottom: 40px;
}
.toys-header h2 {
    font-size: 1.8rem;
    margin-bottom: 8px;
    color: var(--theme-text-color);
}
.toys-header p {
    color: var(--theme-text-secondary);
    font-size: var(--theme-secondary);
}

/* 网格 */
.toys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
}

/* 卡片 */
.toys-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px 24px;
    background: var(--theme-front-main-color);
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    text-decoration: none !important;
    color: inherit !important;
    border: 2px solid transparent;
}
.toys-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    border-color: var(--theme-color);
}
.toys-card-icon {
    font-size: 3rem;
    margin-bottom: 14px;
    line-height: 1;
}
.toys-card-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--theme-text-color);
    margin-bottom: 6px;
}
.toys-card-desc {
    font-size: 0.78rem;
    color: var(--theme-text-secondary);
    text-align: center;
    line-height: 1.4;
}
.toys-card-badge {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 0.85rem;
    opacity: 0.5;
}

/* 添加卡片 */
.toys-card-add {
    border: 2px dashed #ccc;
    background: transparent;
    box-shadow: none;
}
.toys-card-add:hover {
    border-color: var(--theme-color);
    background: rgba(66,185,131,0.04);
    box-shadow: none;
}
.toys-card-add .toys-card-icon {
    opacity: 0.4;
}

/* 管理员右键编辑提示 */
.toys-card[data-index]:not(.toys-card-add)::after {
    content: '长按/右键编辑';
    position: absolute;
    bottom: 4px;
    font-size: 0.6rem;
    color: transparent;
    transition: color 0.2s;
}
.toys-card[data-index]:not(.toys-card-add):hover::after {
    color: #bbb;
}

/* ===== 弹窗 ===== */
.toys-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}
.toys-modal {
    background: #fff;
    border-radius: 12px;
    width: 420px;
    max-width: 92vw;
    box-shadow: 0 12px 40px rgba(0,0,0,0.18);
    overflow: hidden;
}
.toys-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px 14px;
    border-bottom: 1px solid #eee;
}
.toys-modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
}
.toys-modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
    line-height: 1;
}
.toys-modal-body {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.toys-modal-body label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    color: #666;
}
.toys-modal-body input[type="text"] {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
}
.toys-modal-body input[type="text"]:focus {
    border-color: var(--theme-color);
}
.toys-checkbox-label {
    flex-direction: row !important;
    align-items: center;
    gap: 8px !important;
}
.toys-checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
}
.toys-modal-footer {
    display: flex;
    align-items: center;
    padding: 14px 22px 18px;
    gap: 10px;
    border-top: 1px solid #eee;
}
.toys-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
}
.toys-btn-save {
    background: var(--theme-color);
    color: #fff;
}
.toys-btn-save:hover { opacity: 0.85; }
.toys-btn-cancel {
    background: #f0f0f0;
    color: #333;
}
.toys-btn-cancel:hover { background: #e0e0e0; }
.toys-btn-delete {
    background: #ff4d4f;
    color: #fff;
}
.toys-btn-delete:hover { opacity: 0.85; }

/* 响应式 */
@media (max-width: 640px) {
    .toys-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
    }
    .toys-card {
        padding: 24px 12px 18px;
    }
    .toys-card-icon { font-size: 2.4rem; }
}
</style>

<script>
(function() {
    var ajaxUrl = '<?php echo admin_url("admin-ajax.php"); ?>';
    var nonce   = '<?php echo wp_create_nonce("toys_nonce"); ?>';
    var modal   = document.getElementById('toys-modal');

    function openModal(mode, data) {
        document.getElementById('toys-modal-title').textContent = mode === 'edit' ? '编辑玩具' : '添加新玩具';
        document.getElementById('toys-edit-index').value = data.index !== undefined ? data.index : -1;
        document.getElementById('toys-input-name').value = data.name || '';
        document.getElementById('toys-input-icon').value = data.icon || '';
        document.getElementById('toys-input-desc').value = data.desc || '';
        document.getElementById('toys-input-url').value  = data.url  || '';
        document.getElementById('toys-input-admin').checked = !!data.admin_only;
        document.getElementById('toys-delete-btn').style.display = mode === 'edit' ? '' : 'none';
        modal.style.display = '';
    }

    function closeModal() { modal.style.display = 'none'; }

    function saveToy(action, payload) {
        var fd = new FormData();
        fd.append('action', 'toys_manage');
        fd.append('nonce', nonce);
        fd.append('op', action);
        fd.append('data', JSON.stringify(payload));
        fetch(ajaxUrl, { method: 'POST', body: fd })
            .then(function(r){ return r.json(); })
            .then(function(res){
                if (res.success) location.reload();
                else alert(res.data || '操作失败');
            });
    }

    // 添加按钮
    var addBtn = document.getElementById('toys-add-btn');
    if (addBtn) addBtn.addEventListener('click', function(){ openModal('add', {}); });

    // 右键/长按编辑
    document.querySelectorAll('.toys-card[data-index]').forEach(function(card){
        card.addEventListener('contextmenu', function(e){
            e.preventDefault();
            var i = parseInt(card.dataset.index);
            openModal('edit', {
                index: i,
                name:  card.querySelector('.toys-card-name').textContent,
                icon:  card.querySelector('.toys-card-icon').innerHTML.trim(),
                desc:  card.querySelector('.toys-card-desc').textContent,
                url:   card.getAttribute('href').replace(<?php echo json_encode( home_url() ); ?>, ''),
                admin_only: !!card.querySelector('.toys-card-badge')
            });
        });
    });

    // 弹窗按钮
    document.getElementById('toys-modal-close').addEventListener('click', closeModal);
    document.getElementById('toys-cancel-btn').addEventListener('click', closeModal);
    // 点击遮罩层不关闭，只能通过取消/关闭按钮退出

    document.getElementById('toys-save-btn').addEventListener('click', function(){
        var idx = parseInt(document.getElementById('toys-edit-index').value);
        var toy = {
            name:       document.getElementById('toys-input-name').value.trim(),
            icon:       document.getElementById('toys-input-icon').value.trim(),
            desc:       document.getElementById('toys-input-desc').value.trim(),
            url:        document.getElementById('toys-input-url').value.trim(),
            admin_only: document.getElementById('toys-input-admin').checked
        };
        if (!toy.name || !toy.url) { alert('名称和链接不能为空'); return; }
        saveToy(idx >= 0 ? 'update' : 'add', { index: idx, toy: toy });
    });

    document.getElementById('toys-delete-btn').addEventListener('click', function(){
        if (!confirm('确定删除？')) return;
        var idx = parseInt(document.getElementById('toys-edit-index').value);
        saveToy('delete', { index: idx });
    });
})();
</script>
<?php endif; ?>

<?php get_footer(); ?>
