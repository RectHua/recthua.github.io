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

function getDiv(id) {
    return document.getElementById(id);
}

function openWindow(id) {
    getDiv(id).style.display = 'flex';
    void getDiv(id).offsetWidth;
    getDiv(id).style.opacity='1';
}

function closeWindow(id) {
    void getDiv(id).offsetWidth;
    getDiv(id).style.opacity = '0';
    getDiv(id).style.display = 'none';
}

function toSetTab(id) {
    for (let i = 1; i < 5; i++) {
        getDiv('uSet' + i).style.display = 'none';
    void getDiv(id).offsetWidth;
    getDiv(id).style.opacity = '0';
        getDiv('uSet' + i + 'b').classList.remove('Active');
        getDiv('uSet' + i + 'b').classList.add('NoActive');
    }
    getDiv(id).style.display = 'flex';
    void getDiv(id).offsetWidth;
    getDiv(id).style.opacity = '1';
    getDiv(id + 'b').classList.remove('NoActive');
    getDiv(id + 'b').classList.add('Active');
}

/* ============================================================
 * 工作区切换 —— 右侧的 secHome（初始工作区）/ secProjPanel（项目工作区）
 * 同一时刻只显示其中一个：toWorkSpace(cls) 只负责“显示/隐藏”，
 * 隐藏的一方写行内 display:none，显示的一方清掉行内 display 交回 CSS，
 * 因此背景、尺寸、flex 方向等一切布局都仍由 CSS 决定，JS 不插手。
 * 用法：侧边栏/入口上写 onclick="openProj()" 进项目工作区，
 *       写 onclick="openHome()" 回初始工作区。
 * ============================================================ */

// 工作区用 class 标识（这两块 <section> 没有 id），顺序即互斥切换的顺序
const WORKSPACES = ['secHome', 'secProjPanel'];

function getWorkSpace(cls) {
    return document.querySelector('.' + cls);
}

// 显示 cls 这个工作区，隐藏其余的（行内只出现 display:none）
function toWorkSpace(cls) {
    if (!WORKSPACES.includes(cls)) return;
    WORKSPACES.forEach((name) => {
        const sec = getWorkSpace(name);
        if (!sec) return;
        sec.style.display = (name === cls) ? '' : 'none';
    });
}

function openProj() { toWorkSpace('secProjPanel'); } // 进入项目工作区
function openHome() { toWorkSpace('secHome'); }      // 回到初始工作区

toWorkSpace('secHome'); // 初始化：默认只显示初始工作区

/* ============================================================
 * 协作卡片选中态 —— .projItem（公共类）/ .projItemSelected（选中态）
 * 规则：点击哪张卡片，它的 class 就变成 "projItem projItemSelected"
 *       （公共类 projItem 始终保留）；
 *       其余卡片只去掉 projItemSelected，同一时刻只有一张卡片是选中态。
 * 实现：document 级事件委托，HTML 里不需要写任何 onclick。
 *       点 .edit 编辑按钮时不改变选中态（那是独立操作入口）。
 * ============================================================ */

const PROJ_ITEM_BASE = 'projItem'; // 所有协作卡片都有的公共类

function selectProjItem(item) {
    if (!item) return;
    document.querySelectorAll('.' + PROJ_ITEM_BASE).forEach((el) => {
        if (el === item) {
            el.className = PROJ_ITEM_BASE + ' projItemSelected';
        } else {
            el.classList.remove('projItemSelected');
        }
    });
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.edit')) return; // 点编辑按钮不算选中
    const item = e.target.closest('.' + PROJ_ITEM_BASE);
    if (item) selectProjItem(item);
});

