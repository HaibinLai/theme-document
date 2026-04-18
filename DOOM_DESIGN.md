# Doom-Style FPS Game (Raycasting)

## Context
Add a Doom/Wolfenstein-style first-person shooter to the blog as a "My Corner" game. Built entirely with Canvas 2D raycasting — no WebGL, no external libraries. One map, 3 weapons, level-based (find exit to win). Flat color walls with distance shading. Leaderboard reuses the same pattern as Snake Game.

## Game Design

### Gameplay
- **Objective**: Navigate a maze, kill all enemies, find the exit door
- **Perspective**: First-person, Wolfenstein 3D / Doom style
- **Map**: 1 hand-crafted map (grid-based, ~24x24), walls are solid colors with distance-based shading
- **Win condition**: Reach exit door (all enemies killed or exit found)
- **Score**: Kills × 100 + health remaining × 10 + time bonus (faster = more points)

### Weapons
| # | Weapon | Damage | Fire Rate | Ammo | Notes |
|---|--------|--------|-----------|------|-------|
| 1 | Pistol | 25 | Medium | Unlimited | Starting weapon |
| 2 | Shotgun | 80 (spread) | Slow | 20 | Pickup in map, wide spread |
| 3 | Machine Gun | 15 | Fast | 100 | Pickup in map, rapid fire |

Weapon switching: keys 1/2/3 or scroll wheel. Weapon sprite drawn at bottom-center of screen (simple geometric shapes, not image assets).

### Enemies
- **Type 1: Guard** — walks a patrol route, detects player by line-of-sight, shoots when in range (hitscan), low HP (50)
- **Type 2: Soldier** — faster, more HP (100), chases aggressively once alerted
- Enemies rendered as colored billboard sprites (circles/rectangles, not images), scaled by distance
- Basic state machine: IDLE → ALERT (heard gunshot / saw player) → CHASE → ATTACK → DEAD
- Collision: enemies block player movement

### Player
- HP: 100, displayed as health bar in HUD
- Movement: WASD (forward/back/strafe), mouse or arrow keys to rotate
- Interaction: approach exit door to trigger win

### HUD
- Health bar (bottom-left)
- Ammo count (bottom-right)
- Current weapon indicator
- Minimap (top-right corner, toggleable with M key) — shows walls, player position/direction, enemy dots
- Crosshair at screen center
- Kill count

## Technical Architecture

### Raycasting Engine
- Cast one ray per screen column (e.g., 640 rays for 640px wide canvas)
- DDA algorithm (Digital Differential Analyzer) for fast grid-based wall intersection
- Wall height = `screenHeight / perpDistance` (fish-eye corrected)
- Wall color based on wall type value in map grid, darkened by distance (`color * (1 - distance/maxDist)`)
- North/South walls slightly darker than East/West for depth perception
- Floor/ceiling: solid colors (no texture mapping needed)

### Sprite Rendering
- After walls are drawn, render sprites (enemies, pickups, exit door)
- Sort sprites by distance (far to near), draw back-to-front
- Each column checks against the wall depth buffer — only draw sprite pixels closer than the wall
- Sprites scale with distance: `spriteHeight = screenHeight / distance`

### Map Format
```javascript
// 0 = empty, 1-4 = wall types (different colors), 9 = exit door
const MAP = [
  [1,1,1,1,1,1,...],
  [1,0,0,0,0,1,...],
  [1,0,2,0,0,1,...],
  ...
];
// Separate arrays for entity placement
const ENTITIES = [
  { type: 'guard', x: 3.5, y: 5.5 },
  { type: 'soldier', x: 10.5, y: 8.5 },
  { type: 'shotgun', x: 7.5, y: 3.5 },
  { type: 'machinegun', x: 15.5, y: 12.5 },
  { type: 'health', x: 12.5, y: 6.5 },
];
```

### Game Loop
```
requestAnimationFrame loop:
  1. Process input (movement, rotation, shooting)
  2. Update entities (enemy AI, projectiles, animations)
  3. Cast rays → build wall depth buffer
  4. Draw ceiling + floor
  5. Draw walls (column by column)
  6. Draw sprites (sorted by distance)
  7. Draw weapon sprite (bottom of screen)
  8. Draw HUD (health, ammo, minimap, crosshair)
  9. Check win/lose conditions
```

