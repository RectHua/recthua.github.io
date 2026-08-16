const fs = require('fs');

// 收集 HTML 中出现的所有类名与 id、data-* 属性键
const htmlAll = fs.readFileSync('index.html', 'utf8') + '\n' + fs.readFileSync('page2.html', 'utf8');
const usedClasses = new Set();
let m;
const clsRe = /class="([^"]+)"/g;
while ((m = clsRe.exec(htmlAll))) m[1].split(/\s+/).forEach(c => { if (c) usedClasses.add(c); });

// JS 中动态使用的类（classList / className / querySelector 类名 / dataset.sectionId 等）
const jsAll = fs.readFileSync('assets/main.js', 'utf8') + '\n' + fs.readFileSync('assets/lightbox.js', 'utf8');
const jsClasses = new Set();
const jsRe = /(?:classList\.(?:add|remove|toggle)\("([^"]+)"|className\s*=\s*"([^"]+)"|querySelector(?:All)?\s*\(\s*"\.([A-Za-z][\w-]*))|createElement\("([^"]+)"\)/g;
let jm;
while ((jm = jsRe.exec(jsAll))) {
  [jm[1], jm[2], jm[3]].forEach(c => { if (c) c.split(/\s+/).forEach(x => { if (x) jsClasses.add(x); }); });
}

// 提取 CSS 中所有类选择器（.name 形式）
const css = fs.readFileSync('assets/main.css', 'utf8');
const cssClasses = new Map(); // 类名 -> 出现位置（用于定位）
const cssRe = /\.([a-zA-Z][\w-]*)/g;
let cm;
while ((cm = cssRe.exec(css))) {
  if (!cssClasses.has(cm[1])) cssClasses.set(cm[1], []);
  cssClasses.get(cm[1]).push(cm.index);
}

// 找出 HTML 未使用、JS 未使用、且非 CSS 组合中其他类的"疑似冗余"
const unused = [];
for (const [cls, positions] of cssClasses) {
  if (usedClasses.has(cls) || jsClasses.has(cls)) continue;
  // 再检查是否是 CSS 内部其他选择器的组成部分（如 .toc-link.active 中的 active 已被 JS 使用；.hero-banner img 中 hero-banner 在 HTML）
  // 已通过 usedClasses/jsClasses 覆盖，这里剩余的就是可疑的
  unused.push(cls);
}

console.log('CSS 类总数:', cssClasses.size);
console.log('HTML 使用:', usedClasses.size, '| JS 动态:', [...jsClasses].join(', '));
console.log('');
console.log('疑似冗余类（HTML/JS 均未直接使用）:');
console.log(unused.sort().join('  ') || '(无)');
