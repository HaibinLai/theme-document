(function () {
    'use strict';

    var pyodide = null;
    var pyodideLoading = false;
    var pyodideReadyCallbacks = [];

    var PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

    function init() {
        var blocks = document.querySelectorAll('.runcode-block');
        for (var i = 0; i < blocks.length; i++) {
            bindBlock(blocks[i]);
        }
    }

    function bindBlock(block) {
        var runBtn = block.querySelector('.runcode-run');
        var clearBtn = block.querySelector('.runcode-clear');
        var editor = block.querySelector('.runcode-editor');

        runBtn.addEventListener('click', function () {
            runCode(block);
        });

        clearBtn.addEventListener('click', function () {
            clearOutput(block);
        });

        editor.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                runCode(block);
            }
        });

        autoResize(editor);
        editor.addEventListener('input', function () {
            autoResize(this);
        });
    }

    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
    }

    function runCode(block) {
        var lang = block.dataset.lang;
        var code = block.querySelector('.runcode-editor').value;

        if (!code.trim()) {
            showOutput(block, '(no code to run)', false);
            return;
        }

        var runBtn = block.querySelector('.runcode-run');
        runBtn.disabled = true;
        runBtn.textContent = '\u23F3 Running...';

        if (lang === 'python') {
            runPython(block, code, function () {
                runBtn.disabled = false;
                runBtn.innerHTML = '&#9654; Run';
            });
        } else if (lang === 'javascript' || lang === 'js') {
            runJavaScript(block, code);
            runBtn.disabled = false;
            runBtn.innerHTML = '&#9654; Run';
        } else if (lang === 'html') {
            runHTML(block, code);
            runBtn.disabled = false;
            runBtn.innerHTML = '&#9654; Run';
        }
    }

    function runPython(block, code, done) {
        if (pyodide) {
            executePython(block, code);
            done();
            return;
        }

        if (pyodideLoading) {
            showOutput(block, '\u23F3 Pyodide is loading, please wait...', false);
            pyodideReadyCallbacks.push(function () {
                executePython(block, code);
                done();
            });
            return;
        }

        pyodideLoading = true;
        showOutput(block, '\u23F3 Loading Python runtime (~11MB, first time only)...', false);

        var script = document.createElement('script');
        script.src = PYODIDE_CDN + 'pyodide.js';
        script.onload = function () {
            window.loadPyodide({ indexURL: PYODIDE_CDN }).then(function (py) {
                pyodide = py;
                pyodideLoading = false;
                executePython(block, code);
                done();

                while (pyodideReadyCallbacks.length) {
                    pyodideReadyCallbacks.shift()();
                }
            }).catch(function (err) {
                pyodideLoading = false;
                showOutput(block, 'Failed to load Pyodide: ' + err.message, true);
                done();
            });
        };
        script.onerror = function () {
            pyodideLoading = false;
            showOutput(block, 'Failed to load Pyodide script from CDN.', true);
            done();
        };
        document.head.appendChild(script);
    }

    function executePython(block, code) {
        try {
            pyodide.runPython(
                'import sys\n' +
                'from io import StringIO\n' +
                'sys.stdout = StringIO()\n' +
                'sys.stderr = StringIO()'
            );

            var result = pyodide.runPython(code);

            var stdout = pyodide.runPython('sys.stdout.getvalue()');
            var stderr = pyodide.runPython('sys.stderr.getvalue()');

            pyodide.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');

            var output = '';
            if (stdout) output += stdout;
            if (stderr) {
                showOutput(block, (output ? output + '\n' : '') + stderr, true);
                return;
            }
            if (result !== undefined && result !== null && String(result) !== 'None') {
                if (output) output += '\n';
                output += String(result);
            }
            showOutput(block, output || '(no output)', false);
        } catch (err) {
            try {
                pyodide.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');
            } catch (e) { /* ignore */ }
            showOutput(block, err.message || String(err), true);
        }
    }

    function runJavaScript(block, code) {
        var old = block.querySelector('.runcode-sandbox');
        if (old) old.remove();

        var iframe = document.createElement('iframe');
        iframe.className = 'runcode-sandbox';
        iframe.sandbox = 'allow-scripts';
        iframe.style.display = 'none';
        block.appendChild(iframe);

        var iframeCode = '<!DOCTYPE html><html><body><script>' +
            'var __output = [];\n' +
            'var __hasError = false;\n' +
            'console.log = function() {\n' +
            '  var args = Array.prototype.slice.call(arguments);\n' +
            '  __output.push(args.map(function(a) {\n' +
            '    if (typeof a === "object") try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }\n' +
            '    return String(a);\n' +
            '  }).join(" "));\n' +
            '};\n' +
            'console.error = function() {\n' +
            '  __hasError = true;\n' +
            '  var args = Array.prototype.slice.call(arguments);\n' +
            '  __output.push("[Error] " + args.join(" "));\n' +
            '};\n' +
            'console.warn = function() {\n' +
            '  var args = Array.prototype.slice.call(arguments);\n' +
            '  __output.push("[Warn] " + args.join(" "));\n' +
            '};\n' +
            'try {\n' +
            '  var __result = eval(' + JSON.stringify(code) + ');\n' +
            '  if (__result !== undefined) __output.push(String(__result));\n' +
            '} catch(e) {\n' +
            '  __hasError = true;\n' +
            '  __output.push(e.toString());\n' +
            '}\n' +
            'parent.postMessage({ type: "runcode-result", output: __output.join("\\n"), error: __hasError }, "*");\n' +
            '<\/script></body></html>';

        var handler = function (e) {
            if (e.data && e.data.type === 'runcode-result') {
                window.removeEventListener('message', handler);
                showOutput(block, e.data.output || '(no output)', e.data.error);
                iframe.remove();
            }
        };
        window.addEventListener('message', handler);

        iframe.srcdoc = iframeCode;

        setTimeout(function () {
            window.removeEventListener('message', handler);
            if (block.querySelector('.runcode-sandbox')) {
                block.querySelector('.runcode-sandbox').remove();
                showOutput(block, 'Execution timed out (5s limit)', true);
            }
        }, 5000);
    }

    function runHTML(block, code) {
        var outputDiv = block.querySelector('.runcode-output');
        var outputPre = block.querySelector('.runcode-output-content');

        var old = outputDiv.querySelector('.runcode-preview');
        if (old) old.remove();

        outputDiv.style.display = 'block';
        outputPre.style.display = 'none';

        var iframe = document.createElement('iframe');
        iframe.className = 'runcode-preview';
        iframe.sandbox = 'allow-scripts';
        iframe.srcdoc = code;
        outputDiv.appendChild(iframe);
    }

    function showOutput(block, text, isError) {
        var outputDiv = block.querySelector('.runcode-output');
        var outputPre = block.querySelector('.runcode-output-content');

        var preview = outputDiv.querySelector('.runcode-preview');
        if (preview) preview.remove();

        outputPre.style.display = 'block';
        outputDiv.style.display = 'block';
        outputPre.textContent = text;

        if (isError) {
            outputPre.classList.add('runcode-error');
        } else {
            outputPre.classList.remove('runcode-error');
        }
    }

    function clearOutput(block) {
        var outputDiv = block.querySelector('.runcode-output');
        var outputPre = block.querySelector('.runcode-output-content');

        var preview = outputDiv.querySelector('.runcode-preview');
        if (preview) preview.remove();

        outputPre.textContent = '';
        outputPre.classList.remove('runcode-error');
        outputPre.style.display = 'block';
        outputDiv.style.display = 'none';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
