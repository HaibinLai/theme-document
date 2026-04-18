# CLAUDE.md - Document WordPress Theme

## 项目概述

这是一个 WordPress 博客主题（Document），基于文档类型设计，方便记录和查询学习笔记。

- **类型**: WordPress 主题
- **版本**: 1.5.1
- **版本号位置**: `style.css` (第8行) 和 `include/config.php` (`DOCUMENT_VERSION` 常量)，两处必须同步修改

## 项目结构

```
├── style.css / style.scss       # 主样式（WordPress 主题入口）
├── functions.php                # 主题初始化，加载所有 include
├── header.php / footer.php      # 全局头尾模板
├── index.php / single.php / page.php / 404.php  # 页面模板
├── include/
│   ├── config.php               # 主题版本号、后台设置表单定义、所有配置项默认值
│   ├── themes/
│   │   ├── load.php             # ★ 前端资源加载（JS/CSS enqueue）核心文件
│   │   ├── theme.php            # 主题钩子入口，include 所有子模块
│   │   ├── shortcode.php        # 短标签
│   │   └── ...
│   ├── admin/                   # 后台相关（设置页面、编辑器插件）
│   ├── functions/               # 通用函数、SMTP、初始化
│   ├── widget/                  # 侧边栏小部件
│   ├── todo/ clipboard/ snake/ doom/  # 各功能模块的数据库和API
│   └── ...
├── common/
│   ├── main.js                  # 前端主逻辑
│   ├── inline/                  # 各页面内联脚本（emoji, index, monitor, view 等）
│   ├── prism/                   # 代码高亮（Prism.js）
│   ├── viewer/                  # 图片灯箱（Viewer.js）
│   ├── plugins/                 # TinyMCE 编辑器插件
│   ├── todo/ clipboard/ snake/ doom/ friend/ swiper/ widget/  # 各功能模块前端
│   └── admin/                   # 后台前端（Vue + Ant Design）
├── assets/theme/                # 第三方库（jQuery, Swiper, Vue, Ant Design, Moment, Axios）
├── template/                    # 模板片段（文章列表、分页、页面模板等）
├── build.js                     # ★ 前端构建脚本（esbuild 压缩）
└── package.json                 # Node.js 依赖（仅 esbuild）
```

## 构建流程

### 重要：修改 JS 或 CSS 后必须重新构建

本主题使用 esbuild 将所有前端 JS/CSS 压缩为 `.min.js` / `.min.css` 文件。WordPress 生产环境加载的是压缩版。

```bash
# 首次使用需安装依赖
npm install

# 构建（压缩所有 JS/CSS，约1秒完成）
node build.js
```

### 构建机制说明

- `build.js` 读取所有前端 JS/CSS 源文件，用 esbuild 压缩后输出为同目录下的 `.min.js` / `.min.css`
- `include/themes/load.php` 中的 `nicen_theme_min_path()` 函数自动检测 `.min` 文件是否存在：
  - 存在 → 加载压缩版（生产环境）
  - 不存在 → 回退到原版（开发调试）
- **只修改源文件**（如 `common/main.js`），**不要手动编辑** `.min.js` 文件

### 什么时候需要构建

- 修改了 `common/` 下的任何 `.js` 文件 → 需要 `node build.js`
- 修改了 `style.css` → 需要 `node build.js`
- 修改了 `.php` 文件 → **不需要**构建
- 新增了 JS/CSS 文件 → 需要在 `build.js` 的文件列表中添加该文件，然后构建

## 开发规范

### 文件修改后的完整流程

1. 修改源文件（`.js` / `.css` / `.php`）
2. 如果改了 JS 或 CSS：运行 `node build.js`
3. 确认 `.min` 文件已更新
4. 提交所有文件（包括源文件和 `.min` 文件）

### 版本号更新

需要同时修改两处：
- `style.css` 头部注释中的 `Version:` 字段
- `include/config.php` 中的 `DOCUMENT_VERSION` 常量

### 新增页面模板

在 `include/config.php` 的 `PAGES` 常量中添加配置，包括模板文件路径和依赖的样式/脚本。

### 资源加载

- 前端资源加载集中在 `include/themes/load.php`
- 后台资源加载在 `include/admin/load.php`
- 页面模板的资源通过 `PAGES` 配置自动加载

### 注意事项

- jQuery 是全局依赖，`window.$ = jQuery` 已在 inline script 中设置
- 后台使用 Vue 2 + Ant Design，前端不使用
- 主题配置通过 `nicen_theme_config('key', false)` 读取
- 主题色等样式变量通过 CSS 变量注入（`include/themes/load.php` 底部的 inline style）
