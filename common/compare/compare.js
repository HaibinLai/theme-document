(function () {
  var containers = document.querySelectorAll('.img-compare');
  if (!containers.length) return;

  containers.forEach(function (container) {
    var before = container.querySelector('.img-compare-before');
    var handle = container.querySelector('.img-compare-handle');
    var dragging = false;

    function setPosition(x) {
      var rect = container.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      var percent = pct * 100;
      before.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
      handle.style.left = percent + '%';
    }

    function onStart(e) {
      e.preventDefault();
      dragging = true;
      container.classList.add('img-compare-active');
    }

    function onMove(e) {
      if (!dragging) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(x);
    }

    function onEnd() {
      dragging = false;
      container.classList.remove('img-compare-active');
    }

    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    container.addEventListener('click', function (e) {
      if (e.target === handle || handle.contains(e.target)) return;
      setPosition(e.clientX);
    });
  });
})();
