# Document - WordPress Blog Theme

A documentation-style WordPress blog theme for recording and searching study notes.

**Version:** 1.6.0 | **License:** GPL v2+ | **Original Author:** [友人a丶](https://nicen.cn/) | **Current Maintainer:** Haibin

## Installation

1. Download this repository
2. Upload to `/wp-content/themes/` on your WordPress server
3. Activate in WordPress admin panel
4. Configure via admin menu **Theme Options**

```bash
# First-time setup (for development)
npm install

# Build minified JS/CSS (~1 second)
node build.js
```

## Features

- Article directory navigation with scroll sync
- Dark / light mode with system preference auto-follow
- Theme color picker
- Code highlighting (Prism.js) with copy button
- Image lightbox (Viewer.js)
- Responsive layout (mobile / tablet / desktop)
- Comment system with anti-spam protection
- SMTP email notifications
- SEO: TDK, Open Graph, structured data
- `<details>` / `<summary>` collapsible sections
- Obsidian-style image sizing

### Shortcodes

| Shortcode | Description |
|-----------|-------------|
| `[runcode lang="python"]` | Executable code blocks (Python via Pyodide, JS, HTML) |
| `[3d]` | 3D model viewer (model-viewer web component) |
| `[plot3d]` | Interactive 3D plots (Plotly.js) |
| `[compare before="a.jpg" after="b.jpg"]` | Before/after image comparison slider |

### Page Templates

| Template | Description |
|----------|-------------|
| Todo | Personal task manager with drag-and-drop |
| Clipboard | Copy history manager with file upload |
| Snake Game | Classic snake game with leaderboard |
| Doom FPS | First-person shooter with raycasting engine |
| My Corner | Customizable navigation card grid |

## CI

GitHub Actions runs on every push/PR to `master`:
- **Build check** — `npm run build` (esbuild minification)
- **PHP lint** — `php -l` syntax check on all PHP files

---

## Changelog

### v1.6.0 (2026-05-01)

- Dark mode: fix FOUC flash, add system preference auto-follow, replace 21+ hardcoded colors with CSS variables, add mobile toggle button
- Comment anti-spam: honeypot, time check, rate limit, content filter
- `<details>` / `<summary>`: fix content padding, dark mode, add table/img/hr/link styles
- Code blocks: improve copy button visibility and dark mode support
- Remove dislike button from posts
- Obsidian-style image sizing support
- Doom FPS: Level 2, new weapons (sniper, M4A1, grenades), coin counter, bilingual toggle
- Performance: all frontend JS moved to footer with `defer`

### Post v1.6.0 (latest)

- Add `[3d]` shortcode — 3D model viewer with model-viewer web component
- Add `[plot3d]` shortcode — interactive 3D plot viewer with Plotly.js
- Add `[compare]` shortcode — before/after image comparison slider
- Fix dark mode flash on page navigation (critical CSS + meta theme-color fix)
- Add GitHub Actions CI (build check + PHP lint)

### v1.5.1 (2026-04-18)

Introduced esbuild build pipeline, reducing page load size by ~206 KB (~40-50%). Added `nicen_theme_min_path()` for automatic minified file detection with fallback.

### v1.4.x and earlier

<details>
<summary>Click to expand earlier changelog</summary>

#### 2026-04-17

- Todo page template: CRUD, priority, due dates, drag-and-drop, localStorage + MySQL sync
- My Corner navigation page: card grid, admin-only cards, emoji/image icons
- Clipboard tool: auto-capture Ctrl+C, file upload, search/filter
- Snake Game: gradient visuals, particle effects, leaderboard
- Security: XSS protection, anti-cheat tokens, rate limiting

#### 2026-02-27

- Image lazy loading optimization
- Firefox sidebar fix
- Security and anti-crawler improvements

#### 2026-02-08

- Word count display at article top
- `<details>` / `<summary>` collapsible section support

#### 2026-02-01

- Fix main.js 404 error, force remove old jQuery, add diagnose-jquery.php

#### 2026-01-14

- Fix sidebar dynamic update with remote images
- Full English localization of theme
- Fix navbar and content sync issues

</details>

## Development

See [CLAUDE.md](CLAUDE.md) for detailed project structure, build workflow, and development guidelines.

## Original Author

<details>
<summary>Click to expand original author's description</summary>

Original theme by [友人a丶](https://nicen.cn/)

- GitHub: [friend-nicen/theme-document](https://github.com/friend-nicen/theme-document)
- Gitee: [friend-nicen/theme-document](https://gitee.com/friend-nicen/theme-document)
- Documentation: [nicen.cn/1552.html](https://nicen.cn/1552.html)

</details>
