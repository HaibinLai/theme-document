/**
 * Clipboard Helper - Page logic
 * @author Haibin
 * @date 2026-04-17
 */
(function () {
    'use strict';

    var AJAX_URL = window.HOME + '/wp-admin/admin-ajax.php';
    var currentPage = 1;
    var currentType = '';
    var searchTimer = null;

    /* ========== AJAX helper ========== */
    function ajax(action, data, isFile) {
        var fd = new FormData();
        fd.append('action', action);
        if (data) {
            if (isFile) {
                Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
            } else {
                Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
            }
        }
        return fetch(AJAX_URL, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) return res.data;
                throw new Error(res.data || 'Error');
            });
    }

    /* ========== Load & Render ========== */
    function loadList() {
        var search = document.getElementById('cb-search').value.trim();
        ajax('clipboard_list', {
            page: currentPage,
            search: search,
            type: currentType
        }).then(function (data) {
            renderList(data.items, data.total);
            renderPagination(data.total, data.page, data.per_page);
            document.getElementById('cb-stats').textContent = data.total + ' items';
        }).catch(function () {
            document.getElementById('cb-list').innerHTML = '<div class="cb-empty">Failed to load</div>';
        });
    }

    function renderList(items, total) {
        var el = document.getElementById('cb-list');
        if (!items || items.length === 0) {
            el.innerHTML = '<div class="cb-empty"><div class="cb-empty-icon">&#128203;</div>' +
                (total === 0 ? 'No clipboard entries yet. Copy some text or upload a file!' : 'No results found') + '</div>';
            return;
        }

        var html = '';
        items.forEach(function (item) {
            html += '<div class="cb-item" data-id="' + item.id + '">';

            // Icon
            if (item.type === 'file') {
                html += '<div class="cb-item-icon">' + getFileIcon(item.filename) + '</div>';
            } else {
                html += '<div class="cb-item-icon">&#128196;</div>';
            }

            // Body
            html += '<div class="cb-item-body">';
            if (item.type === 'text') {
                var content = escapeHtml(item.content || '');
                var isLong = content.length > 300;
                html += '<div class="cb-item-content' + (isLong ? '' : ' expanded') + '">' + content + '</div>';
                if (isLong) {
                    html += '<span class="cb-item-expand" onclick="window._cb.toggleExpand(this)">Show more</span>';
                }
            } else {
                html += '<div class="cb-item-content expanded">';
                html += '<strong>' + escapeHtml(item.filename || 'file') + '</strong>';
                html += '</div>';
            }

            // Meta
            html += '<div class="cb-item-meta">';
            html += '<span class="cb-type-badge ' + (item.type === 'text' ? 'cb-type-text' : 'cb-type-file') + '">' +
                (item.type === 'text' ? 'TEXT' : 'FILE') + '</span>';
            if (item.type === 'file' && item.filesize) {
                html += '<span class="cb-file-size">' + formatSize(item.filesize) + '</span>';
            }
            if (item.type === 'text' && item.content) {
                html += '<span>' + item.content.length + ' chars</span>';
            }
            html += '<span>' + formatTime(item.created_at) + '</span>';
            html += '</div>';
            html += '</div>';

            // Actions
            html += '<div class="cb-item-actions">';
            if (item.type === 'text') {
                html += '<button class="cb-action-btn" onclick="window._cb.copyText(' + item.id + ')" data-id="' + item.id + '" title="Copy">&#128203; Copy</button>';
            } else if (item.download_url) {
                html += '<a class="cb-action-btn download" href="' + escapeHtml(item.download_url) + '" download title="Download">&#11015; Download</a>';
            }
            html += '<button class="cb-action-btn delete" onclick="window._cb.deleteItem(' + item.id + ')" title="Delete">&#128465;</button>';
            html += '</div>';

            html += '</div>';
        });

        el.innerHTML = html;
    }

    function renderPagination(total, page, perPage) {
        var el = document.getElementById('cb-pagination');
        var pages = Math.ceil(total / perPage);
        if (pages <= 1) { el.innerHTML = ''; return; }

        var html = '';
        if (page > 1) {
            html += '<button class="cb-page-btn" onclick="window._cb.goPage(' + (page - 1) + ')">&#8592;</button>';
        }
        for (var i = 1; i <= pages; i++) {
            if (pages > 7 && i > 3 && i < pages - 2 && Math.abs(i - page) > 1) {
                if (i === 4 || i === pages - 3) html += '<span style="padding:0 4px;">...</span>';
                continue;
            }
            html += '<button class="cb-page-btn' + (i === page ? ' active' : '') + '" onclick="window._cb.goPage(' + i + ')">' + i + '</button>';
        }
        if (page < pages) {
            html += '<button class="cb-page-btn" onclick="window._cb.goPage(' + (page + 1) + ')">&#8594;</button>';
        }
        el.innerHTML = html;
    }

    /* ========== Actions ========== */
    function saveText() {
        var input = document.getElementById('cb-paste-input');
        var text = input.value.trim();
        if (!text) return;
        input.disabled = true;
        ajax('clipboard_save', { content: text }).then(function () {
            input.value = '';
            input.disabled = false;
            currentPage = 1;
            loadList();
        }).catch(function (e) {
            alert(e.message || 'Save failed');
            input.disabled = false;
        });
    }

    function uploadFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large (max 10MB)');
            return;
        }

        var progress = document.getElementById('cb-upload-progress');
        var bar = document.getElementById('cb-progress-bar');
        progress.style.display = '';
        bar.style.width = '0%';

        var fd = new FormData();
        fd.append('action', 'clipboard_upload');
        fd.append('file', file);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', AJAX_URL);
        xhr.withCredentials = true;

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
                bar.style.width = Math.round(e.loaded / e.total * 100) + '%';
            }
        };
        xhr.onload = function () {
            progress.style.display = 'none';
            bar.style.width = '0%';
            try {
                var res = JSON.parse(xhr.responseText);
                if (res.success) {
                    currentPage = 1;
                    loadList();
                } else {
                    alert(res.data || 'Upload failed');
                }
            } catch (e) {
                alert('Upload failed');
            }
        };
        xhr.onerror = function () {
            progress.style.display = 'none';
            alert('Upload failed');
        };
        xhr.send(fd);
    }

    function copyText(id) {
        var item = document.querySelector('.cb-item[data-id="' + id + '"]');
        if (!item) return;
        var content = item.querySelector('.cb-item-content');
        if (!content) return;

        var text = content.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showCopyFeedback(id);
            });
        } else {
            // Fallback
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showCopyFeedback(id);
        }
    }

    function showCopyFeedback(id) {
        var btn = document.querySelector('.cb-action-btn[data-id="' + id + '"]');
        if (!btn) return;
        btn.classList.add('cb-copied');
        btn.innerHTML = '&#10003; Copied!';
        setTimeout(function () {
            btn.classList.remove('cb-copied');
            btn.innerHTML = '&#128203; Copy';
        }, 1500);
    }

    function deleteItem(id) {
        if (!confirm('Delete this entry?')) return;
        ajax('clipboard_delete', { id: id }).then(function () {
            loadList();
        }).catch(function (e) {
            alert(e.message || 'Delete failed');
        });
    }

    function clearAll() {
        if (!confirm('Clear ALL clipboard entries? This cannot be undone.')) return;
        ajax('clipboard_clear').then(function () {
            currentPage = 1;
            loadList();
        });
    }

    function toggleExpand(el) {
        var content = el.previousElementSibling;
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            el.textContent = 'Show more';
        } else {
            content.classList.add('expanded');
            el.textContent = 'Show less';
        }
    }

    function goPage(p) {
        currentPage = p;
        loadList();
        document.querySelector('.cb-container').scrollIntoView({ behavior: 'smooth' });
    }

    /* ========== Helpers ========== */
    function escapeHtml(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function formatTime(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr.replace(' ', 'T'));
        var now = new Date();
        var diff = (now - d) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';

        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function getFileIcon(filename) {
        if (!filename) return '&#128196;';
        var ext = filename.split('.').pop().toLowerCase();
        var icons = {
            pdf: '&#128213;', doc: '&#128196;', docx: '&#128196;',
            xls: '&#128202;', xlsx: '&#128202;', csv: '&#128202;',
            ppt: '&#128202;', pptx: '&#128202;',
            txt: '&#128196;', log: '&#128196;', md: '&#128196;',
            zip: '&#128230;', rar: '&#128230;', gz: '&#128230;', tar: '&#128230;', '7z': '&#128230;',
            jpg: '&#127912;', jpeg: '&#127912;', png: '&#127912;', gif: '&#127912;', svg: '&#127912;', webp: '&#127912;',
            mp3: '&#127925;', wav: '&#127925;', flac: '&#127925;',
            mp4: '&#127909;', avi: '&#127909;', mkv: '&#127909;',
            js: '&#128187;', py: '&#128187;', php: '&#128187;', java: '&#128187;', c: '&#128187;', cpp: '&#128187;',
            html: '&#127760;', css: '&#127760;',
            json: '&#128196;', xml: '&#128196;', yaml: '&#128196;', yml: '&#128196;',
            sh: '&#128187;', bat: '&#128187;',
        };
        return icons[ext] || '&#128196;';
    }

    /* ========== Init ========== */
    function init() {
        loadList();

        // Save text button
        document.getElementById('cb-paste-btn').addEventListener('click', saveText);
        document.getElementById('cb-paste-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveText();
        });

        // File upload
        var uploadArea = document.getElementById('cb-upload-area');
        var fileInput = document.getElementById('cb-file-input');

        uploadArea.addEventListener('click', function (e) {
            if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
                fileInput.click();
            }
        });
        fileInput.addEventListener('change', function () {
            if (this.files[0]) uploadFile(this.files[0]);
            this.value = '';
        });

        // Drag & drop
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', function () {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
        });

        // Search
        document.getElementById('cb-search').addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                currentPage = 1;
                loadList();
            }, 300);
        });

        // Filter buttons
        document.querySelectorAll('.cb-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.cb-filter-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentType = btn.dataset.type;
                currentPage = 1;
                loadList();
            });
        });

        // Clear all
        document.getElementById('cb-clear-btn').addEventListener('click', clearAll);
    }

    // Expose functions
    window._cb = {
        copyText: copyText,
        deleteItem: deleteItem,
        toggleExpand: toggleExpand,
        goPage: goPage
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
