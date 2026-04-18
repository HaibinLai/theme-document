<?php
/**
 * Doom FPS - Page Template
 * Template Name: Doom FPS
 * @author Haibin
 * @date 2026-04-18
 */

get_header();
?>

<main class="main-container no-sidebar">
    <div class="main-main">
        <article class="main-content doom-page-wrapper">
            <div class="doom-container">

                <!-- Game Area -->
                <div class="doom-game">
                    <canvas id="doom-canvas" width="960" height="540"></canvas>

                    <!-- Start overlay -->
                    <div class="doom-overlay" id="doom-start-overlay">
                        <h2>DOOM FPS</h2>
                        <p class="doom-subtitle">Navigate the maze. Kill enemies. Find the exit.</p>
                        <input type="text" id="doom-name-input" placeholder="Enter your name" maxlength="20" autocomplete="off">
                        <button class="doom-btn" id="doom-start-btn">START</button>
                        <p class="doom-subtitle" style="margin-top:20px;font-size:12px;">WASD move &bull; Mouse aim &bull; Click shoot &bull; Hold-click scope &bull; Q/1-6 weapons &bull; E door &bull; G grenade &bull; M minimap</p>
                    </div>

                    <!-- Game Over overlay -->
                    <div class="doom-overlay" id="doom-gameover-overlay" style="display:none;">
                        <h2>GAME OVER</h2>
                        <div class="doom-result-stats">
                            <span><span class="doom-stat-val" id="doom-go-score">0</span><span class="doom-stat-label">Score</span></span>
                            <span><span class="doom-stat-val" id="doom-go-kills">0</span><span class="doom-stat-label">Kills</span></span>
                            <span><span class="doom-stat-val" id="doom-go-time">0:00</span><span class="doom-stat-label">Time</span></span>
                        </div>
                        <div class="doom-rank-display" id="doom-rank"></div>
                        <button class="doom-btn" id="doom-replay-btn">PLAY AGAIN</button>
                    </div>

                    <!-- Win overlay -->
                    <div class="doom-overlay" id="doom-win-overlay" style="display:none;">
                        <h2 style="color:#4c4;">MISSION COMPLETE</h2>
                        <div class="doom-result-stats">
                            <span><span class="doom-stat-val" id="doom-win-score">0</span><span class="doom-stat-label">Score</span></span>
                            <span><span class="doom-stat-val" id="doom-win-kills">0</span><span class="doom-stat-label">Kills</span></span>
                            <span><span class="doom-stat-val" id="doom-win-time">0:00</span><span class="doom-stat-label">Time</span></span>
                        </div>
                        <div class="doom-rank-display" id="doom-rank2"></div>
                        <button class="doom-btn" id="doom-replay-btn2">PLAY AGAIN</button>
                    </div>

                    <div class="doom-controls-hint">Click canvas to lock mouse &bull; ESC to unlock</div>
                </div>

                <!-- Leaderboard -->
                <div class="doom-leaderboard">
                    <div class="doom-lb-header">
                        <h3>&#127942; Leaderboard</h3>
                        <div class="doom-lb-tabs">
                            <button class="doom-tab-btn active" data-type="alltime">All Time</button>
                            <button class="doom-tab-btn" data-type="weekly">This Week</button>
                        </div>
                    </div>
                    <div class="doom-lb-body" id="doom-lb-list">
                        <div class="doom-lb-empty">Loading...</div>
                    </div>
                </div>

                <!-- Technical Blog Article -->
                <div class="main-article doom-blog">
                    <div class="doom-blog-header">
                        <div>
                            <h1 id="doom-blog-title-zh">在浏览器里复刻 Doom：Canvas 2D Raycasting 全解析</h1>
                            <h1 id="doom-blog-title-en" style="display:none">Recreating Doom in the Browser: A Canvas 2D Raycasting Deep Dive</h1>
                            <div class="doom-blog-meta">Haibin &bull; 2026-04-18 &bull; <span id="doom-blog-cat-zh">游戏开发 / 图形学</span><span id="doom-blog-cat-en" style="display:none">Game Dev / Graphics</span></div>
                        </div>
                        <button class="doom-lang-btn" id="doom-lang-btn" onclick="(function(){var z=document.querySelectorAll('[id$=-zh]'),e=document.querySelectorAll('[id$=-en]'),b=document.getElementById('doom-lang-btn'),isZh=z[0].style.display!=='none';for(var i=0;i<z.length;i++)z[i].style.display=isZh?'none':'';for(var i=0;i<e.length;i++)e[i].style.display=isZh?'':'none';b.textContent=isZh?'中文':'EN'})()">EN</button>
                    </div>

                    <!-- Chinese Version -->
                    <div id="doom-blog-content-zh">

                    <h2 class="doom-section-title">&#127918; Doom 的故事</h2>

                    <p>1993 年，id Software 发布了一款彻底改变游戏行业的作品 ——《Doom》。在那个 CPU 主频只有 66 MHz、没有 GPU 的年代，John Carmack 用纯软件渲染实现了流畅的"伪 3D"画面，让全世界的玩家第一次体验到了第一人称射击（FPS）的魅力。</p>

                    <p>Doom 并不是真正的 3D 游戏。它的世界本质上是一张 2D 网格地图，通过一种叫做 <strong>Raycasting</strong>（光线投射）的算法，把 2D 的地图信息"投影"成看起来像 3D 的画面。这种技术后来被称为 <strong>2.5D</strong> —— 介于 2D 和 3D 之间。</p>

                    <blockquote>
                        <p>有一天我在博客里做完了贪吃蛇之后，突然想：能不能在浏览器里用 Canvas 2D 也复刻一个 Doom？于是就有了这个项目 —— 一个完全用 JavaScript + Canvas 2D 实现的 FPS 游戏，无需 WebGL，无需任何外部资源文件，所有的渲染、音效、物理全部程序化生成。</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128270; Raycasting：从 2D 地图到伪 3D 画面</h2>

                    <p>Raycasting 的核心思想非常优雅：<strong>对屏幕上的每一列像素，从玩家位置发射一条射线，找到它碰到的第一面墙，根据距离来决定这面墙在屏幕上画多高。</strong></p>

                    <p>想象你站在一个由方块组成的迷宫里。你的视野是 60 度，屏幕宽度是 960 像素。那么你就需要发射 960 条射线，均匀分布在这 60 度的扇形范围内：</p>

                    <pre><code>// 对每一列像素发射射线