/* ============================================================
 * 项目标签页 —— .tabArea 的 .tabS 与 .inner 里的面板成对切换
 * 约定（纯结构配对，HTML 上不需要写 id / onclick，只靠顺序对应）：
 *     .tabArea > .tabS         第 N 个标签按钮
 *     .inner    > .tabMain     第 N 个标签的主视图（与标签按钮按顺序一一对应）
 *     .inner    > .asideMain   紧跟在该 .tabMain 之后的侧栏
 * 侧栏是**可选**的：主视图那一页就没有侧栏。一个标签页对应的是一整组
 * “主视图 + 紧随其后的侧栏（有就跟）”，所以某一页少了侧栏不会影响其它页的配对。
 * 切换分两部分：
 *   1) 标签按钮：被点中的加 .tabSactive，其余去掉（只有按钮这里用 class）；
 *   2) 内容面板：不用 Normal 系列 class，而是直接写行内 display / opacity，
 *      完全照搬 #secWindow 的 openWindow()/closeWindow() 那套做法：
 *        进入 —— display:'flex' → void offsetWidth 强制重排 → opacity:'1'
 *                （强制重排保证元素先以 opacity:0 真正渲染一帧，
 *                  这样第二步的 0 → 1 才是一次前后都有渲染状态的属性变化；
 *                  只要 CSS 的 .tabMain / .asideMain 上有 transition:opacity 就会淡入，
 *                  目前那两条 transition 是注释掉的，所以现在是直接出现，写法不用改）
 *        离开 —— display:'none'（盒子当场移除，不做离开动画，这是有意的）
 * 用法：selectProjTab(index)（index 从 0 开始）；
 *       初始高亮以 HTML 里已标好的 .tabSactive 为准，没标则默认第一个。
 * ============================================================ */

const PROJ_TAB_BASE = 'tabS';         // 所有标签按钮的公共类
const PROJ_TAB_ACTIVE = 'tabSactive'; // 标签按钮的选中态类
// 面板显示时的 display 值，必须与 CSS 里 .tabMainNormal / .asideMainNormal 的
// display 一致（都是 flex），否则第一次切换后的布局会跟初始状态对不上。
const PROJ_PANE_DISPLAY = 'flex';

// 项目工作区的标签条 / 标签内容区
function getProjTabBar() { return document.querySelector('.secProjPanel .tabArea'); }
function getProjTabBody() { return document.querySelector('.secProjPanel .inner'); }

// 标签条里的标签按钮（按出现顺序）
function getProjTabs() {
    const bar = getProjTabBar();
    if (!bar) return [];
    return Array.from(bar.children).filter((el) => el.classList.contains(PROJ_TAB_BASE));
}

// 内容区里的主视图（按出现顺序），与上面的标签按钮一一对应
function getProjMains() {
    const body = getProjTabBody();
    if (!body) return [];
    return Array.from(body.children).filter((el) => el.classList.contains('tabMain'));
}

// 一个标签页对应的面板组：主视图，加上紧跟其后的侧栏（可选，主视图那一页就没有）
function getProjPanes(main) {
    const aside = main.nextElementSibling;
    return (aside && aside.classList.contains('asideMain')) ? [main, aside] : [main];
}

// 显示一个面板：先落 display，强制重排让它以 opacity:0 先渲染一帧，再写 opacity:1
// （与 openWindow() 同一套两步走，只做“进入”的过渡）
function showProjPane(el) {
    el.style.display = PROJ_PANE_DISPLAY;
    void el.offsetWidth;
    el.style.opacity = '1';
}

// 隐藏一个面板：直接 display:none，离开动画不显示（有意为之）；
// opacity 顺手归零，下次进入时才能从 0 淡入
function hideProjPane(el) {
    el.style.display = 'none';
    el.style.opacity = '0';
}

// 切换到第 index 个标签：按钮高亮 + 显示该组的主视图（连同它的侧栏）
function selectProjTab(index) {
    const tabs = getProjTabs();
    const mains = getProjMains();
    if (index < 0 || index >= tabs.length || index >= mains.length) return;
    tabs.forEach((tab, n) => tab.classList.toggle(PROJ_TAB_ACTIVE, n === index));
    mains.forEach((main, n) => {
        // 侧栏跟着同组的主视图一起显示/隐藏；没有侧栏的页（如主视图）就只有主视图
        getProjPanes(main).forEach((pane) => (n === index ? showProjPane(pane) : hideProjPane(pane)));
    });
}

// 点击标签按钮即切换（document 级事件委托，HTML 里不需要写 onclick）
document.addEventListener('click', (e) => {
    const tab = e.target.closest('.secProjPanel .tabArea .' + PROJ_TAB_BASE);
    if (!tab) return;
    selectProjTab(getProjTabs().indexOf(tab));
});

// 初始化：默认停在 HTML 里已标为 .tabSactive 的那个标签上
(function initProjTab() {
    const active = getProjTabs().findIndex((tab) => tab.classList.contains(PROJ_TAB_ACTIVE));
    selectProjTab(active < 0 ? 0 : active);
})();

