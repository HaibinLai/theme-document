(function (root) {
    'use strict';

    function trimFormulaLines(lines) {
        var result = lines.slice();

        while (result.length && result[0].trim() === '') {
            result.shift();
        }
        while (result.length && result[result.length - 1].trim() === '') {
            result.pop();
        }

        return result.map(function (line) {
            return line.replace(/[ \t]+$/, '');
        });
    }

    function looksLikeFormula(lines) {
        var value = lines.join('\n').trim();

        if (!value || value.length > 10000) {
            return false;
        }

        return /\\[A-Za-z]+|[_^{}=]|\d\s*(?:[+*/-]|\\times|\\cdot)\s*\d/.test(value);
    }

    function katexBlock(lines) {
        return ['```katex'].concat(trimFormulaLines(lines), ['```']);
    }

    function isFence(line) {
        var match = line.match(/^\s*(`{3,}|~{3,})/);
        return match ? match[1].charAt(0) : '';
    }

    function convertMarkdown(source) {
        var newline = source.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        var lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        var output = [];
        var stats = { dollarBlocks: 0, bracketBlocks: 0, singleLineBlocks: 0 };
        var fence = '';
        var index = 0;

        while (index < lines.length) {
            var line = lines[index];
            var fenceMarker = isFence(line);

            if (fenceMarker) {
                if (!fence) {
                    fence = fenceMarker;
                } else if (fence === fenceMarker) {
                    fence = '';
                }
                output.push(line);
                index += 1;
                continue;
            }

            if (fence) {
                output.push(line);
                index += 1;
                continue;
            }

            if (/^\s*\$\$\s*$/.test(line)) {
                var dollarEnd = index + 1;
                while (dollarEnd < lines.length && !/^\s*\$\$\s*$/.test(lines[dollarEnd])) {
                    dollarEnd += 1;
                }

                if (dollarEnd < lines.length) {
                    output = output.concat(katexBlock(lines.slice(index + 1, dollarEnd)));
                    stats.dollarBlocks += 1;
                    index = dollarEnd + 1;
                    continue;
                }
            }

            var singleLine = line.match(/^\s*\$\$\s*(.+?)\s*\$\$\s*$/);
            if (singleLine) {
                output = output.concat(katexBlock([singleLine[1]]));
                stats.singleLineBlocks += 1;
                index += 1;
                continue;
            }

            if (/^\s*(?:\\?\[)\s*$/.test(line)) {
                var bracketEnd = index + 1;
                while (bracketEnd < lines.length && !/^\s*(?:\\?\])\s*$/.test(lines[bracketEnd])) {
                    bracketEnd += 1;
                }

                var bracketLines = lines.slice(index + 1, bracketEnd);
                if (bracketEnd < lines.length && looksLikeFormula(bracketLines)) {
                    output = output.concat(katexBlock(bracketLines));
                    stats.bracketBlocks += 1;
                    index = bracketEnd + 1;
                    continue;
                }
            }

            output.push(line);
            index += 1;
        }

        return {
            content: output.join(newline),
            stats: stats
        };
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { convertMarkdown: convertMarkdown };
    }

    if (!root.document) {
        return;
    }

    function initialize() {
        var source = root.document.getElementById('document-math-source');
        var result = root.document.getElementById('document-math-result');
        var convert = root.document.getElementById('document-math-convert');
        var copy = root.document.getElementById('document-math-copy');
        var clear = root.document.getElementById('document-math-clear');
        var status = root.document.getElementById('document-math-status');

        if (!source || !result || !convert || !copy || !clear || !status) {
            return;
        }

        convert.addEventListener('click', function () {
            var converted = convertMarkdown(source.value);
            var total = converted.stats.dollarBlocks + converted.stats.bracketBlocks + converted.stats.singleLineBlocks;

            result.value = converted.content;
            copy.disabled = !result.value;
            status.textContent = total ? '已转换 ' + total + ' 处公式' : '未找到可转换的公式块';
        });

        copy.addEventListener('click', function () {
            var finish = function () {
                status.textContent = '已复制转换结果';
            };
            var fallbackCopy = function () {
                result.removeAttribute('readonly');
                result.select();
                root.document.execCommand('copy');
                result.setAttribute('readonly', 'readonly');
                finish();
            };

            if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
                root.navigator.clipboard.writeText(result.value).then(finish).catch(fallbackCopy);
            } else {
                fallbackCopy();
            }
        });

        clear.addEventListener('click', function () {
            source.value = '';
            result.value = '';
            copy.disabled = true;
            status.textContent = '';
            source.focus();
        });
    }

    root.document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