for (var col = 0; col &lt; SCREEN_W; col++) {
    // 射线角度 = 玩家朝向 - 半FOV + 当前列的偏移
    var rayAngle = player.angle - HALF_FOV + (col / SCREEN_W) * FOV;
    // ... 用DDA算法找到墙壁
}</code></pre>

                    <h3>DDA 算法</h3>

                    <p><strong>DDA（Digital Differential Analyzer）</strong> 是 Raycasting 的核心。它不是沿射线一小步一小步地前进（那样太慢），而是沿网格线跳跃 —— 每一步精确地跳到下一条网格线，检查那个格子是不是墙：</p>

                    <pre><code>// DDA 核心：在X边界和Y边界之间交替前进
if (sideDistX &lt; sideDistY) {
    sideDistX += deltaDistX;  // 跳到下一条竖直网格线
    mapX += stepX;
    side = 0;  // 碰到的是东/西面的墙
} else {
    sideDistY += deltaDistY;  // 跳到下一条水平网格线
    mapY += stepY;
    side = 1;  // 碰到的是南/北面的墙
}</code></pre>

                    <p>这个算法的精妙之处在于：每次循环只需要一次比较和一次加法，不需要任何三角函数运算，所以即使在 1993 年的硬件上也能达到 30+ FPS。</p>

                    <h3>鱼眼矫正</h3>

                    <p>如果直接用射线到墙壁的欧几里得距离来计算墙高，你会看到一个诡异的"鱼眼"效果 —— 画面边缘的墙壁看起来向外膨胀弯曲。这是因为屏幕边缘的射线比中心的射线走了更远的路。</p>

                    <p>修复方法很简单 —— 使用<strong>垂直距离</strong>而不是实际距离：</p>

                    <pre><code>// 鱼眼矫正：用垂直距离代替实际距离
// DDA 算法天然给出垂直距离：
var perpDist;
if (side === 0) perpDist = sideDistX - deltaDistX;
else            perpDist = sideDistY - deltaDistY;

// 墙壁高度 = 屏幕高度 / 垂直距离
var wallH = Math.floor(SCREEN_H / perpDist);</code></pre>

                    <h3>距离着色与面着色</h3>

                    <p>为了增强立体感，我们用了两个技巧：</p>
                    <ul>
                        <li><strong>距离衰减</strong>：墙壁颜色随距离变暗，<code>shade = max(0.15, 1 - dist / MAX_DEPTH)</code></li>
                        <li><strong>面朝向差异</strong>：南北面（side=1）的亮度额外乘以 0.7，这样转角处就能看到明暗交替，增强空间感</li>
                    </ul>


                    <h2 class="doom-section-title">&#128100; 精灵系统：2D 角色在 3D 空间中</h2>

                    <p>敌人和道具在 Raycasting 引擎中是 <strong>Billboard Sprites</strong> —— 它们是扁平的 2D 图像，但始终正对玩家（就像广告牌一样）。这样无论你从哪个角度看，它们都"看起来"是 3D 的。</p>

                    <p>精灵渲染的关键步骤：</p>

                    <ol>
                        <li><strong>世界坐标→屏幕坐标</strong>：计算精灵相对于玩家的角度偏差，映射到屏幕 X 位置</li>
                        <li><strong>距离排序</strong>：先画远的，再画近的（画家算法）</li>
                        <li><strong>深度缓冲裁剪</strong>：逐列比较精灵距离和该列墙壁距离，只画精灵比墙近的部分</li>
                    </ol>

                    <pre><code>// 精灵投影：世界坐标 → 屏幕位置
