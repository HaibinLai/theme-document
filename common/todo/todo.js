/**
 * 待办事项前端逻辑
 * LocalStorage 缓存 + AJAX 同步
 * @author Haibin
 * @date 2026-04-17
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'document_todos';
    const AJAX_URL = window.HOME + '/wp-admin/admin-ajax.php';

    let todos = [];
    let currentFilter = 'all'; // all | active | completed
    let editingId = null;
    let dragItem = null;

    /* ========== LocalStorage 层 ========== */

    function saveToLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (e) { }
    }

    function loadFromLocal() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /* ========== AJAX 层 ========== */

    function ajax(action, data) {
        return new Promise(function (resolve, reject) {
            var formData = new FormData();
            formData.append('action', action);
            if (data) {
                Object.keys(data).forEach(function (key) {
                    formData.append(key, data[key]);
                });
            }
            fetch(AJAX_URL, { method: 'POST', body: formData, credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.success) resolve(res.data);
                    else reject(res.data);
                })
                .catch(reject);
        });
    }

    function syncFromServer() {
        ajax('todo_list').then(function (data) {
            todos = data;
            saveToLocal();
            render();
        }).catch(function () { /* 离线模式，使用本地数据 */ });
    }

    /* ========== 操作方法 ========== */

    function addTodo() {
        var input = document.getElementById('todo-input');
        var prioritySelect = document.getElementById('todo-priority');
        var dateInput = document.getElementById('todo-date');

        var title = input.value.trim();
        if (!title) return;

        var priority = prioritySelect.value;
        var dueDate = dateInput.value;

        // 乐观更新：临时 ID
        var tempId = 'temp_' + Date.now();
        var tempTodo = {
            id: tempId,
            title: title,
            completed: 0,
            priority: priority,
            due_date: dueDate || null,
            sort_order: 0,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        todos.unshift(tempTodo);
        saveToLocal();
        render();
        input.value = '';
        dateInput.value = '';
        input.focus();

        // 提交到服务器
        ajax('todo_create', { title: title, priority: priority, due_date: dueDate })
            .then(function (row) {
                var idx = todos.findIndex(function (t) { return t.id === tempId; });
                if (idx !== -1) todos[idx] = row;
                saveToLocal();
                render();
            })
            .catch(function () {
                todos = todos.filter(function (t) { return t.id !== tempId; });
                saveToLocal();
                render();
            });
    }

    function toggleTodo(id) {
        var todo = todos.find(function (t) { return t.id == id; });
        if (!todo) return;

        todo.completed = todo.completed == 1 ? 0 : 1;
        saveToLocal();
        render();

        ajax('todo_update', { id: id, completed: todo.completed });
    }

    function deleteTodo(id) {
        if (!confirm('确定删除这条待办？')) return;

        todos = todos.filter(function (t) { return t.id != id; });
        saveToLocal();
        render();

        ajax('todo_delete', { id: id });
    }

    function startEdit(id) {
        editingId = id;
        render();
        var el = document.getElementById('edit-title-' + id);
        if (el) { el.focus(); el.select(); }
    }

    function saveEdit(id) {
        var el = document.getElementById('edit-title-' + id);
        var priorityEl = document.getElementById('edit-priority-' + id);
        var dateEl = document.getElementById('edit-date-' + id);

        var todo = todos.find(function (t) { return t.id == id; });
        if (!todo) return;

        var newTitle = el ? el.value.trim() : todo.title;
        if (!newTitle) newTitle = todo.title;

        var data = { id: id };
        todo.title = newTitle;
        data.title = newTitle;

        if (priorityEl) {
            todo.priority = priorityEl.value;
            data.priority = priorityEl.value;
        }
        if (dateEl) {
            todo.due_date = dateEl.value || null;
            data.due_date = dateEl.value || '';
        }

        editingId = null;
        saveToLocal();
        render();
        ajax('todo_update', data);
    }

    function cancelEdit() {
        editingId = null;
        render();
    }

    function setFilter(filter) {
        currentFilter = filter;
        render();
    }

    /* ========== 拖拽排序 ========== */

    function handleDragStart(e) {
        dragItem = e.currentTarget;
        dragItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        var target = e.target.closest('.todo-item');
        if (target && target !== dragItem) {
            var list = document.getElementById('todo-list');
            var items = Array.from(list.children);
            var dragIdx = items.indexOf(dragItem);
            var targetIdx = items.indexOf(target);
            if (dragIdx < targetIdx) {
                list.insertBefore(dragItem, target.nextSibling);
            } else {
                list.insertBefore(dragItem, target);
            }
        }
    }

    function handleDragEnd() {
        if (dragItem) dragItem.classList.remove('dragging');
        dragItem = null;

        var list = document.getElementById('todo-list');
        var items = Array.from(list.children);
        var orders = [];
        items.forEach(function (item, idx) {
            var id = item.dataset.id;
            var todo = todos.find(function (t) { return t.id == id; });
            if (todo) {
                todo.sort_order = idx;
                orders.push({ id: id, sort_order: idx });
            }
        });
        saveToLocal();
        ajax('todo_reorder', { orders: JSON.stringify(orders) });
    }

    /* ========== 日期与倒计时 ========== */

    function getDaysRemaining(dateStr) {
        if (!dateStr) return null;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var m = d.getMonth() + 1;
        var day = d.getDate();
        return m + '月' + day + '日';
    }

    function getCountdownHtml(todo) {
        if (!todo.due_date || todo.completed == 1) return '';
        var days = getDaysRemaining(todo.due_date);
        if (days === null) return '';

        var cls, text;
        if (days < 0) {
            cls = 'overdue';
            text = '已过期' + Math.abs(days) + '天';
        } else if (days === 0) {
            cls = 'urgent';
            text = '今天截止';
        } else if (days === 1) {
            cls = 'urgent';
            text = '明天截止';
        } else if (days <= 3) {
            cls = 'soon';
            text = '剩余' + days + '天';
        } else {
            cls = 'normal';
            text = '剩余' + days + '天';
        }
        return '<span class="todo-countdown ' + cls + '">' + text + '</span>';
    }

    function isOverdue(todo) {
        if (!todo.due_date || todo.completed == 1) return false;
        var days = getDaysRemaining(todo.due_date);
        return days !== null && days < 0;
    }

    function priorityLabel(p) {
        var map = { high: '紧急', medium: '普通', low: '低优' };
        return map[p] || '普通';
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
        var active = total - done;
        var percent = total > 0 ? Math.round(done / total * 100) : 0;

        // 统计
        var statsEl = document.getElementById('todo-stats');
        statsEl.innerHTML = '<span>共 ' + total + ' 项</span>'
            + '<span>待完成 ' + active + '</span>'
            + '<span>已完成 ' + done + '</span>'
            + '<span>' + percent + '%</span>';

        // 进度条
        var progressBar = document.getElementById('todo-progress-bar');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }

        // 筛选按钮高亮
        document.querySelectorAll('.todo-filter-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });

        // 列表
        var listEl = document.getElementById('todo-list');

        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="todo-empty">'
                + '<div class="todo-empty-icon">&#128203;</div>'
                + (currentFilter === 'all' ? '暂无待办事项，添加一个吧' :
                    currentFilter === 'active' ? '所有任务都完成了，太棒了！' : '还没有已完成的待办')
                + '</div>';
            return;
        }

        var html = '';
        filtered.forEach(function (todo) {
            var isEditing = editingId == todo.id;
            var overdue = isOverdue(todo);

            // 外层容器
            html += '<div class="todo-item' + (todo.completed == 1 ? ' completed' : '') + (overdue ? ' overdue' : '') + '"'
                + ' data-id="' + todo.id + '"'
                + ' draggable="true">';

            // 左侧优先级彩条
            html += '<div class="todo-priority-bar ' + (todo.priority || 'medium') + '"></div>';

            // 主体
            html += '<div class="todo-body">';

            // 复选框
            html += '<div class="todo-checkbox" onclick="window._todo.toggle(' + todo.id + ')"></div>';

            // 内容区
            html += '<div class="todo-content">';
            if (isEditing) {
                html += '<input class="todo-title-input" id="edit-title-' + todo.id + '" value="' + escapeHtml(todo.title) + '"'
                    + ' onkeydown="if(event.key===\'Enter\')window._todo.saveEdit(' + todo.id + ');if(event.key===\'Escape\')window._todo.cancelEdit()">';
                html += '<div class="todo-edit-inline">';
                html += '<select id="edit-priority-' + todo.id + '">'
                    + '<option value="high"' + (todo.priority === 'high' ? ' selected' : '') + '>紧急</option>'
                    + '<option value="medium"' + (todo.priority === 'medium' ? ' selected' : '') + '>普通</option>'
                    + '<option value="low"' + (todo.priority === 'low' ? ' selected' : '') + '>低优</option>'
                    + '</select>';
                html += '<input type="date" id="edit-date-' + todo.id + '" value="' + (todo.due_date || '') + '">';
                html += '<button class="todo-action-btn" onclick="window._todo.saveEdit(' + todo.id + ')" title="保存">&#10003;</button>';
                html += '<button class="todo-action-btn" onclick="window._todo.cancelEdit()" title="取消">&#10005;</button>';
                html += '</div>';
            } else {
                html += '<div class="todo-title">' + escapeHtml(todo.title) + '</div>';
                html += '<div class="todo-meta">';
                html += '<span class="todo-priority-tag ' + todo.priority + '">' + priorityLabel(todo.priority) + '</span>';
                if (todo.due_date) {
                    html += '<span class="todo-due">'
                        + '<span class="todo-due-icon">&#128197;</span>'
                        + formatDate(todo.due_date)
                        + '</span>';
                    html += getCountdownHtml(todo);
                }
                html += '</div>';
            }
            html += '</div>'; // .todo-content

            // 操作按钮
            if (!isEditing) {
                html += '<div class="todo-actions">';
                html += '<button class="todo-action-btn" onclick="window._todo.startEdit(' + todo.id + ')" title="编辑">&#9998;</button>';
                html += '<button class="todo-action-btn delete" onclick="window._todo.deleteTodo(' + todo.id + ')" title="删除">&#128465;</button>';
                html += '</div>';
            }

            html += '</div>'; // .todo-body
            html += '</div>'; // .todo-item
        });

        listEl.innerHTML = html;

        // 绑定拖拽
        listEl.querySelectorAll('.todo-item').forEach(function (item) {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ========== 初始化 ========== */

    function init() {
        // 先从 LocalStorage 渲染
        todos = loadFromLocal();
        render();

        // 再从服务器同步
        syncFromServer();

        // 添加按钮
        document.getElementById('todo-add-btn').addEventListener('click', addTodo);
        document.getElementById('todo-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') addTodo();
        });

        // 筛选按钮
        document.querySelectorAll('.todo-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setFilter(this.dataset.filter);
            });
        });
    }

    // 暴露方法
    window._todo = {
        toggle: toggleTodo,
        deleteTodo: deleteTodo,
        startEdit: startEdit,
        saveEdit: saveEdit,
        cancelEdit: cancelEdit
    };

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
