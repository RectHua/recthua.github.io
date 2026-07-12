(function () {
    'use strict';

    // ---------- 配置 ----------
    const NAV_HEIGHT = 110; // secGood 40px + secNav 70px
    const OFFSET_EXTRA = 12; // 额外偏移，让标题不完全紧贴导航栏

    // ---------- 获取所有标题元素 ----------
    // 选择 .secInfo 中的 h2、h3、h4，以及 .appendix 中的 h2
    const titleSelectors = '.secInfo h2, .secInfo h3, .secInfo h4, .appendix h2';
    const allTitles = document.querySelectorAll(titleSelectors);

    if (allTitles.length === 0) {
        console.warn('[TOC] 未找到任何标题，请检查选择器。');
        return;
    }

    // ---------- 为每个标题生成唯一 ID ----------
    // 使用 "toc-" + 索引 作为 id，保证唯一且不影响原有结构
    allTitles.forEach(function (el, index) {
        if (!el.id) {
            el.id = 'toc-' + index;
        }
    });

    // ---------- 构建目录树 ----------
    // 遍历 allTitles，根据标签名确定层级
    // h2 -> level 1, h3 -> level 2, h4 -> level 3
    const tocData = [];
    let currentH2 = null; // 当前 h2
    let currentH3 = null; // 当前 h3

    allTitles.forEach(function (el) {
        const tag = el.tagName.toLowerCase();
        const text = el.textContent.trim();
        const id = el.id;

        if (tag === 'h2') {
            // 一级标题
            const item = {
                level: 1,
                text: text,
                id: id,
                element: el,
                children: []
            };
            tocData.push(item);
            currentH2 = item;
            currentH3 = null;
        } else if (tag === 'h3') {
            // 二级标题，挂在当前 h2 下
            if (currentH2) {
                const item = {
                    level: 2,
                    text: text,
                    id: id,
                    element: el,
                    children: []
                };
                currentH2.children.push(item);
                currentH3 = item;
            } else {
                // 没有 h2 父级，直接挂在根（极少情况）
                const item = {
                    level: 2,
                    text: text,
                    id: id,
                    element: el,
                    children: []
                };
                tocData.push(item);
                currentH3 = item;
            }
        } else if (tag === 'h4') {
            // 三级标题，挂在当前 h3 下
            if (currentH3) {
                const item = {
                    level: 3,
                    text: text,
                    id: id,
                    element: el,
                    children: []
                };
                currentH3.children.push(item);
            } else if (currentH2) {
                // 如果当前没有 h3，但存在 h2，则挂在 h2 下（作为二级）
                const item = {
                    level: 2,
                    text: text,
                    id: id,
                    element: el,
                    children: []
                };
                currentH2.children.push(item);
            } else {
                // 孤立 h4，直接挂在根
                const item = {
                    level: 3,
                    text: text,
                    id: id,
                    element: el,
                    children: []
                };
                tocData.push(item);
            }
        }
    });

    // ---------- 渲染目录到侧边栏 ----------
    const navContainer = document.getElementById('toc-nav');
    if (!navContainer) return;

    function renderItems(items, container) {
        items.forEach(function (item) {
            const link = document.createElement('a');
            link.className = 'toc-item level-' + item.level;
            link.textContent = item.text;
            link.setAttribute('data-target-id', item.id);
            link.setAttribute('href', '#' + item.id);

            // 点击跳转
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetEl = document.getElementById(item.id);
                if (targetEl) {
                    scrollToElement(targetEl);
                }
            });

            container.appendChild(link);

            // 递归渲染子项
            if (item.children && item.children.length > 0) {
                // 子项直接追加到同一个容器，依靠缩进区分层级
                renderItems(item.children, container);
            }
        });
    }

    renderItems(tocData, navContainer);

    // ---------- 滚动到指定元素 ----------
    function scrollToElement(el) {
        const rect = el.getBoundingClientRect();
        const targetY = rect.top + window.pageYOffset - NAV_HEIGHT - OFFSET_EXTRA;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }

    // ---------- 高亮当前可见标题 ----------
    const allTocItems = document.querySelectorAll('.toc-item');
    // 收集所有标题元素及其对应的 toc-item
    const titleMap = new Map();
    allTitles.forEach(function (el) {
        const tocItem = document.querySelector('.toc-item[data-target-id="' + el.id + '"]');
        if (tocItem) {
            titleMap.set(el, tocItem);
        }
    });

    // 使用 Intersection Observer 检测哪个标题在视口中
    const observer = new IntersectionObserver(function (entries) {
        // 收集所有可见的标题
        const visible = [];
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                visible.push(entry.target);
            }
        });

        // 如果没有可见的，保持当前高亮
        if (visible.length === 0) return;

        // 选择最接近视口顶部的一个
        let best = visible[0];
        let bestTop = Infinity;
        visible.forEach(function (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < bestTop) {
                bestTop = rect.top;
                best = el;
            }
        });

        // 更新高亮
        updateActive(best);
    }, {
        rootMargin: '-' + (NAV_HEIGHT + 20) + 'px 0px -40% 0px',
        threshold: 0
    });

    // 监听所有标题
    allTitles.forEach(function (el) {
        observer.observe(el);
    });

    // 更新高亮状态
    function updateActive(activeElement) {
        // 清除所有 active
        allTocItems.forEach(function (item) {
            item.classList.remove('active');
        });

        // 找到对应的 toc-item
        const tocItem = titleMap.get(activeElement);
        if (tocItem) {
            tocItem.classList.add('active');
            // 确保高亮项在侧边栏中可见
            tocItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    // ---------- 初始化：页面加载完成后，高亮第一个可见标题 ----------
    function initActive() {
        // 从所有标题中找到第一个在视口中的
        let firstVisible = null;
        let firstTop = Infinity;

        allTitles.forEach(function (el) {
            const rect = el.getBoundingClientRect();
            const topOffset = rect.top - NAV_HEIGHT - 20;
            // 如果标题在视口内（或刚超出顶部一点点）
            if (topOffset < window.innerHeight - 100 && rect.bottom > NAV_HEIGHT + 20) {
                if (rect.top < firstTop) {
                    firstTop = rect.top;
                    firstVisible = el;
                }
            }
        });

        if (firstVisible) {
            updateActive(firstVisible);
        } else if (allTitles.length > 0) {
            // 如果没有任何标题在视口中，默认高亮第一个
            updateActive(allTitles[0]);
        }
    }

    // 等 DOM 完全渲染后初始化
    if (document.readyState === 'complete') {
        initActive();
    } else {
        window.addEventListener('load', initActive);
    }

    // 窗口变化时重新检查（resize 时可能改变可见性）
    let resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            // 简单地重新触发一次观察，但 observer 会自动处理
            // 我们手动检查一次
            let found = false;
            allTitles.forEach(function (el) {
                const rect = el.getBoundingClientRect();
                const topOffset = rect.top - NAV_HEIGHT - 20;
                if (topOffset < window.innerHeight - 100 && rect.bottom > NAV_HEIGHT + 20) {
                    if (!found) {
                        updateActive(el);
                        found = true;
                    }
                }
            });
            if (!found && allTitles.length > 0) {
                updateActive(allTitles[0]);
            }
        }, 200);
    });

    // ---------- 键盘/辅助：允许通过 tab 访问目录项 ----------
    allTocItems.forEach(function (item) {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
})();