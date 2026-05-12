(function () {
    'use strict';

    var AJAX_URL = window.HOME + '/wp-admin/admin-ajax.php';
    var currentDays = 30;

    function ajax(action, data) {
        var fd = new FormData();
        fd.append('action', action);
        if (data) {
            Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
        }
        return fetch(AJAX_URL, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) return res.data;
                throw new Error(res.data || 'Error');
            });
    }

    function formatNumber(n) {
        n = parseInt(n) || 0;
        if (n >= 10000) return (n / 10000).toFixed(1) + '万';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    /* ===== Overview ===== */
    function loadOverview() {
        ajax('stats_overview', {}).then(function (d) {
            document.getElementById('stats-total-views').textContent = formatNumber(d.total_views);
            document.getElementById('stats-today-views').textContent = formatNumber(d.today_views);
            document.getElementById('stats-total-posts').textContent = formatNumber(d.total_posts);
            document.getElementById('stats-avg-views').textContent = formatNumber(d.avg_views);
        });
    }

    /* ===== Trend Chart (SVG) ===== */
    function loadTrend(days) {
        var wrap = document.getElementById('stats-chart-wrap');
        wrap.innerHTML = '<div class="stats-loading">加载中...</div>';
        ajax('stats_trend', { days: days }).then(function (d) {
            renderBarChart(d.labels, d.values);
        });
    }

    function renderBarChart(labels, values) {
        var wrap = document.getElementById('stats-chart-wrap');
        var maxVal = Math.max.apply(null, values);
        if (maxVal === 0) {
            wrap.innerHTML = '<div class="stats-empty">暂无数据</div>';
            return;
        }

        var W = 800, H = 280;
        var pad = { top: 20, right: 10, bottom: 50, left: 55 };
        var cW = W - pad.left - pad.right;
        var cH = H - pad.top - pad.bottom;
        var n = labels.length;
        var gap = Math.max(1, Math.round(cW / n * 0.15));
        var barW = Math.max(2, (cW - gap * n) / n);

        var gridCount = 4;
        var step = niceStep(maxVal, gridCount);
        var yMax = step * gridCount;
        if (yMax < maxVal) yMax = step * (gridCount + 1);

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

        for (var g = 0; g <= gridCount; g++) {
            var yVal = step * g;
            var yPos = pad.top + cH - (yVal / yMax * cH);
            svg += '<line x1="' + pad.left + '" y1="' + yPos + '" x2="' + (W - pad.right) + '" y2="' + yPos + '" stroke="#e8e8e8" stroke-width="0.5"/>';
            svg += '<text x="' + (pad.left - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" fill="rgba(0,0,0,0.35)" font-size="11">' + formatNumber(yVal) + '</text>';
        }

        var labelStep = Math.ceil(n / 10);
        for (var i = 0; i < n; i++) {
            var x = pad.left + i * (barW + gap) + gap / 2;
            var h = values[i] / yMax * cH;
            var y = pad.top + cH - h;

            svg += '<rect class="stats-bar" x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="2" data-idx="' + i + '"/>';

            if (i % labelStep === 0 || i === n - 1) {
                var lbl = labels[i].slice(5);
                svg += '<text x="' + (x + barW / 2) + '" y="' + (H - pad.bottom + 16) + '" text-anchor="middle" fill="rgba(0,0,0,0.35)" font-size="10">' + lbl + '</text>';
            }
        }

        svg += '</svg>';
        svg += '<div class="stats-tooltip" id="stats-tooltip"></div>';
        wrap.innerHTML = svg;

        var tooltip = document.getElementById('stats-tooltip');
        var bars = wrap.querySelectorAll('.stats-bar');
        bars.forEach(function (bar) {
            bar.addEventListener('mouseenter', function (e) {
                var idx = parseInt(bar.getAttribute('data-idx'));
                tooltip.innerHTML = labels[idx] + '<br>' + values[idx] + ' 次浏览';
                tooltip.style.display = 'block';
                var rect = bar.getBoundingClientRect();
                var wrapRect = wrap.getBoundingClientRect();
                tooltip.style.left = (rect.left - wrapRect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = (rect.top - wrapRect.top - 40) + 'px';
            });
            bar.addEventListener('mouseleave', function () {
                tooltip.style.display = 'none';
            });
        });
    }

    function niceStep(max, count) {
        var rough = max / count;
        var pow = Math.pow(10, Math.floor(Math.log10(rough)));
        var fraction = rough / pow;
        var nice;
        if (fraction <= 1) nice = 1;
        else if (fraction <= 2) nice = 2;
        else if (fraction <= 5) nice = 5;
        else nice = 10;
        return Math.max(1, nice * pow);
    }

    /* ===== Popular Articles ===== */
    function loadPopular() {
        var wrap = document.getElementById('stats-popular-wrap');
        wrap.innerHTML = '<div class="stats-loading">加载中...</div>';
        ajax('stats_popular', { limit: 20, period: currentDays.toString() }).then(function (items) {
            if (!items.length) {
                wrap.innerHTML = '<div class="stats-empty">暂无数据</div>';
                return;
            }
            var html = '<table class="stats-table"><thead><tr>';
            html += '<th style="width:50px">排名</th><th>标题</th><th style="width:90px">浏览量</th><th style="width:110px">发布日期</th>';
            html += '</tr></thead><tbody>';
            items.forEach(function (item, i) {
                var rank = i + 1;
                var rankClass = rank <= 3 ? ' stats-rank-' + rank : '';
                html += '<tr>';
                html += '<td><span class="stats-rank' + rankClass + '">' + rank + '</span></td>';
                html += '<td><a href="' + escapeHtml(item.permalink) + '" target="_blank">' + escapeHtml(item.title) + '</a></td>';
                html += '<td>' + formatNumber(item.views) + '</td>';
                html += '<td>' + escapeHtml(item.date) + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
            wrap.innerHTML = html;
        });
    }

    /* ===== Period Selector ===== */
    function initPeriodSelector() {
        var btns = document.querySelectorAll('.stats-period-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentDays = parseInt(btn.getAttribute('data-days'));
                loadTrend(currentDays);
                loadPopular();
            });
        });
    }

    /* ===== Init ===== */
    function init() {
        loadOverview();
        loadTrend(currentDays);
        loadPopular();
        initPeriodSelector();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
