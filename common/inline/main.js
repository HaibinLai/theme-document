/*
* 切换主题皮肤
* */
function toggleTheme(flag = true, persist = true) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (flag) {
        $('html')
            .addClass('dark')
            .removeClass('personal');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#141414');
        if (persist) localStorage.setItem('night', '1');
        $(function () {
            $('.read-mode i')
                .removeClass("icon-baitian-qing")
                .addClass("icon-yueliang");
        });
    } else {
        $('html')
            .removeClass('dark')
            .addClass('personal');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
        if (persist) localStorage.setItem('night', '0');
        $(function () {
            $('.read-mode i')
                .removeClass("icon-yueliang")
                .addClass("icon-baitian-qing");
        });
    }
    scheduleReaderModeCleanup();
}

/*
* 清理部分公式插件在主题切换后重复渲染的 KaTeX 节点
* */
function normalizeKatexText(node) {
    return (node.textContent || '').replace(/\s+/g, ' ').trim();
}

function removeAdjacentDuplicateKatex(selector, skip) {
    $(selector).each(function () {
        if (skip && skip(this)) {
            return;
        }

        let current = $(this);
        let next = current.next();
        let currentText = normalizeKatexText(this);

        while (next.length > 0 && next.is(selector)) {
            if (currentText && currentText === normalizeKatexText(next.get(0))) {
                let duplicate = next;
                next = next.next();
                duplicate.remove();
            } else {
                break;
            }
        }
    });
}

function cleanupDuplicateKatex() {
    removeAdjacentDuplicateKatex('.main-article .katex-display');
    removeAdjacentDuplicateKatex('.main-article .katex', function (node) {
        return $(node).closest('.katex-display').length > 0;
    });
}

const leadingLikeWidgetSelector = [
    '.wpulike',
    '.wp-ulike',
    '.wp_ulike_general_class',
    '.likebtn_container',
    '.likebtn-wrapper',
    '.super-like',
    '.superlike',
    '.post-like',
    '.post-like-wrap',
    '.zilla-likes',
    '.wp-like-button',
    '.simplefavorite-button'
].join(',');

function hasLeadingLikeWidgetSignature(node) {
    if (!node || node.nodeType !== 1) {
        return false;
    }

    let className = node.getAttribute('class') || '';
    if (/(^|[\s_-])(wpulike|wp-ulike|wp_ulike|likebtn|superlike|super-like|post-like|zilla-likes|simplefavorite)([\s_-]|$)/i.test(className)) {
        return true;
    }

    return node.matches(leadingLikeWidgetSelector) || node.querySelector(leadingLikeWidgetSelector);
}

function hideLeadingLikeWidgets() {
    let article = document.querySelector('.main-article');
    if (!article) {
        return;
    }

    let checked = 0;
    Array.prototype.some.call(article.children, function (node) {
        if (checked >= 4) {
            return true;
        }
        if (node.matches('script, style')) {
            return false;
        }

        checked++;
        if (hasLeadingLikeWidgetSignature(node)) {
            node.style.display = 'none';
        }
        return false;
    });
}

function cleanupReaderModeArtifacts() {
    cleanupDuplicateKatex();
    hideLeadingLikeWidgets();
}

function scheduleReaderModeCleanup() {
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(cleanupReaderModeArtifacts);
    } else {
        setTimeout(cleanupReaderModeArtifacts, 0);
    }
    setTimeout(cleanupReaderModeArtifacts, 250);
    setTimeout(cleanupReaderModeArtifacts, 800);
}

$(function () {
    scheduleReaderModeCleanup();

    let article = document.querySelector('.main-article');
    if (!article || typeof MutationObserver === 'undefined') {
        return;
    }

    let timer = null;
    let observer = new MutationObserver(function (mutations) {
        let hasKatexChange = mutations.some(function (mutation) {
            return Array.prototype.some.call(mutation.addedNodes, function (node) {
                if (node.nodeType !== 1) {
                    return false;
                }
                return node.classList.contains('katex') ||
                    node.classList.contains('katex-display') ||
                    node.querySelector('.katex, .katex-display') ||
                    hasLeadingLikeWidgetSignature(node);
            });
        });

        if (!hasKatexChange) {
            return;
        }

        clearTimeout(timer);
        timer = setTimeout(cleanupReaderModeArtifacts, 50);
    });

    observer.observe(article, {childList: true, subtree: true});
});


/*
* 动态rem
* */
let l = () => {
    let r = document.documentElement, o = r.offsetWidth / 100;
    o < 17 && (o = 17), o > 18 && (o = 18), r.style.fontSize = o + "px", window.rem = o
};
window.onresize = l;
l();

/*同步主题*/
let theme = localStorage.getItem('theme-color');
if (!!theme) {
    $('html').addClass(theme)
}
/*同步阅读模式 */
let night = localStorage.getItem('night');
let prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (night === '1' || (night === null && prefersDark)) {
    if (!$('html').hasClass('dark')) {
        toggleTheme(true, false);
    } else {
        $(function () {
            $('.read-mode i')
                .removeClass("icon-baitian-qing")
                .addClass("icon-yueliang");
        });
    }
}

/* 监听系统暗色偏好变化 */
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        var n = localStorage.getItem('night');
        if (n === null) {
            toggleTheme(e.matches, false);
        }
    });
}

/*
* 获取元素在网页的实际top
* */
$.fn.getTop = function () {
    let position = this.position();
    /*
    * 为0代表有很多offsetTop要计算
    * */
    if (position.top !== 0) {
        return position.top;
    } else {
        let html = $('html').get(0);
        return this.get(0).getBoundingClientRect().top + html.scrollTop;
    }
}


/*jq内存清理函数*/
$.fn.removeWithLeakage = function () {
    this.each(function (i, e) {
        $("*", e).add([e]).each(function () {
            $.event.remove(this);
            $.removeData(this);
        });
        if (e.parentNode)
            e.parentNode.removeChild(e);
    });
};
