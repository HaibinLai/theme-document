(function () {
    let renderIndex = 0;
    let activeTheme = '';

    function getMermaidTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'default';
    }

    function prepareCodeBlocks() {
        document.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid').forEach(function (code) {
            const pre = code.closest('pre');
            if (!pre || pre.dataset.mermaidConverted === 'true') {
                return;
            }

            const block = document.createElement('div');
            block.className = 'mermaid';
            block.textContent = code.textContent.trim();
            block.dataset.mermaidConverted = 'true';
            pre.parentNode.replaceChild(block, pre);
        });

        document.querySelectorAll('pre.language-mermaid, pre.lang-mermaid').forEach(function (pre) {
            if (pre.dataset.mermaidConverted === 'true' || pre.querySelector('code')) {
                return;
            }

            const block = document.createElement('div');
            block.className = 'mermaid';
            block.textContent = pre.textContent.trim();
            block.dataset.mermaidConverted = 'true';
            pre.parentNode.replaceChild(block, pre);
        });
    }

    function initializeMermaid() {
        activeTheme = getMermaidTheme();
        mermaid.initialize({
            startOnLoad: false,
            theme: activeTheme,
            securityLevel: 'strict',
            fontFamily: 'inherit'
        });
    }

    function getSource(block) {
        if (!block.__mermaidSource) {
            block.__mermaidSource = block.textContent.trim();
        }
        return block.__mermaidSource;
    }

    function renderBlock(block) {
        const source = getSource(block);
        if (!source) {
            return Promise.resolve();
        }

        const id = 'document-mermaid-' + Date.now() + '-' + renderIndex++;
        block.removeAttribute('data-mermaid-error');
        block.classList.add('mermaid-loading');

        return mermaid.render(id, source)
            .then(function (result) {
                block.innerHTML = result.svg;
                block.classList.remove('mermaid-loading');
                if (result.bindFunctions) {
                    result.bindFunctions(block);
                }
            })
            .catch(function (error) {
                block.textContent = source;
                block.classList.remove('mermaid-loading');
                block.setAttribute('data-mermaid-error', 'true');
                block.setAttribute('title', error && error.message ? error.message : 'Mermaid render failed');
            });
    }

    function renderAll(force) {
        prepareCodeBlocks();

        if (typeof mermaid === 'undefined') {
            return;
        }

        const nextTheme = getMermaidTheme();
        if (force || activeTheme !== nextTheme) {
            initializeMermaid();
        }

        const blocks = Array.prototype.slice.call(document.querySelectorAll('.mermaid'));
        blocks.forEach(function (block) {
            const source = getSource(block);
            if (source) {
                block.textContent = source;
            }
        });

        Promise.all(blocks.map(renderBlock)).catch(function () {});
    }

    function observeTheme() {
        if (typeof MutationObserver === 'undefined') {
            return;
        }

        const observer = new MutationObserver(function () {
            const nextTheme = getMermaidTheme();
            if (nextTheme !== activeTheme) {
                renderAll(true);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    function start() {
        renderAll(true);
        observeTheme();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