var spriteAngle = Math.atan2(dy, dx) - player.angle;
var screenX = SCREEN_W / 2 * (1 + spriteAngle / HALF_FOV);
var spriteH = SCREEN_H / dist;  // 距离越近，画得越大

// 深度裁剪：逐列检查
for (var col = startX; col &lt; endX; col++) {
    if (dist &lt; depthBuf[col]) {
        // 这一列精灵比墙近，画出来
        drawSpriteColumn(col, ...);
    }
}</code></pre>

                    <p>有趣的是，本项目的敌人不是用图片贴图，而是用 <strong>Canvas 程序化绘制</strong> —— 头、身体、手臂、腿都是用 <code>fillRect</code> 和 <code>arc</code> 拼出来的。这意味着整个游戏没有任何外部资源文件。</p>


                    <h2 class="doom-section-title">&#128433; 鼠标旋转的坑</h2>

                    <p>FPS 游戏最重要的交互就是鼠标瞄准。在浏览器中，我们使用 <strong>Pointer Lock API</strong> 来获取鼠标的相对移动量，然后转化为视角旋转：</p>

                    <pre><code>canvas.requestPointerLock();  // 锁定鼠标

document.addEventListener('mousemove', function(e) {
    if (pointerLocked) {
        mouseMovX += e.movementX;  // 累加水平移动量
    }
});

// 每帧应用旋转
player.angle += mouseMovX * MOUSE_SENS;
mouseMovX = 0;</code></pre>

                    <p>听起来很简单，但在实际开发中，<strong>鼠标视角会突然跳变</strong> —— 转到某个方向时，画面猛地转了 90 度。</p>

                    <p>这个 bug 困扰了我很久，经历了 <strong>4 次修复迭代</strong>：</p>

                    <table>
                        <tr><th>尝试</th><th>方案</th><th>结果</th></tr>
                        <tr><td>第 1 次</td><td>角度归一化到 [0, 2π]</td><td>&#10060; 没用</td></tr>
                        <tr><td>第 2 次</td><td>per-event clamp ±50px + 帧级 clamp ±150px</td><td>&#10060; 依然跳变</td></tr>
                        <tr><td>第 3 次</td><td>指数移动平均 (EMA) 平滑</td><td>&#10060; 更糟了 —— 操作感变得迟钝粘滞</td></tr>
                        <tr><td>第 4 次</td><td>直接丢弃 |movementX| > 200 的异常事件</td><td>&#9989; 完美解决！</td></tr>
                    </table>

                    <p>最终的原因是 <strong>浏览器的 Pointer Lock 实现存在 bug</strong>：某些帧会报出离谱的 <code>movementX</code> 值（比如突然 +500），这并不是真实的鼠标移动。</p>

                    <pre><code>// 最终方案：丢弃离群值
document.addEventListener('mousemove', function(e) {
    if (pointerLocked) {
        // 丢弃异常跳变（浏览器 Pointer Lock bug）
        if (Math.abs(e.movementX) &lt; 200) {
            mouseMovX += e.movementX;
        }
    }
});</code></pre>

                    <blockquote>
                        <p><strong>教训</strong>：有时候最简单的方案反而最有效。复杂的平滑算法不仅没解决问题，还引入了新的问题。直接找到异常数据并丢弃才是正解。</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128163; 手雷物理模拟</h2>

                    <p>手雷的物理系统是整个项目最有趣的部分之一。它模拟了真实的抛物运动和弹跳效果，虽然只有几十行代码，但视觉效果非常满意。</p>

                    <h3>三轴运动</h3>

                    <p>虽然是 2.5D 的游戏，手雷的运动是在 3 个轴上进行的：<code>x</code>/<code>y</code> 是水平位置（地图上的坐标），<code>z</code> 是垂直高度。</p>

                    <pre><code>// 抛出手雷
