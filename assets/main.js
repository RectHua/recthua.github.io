/* ============================================================
   IR 沉浸铁路教程站 · 主交互逻辑
   ------------------------------------------------------------
   功能：
   1. 深浅色主题切换（localStorage 持久化，跟随系统偏好）
   2. 中 / 英语言切换（基于 assets/i18n.js 字典 + data-i18n 属性；
      初始化时预缓存中文原文，保证跨页面切换正常）
   3. 侧边目录自动生成 + 滚动位置高亮（IntersectionObserver）；
      目录点击平滑滚动（图片已定高，布局稳定，无需额外校准）
   4. 全站内容搜索（基于 assets/search-index.js 索引，支持中/英文关键词）
   5. 移动端目录抽屉（遮罩 + 关闭逻辑）
   6. 阅读进度条、顶栏阴影、返回顶部按钮
   ============================================================ */
(function () {
    "use strict";

    /* ------------------------------------------------------------
       0. 工具函数
       ------------------------------------------------------------ */
    /** 读取本地存储（失败时返回 null，兼容隐私模式） */
    function storageGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    /** 写入本地存储（失败时静默忽略） */
    function storageSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }

    /** 简写：获取单个元素 */
    function $(sel, root) { return (root || document).querySelector(sel); }

    const rootEl = document.documentElement; // <html> 元素

    /* ------------------------------------------------------------
       1. 主题切换
       ------------------------------------------------------------ */
    const themeToggle = $("#themeToggle");

    /**
     * 应用主题：设置 <html data-theme> 并同步按钮的无障碍状态。
     * @param {string} theme - "light" 或 "dark"
     */
    function applyTheme(theme) {
        rootEl.setAttribute("data-theme", theme);
        if (themeToggle) {
            themeToggle.setAttribute("aria-label", theme === "dark" ? "切换到浅色模式" : "切换到深色模式");
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            // 取当前主题并取反
            const next = rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
            applyTheme(next);
            storageSet("ir-theme", next);
        });
    }

    /* 若用户从未手动选择过主题，则跟随系统深浅色变化 */
    if (!storageGet("ir-theme")) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
            applyTheme(e.matches ? "dark" : "light");
        });
    }

    /* ------------------------------------------------------------
       2. 语言切换
       ------------------------------------------------------------ */
    // DeepSeek 风格分段式切换器：中文 | EN，点击对应按钮直接切换
    const localeItems = Array.prototype.slice.call(document.querySelectorAll(".locale-toggle-item"));

    /** 当前语言：从 <html data-lang> 读取（首屏脚本已设置） */
    let currentLang = rootEl.getAttribute("data-lang") === "en" ? "en" : "zh";

    /** 取元素的"原始中文"文本：首次访问时缓存到 dataset 中 */
    function getZhText(el) {
        if (!el.dataset.zh) {
            el.dataset.zh = el.textContent;
        }
        return el.dataset.zh;
    }

    /**
     * 应用语言：遍历所有带 data-i18n 的元素替换文本。
     * - en：用 I18N_DICT 中的英文替换
     * - zh：恢复 HTML 中保存的中文原文
     * 附带更新：<html lang>、<title>（title 本身带 data-i18n，会被一并处理）、
     * 分段切换器的激活态、目录文本。
     */
    function applyLang(lang) {
        currentLang = lang;
        rootEl.setAttribute("data-lang", lang);
        rootEl.setAttribute("lang", lang === "en" ? "en" : "zh-CN");

        // 收集页面中所有可翻译元素（快照，避免 NodeList 在替换中失效）
        const nodes = Array.prototype.slice.call(document.querySelectorAll("[data-i18n]"));

        nodes.forEach(function (el) {
            const key = el.dataset.i18n;
            if (lang === "en") {
                // 英文：优先取字典；字典缺项时保留原文
                el.textContent = (I18N_DICT && I18N_DICT[key]) || getZhText(el);
            } else {
                // 中文：恢复原文
                el.textContent = getZhText(el);
            }
        });

        // 分段切换器：把激活态（is-active）标记到当前语言按钮上
        localeItems.forEach(function (btn) {
            btn.classList.toggle("is-active", btn.dataset.lang === lang);
        });

        // 搜索框占位提示跟随语言（searchInput 在下方定义，运行时已初始化）
        if (typeof searchInput !== "undefined" && searchInput) {
            searchInput.placeholder = lang === "en" ? "Search site content…" : "搜索全站内容…";
            // 语言切换后重新执行当前搜索（结果语言变化）
            if (searchInput.value) runSearch(searchInput.value);
        }

        // 标题等文本变了，目录需要重新生成
        buildToc();
    }

    // 点击"中文 / EN"按钮：直接切换到对应语言（同语言时忽略）
    localeItems.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const target = btn.dataset.lang;
            if (target === currentLang) return;
            applyLang(target);
            storageSet("ir-lang", target);
        });
    });

    /* ------------------------------------------------------------
       3. 侧边目录
       ------------------------------------------------------------ */
    const article = $("#article") || $(".article"); // 优先按 id，找不到时回退到类名
    const tocList = $("#tocList");
    const HEADING_SELECTOR = "h2, h3, h4"; // 参与目录的标题级别

    /** 当前高亮标题的 id（语言切换重建目录后恢复） */
    let activeHeadingId = null;

    /**
     * 根据正文标题生成目录树并渲染。
     * 结构：h2 -> level 1，h3 -> level 2，h4 -> level 3。
     */
    function buildToc() {
        if (!article || !tocList) return;

        // 收集标题（跳过附录外的不必要项，这里全量收录 h2/h3/h4）
        const headings = Array.prototype.slice.call(article.querySelectorAll(HEADING_SELECTOR));

        // 为没有 id 的标题补一个稳定 id（锚点跳转用）
        headings.forEach(function (h, i) {
            if (!h.id) h.id = "heading-" + i;
        });

        // 清空并重新渲染目录
        tocList.innerHTML = "";
        headings.forEach(function (h) {
            const tag = h.tagName.toLowerCase();
            const level = tag === "h2" ? 1 : tag === "h3" ? 2 : 3;
            const link = document.createElement("a");
            link.className = "toc-link level-" + level;
            link.href = "#" + h.id;
            link.textContent = h.textContent.trim();
            link.dataset.target = h.id;

            // 点击目录项：平滑滚动到标题
            // （图片高度已定死，文档布局稳定，简单滚动即可精准到位）
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const target = document.getElementById(h.id);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                    // 移动端点击后自动收起抽屉
                    closeTocDrawer();
                }
            });

            tocList.appendChild(link);
        });

        // 重新挂接滚动监听
        initScrollSpy(headings);

        // 恢复之前的高亮
        if (activeHeadingId) {
            const prev = document.getElementById(activeHeadingId);
            if (prev) setActive(prev);
        }
    }

    /** 高亮指定标题对应的目录项 */
    function setActive(heading) {
        if (!heading) return;
        activeHeadingId = heading.id;
        const items = tocList.querySelectorAll(".toc-link");
        items.forEach(function (item) {
            item.classList.toggle("active", item.dataset.target === heading.id);
        });
    }

    /**
     * 滚动监听：用 IntersectionObserver 观察标题进入视口的情况，
     * 把最靠近视口顶部的可见标题设为当前高亮。
     */
    function initScrollSpy(headings) {
        // 清理旧 observer（语言切换重建时避免重复观察）
        if (window.__tocObserver) window.__tocObserver.disconnect();

        const observer = new IntersectionObserver(function (entries) {
            // 只看"正在进入视口"的标题
            const visible = entries.filter(function (e) { return e.isIntersecting; });
            if (visible.length === 0) return;

            // 选取位置最靠上（距视口顶部最近）的标题
            let best = visible[0].target;
            let bestTop = Infinity;
            visible.forEach(function (e) {
                const top = e.boundingClientRect.top;
                if (top < bestTop) { bestTop = top; best = e.target; }
            });
            setActive(best);
        }, {
            // 顶部预留顶栏高度，底部预留 40% 视口
            rootMargin: "-64px 0px -40% 0px",
            threshold: 0
        });

        headings.forEach(function (h) { observer.observe(h); });
        window.__tocObserver = observer;

        // 初始：高亮第一个标题
        if (headings.length) setActive(headings[0]);
    }

    /* ------------------------------------------------------------
       4. 移动端目录抽屉
       ------------------------------------------------------------ */
    const tocSidebar = $("#tocSidebar");
    const tocMask = $("#tocMask");
    const tocToggle = $("#tocToggle");

    /** 打开抽屉 */
    function openTocDrawer() {
        if (!tocSidebar || !tocMask) return;
        tocSidebar.classList.add("open");
        tocMask.classList.add("show");
        document.body.style.overflow = "hidden"; // 锁定背景滚动
    }

    /** 关闭抽屉 */
    function closeTocDrawer() {
        if (!tocSidebar || !tocMask) return;
        tocSidebar.classList.remove("open");
        tocMask.classList.remove("show");
        document.body.style.overflow = "";
    }

    if (tocToggle) tocToggle.addEventListener("click", openTocDrawer);
    if (tocMask) tocMask.addEventListener("click", closeTocDrawer);

    // ESC 键关闭抽屉
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeTocDrawer();
    });

    /* ------------------------------------------------------------
       5. 滚动效果：顶栏阴影 / 进度条 / 返回顶部
       ------------------------------------------------------------ */
    const header = $("#siteHeader");
    const progressBar = $("#progressBar");
    const backToTop = $("#backToTop");

    /** 滚动时统一更新各项滚动状态（节流由 rAF 保证） */
    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const y = window.scrollY || document.documentElement.scrollTop;

            // 顶栏阴影：滚动超过 8px 后显示
            if (header) header.classList.toggle("scrolled", y > 8);

            // 阅读进度条：已完成滚动比例
            if (progressBar) {
                const doc = document.documentElement;
                const max = doc.scrollHeight - window.innerHeight;
                progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
            }

            // 返回顶部按钮：滚动超过 600px 后显示
            if (backToTop) backToTop.classList.toggle("show", y > 600);

            ticking = false;
        });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    if (backToTop) {
        backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ------------------------------------------------------------
       5.1 全站内容搜索
       基于 assets/search-index.js 提供的中英双语索引，
       支持标题与正文匹配，结果可跨页面跳转定位。
       ------------------------------------------------------------ */
    const searchInput = $("#searchInput");
    const searchResults = $("#searchResults");
    // 搜索索引由 assets/search-index.js 提供（两个页面的标题与正文）
    const searchIndex = (typeof SEARCH_INDEX !== "undefined") ? SEARCH_INDEX : null;

    /** 当前页面文件名（用于区分搜索结果属于本页还是另一页） */
    const currentPage = location.pathname.split("/").pop() || "index.html";

    /** 转义正则特殊字符，避免用户输入破坏正则 */
    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /** 在文本中高亮命中的关键词 */
    function highlight(text, terms) {
        let out = text;
        terms.forEach(function (term) {
            if (!term) return;
            out = out.replace(new RegExp("(" + escapeRegExp(term) + ")", "gi"), "<mark>$1</mark>");
        });
        return out;
    }

    /** 截取命中关键词附近的摘要 */
    function makeSnippet(text, terms) {
        const lower = text.toLowerCase();
        let idx = -1;
        for (let i = 0; i < terms.length; i++) {
            const p = lower.indexOf(terms[i]);
            if (p !== -1) { idx = p; break; }
        }
        if (idx === -1) return text.slice(0, 70);
        const start = Math.max(0, idx - 18);
        return (start > 0 ? "…" : "") + text.slice(start, start + 80) + (start + 80 < text.length ? "…" : "");
    }

    /** 执行搜索：关键词（空格分词，全部命中）匹配标题或正文（中/英） */
    function runSearch(query) {
        const q = query.trim().toLowerCase();
        if (!q || !searchIndex) {
            // 清空输入：隐藏结果，恢复目录
            if (searchResults) { searchResults.innerHTML = ""; searchResults.classList.remove("show"); }
            if (tocList) tocList.classList.remove("hidden");
            return;
        }
        const terms = q.split(/\s+/).filter(Boolean);
        const results = [];

        Object.keys(searchIndex).forEach(function (page) {
            const pageData = searchIndex[page];
            (pageData.items || []).forEach(function (item) {
                const hayZh = (item.titleZh + " " + item.textZh).toLowerCase();
                const hayEn = (item.titleEn + " " + item.textEn).toLowerCase();
                const hitZh = terms.every(function (t) { return hayZh.indexOf(t) !== -1; });
                const hitEn = terms.every(function (t) { return hayEn.indexOf(t) !== -1; });
                if (hitZh || hitEn) {
                    results.push({
                        page: page,
                        isCurrent: page === currentPage,
                        item: item,
                        // 标题命中优先于正文命中
                        titleHit: terms.every(function (t) {
                            return (item.titleZh + " " + item.titleEn).toLowerCase().indexOf(t) !== -1;
                        }),
                        text: hitZh ? item.textZh : item.textEn
                    });
                }
            });
        });

        // 排序：标题命中 > 本页结果 > 级别高（大标题）优先
        results.sort(function (a, b) {
            if (a.titleHit !== b.titleHit) return a.titleHit ? -1 : 1;
            if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
            return (a.item.level || 3) - (b.item.level || 3);
        });

        renderSearchResults(results.slice(0, 30), terms);
    }

    /** 渲染搜索结果列表 */
    function renderSearchResults(results, terms) {
        if (!searchResults) return;
        // 有输入时临时隐藏目录，展示结果
        if (tocList) tocList.classList.add("hidden");
        searchResults.classList.add("show");
        searchResults.innerHTML = "";

        if (results.length === 0) {
            const empty = document.createElement("div");
            empty.className = "search-empty";
            empty.textContent = currentLang === "en" ? "No results found" : "未找到相关内容";
            searchResults.appendChild(empty);
            return;
        }

        results.forEach(function (r) {
            const el = document.createElement("a");
            el.className = "search-result";
            el.href = (r.isCurrent ? "#" : r.page + "#") + r.item.id;

            // 页面标签：本页 / 另一页
            const pageLabel = currentLang === "en"
                ? (r.isCurrent ? "· this page" : "· Ch." + (r.page === "page2.html" ? "2" : "1"))
                : (r.isCurrent ? "· 本页" : "· 第" + (r.page === "page2.html" ? "二" : "一") + "节");

            // 标题跟随界面语言（中/英），摘要保留命中关键词所在语言的文本
            const titleText = currentLang === "en" ? r.item.titleEn : r.item.titleZh;
            el.innerHTML =
                '<span class="sr-title">' + highlight(titleText, terms) + '</span>' +
                '<span class="sr-page">' + pageLabel + '</span>' +
                '<div class="sr-snippet">' + highlight(makeSnippet(r.text, terms), terms) + '</div>';

            el.addEventListener("click", function (e) {
                e.preventDefault();
                if (r.isCurrent) {
                    // 本页：平滑滚动定位（图片已定高，布局稳定）
                    const target = document.getElementById(r.item.id);
                    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                    closeTocDrawer();
                } else {
                    // 其他页：跳转并用锚点定位（另一页加载后自动滚动到 #id）
                    location.href = r.page + "#" + r.item.id;
                }
            });
            searchResults.appendChild(el);
        });
    }

    // 输入防抖（150ms）触发搜索
    let searchTimer = null;
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { runSearch(searchInput.value); }, 150);
        });
    }

    // ESC：先清空搜索内容，再关闭抽屉
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && searchInput && searchInput.value) {
            searchInput.value = "";
            runSearch("");
        }
    });

    /* ------------------------------------------------------------
       6. 初始化
       ------------------------------------------------------------ */
    // 预先缓存所有可翻译元素的中文原文（必须在 applyLang 之前执行：
    // 否则页面以英文加载后，dataset.zh 会缓存到英文文本，导致
    // 之后点击"中文"无法恢复中文）
    Array.prototype.slice.call(document.querySelectorAll("[data-i18n]")).forEach(function (el) {
        el.dataset.zh = el.textContent;
    });

    // 应用已保存的语言（首屏脚本只设置了 <html> 属性，这里真正替换文本）
    applyLang(currentLang);
    // 初始化一次滚动状态（页面加载后立即计算进度条等）
    onScroll();
})();
