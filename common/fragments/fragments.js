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

  function initExpanders(root) {
    root.querySelectorAll('.fragment-content-wrap:not([data-fragment-ready])').forEach(function (wrap) {
      var content = wrap.querySelector('.fragment-content');
      var button = wrap.querySelector('.fragment-expand');
      wrap.dataset.fragmentReady = 'true';

      if (!content || !button || content.scrollHeight <= content.clientHeight + 2) {
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

  function initImages(root, lightbox) {
    var lightboxImage = lightbox.querySelector('img');

    root.querySelectorAll('.fragment-thumb:not([data-fragment-ready])').forEach(function (button) {
      button.dataset.fragmentReady = 'true';
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

  function initialiseItems(root, lightbox) {
    initExpanders(root);
    initImages(root, lightbox);
  }

  function setLoaderState(loader, state) {
    loader.dataset.state = state;
    loader.textContent = state === 'loading' ? 'Loading...' : state === 'complete' ? 'No more fragments.' : '';
  }

  function discardOldItems(list) {
    var maxItems = Number(list.dataset.windowSize || 20);
    var items = Array.prototype.slice.call(list.querySelectorAll('.fragment-item'));
    var removedHeight = 0;

    while (items.length > maxItems) {
      var item = items.shift();
      var month = item.previousElementSibling;
      var removeMonth = false;

      removedHeight += item.getBoundingClientRect().height;
      item.remove();

      if (month && month.classList.contains('fragment-month')) {
        var next = month.nextElementSibling;
        removeMonth = !next || next.classList.contains('fragment-month') || next.classList.contains('fragment-loader');
      }

      if (removeMonth) {
        removedHeight += month.getBoundingClientRect().height;
        month.remove();
      }
    }

    if (removedHeight > 0) {
      window.scrollBy(0, -removedHeight);
    }
  }

  function appendBatch(list, html, lightbox) {
    var loader = list.querySelector('.fragment-loader');
    var template = document.createElement('template');
    template.innerHTML = html;
    list.insertBefore(template.content, loader);
    initialiseItems(list, lightbox);
    discardOldItems(list);
  }

  function initInfiniteScroll(list, lightbox) {
    var loader = list.querySelector('.fragment-loader');
    var loading = false;
    var observer;

    function loadNextPage() {
      if (loading || list.dataset.hasMore !== '1') {
        return;
      }

      loading = true;
      setLoaderState(loader, 'loading');

      var payload = new URLSearchParams({
        action: 'nicen_theme_load_fragments',
        nonce: list.dataset.nonce,
        category: list.dataset.category,
        tag: list.dataset.tag,
        posts_per_page: list.dataset.perPage,
        page: list.dataset.nextPage,
        previous_month: list.dataset.lastMonth
      });

      fetch(list.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: payload.toString(),
        credentials: 'same-origin'
      })
        .then(function (response) { return response.json(); })
        .then(function (response) {
          if (!response.success) {
            throw new Error('Fragment request failed');
          }

          var data = response.data;
          appendBatch(list, data.html, lightbox);
          list.dataset.nextPage = data.next_page;
          list.dataset.lastMonth = data.last_month;
          list.dataset.hasMore = data.has_more ? '1' : '0';
          setLoaderState(loader, data.has_more ? 'idle' : 'complete');
        })
        .catch(function () {
          setLoaderState(loader, 'error');
          loader.textContent = 'Could not load more fragments.';
        })
        .finally(function () {
          loading = false;
        });
    }

    if (list.dataset.hasMore !== '1') {
      setLoaderState(loader, 'complete');
      return;
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          loadNextPage();
        }
      }, { rootMargin: '480px 0px' });

      observer.observe(loader);
      return;
    }

    window.addEventListener('scroll', function () {
      if (loader.getBoundingClientRect().top - window.innerHeight < 480) {
        loadNextPage();
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var list = document.querySelector('.fragments-list');
    var lightbox = ensureLightbox();

    if (!list) {
      return;
    }

    initialiseItems(list, lightbox);
    initInfiniteScroll(list, lightbox);
  });
})();