/* ============================================================
 * 区块内标签组 —— .tabblock 里的 .tabItem 与 .tabContent 成对切换
 * （项目标签页内部再分一层的小标签，例如「冲突与协商」下的
 *   分歧 / 冲突 / Agent 间协商消息 / 契约）
 * 约定（同样是纯结构配对，HTML 上不需要写 id / onclick）：
 *     .tabblock > .tabPlace > .tabItem   第 N 个标签按钮
 *     .tabblock > .tabContent            第 N 个标签的内容面板
 * 切换只做两件事：
 *   1) 标签按钮：被点中的加 .tabItemActive，其余去掉（class 增删）；
 *   2) 内容面板：隐藏的写行内 display:none，显示的把行内 display 清成 ''。
 * 注意面板的显隐方式和项目标签页**不一样**：CSS 里 .tabContent 是一条空规则块，
 * 没有写任何 display，所以“显示”就是把行内 display 清空、交回 CSS 的默认值，
 * 不用像主标签页那样先落 display 再重排——这里没有 Normal 类可切，也没有
 * opacity/transition 可跑，凭空写 opacity 只会是 JS 自己造效果。
 * 事件委托挂在 document 上，所以页面上放任意多个 .tabblock 都能自动生效。
 * 用法：selectBlockTab(block, index)（index 从 0 开始）；
 *       初始高亮以 HTML 里已标好的 .tabItemActive 为准，没标则默认第一个。
 * ============================================================ */

const BLOCK_BASE = 'tabblock';            // 标签组的容器
const BLOCK_PLACE = 'tabPlace';           // 放标签按钮的那一条
const BLOCK_TAB_BASE = 'tabItem';         // 标签按钮的公共类
const BLOCK_TAB_ACTIVE = 'tabItemActive'; // 标签按钮的选中态类
const BLOCK_PANEL = 'tabContent';         // 内容面板类

// 一个标签组里的标签按钮（按出现顺序）
function getBlockTabs(block) {
    const place = Array.from(block.children).find((el) => el.classList.contains(BLOCK_PLACE));
    if (!place) return [];
    return Array.from(place.children).filter((el) => el.classList.contains(BLOCK_TAB_BASE));
}

// 一个标签组里的内容面板（按出现顺序），与上面的标签按钮一一对应
function getBlockPanels(block) {
    return Array.from(block.children).filter((el) => el.classList.contains(BLOCK_PANEL));
}

// 显示一个面板：清掉行内 display，交回 CSS（.tabContent 没写 display，即默认的 block）
function showBlockPanel(panel) { panel.style.display = ''; }

// 隐藏一个面板：写行内 display:none（盒子直接移除，不占位、也不留空隙）
function hideBlockPanel(panel) { panel.style.display = 'none'; }

// 切换到某个标签组里的第 index 个标签：按钮高亮 + 只显示它对应的面板
function selectBlockTab(block, index) {
    const tabs = getBlockTabs(block);
    const panels = getBlockPanels(block);
    if (index < 0 || index >= tabs.length || index >= panels.length) return;
    tabs.forEach((tab, n) => tab.classList.toggle(BLOCK_TAB_ACTIVE, n === index));
    panels.forEach((panel, n) => (n === index ? showBlockPanel(panel) : hideBlockPanel(panel)));
}

// 点击标签按钮即切换（document 级事件委托，HTML 里不需要写 onclick）
document.addEventListener('click', (e) => {
    const tab = e.target.closest('.' + BLOCK_TAB_BASE);
    if (!tab) return;
    const block = tab.closest('.' + BLOCK_BASE);
    if (!block) return;
    selectBlockTab(block, getBlockTabs(block).indexOf(tab));
});

// 初始化：页面上每个 .tabblock 各自停在自己已标为 .tabItemActive 的那个标签上
document.querySelectorAll('.' + BLOCK_BASE).forEach((block) => {
    const active = getBlockTabs(block).findIndex((tab) => tab.classList.contains(BLOCK_TAB_ACTIVE));
    selectBlockTab(block, active < 0 ? 0 : active);
});

