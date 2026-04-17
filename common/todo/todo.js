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
    let currentView = 'chart';
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
        else if (days <= 3) { cls = 'urgent'; text = '剩余' + days + '天'; }
        else if (days <= 14) { cls = 'soon'; text = '剩余' + days + '天'; }
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
     *   <= 3天 → 至少 twodays
     *   <= 14天 → 至少 thisweek
     */
    function getEffectivePriority(todo) {
        var base = todo.priority || 'thisweek';
        if (!todo.due_date || todo.completed == 1) return base;
        var days = getDaysRemaining(todo.due_date);
        if (days === null) return base;

        var baseLevel = (PRIORITY_MAP[base] || PRIORITY_MAP.thisweek).level;

        if (days <= 0 && baseLevel < 4) return 'urgent';
        if (days <= 3 && baseLevel < 3) return 'twodays';
        if (days <= 14 && baseLevel < 2) return 'thisweek';
        return base;
    }

    function importanceStars(v) {
        v = parseInt(v) || 3;
        var s = '';
        for (var i = 0; i < 5; i++) s += i < v ? '★' : '☆';
        return s;
    }

    /**
     * 计算有效重要度（图表用）
     * >14天的待办：每隔7天升高0.5★，14天=3★
     * 即 effectiveImportance = max(原importance, 3 + (days - 14) / 7 * 0.5)
     * 上限5
     */
    function getEffectiveImportance(todo) {
        var imp = parseInt(todo.importance) || 3;
        if (!todo.due_date || todo.completed == 1) return imp;
        var days = getDaysRemaining(todo.due_date);
        if (days === null || days <= 14) return imp;
        var boost = 3 + (days - 14) / 7 * 0.5;
        return Math.min(5, Math.max(imp, boost));
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
        document.getElementById('todo-matrix-wrap').style.display = v === 'chart' ? '' : 'none';
        // 矩阵视图时扩展外层容器宽度
        var mainMain = document.querySelector('.main-main');
        if (mainMain) mainMain.classList.toggle('todo-wide-mode', v === 'chart');
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
        else { renderChart(filtered); renderSidebar(filtered); }
    }

    /* ========== 侧边栏：按象限分类 ========== */
    function renderSidebar(filtered) {
        var sidebar = document.getElementById('todo-sidebar');
        if (!sidebar) return;

        var IMP_SPLIT = 3.2;
        var groups = {
            do_now:   { label: '&#128308; 立即做', items: [] },
            do_fast:  { label: '&#128992; 快速做', items: [] },
            plan:     { label: '&#128993; 计划做', items: [] },
            general:  { label: '&#128994; 一般事务', items: [] }
        };

        filtered.forEach(function (todo) {
            if (todo.completed == 1) return;
            var days = getDaysRemaining(todo.due_date);
            var imp = getEffectiveImportance(todo);
            var urgent = (days !== null && days <= 3.2);
            // 计划做阈值：x>14时沿升星斜线
            var daysVal = (days === null) ? 21 : Math.max(-3, Math.min(21, days));
            var impThreshold = daysVal > 14 ? 3 + (daysVal - 14) / 7 * 0.5 : IMP_SPLIT;

            if (urgent && imp >= IMP_SPLIT) groups.do_now.items.push(todo);
            else if (urgent && imp < IMP_SPLIT) groups.do_fast.items.push(todo);
            else if (imp >= impThreshold) groups.plan.items.push(todo);
            else groups.general.items.push(todo);
        });

        var html = '';
        ['do_now', 'do_fast', 'plan', 'general'].forEach(function (key) {
            var g = groups[key];
            html += '<div class="todo-sidebar-group">';
            html += '<div class="todo-sidebar-title">' + g.label + ' <span class="todo-sidebar-count">' + g.items.length + '</span></div>';
            if (g.items.length === 0) {
                html += '<div class="todo-sidebar-empty">- 无 -</div>';
            } else {
                g.items.forEach(function (todo) {
                    var effP = getEffectivePriority(todo);
                    var css = priorityCss(effP);
                    html += '<div class="todo-sidebar-item">';
                    html += '<span class="todo-sidebar-dot ' + css + '"></span>';
                    html += '<button class="todo-sidebar-play" onclick="window._todo.startPomodoro(' + todo.id + ')" title="番茄钟">&#9654;</button>';
                    html += '<span class="todo-sidebar-text">' + escapeHtml(todo.title) + '</span>';
                    if (todo.due_date) {
                        var d = getDaysRemaining(todo.due_date);
                        var dText = d < 0 ? '过期' + Math.abs(d) + '天' : d === 0 ? '今天' : d + '天';
                        html += '<span class="todo-sidebar-due">' + dText + '</span>';
                    }
                    var pc = getPomodoroCount(todo.id);
                    if (pc > 0) html += '<span class="todo-sidebar-pomodoro">&#127813;' + pc + '</span>';
                    html += '</div>';
                });
            }
            html += '</div>';
        });

        sidebar.innerHTML = html;
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

            html += '<div class="todo-item' + (todo.completed == 1 ? ' completed' : '') + (isPomodoring(todo.id) ? ' pomodoro-active' : '') + '" data-id="' + todo.id + '" draggable="true">';
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
                html += pomodoroCountHtml(todo.id);
                if (todo.due_date) {
                    html += '<span class="todo-due"><span class="todo-due-icon">&#128197;</span>' + formatDate(todo.due_date) + '</span>';
                    html += getCountdownHtml(todo);
                }
                html += '</div>';
            }
            html += '</div>';
            if (!isEditing) {
                html += '<div class="todo-actions">';
                if (todo.completed != 1) html += '<button class="todo-action-btn pomodoro" onclick="window._todo.startPomodoro(' + todo.id + ')" title="番茄钟">&#9654;</button>';
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

        // X轴分割线位置：3天 和 14天（按比例）
        var MAX_DAYS = 21; // X轴最大天数
        var XOFFSET = 3;   // 左边留给过期的
        var xTotalRange = MAX_DAYS + XOFFSET;
        var x3 = p.left + ((3.2 + XOFFSET) / xTotalRange) * cw;
        var x14 = p.left + ((14 + XOFFSET) / xTotalRange) * cw;
        var IMP_SPLIT = 3.2; // 重要/不重要分界线
        var impYRatio = (IMP_SPLIT - 1) / 4; // 在0~1范围内的位置
        var yPadC = 0.08;
        var splitY = p.top + ch * (1 - yPadC) - impYRatio * ch * (1 - 2 * yPadC);

        // 辅助函数：天数→屏幕X，重要度→屏幕Y
        function daysToX(d) { return p.left + ((d + XOFFSET) / xTotalRange) * cw; }
        function impToY(v) { return p.top + ch * (1 - yPadC) - ((v - 1) / 4) * ch * (1 - 2 * yPadC); }

        // 升星分界线：x≤14天时 y=3.2★, x>14天时 y=3+(x-14)/7*0.5
        // 这条线就是计划做和一般事务的边界
        var slopeStartX = daysToX(14);
        var slopeStartY = impToY(3.0); // 14天时boost=3
        var slopeEndDays = MAX_DAYS;
        var slopeEndImp = Math.min(5, 3 + (slopeEndDays - 14) / 7 * 0.5); // 21天时=3.5
        var slopeEndX = daysToX(slopeEndDays);
        var slopeEndY = impToY(slopeEndImp);

        var chartLeft = p.left;
        var chartRight = p.left + cw;
        var chartTop = p.top;
        var chartBottom = p.top + ch;

        // 四象限背景 — 使用path绘制多边形

        // 1. 紧急+重要 (左上) — 红：矩形
        chartCtx.fillStyle = isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.25)';
        chartCtx.fillRect(chartLeft, chartTop, x3 - chartLeft, splitY - chartTop);

        // 2. 紧急+不重要 (左下) — 橙黄：矩形
        chartCtx.fillStyle = isDark ? 'rgba(234,179,8,0.30)' : 'rgba(234,179,8,0.22)';
        chartCtx.fillRect(chartLeft, splitY, x3 - chartLeft, chartBottom - splitY);

        // 3. 计划做 (右上) — 橙：梯形多边形
        //    从x3到x14: 底边是splitY (y=3.2)
        //    从x14到xEnd: 底边沿升星斜线上升
        chartCtx.fillStyle = isDark ? 'rgba(245,158,11,0.28)' : 'rgba(245,158,11,0.18)';
        chartCtx.beginPath();
        chartCtx.moveTo(x3, chartTop);           // 左上角
        chartCtx.lineTo(chartRight, chartTop);     // 右上角
        chartCtx.lineTo(chartRight, slopeEndY);    // 右边沿斜线
        chartCtx.lineTo(slopeStartX, slopeStartY); // 14天处 y=3
        chartCtx.lineTo(x3, splitY);               // 3.2天处 y=3.2
        chartCtx.closePath();
        chartCtx.fill();

        // 4. 一般事务 (右下) — 绿：梯形多边形（剩余区域）
        chartCtx.fillStyle = isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.16)';
        chartCtx.beginPath();
        chartCtx.moveTo(x3, splitY);               // 左边 y=3.2
        chartCtx.lineTo(slopeStartX, slopeStartY); // 14天处 y=3
        chartCtx.lineTo(chartRight, slopeEndY);     // 右边沿斜线
        chartCtx.lineTo(chartRight, chartBottom);    // 右下角
        chartCtx.lineTo(x3, chartBottom);            // 左下角
        chartCtx.closePath();
        chartCtx.fill();

        // 象限文字 — 放在各区域视觉中心
        chartCtx.font = 'bold 16px sans-serif';
        chartCtx.textAlign = 'center';

        // 左上：立即做（矩形中心）
        var luCx = (chartLeft + x3) / 2;
        var luCy = (chartTop + splitY) / 2;
        chartCtx.fillStyle = isDark ? '#f87171' : '#dc2626';
        chartCtx.fillText('紧急且重要', luCx, luCy - 8);
        chartCtx.fillText('立即做!', luCx, luCy + 12);

        // 右上：计划做（梯形，取x中点处的上下边中点）
        var planCx = (x3 + chartRight) / 2;
        // 计算planCx对应的斜线y值
        var planDays = ((planCx - p.left) / cw) * xTotalRange - XOFFSET;
        var planBottomImp = planDays > 14 ? 3 + (planDays - 14) / 7 * 0.5 : 3.2;
        var planBottomY = impToY(planBottomImp);
        var planCy = (chartTop + planBottomY) / 2;
        chartCtx.fillStyle = isDark ? '#fbbf24' : '#d97706';
        chartCtx.fillText('计划做', planCx, planCy);

        // 左下：快速做（矩形中心）
        var llCx = (chartLeft + x3) / 2;
        var llCy = (splitY + chartBottom) / 2;
        chartCtx.fillStyle = isDark ? '#facc15' : '#b45309';
        chartCtx.fillText('快速做', llCx, llCy);

        // 右下：一般事务（梯形，取x中点处的斜线和底边中点）
        var genCx = planCx;
        var genCy = (planBottomY + chartBottom) / 2;
        chartCtx.fillStyle = isDark ? '#34d399' : '#047857';
        chartCtx.fillText('一般事务', genCx, genCy);

        // 分割虚线 — x=3.2天为主竖线，y=3.2★+升星斜线为横线
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        chartCtx.setLineDash([6, 4]);
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(x3, chartTop); chartCtx.lineTo(x3, chartBottom);
        chartCtx.stroke();
        // 水平段 splitY (x3→x14) + 斜线段 (x14→xEnd)
        chartCtx.beginPath();
        chartCtx.moveTo(x3, splitY);
        chartCtx.lineTo(slopeStartX, slopeStartY);
        chartCtx.lineTo(chartRight, slopeEndY);
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
        chartCtx.font = 'bold 13px sans-serif';
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
        var textColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
        chartCtx.fillStyle = textColor;
        chartCtx.font = '14px sans-serif';
        chartCtx.textAlign = 'center';

        var xTickDays = [-2, 0, 1, 2, 3, 7, 14, 21];
        var xTickLabels = ['过期', '今天', '明天', '后天', '3天', '1周', '2周', '3周'];

        // 在3天处加粗刻度标注（主分割线）
        for (var i = 0; i < xTickDays.length; i++) {
            var tx = p.left + ((xTickDays[i] + XOFFSET) / xTotalRange) * cw;
            var isSplit = (xTickDays[i] === 3);
            chartCtx.font = isSplit ? 'bold 14px sans-serif' : '14px sans-serif';
            chartCtx.fillStyle = isSplit ? (isDark ? '#f87171' : '#dc2626') : textColor;
            chartCtx.fillText(xTickLabels[i], tx, p.top + ch + 18);
            // 小刻度线
            chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
            chartCtx.beginPath(); chartCtx.moveTo(tx, p.top + ch); chartCtx.lineTo(tx, p.top + ch + 5); chartCtx.stroke();
        }
        chartCtx.fillStyle = textColor;
        chartCtx.font = 'bold 14px sans-serif';
        chartCtx.fillText('← 紧急                              不紧急 →', p.left + cw / 2, p.top + ch + 40);

        // Y轴标签
        chartCtx.font = '14px sans-serif';
        chartCtx.textAlign = 'right';
        var yLabelPad = 0.08;
        for (var j = 1; j <= 5; j++) {
            var yy = p.top + ch * (1 - yLabelPad) - (j - 1) / 4 * ch * (1 - 2 * yLabelPad);
            chartCtx.fillStyle = textColor;
            chartCtx.fillText(j + '★', p.left - 8, yy + 4);
        }
        chartCtx.save();
        chartCtx.translate(14, p.top + ch / 2);
        chartCtx.rotate(-Math.PI / 2);
        chartCtx.textAlign = 'center';
        chartCtx.font = 'bold 14px sans-serif';        chartCtx.fillStyle = textColor;
        chartCtx.fillText('重要程度', 0, 0);
        chartCtx.restore();

        // Y轴网格线
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
        var yGridPad = 0.08;
        for (var g = 1; g <= 5; g++) {
            var gy = p.top + ch * (1 - yGridPad) - (g - 1) / 4 * ch * (1 - 2 * yGridPad);
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

            var imp = getEffectiveImportance(todo);
            var xRatio = (xVal + XOFFSET) / xTotalRange;
            var yPad = 0.08; // 上下各留8%，避免5★顶到象限标题
            var yRatio = (imp - 1) / 4;
            var sx = p.left + xRatio * cw;
            var sy = p.top + ch * (1 - yPad) - yRatio * ch * (1 - 2 * yPad);

            chartPoints.push({ x: xVal, y: imp, screenX: sx, screenY: sy, todo: todo });
        });

        // 散开重叠的点 — 使用螺旋排列
        var minDist = 22; // 两点最小间距
        for (var i = 0; i < chartPoints.length; i++) {
            var pi = chartPoints[i];
            var angle = 0, ring = 0, step = 0;
            var maxTries = 30;
            while (step < maxTries) {
                var collides = false;
                for (var k = 0; k < i; k++) {
                    var pk = chartPoints[k];
                    var dx = pi.screenX - pk.screenX;
                    var dy = pi.screenY - pk.screenY;
                    if (Math.sqrt(dx * dx + dy * dy) < minDist) {
                        collides = true;
                        break;
                    }
                }
                if (!collides) break;
                step++;
                angle = step * 2.4; // 黄金角螺旋
                ring = minDist * 0.5 * Math.sqrt(step);
                var origX = p.left + ((pi.x + XOFFSET) / xTotalRange) * cw;
                var yPad2 = 0.08;
                var origY = p.top + ch * (1 - yPad2) - ((pi.y - 1) / 4) * ch * (1 - 2 * yPad2);
                pi.screenX = origX + Math.cos(angle) * ring;
                pi.screenY = origY + Math.sin(angle) * ring;
            }
        }

        // 画散点
        chartPoints.forEach(function (pt) {
            var completed = pt.todo.completed == 1;
            var r = completed ? 6 : 10;
            var alpha = completed ? 0.35 : 0.9;

            // 颜色根据4象限（紧急=3.2天内，重要=3.2★+含升星斜线）
            var impThreshold = pt.x > 14 ? 3 + (pt.x - 14) / 7 * 0.5 : 3.2;
            var color;
            if (pt.x <= 3.2 && pt.y >= 3.2) color = 'rgba(220,38,38,' + alpha + ')';       // 立即做 红
            else if (pt.x <= 3.2 && pt.y < 3.2) color = 'rgba(217,119,6,' + alpha + ')';    // 快速做 橙
            else if (pt.y >= impThreshold) color = 'rgba(245,158,11,' + alpha + ')';          // 计划做 金橙
            else color = 'rgba(16,185,129,' + alpha + ')';                                     // 一般事务 绿

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

            // 番茄钟专注中 — 脉冲闪烁光环
            if (isPomodoring(pt.todo.id)) {
                var pulse = (Math.sin(Date.now() / 400) + 1) / 2; // 0~1 脉冲
                var pulseR = r + 6 + pulse * 8;
                var pulseAlpha = 0.15 + pulse * 0.35;
                chartCtx.beginPath();
                chartCtx.arc(pt.screenX, pt.screenY, pulseR, 0, Math.PI * 2);
                chartCtx.strokeStyle = 'rgba(239,68,68,' + pulseAlpha + ')';
                chartCtx.lineWidth = 2.5;
                chartCtx.stroke();
                // 内层红色光晕
                chartCtx.beginPath();
                chartCtx.arc(pt.screenX, pt.screenY, r + 3, 0, Math.PI * 2);
                chartCtx.strokeStyle = 'rgba(239,68,68,' + (0.4 + pulse * 0.3) + ')';
                chartCtx.lineWidth = 2;
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

    /* ========== Pomodoro 番茄钟（最多3个并行） ========== */
    var pomodoroSlots = []; // [{todoId, phase, remaining, paused, count, timer}]
    var pomodoroOrigTitle = '';
    var pomodoroAnimFrame = null;
    var FOCUS_DURATION = 25 * 60;
    var BREAK_DURATION = 5 * 60;
    var LONG_BREAK_DURATION = 15 * 60;
    var POMODORO_STORAGE = 'pomodoro_counts';
    var POMODORO_STATE = 'pomodoro_state';
    var MAX_POMODORO = 3;

    function getPomodoroCount(todoId) {
        try { var d = JSON.parse(localStorage.getItem(POMODORO_STORAGE) || '{}'); return d[todoId] || 0; } catch (e) { return 0; }
    }
    function addPomodoroCount(todoId) {
        try {
            var d = JSON.parse(localStorage.getItem(POMODORO_STORAGE) || '{}');
            d[todoId] = (d[todoId] || 0) + 1;
            localStorage.setItem(POMODORO_STORAGE, JSON.stringify(d));
        } catch (e) { }
    }

    function findSlot(todoId) {
        return pomodoroSlots.find(function (s) { return s.todoId == todoId; });
    }
    function isPomodoring(todoId) { return !!findSlot(todoId); }

    function savePomodoroState() {
        if (pomodoroSlots.length === 0) { localStorage.removeItem(POMODORO_STATE); return; }
        try {
            localStorage.setItem(POMODORO_STATE, JSON.stringify(pomodoroSlots.map(function (s) {
                return {
                    todoId: s.todoId, phase: s.phase, count: s.count, paused: s.paused,
                    endTime: s.paused ? null : Date.now() + s.remaining * 1000,
                    remaining: s.remaining
                };
            })));
        } catch (e) { }
    }

    function restorePomodoro() {
        try {
            var arr = JSON.parse(localStorage.getItem(POMODORO_STATE));
            if (!Array.isArray(arr) || arr.length === 0) {
                // 兼容旧格式（单个对象）
                var old = JSON.parse(localStorage.getItem(POMODORO_STATE));
                if (old && old.todoId && !Array.isArray(old)) {
                    arr = [old];
                } else return;
            }
            arr.forEach(function (s) {
                var todo = todos.find(function (t) { return t.id == s.todoId; });
                if (!todo) return;
                var slot = {
                    todoId: s.todoId, phase: s.phase, count: s.count || 0,
                    paused: s.paused || false, remaining: 0, timer: null
                };
                if (s.paused) {
                    slot.remaining = s.remaining || 0;
                } else {
                    slot.remaining = Math.max(0, Math.round((s.endTime - Date.now()) / 1000));
                }
                pomodoroSlots.push(slot);
                slot.timer = setInterval(function () { tickSlot(slot); }, 1000);
                if (slot.remaining <= 0 && !slot.paused) {
                    endSlotPhase(slot);
                }
            });
            if (pomodoroSlots.length > 0) {
                pomodoroOrigTitle = document.title;
                renderPomodoroUI();
                startPomodoroAnim();
            }
        } catch (e) { localStorage.removeItem(POMODORO_STATE); }
    }

    function startPomodoro(todoId) {
        if (findSlot(todoId)) {
            alert('这个任务已经在计时了！');
            return;
        }
        if (pomodoroSlots.length >= MAX_POMODORO) {
            alert('最多同时专注' + MAX_POMODORO + '件事情！\n完成或停止一个再开始新的吧。');
            return;
        }
        if (!pomodoroOrigTitle) pomodoroOrigTitle = document.title;
        var todo = todos.find(function (t) { return t.id == todoId; });
        var slot = {
            todoId: todoId, phase: 'focus', remaining: FOCUS_DURATION,
            paused: false, count: 0, timer: null
        };
        pomodoroSlots.push(slot);
        slot.timer = setInterval(function () { tickSlot(slot); }, 1000);
        renderPomodoroUI();
        savePomodoroState();
        startPomodoroAnim();
        render();
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    function tickSlot(slot) {
        if (slot.paused) return;
        slot.remaining--;
        if (slot.remaining <= 0) {
            endSlotPhase(slot);
        }
        renderPomodoroUI();
        savePomodoroState();
    }

    function endSlotPhase(slot) {
        var todo = todos.find(function (t) { return t.id == slot.todoId; });
        var name = todo ? todo.title : '';
        if (slot.phase === 'focus') {
            slot.count++;
            addPomodoroCount(slot.todoId);
            render();
            if (slot.count % 4 === 0) {
                slot.phase = 'longbreak';
                slot.remaining = LONG_BREAK_DURATION;
            } else {
                slot.phase = 'break';
                slot.remaining = BREAK_DURATION;
            }
            pomodoroNotify('「' + name + '」专注完成! 休息一下');
        } else {
            slot.phase = 'focus';
            slot.remaining = FOCUS_DURATION;
            pomodoroNotify('「' + name + '」休息结束! 继续专注');
        }
        renderPomodoroUI();
    }

    function pauseSlot(todoId) {
        var slot = findSlot(todoId);
        if (!slot) return;
        slot.paused = !slot.paused;
        if (slot.paused) document.title = pomodoroOrigTitle;
        renderPomodoroUI();
        savePomodoroState();
    }

    function stopSlot(todoId) {
        var idx = pomodoroSlots.findIndex(function (s) { return s.todoId == todoId; });
        if (idx === -1) return;
        clearInterval(pomodoroSlots[idx].timer);
        pomodoroSlots.splice(idx, 1);
        if (pomodoroSlots.length === 0) {
            stopPomodoroAnim();
            document.title = pomodoroOrigTitle || document.title;
        }
        renderPomodoroUI();
        savePomodoroState();
        render();
    }

    function renderPomodoroUI() {
        var container = document.getElementById('pomodoro-container');
        if (!container) return;
        if (pomodoroSlots.length === 0) { container.innerHTML = ''; return; }

        var html = '';
        pomodoroSlots.forEach(function (slot) {
            var todo = todos.find(function (t) { return t.id == slot.todoId; });
            var m = Math.floor(slot.remaining / 60);
            var s = slot.remaining % 60;
            var timeStr = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            var phaseText = slot.phase === 'focus' ? '专注中' : slot.phase === 'break' ? '短休息' : '长休息';
            var isFocus = slot.phase === 'focus';
            var barClass = 'pomodoro-bar' + (!isFocus ? ' break' : '') + (slot.paused ? ' paused' : '');

            html += '<div class="' + barClass + '">';
            html += '<span class="pomodoro-icon">&#127813;</span>';
            html += '<span class="pomodoro-task-name">' + escapeHtml(todo ? todo.title : '') + '</span>';
            html += '<span class="pomodoro-timer">' + timeStr + '</span>';
            html += '<span class="pomodoro-phase">' + phaseText + '</span>';
            html += '<div class="pomodoro-actions">';
            html += '<button class="pomodoro-btn" onclick="window._todo.pauseSlot(' + slot.todoId + ')" title="' + (slot.paused ? '继续' : '暂停') + '">' + (slot.paused ? '&#9654;' : '&#9208;') + '</button>';
            html += '<button class="pomodoro-btn" onclick="window._todo.stopSlot(' + slot.todoId + ')" title="停止">&#9209;</button>';
            html += '</div>';
            var countStr = '';
            for (var i = 0; i < slot.count; i++) countStr += '&#127813;';
            if (countStr) html += '<span class="pomodoro-count">' + countStr + '</span>';
            html += '</div>';
        });
        container.innerHTML = html;

        // 标题栏显示第一个运行中的计时
        var active = pomodoroSlots.find(function (s) { return !s.paused; });
        if (active) {
            var am = Math.floor(active.remaining / 60);
            var as = active.remaining % 60;
            var at = (am < 10 ? '0' : '') + am + ':' + (as < 10 ? '0' : '') + as;
            var ap = active.phase === 'focus' ? '专注中' : '休息中';
            document.title = at + ' ' + ap + ' - 待办事项';
        } else {
            document.title = pomodoroOrigTitle || '待办事项';
        }
    }

    function pomodoroNotify(msg) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('番茄钟', { body: msg });
        }
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
        } catch (e) { }
    }

    function pomodoroCountHtml(todoId) {
        var c = getPomodoroCount(todoId);
        if (c === 0) return '';
        return '<span class="todo-pomodoro-count">&#127813;' + (c > 1 ? '&times;' + c : '') + '</span>';
    }

    function startPomodoroAnim() {
        stopPomodoroAnim();
        function frame() {
            if (currentView === 'chart' && pomodoroSlots.length > 0) {
                renderChart(getFilteredTodos());
            }
            pomodoroAnimFrame = requestAnimationFrame(frame);
        }
        pomodoroAnimFrame = requestAnimationFrame(frame);
    }
    function stopPomodoroAnim() {
        if (pomodoroAnimFrame) { cancelAnimationFrame(pomodoroAnimFrame); pomodoroAnimFrame = null; }
    }

    function initPomodoroEvents() {
        // 事件通过 onclick 直接绑定到动态渲染的按钮上
    }

    /* ========== Helpers ========== */
    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function escapeHtmlPlain(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    /* ========== Init ========== */
    function init() {
        todos = loadFromLocal();
        // 默认矩阵视图，应用宽屏模式
        var mainMain = document.querySelector('.main-main');
        if (mainMain) mainMain.classList.add('todo-wide-mode');
        render(); syncFromServer();

        document.getElementById('todo-add-btn').addEventListener('click', addTodo);
        document.getElementById('todo-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });
        document.querySelectorAll('.todo-filter-btn').forEach(function (b) { b.addEventListener('click', function () { setFilter(this.dataset.filter); }); });
        document.querySelectorAll('.todo-view-btn').forEach(function (b) { b.addEventListener('click', function () { setView(this.dataset.view); }); });

        initChartEvents();
        initPomodoroEvents();
        restorePomodoro();
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

    window._todo = { toggle: toggleTodo, deleteTodo: deleteTodo, startEdit: startEdit, saveEdit: saveEdit, cancelEdit: cancelEdit, startPomodoro: startPomodoro, pauseSlot: pauseSlot, stopSlot: stopSlot };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
