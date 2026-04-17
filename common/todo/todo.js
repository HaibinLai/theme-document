/**
 * 待办事项前端逻辑
 * LocalStorage 缓存 + AJAX 同步 + 2D 艾森豪威尔矩阵视图
 * @author Haibin
 * @date 2026-04-17
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'document_todos';
    const AJAX_URL = window.HOME + '/wp-admin/admin-ajax.php';

    let todos = [];
    let currentFilter = 'all';
    let currentView = 'list';
    let editingId = null;
    let dragItem = null;

    // Chart state
    let chartCanvas = null;
    let chartCtx = null;
    let chartPoints = [];
    let hoveredPoint = null;
    let chartPadding = { top: 40, right: 40, bottom: 50, left: 60 };

    /* ========== LocalStorage ========== */
    function saveToLocal() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch (e) { } }
    function loadFromLocal() { try { var d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; } catch (e) { return []; } }

    /* ========== AJAX ========== */
    function ajax(action, data) {
        return new Promise(function (resolve, reject) {
            var fd = new FormData();
            fd.append('action', action);
            if (data) Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
            fetch(AJAX_URL, { method: 'POST', body: fd, credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (res) { res.success ? resolve(res.data) : reject(res.data); })
                .catch(reject);
        });
    }
    function syncFromServer() {
        ajax('todo_list').then(function (data) { todos = data; saveToLocal(); render(); }).catch(function () { });
    }

    /* ========== 日期计算 ========== */
    function getDaysRemaining(dateStr) {
        if (!dateStr) return null;
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var due = new Date(dateStr); due.setHours(0, 0, 0, 0);
        return Math.ceil((due - today) / 86400000);
    }
    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
    function getCountdownHtml(todo) {
        if (!todo.due_date || todo.completed == 1) return '';
        var days = getDaysRemaining(todo.due_date);
        if (days === null) return '';
        var cls, text;
        if (days < 0) { cls = 'overdue'; text = '已过期' + Math.abs(days) + '天'; }
        else if (days === 0) { cls = 'urgent'; text = '今天截止'; }
        else if (days === 1) { cls = 'urgent'; text = '明天截止'; }
        else if (days <= 3) { cls = 'soon'; text = '剩余' + days + '天'; }
        else if (days <= 7) { cls = 'soon'; text = '剩余' + days + '天'; }
        else { cls = 'normal'; text = '剩余' + days + '天'; }
        return '<span class="todo-countdown ' + cls + '">' + text + '</span>';
    }
    function isOverdue(todo) {
        if (!todo.due_date || todo.completed == 1) return false;
        var d = getDaysRemaining(todo.due_date); return d !== null && d < 0;
    }

    /* ========== 紧急度：4级 + 自动升级 ========== */
    // priority: anytime(随时可以) / thisweek(这周处理) / twodays(这两天) / urgent(紧急)
    var PRIORITY_MAP = {
        urgent:   { label: '紧急',     css: 'urgent',   level: 4 },
        twodays:  { label: '这两天',   css: 'twodays',  level: 3 },
        thisweek: { label: '这周处理', css: 'thisweek', level: 2 },
        anytime:  { label: '随时可以', css: 'anytime',  level: 1 },
        // 向后兼容旧数据
        high:     { label: '紧急',     css: 'urgent',   level: 4 },
        medium:   { label: '这周处理', css: 'thisweek', level: 2 },
        low:      { label: '随时可以', css: 'anytime',  level: 1 }
    };

    function priorityLabel(p) {
        return (PRIORITY_MAP[p] || PRIORITY_MAP.thisweek).label;
    }
    function priorityCss(p) {
        return (PRIORITY_MAP[p] || PRIORITY_MAP.thisweek).css;
    }

    /**
     * 根据截止日期自动升级紧急度（只升不降）
     * 规则：
     *   <= 0天 → urgent
     *   <= 2天 → 至少 twodays
     *   <= 7天 → 至少 thisweek
     */
    function getEffectivePriority(todo) {
        var base = todo.priority || 'thisweek';
        if (!todo.due_date || todo.completed == 1) return base;
        var days = getDaysRemaining(todo.due_date);
        if (days === null) return base;

        var baseLevel = (PRIORITY_MAP[base] || PRIORITY_MAP.thisweek).level;

        if (days <= 0 && baseLevel < 4) return 'urgent';
        if (days <= 2 && baseLevel < 3) return 'twodays';
        if (days <= 7 && baseLevel < 2) return 'thisweek';
        return base;
    }

    function importanceStars(v) {
        v = parseInt(v) || 3;
        var s = '';
        for (var i = 0; i < 5; i++) s += i < v ? '★' : '☆';
        return s;
    }

    /* ========== CRUD ========== */
    function addTodo() {
        var input = document.getElementById('todo-input');
        var title = input.value.trim();
        if (!title) return;
        var priority = document.getElementById('todo-priority').value;
        var dueDate = document.getElementById('todo-date').value;
        var importance = parseInt(document.getElementById('todo-importance').value) || 3;

        var tempId = 'temp_' + Date.now();
        var tempTodo = {
            id: tempId, title: title, completed: 0, priority: priority,
            importance: importance, due_date: dueDate || null, sort_order: 0,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        todos.unshift(tempTodo); saveToLocal(); render();
        input.value = ''; document.getElementById('todo-date').value = ''; input.focus();

        ajax('todo_create', { title: title, priority: priority, due_date: dueDate, importance: importance })
            .then(function (row) {
                var idx = todos.findIndex(function (t) { return t.id === tempId; });
                if (idx !== -1) todos[idx] = row;
                saveToLocal(); render();
            })
            .catch(function () {
                todos = todos.filter(function (t) { return t.id !== tempId; });
                saveToLocal(); render();
            });
    }

    function toggleTodo(id) {
        var todo = todos.find(function (t) { return t.id == id; });
        if (!todo) return;
        todo.completed = todo.completed == 1 ? 0 : 1;
        saveToLocal(); render();
        ajax('todo_update', { id: id, completed: todo.completed });
    }

    function deleteTodo(id) {
        if (!confirm('确定删除这条待办？')) return;
        todos = todos.filter(function (t) { return t.id != id; });
        saveToLocal(); render();
        ajax('todo_delete', { id: id });
    }

    function startEdit(id) { editingId = id; render(); var el = document.getElementById('edit-title-' + id); if (el) { el.focus(); el.select(); } }

    function saveEdit(id) {
        var el = document.getElementById('edit-title-' + id);
        var priorityEl = document.getElementById('edit-priority-' + id);
        var dateEl = document.getElementById('edit-date-' + id);
        var impEl = document.getElementById('edit-importance-' + id);
        var todo = todos.find(function (t) { return t.id == id; });
        if (!todo) return;
        var data = { id: id };
        var newTitle = el ? el.value.trim() : todo.title;
        todo.title = newTitle || todo.title; data.title = todo.title;
        if (priorityEl) { todo.priority = priorityEl.value; data.priority = priorityEl.value; }
        if (dateEl) { todo.due_date = dateEl.value || null; data.due_date = dateEl.value || ''; }
        if (impEl) { todo.importance = parseInt(impEl.value) || 3; data.importance = todo.importance; }
        editingId = null; saveToLocal(); render();
        ajax('todo_update', data);
    }

    function cancelEdit() { editingId = null; render(); }
    function setFilter(f) { currentFilter = f; render(); }
    function setView(v) {
        currentView = v;
        document.querySelectorAll('.todo-view-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
        document.getElementById('todo-list').style.display = v === 'list' ? 'block' : 'none';
        document.getElementById('todo-chart-wrap').style.display = v === 'chart' ? 'block' : 'none';
        render();
    }

    /* ========== 拖拽 ========== */
    function handleDragStart(e) { dragItem = e.currentTarget; dragItem.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
    function handleDragOver(e) {
        e.preventDefault(); var target = e.target.closest('.todo-item');
        if (target && target !== dragItem) {
            var list = document.getElementById('todo-list');
            var items = Array.from(list.children);
            if (items.indexOf(dragItem) < items.indexOf(target)) list.insertBefore(dragItem, target.nextSibling);
            else list.insertBefore(dragItem, target);
        }
    }
    function handleDragEnd() {
        if (dragItem) dragItem.classList.remove('dragging'); dragItem = null;
        var list = document.getElementById('todo-list');
        var orders = [];
        Array.from(list.children).forEach(function (item, idx) {
            var id = item.dataset.id; var todo = todos.find(function (t) { return t.id == id; });
            if (todo) { todo.sort_order = idx; orders.push({ id: id, sort_order: idx }); }
        });
        saveToLocal(); ajax('todo_reorder', { orders: JSON.stringify(orders) });
    }

    /* ========== 渲染 ========== */
    function getFilteredTodos() {
        return todos.filter(function (t) {
            if (currentFilter === 'active') return t.completed == 0;
            if (currentFilter === 'completed') return t.completed == 1;
            return true;
        });
    }

    function render() {
        var filtered = getFilteredTodos();
        var total = todos.length;
        var done = todos.filter(function (t) { return t.completed == 1; }).length;
        var percent = total > 0 ? Math.round(done / total * 100) : 0;

        document.getElementById('todo-stats').innerHTML = '<span>共 ' + total + ' 项</span><span>待完成 ' + (total - done) + '</span><span>已完成 ' + done + '</span><span>' + percent + '%</span>';
        var pb = document.getElementById('todo-progress-bar'); if (pb) pb.style.width = percent + '%';
        document.querySelectorAll('.todo-filter-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.filter === currentFilter); });

        if (currentView === 'list') renderList(filtered);
        else renderChart(filtered);
    }

    function renderList(filtered) {
        var listEl = document.getElementById('todo-list');
        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="todo-empty"><div class="todo-empty-icon">&#128203;</div>' +
                (currentFilter === 'all' ? '暂无待办事项，添加一个吧' : currentFilter === 'active' ? '所有任务都完成了！' : '还没有已完成的待办') + '</div>';
            return;
        }
        var html = '';
        filtered.forEach(function (todo) {
            var isEditing = editingId == todo.id;
            var effPriority = getEffectivePriority(todo);
            var effCss = priorityCss(effPriority);
            var upgraded = effPriority !== (todo.priority || 'thisweek') && todo.completed != 1;

            html += '<div class="todo-item' + (todo.completed == 1 ? ' completed' : '') + '" data-id="' + todo.id + '" draggable="true">';
            html += '<div class="todo-priority-bar ' + effCss + '"></div>';
            html += '<div class="todo-body">';
            html += '<div class="todo-checkbox" onclick="window._todo.toggle(' + todo.id + ')"></div>';
            html += '<div class="todo-content">';
            if (isEditing) {
                html += '<input class="todo-title-input" id="edit-title-' + todo.id + '" value="' + escapeHtml(todo.title) + '" onkeydown="if(event.key===\'Enter\')window._todo.saveEdit(' + todo.id + ');if(event.key===\'Escape\')window._todo.cancelEdit()">';
                html += '<div class="todo-edit-inline">';
                html += '<select id="edit-priority-' + todo.id + '">';
                html += '<option value="urgent"' + (todo.priority === 'urgent' || todo.priority === 'high' ? ' selected' : '') + '>紧急</option>';
                html += '<option value="twodays"' + (todo.priority === 'twodays' ? ' selected' : '') + '>这两天</option>';
                html += '<option value="thisweek"' + (todo.priority === 'thisweek' || todo.priority === 'medium' ? ' selected' : '') + '>这周处理</option>';
                html += '<option value="anytime"' + (todo.priority === 'anytime' || todo.priority === 'low' ? ' selected' : '') + '>随时可以</option>';
                html += '</select>';
                html += '<select id="edit-importance-' + todo.id + '">';
                for (var i = 5; i >= 1; i--) html += '<option value="' + i + '"' + (parseInt(todo.importance) === i ? ' selected' : '') + '>' + importanceStars(i) + '</option>';
                html += '</select>';
                html += '<input type="date" id="edit-date-' + todo.id + '" value="' + (todo.due_date || '') + '">';
                html += '<button class="todo-action-btn" onclick="window._todo.saveEdit(' + todo.id + ')" title="保存">&#10003;</button>';
                html += '<button class="todo-action-btn" onclick="window._todo.cancelEdit()" title="取消">&#10005;</button>';
                html += '</div>';
            } else {
                html += '<div class="todo-title">' + escapeHtml(todo.title) + '</div>';
                html += '<div class="todo-meta">';
                html += '<span class="todo-priority-tag ' + effCss + '">' + priorityLabel(effPriority);
                if (upgraded) html += ' ↑';
                html += '</span>';
                html += '<span class="todo-importance-tag">' + importanceStars(todo.importance) + '</span>';
                if (todo.due_date) {
                    html += '<span class="todo-due"><span class="todo-due-icon">&#128197;</span>' + formatDate(todo.due_date) + '</span>';
                    html += getCountdownHtml(todo);
                }
                html += '</div>';
            }
            html += '</div>';
            if (!isEditing) {
                html += '<div class="todo-actions">';
                html += '<button class="todo-action-btn" onclick="window._todo.startEdit(' + todo.id + ')" title="编辑">&#9998;</button>';
                html += '<button class="todo-action-btn delete" onclick="window._todo.deleteTodo(' + todo.id + ')" title="删除">&#128465;</button>';
                html += '</div>';
            }
            html += '</div></div>';
        });
        listEl.innerHTML = html;
        listEl.querySelectorAll('.todo-item').forEach(function (item) {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    /* ========== 2D Chart ========== */

    function renderChart(filtered) {
        var wrap = document.getElementById('todo-chart-wrap');
        chartCanvas = document.getElementById('todo-chart');
        if (!chartCanvas) return;
        chartCtx = chartCanvas.getContext('2d');

        var rect = wrap.getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        var w = rect.width;
        var h = Math.max(400, Math.min(w * 0.65, 520));
        chartCanvas.width = w * dpr;
        chartCanvas.height = h * dpr;
        chartCanvas.style.width = w + 'px';
        chartCanvas.style.height = h + 'px';
        chartCtx.scale(dpr, dpr);

        var isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        var p = chartPadding;
        var cw = w - p.left - p.right;
        var ch = h - p.top - p.bottom;

        chartCtx.clearRect(0, 0, w, h);

        // X轴分割线位置：7天 和 14天（按比例）
        var MAX_DAYS = 21; // X轴最大天数
        var XOFFSET = 3;   // 左边留给过期的
        var xTotalRange = MAX_DAYS + XOFFSET;
        var x7 = p.left + ((7 + XOFFSET) / xTotalRange) * cw;
        var x14 = p.left + ((14 + XOFFSET) / xTotalRange) * cw;
        var halfY = p.top + ch / 2;

        // 四象限背景 — 加深颜色
        // 左列(0~7天): 紧急区
        // 中列(7~14天): 中间区
        // 右列(14天+): 不紧急区
        // 上半: 重要, 下半: 不重要

        // 紧急+重要 (左上) — 深红
        chartCtx.fillStyle = isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.20)';
        chartCtx.fillRect(p.left, p.top, x7 - p.left, ch / 2);
        // 中间+重要 (中上) — 橙
        chartCtx.fillStyle = isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.18)';
        chartCtx.fillRect(x7, p.top, x14 - x7, ch / 2);
        // 不急+重要 (右上) — 蓝
        chartCtx.fillStyle = isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)';
        chartCtx.fillRect(x14, p.top, p.left + cw - x14, ch / 2);
        // 紧急+不重要 (左下) — 黄
        chartCtx.fillStyle = isDark ? 'rgba(234,179,8,0.25)' : 'rgba(234,179,8,0.18)';
        chartCtx.fillRect(p.left, halfY, x7 - p.left, ch / 2);
        // 中间+不重要 (中下) — 浅黄绿
        chartCtx.fillStyle = isDark ? 'rgba(132,204,22,0.18)' : 'rgba(132,204,22,0.12)';
        chartCtx.fillRect(x7, halfY, x14 - x7, ch / 2);
        // 不急+不重要 (右下) — 绿
        chartCtx.fillStyle = isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.14)';
        chartCtx.fillRect(x14, halfY, p.left + cw - x14, ch / 2);

        // 象限文字 — 用各象限对应的颜色
        chartCtx.font = 'bold 13px sans-serif';
        chartCtx.textAlign = 'center';

        chartCtx.fillStyle = isDark ? 'rgba(239,68,68,0.7)' : 'rgba(220,38,38,0.5)';
        chartCtx.fillText('紧急且重要', (p.left + x7) / 2, p.top + 24);
        chartCtx.fillText('立即做!', (p.left + x7) / 2, p.top + 42);

        chartCtx.fillStyle = isDark ? 'rgba(245,158,11,0.7)' : 'rgba(217,119,6,0.5)';
        chartCtx.fillText('重要·计划做', (x7 + x14) / 2, p.top + 24);

        chartCtx.fillStyle = isDark ? 'rgba(59,130,246,0.7)' : 'rgba(37,99,235,0.45)';
        chartCtx.fillText('不急·可规划', (x14 + p.left + cw) / 2, p.top + 24);

        chartCtx.fillStyle = isDark ? 'rgba(234,179,8,0.7)' : 'rgba(180,130,0,0.5)';
        chartCtx.fillText('紧急·快速做', (p.left + x7) / 2, halfY + 24);

        chartCtx.fillStyle = isDark ? 'rgba(132,204,22,0.6)' : 'rgba(80,140,10,0.45)';
        chartCtx.fillText('一般事务', (x7 + x14) / 2, halfY + 24);

        chartCtx.fillStyle = isDark ? 'rgba(16,185,129,0.6)' : 'rgba(5,120,80,0.45)';
        chartCtx.fillText('可删除', (x14 + p.left + cw) / 2, halfY + 24);

        // 分割虚线
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
        chartCtx.setLineDash([6, 4]);
        chartCtx.lineWidth = 1;
        chartCtx.beginPath();
        chartCtx.moveTo(x7, p.top); chartCtx.lineTo(x7, p.top + ch);
        chartCtx.moveTo(x14, p.top); chartCtx.lineTo(x14, p.top + ch);
        chartCtx.moveTo(p.left, halfY); chartCtx.lineTo(p.left + cw, halfY);
        chartCtx.stroke();
        chartCtx.setLineDash([]);

        // 今天红虚线
        var xToday = p.left + ((0 + XOFFSET) / xTotalRange) * cw;
        chartCtx.strokeStyle = isDark ? 'rgba(239,68,68,0.6)' : 'rgba(220,38,38,0.5)';
        chartCtx.setLineDash([4, 3]);
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(xToday, p.top); chartCtx.lineTo(xToday, p.top + ch);
        chartCtx.stroke();
        chartCtx.setLineDash([]);
        // "今天"标注
        chartCtx.fillStyle = isDark ? 'rgba(239,68,68,0.8)' : 'rgba(220,38,38,0.65)';
        chartCtx.font = 'bold 11px sans-serif';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('TODAY', xToday, p.top - 6);

        // 坐标轴
        var axisColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
        chartCtx.strokeStyle = axisColor;
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(p.left, p.top); chartCtx.lineTo(p.left, p.top + ch); chartCtx.lineTo(p.left + cw, p.top + ch);
        chartCtx.stroke();
        chartCtx.lineWidth = 1;

        // X轴标签
        var textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
        chartCtx.fillStyle = textColor;
        chartCtx.font = '12px sans-serif';
        chartCtx.textAlign = 'center';

        var xTickDays = [-2, 0, 1, 2, 3, 7, 14, 21];
        var xTickLabels = ['过期', '今天', '明天', '后天', '3天', '7天', '14天', '14天后'];
        for (var i = 0; i < xTickDays.length; i++) {
            var tx = p.left + ((xTickDays[i] + XOFFSET) / xTotalRange) * cw;
            chartCtx.fillText(xTickLabels[i], tx, p.top + ch + 18);
            // 小刻度线
            chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
            chartCtx.beginPath(); chartCtx.moveTo(tx, p.top + ch); chartCtx.lineTo(tx, p.top + ch + 5); chartCtx.stroke();
        }
        chartCtx.fillStyle = textColor;
        chartCtx.font = 'bold 12px sans-serif';
        chartCtx.fillText('← 紧急                              不紧急 →', p.left + cw / 2, p.top + ch + 40);

        // Y轴标签
        chartCtx.font = '12px sans-serif';
        chartCtx.textAlign = 'right';
        for (var j = 1; j <= 5; j++) {
            var yy = p.top + ch - (j - 1) / 4 * ch;
            chartCtx.fillStyle = textColor;
            chartCtx.fillText(j + '★', p.left - 8, yy + 4);
        }
        chartCtx.save();
        chartCtx.translate(14, p.top + ch / 2);
        chartCtx.rotate(-Math.PI / 2);
        chartCtx.textAlign = 'center';
        chartCtx.font = 'bold 12px sans-serif';
        chartCtx.fillStyle = textColor;
        chartCtx.fillText('重要程度', 0, 0);
        chartCtx.restore();

        // Y轴网格线
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
        for (var g = 1; g <= 5; g++) {
            var gy = p.top + ch - (g - 1) / 4 * ch;
            chartCtx.beginPath(); chartCtx.moveTo(p.left, gy); chartCtx.lineTo(p.left + cw, gy); chartCtx.stroke();
        }

        // 计算散点
        chartPoints = [];
        filtered.forEach(function (todo) {
            var days = getDaysRemaining(todo.due_date);
            var xVal;
            if (days === null) xVal = MAX_DAYS;
            else if (days < -XOFFSET) xVal = -XOFFSET;
            else if (days > MAX_DAYS) xVal = MAX_DAYS;
            else xVal = days;

            var imp = parseInt(todo.importance) || 3;
            var xRatio = (xVal + XOFFSET) / xTotalRange;
            var yRatio = (imp - 1) / 4;
            var sx = p.left + xRatio * cw;
            var sy = p.top + ch - yRatio * ch;

            chartPoints.push({ x: xVal, y: imp, screenX: sx, screenY: sy, todo: todo });
        });

        // 画散点
        chartPoints.forEach(function (pt) {
            var completed = pt.todo.completed == 1;
            var r = completed ? 6 : 10;
            var alpha = completed ? 0.35 : 0.9;

            // 颜色根据位置
            var color;
            if (pt.x <= 7 && pt.y >= 3) color = 'rgba(220,38,38,' + alpha + ')';       // 紧急重要 红
            else if (pt.x <= 7 && pt.y < 3) color = 'rgba(217,119,6,' + alpha + ')';    // 紧急不重要 橙
            else if (pt.x <= 14 && pt.y >= 3) color = 'rgba(245,158,11,' + alpha + ')'; // 中等重要 金橙
            else if (pt.x <= 14 && pt.y < 3) color = 'rgba(132,204,22,' + alpha + ')';  // 中等不重要 黄绿
            else if (pt.y >= 3) color = 'rgba(59,130,246,' + alpha + ')';                // 不急重要 蓝
            else color = 'rgba(16,185,129,' + alpha + ')';                                // 不急不重要 绿

            // 阴影
            chartCtx.shadowColor = 'rgba(0,0,0,0.15)';
            chartCtx.shadowBlur = 4;
            chartCtx.shadowOffsetY = 2;

            chartCtx.beginPath();
            chartCtx.arc(pt.screenX, pt.screenY, r, 0, Math.PI * 2);
            chartCtx.fillStyle = color;
            chartCtx.fill();

            chartCtx.shadowColor = 'transparent';

            // 边框
            chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
            chartCtx.lineWidth = 1.5;
            chartCtx.stroke();

            // 已完成划线
            if (completed) {
                chartCtx.beginPath();
                chartCtx.moveTo(pt.screenX - r, pt.screenY);
                chartCtx.lineTo(pt.screenX + r, pt.screenY);
                chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
                chartCtx.lineWidth = 2;
                chartCtx.stroke();
            }

            // Hover 高亮
            if (hoveredPoint && hoveredPoint.todo.id === pt.todo.id) {
                chartCtx.beginPath();
                chartCtx.arc(pt.screenX, pt.screenY, r + 5, 0, Math.PI * 2);
                chartCtx.strokeStyle = color;
                chartCtx.lineWidth = 2.5;
                chartCtx.stroke();
            }
        });

        // Tooltip
        if (hoveredPoint) drawTooltip(hoveredPoint, w, h, isDark);
    }

    function drawTooltip(pt, canvasW, canvasH, isDark) {
        var todo = pt.todo;
        var effP = getEffectivePriority(todo);
        var lines = [escapeHtmlPlain(todo.title)];
        lines.push('紧急度: ' + priorityLabel(effP));
        lines.push('重要度: ' + importanceStars(todo.importance));
        if (todo.due_date) {
            var days = getDaysRemaining(todo.due_date);
            var dueText = formatDate(todo.due_date);
            if (days < 0) dueText += ' (已过期' + Math.abs(days) + '天)';
            else if (days === 0) dueText += ' (今天)';
            else dueText += ' (剩余' + days + '天)';
            lines.push('截止: ' + dueText);
        } else {
            lines.push('截止: 未设定');
        }
        if (todo.completed == 1) lines.push('✓ 已完成');

        chartCtx.font = '12px sans-serif';
        var maxW = 0;
        lines.forEach(function (l) { var m = chartCtx.measureText(l).width; if (m > maxW) maxW = m; });
        var tw = maxW + 24;
        var th = lines.length * 22 + 16;
        var tx = pt.screenX + 16;
        var ty = pt.screenY - th / 2;
        if (tx + tw > canvasW - 10) tx = pt.screenX - tw - 16;
        if (ty < 5) ty = 5;
        if (ty + th > canvasH - 5) ty = canvasH - th - 5;

        // 背景
        chartCtx.shadowColor = 'rgba(0,0,0,0.15)';
        chartCtx.shadowBlur = 12;
        chartCtx.shadowOffsetY = 4;
        chartCtx.fillStyle = isDark ? 'rgba(30,30,30,0.97)' : 'rgba(255,255,255,0.98)';
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
        chartCtx.lineWidth = 1;
        roundRect(chartCtx, tx, ty, tw, th, 10);
        chartCtx.fill();
        chartCtx.stroke();
        chartCtx.shadowColor = 'transparent';

        // 文字
        chartCtx.fillStyle = isDark ? 'rgba(255,255,255,0.95)' : '#222';
        chartCtx.textAlign = 'left';
        chartCtx.font = 'bold 13px sans-serif';
        chartCtx.fillText(lines[0], tx + 12, ty + 22);
        chartCtx.font = '11px sans-serif';
        chartCtx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : '#555';
        for (var i = 1; i < lines.length; i++) {
            chartCtx.fillText(lines[i], tx + 12, ty + 22 + i * 22);
        }
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function findPointAt(mx, my) {
        var closest = null, minDist = 20;
        chartPoints.forEach(function (pt) {
            var dx = pt.screenX - mx, dy = pt.screenY - my;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) { minDist = dist; closest = pt; }
        });
        return closest;
    }

    function initChartEvents() {
        var canvas = document.getElementById('todo-chart');
        if (!canvas) return;
        canvas.addEventListener('mousemove', function (e) {
            var rect = canvas.getBoundingClientRect();
            var pt = findPointAt(e.clientX - rect.left, e.clientY - rect.top);
            if (pt !== hoveredPoint) {
                hoveredPoint = pt;
                canvas.style.cursor = pt ? 'pointer' : 'default';
                if (currentView === 'chart') renderChart(getFilteredTodos());
            }
        });
        canvas.addEventListener('mouseleave', function () {
            if (hoveredPoint) { hoveredPoint = null; if (currentView === 'chart') renderChart(getFilteredTodos()); }
        });
        canvas.addEventListener('click', function (e) {
            var rect = canvas.getBoundingClientRect();
            var pt = findPointAt(e.clientX - rect.left, e.clientY - rect.top);
            if (pt) { setView('list'); startEdit(pt.todo.id); }
        });
    }

    /* ========== Helpers ========== */
    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function escapeHtmlPlain(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    /* ========== Init ========== */
    function init() {
        todos = loadFromLocal(); render(); syncFromServer();

        document.getElementById('todo-add-btn').addEventListener('click', addTodo);
        document.getElementById('todo-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });
        document.querySelectorAll('.todo-filter-btn').forEach(function (b) { b.addEventListener('click', function () { setFilter(this.dataset.filter); }); });
        document.querySelectorAll('.todo-view-btn').forEach(function (b) { b.addEventListener('click', function () { setView(this.dataset.view); }); });

        initChartEvents();
        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { if (currentView === 'chart') render(); }, 200);
        });

        var impSlider = document.getElementById('todo-importance');
        var impLabel = document.getElementById('todo-importance-label');
        if (impSlider && impLabel) {
            impSlider.addEventListener('input', function () { impLabel.textContent = importanceStars(this.value); });
        }
    }

    window._todo = { toggle: toggleTodo, deleteTodo: deleteTodo, startEdit: startEdit, saveEdit: saveEdit, cancelEdit: cancelEdit };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
