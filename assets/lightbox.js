// ============================================================
// 图片灯箱（Lightbox）— 优化拖拽手感（阻尼边界 + 回弹）
// ============================================================

(function() {
    'use strict';

    // ---------- 创建灯箱 DOM ----------
    const overlay = document.createElement('div');
    overlay.id = 'ir-lightbox-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(30, 42, 58, 0.85);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 9999;
        display: none;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        transition: opacity 0.25s ease;
    `;

    const container = document.createElement('div');
    container.id = 'ir-lightbox-container';
    container.style.cssText = `
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        cursor: default;
        display: flex;
        justify-content: center;
        align-items: center;
        touch-action: none;
    `;

    const img = document.createElement('img');
    img.id = 'ir-lightbox-img';
    img.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        width: auto;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
        cursor: grab;
        pointer-events: auto;
        background: #fff;
        will-change: transform;
        transition: none; /* 默认无过渡，仅在回弹时启用 */
    `;
    img.draggable = false;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.id = 'ir-lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 20px;
        font-size: 36px;
        font-weight: 300;
        line-height: 1;
        color: #ffffff;
        background: rgba(0, 0, 0, 0.4);
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        cursor: pointer;
        transition: background 0.2s, transform 0.15s;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif;
        pointer-events: auto;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(0, 103, 184, 0.85)';
        closeBtn.style.transform = 'scale(1.05)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(0, 0, 0, 0.4)';
        closeBtn.style.transform = 'scale(1)';
    });

    container.appendChild(img);
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // ---------- 状态变量 ----------
    let active = false;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    // 拖拽状态
    let isDragging = false;
    let startX = 0, startY = 0;
    let lastTranslateX = 0, lastTranslateY = 0;

    // ---------- 辅助函数：计算边界 ----------
    function getBounds() {
        // 获取图片原始尺寸（未缩放），若未加载则给个默认值
        const naturalW = img.naturalWidth || 1;
        const naturalH = img.naturalHeight || 1;
        // 缩放后的尺寸
        const scaledW = naturalW * scale;
        const scaledH = naturalH * scale;
        // 视口尺寸
        const containerW = window.innerWidth;
        const containerH = window.innerHeight;

        // 最大可偏移量（如果图片小于屏幕，则限制为0，即不允许拖出中心）
        const maxX = Math.max(0, (scaledW - containerW) / 2);
        const maxY = Math.max(0, (scaledH - containerH) / 2);
        return { maxX, maxY };
    }

    // ---------- 带阻尼的边界限制 ----------
    function clampWithDamping(value, limit) {
        if (Math.abs(value) <= limit) return value;
        // 超出部分施加阻尼（乘0.25，产生“推不动”的阻力感）
        const over = Math.abs(value) - limit;
        const sign = Math.sign(value);
        return sign * (limit + over * 0.25);
    }

    // ---------- 更新图片变换 ----------
    function updateTransform() {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // ---------- 重置（打开时调用） ----------
    function resetTransform() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        lastTranslateX = 0;
        lastTranslateY = 0;
        img.style.transition = 'none';
        updateTransform();
    }

    // ---------- 松手回弹（平滑回正） ----------
    function snapToBounds() {
        const { maxX, maxY } = getBounds();
        let targetX = translateX;
        let targetY = translateY;
        let shouldSnap = false;

        if (Math.abs(targetX) > maxX) {
            targetX = Math.sign(targetX) * maxX;
            shouldSnap = true;
        }
        if (Math.abs(targetY) > maxY) {
            targetY = Math.sign(targetY) * maxY;
            shouldSnap = true;
        }

        if (shouldSnap) {
            // 开启平滑过渡动画
            img.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            translateX = targetX;
            translateY = targetY;
            updateTransform();
            // 动画结束后恢复无过渡，避免干扰下次拖拽
            setTimeout(() => {
                img.style.transition = 'none';
            }, 320);
        }
    }

    // ---------- 打开灯箱 ----------
    function openLightbox(src) {
        if (active) return;
        active = true;
        resetTransform();
        img.src = src;
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        document.body.style.overflow = 'hidden';
    }

    // ---------- 关闭灯箱 ----------
    function closeLightbox() {
        if (!active) return;
        active = false;
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            img.src = '';
            document.body.style.overflow = '';
        }, 250);
    }

    // ---------- 指针事件：拖拽 ----------
    function onPointerDown(e) {
        if (!active || e.target !== img) return;
        e.preventDefault();
        isDragging = true;
        // 立即取消任何正在进行的过渡动画
        img.style.transition = 'none';

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        startX = clientX;
        startY = clientY;
        lastTranslateX = translateX;
        lastTranslateY = translateY;
        img.style.cursor = 'grabbing';

        // 对于鼠标，捕获指针防止丢失
        if (e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId);
        }
    }

    function onPointerMove(e) {
        if (!isDragging || !active) return;
        e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (clientX === undefined) return;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newX = lastTranslateX + dx;
        let newY = lastTranslateY + dy;

        // 应用边界阻尼
        const { maxX, maxY } = getBounds();
        newX = clampWithDamping(newX, maxX);
        newY = clampWithDamping(newY, maxY);

        translateX = newX;
        translateY = newY;
        updateTransform();
    }

    function onPointerUp(e) {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = 'grab';
            // 松手后回弹到边界内
            snapToBounds();
            // 释放指针捕获
            if (e.target && e.target.releasePointerCapture && e.pointerId !== undefined) {
                try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
            }
        }
    }

    // ---------- 鼠标滚轮缩放（同时限制边界） ----------
    function onWheel(e) {
        if (!active) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        let newScale = scale + delta;
        newScale = Math.min(Math.max(newScale, 0.3), 5.0);
        scale = newScale;

        // 缩放后，如果当前位置超出新边界，立即纠正（防止图片跑到外面）
        const { maxX, maxY } = getBounds();
        translateX = clampWithDamping(translateX, maxX);
        translateY = clampWithDamping(translateY, maxY);

        updateTransform();
    }

    // ---------- 键盘 ----------
    function onKeyDown(e) {
        if (e.key === 'Escape' && active) {
            closeLightbox();
        }
    }

    // ---------- 窗口大小变化时纠正边界 ----------
    function onResize() {
        if (!active) return;
        const { maxX, maxY } = getBounds();
        translateX = clampWithDamping(translateX, maxX);
        translateY = clampWithDamping(translateY, maxY);
        updateTransform();
    }

    // ---------- 事件绑定 ----------
    overlay.addEventListener('mousedown', onPointerDown);
    overlay.addEventListener('touchstart', onPointerDown, { passive: false });

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });

    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp, { passive: false });

    overlay.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    // 点击关闭按钮
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeLightbox();
    });

    // 点击背景关闭
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    // ---------- 绑定页面中的图片 ----------
    function bindImages() {
        const images = document.querySelectorAll('.secInfo .imgblock img');
        images.forEach(function(imgEl) {
            if (imgEl.dataset.lightboxBound) return;
            imgEl.dataset.lightboxBound = 'true';
            imgEl.style.cursor = 'pointer';
            imgEl.addEventListener('click', function(e) {
                e.stopPropagation();
                const src = this.getAttribute('src');
                if (src) openLightbox(src);
            });
        });
    }

    bindImages();
})();