(function () {
    'use strict';

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    function showCopied(button) {
        var section = button.closest('.article-citation');
        var status = section ? section.querySelector('.citation-copy-status') : null;
        var icon = button.querySelector('i');

        button.classList.add('copied');
        button.title = '已复制';
        if (icon) {
            icon.className = 'iconfont icon-chenggong';
        }
        if (status) {
            status.textContent = '已复制引用信息';
        }

        window.setTimeout(function () {
            button.classList.remove('copied');
            button.title = button.getAttribute('aria-label');
            if (icon) {
                icon.className = 'iconfont icon-fuzhi';
            }
            if (status) {
                status.textContent = '';
            }
        }, 1600);
    }

    document.addEventListener('click', function (event) {
        var button = event.target.closest('.citation-copy');
        if (!button) {
            return;
        }

        var text = button.getAttribute('data-citation-copy') || '';
        var copy = navigator.clipboard && navigator.clipboard.writeText
            ? navigator.clipboard.writeText(text)
            : Promise.resolve(fallbackCopy(text));

        copy.then(function () {
            showCopied(button);
        }).catch(function () {
            fallbackCopy(text);
            showCopied(button);
        });
    });
}());