grenades.push({
    x: player.x, y: player.y,
    dx: cos * 6, dy: sin * 6,  // 水平速度（朝向方向）
    z: 0.5,                     // 初始高度（手持高度）
    dz: 3.0,                    // 向上抛出的初速度
    life: 3.0                   // 3秒引信
});

// 每帧更新
g.dz -= 9.8 * dt;    // 重力加速度
g.z  += g.dz * dt;   // 更新高度</code></pre>

                    <h3>地面弹跳</h3>

                    <p>当手雷落到地面（<code>z &le; 0</code>）时，垂直速度反转并乘以衰减系数，模拟非弹性碰撞：</p>

                    <pre><code>if (g.z &lt;= 0) {
    g.z = 0;
    if (Math.abs(g.dz) &gt; 0.5) {
        g.dz = -g.dz * 0.45;  // 弹跳，保留45%能量
        g.dx *= 0.7;           // 水平速度也衰减
        g.dy *= 0.7;
    } else {
        g.dz = 0;             // 能量不够了，停止弹跳
        g.dx *= 0.92;         // 地面滚动摩擦
        g.dy *= 0.92;
    }
}</code></pre>

                    <h3>墙壁反弹</h3>

                    <p>墙壁碰撞是 <strong>X 轴和 Y 轴独立检测</strong> 的。这意味着手雷打到墙角时，X 和 Y 方向都会反转，自然地弹回来：</p>

                    <pre><code>// X方向碰墙？反转X速度
if (MAP[myO][mxN] !== 0) {
    g.dx = -g.dx * 0.5;  // 50%能量保留
    nx = g.x;             // 不穿墙
}
// Y方向碰墙？反转Y速度
if (MAP[myN][mxO] !== 0) {
    g.dy = -g.dy * 0.5;
    ny = g.y;
}</code></pre>

                    <p>手雷在飞行时还会在地面投射一个椭圆形阴影，帮助玩家判断落点位置。</p>


                    <h2 class="doom-section-title">&#129302; 敌人 AI 状态机</h2>

                    <p>每个敌人都运行着一个简单的状态机，有 4 个状态：</p>

                    <table>
                        <tr><th>状态</th><th>行为</th><th>转换条件</th></tr>
                        <tr><td><strong>IDLE</strong></td><td>原地缓慢巡逻</td><td>听到枪声或看到玩家 &rarr; ALERT</td></tr>
                        <tr><td><strong>ALERT</strong></td><td>朝声音方向转身</td><td>看到玩家 &rarr; CHASE</td></tr>
                        <tr><td><strong>CHASE</strong></td><td>朝玩家移动</td><td>进入攻击范围 &rarr; ATTACK</td></tr>
                        <tr><td><strong>ATTACK</strong></td><td>开火或近战</td><td>失去视线 &rarr; IDLE</td></tr>
                    </table>

                    <p>"看到玩家"的判定用的是一个简化的 Raycast：沿敌人到玩家的方向，每步 0.3 检查是否碰到墙壁。如果一路畅通，就说明视线没被遮挡。</p>

                    <p>敌人之间、敌人和玩家之间还有<strong>碰撞阻挡</strong>，防止它们重叠在一起。这个碰撞半径经历了多次调整 —— 太小会重叠，太大会卡在门口走不过去。</p>


                    <h2 class="doom-section-title">&#127925; 程序化音效</h2>

                    <p>整个游戏的所有音效都是用 <strong>Web Audio API</strong> 实时生成的，没有一个外部音频文件。每种武器和音效都是由振荡器（Oscillator）、噪声缓冲（Noise Buffer）、滤波器（BiquadFilter）和增益节点（Gain）组合而成：</p>

                    <table>
                        <tr><th>音效</th><th>实现方式</th></tr>
                        <tr><td>手枪</td><td>白噪声 + 低通滤波器 800Hz + 快速衰减</td></tr>
                        <tr><td>霰弹枪</td><td>白噪声 + 低通 600Hz + 更长的衰减</td></tr>
                        <tr><td>机枪</td><td>白噪声 + 带通滤波器 + 极短脉冲</td></tr>
                        <tr><td>狙击枪</td><td>锯齿波 150&rarr;30Hz + 低通 800Hz（深沉的开裂声）</td></tr>
                        <tr><td>爆炸</td><td>长白噪声 + 低通 300Hz + 慢衰减（沉闷的轰鸣）</td></tr>
                        <tr><td>匕首</td><td>白噪声 + 高通 3000Hz（尖锐的挥砍声）</td></tr>
                        <tr><td>脚步</td><td>白噪声 + 低通 200Hz + 极短脉冲</td></tr>
                    </table>

                    <pre><code>// 以手枪为例：白噪声 + 低通滤波 + 快速衰减
