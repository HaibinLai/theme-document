<?php
/**
 * Snake Game - Page template
 * Template Name: Snake Game
 * @author Haibin
 * @date 2026-04-17
 */

get_header();
?>

<main class="main-container no-sidebar">
    <div class="main-main">
        <article class="main-content">
            <div class="snake-container">

                <div class="snake-layout">
                    <!-- Game area -->
                    <div class="snake-game-area">
                        <div class="snake-score-bar">
                            <span id="snake-score-display">Score: 0</span>
                            <span id="snake-time-display">Time: 0s</span>
                        </div>
                        <canvas id="snake-canvas" width="400" height="400"></canvas>

                        <!-- Start overlay -->
                        <div class="snake-overlay" id="snake-start-overlay">
                            <div class="snake-overlay-content">
                                <h2>&#127904; Snake</h2>
                                <input type="text" id="snake-name-input" class="snake-name-input"
                                       placeholder="Enter your name" maxlength="20" autocomplete="off"
                                       value="">
                                <button id="snake-start-btn" class="snake-btn snake-btn-play">&#9654; Start Game</button>
                                <div class="snake-controls-hint">
                                    Arrow Keys / WASD / Swipe
                                </div>
                            </div>
                        </div>

                        <!-- Game over overlay -->
                        <div class="snake-overlay" id="snake-gameover-overlay" style="display:none;">
                            <div class="snake-overlay-content">
                                <h2>Game Over!</h2>
                                <div class="snake-final-score" id="snake-final-score">0</div>
                                <div class="snake-rank" id="snake-rank"></div>
                                <button id="snake-restart-btn" class="snake-btn snake-btn-play">&#128260; Play Again</button>
                            </div>
                        </div>
                    </div>

                    <!-- Leaderboard -->
                    <div class="snake-leaderboard">
                        <h3>&#127942; Leaderboard</h3>
                        <div class="snake-lb-tabs">
                            <button class="snake-lb-tab active" data-type="alltime">All Time</button>
                            <button class="snake-lb-tab" data-type="weekly">This Week</button>
                        </div>
                        <div id="snake-lb-list" class="snake-lb-list">
                            <div class="snake-lb-loading">Loading...</div>
                        </div>
                    </div>
                </div>

            </div>
        </article>
    </div>
</main>

<?php get_footer(); ?>
