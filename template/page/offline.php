<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>离线 - 页面暂不可用</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; background: #f5f7fd; color: #333;
            text-align: center; padding: 2rem;
        }
        .offline-icon {
            width: 120px; height: 120px; margin: 0 auto 2rem;
            opacity: 0.6;
        }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600; }
        p { color: #666; margin-bottom: 2rem; line-height: 1.6; }
        .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn {
            display: inline-block; padding: 0.6rem 1.5rem;
            border-radius: 4px; text-decoration: none;
            font-size: 0.9rem; cursor: pointer; border: none;
        }
        .btn-primary { background: #3eaf7c; color: #fff; }
        .btn-secondary { background: #e8e8e8; color: #333; }
        .btn:hover { opacity: 0.85; }
        @media (prefers-color-scheme: dark) {
            body { background: #1a1a1a; color: rgba(255,255,255,0.87); }
            p { color: rgba(255,255,255,0.6); }
            .btn-secondary { background: #333; color: rgba(255,255,255,0.87); }
        }
    </style>
</head>
<body>
<div>
    <svg class="offline-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="55" stroke="currentColor" stroke-width="3" opacity="0.3"/>
        <path d="M30 65 C30 45, 45 30, 60 30 C75 30, 90 45, 90 65" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
        <path d="M40 72 C40 58, 50 45, 60 45 C70 45, 80 58, 80 72" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <path d="M50 79 C50 71, 55 63, 60 63 C65 63, 70 71, 70 79" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <circle cx="60" cy="85" r="4" fill="currentColor" opacity="0.7"/>
        <line x1="25" y1="95" x2="95" y2="25" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    </svg>
    <h1>您当前处于离线状态</h1>
    <p>该页面尚未被缓存，请连接网络后重试。<br>已访问过的页面可以离线浏览。</p>
    <div class="actions">
        <a href="/" class="btn btn-primary">返回首页</a>
        <button class="btn btn-secondary" onclick="location.reload()">重试</button>
    </div>
</div>
</body>
</html>
