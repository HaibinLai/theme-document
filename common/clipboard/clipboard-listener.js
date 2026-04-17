/**
 * Clipboard Helper - Global copy listener
 * Silently captures copy events and saves to server
 * Only loaded for logged-in users
 * @author Haibin
 * @date 2026-04-17
 */
(function () {
    'use strict';

    var AJAX_URL = window.CLIPBOARD_AJAX || '';
    var STORAGE_KEY = 'document_clipboard';
    var debounceTimer = null;

    if (!AJAX_URL) return;

    // Load local cache
    function getLocal() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
    }
    function saveLocal(arr) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 100))); } catch (e) {}
    }

    // Show toast notification
    function showToast(msg) {
        var el = document.getElementById('clipboard-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'clipboard-toast';
            el.style.cssText = 'position:fixed;bottom:24px;right:24px;background:rgba(62,175,124,0.95);color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;z-index:99999;opacity:0;transition:opacity 0.3s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = '1';
        clearTimeout(el._timer);
        el._timer = setTimeout(function () { el.style.opacity = '0'; }, 2000);
    }

    // Save to server
    function saveToServer(text) {
        var fd = new FormData();
        fd.append('action', 'clipboard_save');
        fd.append('content', text);
        fetch(AJAX_URL, { method: 'POST', body: fd, credentials: 'same-origin' })
            .catch(function () {});
    }

    // Listen for copy events
    document.addEventListener('copy', function () {
        // Debounce rapid copies
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            var sel = window.getSelection();
            var text = sel ? sel.toString() : '';
            if (!text || text.trim().length === 0) return;
            // Skip very short selections (1-2 chars, likely accidental)
            if (text.trim().length < 3) return;

            // Save to localStorage
            var local = getLocal();
            local.unshift({
                type: 'text',
                content: text,
                created_at: new Date().toISOString()
            });
            saveLocal(local);

            // Save to server
            saveToServer(text);

            // Show toast
            var preview = text.length > 30 ? text.substring(0, 30) + '...' : text;
            showToast('Saved: ' + preview);
        }, 100);
    });
})();