/* ============================================================
 * 新建协作向导（#addProj）
 * 约定结构：
 *     <div class="right" id="newXzN">…</div>   步骤 N 的内容
 *     <div class="options" id="xzN">…</div>    步骤 N 的按钮组
 * 同一时刻只显示其中一组，用 toNewXz(N) 切换（N 从 1 开始）。
 * 面板与按钮组一一对应，增删步骤只需保证 id 编号连续，
 * 并同步修改下面的 NEWXZ_STEPS。
 * ============================================================ */

const NEWXZ_STEPS = 4; // 向导总步数（与 index.html 中 newXzN / xzN 的最大编号一致）
let newXzCur = 1;      // 当前所在步骤

// 切换到第 step 步，超出范围时自动收敛到首/尾步，不会越界
function toNewXz(step) {
    newXzCur = Math.min(Math.max(step, 1), NEWXZ_STEPS);
    for (let i = 1; i <= NEWXZ_STEPS; i++) {
        const active = (i === newXzCur);
        const display = active ? 'flex' : 'none';
        // 内容面板 newXz：display 为 none 时 opacity 为 0，否则为 1
        const panel = getDiv('newXz' + i);
        panel.style.display = display;
        void panel.offsetWidth;
        panel.style.opacity = active ? '1' : '0';
        // 按钮组 xz：只切换显示状态
        getDiv('xz' + i).style.display = display;
    }
}

// 上一步 / 下一步（已在首步或末步时原地不动）
function newXzPrev() {
    toNewXz(newXzCur - 1);
}

function newXzNext() {
    toNewXz(newXzCur + 1);
}

// 完成：关闭窗口，并把向导重置回第一步，方便下次打开
async function newXzFinish() {
    closeWindow('addProj');
    await sleep(200);
    toNewXz(1);
}

toNewXz(1); // 初始化：默认停在第一步

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



async function debug() {
    getDiv('AnnounceMent').style.right = '30px';
    getDiv('secApgr').classList.add('Active');
    await sleep(2000);
    getDiv('AnnounceMent').style.right = '-300px';
    getDiv('secApgr').classList.remove('Active');
}

async function debug2() {
    getDiv('AnnounceMent2').style.top = '30px';
    await sleep(2000);
    getDiv('AnnounceMent2').style.top = '-100px';
}

function mgrAgentDB() {
    getDiv('agentMgrRight').style.display = 'none';
    getDiv('agentMgrPlgRight').style.display = 'flex';
    const container = document.querySelector('.some-container');
    const items = document.querySelectorAll('.table .item .edit');
    items.forEach((el) => {
        el.offsetWidth;
        el.style.right='0';
        el.style.top='0';
    });
}

function mgrAgentDDB() {
    getDiv('agentMgrPlgRight').style.display = 'none';
    getDiv('agentMgrRight').style.display = 'flex';
    const container = document.querySelector('.some-container');
    const items = document.querySelectorAll('.table .item .edit');
    items.forEach((el) => {
        el.style.right='-40px';
        el.style.top='-40px';
        el.offsetWidth;
    });
}

/* 主题配图：白色版文件名以 -l 结尾、深色版以 -d 结尾，成对存在
   （如 logo-l.png / logo-d.png、agent/deepseek-l.png / deepseek-d.png） */
function applyThemeImages(light) {
    const suffix = light ? '-d.png' : '-l.png';
    document.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (!src || !/-[ld]\.png$/i.test(src)) return; // 只处理成对的 -l / -d 图，其余图片不动
        img.setAttribute('src', src.replace(/-[ld]\.png$/i, suffix));
    });
}

/* ============================================================
 * 颜色主题 —— 浅色模式
 * 只做两件事：把 :root 上的颜色变量改写成目标主题的色值，
 * 并把成对的配图切成对应版本（-l / -d）；
 * 不新增/修改任何 CSS，也不依赖任何 HTML 结构改动。
 * 深色的色值 = style.css 中 :root 的原始值（保证来回切换不失真）；
 * 浅色 = 明暗反相，且各变量之间的深浅次序与深色保持一致。
 * 挂载：监听 choosebox 的 choosebox:change 事件（设置窗口 #uSet1 内的主题下拉框）。
 * ============================================================ */
