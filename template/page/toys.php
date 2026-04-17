<?php
/**
 * My Corner - navigation page template
 * Template Name: My Corner
 * @author Haibin
 * @date 2026-04-17
 */

get_header();

$is_admin = current_user_can( 'administrator' );

// Enqueue WordPress media library for admin icon upload
if ( $is_admin ) {
    wp_enqueue_media();
}

/**
 * Corner items config list
 * Each item: name, icon (emoji), desc, url, admin_only (visibility)
 *
 * admin_only = true  -> visible to admin only (non-admin cannot see)
 * admin_only = false -> visible to everyone
 */
$toys = get_option( 'nicen_theme_toys', [] );

// Default items (initialized on first visit)
if ( empty( $toys ) ) {
    $toys = [
        [
            'name'       => 'Todo List',
            'icon'       => '&#128203;',
            'desc'       => 'Manage daily tasks, stay productive',
            'url'        => '/index.php/todo-list/',
            'admin_only' => true,
        ],
    ];
    update_option( 'nicen_theme_toys', $toys );
}

// Filter out admin-only items for non-admin users
if ( ! $is_admin ) {
    $toys = array_filter( $toys, function( $toy ) {
        return empty( $toy['admin_only'] );
    });
}

// Show 404 if non-admin and no visible items
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

                <!-- Header -->
                <div class="toys-header">
                    <h2>&#127968; My Corner</h2>
                    <p>Click a card to explore</p>
                </div>

                <!-- Card Grid -->
                <div class="toys-grid">
                    <?php foreach ( $toys as $index => $toy ) : ?>
                        <?php $toy_href = preg_match( '#^https?://#i', $toy['url'] ) ? $toy['url'] : home_url( $toy['url'] ); ?>
                        <a href="<?php echo esc_url( $toy_href ); ?>" class="toys-card" data-index="<?php echo $index; ?>" data-url="<?php echo esc_attr( $toy['url'] ); ?>"<?php echo preg_match( '#^https?://#i', $toy['url'] ) ? ' target="_blank" rel="noopener"' : ''; ?>>
                            <div class="toys-card-icon"><?php
                                if ( preg_match( '#^(https?://|/).*\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$#i', $toy['icon'] ) ) {
                                    $icon_url = preg_match( '#^https?://#i', $toy['icon'] ) ? $toy['icon'] : home_url( $toy['icon'] );
                                    echo '<img src="' . esc_url( $icon_url ) . '" alt="icon">';
                                } else {
                                    echo esc_html( $toy['icon'] );
                                }
                            ?></div>
                            <div class="toys-card-name"><?php echo esc_html( $toy['name'] ); ?></div>
                            <div class="toys-card-desc"><?php echo esc_html( $toy['desc'] ); ?></div>
                            <?php if ( $is_admin && ! empty( $toy['admin_only'] ) ) : ?>
                                <span class="toys-card-badge" title="Admin only">&#128274;</span>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>

                    <?php if ( $is_admin ) : ?>
                        <!-- Admin: add new item -->
                        <div class="toys-card toys-card-add" id="toys-add-btn" title="Add new item">
                            <div class="toys-card-icon">&#10133;</div>
                            <div class="toys-card-name">Add Item</div>
                        </div>
                    <?php endif; ?>
                </div>

            </div>
        </article>
    </div>
</main>

<style>
/* ===== My Corner page styles ===== */
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

/* Grid */
.toys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
}

.toys-card-icon img {
    width: 3rem;
    height: 3rem;
    object-fit: contain;
    border-radius: 8px;
}

/* Card */
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

/* Add card */
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

/* Admin: right-click edit hint */
.toys-card[data-index]:not(.toys-card-add)::after {
    content: 'Right-click to edit';
    position: absolute;
    bottom: 4px;
    font-size: 0.6rem;
    color: transparent;
    transition: color 0.2s;
}
.toys-card[data-index]:not(.toys-card-add):hover::after {
    color: #bbb;
}

