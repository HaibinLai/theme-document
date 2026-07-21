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

    function normalizeChatFormula(lines) {
        return trimFormulaLines(lines).map(function (line) {
            var normalized = line.replace(/\\\\(?=[A-Za-z]+)/g, '\\');

            normalized = normalized.replace(/\*(\\(?:sum|prod|bigcup|bigcap|lim|max|min))\*\s*\{/g, '$1_{');
            normalized = normalized.replace(/\*(\\[A-Za-z]+)\*/g, '$1');
            normalized = normalized.replace(/([A-Za-z])\*([^*\n]*?)([|}\]]+)\*/g, '$1_$2$3');
            normalized = normalized.replace(/([A-Za-z])\*([A-Za-z0-9]+)\*/g, '$1_$2');

            return normalized;
        });
    }

    function bracketMarker(line) {
        var marker = line.trim();

        marker = marker.replace(/^#{1,6}[ \t]+/, '').trim();
        var emphasized = marker.match(/^(?:\*\*|__)(.*)(?:\*\*|__)$/);

        if (emphasized) {
            marker = emphasized[1].trim();
        }

        if (marker === '[' || marker === '\\[') {
            return 'open';
        }
        if (marker === ']' || marker === '\\]') {
            return 'close';
        }

        return '';
    }

    function isWholeTableCell(content, start, end) {
        var before = content.slice(0, start).replace(/\s+$/, '');
        var after = content.slice(end + 1).replace(/^\s+/, '');

        return before.charAt(before.length - 1) === '|' && (after === '' || after.charAt(0) === '|');
    }

    function looksLikeInlineFormula(inner, content, start, end) {
        var value = inner.trim();

        if (/\\[A-Za-z]+|[_^{}]/.test(value)) {
            return true;
        }

        return isWholeTableCell(content, start, end) && /^\d+(?:\s*,\s*\d+)*$/.test(value);
    }

    function convertInlineMath(line) {
        var protectedCode = [];
        var count = 0;
        var content = line.replace(/`+[^`]*`+/g, function (code) {
            var placeholder = '\u0000CODE' + protectedCode.length + '\u0000';
            protectedCode.push(code);
            return placeholder;
        });

        content = content.replace(/\\\((.*?)\\\)/g, function (match, formula) {
            var placeholder = '\u0000CODE' + protectedCode.length + '\u0000';
            count += 1;
            protectedCode.push('`$$ ' + formula.trim() + ' $$`');
            return placeholder;
        });

        var output = '';
        var cursor = 0;

        while (cursor < content.length) {
            var start = content.indexOf('(', cursor);
            if (start === -1 || (start > 0 && content[start - 1] === '\\')) {
                output += content.slice(cursor);
                break;
            }

            output += content.slice(cursor, start);
            var depth = 0;
            var end = start;

            for (; end < content.length; end += 1) {
                if (content[end] === '(' && (end === 0 || content[end - 1] !== '\\')) {
                    depth += 1;
                } else if (content[end] === ')' && (end === 0 || content[end - 1] !== '\\')) {
                    depth -= 1;
                    if (depth === 0) {
                        break;
                    }
                }
            }

            if (depth !== 0) {
                output += content.slice(start);
                cursor = content.length;
                break;
            }

            var inner = content.slice(start + 1, end);
            if (looksLikeInlineFormula(inner, content, start, end)) {
                output += '`$$ ' + inner.trim() + ' $$`';
                count += 1;
            } else {
                output += content.slice(start, end + 1);
            }
            cursor = end + 1;
        }

        output = output.replace(/\u0000CODE(\d+)\u0000/g, function (match, codeIndex) {
            return protectedCode[Number(codeIndex)];
        });

        return { content: output, count: count };
    }

    function isFence(line) {
        var match = line.match(/^\s*(`{3,}|~{3,})/);
        return match ? match[1].charAt(0) : '';
    }

    function convertMarkdown(source) {
        var newline = source.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
        var lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        var output = [];
        var stats = { dollarBlocks: 0, bracketBlocks: 0, singleLineBlocks: 0, inlineExpressions: 0 };
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

            if (bracketMarker(line) === 'open') {
                var bracketEnd = index + 1;
                while (bracketEnd < lines.length && bracketMarker(lines[bracketEnd]) !== 'close') {
                    bracketEnd += 1;
                }

                var bracketLines = lines.slice(index + 1, bracketEnd);
                if (bracketEnd < lines.length && looksLikeFormula(bracketLines)) {
                    output = output.concat(katexBlock(normalizeChatFormula(bracketLines)));
                    stats.bracketBlocks += 1;
                    index = bracketEnd + 1;
                    continue;
                }
            }

            var inline = convertInlineMath(line);
            output.push(inline.content);
            stats.inlineExpressions += inline.count;
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
            var total = converted.stats.dollarBlocks + converted.stats.bracketBlocks + converted.stats.singleLineBlocks + converted.stats.inlineExpressions;

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
