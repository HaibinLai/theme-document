(function () {
    'use strict';

    var AJAX_URL = window.HOME + '/wp-admin/admin-ajax.php';
    var currentDays = 30;
    var chartData = null;
    var hiddenPosts = {};

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

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function loadChart(days) {
        var wrap = document.getElementById('trend-chart-wrap');
        wrap.innerHTML = '<div class="trend-loading">加载中...</div>';
        ajax('stats_trend_posts', { days: days, limit: 5 }).then(function (data) {
            chartData = data;
            hiddenPosts = {};
            renderChart();
            renderLegend();
        });
    }

    function renderChart() {
        var wrap = document.getElementById('trend-chart-wrap');
        var data = chartData;
        if (!data || !data.posts.length) {
            wrap.innerHTML = '<div class="trend-empty">暂无数据</div>';
            return;
        }

        var labels = data.labels;
        var posts = data.posts;
        var n = labels.length;

        var maxVal = 0;
        posts.forEach(function (p) {
            if (hiddenPosts[p.id]) return;
            p.values.forEach(function (v) { if (v > maxVal) maxVal = v; });
        });
        if (maxVal === 0) maxVal = 1;

        var W = 800, H = 350;
        var pad = { top: 20, right: 15, bottom: 50, left: 55 };
        var cW = W - pad.left - pad.right;
        var cH = H - pad.top - pad.bottom;

        var gridCount = 4;
        var step = niceStep(maxVal, gridCount);
        var yMax = step * gridCount;
        if (yMax < maxVal) yMax = step * (gridCount + 1);

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

        for (var g = 0; g <= gridCount; g++) {
            var yVal = step * g;
            var yPos = pad.top + cH - (yVal / yMax * cH);
            svg += '<line x1="' + pad.left + '" y1="' + yPos + '" x2="' + (W - pad.right) + '" y2="' + yPos + '" stroke="#e8e8e8" stroke-width="0.5"/>';
            svg += '<text x="' + (pad.left - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" fill="rgba(0,0,0,0.35)" font-size="11">' + formatNum(yVal) + '</text>';
        }

        var labelStep = Math.ceil(n / 10);
        for (var i = 0; i < n; i++) {
            if (i % labelStep === 0 || i === n - 1) {
                var lx = pad.left + (i / (n - 1)) * cW;
                svg += '<text x="' + lx + '" y="' + (H - pad.bottom + 16) + '" text-anchor="middle" fill="rgba(0,0,0,0.35)" font-size="10">' + labels[i].slice(5) + '</text>';
            }
        }

        posts.forEach(function (p) {
            if (hiddenPosts[p.id]) return;
            var pts = [];
            for (var i = 0; i < n; i++) {
                var x = pad.left + (i / (n - 1)) * cW;
                var y = pad.top + cH - (p.values[i] / yMax * cH);
                pts.push(x.toFixed(1) + ',' + y.toFixed(1));
            }
            svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + p.color + '" stroke-width="2" stroke-linejoin="round"/>';
            for (var i = 0; i < n; i++) {
                var x = pad.left + (i / (n - 1)) * cW;
                var y = pad.top + cH - (p.values[i] / yMax * cH);
                svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.5" fill="' + p.color + '" opacity="0"/>';
            }
        });

        for (var i = 0; i < n; i++) {
            var x = pad.left + (i / (n - 1)) * cW;
            var hw = cW / n / 2;
            svg += '<rect x="' + (x - hw) + '" y="' + pad.top + '" width="' + (hw * 2) + '" height="' + cH + '" fill="transparent" data-idx="' + i + '" class="trend-hover-area"/>';
        }

        svg += '</svg>';
        svg += '<div class="trend-tooltip" id="trend-tooltip"></div>';
        wrap.innerHTML = svg;

        var tooltip = document.getElementById('trend-tooltip');
        var areas = wrap.querySelectorAll('.trend-hover-area');
        var circles = wrap.querySelectorAll('circle');

        areas.forEach(function (area) {
            area.addEventListener('mouseenter', function () {
                var idx = parseInt(area.getAttribute('data-idx'));
                var html = '<strong>' + labels[idx] + '</strong>';
                var visiblePosts = posts.filter(function (p) { return !hiddenPosts[p.id]; });
                visiblePosts.forEach(function (p) {
                    html += '<br><span style="color:' + p.color + '">●</span> ' + escapeHtml(p.title).slice(0, 20) + ': ' + p.values[idx];
                });
                tooltip.innerHTML = html;
                tooltip.style.display = 'block';

                var rect = area.getBoundingClientRect();
                var wrapRect = wrap.getBoundingClientRect();
                var left = rect.left - wrapRect.left + rect.width / 2 - tooltip.offsetWidth / 2;
                left = Math.max(0, Math.min(left, wrapRect.width - tooltip.offsetWidth));
                tooltip.style.left = left + 'px';
                tooltip.style.top = (rect.top - wrapRect.top - tooltip.offsetHeight - 8) + 'px';

                circles.forEach(function (c) {
                    var ci = Math.round((parseFloat(c.getAttribute('cx')) - pad.left) / cW * (n - 1));
                    if (ci === idx) c.setAttribute('opacity', '1');
                });
            });
            area.addEventListener('mouseleave', function () {
                tooltip.style.display = 'none';
                circles.forEach(function (c) { c.setAttribute('opacity', '0'); });
            });
        });
    }

    function renderLegend() {
        var legend = document.getElementById('trend-legend');
        if (!chartData || !chartData.posts.length) {
            legend.innerHTML = '';
            return;
        }
        var html = '';
        chartData.posts.forEach(function (p) {
            var dimmed = hiddenPosts[p.id] ? ' dimmed' : '';
            html += '<div class="trend-legend-item' + dimmed + '" data-id="' + p.id + '">';
            html += '<span class="trend-legend-dot" style="background:' + p.color + '"></span>';
            html += '<span class="trend-legend-title">' + escapeHtml(p.title) + '</span>';
            html += '</div>';
        });
        legend.innerHTML = html;

        legend.querySelectorAll('.trend-legend-item').forEach(function (el) {
            el.addEventListener('click', function () {
                var id = parseInt(el.getAttribute('data-id'));
                hiddenPosts[id] = !hiddenPosts[id];
                renderChart();
                renderLegend();
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

    function formatNum(n) {
        n = parseInt(n) || 0;
        if (n >= 10000) return (n / 10000).toFixed(1) + '万';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    }

    function initPeriodSelector() {
        var btns = document.querySelectorAll('.trend-period-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentDays = parseInt(btn.getAttribute('data-days'));
                loadChart(currentDays);
            });
        });
    }

    function init() {
        loadChart(currentDays);
        initPeriodSelector();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
