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
                        <p class="doom-subtitle" style="margin-top:20px;font-size:12px;">WASD move &bull; Mouse aim &bull; Click shoot &bull; Right-click scope &bull; Q/1-6 weapons &bull; E door &bull; G grenade &bull; M minimap</p>
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

            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