case 'pistol':
    bufferSize = audioCtx.sampleRate * 0.15;
    buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    output = buffer.getChannelData(0);
    for (var i = 0; i &lt; bufferSize; i++)
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    // ... 连接低通滤波器和增益节点</code></pre>


                    <h2 class="doom-section-title">&#128274; 反作弊设计</h2>

                    <p>排行榜系统需要防止分数作弊。虽然客户端的任何方案都不可能完全防住，但合理的设计可以大幅提高作弊门槛：</p>

                    <ul>
                        <li><strong>Token 验证</strong>：提交分数时需要附带 <code>md5(score + '_' + duration + '_' + md5(serverSalt))</code>，salt 每天更换</li>
                        <li><strong>合理性检查</strong>：分数 0~99999，时长 0~36000 秒</li>
                        <li><strong>IP 限速</strong>：每个 IP 每 5 秒只能提交一次</li>
                        <li><strong>数据清理</strong>：只保留前 20 名，超过 3 周的记录自动删除</li>
                    </ul>

                    <blockquote>
                        <p>一个有趣的小坑：最初 salt 是通过 WordPress 的 <code>esc_js()</code> 传给前端的，但这个函数会把 salt 中的特殊字符转义，导致前后端计算的 token 不一致。解决方案是在传递之前先对 salt 做一次 <code>md5()</code> —— 哈希值只包含 0-9a-f，不会被转义。</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128640; 技术栈总结</h2>

                    <table>
                        <tr><th>模块</th><th>技术</th></tr>
                        <tr><td>渲染引擎</td><td>Canvas 2D + Raycasting (DDA 算法)</td></tr>
                        <tr><td>输入控制</td><td>Pointer Lock API + 离群值过滤</td></tr>
                        <tr><td>音效系统</td><td>Web Audio API 程序化生成</td></tr>
                        <tr><td>物理模拟</td><td>欧拉积分 + 弹性碰撞</td></tr>
                        <tr><td>AI 系统</td><td>有限状态机 + 视线检测</td></tr>
                        <tr><td>后端</td><td>WordPress AJAX + MySQL</td></tr>
                        <tr><td>反作弊</td><td>MD5 token + 服务端 salt</td></tr>
                        <tr><td>外部依赖</td><td>无（纯原生 JS，无框架、无图片、无音频文件）</td></tr>
                    </table>

                    <p>整个游戏的代码量约 1800 行 JavaScript，加上 300 行 CSS 和 80 行 PHP，是一个完全自包含的小项目。它证明了即使在 2026 年，Raycasting 这个 1992 年的技术依然有它独特的魅力 —— 简单、高效、而且实现起来非常有趣。</p>

                    <p>如果你想挑战一下，试试通关两个关卡吧！ &#128522;</p>

                    </div><!-- end zh -->

                    <!-- English Version -->
                    <div id="doom-blog-content-en" style="display:none">

                    <h2 class="doom-section-title">&#127918; The Story of Doom</h2>

                    <p>In 1993, id Software released a game that changed the industry forever &mdash; <em>Doom</em>. In an era when CPUs ran at 66 MHz and GPUs didn't exist, John Carmack achieved smooth "pseudo-3D" rendering through pure software, giving the world its first taste of the first-person shooter (FPS) genre.</p>

                    <p>Doom isn't truly a 3D game. Its world is fundamentally a 2D grid map, projected into a 3D-looking image through an algorithm called <strong>Raycasting</strong>. This technique came to be known as <strong>2.5D</strong> &mdash; somewhere between 2D and 3D.</p>

                    <blockquote>
                        <p>One day, after building a Snake game for my blog, I thought: could I recreate Doom in the browser using Canvas 2D? And so this project was born &mdash; an FPS game built entirely with JavaScript + Canvas 2D. No WebGL, no external assets &mdash; all rendering, sound effects, and physics are procedurally generated.</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128270; Raycasting: From 2D Maps to Pseudo-3D</h2>

                    <p>The core idea of Raycasting is elegant: <strong>for each column of pixels on screen, cast a ray from the player's position, find the first wall it hits, and draw that wall at a height determined by the distance.</strong></p>

                    <p>Imagine standing in a maze made of blocks. Your field of view is 60 degrees, and the screen is 960 pixels wide. You cast 960 rays, evenly distributed across that 60-degree arc:</p>

                    <pre><code>// Cast a ray for each screen column
