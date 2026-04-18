const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 需要压缩的 JS 文件
const jsFiles = [
  'common/main.js',
  'common/inline/main.js',
  'common/inline/emoji.js',
  'common/inline/index.js',
  'common/inline/monitor.js',
  'common/inline/swiper.js',
  'common/inline/view.js',
  'common/prism/prism.js',
  'common/swiper/swiper.js',
  'common/friend/friend.js',
  'common/widget/widget.js',
  'common/todo/todo.js',
  'common/clipboard/clipboard.js',
  'common/clipboard/clipboard-listener.js',
  'common/snake/snake.js',
  'common/doom/doom.js',
  'assets/theme/enquire.js',
];

// 需要压缩的 CSS 文件
const cssFiles = [
  'style.css',
  'common/prism/prism.css',
  'common/swiper/swiper.css',
  'common/friend/friend.css',
  'common/todo/todo.css',
  'common/clipboard/clipboard.css',
  'common/snake/snake.css',
  'common/doom/doom.css',
];

async function build() {
  let totalSaved = 0;

  // 压缩 JS
  for (const file of jsFiles) {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  跳过 (不存在): ${file}`);
      continue;
    }
    const ext = path.extname(file);
    const outFile = file.replace(ext, '.min' + ext);
    const originalSize = fs.statSync(fullPath).size;

    await esbuild.build({
      entryPoints: [fullPath],
      outfile: outFile,
      minify: true,
      bundle: false,
    });

    const newSize = fs.statSync(outFile).size;
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);
    totalSaved += originalSize - newSize;
    console.log(`  ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (-${saved}%)`);
  }

  // 压缩 CSS
  for (const file of cssFiles) {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  跳过 (不存在): ${file}`);
      continue;
    }
    const ext = path.extname(file);
    const outFile = file.replace(ext, '.min' + ext);
    const originalSize = fs.statSync(fullPath).size;

    await esbuild.build({
      entryPoints: [fullPath],
      outfile: outFile,
      minify: true,
      bundle: false,
      loader: { '.css': 'css' },
    });

    const newSize = fs.statSync(outFile).size;
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);
    totalSaved += originalSize - newSize;
    console.log(`  ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (-${saved}%)`);
  }

  console.log(`\n✅ 总共节省: ${(totalSaved/1024).toFixed(1)} KB`);
}

build().catch(e => { console.error(e); process.exit(1); });
