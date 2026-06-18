(function () {
  function ensureLightbox() {
    var existing = document.querySelector('.fragment-lightbox');
    if (existing) {
      return existing;
    }

    var box = document.createElement('div');
    box.className = 'fragment-lightbox';
    box.innerHTML = '<button class="fragment-lightbox-close" type="button" aria-label="Close">×</button><img alt="">';
    document.body.appendChild(box);

    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.classList.contains('fragment-lightbox-close')) {
        box.classList.remove('is-open');
        box.querySelector('img').removeAttribute('src');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        box.classList.remove('is-open');
        box.querySelector('img').removeAttribute('src');
      }
    });

    return box;
  }

  function initExpanders() {
    document.querySelectorAll('.fragment-content-wrap').forEach(function (wrap) {
      var content = wrap.querySelector('.fragment-content');
      var button = wrap.querySelector('.fragment-expand');

      if (!content || !button) {
        return;
      }

      if (content.scrollHeight <= content.clientHeight + 2) {
        return;
      }

      button.classList.add('is-visible');
      button.addEventListener('click', function () {
        var expanded = content.classList.toggle('is-expanded');
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        button.textContent = expanded ? '收起' : '展开';
      });
    });
  }

  function initImages() {
    var lightbox = ensureLightbox();
    var lightboxImage = lightbox.querySelector('img');

    document.querySelectorAll('.fragment-thumb').forEach(function (button) {
      button.addEventListener('click', function () {
        var full = button.getAttribute('data-full');
        var img = button.querySelector('img');

        if (!full) {
          return;
        }

        lightboxImage.src = full;
        lightboxImage.alt = img ? img.alt : '';
        lightbox.classList.add('is-open');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initExpanders();
    initImages();
  });
})();
