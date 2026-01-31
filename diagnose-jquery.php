<?php
/**
 * jQuery 冲突诊断工具
 * 
 * 使用方法：
 * 1. 将此文件放到主题根目录
 * 2. 访问：你的网站地址/wp-content/themes/theme-document/diagnose-jquery.php
 * 3. 查看输出结果，找到引入 jQuery 1.6.2 的来源
 * 
 * 注意：诊断完成后请删除此文件，避免安全风险
 */

// 防止直接访问（可选，如果需要 WordPress 环境）
// if (!defined('ABSPATH')) {
//     die('Direct access not allowed');
// }

?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jQuery 冲突诊断工具</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 1200px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #0073aa;
            padding-bottom: 10px;
        }
        h2 {
            color: #0073aa;
            margin-top: 30px;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
        }
        .success {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
        }
        .info {
            background: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 20px 0;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #0073aa;
        }
        .script-item {
            background: #f8f9fa;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 3px solid #0073aa;
        }
        .script-item.suspicious {
            border-left-color: #dc3545;
            background: #fff5f5;
        }
        .version-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .version-old {
            background: #dc3545;
            color: white;
        }
        .version-new {
            background: #28a745;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 jQuery 冲突诊断工具</h1>
        
        <div class="warning">
            <strong>⚠️ 重要提示：</strong>诊断完成后，请务必删除此文件（<code>diagnose-jquery.php</code>），避免安全风险。
        </div>

        <h2>1. 检查已加载的脚本</h2>
        <div id="scripts-list">
            <p>正在扫描页面中加载的脚本...</p>
        </div>

        <h2>2. jQuery 版本检测</h2>
        <div id="jquery-version">
            <p>正在检测 jQuery 版本...</p>
        </div>

        <h2>3. 可疑脚本来源</h2>
        <div id="suspicious-scripts">
            <p>正在分析可疑脚本...</p>
        </div>

        <h2>4. 修复建议</h2>
        <div class="info">
            <h3>如果发现 jQuery 1.6.2：</h3>
            <ol>
                <li><strong>检查插件：</strong>在 WordPress 后台 → 插件，逐个禁用插件，刷新页面查看是否还有 jQuery 1.6.2</li>
                <li><strong>检查主题：</strong>搜索主题文件中是否有 <code>jquery-1.6.2</code> 或 <code>jquery.*1\.6</code></li>
                <li><strong>检查 functions.php：</strong>确保使用 <code>wp_enqueue_script('jquery')</code> 而不是手动引入</li>
                <li><strong>使用 WordPress 钩子：</strong>如果必须移除某个脚本，可以使用：
                    <pre>function remove_old_jquery() {
    wp_deregister_script('jquery');
    wp_deregister_script('jquery-core');
    // 然后重新注册正确的版本
}
add_action('wp_enqueue_scripts', 'remove_old_jquery', 1);</pre>
                </li>
            </ol>
        </div>
    </div>

    <script>
        // 检测所有已加载的脚本
        function scanScripts() {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            const scriptsList = document.getElementById('scripts-list');
            let html = '';
            let suspiciousCount = 0;

            scripts.forEach((script, index) => {
                const src = script.src;
                const isJQuery = /jquery/i.test(src);
                const isOldJQuery = /jquery.*1\.(6|5|4|3|2|1)/i.test(src) || /jquery.*1\.6\.2/i.test(src);
                const isSuspicious = isOldJQuery;
                
                if (isSuspicious) suspiciousCount++;

                html += `<div class="script-item ${isSuspicious ? 'suspicious' : ''}">
                    <strong>脚本 #${index + 1}</strong>
                    ${isSuspicious ? '<span class="version-badge version-old">⚠️ 可疑</span>' : ''}
                    ${isJQuery ? '<span class="version-badge version-new">jQuery</span>' : ''}
                    <br>
                    <code>${src}</code>
                    ${script.id ? `<br><small>ID: ${script.id}</small>` : ''}
                    ${script.getAttribute('data-handle') ? `<br><small>Handle: ${script.getAttribute('data-handle')}</small>` : ''}
                </div>`;
            });

            if (scripts.length === 0) {
                html = '<div class="warning">未找到外部脚本标签（可能是通过 wp_enqueue_script 动态加载的）</div>';
            }

            scriptsList.innerHTML = html;

            if (suspiciousCount > 0) {
                scriptsList.innerHTML += `<div class="error">
                    <strong>⚠️ 发现 ${suspiciousCount} 个可疑的旧版 jQuery 脚本！</strong>
                </div>`;
            }
        }

        // 检测 jQuery 版本
        function checkJQueryVersion() {
            const versionDiv = document.getElementById('jquery-version');
            
            if (typeof jQuery === 'undefined') {
                versionDiv.innerHTML = '<div class="error">❌ 未检测到 jQuery</div>';
                return;
            }

            const version = jQuery.fn.jquery || '未知版本';
            const isOld = parseFloat(version) < 1.7;
            
            let html = '';
            if (isOld) {
                html = `<div class="error">
                    <strong>❌ 检测到旧版 jQuery：${version}</strong><br>
                    jQuery 的 <code>.on()</code> 方法需要 1.7+ 版本，当前版本可能导致功能异常。
                </div>`;
            } else {
                html = `<div class="success">
                    <strong>✅ 检测到 jQuery 版本：${version}</strong><br>
                    版本符合要求（≥ 1.7）。
                </div>`;
            }

            // 检查是否有多个 jQuery 实例
            if (typeof $ !== 'undefined' && $ !== jQuery) {
                html += '<div class="warning">⚠️ 检测到 $ 和 jQuery 不一致，可能存在冲突</div>';
            }

            versionDiv.innerHTML = html;
        }

        // 分析可疑脚本
        function analyzeSuspicious() {
            const suspiciousDiv = document.getElementById('suspicious-scripts');
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            const suspicious = scripts.filter(s => /jquery.*1\.(6|5|4|3|2|1)/i.test(s.src) || /jquery.*1\.6\.2/i.test(s.src));

            if (suspicious.length === 0) {
                suspiciousDiv.innerHTML = '<div class="success">✅ 未发现明显可疑的旧版 jQuery 脚本</div>';
                return;
            }

            let html = '<div class="error"><strong>发现可疑脚本：</strong><ul>';
            suspicious.forEach(script => {
                html += `<li><code>${script.src}</code></li>`;
            });
            html += '</ul></div>';

            html += '<div class="info"><strong>定位方法：</strong><ol>';
            html += '<li>打开浏览器开发者工具（F12）</li>';
            html += '<li>切换到 Network（网络）标签</li>';
            html += '<li>刷新页面</li>';
            html += '<li>搜索 "jquery-1.6.2"</li>';
            html += '<li>点击该请求，查看 "Initiator"（发起者）列，找到是哪个文件加载的</li>';
            html += '</ol></div>';

            suspiciousDiv.innerHTML = html;
        }

        // 页面加载完成后执行检测
        window.addEventListener('load', function() {
            setTimeout(() => {
                scanScripts();
                checkJQueryVersion();
                analyzeSuspicious();
            }, 1000);
        });
    </script>
</body>
</html>