/* Drag & drop */
.toys-card[draggable="true"] {
    cursor: grab;
}
.toys-card[draggable="true"]:active {
    cursor: grabbing;
}
.toys-card.toys-dragging {
    opacity: 0.35;
    transform: scale(0.95);
}
.toys-card.toys-drag-over {
    border-color: var(--theme-color);
    box-shadow: 0 0 0 3px var(--theme-color-20);
}

/* ===== Modal ===== */
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
.toys-icon-input-wrap {
    display: flex;
    gap: 6px;
}
.toys-icon-input-wrap input[type="text"] {
    flex: 1;
}
.toys-btn-upload {
    padding: 6px 10px;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    transition: background 0.2s;
}
.toys-btn-upload:hover {
    background: #e0e0e0;
}
.toys-icon-preview {
    margin-top: 6px;
    min-height: 0;
}
.toys-icon-preview img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 6px;
    border: 1px solid #eee;
}
.toys-icon-preview .toys-preview-emoji {
    font-size: 2.4rem;
    line-height: 1;
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

/* Responsive */
@media (max-width: 640px) {
    .toys-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
    }
    .toys-card {
        padding: 24px 12px 18px;
    }
    .toys-card-icon { font-size: 2.4rem; }
    .toys-card-icon img { width: 2.4rem; height: 2.4rem; }
}
</style>

<?php if ( $is_admin ) : ?>
<!-- Admin: add/edit modal -->
<div class="toys-modal-overlay" id="toys-modal" style="display:none;">
    <div class="toys-modal">
        <div class="toys-modal-header">
            <h3 id="toys-modal-title">Add New Item</h3>
            <button class="toys-modal-close" id="toys-modal-close">&times;</button>
        </div>
        <div class="toys-modal-body">
            <input type="hidden" id="toys-edit-index" value="-1">
            <label>Name
                <input type="text" id="toys-input-name" placeholder="e.g. Todo List" autocomplete="off">
            </label>
            <label>Icon (Emoji, image URL, or upload)
                <div class="toys-icon-input-wrap">
                    <input type="text" id="toys-input-icon" placeholder="Emoji, image URL, or click upload" autocomplete="off">
                    <button type="button" class="toys-btn toys-btn-upload" id="toys-upload-btn" title="Upload from media library">&#128247;</button>
                </div>
                <div class="toys-icon-preview" id="toys-icon-preview"></div>
            </label>
            <label>Description
                <input type="text" id="toys-input-desc" placeholder="A short description" autocomplete="off">
            </label>
            <label>URL
                <input type="text" id="toys-input-url" placeholder="e.g. /todo-list/ or https://..." autocomplete="off">
            </label>
            <label class="toys-checkbox-label">
                <input type="checkbox" id="toys-input-admin"> Admin only
            </label>
        </div>
        <div class="toys-modal-footer">
            <button class="toys-btn toys-btn-delete" id="toys-delete-btn" style="display:none;">Delete</button>
            <div style="flex:1;"></div>
            <button class="toys-btn toys-btn-cancel" id="toys-cancel-btn">Cancel</button>
            <button class="toys-btn toys-btn-save" id="toys-save-btn">Save</button>
        </div>
    </div>
</div>

