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
    let currentView = 'list'; // list | chart
    let editingId = null;
    let dragItem = null;

    // Chart state
    let chartCanvas = null;
    let chartCtx = null;
    let chartPoints = []; // {x, y, todo, screenX, screenY}
    let hoveredPoint = null;
    let chartPadding = { top: 40, right: 40, bottom: 50, left: 60 };

    /* ========== LocalStorage ========== */
    function saveToLocal() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch (e) { }
    }
    function loadFromLocal() {
        try { var d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; } catch (e) { return []; }
    }

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
        else { cls = 'normal'; text = '剩余' + days + '天'; }
        return '<span class="todo-countdown ' + cls + '">' + text + '</span>';
    }
    function isOverdue(todo) {
        if (!todo.due_date || todo.completed == 1) return false;
        var d = getDaysRemaining(todo.due_date); return d !== null && d < 0;
    }
    function priorityLabel(p) { return { high: '紧急', medium: '普通', low: '低优' }[p] || '普通'; }
    function importanceLabel(v) { return ['', '不重要', '较低', '一般', '重要', '非常重要'][v] || '一般'; }

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
        var chartWrap = document.getElementById('todo-chart-wrap');
        chartWrap.style.display = v === 'chart' ? 'block' : 'none';
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
            var overdue = isOverdue(todo);
            html += '<div class="todo-item' + (todo.completed == 1 ? ' completed' : '') + '" data-id="' + todo.id + '" draggable="true">';
            html += '<div class="todo-priority-bar ' + (todo.priority || 'medium') + '"></div>';
            html += '<div class="todo-body">';
            html += '<div class="todo-checkbox" onclick="window._todo.toggle(' + todo.id + ')"></div>';
            html += '<div class="todo-content">';
            if (isEditing) {
                html += '<input class="todo-title-input" id="edit-title-' + todo.id + '" value="' + escapeHtml(todo.title) + '" onkeydown="if(event.key===\'Enter\')window._todo.saveEdit(' + todo.id + ');if(event.key===\'Escape\')window._todo.cancelEdit()">';
                html += '<div class="todo-edit-inline">';
                html += '<select id="edit-priority-' + todo.id + '"><option value="high"' + (todo.priority === 'high' ? ' selected' : '') + '>紧急</option><option value="medium"' + (todo.priority === 'medium' ? ' selected' : '') + '>普通</option><option value="low"' + (todo.priority === 'low' ? ' selected' : '') + '>低优</option></select>';
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
                html += '<span class="todo-priority-tag ' + todo.priority + '">' + priorityLabel(todo.priority) + '</span>';
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

    function importanceStars(v) {
        v = parseInt(v) || 3;
        var s = '';
        for (var i = 0; i < 5; i++) s += i < v ? '★' : '☆';
        return s;
    }

    /* ========== 2D Chart ========== */

    function renderChart(filtered) {
        var wrap = document.getElementById('todo-chart-wrap');
        chartCanvas = document.getElementById('todo-chart');
        if (!chartCanvas) return;
        chartCtx = chartCanvas.getContext('2d');

        // Responsive sizing
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

        // Clear
        chartCtx.clearRect(0, 0, w, h);

        // Draw quadrant backgrounds
        var halfX = p.left + cw / 2;
        var halfY = p.top + ch / 2;

        // Q1: top-left (urgent + important) — red
        chartCtx.fillStyle = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)';
        chartCtx.fillRect(p.left, p.top, cw / 2, ch / 2);
        // Q2: top-right (not urgent + important) — orange
        chartCtx.fillStyle = isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)';
        chartCtx.fillRect(halfX, p.top, cw / 2, ch / 2);
        // Q3: bottom-left (urgent + not important) — yellow
        chartCtx.fillStyle = isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.06)';
        chartCtx.fillRect(p.left, halfY, cw / 2, ch / 2);
        // Q4: bottom-right (not urgent + not important) — green
        chartCtx.fillStyle = isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)';
        chartCtx.fillRect(halfX, halfY, cw / 2, ch / 2);

        // Quadrant labels
        var labelColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
        chartCtx.font = '13px sans-serif';
        chartCtx.fillStyle = labelColor;
        chartCtx.textAlign = 'center';
        chartCtx.fillText('紧急且重要 · 立即做', p.left + cw / 4, p.top + 24);
        chartCtx.fillText('重要不紧急 · 计划做', halfX + cw / 4, p.top + 24);
        chartCtx.fillText('紧急不重要 · 委托做', p.left + cw / 4, halfY + 24);
        chartCtx.fillText('不急不重要 · 可删除', halfX + cw / 4, halfY + 24);

        // Divider lines
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        chartCtx.setLineDash([6, 4]);
        chartCtx.beginPath();
        chartCtx.moveTo(halfX, p.top); chartCtx.lineTo(halfX, p.top + ch);
        chartCtx.moveTo(p.left, halfY); chartCtx.lineTo(p.left + cw, halfY);
        chartCtx.stroke();
        chartCtx.setLineDash([]);

        // Axes
        var axisColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
        chartCtx.strokeStyle = axisColor;
        chartCtx.lineWidth = 1.5;
        chartCtx.beginPath();
        chartCtx.moveTo(p.left, p.top); chartCtx.lineTo(p.left, p.top + ch); chartCtx.lineTo(p.left + cw, p.top + ch);
        chartCtx.stroke();
        chartCtx.lineWidth = 1;

        // Axis labels
        var textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        chartCtx.fillStyle = textColor;
        chartCtx.font = '12px sans-serif';
        chartCtx.textAlign = 'center';

        // X axis labels
        var xLabels = ['已过期', '今天', '3天', '7天', '14天', '30天+'];
        var xPositions = [0, 0.1, 0.25, 0.45, 0.65, 0.9];
        for (var i = 0; i < xLabels.length; i++) {
            chartCtx.fillText(xLabels[i], p.left + cw * xPositions[i], p.top + ch + 20);
        }
        chartCtx.fillText('← 紧急                                     不紧急 →', p.left + cw / 2, p.top + ch + 40);

        // Y axis labels
        chartCtx.textAlign = 'right';
        for (var j = 1; j <= 5; j++) {
            var yy = p.top + ch - (j - 1) / 4 * ch;
            chartCtx.fillText(j + '★', p.left - 8, yy + 4);
        }
        chartCtx.save();
        chartCtx.translate(14, p.top + ch / 2);
        chartCtx.rotate(-Math.PI / 2);
        chartCtx.textAlign = 'center';
        chartCtx.fillText('重要程度', 0, 0);
        chartCtx.restore();

        // Y axis grid lines
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
        for (var g = 1; g <= 5; g++) {
            var gy = p.top + ch - (g - 1) / 4 * ch;
            chartCtx.beginPath(); chartCtx.moveTo(p.left, gy); chartCtx.lineTo(p.left + cw, gy); chartCtx.stroke();
        }

        // Compute points
        chartPoints = [];
        var MAX_DAYS = 35; // X轴最大天数
        filtered.forEach(function (todo) {
            var days = getDaysRemaining(todo.due_date);
            var xVal;
            if (days === null) xVal = MAX_DAYS; // 无截止日期放最右
            else if (days < -5) xVal = -5;      // 限制最左
            else xVal = days;

            var imp = parseInt(todo.importance) || 3;
            // Map to canvas coords
            // X: days -> left(urgent) to right(not urgent): -5..MAX_DAYS -> left..right
            var xRatio = (xVal + 5) / (MAX_DAYS + 5);
            var yRatio = (imp - 1) / 4; // 1..5 -> 0..1, bottom..top
            var sx = p.left + xRatio * cw;
            var sy = p.top + ch - yRatio * ch;

            chartPoints.push({ x: xVal, y: imp, screenX: sx, screenY: sy, todo: todo });
        });

        // Draw points
        chartPoints.forEach(function (pt) {
            var completed = pt.todo.completed == 1;
            var r = completed ? 6 : 9;
            var alpha = completed ? 0.3 : 0.85;

            // Color based on quadrant
            var color;
            var isUrgent = pt.x <= 7;
            var isImportant = pt.y >= 3;
            if (isUrgent && isImportant) color = 'rgba(239,68,68,' + alpha + ')';       // red
            else if (!isUrgent && isImportant) color = 'rgba(245,158,11,' + alpha + ')'; // orange
            else if (isUrgent && !isImportant) color = 'rgba(234,179,8,' + alpha + ')';  // yellow
            else color = 'rgba(16,185,129,' + alpha + ')';                                // green

            chartCtx.beginPath();
            chartCtx.arc(pt.screenX, pt.screenY, r, 0, Math.PI * 2);
            chartCtx.fillStyle = color;
            chartCtx.fill();

            // Border
            chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
            chartCtx.lineWidth = 1;
            chartCtx.stroke();

            // Completed strikethrough
            if (completed) {
                chartCtx.beginPath();
                chartCtx.moveTo(pt.screenX - r, pt.screenY);
                chartCtx.lineTo(pt.screenX + r, pt.screenY);
                chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
                chartCtx.lineWidth = 2;
                chartCtx.stroke();
            }

            // Hovered point highlight
            if (hoveredPoint && hoveredPoint.todo.id === pt.todo.id) {
                chartCtx.beginPath();
                chartCtx.arc(pt.screenX, pt.screenY, r + 4, 0, Math.PI * 2);
                chartCtx.strokeStyle = color;
                chartCtx.lineWidth = 2;
                chartCtx.stroke();
            }
        });

        // Draw tooltip
        if (hoveredPoint) {
            drawTooltip(hoveredPoint, w, h, isDark);
        }
    }

    function drawTooltip(pt, canvasW, canvasH, isDark) {
        var todo = pt.todo;
        var lines = [escapeHtmlPlain(todo.title)];
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
        var tw = maxW + 20;
        var th = lines.length * 20 + 14;
        var tx = pt.screenX + 14;
        var ty = pt.screenY - th / 2;

        // Keep in bounds
        if (tx + tw > canvasW - 10) tx = pt.screenX - tw - 14;
        if (ty < 5) ty = 5;
        if (ty + th > canvasH - 5) ty = canvasH - th - 5;

        // Background
        chartCtx.fillStyle = isDark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.97)';
        chartCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        chartCtx.lineWidth = 1;
        roundRect(chartCtx, tx, ty, tw, th, 8);
        chartCtx.fill();
        chartCtx.stroke();

        // Shadow
        chartCtx.shadowColor = 'rgba(0,0,0,0.1)';
        chartCtx.shadowBlur = 8;
        chartCtx.shadowOffsetX = 0;
        chartCtx.shadowOffsetY = 2;
        roundRect(chartCtx, tx, ty, tw, th, 8);
        chartCtx.fill();
        chartCtx.shadowColor = 'transparent';

        // Text
        chartCtx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : '#333';
        chartCtx.textAlign = 'left';
        chartCtx.font = 'bold 12px sans-serif';
        chartCtx.fillText(lines[0], tx + 10, ty + 20);
        chartCtx.font = '11px sans-serif';
        chartCtx.fillStyle = isDark ? 'rgba(255,255,255,0.65)' : '#666';
        for (var i = 1; i < lines.length; i++) {
            chartCtx.fillText(lines[i], tx + 10, ty + 20 + i * 20);
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
        var closest = null, minDist = 20; // 20px tolerance
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
            var mx = e.clientX - rect.left, my = e.clientY - rect.top;
            var pt = findPointAt(mx, my);
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
            var mx = e.clientX - rect.left, my = e.clientY - rect.top;
            var pt = findPointAt(mx, my);
            if (pt) {
                // Switch to list view and edit
                setView('list');
                startEdit(pt.todo.id);
            }
        });
    }

    /* ========== Helpers ========== */
    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function escapeHtmlPlain(str) {
        return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    }

    /* ========== Init ========== */
    function init() {
        todos = loadFromLocal();
        render();
        syncFromServer();

        document.getElementById('todo-add-btn').addEventListener('click', addTodo);
        document.getElementById('todo-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });
        document.querySelectorAll('.todo-filter-btn').forEach(function (b) { b.addEventListener('click', function () { setFilter(this.dataset.filter); }); });
        document.querySelectorAll('.todo-view-btn').forEach(function (b) { b.addEventListener('click', function () { setView(this.dataset.view); }); });

        initChartEvents();

        // Resize handler for chart
        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { if (currentView === 'chart') render(); }, 200);
        });

        // importance slider label
        var impSlider = document.getElementById('todo-importance');
        var impLabel = document.getElementById('todo-importance-label');
        if (impSlider && impLabel) {
            impSlider.addEventListener('input', function () {
                impLabel.textContent = importanceStars(this.value);
            });
        }
    }

    window._todo = { toggle: toggleTodo, deleteTodo: deleteTodo, startEdit: startEdit, saveEdit: saveEdit, cancelEdit: cancelEdit };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
