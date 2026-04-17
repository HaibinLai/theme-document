# Technical Documentation

This document covers the technical details of custom features added to the Document WordPress theme.

---

## Table of Contents

1. [My Corner (Navigation Page)](#1-my-corner-navigation-page)
2. [Clipboard Helper](#2-clipboard-helper)
3. [Snake Game](#3-snake-game)
4. [Architecture Overview](#4-architecture-overview)

---

## 1. My Corner (Navigation Page)

A card-grid navigation page where administrators can manage links to various tools and pages.

### Files

| File | Purpose |
|------|---------|
| `template/page/toys.php` | Page template (Template Name: "My Corner") |
| `include/functions/toys.php` | AJAX backend for CRUD + reorder |

### Data Storage

Stored in `wp_options` table as a serialized array under the key `nicen_theme_toys`.

Each item structure:
```php
[
    'name'       => 'Todo List',      // Display name
    'icon'       => '🐧',            // Emoji, image URL, or media library URL
    'desc'       => 'Description',    // Card description
    'url'        => '/index.php/todo-list/', // Relative path or full URL
    'admin_only' => true              // Visibility: admin-only or public
]
```

### AJAX Endpoint

**Action**: `toys_manage` (admin-only, requires `administrator` capability)

| Operation | Parameters | Description |
|-----------|-----------|-------------|
| `add` | name, icon, desc, url, admin_only | Add a new card |
| `update` | index, name, icon, desc, url, admin_only | Update existing card |
| `delete` | index | Remove a card |
| `reorder` | order (array of indices) | Reorder cards via drag-and-drop |

### Security

- **Authentication**: `current_user_can('administrator')` check
- **CSRF**: WordPress nonce verification (`toys_nonce`)
- **Input sanitization**: All fields pass through `sanitize_text_field()`
- **URL injection prevention**: `javascript:` protocol explicitly blocked via regex
- **XSS prevention**: Icon output uses `esc_html()` for non-image icons, `esc_url()` for image sources

### Frontend Features

- **Card grid**: CSS Grid with `auto-fill`, minimum 180px per card
- **Icon types**: Emoji text (rendered directly), image URL or media library (rendered as `<img>`)
- **Link handling**: Relative paths use site URL prefix; external URLs (starting with `http`) open in `target="_blank"`
- **Admin UI**: Right-click card to edit, "+" card to add, drag-and-drop reorder (HTML5 DnD API)
- **Modal**: Add/Edit/Delete dialog, closeable only via buttons (not overlay click)
- **Media library**: WordPress `wp.media` integration for icon image upload
- **Admin-only badge**: Lock icon displayed on cards with `admin_only: true`
- **URL storage**: Original URL stored in `data-url` attribute to avoid extraction issues with `href`
- **Fallback**: Non-admin users with no visible cards receive a 404 response

---

## 2. Clipboard Helper

A two-part system: a global silent copy listener across all pages, plus a dedicated management page.

### Files

| File | Purpose |
|------|---------|
| `template/page/clipboard.php` | Management page template (Template Name: "Clipboard") |
| `include/clipboard/install.php` | Database table creation |
| `include/clipboard/api.php` | AJAX endpoints |
| `common/clipboard/clipboard-listener.js` | Global copy event listener (all pages) |
| `common/clipboard/clipboard.js` | Management page logic |
| `common/clipboard/clipboard.css` | Management page styles |

### Database Schema

**Table**: `{prefix}_document_clipboard`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT (PK, auto-increment) | Record ID |
| `user_id` | BIGINT | WordPress user ID |
| `type` | VARCHAR(10), default `'text'` | Entry type: `text` or `file` |
| `content` | LONGTEXT | Text content or file description |
| `filename` | VARCHAR(255) | Original filename (files only) |
| `filepath` | VARCHAR(500) | Server path to uploaded file |
| `filesize` | BIGINT | File size in bytes |
| `created_at` | DATETIME | Timestamp |

**Indexes**: `idx_user_id`, `idx_created`, `idx_type`

Table is created on theme activation (`after_switch_theme`) and verified on every `init` hook.

### AJAX Endpoints

All endpoints require login (`wp_ajax_` only, no `wp_ajax_nopriv_`).

| Action | Description |
|--------|-------------|
| `clipboard_save` | Save text (max 1MB), with 3-second deduplication window |
| `clipboard_upload` | Upload file (max 10MB), stored in `wp-uploads/clipboard/{user_id}/` |
| `clipboard_list` | Paginated list (50/page) with search and type filter |
| `clipboard_delete` | Delete single entry (own only) + remove file from disk |
| `clipboard_clear` | Delete all entries for current user + all user files |

### Global Copy Listener (`clipboard-listener.js`)

Loaded site-wide for logged-in users via `wp_enqueue_script` in `include/themes/load.php`.

**Behavior**:
1. Listens to `document` `copy` event
2. Reads selected text via `window.getSelection()`
3. Ignores selections shorter than 3 characters
4. Debounced at 100ms to prevent rapid-fire saves
5. Saves to both `localStorage` (max 100 entries, key: `clipboard_history`) and server via AJAX
6. Displays floating toast notification ("Saved: preview...") that auto-dismisses after 2 seconds

**Configuration**: `window.CLIPBOARD_AJAX` is injected via `wp_add_inline_script` pointing to `admin-ajax.php`.

### Management Page (`clipboard.js`)

- **Text input**: Textarea with Ctrl+Enter to save
- **File upload**: Drag-and-drop zone + click to browse, XHR upload with progress bar
- **List rendering**: Chronological list with type badges (green=text, blue=file)
- **Search**: Real-time search with 300ms debounce
- **Type filter**: All / Text / Files tabs
- **Pagination**: Smart ellipsis when pages > 7
- **Copy to clipboard**: `navigator.clipboard.writeText()` with `document.execCommand('copy')` fallback
- **Expandable text**: Content >300 chars is truncated with expand/collapse toggle
- **File icons**: Maps ~30 file extensions to emoji icons
- **Relative time**: "just now", "Xm ago", "Xh ago", etc.

### Data Retention

- **Auto-cleanup**: Max 200 entries per user; oldest entries beyond 200 are deleted (including associated files)
- **Upload directory**: `wp-content/uploads/clipboard/{user_id}/`, protected with `.htaccess` (`Options -Indexes`)
- **File size limit**: 10MB per file, enforced server-side

---

## 3. Snake Game

A canvas-based snake game with permanent leaderboard, open to all visitors without login.

### Files

| File | Purpose |
|------|---------|
| `template/page/snake.php` | Page template (Template Name: "Snake Game") |
| `include/snake/install.php` | Database table creation |
| `include/snake/api.php` | AJAX endpoints + cleanup logic |
| `common/snake/snake.js` | Game engine + UI logic (~550 lines) |
| `common/snake/snake.css` | Layout + leaderboard styles |

### Database Schema

**Table**: `{prefix}_document_snake_scores`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT (PK, auto-increment) | Record ID |
| `player_name` | VARCHAR(50) | Player's display name |
| `score` | INT | Number of food items eaten |
| `duration` | INT | Game duration in seconds |
| `created_at` | DATETIME | Timestamp |

**Indexes**: `idx_score` (score DESC), `idx_created` (created_at)

### AJAX Endpoints

Both endpoints are public (`wp_ajax_` + `wp_ajax_nopriv_`), no login required.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `snake_submit` | name, score, duration, token | Submit a score with anti-cheat validation |
| `snake_leaderboard` | type (`alltime` / `weekly`) | Get top scores (alltime=20, weekly=10) |

### Anti-Cheat System

A token-based validation prevents trivial score forgery:

**Token generation flow**:
```
Daily salt (PHP):  'snake_' + date('Y-m-d') + '_' + wp_salt('auth')
Hashed salt:       md5(daily_salt)  →  32-char hex string (safe for JS injection)
Token:             md5(score + '_' + duration + '_' + hashed_salt)
```

**Client side**: `window.SNAKE_DAY_SALT` is injected as the pre-hashed salt via `wp_add_inline_script()` in `include/themes/load.php`. The JS computes `md5(score + '_' + duration + '_' + SNAKE_DAY_SALT)` using a built-in MD5 implementation.

**Server side**: `api.php` recomputes `md5($score . '_' . $duration . '_' . md5(document_snake_salt()))` and compares.

**Why pre-hash the salt**: `wp_salt('auth')` contains special characters (quotes, backslashes) that get corrupted by `esc_js()` when injected into JavaScript. By hashing the salt first with MD5, only safe hex characters (`0-9a-f`) are passed to the client.

**Rate limiting**: 1 submission per 5 seconds per IP, enforced via WordPress transients.

### Data Retention & Cleanup

Cleanup runs automatically after each score submission (`document_snake_cleanup()`):

| Rule | Description |
|------|-------------|
| **All-time top 20** | Only the top 20 scores (by score DESC, duration ASC) are kept. All others are deleted. |
| **3-week expiry** | Records older than 3 weeks are automatically deleted. |
| **Weekly display** | The weekly leaderboard shows only the top 10 scores from the last 7 days. |

Cleanup logic handles ties correctly by selecting the top 20 row IDs explicitly and deleting everything not in that set.

### Game Engine (`snake.js`)

**Architecture**: Single IIFE, vanilla JavaScript (ES5 compatible), no dependencies.

**Grid**: 20×20 cells on a 400×400 canvas.

**Game states**: `START` → `PLAYING` → `GAMEOVER`

**Rendering** (Canvas 2D):
- Dark background (`#1a1a2e`) with subtle grid lines
- Snake body: circles with HSL gradient (head = bright green, fades toward tail)
- Snake head: directional eyes + glow effect (shadow blur)
- Food: pulsating red-orange radial gradient with glow animation
- Particle system: 12 particles burst on food consumption, red-orange hue, fade out over time

**Movement**:
- Game loop via `requestAnimationFrame` with tick-based updates
- Speed starts at 150ms/tick, decreases by 3ms per food eaten, minimum 60ms
- **Wall wrap-around**: snake passes through walls and appears on the opposite side (no wall death)
- Self-collision: game over

**Controls**:
- Keyboard: Arrow keys + WASD
- Mobile: Touch swipe with 20px dead zone
- Direction guard: cannot reverse into opposite direction (e.g., moving right, can't press left)

**Player name**: Persisted in `localStorage` across sessions.

**Leaderboard UI**:
- Two tabs: "All Time" and "This Week"
- Top 3 entries get medal emojis (gold/silver/bronze)
- Current player's entries highlighted
- Auto-refreshed after each game over + on tab switch

**AJAX configuration**: `window.SNAKE_AJAX` injected via `wp_add_inline_script`. Fallback: `window.HOME + '/wp-admin/admin-ajax.php'` or `/wp-admin/admin-ajax.php`.

### CSS Layout

- Flex layout: game area (left) + leaderboard panel (right), max-width 1000px
- Score bar: theme color background, flex row with score + time
- Canvas: dark background, rounded corners, box shadow
- Overlays: semi-transparent black backdrop, centered content with blur effect
- Leaderboard: scrollable list (max-height 420px), themed tab buttons
- Medal row colors: gold (#fff8e1), silver (#f5f5f5), bronze (#fff3e0)
- Responsive: stacks vertically at ≤720px

---

## 4. Architecture Overview

### Template Registration

Templates are **not** auto-scanned by WordPress. They are registered in the `PAGES` constant in `include/config.php`:

```php
'Snake Game' => [
    'template'  => 'template/page/snake.php',
    'dependent' => [
        'styles'  => ['/common/snake/snake.css'],
        'scripts' => ['/common/snake/snake.js'],
    ]
]
```

The `nicen_theme_load_source()` function in `include/themes/load.php` iterates over `PAGES`, detects the current page template via `get_page_template_slug()`, and enqueues the matching CSS/JS dependencies.

### Resource Loading (`include/themes/load.php`)

| Context | Resources Loaded |
|---------|-----------------|
| All pages | jQuery, enquire.js, main-sub.js, main.js, style.css |
| Single post | viewer.js, prism.js (code highlighting), prism.css, viewer.css |
| Homepage | swiper bundle, homepage carousel CSS/JS |
| Logged-in users | `clipboard-listener.js` + `CLIPBOARD_AJAX` inline var |
| Snake Game template | `SNAKE_DAY_SALT` + `SNAKE_AJAX` inline vars (injected before game script) |
| All page templates | Dependent CSS/JS from `PAGES` config |

### Inline JavaScript Injection

Several features inject configuration via `wp_add_inline_script()`:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `window.ROOT` | Global | Theme directory URL |
| `window.HOME` | Global | Site home URL |
| `window.CLIPBOARD_AJAX` | Logged-in users | `admin-ajax.php` URL for clipboard |
| `window.SNAKE_DAY_SALT` | Snake Game page | Pre-hashed daily salt for anti-cheat token |
| `window.SNAKE_AJAX` | Snake Game page | `admin-ajax.php` URL for snake endpoints |
| `window.Current` | Single posts/pages | Current post ID |
| `window._ts` | Single posts/pages | Server timestamp |

### Database Tables

All custom tables are created on theme activation and verified on `init`:

| Table | Module | Public Access |
|-------|--------|--------------|
| `wp_document_clipboard` | Clipboard | No (login required) |
| `wp_document_snake_scores` | Snake Game | Yes (guests can submit/view) |

### Security Summary

| Feature | Auth | CSRF | Input Sanitization | Anti-Abuse |
|---------|------|------|--------------------|------------|
| My Corner | Admin only | WP nonce | `sanitize_text_field()`, `javascript:` block | N/A |
| Clipboard | Login required | None (login-gated) | `sanitize_text_field()`, `sanitize_file_name()` | 200 entry limit, 10MB file limit, dedup |
| Snake Game | Public | Anti-cheat token (MD5) | Name: 20 char limit; Score: 0-9999 | Rate limit: 1 submit/5s per IP, top 20 retention |

### Theme Inclusion Chain

```
functions.php
  └── include/themes/theme.php
        ├── include/clipboard/install.php   (DB setup)
        ├── include/clipboard/api.php       (AJAX handlers)
        ├── include/snake/install.php        (DB setup)
        └── include/snake/api.php            (AJAX handlers)
```