### Controls
| Input | Action |
|-------|--------|
| W / ArrowUp | Move forward |
| S / ArrowDown | Move backward |
| A | Strafe left |
| D | Strafe right |
| ArrowLeft | Rotate left |
| ArrowRight | Rotate right |
| Mouse move (pointer lock) | Rotate view |
| Left click / Space | Shoot |
| 1, 2, 3 | Switch weapon |
| Scroll wheel | Cycle weapon |
| M | Toggle minimap |

Mobile: virtual joystick (left side) + virtual buttons (right side: shoot, weapon switch).

## Files to Create

### Frontend
1. **`common/doom/doom.js`** (~800-1200 lines) — Complete game engine:
   - Raycasting renderer
   - Player movement + collision
   - Enemy AI + sprite rendering
   - Weapon system
   - HUD rendering
   - Map data
   - Game state management (MENU → PLAYING → WIN → GAMEOVER)
   - Score submission + leaderboard display
   - Built-in md5 for anti-cheat token

2. **`common/doom/doom.css`** — Page layout, canvas styling, leaderboard panel, responsive

### Page Template
3. **`template/page/doom.php`** — WordPress page template "Doom FPS"
   - Canvas element (640×480 or responsive)
   - Start overlay (enter name + start)
   - Win/GameOver overlay (score, rank, play again)
   - Leaderboard panel (reuse snake's layout pattern)

### Backend
4. **`include/doom/install.php`** — DB table `wp_document_doom_scores`
   ```sql
   id BIGINT AUTO_INCREMENT PRIMARY KEY
   player_name VARCHAR(50) NOT NULL
   score INT NOT NULL DEFAULT 0
   kills INT NOT NULL DEFAULT 0
   duration INT NOT NULL DEFAULT 0
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   INDEX idx_score (score DESC)
   INDEX idx_created (created_at)
   ```

5. **`include/doom/api.php`** — AJAX endpoints
   - `doom_submit` — submit score with anti-cheat token, rate limit
   - `doom_leaderboard` — alltime (top 20) / weekly (top 10)
   - Cleanup: top 20 retained, 3-week expiry (same as snake)

## Files to Modify

1. **`include/config.php`** — Add "Doom FPS" to PAGES array:
   ```php
   'Doom FPS' => [
       'template'  => 'template/page/doom.php',
       'dependent' => [
           'styles'  => ['/common/doom/doom.css'],
           'scripts' => ['/common/doom/doom.js'],
       ]
   ]
   ```

2. **`include/themes/theme.php`** — Add includes:
   ```php
   include_once $root . '/include/doom/install.php';
   include_once $root . '/include/doom/api.php';
   ```

3. **`include/themes/load.php`** — Add inline var injection for Doom:
   ```php
   if ( $key === 'Doom FPS' ) {
       $doom_salt = md5('doom_' . date('Y-m-d') . '_' . wp_salt('auth'));
       wp_add_inline_script($key, 'window.DOOM_DAY_SALT="'.$doom_salt.'";window.DOOM_AJAX="'.admin_url('admin-ajax.php').'";', 'before');
   }
   ```

4. **`README.md`** — Add Doom FPS entry to changelog

## Implementation Order

1. **Raycasting engine** — walls rendering, player movement, collision detection
2. **Map design** — create the 24x24 map layout
3. **Weapon system** — 3 weapons, shooting, ammo
4. **Enemy system** — sprites, AI state machine, combat
5. **HUD** — health, ammo, minimap, crosshair
6. **Game states** — menu, playing, win, gameover overlays
7. **Backend** — DB, API, leaderboard (copy-paste from snake, adjust fields)
8. **Integration** — config.php, theme.php, load.php, template
9. **Mobile controls** — virtual joystick + buttons
10. **Polish** — sound effects (optional), README update

## Verification
1. Create WP page with "Doom FPS" template → visit as guest → game loads
2. Enter name → start → WASD movement works, walls render correctly
3. Find and pick up weapons → ammo shows in HUD
4. Enemies patrol, detect player, combat works
5. Kill enemies → find exit → win screen → score submitted → appears in leaderboard
6. Test alltime/weekly leaderboard tabs
7. Test mouse pointer lock for smooth rotation
8. Verify on mobile with virtual controls