for (var col = 0; col &lt; SCREEN_W; col++) {
    // Ray angle = player facing - half FOV + column offset
    var rayAngle = player.angle - HALF_FOV + (col / SCREEN_W) * FOV;
    // ... find wall using DDA algorithm
}</code></pre>

                    <h3>The DDA Algorithm</h3>

                    <p><strong>DDA (Digital Differential Analyzer)</strong> is the heart of Raycasting. Instead of stepping along the ray in tiny increments (too slow), it jumps along grid boundaries &mdash; each step lands exactly on the next grid line, checking if that cell is a wall:</p>

                    <pre><code>// DDA core: alternate between X and Y grid boundaries
if (sideDistX &lt; sideDistY) {
    sideDistX += deltaDistX;  // jump to next vertical grid line
    mapX += stepX;
    side = 0;  // hit an East/West wall face
} else {
    sideDistY += deltaDistY;  // jump to next horizontal grid line
    mapY += stepY;
    side = 1;  // hit a North/South wall face
}</code></pre>

                    <p>The beauty of this algorithm: each iteration needs only one comparison and one addition &mdash; no trigonometry &mdash; so it could run at 30+ FPS even on 1993 hardware.</p>

                    <h3>Fish-eye Correction</h3>

                    <p>If you use the raw Euclidean distance from ray to wall, you get a bizarre "fish-eye" effect &mdash; walls at the screen edges appear to bulge outward. This happens because edge rays travel further than center rays.</p>

                    <p>The fix is simple &mdash; use <strong>perpendicular distance</strong> instead of actual distance:</p>

                    <pre><code>// Fish-eye correction: use perpendicular distance
// DDA naturally provides this:
var perpDist;
if (side === 0) perpDist = sideDistX - deltaDistX;
else            perpDist = sideDistY - deltaDistY;

