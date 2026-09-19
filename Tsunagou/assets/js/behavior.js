function getDiv(id) {
    return document.getElementById(id);
}

function openWindow(id) {
    getDiv(id).style.display = 'flex';
}

function closeWindow(id) {
    getDiv(id).style.display = 'none';
}

function toSetTab(id) {
    for (let i = 1; i < 5; i++) {
        getDiv('uSet' + i).style.display = 'none';
        getDiv('uSet' + i + 'b').classList.remove('Active');
        getDiv('uSet' + i + 'b').classList.add('NoActive');
    }
    getDiv(id).style.display = 'flex';
    getDiv(id + 'b').classList.remove('NoActive');
    getDiv(id + 'b').classList.add('Active');
}

/* ============================================================
 * 下拉选择框 choosebox —— 通用实现，页面中可复用任意多个
 * 约定结构（面板紧跟在 .choosebox 之后即可，无需写任何 JS）：
 *     <div class="choosebox">
 *         <div class="left">当前值</div>
 *         <div class="right"></div>
 *     </div>
 *     <div class="chooseboxOpen">
 *         <p>选项一</p>
 *         <p>选项二</p>
 *     </div>
 * 面板也可放在别处，用 data-target="面板id" 显式指定：
 *     <div class="choosebox" data-target="uSetCol">…</div>
 * 选中某项后，会在 .choosebox 上派发冒泡事件 choosebox:change，
 * event.detail = { value, option, box, panel }，便于外部响应（如切换主题）。
 * ============================================================ */

const CSBOX_ANIM_TIMEOUT = 240; // 略大于 CSS 中 height 过渡的 0.2s，作为兜底

// 由 .choosebox 找到它对应的选项面板
function findCsPanel(box) {
    if (!box) return null;
    const targetId = box.dataset.target;
    if (targetId) {
        const panel = document.getElementById(targetId);
        if (panel) return panel;
    }
    for (let node = box.nextElementSibling; node; node = node.nextElementSibling) {
        if (node.classList.contains('chooseboxOpen')) return node;
        if (node.classList.contains('choosebox')) break;
    }
    return box.parentElement ? box.parentElement.querySelector('.chooseboxOpen') : null;
}

// 由选项面板反向找到它所属的 .choosebox
function findCsBox(panel) {
    if (!panel) return null;
    if (panel.id) {
        const box = document.querySelector('.choosebox[data-target="' + panel.id + '"]');
        if (box) return box;
    }
    for (let node = panel.previousElementSibling; node; node = node.previousElementSibling) {
        if (node.classList.contains('choosebox')) return node;
    }
    return panel.parentElement ? panel.parentElement.querySelector('.choosebox') : null;
}

// 把面板的 id / 元素统一解析为元素
function resolveCsBox(ref) {
    if (!ref) return null;
    return typeof ref === 'string' ? document.getElementById(ref) : ref;
}

// 过渡收尾：展开后放开高度，收起后彻底隐藏
function settleCsBox(panel, expanded) {
    clearTimeout(panel.csAnimTimer);
    const finish = () => {
        panel.removeEventListener('transitionend', onEnd);
        clearTimeout(panel.csAnimTimer);
        if (panel.dataset.csState === 'open' && expanded) {
            panel.style.height = 'auto';
        } else if (!expanded && panel.dataset.csState !== 'open') {
            panel.style.display = 'none';
            panel.style.height = '';
        }
    };
    const onEnd = (e) => {
        if (e.target === panel && e.propertyName === 'height') finish();
    };
    panel.addEventListener('transitionend', onEnd);
    panel.csAnimTimer = setTimeout(finish, CSBOX_ANIM_TIMEOUT);
}

function openCsBox(ref) {
    const panel = resolveCsBox(ref);
    if (!panel || panel.dataset.csState === 'open') return;
    closeAllCsBox(); // 同一时间只保留一个展开的选择框
    panel.dataset.csState = 'open';
    panel.classList.add('open');
    panel.style.display = 'flex';
    panel.style.height = '0px';
    void panel.offsetHeight; // 强制重排，保证从 0 开始过渡
    panel.style.height = panel.scrollHeight + 'px';
    settleCsBox(panel, true);
}

function closeCsBox(ref) {
    const panel = resolveCsBox(ref);
    if (!panel || panel.dataset.csState !== 'open') return;
    panel.dataset.csState = 'closed';
    panel.classList.remove('open');
    panel.style.height = panel.scrollHeight + 'px';
    void panel.offsetHeight;
    panel.style.height = '0px';
    settleCsBox(panel, false);
}

function toggleCsBox(ref) {
    const panel = resolveCsBox(ref);
    if (!panel) return;
    if (panel.dataset.csState === 'open') {
        closeCsBox(panel);
    } else {
        openCsBox(panel);
    }
}

function closeAllCsBox() {
    document.querySelectorAll('.chooseboxOpen[data-cs-state="open"]').forEach(closeCsBox);
}

// 选中某个选项：回填显示值 → 收起 → 抛出事件
function selectCsOption(option) {
    const panel = option.closest('.chooseboxOpen');
    const box = findCsBox(panel);
    const value = option.textContent.trim();
    if (box) {
        const label = box.querySelector('.left');
        if (label) label.textContent = value;
    }
    closeCsBox(panel);
    if (box) {
        box.dispatchEvent(new CustomEvent('choosebox:change', {
            bubbles: true,
            detail: { value: value, option: option, box: box, panel: panel }
        }));
    }
}

// 统一用事件委托，动态添加的选择框也能直接生效
document.addEventListener('click', (e) => {
    const option = e.target.closest('.chooseboxOpen p');
    if (option) {
        selectCsOption(option);
        return;
    }
    const inPanel = e.target.closest('.chooseboxOpen');
    const box = e.target.closest('.choosebox');
    if (box && !inPanel) {
        toggleCsBox(findCsPanel(box));
        return;
    }
    if (inPanel) return; // 点在面板空白处不收起
    closeAllCsBox();     // 点击其它任意位置收起
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllCsBox();
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('开始');
  await sleep(1000);
  console.log('1 秒后继续');
}

run();

async function debug() {
    getDiv('AnnounceMent').style.right = '30px';
    await sleep(2000);
    getDiv('AnnounceMent').style.right = '-300px';
}