/**
 * Snake Game - Modern smooth style with leaderboard
 * @author Haibin
 * @date 2026-04-17
 */
(function () {
    'use strict';

    var AJAX_URL = window.SNAKE_AJAX || (window.HOME ? window.HOME + '/wp-admin/admin-ajax.php' : '/wp-admin/admin-ajax.php');
    var DAY_SALT = window.SNAKE_DAY_SALT || '';

    // Game config
    var GRID = 20;           // grid cells per row/col
    var CELL;                // pixel size per cell (calculated)
    var BASE_SPEED = 150;    // ms per tick at start
    var MIN_SPEED = 60;      // fastest tick
    var SPEED_STEP = 3;      // ms faster per food eaten

    // Game state
    var canvas, ctx;
    var snake, direction, nextDirection, food;
    var score, gameTimer, startTime, duration;
    var state; // 'start', 'playing', 'gameover'
    var playerName = '';
    var lbType = 'alltime';
    var particles = [];
    var animFrame;

    // Smooth animation
    var lastTick = 0;
    var tickInterval;

    /* ========== Init ========== */
    function init() {
        canvas = document.getElementById('snake-canvas');
        ctx = canvas.getContext('2d');

        // Responsive canvas
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Restore name
        try { playerName = localStorage.getItem('snake_player_name') || ''; } catch (e) {}
        var nameInput = document.getElementById('snake-name-input');
        nameInput.value = playerName;

        // Events
        document.getElementById('snake-start-btn').addEventListener('click', startGame);
        document.getElementById('snake-restart-btn').addEventListener('click', startGame);
        nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') startGame();
        });

        document.addEventListener('keydown', handleKey);

        // Mobile swipe
        var touchStartX, touchStartY;
        canvas.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        canvas.addEventListener('touchend', function (e) {
            if (!touchStartX) return;
            var dx = e.changedTouches[0].clientX - touchStartX;
            var dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                setDirection(dx > 0 ? 'right' : 'left');
            } else {
                setDirection(dy > 0 ? 'down' : 'up');
            }
            touchStartX = touchStartY = null;
        }, { passive: true });

        // Leaderboard tabs
        document.querySelectorAll('.snake-lb-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.snake-lb-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                lbType = btn.dataset.type;
                loadLeaderboard();
            });
        });

        state = 'start';
        drawStartScreen();
        loadLeaderboard();
    }

    function resizeCanvas() {
        var container = canvas.parentElement;
        var maxW = Math.min(440, container.clientWidth);
        canvas.width = maxW;
        canvas.height = maxW;
        canvas.style.width = maxW + 'px';
        canvas.style.height = maxW + 'px';
        CELL = maxW / GRID;
        if (state === 'playing') drawGame();
    }

    /* ========== Game control ========== */
    function startGame() {
        var nameInput = document.getElementById('snake-name-input');
        playerName = nameInput.value.trim();
        if (!playerName) {
            nameInput.style.borderColor = '#ff4d4f';
            nameInput.focus();
            setTimeout(function () { nameInput.style.borderColor = ''; }, 1500);
            return;
        }
        try { localStorage.setItem('snake_player_name', playerName); } catch (e) {}

        // Hide overlays
        document.getElementById('snake-start-overlay').style.display = 'none';
        document.getElementById('snake-gameover-overlay').style.display = 'none';

        // Init game state
        var mid = Math.floor(GRID / 2);
        snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        particles = [];
        tickInterval = BASE_SPEED;
        startTime = Date.now();
        duration = 0;
        state = 'playing';

        spawnFood();
        updateScoreDisplay();

        // Game loop
        clearInterval(gameTimer);
        lastTick = Date.now();
        cancelAnimationFrame(animFrame);
        gameLoop();
        gameTimer = setInterval(gameTick, tickInterval);
    }

    function gameTick() {
        if (state !== 'playing') return;

        // Apply direction
        direction = nextDirection;

        // Move
        var head = { x: snake[0].x, y: snake[0].y };
        switch (direction) {
            case 'up':    head.y--; break;
            case 'down':  head.y++; break;
            case 'left':  head.x--; break;
            case 'right': head.x++; break;
        }

        // Wall wrap-around
        if (head.x < 0) head.x = GRID - 1;
        else if (head.x >= GRID) head.x = 0;
        if (head.y < 0) head.y = GRID - 1;
        else if (head.y >= GRID) head.y = 0;

        // Self collision
        for (var i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver(); return;
            }
        }

        snake.unshift(head);

        // Eat food
        if (head.x === food.x && head.y === food.y) {
            score++;
            updateScoreDisplay();
            spawnParticles(food.x, food.y);
            spawnFood();

            // Speed up
            tickInterval = Math.max(MIN_SPEED, BASE_SPEED - score * SPEED_STEP);
            clearInterval(gameTimer);
            gameTimer = setInterval(gameTick, tickInterval);
        } else {
            snake.pop();
        }
    }

    function gameLoop() {
        if (state !== 'playing' && particles.length === 0) return;
        drawGame();
        animFrame = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        state = 'gameover';
        clearInterval(gameTimer);
        duration = Math.floor((Date.now() - startTime) / 1000);

        // Update display
        document.getElementById('snake-final-score').textContent = score;
        document.getElementById('snake-time-display').textContent = 'Time: ' + duration + 's';

        // Submit score
        submitScore();

        // Show overlay with delay
        setTimeout(function () {
            document.getElementById('snake-gameover-overlay').style.display = '';
        }, 500);
    }

    /* ========== Drawing ========== */
    function drawGame() {
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (var i = 0; i <= GRID; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(w, i * CELL); ctx.stroke();
        }

        // Food - pulsating glow
        drawFood();

        // Snake
        drawSnake();

        // Particles
        updateParticles();

        // Timer
        if (state === 'playing') {
            duration = Math.floor((Date.now() - startTime) / 1000);
            document.getElementById('snake-time-display').textContent = 'Time: ' + duration + 's';
        }
    }

    function drawSnake() {
        for (var i = snake.length - 1; i >= 0; i--) {
            var s = snake[i];
            var ratio = i / snake.length;
            var r = CELL * 0.44;

            // Gradient color: head is bright green, tail fades
            var hue = 140 + ratio * 30;
            var lightness = 55 - ratio * 15;
            var alpha = 1 - ratio * 0.3;

            ctx.fillStyle = 'hsla(' + hue + ', 70%, ' + lightness + '%, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(s.x * CELL + CELL / 2, s.y * CELL + CELL / 2, r, 0, Math.PI * 2);
            ctx.fill();

            // Head details
            if (i === 0) {
                // Glow
                ctx.shadowColor = 'rgba(66, 185, 131, 0.5)';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#42b983';
                ctx.beginPath();
                ctx.arc(s.x * CELL + CELL / 2, s.y * CELL + CELL / 2, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Eyes
                var eyeSize = CELL * 0.1;
                var eyeOffset = CELL * 0.15;
                var ex1, ey1, ex2, ey2;
                switch (direction) {
                    case 'up':    ex1 = -eyeOffset; ey1 = -eyeOffset; ex2 = eyeOffset; ey2 = -eyeOffset; break;
                    case 'down':  ex1 = -eyeOffset; ey1 = eyeOffset; ex2 = eyeOffset; ey2 = eyeOffset; break;
                    case 'left':  ex1 = -eyeOffset; ey1 = -eyeOffset; ex2 = -eyeOffset; ey2 = eyeOffset; break;
                    case 'right': ex1 = eyeOffset; ey1 = -eyeOffset; ex2 = eyeOffset; ey2 = eyeOffset; break;
                }
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x * CELL + CELL / 2 + ex1, s.y * CELL + CELL / 2 + ey1, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(s.x * CELL + CELL / 2 + ex2, s.y * CELL + CELL / 2 + ey2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function drawFood() {
        var pulse = Math.sin(Date.now() / 200) * 0.15 + 0.85;
        var r = CELL * 0.4 * pulse;

        // Glow
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 15;

        // Gradient
        var grd = ctx.createRadialGradient(
            food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 0,
            food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, r
        );
        grd.addColorStop(0, '#ff6b6b');
        grd.addColorStop(1, '#ee5a24');
        ctx.fillStyle = grd;

        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawStartScreen() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* ========== Particles ========== */
    function spawnParticles(gx, gy) {
        var cx = gx * CELL + CELL / 2;
        var cy = gy * CELL + CELL / 2;
        for (var i = 0; i < 12; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1.5 + Math.random() * 3;
            particles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                hue: 0 + Math.random() * 40 // red-orange
            });
        }
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.vx *= 0.97;
            p.vy *= 0.97;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = 'hsla(' + p.hue + ', 100%, 60%, ' + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ========== Controls ========== */
    function handleKey(e) {
        if (state !== 'playing') return;
        switch (e.key) {
            case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); setDirection('up'); break;
            case 'ArrowDown':  case 's': case 'S': e.preventDefault(); setDirection('down'); break;
            case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); setDirection('left'); break;
            case 'ArrowRight': case 'd': case 'D': e.preventDefault(); setDirection('right'); break;
        }
    }

    function setDirection(dir) {
        var opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (dir !== opposites[direction]) {
            nextDirection = dir;
        }
    }

    /* ========== Helpers ========== */
    function spawnFood() {
        var occupied = {};
        snake.forEach(function (s) { occupied[s.x + ',' + s.y] = true; });
        var attempts = 0;
        do {
            food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
            attempts++;
        } while (occupied[food.x + ',' + food.y] && attempts < 1000);
    }

    function updateScoreDisplay() {
        document.getElementById('snake-score-display').textContent = 'Score: ' + score;
    }

    /* ========== AJAX ========== */
    function ajax(action, data) {
        var fd = new FormData();
        fd.append('action', action);
        if (data) Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
        return fetch(AJAX_URL, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.success) return res.data;
                throw new Error(res.data || 'Error');
            });
    }

    function md5Token(score, duration) {
        // Simple hash matching PHP: md5(score + '_' + duration + '_' + salt)
        var str = score + '_' + duration + '_' + DAY_SALT;
        return md5(str);
    }

    function submitScore() {
        var token = md5Token(score, duration);
        ajax('snake_submit', {
            name: playerName,
            score: score,
            duration: duration,
            token: token
        }).then(function (data) {
            var rankEl = document.getElementById('snake-rank');
            if (data.rank <= 3) {
                var medals = ['', '&#129351;', '&#129352;', '&#129353;'];
                rankEl.innerHTML = medals[data.rank] + ' Rank #' + data.rank + '!';
            } else {
                rankEl.textContent = 'Rank #' + data.rank;
            }
            loadLeaderboard();
        }).catch(function () {
            document.getElementById('snake-rank').textContent = 'Score saved locally';
        });
    }

    function loadLeaderboard() {
        ajax('snake_leaderboard', { type: lbType, limit: 20 }).then(function (rows) {
            renderLeaderboard(rows);
        }).catch(function () {
            document.getElementById('snake-lb-list').innerHTML = '<div class="snake-lb-empty">Failed to load</div>';
        });
    }

    function renderLeaderboard(rows) {
        var el = document.getElementById('snake-lb-list');
        if (!rows || rows.length === 0) {
            el.innerHTML = '<div class="snake-lb-empty">No scores yet. Be the first!</div>';
            return;
        }

        var html = '';
        rows.forEach(function (row, i) {
            var rank = i + 1;
            var rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            var rankIcon = rank === 1 ? '&#129351;' : rank === 2 ? '&#129352;' : rank === 3 ? '&#129353;' : rank;
            var isMe = row.player_name === playerName;

            html += '<div class="snake-lb-row' + (isMe ? ' highlight' : '') + '">';
            html += '<div class="snake-lb-rank ' + rankClass + '">' + rankIcon + '</div>';
            html += '<div class="snake-lb-name">' + escapeHtml(row.player_name) + '</div>';
            html += '<div class="snake-lb-score">' + row.score + '</div>';
            html += '<div class="snake-lb-time">' + row.duration + 's</div>';
            html += '</div>';
        });

        el.innerHTML = html;
    }

    function escapeHtml(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    /* ========== MD5 (minimal implementation) ========== */
    function md5(string) {
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
            a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
            a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
            a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
            x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
        }
        function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
        function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
        function md51(s) {
            var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
            for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
            s = s.substring(i - 64);
            var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }
        function md5blk(s) {
            var md5blks = [], i;
            for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
            return md5blks;
        }
        var hex_chr = '0123456789abcdef'.split('');
        function rhex(n) {
            var s = '', j = 0;
            for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
            return s;
        }
        function hex(x) { for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
        function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
        return hex(md51(string));
    }

    /* ========== Start ========== */
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