<script>
(function() {
    var ajaxUrl = '<?php echo admin_url("admin-ajax.php"); ?>';
    var nonce   = '<?php echo wp_create_nonce("toys_nonce"); ?>';
    var modal   = document.getElementById('toys-modal');

    function openModal(mode, data) {
        document.getElementById('toys-modal-title').textContent = mode === 'edit' ? 'Edit Item' : 'Add New Item';
        document.getElementById('toys-edit-index').value = data.index !== undefined ? data.index : -1;
        document.getElementById('toys-input-name').value = data.name || '';
        document.getElementById('toys-input-icon').value = data.icon || '';
        document.getElementById('toys-input-desc').value = data.desc || '';
        document.getElementById('toys-input-url').value  = data.url  || '';
        document.getElementById('toys-input-admin').checked = !!data.admin_only;
        document.getElementById('toys-delete-btn').style.display = mode === 'edit' ? '' : 'none';
        updateIconPreview();
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
                else alert(res.data || 'Operation failed');
            });
    }

    // Icon preview
    var iconInput = document.getElementById('toys-input-icon');
    var iconPreview = document.getElementById('toys-icon-preview');
    function updateIconPreview() {
        var val = iconInput.value.trim();
        if (!val) { iconPreview.innerHTML = ''; return; }
        if (/^(https?:\/\/|\/).*\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/i.test(val)) {
            iconPreview.innerHTML = '<img src="' + val + '" alt="preview">';
        } else {
            iconPreview.innerHTML = '<span class="toys-preview-emoji">' + val + '</span>';
        }
    }
    iconInput.addEventListener('input', updateIconPreview);

    // Media library upload
    document.getElementById('toys-upload-btn').addEventListener('click', function() {
        if (typeof wp === 'undefined' || !wp.media) {
            alert('Media library not available. Please paste an image URL instead.');
            return;
        }
        var frame = wp.media({ title: 'Choose Icon', multiple: false, library: { type: 'image' } });
        frame.on('select', function() {
            var url = frame.state().get('selection').first().toJSON().url;
            iconInput.value = url;
            updateIconPreview();
        });
        frame.open();
    });

    // Add button
    var addBtn = document.getElementById('toys-add-btn');
    if (addBtn) addBtn.addEventListener('click', function(){ openModal('add', {}); });

    // Right-click to edit
    document.querySelectorAll('.toys-card[data-index]').forEach(function(card){
        card.addEventListener('contextmenu', function(e){
            e.preventDefault();
            var i = parseInt(card.dataset.index);
            openModal('edit', {
                index: i,
                name:  card.querySelector('.toys-card-name').textContent,
                icon:  card.querySelector('.toys-card-icon').innerHTML.trim(),
                desc:  card.querySelector('.toys-card-desc').textContent,
                url:   card.dataset.url || '',
                admin_only: !!card.querySelector('.toys-card-badge')
            });
        });
    });

    // Modal buttons
    document.getElementById('toys-modal-close').addEventListener('click', closeModal);
    document.getElementById('toys-cancel-btn').addEventListener('click', closeModal);
    // Clicking overlay does not close modal - only via Cancel / X button

    document.getElementById('toys-save-btn').addEventListener('click', function(){
        var idx = parseInt(document.getElementById('toys-edit-index').value);
        var toy = {
            name:       document.getElementById('toys-input-name').value.trim(),
            icon:       document.getElementById('toys-input-icon').value.trim(),
            desc:       document.getElementById('toys-input-desc').value.trim(),
            url:        document.getElementById('toys-input-url').value.trim(),
            admin_only: document.getElementById('toys-input-admin').checked
        };
        if (!toy.name || !toy.url) { alert('Name and URL are required'); return; }
        saveToy(idx >= 0 ? 'update' : 'add', { index: idx, toy: toy });
    });

    document.getElementById('toys-delete-btn').addEventListener('click', function(){
        if (!confirm('Are you sure you want to delete this item?')) return;
        var idx = parseInt(document.getElementById('toys-edit-index').value);
        saveToy('delete', { index: idx });
    });
    // Drag & drop reorder
    var dragSrc = null;
    var cards = document.querySelectorAll('.toys-card[data-index]');
    cards.forEach(function(card) {
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', function(e) {
            dragSrc = card;
            card.classList.add('toys-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.index);
        });

        card.addEventListener('dragend', function() {
            card.classList.remove('toys-dragging');
            cards.forEach(function(c){ c.classList.remove('toys-drag-over'); });
        });

        card.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (card !== dragSrc) card.classList.add('toys-drag-over');
        });

        card.addEventListener('dragleave', function() {
            card.classList.remove('toys-drag-over');
        });

        card.addEventListener('drop', function(e) {
            e.preventDefault();
            card.classList.remove('toys-drag-over');
            if (dragSrc === card) return;
            var fromIndex = parseInt(dragSrc.dataset.index);
            var toIndex = parseInt(card.dataset.index);
            if (fromIndex === toIndex) return;
            saveToy('reorder', { from: fromIndex, to: toIndex });
        });
    });
})();
</script>
<?php endif; ?>

<?php get_footer(); ?>
