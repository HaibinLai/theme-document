# jQuery 冲突修复指南

## 问题描述

你的 WordPress 主题同时加载了：
- WordPress 自带的 jQuery 3.7.1（正确）
- 某个插件/主题引入的 jQuery 1.6.2（错误，导致 `.on()` 方法不可用）

## 已完成的修复

### 1. ✅ 修复了 `main.js` 404 错误

**问题：** `functions.php` 中路径错误
- 错误路径：`/js/main.js`
- 正确路径：`/common/main.js`

**修复：** 已在 `functions.php` 中更正路径

### 2. ✅ 添加了强制移除旧版 jQuery 的函数

**位置：** `functions.php` 中的 `remove_old_jquery_conflicts()` 函数

**功能：**
- 在所有脚本加载前（优先级 1）移除旧版 jQuery
- 确保只使用 WordPress 自带的 jQuery

## 下一步操作

### 方法一：使用诊断工具定位问题源（推荐）

1. **访问诊断工具：**
   ```
   你的网站地址/wp-content/themes/theme-document/diagnose-jquery.php
   ```

2. **查看结果：**
   - 检查哪些脚本标记为"可疑"
   - 查看 jQuery 版本检测结果

3. **定位问题源：**
   - 打开浏览器 F12 → Network 标签
   - 搜索 `jquery-1.6.2`
   - 点击该请求，查看 "Initiator"（发起者）
   - 找到是哪个插件/主题文件引入的

4. **删除诊断工具：**
   ```bash
   rm diagnose-jquery.php
   ```

### 方法二：手动排查插件

1. **禁用所有插件：**
   - WordPress 后台 → 插件 → 已安装的插件
   - 逐个禁用插件，刷新页面
   - 检查 F12 Console 是否还有 jQuery 1.6.2

2. **找到问题插件后：**
   - 更新该插件到最新版本
   - 或寻找替代插件
   - 或联系插件开发者

### 方法三：强制移除（已在 functions.php 中实现）

`functions.php` 中已添加 `remove_old_jquery_conflicts()` 函数，它会：
- 在所有脚本加载前移除旧版 jQuery
- 确保只使用 WordPress 自带的 jQuery

**如果问题仍然存在：**

可能需要检查是否有插件通过 `wp_head` 或 `wp_footer` 直接输出 `<script>` 标签。这种情况下，可以：

1. **在主题的 `header.php` 或 `footer.php` 中添加：**
   ```php
   <?php
   // 移除直接输出的旧版 jQuery
   remove_action('wp_head', 'some_function_that_outputs_jquery');
   remove_action('wp_footer', 'some_function_that_outputs_jquery');
   ?>
   ```

2. **或使用 JavaScript 在页面加载后移除：**
   在 `functions.php` 中添加：
   ```php
   function remove_old_jquery_script_tag() {
       ?>
       <script>
       (function() {
           var scripts = document.querySelectorAll('script[src*="jquery"][src*="1.6"]');
           scripts.forEach(function(script) {
               script.remove();
           });
       })();
       </script>
       <?php
   }
   add_action('wp_head', 'remove_old_jquery_script_tag', 999);
   ```

## 验证修复

修复后，检查以下内容：

1. **F12 Console：**
   - 不应该再有 `$(...).on is not a function` 错误
   - 不应该再有 `main.js:1 404` 错误

2. **Network 标签：**
   - 不应该再有 `jquery-1.6.2.min.js` 的请求
   - `main.js` 应该成功加载（状态码 200）

3. **功能测试：**
   - 侧边栏应该正常显示
   - 其他使用 jQuery 的功能应该正常工作

## 常见问题

### Q: 修复后侧边栏还是不显示？

A: 
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 清除 WordPress 缓存（如果有缓存插件）
3. 检查 `monitor.js` 是否正确加载（侧边栏可能需要它）
4. 检查主题设置中是否启用了侧边栏显示

### Q: 修复后其他功能出问题了？

A: 
1. 检查是否有其他插件依赖旧版 jQuery
2. 如果有，需要更新那些插件或寻找替代方案
3. 可以临时注释掉 `remove_old_jquery_conflicts()` 函数，先定位问题

### Q: 如何确认 jQuery 版本？

A: 在浏览器 Console 中输入：
```javascript
jQuery.fn.jquery
// 或
$.fn.jquery
```
应该显示 3.x 版本，而不是 1.6.2

## 注意事项

⚠️ **重要：**
- 诊断完成后，务必删除 `diagnose-jquery.php` 文件
- 修改 `functions.php` 前，建议先备份
- 如果使用子主题，请在子主题的 `functions.php` 中添加修复代码

## 相关文件

- `functions.php` - 已添加修复代码
- `diagnose-jquery.php` - 诊断工具（使用后请删除）
- `include/themes/load.php` - 主题原有的脚本加载函数
