/* ============================================================
   IR 沉浸铁路教程站 · 图片灯箱（Lightbox）
   ------------------------------------------------------------
   功能：
   - 点击正文截图放大查看（半透明深色遮罩 + 毛玻璃）
   - 鼠标拖拽平移（带阻尼回弹）
   - 滚轮缩放（0.3x ~ 5x）
   - ESC / 点击遮罩 / 关闭按钮退出
   - 样式类定义见 assets/main.css 第 14 节
   ============================================================ */
(function () {
    "use strict";

    // 仅当页面中存在可放大的图片时才初始化，节省开销
    const images = document.querySelectorAll(".imgblock img");
    if (images.length === 0) return;

    /* ---------- 构建灯箱 DOM ---------- */
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";

    const img = document.createElement("img");
    img.className = "lightbox-img";
    img.alt = "";
    img.draggable = false;

    const closeBtn = document.createElement("button");
    closeBtn.className = "lightbox-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.innerHTML = "&times;";

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    /* ---------- 状态变量 ---------- */
    let active = false;      // 灯箱是否打开
    let scale = 1;           // 缩放倍数
    let tx = 0, ty = 0;      // 平移量
    let isDragging = false;  // 是否正在拖拽
    let startX = 0, startY = 0;   // 拖拽起点
    let lastX = 0, lastY = 0;     // 拖拽起点对应的平移量

    /** 计算图片在当前缩放下的可平移边界（图片比视口小时不允许拖出中心） */
    function getBounds() {
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        return {
            maxX: Math.max(0, (w - window.innerWidth) / 2),
            maxY: Math.max(0, (h - window.innerHeight) / 2)
        };
    }

    /** 带阻尼的边界限制：超出部分乘以 0.25，产生"推不动"的阻力感 */
    function clamp(v, limit) {
        if (Math.abs(v) <= limit) return v;
        return Math.sign(v) * (limit + (Math.abs(v) - limit) * 0.25);
    }

    /** 应用当前 transform 到图片 */
    function updateTransform() {
        img.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
    }

    /** 打开灯箱前的重置 */
    function reset() {
        scale = 1; tx = 0; ty = 0; lastX = 0; lastY = 0;
        img.style.transition = "none";
        updateTransform();
    }

    /** 松手后回弹到边界内 */
    function snap() {
        const b = getBounds();
        let needSnap = false;
        if (Math.abs(tx) > b.maxX) { tx = Math.sign(tx) * b.maxX; needSnap = true; }
        if (Math.abs(ty) > b.maxY) { ty = Math.sign(ty) * b.maxY; needSnap = true; }
        if (needSnap) {
            img.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
            updateTransform();
            setTimeout(function () { img.style.transition = "none"; }, 320);
        }
    }

    /** 打开灯箱 */
    function open(src) {
        active = true;
        reset();
        img.src = src;
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    /** 关闭灯箱 */
    function close() {
        if (!active) return;
        active = false;
        overlay.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(function () { img.src = ""; }, 260); // 等淡出动画结束后清空
    }

    /* ---------- 事件：拖拽平移 ---------- */
    overlay.addEventListener("pointerdown", function (e) {
        if (!active || e.target !== img) return;
        e.preventDefault();
        isDragging = true;
        img.classList.add("dragging");
        img.style.transition = "none";
        startX = e.clientX;
        startY = e.clientY;
        lastX = tx; lastY = ty;
        img.setPointerCapture(e.pointerId);
    });

    overlay.addEventListener("pointermove", function (e) {
        if (!isDragging) return;
        const b = getBounds();
        tx = clamp(lastX + (e.clientX - startX), b.maxX);
        ty = clamp(lastY + (e.clientY - startY), b.maxY);
        updateTransform();
    });

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        img.classList.remove("dragging");
        snap();
    }
    overlay.addEventListener("pointerup", endDrag);
    overlay.addEventListener("pointercancel", endDrag);

    /* ---------- 事件：滚轮缩放 ---------- */
    overlay.addEventListener("wheel", function (e) {
        if (!active) return;
        e.preventDefault();
        scale += (e.deltaY > 0 ? -0.1 : 0.1);
        scale = Math.min(Math.max(scale, 0.3), 5);
        // 缩放后立即纠正越界
        const b = getBounds();
        tx = clamp(tx, b.maxX);
        ty = clamp(ty, b.maxY);
        updateTransform();
    }, { passive: false });

    /* ---------- 事件：关闭 ---------- */
    closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        close();
    });
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
    });

    /* ---------- 窗口尺寸变化时纠正边界 ---------- */
    window.addEventListener("resize", function () {
        if (!active) return;
        const b = getBounds();
        tx = clamp(tx, b.maxX);
        ty = clamp(ty, b.maxY);
        updateTransform();
    });

    /* ---------- 给正文图片绑定点击 ---------- */
    images.forEach(function (el) {
        el.addEventListener("click", function () {
            const src = el.getAttribute("src");
            if (src) open(src);
        });
    });
})();