function setColorTheme(mode) {
    const THEME_VARS = {
        /* 深色（与 style.css 的 :root 原始值一致） */
        dark: {
            '--col-1': '#151517',
            '--col-1-a': '#1515178a',
            '--col-1-5': '#1a1a1a',
            '--col-2': '#1D1D1F',
            '--col-3': '#2C2C2E',
            '--col-4': '#303435',
            '--col-4-5': '#404040',
            '--col-5': '#595959',
            '--col-6': '#999999',
            '--col-7': '#C9C9C9',
            '--col-7-5': '#E4E4E4',
            '--col-8': 'white'
        },
        /* 浅色（背景与文字整体反相） */
        light: {
            '--col-1': '#FFFFFF',   // 主区背景
            '--col-1-a': '#FFFFFFB3', // 窗口遮罩
            '--col-1-5': '#E8E8EC', // 阴影
            '--col-2': '#F4F4F7',   // 侧边栏背景
            '--col-3': '#E9E9EE',   // 卡片 / 窗口背景
            '--col-4': '#DFDFE5',
            '--col-4-5': '#D6D6DD', // 下拉面板 / 悬停底色
            '--col-5': '#B9B9C1',   // 控件底色 / 弱化文字
            '--col-6': '#7C7C85',   // 次要文字
            '--col-7': '#414149',   // 正文
            '--col-7-5': '#1F1F26', // 标题 / 强调文字
            '--col-8': '#111114'    // 主文字
        }
    };
    // “自动”跟随系统偏好，其余按深色处理
    const sysLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const name = (mode === '浅色' || (mode === '自动' && sysLight)) ? 'light' : 'dark';
    const style = document.documentElement.style;
    for (const key in THEME_VARS[name]) {
        style.setProperty(key, THEME_VARS[name][key]);
    }
    applyThemeImages(name === 'light'); // 配图同步切换 -l / -d
}

// 设置窗口 #uSet1 中的“颜色主题”下拉框选中后，按选项文本切换主题
document.addEventListener('choosebox:change', (e) => {
    if (e.detail.panel && e.detail.panel.closest('#uSet1')) setColorTheme(e.detail.value);
});

/* ============================================================
 * 侧栏宽度拖拽 —— 项目工作区里的 .asideMain（右侧“项目总目标文档”栏）
 * 该栏在 CSS 里只有 min-width，所以宽度一直是 300px 的最小值，
 * 这里让用户拖动它的左边缘来改宽度（左移变宽，右移变窄，到 min-width 为止）。
 * 实现约定：
 *   - 不改任何 CSS，也不新增元素：直接在 document 上做指针事件委托，
 *     按下时若指针落在侧栏左边缘的“抓取带”内就开始拖拽；
 *   - 每次操作的都是“当前标签页里那个可见的侧栏”（getActiveAside），
 *     所以切页之后依旧能拖；
 *   - 宽度范围写在下面的常量里：最小 ASIDE_MIN_W（300px）、最大 ASIDE_MAX_W（600px）；
 *     上限同时还受父容器限制（要给主视图留 ASIDE_MAIN_MIN 的余量），
 *     避免窗口很窄时把工作区挤破；
 *   - 只有 display 不为 none（即真正可见）时才允许拖拽；
 *   - 拖拽本身就是改宽度，所以 width 是唯一被写入的行内布局样式，
 *     它不是用来给 CSS“补效果”的；除此之外只写 cursor，不碰其它样式。
 * ============================================================ */

// 当前可见的侧栏：项目工作区里 .inner 直系的 .asideMain 由标签页切换
// （selectProjTab）决定显示哪一个，所以不能写死 id，只能按“可见”来取。
// 主视图那一页根本没有侧栏，这时返回 null —— 下面的判定都按“没有侧栏”
// 走静默分支（不拖、不报错），调用处不需要再判空。
function getActiveAside() {
    const asides = document.querySelectorAll('.secProjPanel .inner > .asideMain');
    for (const el of asides) {
        if (isAsideVisible(el)) return el;
    }
    return null;
}

const ASIDE_EDGE_IN = 6;          // 抓取带：左边界往右的宽度（侧栏内侧）
const ASIDE_EDGE_OUT = 8;         // 抓取带：左边界往左的宽度（与主视图之间的间隙）
const ASIDE_MIN_W = 300;          // 拖拽下限：侧栏最小宽度
const ASIDE_MAX_W = 600;          // 拖拽上限：侧栏最大宽度
const ASIDE_MAIN_MIN = 240;       // 硬上限之外，还要给主视图至少留出的宽度

let asideDrag = null;             // 拖拽状态：{ el, startX, startWidth, min, max }
let asideCursor = null;           // 上一次写入光标的 { el, on }；el 可能已随切页隐藏

