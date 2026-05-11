(function () {
  var containers = document.querySelectorAll('.plotly-container[data-src]');
  if (!containers.length) return;

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function getThemeColors() {
    var dark = isDark();
    return {
      paper_bgcolor: dark ? '#1f1f1f' : '#ffffff',
      plot_bgcolor: dark ? '#1f1f1f' : '#ffffff',
      font: { color: dark ? '#e0e0e0' : '#333333' },
    };
  }

  function renderChart(el) {
    var src = el.getAttribute('data-src');
    if (!src) return;

    fetch(src)
      .then(function (r) { return r.json(); })
      .then(function (fig) {
        var data = fig.data || [];
        var layout = fig.layout || {};
        var colors = getThemeColors();

        layout.paper_bgcolor = colors.paper_bgcolor;
        layout.plot_bgcolor = colors.plot_bgcolor;
        layout.font = Object.assign(layout.font || {}, colors.font);
        layout.autosize = true;
        layout.margin = layout.margin || { l: 40, r: 40, t: 40, b: 40 };

        var loading = el.querySelector('.plotly-loading');
        if (loading) loading.remove();

        Plotly.newPlot(el, data, layout, { responsive: true, displaylogo: false });
      })
      .catch(function () {
        el.innerHTML = '<div class="plotly-error">3D 图表加载失败</div>';
      });
  }

  containers.forEach(renderChart);

  var observer = new MutationObserver(function () {
    var colors = getThemeColors();
    containers.forEach(function (el) {
      if (el.data && el.data.length) {
        Plotly.relayout(el, {
          paper_bgcolor: colors.paper_bgcolor,
          plot_bgcolor: colors.plot_bgcolor,
          'font.color': colors.font.color,
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
})();
