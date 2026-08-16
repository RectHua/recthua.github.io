/* ============================================================
   全站搜索索引生成脚本（一次性工具）
   ------------------------------------------------------------
   用法：node gen-search-index.js
   读取 index.html / page2.html 的正文结构 + assets/i18n.js 的
   英文翻译，生成 assets/search-index.js（中英双语索引）。
   索引粒度：每个标题（h2/h3/h4）为一条，text 为该标题到下一个
   同级/更高级标题之间所有正文的拼接文本。
   特殊处理：容器型标题（如 .appendix 内嵌 h2）也识别为一组。
   ============================================================ */
"use strict";
const fs = require("fs");

/* ---------- 解析 i18n.js 字典（key -> 英文文本） ---------- */
const i18nSrc = fs.readFileSync("assets/i18n.js", "utf8");
const dict = {};
const dictRe = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/gm;
let dm;
while ((dm = dictRe.exec(i18nSrc))) dict[dm[1]] = dm[2];

/* ---------- 标签栈解析：提取 article 的直接子节点 ---------- */
const VOID = new Set(["img", "br", "hr", "meta", "link", "input", "source", "wbr"]);
function parseTopLevel(inner) {
    const re = /<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
    const stack = [];
    const tops = [];
    let m;
    while ((m = re.exec(inner))) {
        const name = m[1].toLowerCase();
        const isClose = m[0][1] === "/";
        const selfClose = /\/>$/.test(m[0]) || VOID.has(name);
        if (selfClose) {
            if (stack.length === 0) tops.push({ tag: name, open: m.index, close: m.index, end: re.lastIndex, self: true });
            continue;
        }
        if (!isClose) {
            if (stack.length === 0) tops.push({ tag: name, open: m.index, close: null, end: re.lastIndex });
            stack.push(name);
        } else {
            stack.pop();
            if (stack.length === 0) {
                const t = tops[tops.length - 1];
                if (t && !t.close) t.close = m.index;
            }
        }
    }
    return tops;
}

/* ---------- 按标题分组（标题 / 容器型标题开组） ---------- */
function groupByHeadings(tops, articleHtml) {
    const groups = [];
    let pending = [];
    let cur = null;
    for (const t of tops) {
        const isHeading = /^h[234]$/.test(t.tag);
        // 容器型标题：首个元素子节点是 h2/h3/h4（如 .appendix 内嵌 h2）
        let innerHeading = null;
        if (!isHeading && !t.self && t.close > t.end) {
            const im = articleHtml.slice(t.end, t.close).match(/<(h[234])\b/);
            if (im) innerHeading = im[1];
        }
        if (isHeading || innerHeading) {
            cur = {
                tag: isHeading ? t.tag : innerHeading,
                open: t.open,
                close: t.close,
                inner: !isHeading,
                nodes: pending.concat([t])
            };
            pending = [];
            groups.push(cur);
        } else if (cur) {
            cur.nodes.push(t);
            if (t.close > cur.close) cur.close = t.close; // 组范围延伸到内容末尾
        } else {
            pending.push(t);
        }
    }
    if (pending.length) {
        if (groups.length) {
            groups[groups.length - 1].nodes = groups[groups.length - 1].nodes.concat(pending);
            groups[groups.length - 1].close = Math.max(groups[groups.length - 1].close, pending[pending.length - 1].close);
        } else {
            groups.push({ tag: null, open: -1, close: -1, nodes: pending });
        }
    }
    return groups;
}

/* ---------- 从片段中提取标题信息（标题 or 容器内第一个标题） ---------- */
function extractHeading(seg, tag, isInner) {
    let headSeg = seg;
    if (isInner) {
        // 容器型：取内部第一个标题标签的完整片段
        const m = seg.match(/<(h[234])\b([^>]*)>([\s\S]*?)<\/\1>/);
        if (!m) return null;
        headSeg = m[0];
    }
    const id = (headSeg.match(/\sid="([^"]+)"/) || [])[1] || "";
    const key = (headSeg.match(/data-i18n="([^"]+)"/) || [])[1] || null;
    // 标题文本：open 标签结束后的第一个文本节点
    // （切片可能含闭合标签，也可能不含，因此从 <hN> 后取到下一个 < 为止）
    const titleZh = (headSeg.match(/<h[234][^>]*>([^<]*)/) || [])[1] || "";
    return { id: id, key: key, titleZh: titleZh.trim() };
}

/* ---------- 提取片段内所有 data-i18n 叶文本（zh） ---------- */
function collectLeafTexts(seg) {
    const leaves = [];
    // 文本到下一个 < 或切片末尾为止（兼容切片不含闭合标签的情况）
    const re = /data-i18n="([^"]+)"[^>]*>([^<]*)(?:<|$)/g;
    let m;
    while ((m = re.exec(seg))) {
        const text = m[2].trim();
        if (text) leaves.push({ key: m[1], zh: text });
    }
    return leaves;
}

/* ---------- 处理单个页面 ---------- */
function buildPageIndex(file, titleKey) {
    const html = fs.readFileSync(file, "utf8");
    // 页面标题（zh / en）
    const titleZh = (html.match(/<title[^>]*data-i18n="[^"]*"[^>]*>([^<]*)<\/title>/) || [])[1]
        || (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || "";
    const titleEn = dict[titleKey] || titleZh;

    const articleHtml = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)[1];
    const tops = parseTopLevel(articleHtml);
    const groups = groupByHeadings(tops, articleHtml);

    const items = [];
    groups.forEach(function (g) {
        if (!g.tag) return;
        const headSeg = articleHtml.slice(g.open, g.close);
        const info = extractHeading(headSeg, g.tag, g.inner);
        if (!info || (!info.id && !info.titleZh)) return;

        // 组内全部内容（标题起，到组末尾）
        const segAll = articleHtml.slice(g.open, g.close);
        const leaves = collectLeafTexts(segAll);
        const textZh = leaves.map(l => l.zh).join(" ");
        const textEn = leaves.map(l => dict[l.key] || l.zh).join(" ");

        items.push({
            id: info.id,
            level: g.tag === "h2" ? 1 : g.tag === "h3" ? 2 : 3,
            titleZh: info.titleZh,
            titleEn: info.key && dict[info.key] ? dict[info.key].trim() : info.titleZh,
            textZh: textZh,
            textEn: textEn
        });
    });

    return { title: { zh: titleZh.trim(), en: titleEn.trim() }, items: items };
}

/* ---------- 组装并输出 ---------- */
const index = {
    "index.html": buildPageIndex("index.html", "meta.title.ch1"),
    "page2.html": buildPageIndex("page2.html", "meta.title.ch2")
};

const out = "/* ============================================================\n"
    + "   全站搜索索引（由 gen-search-index.js 自动生成，请勿手改）\n"
    + "   结构：{ 页面文件: { title: {zh,en}, items: [{id, level,\n"
    + "   titleZh, titleEn, textZh, textEn}] } }\n"
    + "   ============================================================ */\n"
    + "const SEARCH_INDEX = " + JSON.stringify(index) + ";\n";

fs.writeFileSync("assets/search-index.js", out, "utf8");
console.log("search-index.js 已生成，条目数：index.html=" + index["index.html"].items.length
    + "，page2.html=" + index["page2.html"].items.length);