// 侧栏是否可见（display 为 none 时不可拖拽）
// 注意：隐藏侧栏的是它的祖先工作区（secHome / secProjPanel），
//       元素自身的 computed display 依然是 flex，所以不能只看自身。
function isAsideVisible(el) {
    if (!el || getComputedStyle(el).display === 'none') return false;
    if (el.checkVisibility) return el.checkVisibility(); // 祖先 display:none 也判为不可见
    return el.getClientRects().length > 0;
}

// 拖拽下限：侧栏不许窄于 ASIDE_MIN_W；
// CSS 的 min-width 比它更大时以 CSS 为准（两者取大，保证不会小于 300px）
function asideMinWidth(el) {
    const v = parseFloat(getComputedStyle(el).minWidth);
    return Math.max(isNaN(v) ? 0 : v, ASIDE_MIN_W);
}

// 拖拽上限：侧栏不许宽于 ASIDE_MAX_W；
// 同时要给主视图留下 ASIDE_MAIN_MIN 的余量（窗口很窄时上限会低于 ASIDE_MAX_W），
// 最后再保证不小于下限，免得出现负值把宽度拖坏
function asideMaxWidth(el) {
    const parent = el.parentElement;
    const avail = parent ? parent.clientWidth : Infinity;
    return Math.max(asideMinWidth(el), Math.min(ASIDE_MAX_W, avail - ASIDE_MAIN_MIN));
}

// 指针是否落在侧栏左边缘的抓取带内（纵向必须和侧栏有重叠）
function isOnAsideEdge(el, e) {
    if (!isAsideVisible(el)) return false;
    const rect = el.getBoundingClientRect();
    return e.clientY >= rect.top && e.clientY <= rect.bottom &&
        e.clientX >= rect.left - ASIDE_EDGE_OUT && e.clientX <= rect.left + ASIDE_EDGE_IN;
}

document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // 只响应鼠标左键
    const el = getActiveAside();
    if (!isOnAsideEdge(el, e)) return;
    e.preventDefault(); // 拖拽期间不要选中文字
    asideDrag = {
        el,
        startX: e.clientX,
        startWidth: el.offsetWidth, // 以按下瞬间的宽度为基准，按位移增减
        min: asideMinWidth(el),
        max: asideMaxWidth(el)
    };
    document.body.style.cursor = 'col-resize'; // 拖到侧栏外面时光标也保持拖拽态
});

document.addEventListener('pointermove', (e) => {
    if (!asideDrag) {
        updateAsideCursor(e);
        return;
    }
    const width = asideDrag.startWidth + (asideDrag.startX - e.clientX); // 左移变宽
    const clamped = Math.min(Math.max(width, asideDrag.min), asideDrag.max);
    asideDrag.el.style.width = clamped + 'px';
});

function endAsideDrag() {
    if (!asideDrag) return;
    asideDrag = null;
    document.body.style.cursor = '';
}

document.addEventListener('pointerup', endAsideDrag);
document.addEventListener('pointercancel', endAsideDrag);

// 悬停在抓取带上时给出拖拽光标（只写 cursor，不动布局）
// 注意：主视图那一页没有侧栏，getActiveAside() 会返回 null，此时必须把光标
// 从上一个侧栏上擦掉——否则那个侧栏（可能已经切页隐藏）会一直带着
// col-resize，且因为“状态没变就早退”，回来时也不会被清掉。
function updateAsideCursor(e) {
    const el = getActiveAside();
    const on = isOnAsideEdge(el, e);
    if (asideCursor && asideCursor.el === el && asideCursor.on === on) return; // 状态没变
    if (asideCursor && asideCursor.el && asideCursor.el !== el) {
        asideCursor.el.style.cursor = ''; // 切页后擦掉旧侧栏上的光标
    }
    asideCursor = { el, on };
    if (el) el.style.cursor = on ? 'col-resize' : '';
}

function openTST() {
    getDiv('rightGetWin').style.transform = "translateX(50%) translateY(0%)"
}

function sidebarToNarrow() {
    getDiv('secAside-Wide').style.display = "none";
    getDiv('secAside-Narrow').style.display = "flex";
}

function sidebarToWide() {
    getDiv('secAside-Wide').style.display = "flex";
    getDiv('secAside-Narrow').style.display = "none";
}