// Wall height = screen height / perpendicular distance
var wallH = Math.floor(SCREEN_H / perpDist);</code></pre>

                    <h3>Distance &amp; Face Shading</h3>

                    <p>To enhance depth perception, two techniques are used:</p>
                    <ul>
                        <li><strong>Distance attenuation</strong>: Wall colors darken with distance, <code>shade = max(0.15, 1 - dist / MAX_DEPTH)</code></li>
                        <li><strong>Face orientation</strong>: N/S faces (side=1) are dimmed by an extra 0.7x, creating visible light/dark alternation at corners</li>
                    </ul>


                    <h2 class="doom-section-title">&#128100; Sprite System: 2D Characters in 3D Space</h2>

                    <p>Enemies and items in a Raycasting engine are <strong>Billboard Sprites</strong> &mdash; flat 2D images that always face the player (like a billboard). This makes them "look" 3D from any angle.</p>

                    <p>Key steps in sprite rendering:</p>

                    <ol>
                        <li><strong>World &rarr; Screen projection</strong>: Calculate the sprite's angular offset from the player, map to screen X position</li>
                        <li><strong>Distance sorting</strong>: Draw far sprites first, near ones last (painter's algorithm)</li>
                        <li><strong>Depth buffer clipping</strong>: Compare sprite distance against wall distance column-by-column, only draw where the sprite is closer</li>
                    </ol>

                    <pre><code>// Sprite projection: world coords &rarr; screen position
var spriteAngle = Math.atan2(dy, dx) - player.angle;
var screenX = SCREEN_W / 2 * (1 + spriteAngle / HALF_FOV);
var spriteH = SCREEN_H / dist;  // closer = larger

// Depth clipping: per-column check
for (var col = startX; col &lt; endX; col++) {
    if (dist &lt; depthBuf[col]) {
        // This column is in front of the wall, draw it
        drawSpriteColumn(col, ...);
    }
}</code></pre>

                    <p>Interestingly, enemies in this project aren't texture-mapped &mdash; they're <strong>drawn procedurally with Canvas</strong>. Heads, bodies, arms, and legs are assembled from <code>fillRect</code> and <code>arc</code> calls. This means the entire game has zero external asset files.</p>


                    <h2 class="doom-section-title">&#128433; The Mouse Rotation Bug</h2>

                    <p>Mouse aiming is the most critical interaction in an FPS. In the browser, we use the <strong>Pointer Lock API</strong> to capture relative mouse movement and convert it to view rotation:</p>

                    <pre><code>canvas.requestPointerLock();  // lock the mouse

document.addEventListener('mousemove', function(e) {
    if (pointerLocked) {
        mouseMovX += e.movementX;  // accumulate horizontal movement
    }
});

// Apply rotation each frame
player.angle += mouseMovX * MOUSE_SENS;
mouseMovX = 0;</code></pre>

                    <p>Sounds simple, but in practice, <strong>the view would suddenly snap</strong> &mdash; spinning 90 degrees in a single frame.</p>

                    <p>This bug tormented me through <strong>4 fix iterations</strong>:</p>

                    <table>
                        <tr><th>Attempt</th><th>Approach</th><th>Result</th></tr>
                        <tr><td>#1</td><td>Normalize angle to [0, 2&pi;]</td><td>&#10060; No effect</td></tr>
                        <tr><td>#2</td><td>Per-event clamp &plusmn;50px + frame clamp &plusmn;150px</td><td>&#10060; Still snapping</td></tr>
                        <tr><td>#3</td><td>Exponential Moving Average (EMA) smoothing</td><td>&#10060; Worse &mdash; controls felt sluggish and drifty</td></tr>
                        <tr><td>#4</td><td>Discard events with |movementX| &gt; 200</td><td>&#9989; Perfect fix!</td></tr>
                    </table>

                    <p>The root cause: <strong>a browser bug in the Pointer Lock implementation</strong> that occasionally reports wildly incorrect <code>movementX</code> values (e.g., a sudden +500), which don't represent real mouse movement.</p>

                    <pre><code>// Final solution: discard outliers
document.addEventListener('mousemove', function(e) {
    if (pointerLocked) {
        // Discard anomalous jumps (browser Pointer Lock bug)
        if (Math.abs(e.movementX) &lt; 200) {
            mouseMovX += e.movementX;
        }
    }
});</code></pre>

                    <blockquote>
                        <p><strong>Lesson learned</strong>: Sometimes the simplest solution is the most effective. Complex smoothing algorithms didn't solve the problem &mdash; they made it worse. Identifying and discarding anomalous data was the real fix.</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128163; Grenade Physics Simulation</h2>

                    <p>The grenade physics system is one of the most satisfying parts of this project. It simulates realistic parabolic motion and bouncing with just a few dozen lines of code.</p>

                    <h3>Three-Axis Motion</h3>

                    <p>Despite being a 2.5D game, grenade motion uses 3 axes: <code>x</code>/<code>y</code> for horizontal position (map coordinates), and <code>z</code> for vertical height.</p>

                    <pre><code>// Throw a grenade
grenades.push({
    x: player.x, y: player.y,
    dx: cos * 6, dy: sin * 6,  // horizontal velocity (facing direction)
    z: 0.5,                     // initial height (hand level)
    dz: 3.0,                    // upward throw velocity
    life: 3.0                   // 3-second fuse
});

// Per-frame update
g.dz -= 9.8 * dt;    // gravity
g.z  += g.dz * dt;   // update height</code></pre>

                    <h3>Ground Bounce</h3>

                    <p>When the grenade hits the ground (<code>z &le; 0</code>), vertical velocity is reversed and multiplied by a damping factor, simulating inelastic collision:</p>

                    <pre><code>if (g.z &lt;= 0) {
    g.z = 0;
    if (Math.abs(g.dz) &gt; 0.5) {
        g.dz = -g.dz * 0.45;  // bounce, retain 45% energy
        g.dx *= 0.7;           // horizontal speed also decays
        g.dy *= 0.7;
    } else {
        g.dz = 0;             // not enough energy, stop bouncing
        g.dx *= 0.92;         // rolling friction
        g.dy *= 0.92;
    }
}</code></pre>

                    <h3>Wall Bounce</h3>

                    <p>Wall collisions are detected <strong>independently on the X and Y axes</strong>. This means a grenade hitting a corner naturally reverses both directions:</p>

                    <pre><code>// Hit wall on X axis? Reverse X velocity
if (MAP[myO][mxN] !== 0) {
    g.dx = -g.dx * 0.5;  // 50% energy retained
    nx = g.x;             // don't pass through
}
// Hit wall on Y axis? Reverse Y velocity
if (MAP[myN][mxO] !== 0) {
    g.dy = -g.dy * 0.5;
    ny = g.y;
}</code></pre>

                    <p>During flight, the grenade also casts an elliptical shadow on the ground to help players judge the landing point.</p>


                    <h2 class="doom-section-title">&#129302; Enemy AI State Machine</h2>

                    <p>Each enemy runs a simple state machine with 4 states:</p>

                    <table>
                        <tr><th>State</th><th>Behavior</th><th>Transition</th></tr>
                        <tr><td><strong>IDLE</strong></td><td>Slow patrol in place</td><td>Hears gunfire or sees player &rarr; ALERT</td></tr>
                        <tr><td><strong>ALERT</strong></td><td>Turn toward sound</td><td>Sees player &rarr; CHASE</td></tr>
                        <tr><td><strong>CHASE</strong></td><td>Move toward player</td><td>In attack range &rarr; ATTACK</td></tr>
                        <tr><td><strong>ATTACK</strong></td><td>Fire or melee</td><td>Loses line of sight &rarr; IDLE</td></tr>
                    </table>

                    <p>"Seeing the player" uses a simplified raycast: step along the enemy-to-player direction in 0.3 increments, checking for wall hits. If the path is clear, line of sight is confirmed.</p>

                    <p>Enemies also have <strong>mutual collision blocking</strong> with each other and with the player, preventing overlap. The collision radius went through several adjustments &mdash; too small and they overlap, too large and they get stuck in doorways.</p>


                    <h2 class="doom-section-title">&#127925; Procedural Sound Effects</h2>

                    <p>Every sound in the game is generated in real-time using the <strong>Web Audio API</strong> &mdash; not a single audio file is loaded. Each weapon and effect is composed from Oscillators, Noise Buffers, BiquadFilters, and Gain nodes:</p>

                    <table>
                        <tr><th>Sound</th><th>Implementation</th></tr>
                        <tr><td>Pistol</td><td>White noise + lowpass 800Hz + fast decay</td></tr>
                        <tr><td>Shotgun</td><td>White noise + lowpass 600Hz + longer decay</td></tr>
                        <tr><td>Machine gun</td><td>White noise + bandpass filter + ultra-short pulse</td></tr>
                        <tr><td>Sniper</td><td>Sawtooth 150&rarr;30Hz + lowpass 800Hz (deep crack)</td></tr>
                        <tr><td>Explosion</td><td>Long white noise + lowpass 300Hz + slow decay (muffled boom)</td></tr>
                        <tr><td>Knife</td><td>White noise + highpass 3000Hz (sharp slash)</td></tr>
                        <tr><td>Footstep</td><td>White noise + lowpass 200Hz + ultra-short pulse</td></tr>
                    </table>

                    <pre><code>// Example: Pistol - white noise + lowpass + fast decay
case 'pistol':
    bufferSize = audioCtx.sampleRate * 0.15;
    buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    output = buffer.getChannelData(0);
    for (var i = 0; i &lt; bufferSize; i++)
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    // ... connect lowpass filter and gain node</code></pre>


                    <h2 class="doom-section-title">&#128274; Anti-Cheat Design</h2>

                    <p>The leaderboard needs protection against score manipulation. While no client-side solution is bulletproof, reasonable design can raise the barrier significantly:</p>

                    <ul>
                        <li><strong>Token verification</strong>: Score submissions require <code>md5(score + '_' + duration + '_' + md5(serverSalt))</code>, with the salt rotating daily</li>
                        <li><strong>Sanity checks</strong>: Score 0&ndash;99999, duration 0&ndash;36000 seconds</li>
                        <li><strong>IP rate limiting</strong>: One submission per IP every 5 seconds</li>
                        <li><strong>Data cleanup</strong>: Keep only top 20, auto-delete records older than 3 weeks</li>
                    </ul>

                    <blockquote>
                        <p>A fun gotcha: initially the salt was passed to the frontend via WordPress's <code>esc_js()</code>, which escapes special characters in the salt, causing token mismatches between client and server. The fix was to <code>md5()</code> the salt before passing it &mdash; hex digests contain only 0-9a-f and can't be corrupted by escaping.</p>
                    </blockquote>


                    <h2 class="doom-section-title">&#128640; Tech Stack Summary</h2>

                    <table>
                        <tr><th>Module</th><th>Technology</th></tr>
                        <tr><td>Rendering</td><td>Canvas 2D + Raycasting (DDA algorithm)</td></tr>
                        <tr><td>Input</td><td>Pointer Lock API + outlier filtering</td></tr>
                        <tr><td>Audio</td><td>Web Audio API procedural generation</td></tr>
                        <tr><td>Physics</td><td>Euler integration + inelastic collision</td></tr>
                        <tr><td>AI</td><td>Finite state machine + line-of-sight detection</td></tr>
                        <tr><td>Backend</td><td>WordPress AJAX + MySQL</td></tr>
                        <tr><td>Anti-cheat</td><td>MD5 token + server-side salt</td></tr>
                        <tr><td>Dependencies</td><td>None (vanilla JS, no frameworks, no images, no audio files)</td></tr>
                    </table>

                    <p>The entire game is roughly 1,800 lines of JavaScript, plus 300 lines of CSS and 80 lines of PHP &mdash; a fully self-contained mini-project. It proves that even in 2026, Raycasting &mdash; a technique from 1992 &mdash; still has a unique charm: simple, efficient, and incredibly fun to implement.</p>

                    <p>If you're up for a challenge, try beating both levels! &#128522;</p>

                    </div><!-- end en -->

                </div>

            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
