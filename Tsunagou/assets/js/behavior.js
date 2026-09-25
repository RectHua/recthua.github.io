/* ============================================================================
 * Tsunagou 前端控制层 —— assets/js/behavior.js
 * ----------------------------------------------------------------------------
 * 本文件是页面与后端之间唯一的桥：
 *   · 后端 / 宿主脚本 / 控制台 → 调 Tsunagou.dispatch(msg) 或 Tsunagou.render.*()
 *   · 用户操作                → Tsunagou.app / Tsunagou.actions → Tsunagou.api（HTTP）
 *
 * 三条铁律（改代码前先读这三条）：
 *   1. 显隐只写 display：隐藏写 'none'，显示写 CSS 里那个真实的 display 值
 *      （CSS 里 .tabMain / .asideMain / .contentNDP 的默认值就是 none，
 *        所以这些元素"显示"时必须显式写 'flex'，清成 '' 只会继续保持隐藏）。
 *      需要淡入的窗口/面板才额外写 opacity，绝不写宽高、背景、flex-* 等布局行内样式。
 *   2. 对外的名字一律挂在 window.Tsunagou 上（宿主脚本直接调得到）。
 *   3. index.html 只通过 id 与 onclick 和本文件发生关系，JS 不动 CSS、不改结构。
 *
 * 区段索引（直接搜 "§n" 即可跳转）：
 *   §0 基础工具     §1 配置·事件·状态   §2 UI 原语      §3 反馈组件
 *   §4 通信层       §5 渲染层           §6 动作与分发   §7 初始空状态   §8 启动
 * ========================================================================== */

(function () {
    'use strict';

    /* ========================================================================
     * §0 基础工具
     * ====================================================================== */

    /* ---- 查询 ------------------------------------------------------------ */

    function byId(id) { return document.getElementById(id); }

    function qs(selector, root) { return (root || document).querySelector(selector); }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function closest(node, selector) {
        if (!node || node.nodeType !== 1 || !node.closest) return null;
        return node.closest(selector);
    }

    /* 元素或 id 都接受，统一解析成元素 */
    function resolveEl(target) {
        if (!target) return null;
        return typeof target === 'string' ? byId(target) : target;
    }

    /* ---- 显隐（全文件唯一写 display 的地方） ------------------------------ */

    /* 显示：把行内 display 清成空串，交回 CSS。
       只适用于"CSS 里本来就是显示状态"的元素（如 .secAside、.inner 里的 .content）。*/
    function showEl(target) {
        const node = resolveEl(target);
        if (node) node.style.display = '';
        return node;
    }

    /* 隐藏：写 display:none */
    function hideEl(target) {
        const node = resolveEl(target);
        if (node) node.style.display = 'none';
        return node;
    }

    /* 显式指定 display 值（CSS 默认是 none 的元素必须走这里） */
    function displayEl(target, value) {
        const node = resolveEl(target);
        if (node) node.style.display = value;
        return node;
    }

    /* 是否真正可见：checkVisibility 能识破"祖先被隐藏、自己 computed display 仍是 flex"的陷阱 */
    function isShown(target) {
        const node = resolveEl(target);
        if (!node) return false;
        if (node.checkVisibility) return node.checkVisibility();
        return node.getClientRects().length > 0;
    }

    /* 淡入：先落 display 并强制重排（让元素真的以 opacity:0 渲染一帧），再写 opacity:1。
       两步法不可合并 —— 同一次任务里同时改 display 和 opacity，浏览器不会触发过渡。*/
    function revealEl(target, display) {
        const node = resolveEl(target);
        if (!node) return null;
        node.style.display = display || 'flex';
        void node.offsetWidth;
        node.style.opacity = '1';
        return node;
    }

    /* 淡出并隐藏：不做离开动画（有意为之），opacity 顺手归零以便下次淡入 */
    function concealEl(target) {
        const node = resolveEl(target);
        if (!node) return null;
        node.style.display = 'none';
        node.style.opacity = '0';
        return node;
    }

    /* ---- 文本与转义 ------------------------------------------------------ */

    function toText(value) {
        if (value === null || value === undefined) return '';
        return String(value);
    }

    /* 拼 HTML 模板时，任何来自后端的数据都必须经过它 */
    function esc(value) {
        return toText(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* 先转义再把换行变成 <br>，用于"多行文本块"字段 */
    function nl2br(value) {
        return esc(value).replace(/\r?\n/g, '<br>');
    }

    /* ---- 小工具 ---------------------------------------------------------- */

    function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

    function clampNum(value, min, max) { return Math.min(Math.max(value, min), max); }

    function deepClone(value) {
        return value === undefined ? value : JSON.parse(JSON.stringify(value));
    }

    function isPlainObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function toArray(value) {
        if (Array.isArray(value)) return value;
        return (value === null || value === undefined) ? [] : [value];
    }

    /* 深合并：把 patch 里的字段并进 target（数组整体替换，不逐项合并） */
    function deepAssign(target, patch) {
        Object.keys(patch || {}).forEach(function (key) {
            const value = patch[key];
            if (isPlainObject(value) && isPlainObject(target[key])) {
                deepAssign(target[key], value);
            } else {
                target[key] = deepClone(value);
            }
        });
        return target;
    }

    /* 按 'a.b.c' 路径读，中间缺字段就返回 fallback */
    function getPath(obj, path, fallback) {
        if (!path) return obj === undefined ? fallback : obj;
        const parts = String(path).split('.');
        let cursor = obj;
        for (let i = 0; i < parts.length; i++) {
            if (cursor === null || cursor === undefined) return fallback;
            cursor = cursor[parts[i]];
        }
        return cursor === undefined ? fallback : cursor;
    }

    /* 按 'a.b.c' 路径写，中间缺对象就补一个空对象 */
    function setPath(obj, path, value) {
        const parts = String(path).split('.');
        let cursor = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (!isPlainObject(cursor[key])) cursor[key] = {};
            cursor = cursor[key];
        }
        cursor[parts[parts.length - 1]] = value;
        return value;
    }

    /* ---- DOM 构造 -------------------------------------------------------- */

    function makeEl(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = toText(text);
        return node;
    }

    /* 把 HTML 字符串变成节点列表（渲染器往里塞模板时用） */
    function parseHTML(html) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        return tpl.content;
    }

    /* 渲染器的出口：整体替换容器内容 */
    function fill(container, html) {
        const node = resolveEl(container);
        if (!node) return null;
        node.innerHTML = html;
        return node;
    }

    /* ---- 事件委托 -------------------------------------------------------- */

    /* 统一挂 click 委托：selectors 是 '选择器' 或 {selector, handler} 数组，
       handler(node, event) 拿到的 node 已经是 selector 命中的那个元素。 */
    function delegateClick(selectors, handler) {
        document.addEventListener('click', function (event) {
            for (let i = 0; i < selectors.length; i++) {
                const node = closest(event.target, selectors[i]);
                if (node) { handler(node, event); return; }
            }
        });
    }

    /* ========================================================================
     * §1 配置 · 事件 · 状态
     * ====================================================================== */

    /* ---- 配置 ------------------------------------------------------------ */

    const DEFAULT_PATHS = {
        /* 读取类：GET {baseUrl}{path}
           带 {project} 的表示"属于某个协作项目"，请求时用当前项目 id 替换；
           没选项目时这些请求会被直接跳过（见 Tsunagou.refresh）。*/
        projects: '/projects',
        agentsWindow: '/agents',
        detectAgent: '/agents/detect',
        settings: '/settings',
        project: '/projects/{project}',
        inbox: '/projects/{project}/inbox',
        agents: '/projects/{project}/agents',
        tasks: '/projects/{project}/tasks',
        conflicts: '/projects/{project}/conflicts',
        audits: '/projects/{project}/audits',
        workspaces: '/projects/{project}/workspaces',
        acceptance: '/projects/{project}/acceptance',
        checkpoints: '/projects/{project}/checkpoints',
        timeline: '/projects/{project}/timeline',
        /* 写入类：POST {baseUrl}{path}
           带 {project} 的表示"改的是这个项目里的东西"；
           不带的是全局的（管理 Agent、改设置、新建项目），或本来就带唯一 id 的。*/
        projectCreate: '/projects',
        settingSave: '/settings',
        dataWipe: '/settings/wipe',
        agentCreate: '/agents',
        agentRemove: '/agents/remove',
        agentSetMain: '/agents/set-main',
        subAgentCreate: '/sub-agents',
        pathRecord: '/path/records',
        projectFinish: '/projects/{project}/finish',
        inboxHandle: '/projects/{project}/inbox/handle',
        inboxRevoke: '/projects/{project}/inbox/revoke',
        acceptanceConfirm: '/projects/{project}/acceptance/confirm',
        acceptanceArchive: '/projects/{project}/acceptance/archive',
        checkpointRetry: '/projects/{project}/checkpoints/retry'
    };

    const config = {
        /* 'demo'：不发任何请求，页面停在空骨架（或宿主自己 dispatch 填的数据）；
           'live'：走 HTTP（本仓库的模拟后端就是在 live 模式下应答的）。*/
        mode: 'demo',
        baseUrl: '/api',
        timeout: 10000,
        token: '',
        headers: {},
        /* 每类数据的请求路径，后端不一样时用 Tsunagou.config.setPaths({...}) 覆盖 */
        paths: Object.assign({}, DEFAULT_PATHS)
    };

    function configSnapshot() {
        return {
            mode: config.mode,
            baseUrl: config.baseUrl,
            timeout: config.timeout,
            token: config.token,
            headers: Object.assign({}, config.headers),
            paths: Object.assign({}, config.paths)
        };
    }

    function joinUrl(path) {
        if (/^https?:\/\//i.test(path)) return path;
        const base = config.baseUrl || '';
        if (!base) return path;
        return base.replace(/\/+$/, '') + (path.charAt(0) === '/' ? path : '/' + path);
    }

    /* ---- 事件总线 -------------------------------------------------------- */

    const listenerMap = Object.create(null);

    function on(name, handler) {
        if (typeof handler !== 'function') return function () {};
        const list = listenerMap[name] || (listenerMap[name] = []);
        list.push(handler);
        return function offOne() { off(name, handler); };
    }

    function once(name, handler) {
        const unbind = on(name, function (detail) {
            unbind();
            handler(detail);
        });
        return unbind;
    }

    function off(name, handler) {
        const list = listenerMap[name];
        if (!list) return;
        if (!handler) { delete listenerMap[name]; return; }
        const index = list.indexOf(handler);
        if (index >= 0) list.splice(index, 1);
    }

    function emit(name, detail) {
        const list = listenerMap[name];
        if (!list || !list.length) return 0;
        /* 复制一份再遍历：回调里可能反向解绑 */
        list.slice().forEach(function (handler) {
            try {
                handler(detail, name);
            } catch (error) {
                console.error('[Tsunagou] 事件回调出错：' + name, error);
            }
        });
        return list.length;
    }

    /* ---- 状态 ------------------------------------------------------------ */

    /* state.data 的形状（与后端 JSON 同构，字段名见 method.md §7）：
       { currentProjectId, projects, project, inbox, agents, agentsWindow,
         tasks, taskDetail, conflicts, audits, workspaces, acceptance,
         checkpoints, timeline, settings, wizard } */

    const state = {
        data: {},

        /* 回到初始（空）状态：清空所有后端数据，只剩一个空骨架 */
        reset: function () {
            state.data = deepClone(EMPTY_STATE);
            emit('state:change', { reason: 'reset', path: '*' });
            emit('state:reset', null);
            return state.data;
        },

        /* 把缺失的字段补齐（只在没有的地方填默认值，已有数据一律保留）。
           init() 用的是它而不是 reset()：宿主脚本有可能在启动之前就
           dispatch 过数据，那种情况下不能被无条件的 reset() 冲掉。*/
        hydrate: function () {
            state.data = deepAssign(deepClone(EMPTY_STATE), state.data || {});
            return state.data;
        },

        /* 整体替换（后端一次性下发全量数据时用） */
        replace: function (data) {
            state.data = isPlainObject(data) ? deepClone(data) : {};
            emit('state:change', { reason: 'replace', path: '*' });
            return state.data;
        },

        /* 局部覆盖（深合并） */
        patch: function (partial) {
            deepAssign(state.data, partial || {});
            emit('state:change', { reason: 'patch', path: '*' });
            return state.data;
        },

        /* 读一个字段：state.get('inbox.pending', []) */
        get: function (path, fallback) {
            return getPath(state.data, path, fallback);
        },

        /* 写一个字段：state.set('project.name', '新名字') */
        set: function (path, value) {
            setPath(state.data, path, value);
            emit('state:change', { reason: 'set', path: path, value: value });
            return value;
        },

        /* 监听状态变化（渲染器靠它做自动重绘） */
        watch: function (handler) { return on('state:change', handler); }
    };

    /* ---- 命名空间 -------------------------------------------------------- */

    /* 注意 config 与 state 是"内部那个对象本体"，不是空壳：
       它们的属性都是就地 assign 上去的，所以这里必须直接引用同一个对象，
       否则 Tsunagou.config.setBaseUrl 这类方法会挂在内部对象上、外部拿不到。*/
    const Tsunagou = window.Tsunagou = {
        version: '0.2.0',
        util: {},
        config: config,
        events: {},
        state: state,
        ui: {},
        notify: {},
        dialog: {},
        api: {},
        form: {},
        render: {},
        actions: {},
        app: {}
    };

    /* 各子模块的短别名（下面的区段统一用这些名字，别再声明同名变量） */
    const util = Tsunagou.util;
    const events = Tsunagou.events;
    const ui = Tsunagou.ui;
    const notify = Tsunagou.notify;
    const dialog = Tsunagou.dialog;
    const api = Tsunagou.api;
    const form = Tsunagou.form;
    const render = Tsunagou.render;
    const actions = Tsunagou.actions;
    const app = Tsunagou.app;

    Object.assign(util, {
        byId: byId,
        qs: qs,
        qsa: qsa,
        closest: closest,
        resolveEl: resolveEl,
        show: showEl,
        hide: hideEl,
        display: displayEl,
        isShown: isShown,
        reveal: revealEl,
        conceal: concealEl,
        text: toText,
        esc: esc,
        nl2br: nl2br,
        wait: wait,
        clamp: clampNum,
        clone: deepClone,
        toArray: toArray,
        isPlainObject: isPlainObject,
        deepAssign: deepAssign,
        getPath: getPath,
        setPath: setPath,
        make: makeEl,
        parseHTML: parseHTML,
        fill: fill,
        delegateClick: delegateClick
    });

    Object.assign(events, {
        on: on,
        once: once,
        off: off,
        emit: emit
    });

    Object.assign(config, {
        get: configSnapshot,
        snapshot: configSnapshot,
        joinUrl: joinUrl,
        setMode: function (mode) {
            config.mode = (mode === 'live') ? 'live' : 'demo';
            emit('config:change', configSnapshot());
            return config.mode;
        },
        setBaseUrl: function (url) {
            config.baseUrl = toText(url).replace(/\/+$/, '');
            return config.baseUrl;
        },
        setToken: function (token) {
            config.token = toText(token);
            return config.token;
        },
        setTimeout: function (ms) {
            const value = Number(ms);
            if (isFinite(value) && value > 0) config.timeout = value;
            return config.timeout;
        },
        setHeaders: function (headers) {
            config.headers = Object.assign({}, headers || {});
            return config.headers;
        },
        setPaths: function (paths) {
            Object.assign(config.paths, paths || {});
            return config.paths;
        },
        setPath: function (key, path) {
            config.paths[key] = path;
            return config.paths;
        },
        path: function (key) {
            return config.paths[key] || DEFAULT_PATHS[key] || '';
        }
    });

    /* ========================================================================
     * §2 UI 原语
     * ------------------------------------------------------------------------
     * 这一层只干一件事：把页面上"能点的东西"变成函数。
     * 每个函数都对应 HTML 里的一段固定结构，不承载任何业务含义 ——
     * 业务含义在 §6 的 actions / app 里。
     * ====================================================================== */

    /* ---- 项目标签页索引表 ------------------------------------------------ */

    /* 顺序必须与 index.html 里 .tabArea 的 .tabS 顺序、.inner 的 .tabMain 顺序一致。
       slug 用来拼 id：标签按钮 #tab-<slug>、主视图 #pane-<slug>、侧栏 #aside-<slug>。*/
    const PROJECT_TABS = [
        { slug: 'overview', title: '主视图' },
        { slug: 'inbox', title: '我的收件箱' },
        { slug: 'agents', title: 'Agent 管理' },
        { slug: 'tasks', title: '任务区' },
        { slug: 'conflict', title: '冲突与协商' },
        { slug: 'audit', title: '意图与权限审计' },
        { slug: 'workspace', title: '工作区' },
        { slug: 'acceptance', title: '项目验收' },
        { slug: 'checkpoints', title: '存档点' },
        { slug: 'path', title: '总路径' }
    ];

    const TAB_ACTIVE_CLASS = 'tabSactive';
    /* 主视图 / 侧栏"显示"时要写的 display 值，必须与 CSS 里 .tabMainNormal /
       .asideMainNormal 的 display 一致（都是 flex），否则初次切换后布局会跟初始态对不上。*/
    const PANE_DISPLAY = 'flex';

    function tabButton(slug) { return byId('tab-' + slug); }
    function tabPane(slug) { return byId('pane-' + slug); }
    function tabAside(slug) { return byId('aside-' + slug); }

    function indexOfSlug(slug) {
        for (let i = 0; i < PROJECT_TABS.length; i++) {
            if (PROJECT_TABS[i].slug === slug) return i;
        }
        return -1;
    }

    /* 接受 slug / 中文标题 / 序号，统一成 slug */
    function normalizeSlug(value) {
        if (typeof value === 'number') {
            const byIndex = PROJECT_TABS[value];
            return byIndex ? byIndex.slug : '';
        }
        const text = toText(value);
        if (!text) return '';
        const hit = PROJECT_TABS.filter(function (item) {
            return item.slug === text || item.title === text;
        })[0];
        return hit ? hit.slug : '';
    }

    /* ---- 工作区：初始页 / 项目页 ------------------------------------------ */

    /* 两块 <section> 只有 class 没有 id：.secHome（初始）与 .secProjPanel（项目）。
       JS 只管显隐：隐藏方写行内 display:none，显示方清掉行内 display 交回 CSS。*/
    const WORKSPACE_NAMES = { home: 'secHome', project: 'secProjPanel' };

    ui.workspace = {
        show: function (name) {
            const key = (name === 'project' || name === 'secProjPanel') ? 'project' : 'home';
            Object.keys(WORKSPACE_NAMES).forEach(function (item) {
                const node = qs('.' + WORKSPACE_NAMES[item]);
                if (!node) return;
                if (item === key) showEl(node); else hideEl(node);
            });
            emit('ui:workspace', { name: key });
            return key;
        },
        home: function () { return ui.workspace.show('home'); },
        project: function () { return ui.workspace.show('project'); },
        current: function () {
            const node = qs('.' + WORKSPACE_NAMES.project);
            return isShown(node) ? 'project' : 'home';
        }
    };

    /* ---- 左侧大侧栏：展开 / 折叠 ------------------------------------------ */

    const SIDEBAR_WIDE_ID = 'secAside-Wide';
    const SIDEBAR_NARROW_ID = 'secAside-Narrow';

    ui.sidebar = {
        fold: function () {
            hideEl(SIDEBAR_WIDE_ID);
            displayEl(SIDEBAR_NARROW_ID, 'flex');
            emit('ui:sidebar', { folded: true });
        },
        unfold: function () {
            displayEl(SIDEBAR_WIDE_ID, 'flex');
            hideEl(SIDEBAR_NARROW_ID);
            emit('ui:sidebar', { folded: false });
        },
        isFolded: function () { return isShown(SIDEBAR_NARROW_ID); },
        toggle: function () {
            if (ui.sidebar.isFolded()) ui.sidebar.unfold(); else ui.sidebar.fold();
        }
    };

    /* ---- 模态窗口 -------------------------------------------------------- */

    /* #secWindow 的 CSS 是 display:none + opacity:0 + transition。
       开窗 = 落 display:'flex' → 强制重排 → opacity:'1'（两步走，不能合并）。*/
    const WINDOW_DISPLAY = 'flex';
    const openedWindows = [];

    ui.window = {
        /* 打开窗口；reset 为 true 时先清空窗口内的输入（表单类窗口用） */
        open: function (id, options) {
            const node = resolveEl(id);
            if (!node) return null;
            if (options && options.reset) ui.window.clearInputs(node);
            revealEl(node, WINDOW_DISPLAY);
            if (openedWindows.indexOf(node) < 0) openedWindows.push(node);
            emit('ui:window', { id: node.id, open: true });
            return node;
        },
        close: function (id) {
            const node = resolveEl(id);
            if (!node) return null;
            concealEl(node);
            const index = openedWindows.indexOf(node);
            if (index >= 0) openedWindows.splice(index, 1);
            emit('ui:window', { id: node.id, open: false });
            return node;
        },
        /* 关闭当前所有打开的窗口（从上往下） */
        closeAll: function () {
            openedWindows.slice().reverse().forEach(function (node) { ui.window.close(node); });
        },
        /* 关掉最上面那一层 */
        closeTop: function () {
            const node = openedWindows[openedWindows.length - 1];
            return node ? ui.window.close(node) : null;
        },
        isOpen: function (id) { return isShown(resolveEl(id)); },
        list: function () {
            return openedWindows.slice().map(function (node) { return node.id; });
        },
        /* 清空窗口里所有 input 的值（行内 value 不动，只清当前状态） */
        clearInputs: function (root) {
            qsa('input', resolveEl(root)).forEach(function (input) { input.value = ''; });
        },
        /* 把一组值写进窗口里的 input（后端回填表单时用） */
        fillInputs: function (root, values) {
            const list = qsa('input', resolveEl(root));
            toArray(values).forEach(function (value, index) {
                if (list[index]) list[index].value = toText(value);
            });
            return list;
        }
    };

    /* 点窗口遮罩关闭：只有点在 .secWindow 自己身上（不是窗口盒子内部）才算 */
    ui.window.bindBackdrop = function () {
        delegateClick(['.secWindow'], function (node, event) {
            if (event.target === node) ui.window.close(node);
        });
    };

    /* ---- 项目标签页 ------------------------------------------------------ */

    let currentTabSlug = '';

    ui.tabs = {
        /* 切到某个标签页：按钮高亮 + 只显示该主视图；**侧栏一律收起**，
           侧栏必须由"点击对应内容"来唤出（见 §6 的内容点击映射）。*/
        project: function (target) {
            const slug = normalizeSlug(target);
            if (!slug) return '';
            PROJECT_TABS.forEach(function (item) {
                const button = tabButton(item.slug);
                if (button) button.classList.toggle(TAB_ACTIVE_CLASS, item.slug === slug);
                const pane = tabPane(item.slug);
                if (!pane) return;
                if (item.slug === slug) revealEl(pane, PANE_DISPLAY); else concealEl(pane);
            });
            ui.aside.hideAll();
            currentTabSlug = slug;
            emit('ui:tab', { slug: slug, index: indexOfSlug(slug) });
            return slug;
        },
        current: function () { return currentTabSlug; },
        list: function () { return PROJECT_TABS.slice(); },
        display: function () { return PANE_DISPLAY; }
    };

    /* 点击标签按钮即切换（按 DOM 顺序取序号，不依赖 id 是否存在） */
    ui.tabs.bindClicks = function () {
        document.addEventListener('click', function (event) {
            const bar = qs('.secProjPanel .tabArea');
            const button = closest(event.target, '.secProjPanel .tabArea > .tabS');
            if (!button || !bar) return;
            const list = qsa(':scope > .tabS', bar);
            ui.tabs.project(list.indexOf(button));
        });
    };

    /* ---- 区块内标签组（.tabblock） ---------------------------------------- */

    /* 结构：.tabblock > .tabPlace > .tabItem  与  .tabblock > .tabContent 按顺序配对。
       .tabContent 的 CSS 是 display:flex，所以显示就清成 ''、隐藏写 'none'。*/

    function blockTabs(block) {
        const place = Array.prototype.filter.call(block.children, function (node) {
            return node.classList.contains('tabPlace');
        })[0];
        if (!place) return [];
        return Array.prototype.filter.call(place.children, function (node) {
            return node.classList.contains('tabItem');
        });
    }

    function blockPanels(block) {
        return Array.prototype.filter.call(block.children, function (node) {
            return node.classList.contains('tabContent');
        });
    }

    ui.blockTabs = {
        /* 选中某个标签组里的第 index 个标签 */
        select: function (blockRef, index) {
            const block = resolveEl(blockRef) || byId('block-' + blockRef);
            if (!block) return -1;
            const tabs = blockTabs(block);
            const panels = blockPanels(block);
            if (index < 0 || index >= tabs.length || index >= panels.length) return -1;
            tabs.forEach(function (tab, i) { tab.classList.toggle('tabItemActive', i === index); });
            panels.forEach(function (panel, i) {
                if (i === index) showEl(panel); else hideEl(panel);
            });
            emit('ui:blocktab', { block: block.id, index: index });
            return index;
        },
        /* 按标签上的文字选（后端说"切到契约"时好用） */
        selectByText: function (blockRef, text) {
            const block = resolveEl(blockRef) || byId('block-' + blockRef);
            if (!block) return -1;
            const tabs = blockTabs(block);
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].textContent.trim() === toText(text)) return ui.blockTabs.select(block, i);
            }
            return -1;
        },
        current: function (blockRef) {
            const block = resolveEl(blockRef) || byId('block-' + blockRef);
            if (!block) return -1;
            return blockTabs(block).findIndex(function (tab) {
                return tab.classList.contains('tabItemActive');
            });
        },
        /* 冲突与协商：0 分歧 / 1 冲突 / 2 Agent 间协商 / 3 契约 */
        conflict: function (index) { return ui.blockTabs.select('block-conflict', index); },
        /* 意图与权限审计：0 Agent 意图 / 1 Agent 权限 */
        audit: function (index) { return ui.blockTabs.select('block-audit', index); }
    };

    ui.blockTabs.bindClicks = function () {
        document.addEventListener('click', function (event) {
            const tab = closest(event.target, '.tabblock > .tabPlace > .tabItem');
            if (!tab) return;
            const block = closest(tab, '.tabblock');
            if (!block) return;
            ui.blockTabs.select(block, blockTabs(block).indexOf(tab));
        });
    };

    /* 初始化：每个 .tabblock 各自停在自己标了 .tabItemActive 的那一项上。
       不跑这一步的话，面板的 CSS 默认 display 是 flex，四个子标签会同时显示。*/
    ui.blockTabs.init = function () {
        qsa('.tabblock').forEach(function (block) {
            const tabs = blockTabs(block);
            let index = 0;
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].classList.contains('tabItemActive')) { index = i; break; }
            }
            ui.blockTabs.select(block, index);
        });
    };

    /* ---- 设置窗口的左侧标签 ---------------------------------------------- */

    /* 键 ←→ 面板 id：personal→#uSet1 … about→#uSet4 */
    const SETTING_TABS = {
        personal: 'uSet1',
        data: 'uSet2',
        debug: 'uSet3',
        about: 'uSet4'
    };
    const SETTING_ORDER = ['personal', 'data', 'debug', 'about'];
    const SETTING_DISPLAY = 'flex';

    function settingPanelId(keyOrId) {
        if (SETTING_TABS[keyOrId]) return SETTING_TABS[keyOrId];
        const text = toText(keyOrId);
        if (/^uSet[1-4]$/.test(text)) return text;
        return '';
    }

    ui.settingTabs = {
        select: function (keyOrId) {
            const panelId = settingPanelId(keyOrId);
            if (!panelId) return '';
            const index = Number(panelId.replace('uSet', ''));
            SETTING_ORDER.forEach(function (key, i) {
                const button = byId('uSet' + (i + 1) + 'b');
                if (button) {
                    button.classList.toggle('Active', (i + 1) === index);
                    button.classList.toggle('NoActive', (i + 1) !== index);
                }
                const panel = byId('uSet' + (i + 1));
                if (!panel) return;
                if ((i + 1) === index) revealEl(panel, SETTING_DISPLAY); else concealEl(panel);
            });
            emit('ui:settingtab', { key: keyOrId, panel: panelId });
            return panelId;
        },
        personal: function () { return ui.settingTabs.select('personal'); },
        data: function () { return ui.settingTabs.select('data'); },
        debug: function () { return ui.settingTabs.select('debug'); },
        about: function () { return ui.settingTabs.select('about'); },
        current: function () {
            for (let i = 0; i < SETTING_ORDER.length; i++) {
                const panel = byId(SETTING_TABS[SETTING_ORDER[i]]);
                if (isShown(panel)) return SETTING_ORDER[i];
            }
            return '';
        }
    };

    /* ---- 新建协作向导（#addProj 的四步） ---------------------------------- */

    /* 结构约定：#newXz1..4 是每步的正文，#xz1..4 是每步的按钮组。
       向导本身的"下一步/上一步/完成"只是步骤切换，只有"完成"才真正发请求。*/
    const WIZARD_STEPS = 4;
    let wizardStep = 1;

    /* 每一步的输入框（按 DOM 顺序）*/
    function wizardInputs(step) { return qsa('#newXz' + step + ' input'); }

    /* 每一步的必填校验：返回错误文案，null 表示通过 */
    const WIZARD_REQUIRED = {
        1: ['协作的名字'],
        2: ['主 Agent 名称', '主 Agent 的 API 地址']
    };

    function wizardValidate(step) {
        const labels = WIZARD_REQUIRED[step];
        if (!labels) return null;
        const inputs = wizardInputs(step);
        for (let i = 0; i < labels.length; i++) {
            const input = inputs[i];
            if (!input || !toText(input.value).trim()) return '请填写' + labels[i];
        }
        return null;
    }

    ui.wizard = {
        steps: WIZARD_STEPS,
        go: function (step) {
            const value = clampNum(Number(step) || 1, 1, WIZARD_STEPS);
            wizardStep = value;
            for (let i = 1; i <= WIZARD_STEPS; i++) {
                const pane = byId('newXz' + i);
                if (pane) { if (i === value) revealEl(pane, 'flex'); else concealEl(pane); }
                const options = byId('xz' + i);
                if (options) { if (i === value) displayEl(options, 'flex'); else hideEl(options); }
            }
            /* 最后一步是"核对"，每次进来都按当前输入重画，避免看到上一次的残留 */
            if (value === WIZARD_STEPS) render.wizardReview(ui.wizard.collect());
            emit('ui:wizard', { step: value });
            return value;
        },
        current: function () { return wizardStep; },
        next: function () {
            const error = wizardValidate(wizardStep);
            if (error) { notify.error(error); return wizardStep; }
            return ui.wizard.go(wizardStep + 1);
        },
        prev: function () { return ui.wizard.go(wizardStep - 1); },
        reset: function () { return ui.wizard.go(1); },
        /* 打开向导窗口（每次都从第一步开始，并清掉上次的输入与草稿） */
        open: function () {
            state.set('wizard.draftSubAgents', []);
            state.set('wizard.detectedMainAgent', null);
            ui.window.open('addProj');
            ui.window.clearInputs('addProj');
            ui.wizard.reset();
            render.wizardSubAgents([]);
            render.wizardAgentBox(null);
            render.wizardReview(ui.wizard.collect());
            emit('ui:wizard', { step: 1, opened: true });
            return true;
        },
        /* 收集向导里所有输入，交给 actions.createProject */
        collect: function () {
            const mainInputs = wizardInputs(2);
            const detected = state.get('wizard.detectedMainAgent', null);
            return {
                name: toText(wizardInputs(1)[0] && wizardInputs(1)[0].value).trim(),
                mainAgent: {
                    name: toText(mainInputs[0] && mainInputs[0].value).trim(),
                    api: toText(mainInputs[1] && mainInputs[1].value).trim(),
                    /* 探测到的头像；没探测到就用默认 */
                    icon: (detected && detected.icon) || 'deepseek'
                },
                /* 第 3 步的子 Agent 列表由 state.data.wizard.draftSubAgents 维护 */
                subAgents: toArray(state.get('wizard.draftSubAgents', [])).slice()
            };
        },
        /* 完成：把向导内容发出去，成功后关窗并复位 */
        finish: function () {
            const error = wizardValidate(1) || wizardValidate(2);
            if (error) { notify.error(error); return Promise.resolve(false); }
            return Promise.resolve(actions.createProject(ui.wizard.collect()))
                .then(function (result) {
                    if (result === false) return false;
                    ui.window.close('addProj');
                    return wait(200).then(function () {
                        ui.wizard.reset();
                        state.set('wizard.draftSubAgents', []);
                    }).then(function () { return true; });
                });
        }
    };

    /* ---- 项目侧栏面板（默认隐藏，点内容才出现） --------------------------- */

    const ASIDE_SLUGS = ['inbox', 'tasks', 'conflict', 'audit', 'workspace', 'acceptance', 'path'];

    /* 侧栏里的分段：直接子元素中带 .content 的那些（第二个通常还带 .contentNDP） */
    function asideSections(aside) {
        return Array.prototype.filter.call(aside.children, function (node) {
            return node.classList.contains('content');
        });
    }

    /* 换掉侧栏标题栏上的文字（后端可以让侧栏标题跟着内容变） */
    function setAsideTitle(node, text) {
        const label = qs('.title .left p', node);
        if (label && text) label.textContent = toText(text);
    }

    ui.aside = {
        /* 显示某个侧栏；section 是分段序号（0 起），不传则保持当前分段 */
        show: function (slug, section) {
            const node = tabAside(slug);
            if (!node) return null;
            if (section !== undefined && section !== null) ui.aside.load(slug, section);
            revealEl(node, PANE_DISPLAY);
            emit('ui:aside', { slug: slug, visible: true, section: section });
            return node;
        },
        hide: function (slug) {
            const node = tabAside(slug);
            if (!node) return null;
            concealEl(node);
            emit('ui:aside', { slug: slug, visible: false });
            return node;
        },
        hideAll: function () {
            ASIDE_SLUGS.forEach(function (slug) { concealEl(tabAside(slug)); });
            emit('ui:aside', { slug: '*', visible: false });
        },
        /* 清空所有侧栏的内容（启动时调一次）
           目的：index.html 里那些占位文案不该有机会在"还没人填过"的时候露出来。*/
        clearAll: function () {
            ASIDE_SLUGS.forEach(function (slug) {
                const node = tabAside(slug);
                if (!node) return;
                asideSections(node).forEach(function (section) { fill(section, ''); });
            });
            return true;
        },
        /* 切到侧栏里的第几段（冲突的"分歧详情/契约详情"、审计的"意图/租约"靠它互斥）。
           .contentNDP 在 CSS 里就是 display:none，所以显示必须显式写 flex。*/
        load: function (slug, section, title) {
            const node = tabAside(slug);
            if (!node) return null;
            const sections = asideSections(node);
            const index = clampNum(Number(section) || 0, 0, Math.max(sections.length - 1, 0));
            sections.forEach(function (block, i) {
                displayEl(block, i === index ? 'flex' : 'none');
            });
            if (title) setAsideTitle(node, title);
            return sections[index] || null;
        },
        /* 整体重写某个侧栏的内容（渲染器调用） */
        fill: function (slug, html, options) {
            const node = tabAside(slug);
            if (!node) return null;
            const sections = asideSections(node);
            const target = sections[(options && options.section) || 0];
            if (!target) return null;
            fill(target, html);
            if (options && options.title) setAsideTitle(node, options.title);
            return target;
        },
        isOpen: function (slug) { return isShown(tabAside(slug)); }
    };

    /* 点侧栏标题栏右上角的 × 收起它自己 */
    ui.aside.bindClose = function () {
        delegateClick(['.secProjPanel .inner > .asideMain > .title > .right'], function (button) {
            concealEl(closest(button, '.asideMain'));
        });
    };

    /* ---- 侧栏宽度拖拽 ---------------------------------------------------- */

    /* 只改宽度和光标，不碰其它样式；拖拽范围由下面的常量决定。*/
    const ASIDE_EDGE_IN = 6;
    const ASIDE_EDGE_OUT = 8;
    const ASIDE_MIN_W = 300;
    const ASIDE_MAX_W = 600;
    const ASIDE_MAIN_MIN = 240;

    let asideDrag = null;
    let asideCursor = null;

    /* 当前可见的侧栏：不能靠 id（换页后就不对了），只能按"可见"找 */
    function activeAside() {
        const list = qsa('.secProjPanel .inner > .asideMain');
        for (let i = 0; i < list.length; i++) {
            if (isShown(list[i])) return list[i];
        }
        return null;
    }

    function asideMinWidth(node) {
        const value = parseFloat(getComputedStyle(node).minWidth);
        return Math.max(isNaN(value) ? 0 : value, ASIDE_MIN_W);
    }

    function asideMaxWidth(node) {
        const parent = node.parentElement;
        const available = parent ? parent.clientWidth : Infinity;
        return Math.max(asideMinWidth(node), Math.min(ASIDE_MAX_W, available - ASIDE_MAIN_MIN));
    }

    function onAsideEdge(node, event) {
        if (!isShown(node)) return false;
        const rect = node.getBoundingClientRect();
        return event.clientY >= rect.top && event.clientY <= rect.bottom &&
            event.clientX >= rect.left - ASIDE_EDGE_OUT && event.clientX <= rect.left + ASIDE_EDGE_IN;
    }

    function updateAsideCursor(event) {
        const node = activeAside();
        const on = onAsideEdge(node, event);
        if (asideCursor && asideCursor.el === node && asideCursor.on === on) return;
        if (asideCursor && asideCursor.el && asideCursor.el !== node) asideCursor.el.style.cursor = '';
        asideCursor = { el: node, on: on };
        if (node) node.style.cursor = on ? 'col-resize' : '';
    }

    function endAsideDrag() {
        if (!asideDrag) return;
        asideDrag = null;
        document.body.style.cursor = '';
    }

    ui.asideDrag = {
        bind: function () {
            document.addEventListener('pointerdown', function (event) {
                if (event.button !== 0) return;
                const node = activeAside();
                if (!onAsideEdge(node, event)) return;
                event.preventDefault();
                asideDrag = {
                    el: node,
                    startX: event.clientX,
                    startWidth: node.offsetWidth,
                    min: asideMinWidth(node),
                    max: asideMaxWidth(node)
                };
                document.body.style.cursor = 'col-resize';
            });
            document.addEventListener('pointermove', function (event) {
                if (!asideDrag) { updateAsideCursor(event); return; }
                const width = asideDrag.startWidth + (asideDrag.startX - event.clientX);
                asideDrag.el.style.width = clampNum(width, asideDrag.min, asideDrag.max) + 'px';
            });
            document.addEventListener('pointerup', endAsideDrag);
            document.addEventListener('pointercancel', endAsideDrag);
        }
    };

    /* ---- 下拉选择框（.choosebox + .chooseboxOpen） ----------------------- */

    /* 配对规则：面板是 .choosebox 的下一个 .chooseboxOpen 兄弟；
       也可以给 .choosebox 写 data-target="面板id" 显式指定（面板放别处时用）。
       选中后：回填 .choosebox > .left 的文字 → 收起面板 →
       在 .choosebox 上派发冒泡事件 choosebox:change（detail = {value, option, box, panel}）。*/

    const CSBOX_ANIM_TIMEOUT = 240; /* 略大于 CSS 里 height 过渡的 0.2s，作兜底 */

    function findCsPanel(box) {
        if (!box) return null;
        const targetId = box.dataset.target;
        if (targetId) {
            const panel = byId(targetId);
            if (panel) return panel;
        }
        for (let node = box.nextElementSibling; node; node = node.nextElementSibling) {
            if (node.classList && node.classList.contains('chooseboxOpen')) return node;
            if (node.classList && node.classList.contains('choosebox')) break;
        }
        return box.parentElement ? qs('.chooseboxOpen', box.parentElement) : null;
    }

    function findCsBox(panel) {
        if (!panel) return null;
        if (panel.id) {
            const box = qs('.choosebox[data-target="' + panel.id + '"]');
            if (box) return box;
        }
        for (let node = panel.previousElementSibling; node; node = node.previousElementSibling) {
            if (node.classList && node.classList.contains('choosebox')) return node;
        }
        return panel.parentElement ? qs('.choosebox', panel.parentElement) : null;
    }

    function settleCsPanel(panel, expanded) {
        clearTimeout(panel.csAnimTimer);
        const finish = function () {
            panel.removeEventListener('transitionend', onEnd);
            clearTimeout(panel.csAnimTimer);
            if (panel.dataset.csState === 'open' && expanded) {
                panel.style.height = 'auto';
            } else if (!expanded && panel.dataset.csState !== 'open') {
                panel.style.display = 'none';
                panel.style.height = '';
            }
        };
        const onEnd = function (event) {
            if (event.target === panel && event.propertyName === 'height') finish();
        };
        panel.addEventListener('transitionend', onEnd);
        panel.csAnimTimer = setTimeout(finish, CSBOX_ANIM_TIMEOUT);
    }

    function openCsPanel(panel) {
        if (!panel || panel.dataset.csState === 'open') return;
        ui.choosebox.closeAll();
        panel.dataset.csState = 'open';
        panel.classList.add('open');
        panel.style.display = 'flex';
        panel.style.height = '0px';
        void panel.offsetHeight;
        panel.style.height = panel.scrollHeight + 'px';
        settleCsPanel(panel, true);
    }

    function closeCsPanel(panel) {
        if (!panel || panel.dataset.csState !== 'open') return;
        panel.dataset.csState = 'closed';
        panel.classList.remove('open');
        panel.style.height = panel.scrollHeight + 'px';
        void panel.offsetHeight;
        panel.style.height = '0px';
        settleCsPanel(panel, false);
    }

    /* 选中某个选项。options.silent = true 时**不**派发 choosebox:change ——
       程序化回填（如 render.settings）必须走 silent，否则会被当成用户操作，
       在页面刚加载时弹出“改动已成功保存”。*/
    function selectCsOption(option, options) {
        const opts = options || {};
        const panel = closest(option, '.chooseboxOpen');
        const box = findCsBox(panel);
        const value = option.textContent.trim();
        if (box) {
            const label = qs('.left', box);
            if (label) label.textContent = value;
        }
        closeCsPanel(panel);
        if (box && !opts.silent) {
            box.dispatchEvent(new CustomEvent('choosebox:change', {
                bubbles: true,
                detail: { value: value, option: option, box: box, panel: panel }
            }));
        }
        emit('ui:choosebox', { value: value, box: box, panel: panel, silent: !!opts.silent });
    }

    ui.choosebox = {
        /* 参数可以是 .choosebox 元素/id，也可以是 .chooseboxOpen 面板元素/id */
        open: function (ref) {
            const node = resolveEl(ref);
            if (!node) return null;
            const panel = node.classList.contains('chooseboxOpen') ? node : findCsPanel(node);
            openCsPanel(panel);
            return panel;
        },
        close: function (ref) {
            const node = resolveEl(ref);
            if (!node) return null;
            const panel = node.classList.contains('chooseboxOpen') ? node : findCsPanel(node);
            closeCsPanel(panel);
            return panel;
        },
        toggle: function (ref) {
            const node = resolveEl(ref);
            if (!node) return null;
            const panel = node.classList.contains('chooseboxOpen') ? node : findCsPanel(node);
            if (!panel) return null;
            if (panel.dataset.csState === 'open') closeCsPanel(panel); else openCsPanel(panel);
            return panel;
        },
        closeAll: function () {
            qsa('.chooseboxOpen[data-cs-state="open"]').forEach(closeCsPanel);
        },
        /* 按选项文字选中（后端说"把主题设成浅色"时用）。
           传 { silent: true } 则只改显示值、不当成用户操作。*/
        setValue: function (boxRef, value, options) {
            const box = resolveEl(boxRef);
            if (!box) return false;
            const panel = findCsPanel(box);
            if (!panel) return false;
            const list = qsa('p', panel);
            const text = toText(value);
            for (let i = 0; i < list.length; i++) {
                if (list[i].textContent.trim() === text) {
                    selectCsOption(list[i], options);
                    return true;
                }
            }
            /* 面板里没有这个选项时也允许直接写值（后端给了个自定义值） */
            const label = qs('.left', box);
            if (label) label.textContent = text;
            return false;
        },
        value: function (boxRef) {
            const box = resolveEl(boxRef);
            const label = box ? qs('.left', box) : null;
            return label ? label.textContent.trim() : '';
        },
        isOpen: function (ref) {
            const node = resolveEl(ref);
            const panel = node && (node.classList.contains('chooseboxOpen') ? node : findCsPanel(node));
            return !!panel && panel.dataset.csState === 'open';
        }
    };

    ui.choosebox.bindClicks = function () {
        document.addEventListener('click', function (event) {
            const option = closest(event.target, '.chooseboxOpen p');
            if (option) { selectCsOption(option); return; }
            const box = closest(event.target, '.choosebox');
            const inPanel = closest(event.target, '.chooseboxOpen');
            if (box && !inPanel) { ui.choosebox.toggle(box); return; }
            if (inPanel) return; /* 点在面板空白处不收起 */
            ui.choosebox.closeAll();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') ui.choosebox.closeAll();
        });
    };

    /* ========================================================================
     * §3 反馈组件
     * ------------------------------------------------------------------------
     * index.html 里那四个"只能给 DEBUG 按钮用"的弹窗，在这一层变成通用组件：
     *   #AnnounceMent  → notify.success()   右下角带进度条的成功提示
     *   #AnnounceMent2 → notify.info()      顶部居中的一句话提示（error 也用它）
     *   #loadW         → notify.loading()   转圈遮罩
     *   #rightGetWin   → dialog.decision()  底部"需要用户确认/决定"卡片，带按钮，Promise 化
     *   #delPmt        → dialog.confirm()   通用二次确认框，Promise<boolean>
     * 组件本身不新增 CSS，全部靠已有类名与图标类（fa-solid / fa-regular）切换外观。
     * 注：成功的品牌色与错误的品牌色在 CSS 里是同一个（--brand-col），
     *     所以 error 靠图标与文案区分，颜色由 CSS 决定，JS 不插手。
     * ====================================================================== */

    function pad2(value) { return value < 10 ? '0' + value : '' + value; }

    function todayText() {
        const date = new Date();
        return date.getFullYear() + '/' + pad2(date.getMonth() + 1) + '/' + pad2(date.getDate());
    }

    /* ---- 成功提示（右下角，带 2s 进度条） -------------------------------- */

    const SUCCESS_ID = 'AnnounceMent';
    const SUCCESS_BAR_ID = 'secApgr';
    const SUCCESS_DEFAULT_DURATION = 2600; /* 进度条本身固定 2s（CSS），这个值只管什么时候滑走 */
    let successTimer = null;

    notify.success = function (options) {
        const node = byId(SUCCESS_ID);
        if (!node) return false;
        const opts = (typeof options === 'string') ? { title: options } : (options || {});
        const icon = qs('.top .aIcon i', node);
        const titleNode = qs('.aText .fword', node);
        const subNode = qs('.aText .sword', node);
        const bar = byId(SUCCESS_BAR_ID);

        if (icon) icon.className = opts.icon || 'fa-solid fa-check';
        if (titleNode) titleNode.textContent = opts.title || '操作成功';
        if (subNode) subNode.textContent = opts.sub || ('Tsunagou ' + todayText());

        /* 进度条重播：先摘掉类并强制重排，再加回去，动画才会从头跑 */
        if (bar) {
            bar.classList.remove('Active');
            void bar.offsetWidth;
            bar.classList.add('Active');
        }
        node.style.right = '30px';

        clearTimeout(successTimer);
        const duration = opts.duration === undefined ? SUCCESS_DEFAULT_DURATION : Number(opts.duration);
        if (duration > 0) successTimer = setTimeout(function () { notify.success.hide(); }, duration);
        emit('notify', { kind: 'success', options: opts });
        return true;
    };

    notify.success.hide = function () {
        const node = byId(SUCCESS_ID);
        if (node) node.style.right = '-300px';
        const bar = byId(SUCCESS_BAR_ID);
        if (bar) bar.classList.remove('Active');
        clearTimeout(successTimer);
    };

    /* ---- 一句话提示（顶部居中） ------------------------------------------ */

    const INFO_ID = 'AnnounceMent2';
    const INFO_DEFAULT_DURATION = 2500;
    let infoTimer = null;

    function showTip(text, options) {
        const node = byId(INFO_ID);
        if (!node) return false;
        const opts = options || {};
        const icon = qs('.aIcon i', node);
        const label = qs('.aText', node);
        if (icon) icon.className = opts.icon || 'fa-solid fa-circle-info';
        if (label) label.textContent = toText(text);
        node.style.top = '30px';

        clearTimeout(infoTimer);
        const duration = opts.duration === undefined ? INFO_DEFAULT_DURATION : Number(opts.duration);
        if (duration > 0) infoTimer = setTimeout(function () { notify.tipHide(); }, duration);
        emit('notify', { kind: opts.kind || 'info', text: toText(text) });
        return true;
    }

    notify.info = function (text, options) {
        return showTip(text, Object.assign({ kind: 'info', icon: 'fa-solid fa-circle-info' }, options || {}));
    };

    /* 失败提示：同一个组件，换图标和停留时长（颜色由 CSS 决定，JS 不写颜色） */
    notify.error = function (text, options) {
        return showTip(text, Object.assign({
            kind: 'error',
            icon: 'fa-solid fa-circle-exclamation',
            duration: 4000
        }, options || {}));
    };

    notify.warn = function (text, options) {
        return showTip(text, Object.assign({
            kind: 'warn',
            icon: 'fa-solid fa-triangle-exclamation',
            duration: 3500
        }, options || {}));
    };

    notify.tipHide = function () {
        const node = byId(INFO_ID);
        if (node) node.style.top = '-100px';
        clearTimeout(infoTimer);
    };

    /* ---- 加载遮罩（#loadW） ---------------------------------------------- */

    const LOADING_ID = 'loadW';

    notify.loading = function (text) {
        const node = byId(LOADING_ID);
        if (!node) return false;
        const label = qs('.textW', node);
        if (label) label.textContent = toText(text) || '正在处理';
        ui.window.open(node);
        return true;
    };

    notify.loadingEnd = function () {
        ui.window.close(LOADING_ID);
        return true;
    };

    /* 包一个异步任务：自动开遮罩、结束才收起（失败也收）
       用法：await Tsunagou.notify.track('正在连接 Agent', api.post('agentCreate', data)) */
    notify.track = function (text, task) {
        notify.loading(text);
        let chain;
        try {
            chain = (typeof task === 'function') ? task() : task;
        } catch (error) {
            notify.loadingEnd();
            return Promise.reject(error);
        }
        return Promise.resolve(chain).then(function (value) {
            notify.loadingEnd();
            return value;
        }, function (error) {
            notify.loadingEnd();
            throw error;
        });
    };

    /* ---- 二次确认框（#delPmt，Promise<boolean>） ------------------------- */

    const CONFIRM_ID = 'delPmt';
    let confirmPending = null;

    dialog.confirm = function (options) {
        const node = byId(CONFIRM_ID);
        if (!node) return Promise.resolve(false);
        const opts = options || {};
        const titleNode = qs('.titleBar .title', node);
        const textNode = qs('.content .bigTxt', node);
        const descNode = qs('.content .description', node);
        const buttons = qsa('.options .buttonbox2', node);

        if (titleNode) titleNode.textContent = opts.title || '确认操作';
        if (textNode) textNode.textContent = opts.text || '确定要继续吗？';
        if (descNode) {
            if (opts.description) {
                descNode.textContent = opts.description;
                showEl(descNode);
            } else {
                hideEl(descNode);
            }
        }
        if (buttons[0]) buttons[0].textContent = opts.cancelText || '取消';
        if (buttons[1]) {
            buttons[1].textContent = opts.okText || '确定';
            buttons[1].classList.toggle('buttonbox2important', !!opts.danger);
        }

        /* 上一次还没收尾的确认框，直接当作取消 */
        if (confirmPending) confirmPending.finish(false);

        return new Promise(function (resolve) {
            const pending = { node: node, resolve: resolve, settled: false };

            pending.finish = function (result) {
                if (pending.settled) return;
                pending.settled = true;
                node.removeEventListener('click', onClick, true);
                if (confirmPending === pending) confirmPending = null;
                ui.window.close(node);
                resolve(result);
            };

            /* 用捕获阶段拦下点击：按钮自带的 onclick（关窗）照样会执行，不影响收尾 */
            function onClick(event) {
                const button = closest(event.target, '.buttonbox2');
                const closeBtn = closest(event.target, '.titleBar .button');
                const onBackdrop = (event.target === node);
                if (!button && !closeBtn && !onBackdrop) return;
                pending.finish(button ? buttons.indexOf(button) === 1 : false);
            }

            confirmPending = pending;
            node.addEventListener('click', onClick, true);
            ui.window.open(node);
        });
    };

    /* 任何方式关掉确认框（例如被 closeAll）都要收尾，避免 Promise 永远挂着 */
    events.on('ui:window', function (detail) {
        if (!detail || detail.open) return;
        if (confirmPending && confirmPending.node.id === detail.id) confirmPending.finish(false);
    });

    /* ---- 需要用户决定的卡片（#rightGetWin，Promise<值>） ------------------ */

    const DECISION_ID = 'rightGetWin';
    let decisionPending = null;

    function decisionEl() { return byId(DECISION_ID); }

    dialog.decision = function (options) {
        const node = decisionEl();
        if (!node) return Promise.resolve(null);
        const opts = options || {};
        const actions3 = toArray(opts.actions);
        const titleNode = qs('.title', node);
        const contentNode = qs('.content', node);
        const optionBox = qs('.option', node);

        if (titleNode) titleNode.textContent = opts.title || '需要用户确认/决定的信息';
        if (contentNode) contentNode.textContent = toText(opts.content);
        if (optionBox) {
            fill(optionBox, actions3.map(function (item, index) {
                const kind = item.kind === 'important' ? ' buttonbox2important' : '';
                return '<div class="buttonbox2' + kind + '" data-decision-index="' + index + '">' +
                    esc(item.label || ('选项 ' + (index + 1))) + '</div>';
            }).join(''));
        }

        if (decisionPending) decisionPending.finish(null);
        node.style.transform = 'translateX(50%) translateY(0%)';

        return new Promise(function (resolve) {
            /* actions 存在 pending 上：点击监听只绑一次，如果读外层的 actions3，
               第二次调用 decision 时就会拿上一次的按钮表去映射，值会错。*/
            const pending = { node: node, settled: false, actions: actions3 };
            pending.finish = function (value) {
                if (pending.settled) return;
                pending.settled = true;
                if (decisionPending === pending) decisionPending = null;
                resolve(value);
            };
            decisionPending = pending;

            /* 点按钮 → 收起卡片 → 把按钮携带的值给调用方 */
            if (optionBox && !optionBox.dataset.tgBound) {
                optionBox.dataset.tgBound = '1';
                optionBox.addEventListener('click', function (event) {
                    const button = closest(event.target, '[data-decision-index]');
                    if (!button || !decisionPending) return;
                    const index = Number(button.dataset.decisionIndex);
                    const action = (decisionPending.actions || [])[index] || {};
                    const value = (action.value === undefined) ? (action.label || index) : action.value;
                    dialog.hideDecision();
                    decisionPending.finish(value);
                });
            }

            if (opts.duration > 0) {
                setTimeout(function () {
                    if (!pending.settled && decisionPending === pending) {
                        dialog.hideDecision();
                        pending.finish(null);
                    }
                }, Number(opts.duration));
            }
        });
    };

    dialog.hideDecision = function () {
        const node = decisionEl();
        if (node) node.style.transform = 'translateX(50%) translateY(150%)';
        return true;
    };

    /* notify.decision 是 dialog.decision 的别名（按语义放在通知里更顺手） */
    notify.decision = dialog.decision;

    /* ========================================================================
     * §4 通信层
     * ------------------------------------------------------------------------
     * 一个请求封装 + 一套表单规则。
     * 请求：Tsunagou.api.get('tasks')            ← 用配置里的键
     *       Tsunagou.api.get('/custom/path')     ← 直接用路径
     *       Tsunagou.api.post('agentCreate', {...})
     * 表单：没有提交按钮的 input → 失焦即提交，并提示"改动已成功保存"。
     * ====================================================================== */

    /* ---- 错误对象 -------------------------------------------------------- */

    class ApiError extends Error {
        constructor(message, info) {
            super(message || '请求失败');
            const data = info || {};
            this.name = 'ApiError';
            this.status = data.status || 0;
            this.code = data.code;
            this.raw = data.raw;
            this.url = data.url || '';
            this.method = data.method || 'GET';
        }
    }

    /* ---- 响应解包 -------------------------------------------------------- */

    /* 支持三种后端风格：
       1) {code:0, message:'', data:{...}}   → 取 data（code 非 0 视为失败）
       2) {code:0, result:{...}}             → 取 result
       3) 裸 JSON / 数组 / 纯文本            → 原样返回 */
    const OK_CODES = [0, '0', 200, '200', 'ok', 'OK', 'success', true];

    function isOkCode(code) {
        for (let i = 0; i < OK_CODES.length; i++) {
            if (OK_CODES[i] === code) return true;
        }
        return false;
    }

    function unwrapPayload(payload) {
        if (!isPlainObject(payload) || !('code' in payload)) return payload;
        const code = payload.code;
        const message = payload.message || payload.msg || payload.error || '';
        if (!isOkCode(code)) {
            throw new ApiError(message || ('后端返回错误码 ' + code), { code: code, raw: payload });
        }
        if ('data' in payload) return payload.data;
        if ('result' in payload) return payload.result;
        return payload;
    }

    /* ---- 地址与查询串 ---------------------------------------------------- */

    function buildQuery(query) {
        if (!query) return '';
        const parts = [];
        Object.keys(query).forEach(function (key) {
            const value = query[key];
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
                value.forEach(function (item) { parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(item)); });
            } else {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        });
        return parts.length ? ('?' + parts.join('&')) : '';
    }

    /* 允许传配置键（'tasks'）或真实路径（'/x/y'）；
       模板里的 {project} 用当前项目 id 替换。*/
    const PROJECT_PLACEHOLDER = '{project}';

    function pathTemplate(pathOrKey) {
        if (!pathOrKey) return '';
        return config.paths[pathOrKey] || toText(pathOrKey);
    }

    function pathNeedsProject(pathOrKey) {
        return pathTemplate(pathOrKey).indexOf(PROJECT_PLACEHOLDER) >= 0;
    }

    function resolvePath(pathOrKey) {
        const template = pathTemplate(pathOrKey);
        if (template.indexOf(PROJECT_PLACEHOLDER) < 0) return template;
        const projectId = toText(state.get('currentProjectId'));
        return template.split(PROJECT_PLACEHOLDER).join(encodeURIComponent(projectId));
    }

    /* ---- 请求 ------------------------------------------------------------ */

    api.ApiError = ApiError;

    api.request = function (options) {
        const opts = options || {};
        const method = toText(opts.method || 'GET').toUpperCase();
        const pathKey = opts.path || opts.url;

        /* 项目作用域的接口：没选项目就不发请求，报一个说得清的错，
           免得拼出 /projects//tasks 这种地址去打扰后端。*/
        if (pathNeedsProject(pathKey) && !toText(state.get('currentProjectId'))) {
            const noProject = new ApiError('还没有选择协作项目，无法请求 ' + toText(pathKey), {
                method: method,
                url: toText(pathKey)
            });
            if (!opts.silent) notify.error(noProject.message);
            emit('api:error', { method: method, url: toText(pathKey), error: noProject });
            return Promise.reject(noProject);
        }

        const path = resolvePath(pathKey);
        const url = config.joinUrl(path) + buildQuery(opts.query);
        const timeout = Number(opts.timeout) || config.timeout;

        /* 演示模式：不发请求。写操作假装成功，读操作由 refresh() 直接从 state 拿。*/
        if (config.mode === 'demo') {
            const delay = opts.delay === undefined ? 240 : Number(opts.delay);
            return wait(delay).then(function () {
                const fake = { ok: true, demo: true, method: method, path: path, body: deepClone(opts.body || null) };
                emit('api:demo', fake);
                return fake;
            });
        }

        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        let timer = null;
        if (controller) timer = setTimeout(function () { controller.abort(); }, timeout);

        const headers = Object.assign({}, config.headers, opts.headers || {});
        if (config.token && !headers.Authorization) headers.Authorization = 'Bearer ' + config.token;

        const init = { method: method, headers: headers, credentials: opts.credentials || 'same-origin' };
        if (controller) init.signal = controller.signal;
        if (opts.body !== undefined && method !== 'GET' && method !== 'HEAD') {
            if (!headers['Content-Type']) headers['Content-Type'] = 'application/json;charset=utf-8';
            init.body = (typeof opts.body === 'string') ? opts.body : JSON.stringify(opts.body);
        }

        const request = fetch(url, init).then(function (response) {
            return response.text().then(function (text) {
                let payload = null;
                if (text) {
                    try { payload = JSON.parse(text); } catch (error) { payload = text; }
                }
                if (!response.ok) {
                    const message = (isPlainObject(payload) && (payload.message || payload.msg || payload.error)) ||
                        ('请求失败（HTTP ' + response.status + '）');
                    throw new ApiError(message, { status: response.status, raw: payload, url: url, method: method });
                }
                return unwrapPayload(payload);
            });
        });

        return request.then(function (data) {
            if (timer) clearTimeout(timer);
            emit('api:success', { method: method, url: url, data: data });
            return data;
        }, function (error) {
            if (timer) clearTimeout(timer);
            const normalized = (error instanceof ApiError) ? error : new ApiError(
                (error && error.name === 'AbortError') ? ('请求超时（' + timeout + 'ms）') : ('网络错误：' + ((error && error.message) || '未知')),
                { url: url, method: method, raw: error }
            );
            if (!opts.silent) notify.error(normalized.message);
            emit('api:error', { method: method, url: url, error: normalized });
            throw normalized;
        });
    };

    api.get = function (pathOrKey, query, options) {
        return api.request(Object.assign({ method: 'GET', path: pathOrKey, query: query }, options || {}));
    };

    api.post = function (pathOrKey, body, options) {
        return api.request(Object.assign({ method: 'POST', path: pathOrKey, body: body }, options || {}));
    };

    /* 直接给后端用：拿到某个键最终会请求的真实地址（便于后端对齐路由） */
    api.path = function (key) { return config.joinUrl(resolvePath(key)); };

    /* ---- 表单 ------------------------------------------------------------ */

    /* 自动提交（失焦即提交）的判定规则：
       1) 命中 .textbox / .textbox2 里的 input；
       2) 不在"按钮提交"的窗口里（向导、添加子 Agent、Agent 详情 —— 它们有明确的提交按钮）；
       3) 自己所在的 .item / .uiBlock 里没有按钮。 */
    const AUTOCOMMIT_SELECTOR = '.textbox input, .textbox2 input';
    const AUTOCOMMIT_EXCLUDE = ['#addProj', '#addSubAgent', '#mgrAgentInfo'];

    function inputScope(input) {
        return closest(input, '.item') || closest(input, '.uiBlock') || closest(input, '.secWindow');
    }

    function isAutoCommitInput(input) {
        if (!input || input.dataset.tgCommit === 'manual') return false;
        for (let i = 0; i < AUTOCOMMIT_EXCLUDE.length; i++) {
            if (closest(input, AUTOCOMMIT_EXCLUDE[i])) return false;
        }
        const scope = inputScope(input);
        if (scope && qs('.buttonbox2, .buttonbox', scope)) return false;
        return true;
    }

    /* 给一个 input 起个稳定的名字，作为提交时的字段键 */
    function keyOfInput(input) {
        const win = closest(input, '.secWindow');
        const label = closest(input, '.item') ? qs('.fword', closest(input, '.item')) : null;
        const placeholder = input.getAttribute('placeholder') || '';
        const index = qsa('input', input.parentElement || document).indexOf(input);
        return [
            win ? win.id : 'page',
            toText(label && label.textContent).trim() || placeholder || ('field' + index)
        ].join('.');
    }

    const committedValues = Object.create(null);

    form.keyOf = keyOfInput;
    form.isAutoCommit = isAutoCommitInput;
    form.fields = function (root) { return qsa(AUTOCOMMIT_SELECTOR, resolveEl(root) || document); };

    /* 收集一组输入的值：默认按 DOM 顺序返回数组，传 { byKey: true } 返回对象 */
    form.collect = function (root, options) {
        const opts = options || {};
        const fields = qsa('input', resolveEl(root) || document);
        if (opts.byKey) {
            const result = {};
            fields.forEach(function (input) {
                if (input.type === 'checkbox' || input.type === 'radio') return;
                result[keyOfInput(input)] = toText(input.value).trim();
            });
            return result;
        }
        return fields.filter(function (input) {
            return input.type !== 'checkbox' && input.type !== 'radio';
        }).map(function (input) { return toText(input.value).trim(); });
    };

    /* 按顺序（或按 {键: 值}）回填一组输入 */
    form.fill = function (root, values) {
        const fields = qsa('input', resolveEl(root) || document);
        if (Array.isArray(values)) {
            fields.forEach(function (input, index) {
                if (values[index] !== undefined) input.value = toText(values[index]);
            });
            return fields;
        }
        const source = values || {};
        fields.forEach(function (input) {
            const key = keyOfInput(input);
            if (source[key] !== undefined) input.value = toText(source[key]);
        });
        return fields;
    };

    /* 提交一个输入框：值没变就什么都不做（不重复发请求、也不重复提示） */
    form.commit = function (input, options) {
        const node = resolveEl(input);
        if (!node) return Promise.resolve(null);
        const opts = options || {};
        const value = opts.raw ? toText(node.value) : toText(node.value).trim();
        const key = opts.key || keyOfInput(node);
        const previous = committedValues[key];
        if (value === previous) return Promise.resolve(value);

        const detail = {
            input: node,
            key: key,
            value: value,
            previous: previous,
            window: (closest(node, '.secWindow') || {}).id || '',
            label: opts.label || ''
        };
        committedValues[key] = value;
        emit('form:commit', detail);

        /* 后端可以用 events.on('form:commit') 接管；默认按配置里的地址提交 */
        if (opts.local || (config.mode === 'demo' && opts.post !== true)) {
            if (opts.toast !== false) notify.success({ title: opts.title || '改动已成功保存' });
            return Promise.resolve(value);
        }
        return api.post(opts.path || 'settingSave', { key: key, value: value }, { silent: opts.silent })
            .then(function (result) {
                if (opts.toast !== false) notify.success({ title: opts.title || '改动已成功保存' });
                return result;
            });
    };

    /* 扫描并绑定：给页面上所有"没有提交按钮"的 input 装上失焦提交 */
    form.watch = function (root) {
        const fields = qsa('input', resolveEl(root) || document);
        fields.forEach(function (input) {
            if (input.dataset.tgAutoBound === '1') return;
            if (!isAutoCommitInput(input)) return;
            input.dataset.tgAutoBound = '1';
            input.addEventListener('blur', function () { form.commit(input); });
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
            });
        });
        return fields.length;
    };

    /* 主按钮（"确定"）提交某个容器里的所有输入：用于窗口表单 */
    form.submitByButton = function (root, options) {
        const node = resolveEl(root);
        if (!node) return Promise.resolve(null);
        const opts = options || {};
        const values = form.collect(node, { byKey: true });
        const detail = { window: node.id, values: values, valuesList: form.collect(node) };
        emit('form:submit', detail);
        const path = opts.path || 'settingSave';
        return api.post(path, Object.assign({ window: node.id }, values), { silent: opts.silent });
    };

    /* 清掉"已提交值"的记录（关窗后重置时用） */
    form.resetCommitted = function (key) {
        if (key === undefined) { Object.keys(committedValues).forEach(function (k) { delete committedValues[k]; }); return; }
        delete committedValues[key];
    };

    /* ========================================================================
     * §5 渲染层
     * ------------------------------------------------------------------------
     * 每个 render.xxx(data) 都是"数据进、DOM 出"：内部拼 HTML 字符串，
     * 最后用 util.fill 整体替换某个容器。模板严格照抄 index.html 原有片段，
     * 只用已经存在的类名，因此不需要碰 CSS。
     *
     * 所有动态文本一律经过 esc / nl2br 转义；
     * 需要内嵌 HTML（如胶囊、标签）时由本层的 html 小件生成，不接受外部字符串。
     *
     * 渲染出来的元素会带上 data-* 标记（tg-kind / tg-id），
     * 事件委托靠它们反查数据 —— 这是唯一使用自定义属性的地方，且只加在 JS 生成的节点上。
     * ====================================================================== */

    /* ---- 图标 ------------------------------------------------------------ */

    /* 图标一律用 -l 版（applyThemeImages 会按主题换成 -d 版） */
    const AGENT_ICONS = {
        deepseek: './assets/img/agent/deepseek-l.png',
        codex: './assets/img/agent/codex-l.png',
        claudecode: './assets/img/agent/claudecode-l.png',
        claude: './assets/img/agent/claudecode-l.png'
    };
    const DEFAULT_AGENT_ICON = AGENT_ICONS.deepseek;

    function iconOf(agent) {
        const source = isPlainObject(agent) ? agent.icon : agent;
        const text = toText(source);
        if (/\.(png|jpe?g|svg|webp)$/i.test(text)) return text;
        return AGENT_ICONS[text.toLowerCase()] || DEFAULT_AGENT_ICON;
    }

    /* ---- 小件 ------------------------------------------------------------ */

    /* Agent 胶囊：<div class="item [cls]"><img class="left"><div class="right">名字</div></div>
       options.identity = true 时才考虑 .id-user / .id-mAgent 这两个配色类
       —— 因为原设计里它们只用在“总路径”那一张表上，别处都是普通胶囊。
       （user:true 用用户图标；mainAgent:true 表示这是主 Agent）*/
    function chipHtml(agent, cls, options) {
        const info = isPlainObject(agent) ? agent : { name: agent };
        const opts = options || {};
        const left = info.user
            ? '<i class="left fa-solid fa-user"></i>'
            : '<img class="left" src="' + esc(iconOf(info)) + '" />';
        const classes = [cls || 'itemS'];
        if (opts.identity) {
            if (info.user) classes.push('id-user');
            else if (info.mainAgent) classes.push('id-mAgent');
        }
        return '<div class="item ' + esc(classes.join(' ')) + '"' +
            (info.id ? ' data-agent-id="' + esc(info.id) + '"' : '') + '>' +
            left + '<div class="right">' + esc(info.name) + '</div></div>';
    }

    function listFieldHtml(agents, cls, options) {
        return '<div class="listfieldbox">' +
            toArray(agents).map(function (agent) { return chipHtml(agent, cls, options); }).join('') +
            '</div>';
    }

    /* 标签：container 默认 .tgBox（自带 flex 行）；传 container:false 则不包容器
       （原设计里“Agent 卡片当前状态”就是 .textZ > .tagZ，中间没有 .tgBox）*/
    function tagHtml(tag) {
        const info = isPlainObject(tag) ? tag : { text: tag };
        const cls = ['tagZ'];
        if (info.ok) cls.push('tagZOK');
        if (info.small) cls.push('tagZS');
        return '<div class="' + cls.join(' ') + '">' + esc(info.text) + '</div>';
    }

    function tagsHtml(tags, options) {
        const opts = options || {};
        const list = toArray(tags).map(function (tag) {
            const info = isPlainObject(tag) ? Object.assign({ small: opts.small }, tag) : tag;
            if (opts.container === 'tagZbox') {
                /* tagZbox 里放的是 span，外层包一个 div.tagZbox */
                const item = tagHtml(info).replace(/^<div class="/, '<span class="')
                    .replace(/<\/div>$/, '</span>');
                return item;
            }
            return tagHtml(info);
        }).join('');
        const container = opts.container === undefined ? 'tgBox' : opts.container;
        return container ? '<div class="' + container + '">' + list + '</div>' : list;
    }

    /* 任务状态：13 种状态的名字由 CSS 的 ::after 生成，JS 只给类名 */
    function stHtml(code) {
        const index = clampNum(Number(code) || 1, 1, 13);
        return '<span class="st st-' + index + '"></span>';
    }

    /* 表格（.tablebox：表头 .th + 行 .tr + 单元格 .colu） */
    function columnsHtml(columns) {
        return toArray(columns).map(function (column) {
            const info = isPlainObject(column) ? column : { text: column };
            return '<div class="colu' + (info.cls ? ' ' + info.cls : '') + '">' + esc(info.text) + '</div>';
        }).join('');
    }

    function cellHtml(cell) {
        if (cell === null || cell === undefined) return '<div class="colu"></div>';
        if (typeof cell === 'string') return '<div class="colu">' + esc(cell) + '</div>';
        const cls = cell.cls ? ' ' + cell.cls : '';
        const body = (cell.html !== undefined) ? cell.html : esc(cell.text);
        return '<div class="colu' + cls + '">' + body + '</div>';
    }

    function tableBoxHtml(cfg) {
        const options = cfg || {};
        const head = options.columns ? '<div class="th">' + columnsHtml(options.columns) + '</div>' : '';
        const rows = toArray(options.rows).map(function (row) {
            const attrs = row && row.attrs ? row.attrs : '';
            const cells = (row && row.cells) ? row.cells : row;
            return '<div class="tr"' + attrs + '>' + toArray(cells).map(cellHtml).join('') + '</div>';
        }).join('');
        return '<div class="tablebox' + (options.cls ? ' ' + options.cls : '') + '">' + head + rows + '</div>';
    }

    /* 键值表（.table：.item > .itemTh + .itemTd） */
    function keyValueTableHtml(items) {
        return '<div class="table">' + toArray(items).map(function (item) {
            const body = (item.html !== undefined) ? item.html : esc(item.value);
            return '<div class="item"><div class="itemTh">' + esc(item.label) + '</div>' +
                '<div class="itemTd' + (item.active ? ' itemTdActive' : '') + '">' + body + '</div></div>';
        }).join('') + '</div>';
    }

    /* 卡片组（.boxerbox，里面是 .item / .itemL / .itemAdd）
       卡片的 attrs 用来挂 data-* 身份标记（JS 生成的节点才允许加）*/
    function boxerHtml(cards, cls) {
        return '<div class="boxerbox' + (cls ? ' ' + cls : '') + '">' +
            toArray(cards).map(function (card) {
                return '<div class="' + esc(card.cls || 'item') + '"' + (card.attrs || '') + '>' +
                    toArray(card.parts).join('') + '</div>';
            }).join('') + '</div>';
    }

    /* 卡片里的小件 */
    function headerHtml(text, cls) {
        return '<p class="header' + (cls ? ' ' + cls : '') + '">' + esc(text) + '</p>';
    }

    function titleHtml(text, tag) {
        return '<' + (tag || 'p') + ' class="title">' + esc(text) + '</' + (tag || 'p') + '>';
    }

    function textZHtml(text) { return '<p class="textZ">' + esc(text) + '</p>'; }

    function textZboxHtml(text) { return '<div class="textZbox">' + nl2br(text) + '</div>'; }

    function timeHtml(text) { return '<p class="textTime">' + esc(text) + '</p>'; }

    function bgTitleHtml(text) { return '<p class="bgTitle">' + esc(text) + '</p>'; }

    function textNHtml(text) { return '<div class="textN">' + nl2br(text) + '</div>'; }

    /* 按钮组：{text, kind:'active'|'important'|'' , action} */
    function buttonsHtml(buttons) {
        return toArray(buttons).map(function (button) {
            const info = isPlainObject(button) ? button : { text: button };
            const cls = ['buttonbox2'];
            if (info.kind === 'active') cls.push('buttonbox2active');
            if (info.kind === 'important') cls.push('buttonbox2important');
            return '<div class="' + cls.join(' ') + '"' +
                (info.action ? ' data-tg-action="' + esc(info.action) + '"' : '') + '>' +
                esc(info.text) + '</div>';
        }).join('');
    }

    function optionHtml(buttons) {
        return '<div class="option">' + buttonsHtml(buttons) + '</div>';
    }

    /* 侧栏里的"字段块"：{title, text} 或 {title, html} 或 {bgTitle}
       注：text 会转义；html 不会（只用来嵌本库生成的小件，别塞用户输入）。*/
    function asideFieldsHtml(fields) {
        return toArray(fields).map(function (field) {
            if (field.bgTitle) return bgTitleHtml(field.bgTitle);
            const head = field.title ? titleHtml(field.title) : '';
            if (field.html !== undefined) return head + field.html;
            if (field.text !== undefined) return head + textNHtml(field.text);
            return head;
        }).join('');
    }

    /* ---- 通用小件对外暴露 ------------------------------------------------ */

    Object.assign(render, {
        icon: iconOf,
        chip: chipHtml,
        listField: listFieldHtml,
        tag: tagHtml,
        tags: tagsHtml,
        status: stHtml,
        table: tableBoxHtml,
        keyValueTable: keyValueTableHtml,
        boxer: boxerHtml,
        buttons: buttonsHtml,
        asideFields: asideFieldsHtml
    });

    /* ---- 左栏：协作项目列表 ---------------------------------------------- */

    const PROJECT_STATUS = {
        working: { cls: 'wking', text: '工作中' },
        preparing: { cls: 'starting', text: '准备中' },
        finished: { cls: 'finished', text: '已完成' }
    };

    function projectCardHtml(project) {
        const status = PROJECT_STATUS[project.status] || PROJECT_STATUS.working;
        const agents = toArray(project.agents);
        const extra = project.extra === undefined ? agents.length : Number(project.extra);
        /* 选中态：后端可以显式给 selected，否则按"当前项目"判定 */
        const selected = (project.selected === true) ||
            (project.id !== undefined && toText(project.id) === toText(state.get('currentProjectId')));
        const others = agents.slice(0, extra > 5 ? 4 : agents.length).map(function (agent) {
            return '<img src="' + esc(iconOf(agent)) + '" />';
        }).join('') + (extra > 0 ? '<span class="plus">' + esc(extra) + '</span>' : '');
        return '<div class="projItem' + (selected ? ' projItemSelected' : '') + '" data-project-id="' + esc(project.id) + '">' +
            '<div class="inner">' +
            '<p class="title">' + esc(project.name) + '</p>' +
            '<div class="content">' +
            '<div class="left">' +
            '<div class="mainAgent"><img src="' + esc(iconOf(project.mainAgent)) + '" />' +
            '<p>' + esc((project.mainAgent || {}).name) + '</p></div>' +
            '<div class="anotherAgent">' + others + '</div>' +
            '</div>' +
            '<div class="right">' +
            '<p class="' + status.cls + '">' + esc(project.statusText || status.text) + '</p>' +
            '<p class="time">' + esc(project.time) + '</p>' +
            '</div>' +
            '</div>' +
            '<span class="edit"></span>' +
            '</div>' +
            '</div>';
    }

    render.list = function (projects) {
        const list = toArray(projects);
        const active = list.filter(function (item) { return item.group !== 'done'; });
        const done = list.filter(function (item) { return item.group === 'done'; });
        const groupTitle = function (text) {
            return '<div class="wkTitle"><div class="wkTleft">' + esc(text) + '</div>' +
                '<div class="wkTright">' +
                '<div class="wkTbtn"><i class="fa-solid fa-search"></i></div>' +
                '<div class="wkTbtn"><i class="fa-solid fa-cog"></i></div>' +
                '</div></div>';
        };
        /* 空的分组不显示标题，免得出现只有标题没有卡片的空段 */
        const html = (active.length ? groupTitle('进行中的协作') + active.map(projectCardHtml).join('') : '') +
            (done.length ? groupTitle('已完成的协作') + done.map(projectCardHtml).join('') : '');
        const container = byId('projList') || qs('.secAside .subMgr');
        fill(container, html);
        return container;
    };

    /* ---- 主视图 ---------------------------------------------------------- */

    /* 顶部导航条：.navArea 在 .inner 外面，不属于任何标签页，单独渲染。
       输出的标记与原 index.html 里的静态写法完全一致（名字 + 状态胶囊），
       只是换成由数据驱动，不多不少。*/
    render.navbar = function (project) {
        const data = project || {};
        const box = qs('.secProjPanel .navArea .left');
        if (!box) return null;
        fill(box, '<p>' + esc(data.name) + '</p>' +
            '<div class="status' + (data.statusClass ? ' ' + esc(data.statusClass) : '') + '">' +
            esc(data.statusText || '') + '</div>');
        return box;
    };

    const TASK_STATE_CLASS = { done: 'taskF', doing: 'taskD', todo: 'task' };

    render.overview = function (project) {
        const data = project || {};
        render.navbar(data);
        const basics = toArray(data.basics).map(function (item) {
            return { label: item.label, value: item.value, active: !!item.active };
        });
        const progress = data.progress || {};
        const plan = toArray(progress.plan).map(function (item) {
            return '<div class="task ' + (TASK_STATE_CLASS[item.state] || 'task') + '">' + esc(item.text) + '</div>';
        }).join('');
        const section = function (title, html) {
            return '<p class="title2">' + esc(title) + '</p>' + html;
        };
        const html =
            titleHtml('主视图', 'p') +
            '<p class="title2">项目名称/描述</p>' +
            '<div class="bgTxt">' + esc(data.name) + '</div>' +
            '<p class="textArea">' + esc(data.description) + '</p>' +
            section('基本信息', '<div class="dataArea">' + keyValueTableHtml(basics) + '</div>') +
            section('项目进度', '<div class="dataArea"><div class="statbox">' +
                '<div class="left"><p class="title">总进度</p>' + esc(progress.total) + '</div>' +
                '<div class="right"><p class="title">计划进度</p><div class="inner">' + plan + '</div></div>' +
                '</div></div>') +
            section('项目版本', '<div class="dataArea">' + keyValueTableHtml(data.versions) + '</div>') +
            section('项目统计信息', '<div class="dataArea">' + keyValueTableHtml(data.stats) + '</div>') +
            section('项目数据存储', '<div class="dataArea">' + keyValueTableHtml(data.storage) + '</div>');
        fill(byId('pane-overview'), html);
        return html;
    };

    /* ---- 我的收件箱 ------------------------------------------------------ */

    /* 一行的三种格子：标题+小字 / Agent 胶囊+时间 / 一个按钮
       注意：收件箱的标题没有 lev-active（任务区的才有），这一点跟原设计保持一致。*/
    function inboxTitleCell(item) {
        return {
            cls: 'colu-l',
            html: '<div class="colu-t"><div class="citem1">' + esc(item.title) + '</div>' +
                '<div class="citem2">' + esc(item.detail) + '</div></div>'
        };
    }

    function agentTimeCell(agent, time) {
        return {
            cls: 'colu-m',
            html: '<div class="colu-t"><div class="citem1">' + listFieldHtml([agent]) + '</div>' +
                (time ? '<div class="citem2">' + esc(time) + '</div>' : '') + '</div>'
        };
    }

    function actionCell(item) {
        return { html: '<div class="buttonbox" data-tg-action="' + esc(item.action) + '">' + esc(item.actionText) + '</div>' };
    }

    function inboxTableHtml(rows) {
        return tableBoxHtml({
            columns: [{ text: '问题' }, { text: '详情', cls: 'colu-l' },
                { text: '提出 Agent', cls: 'colu-m' }, { text: '操作' }],
            rows: toArray(rows).map(function (item) {
                return {
                    attrs: ' data-row-id="' + esc(item.id) + '"',
                    cells: [
                        { html: esc(item.level), cls: 'lev-active' },
                        inboxTitleCell(item),
                        agentTimeCell(item.agent, item.time),
                        actionCell(item)
                    ]
                };
            })
        });
    }

    render.inbox = function (inbox) {
        const data = inbox || {};
        const html =
            titleHtml('我的收件箱') +
            '<p class="title2">需要你处理/授权的信息</p>' +
            inboxTableHtml(data.pending) +
            '<p class="title2">你已经处理完的信息</p>' +
            inboxTableHtml(data.done);
        fill(byId('pane-inbox'), html);
        return html;
    };

    /* ---- Agent 管理 ------------------------------------------------------ */

    function agentCardHtml(agent) {
        const abilities = function (title, list) {
            if (!toArray(list).length) return '';
            return titleHtml(title) + tagsHtml(list, { });
        };
        return {
            cls: 'item',
            parts: [
                '<div class="header">' + esc(agent.role) + '</div>',
                listFieldHtml([{ name: agent.name, icon: agent.icon, id: agent.id }]),
                titleHtml('当前状态'),
                '<div class="textZ">' + tagsHtml([{ text: agent.statusText, ok: agent.statusOk }], { container: false }) + '</div>',
                titleHtml('说明'), textZHtml(agent.desc),
                titleHtml('当前任务'), textZHtml(agent.currentTask),
                abilities('基础能力', agent.basic),
                abilities('运营能力', agent.ops),
                optionHtml(toArray(agent.actions).map(function (action) {
                    return { text: action.text, kind: action.kind, action: action.action };
                }))
            ]
        };
    }

    render.agents = function (agents) {
        const cards = toArray(agents).map(agentCardHtml);
        /* 末尾那个大加号是"添加子 Agent"的入口 */
        cards.push({ cls: 'itemAdd', parts: [] });
        const html = titleHtml('Agent 管理') +
            '<p class="title2">管理现有的 Agent</p>' +
            boxerHtml(cards);
        fill(byId('pane-agents'), html);
        return html;
    };

    /* ---- 任务区 ---------------------------------------------------------- */

    render.tasks = function (tasks) {
        const html = titleHtml('任务区') +
            '<p class="title2">当前子 Agent 的任务清单</p>' +
            tableBoxHtml({
                columns: [{ text: '任务', cls: 'colu-l' }, { text: '状态' },
                    { text: '负责 Agent', cls: 'colu-m' }, { text: '开工条件', cls: 'colu-m' },
                    { text: '改动范围', cls: 'colu-m' }, { text: '交付结果', cls: 'colu-m' }],
                rows: toArray(tasks).map(function (task) {
                    return {
                        attrs: ' data-row-id="' + esc(task.id) + '"',
                        cells: [
                            {
                                cls: 'colu-l',
                                html: '<div class="colu-t"><div class="citem1 lev-active">' + esc(task.title) + '</div>' +
                                    '<div class="citem2">' + esc(task.detail) + '</div></div>'
                            },
                            { html: stHtml(task.status) },
                            agentTimeCell(task.agent, task.time),
                            {
                                cls: 'colu-m colu-cdt',
                                html: toArray(task.conditions).map(function (text, index) {
                                    return '<span class="tagZ' + (index === 0 ? ' tagZOK' : '') + '">' + esc(text) + '</span>';
                                }).join('')
                            },
                            { cls: 'colu-m', text: task.scope },
                            { cls: 'colu-m', text: task.deliverable }
                        ]
                    };
                })
            });
        fill(byId('pane-tasks'), html);
        return html;
    };

    /* ---- 冲突与协商（4 个子标签） ---------------------------------------- */

    function dissentCardHtml(dissent) {
        const understandings = toArray(dissent.understandings).map(function (item) {
            return titleHtml(item.agent + '的理解') + '<p class="textZbox">' + esc(item.text) + '</p>';
        }).join('');
        return {
            cls: 'item',
            attrs: ' data-row-id="' + esc(dissent.id) + '"',
            parts: [
                headerHtml(dissent.title),
                listFieldHtml(dissent.agents, 'itemS'),
                timeHtml(dissent.time),
                titleHtml('影响范围'), textZHtml(dissent.scope),
                understandings,
                optionHtml(toArray(dissent.actions).map(function (action) {
                    return { text: action.text, kind: action.kind, action: action.action };
                }))
            ]
        };
    }

    render.conflicts = function (conflicts) {
        const data = conflicts || {};
        const block = byId('block-conflict');
        if (!block) return null;
        const panels = blockPanels(block);
        if (panels[0]) {
            fill(panels[0], boxerHtml(toArray(data.dissents).map(dissentCardHtml), 'boxerboxC'));
        }
        if (panels[1]) {
            fill(panels[1], tableBoxHtml({
                cls: 'tableboxC',
                columns: [{ text: '冲突', cls: 'colu-l' }, { text: '影响范围', cls: 'colu-m' },
                    { text: '相关 Agent', cls: 'colu-m' }, { text: '处理方案', cls: 'colu-l' }],
                rows: toArray(data.conflicts).map(function (item) {
                    return {
                        attrs: ' data-row-id="' + esc(item.id) + '"',
                        cells: [
                            {
                                cls: 'colu-l',
                                html: '<div class="colu-t"><div class="citem1 lev-active">' + esc(item.title) + '</div>' +
                                    '<div class="citem2">' + esc(item.detail) + '</div></div>'
                            },
                            { cls: 'colu-m', text: item.scope },
                            {
                                cls: 'colu-m',
                                html: '<div class="colu-t">' + toArray(item.agents).map(function (agent) {
                                    return '<div class="citem1">' + listFieldHtml([agent]) + '</div>';
                                }).join('') + (item.time ? '<div class="citem2">' + esc(item.time) + '</div>' : '') + '</div>'
                            },
                            { cls: 'colu-l', text: item.solution || '——' }
                        ]
                    };
                })
            }));
        }
        if (panels[2]) {
            fill(panels[2], tableBoxHtml({
                cls: 'tableboxC',
                columns: [{ text: '收发 Agent', cls: 'colu-m' }, { text: '内容', cls: 'colu-l' },
                    { text: '状态' }, { text: '消息处理情况', cls: 'colu-m' }],
                rows: toArray(data.messages).map(function (item) {
                    return {
                        attrs: ' data-row-id="' + esc(item.id) + '"',
                        cells: [
                            {
                                cls: 'colu-m',
                                html: '<div class="colu-t">' +
                                    '<div class="citem3"><p class="lev-inactive">发件</p> ' + esc(item.from) + '</div>' +
                                    '<div class="citem3"><p class="lev-inactive">收件</p> ' + esc(item.to) + '</div>' +
                                    '</div>'
                            },
                            { cls: 'colu-l', html: '<div class="colu-t">' + esc(item.content) + '</div>' },
                            { html: '<span class="tagZ' + (item.answeredOk ? ' tagZOK' : '') + '">' + esc(item.answered) + '</span>' },
                            {
                                cls: 'colu-m',
                                html: tagsHtml(item.progress, { container: 'tagZbox' })
                            }
                        ]
                    };
                })
            }));
        }
        if (panels[3]) {
            fill(panels[3], boxerHtml(toArray(data.contracts).map(function (contract) {
                return {
                    cls: 'item',
                    attrs: ' data-row-id="' + esc(contract.id) + '"',
                    parts: [
                        headerHtml(contract.title),
                        timeHtml(contract.time),
                        titleHtml('提出 Agent'), listFieldHtml(contract.proposers, 'itemS'),
                        titleHtml('影响范围'), textZHtml(contract.scope),
                        titleHtml('已确认 Agent'), listFieldHtml(contract.confirmed, 'itemS'),
                        titleHtml('未确认 Agent'), listFieldHtml(contract.unconfirmed, 'itemS'),
                        optionHtml([{ text: '查看详情', kind: 'active', action: contract.action || 'contract.detail' }])
                    ]
                };
            }), 'boxerboxC'));
        }
        return true;
    };

    /* ---- 意图与权限审计（2 个子标签） ------------------------------------ */

    render.audit = function (audit) {
        const data = audit || {};
        const block = byId('block-audit');
        if (!block) return null;
        const panels = blockPanels(block);
        const leaseCell = function (lease) {
            return { cls: 'colu-m', html: '<div class="tagZ' + (lease.ok ? ' tagZOK' : '') + '">' + esc(lease.text) + '</div>' };
        };
        if (panels[0]) {
            fill(panels[0], tableBoxHtml({
                cls: 'tableboxC',
                columns: [{ text: 'Agent', cls: 'colu-m' }, { text: '目标', cls: 'colu-m' }, { text: '方式' },
                    { text: '原因', cls: 'colu-l' }, { text: '声明版本' }, { text: '租约', cls: 'colu-m' }],
                rows: toArray(data.intents).map(function (item) {
                    return {
                        attrs: ' data-row-id="' + esc(item.id) + '"',
                        cells: [
                            { cls: 'colu-m', html: listFieldHtml([item.agent]) },
                            { cls: 'colu-m', text: item.target },
                            { text: item.mode },
                            { cls: 'colu-l', text: item.reason },
                            { text: item.version },
                            leaseCell(item.lease)
                        ]
                    };
                })
            }));
        }
        if (panels[1]) {
            const leaseTable = function (title, rows) {
                return '<p class="title3">' + esc(title) + '</p>' + tableBoxHtml({
                    cls: 'tableboxC',
                    columns: [{ text: 'Agent', cls: 'colu-m' }, { text: '批准范围', cls: 'colu-l' },
                        { text: '声明版本' }, { text: '租约', cls: 'colu-m' }],
                    rows: toArray(rows).map(function (item) {
                        return {
                            attrs: ' data-row-id="' + esc(item.id) + '"',
                            cells: [
                                { cls: 'colu-m', html: listFieldHtml([item.agent]) },
                                { cls: 'colu-l', text: item.scope },
                                { text: item.version },
                                leaseCell(item.lease)
                            ]
                        };
                    })
                });
            };
            fill(panels[1], leaseTable('已经获得的租约', data.leases) +
                leaseTable('等待租约的 Agent', data.waiting));
        }
        return true;
    };

    /* ---- 工作区 ---------------------------------------------------------- */

    render.workspaces = function (workspaces) {
        const cards = toArray(workspaces).map(function (item) {
            return {
                cls: 'item',
                attrs: ' data-workspace-id="' + esc(item.id) + '"',
                parts: [
                    '<div class="header">' + esc(item.name) + '</div>',
                    titleHtml('修改者'), listFieldHtml([item.agent]),
                    titleHtml('隔离方式'), textZHtml(item.isolation),
                    titleHtml('改动的文件'), textZboxHtml(toArray(item.files).join('\n')),
                    titleHtml('当前状态'), tagsHtml(item.states),
                    titleHtml('补丁'), textZHtml(item.patch)
                ]
            };
        });
        const html = titleHtml('工作区') +
            '<p class="title2">Agent 所做的改动</p>' +
            boxerHtml(cards);
        fill(byId('pane-workspace'), html);
        return html;
    };

    /* ---- 项目验收 -------------------------------------------------------- */

    render.acceptance = function (acceptance) {
        const data = acceptance || {};
        const proposal = data.proposal || {};
        const standards = data.standards || {};
        const html =
            titleHtml('项目验收') +
            '<p class="title2">项目完成提案</p>' +
            boxerHtml([{
                cls: 'itemL',
                parts: [
                    headerHtml(proposal.title, 'header-ok'),
                    timeHtml(proposal.time),
                    textZboxHtml(proposal.text),
                    optionHtml(toArray(proposal.actions).map(function (action) {
                        return { text: action.text, kind: action.kind, action: action.action };
                    }))
                ]
            }]) +
            '<p class="title2">遗留问题</p>' +
            tableBoxHtml({
                columns: [{ text: '问题', cls: 'colu-m' }, { text: '说明', cls: 'colu-l' }],
                rows: toArray(data.issues).map(function (item) {
                    return [{ cls: 'colu-m', text: item.title }, { cls: 'colu-l', text: item.detail }];
                })
            }) +
            '<p class="title2">验收标准</p>' +
            boxerHtml([{
                cls: 'itemL',
                parts: [
                    headerHtml(standards.title),
                    textZboxHtml(standards.text),
                    optionHtml(toArray(standards.actions).map(function (action) {
                        return { text: action.text, kind: action.kind, action: action.action };
                    }))
                ]
            }]) +
            '<p class="title2">任务验收情况</p>' +
            tableBoxHtml({
                columns: [{ text: 'Agent', cls: 'colu-m' }, { text: '任务', cls: 'colu-l' }, { text: '验收结果', cls: 'colu-m' }],
                rows: toArray(data.taskResults).map(function (item) {
                    return [
                        { cls: 'colu-m', html: listFieldHtml([item.agent]) },
                        { cls: 'colu-l', text: item.task },
                        { cls: 'colu-m', html: '<div class="tagZ' + (item.ok ? ' tagZOK' : '') + '">' + esc(item.result) + '</div>' }
                    ];
                })
            });
        fill(byId('pane-acceptance'), html);
        return html;
    };

    /* ---- 存档点 ---------------------------------------------------------- */

    render.checkpoints = function (checkpoints) {
        const data = checkpoints || {};
        const html =
            titleHtml('存档点') +
            '<p class="title2">最新存档点</p>' +
            boxerHtml(toArray(data.latest).map(function (item) {
                return { cls: 'item', parts: [headerHtml(item.title)] };
            })) +
            '<p class="title2">历史存档点</p>' +
            boxerHtml(toArray(data.history).map(function (item) {
                return { cls: 'item', parts: [headerHtml(item.title)] };
            })) +
            '<p class="title2">存档失败</p>' +
            boxerHtml(toArray(data.failed).map(function (item) {
                return {
                    cls: 'item',
                    parts: [
                        headerHtml(item.title),
                        titleHtml('失败原因'), textZHtml(item.reason),
                        optionHtml([{ text: '重试', action: 'checkpoint.retry:' + item.id }])
                    ]
                };
            }));
        fill(byId('pane-checkpoints'), html);
        return html;
    };

    /* ---- 总路径 ---------------------------------------------------------- */

    render.timeline = function (timeline) {
        const rows = toArray(timeline).map(function (group) {
            return '<div class="eraTitle">' + esc(group.era) + '</div>' +
                toArray(group.items).map(function (item) {
                    return '<div class="item" data-row-id="' + esc(item.id) + '">' +
                        '<div class="Cit1">' + esc(item.time) + '</div>' +
                        '<div class="Cit2">' + listFieldHtml([item.actor], 'itemS', { identity: true }) + '</div>' +
                        '<div class="Cit2">' + esc(item.task) + '</div>' +
                        '<div class="Cit3">' + esc(item.action) + '</div>' +
                        '</div>';
                }).join('');
        }).join('');
        const html = titleHtml('总路径') +
            '<p class="title2">可视化 Agent 们的所有行动</p>' +
            '<div class="taskFlow">' +
            '<div class="header"><div class="Cit1">时间</div><div class="Cit2">操作人</div>' +
            '<div class="Cit2">任务</div><div class="Cit3">操作</div></div>' +
            rows + '</div>';
        fill(byId('pane-path'), html);
        return html;
    };

    /* ---- 侧栏面板 -------------------------------------------------------- */

    render.aside = function (slug, section, fields, options) {
        const node = tabAside(slug);
        if (!node) return null;
        const sections = asideSections(node);
        const index = clampNum(Number(section) || 0, 0, Math.max(sections.length - 1, 0));
        const target = sections[index];
        if (!target) return null;
        fill(target, asideFieldsHtml(fields));
        const title = (options && options.title) || (fields && fields.title);
        if (title) setAsideTitle(node, title);
        return target;
    };

    /* Agent 列表窗口 / Agent 详情窗口 */
    render.agentWindow = function (agents) {
        const container = qs('#mgrAgent .inner');
        if (!container) return null;
        fill(container, '<div class="table">' + toArray(agents).map(function (agent) {
            return '<div class="item" data-agent-id="' + esc(agent.id) + '">' +
                '<div class="title"><img src="' + esc(iconOf(agent)) + '" />' + esc(agent.title || agent.name) + '</div>' +
                '<div class="content">' +
                '<div class="txtBlock"><div class="left">协作</div><div class="right">' + esc(agent.project) + '</div></div>' +
                '<div class="txtBlock"><div class="left">任务</div><div class="right">' + esc(agent.task) + '</div></div>' +
                '<div class="txtBlock"><div class="left">API</div><div class="right">' + esc(agent.api) + '</div></div>' +
                '</div></div>';
        }).join('') + '</div>');
        return container;
    };

    render.agentInfoWindow = function (agent) {
        const node = byId('mgrAgentInfo');
        if (!node) return null;
        const data = agent || {};
        const titleNode = qs('.titleBar .title', node);
        if (titleNode) titleNode.textContent = toText(data.title || data.name || 'Agent 详细信息');
        form.fill(node, [data.project, data.task, data.api]);
        return node;
    };

    /* 设置窗口：把值回填到各个控件（主题、保存地址、清理周期）。
       回填一律走 silent，否则会被 choosebox:change 当成用户操作。*/
    render.settings = function (settings) {
        const data = settings || {};
        if (data.theme) ui.choosebox.setValue(qs('#uSet1 .choosebox'), data.theme, { silent: true });
        if (data.clearDays) ui.choosebox.setValue(qs('#uSet2 .choosebox'), data.clearDays, { silent: true });
        if (data.savePath !== undefined) {
            const input = qs('#uSet2 .textbox input');
            if (input) input.value = toText(data.savePath);
        }
        return data;
    };

    /* 侧栏细节内容的专用渲染器（点击内容时调用） */
    render.taskDetail = function (task) {
        const data = task || {};
        return render.aside('tasks', 0, [
            { title: '任务', text: data.title },
            { title: '当前状态', html: '<div class="textN"><div class="' + (data.statusClass || 'status-start') + '">' + esc(data.statusText) + '</div></div>' },
            { title: '负责 Agent', text: (data.agent || {}).name },
            { title: '理解报告', text: data.report },
            { title: '开工条件', text: toArray(data.conditions).join(' ') },
            { title: '改动范围', text: data.scope },
            { title: '交付结果', text: data.deliverable },
            { title: '时间', text: data.time }
        ], { title: '任务细节' });
    };

    render.inboxDetail = function (item) {
        const data = item || {};
        return render.aside('inbox', 0, [
            { title: '问题', text: data.level },
            { title: '描述', text: data.detail },
            { title: '提出 Agent', html: listFieldHtml([data.agent], 'item') },
            { title: '时间', text: data.time },
            { title: '操作', html: '<div class="buttonbox2" data-tg-action="' + esc(data.action) + '">' + esc(data.actionText) + '</div>' }
        ], { title: '详细信息' });
    };

    render.dissentDetail = function (dissent) {
        const data = dissent || {};
        const parts = [
            { bgTitle: data.title },
            { title: '参与 Agent', html: listFieldHtml(data.agents, 'itemS') },
            { title: '时间', text: data.time },
            { title: '影响范围', text: data.scope }
        ];
        toArray(data.understandings).forEach(function (item) {
            parts.push({ title: item.agent + '的理解', text: item.text });
        });
        return render.aside('conflict', 0, parts, { title: '详细信息' });
    };

    render.contractDetail = function (contract) {
        const data = contract || {};
        const parts = [
            { bgTitle: data.title },
            { title: '提出 Agent', html: listFieldHtml(data.proposers, 'itemS') },
            { title: '提出时间', text: data.time },
            { title: '影响范围', text: data.scope },
            { title: '契约内容', text: data.text },
            { title: '已确认 Agent', html: listFieldHtml(data.confirmed, 'itemS') },
            { title: '未确认 Agent', html: listFieldHtml(data.unconfirmed, 'itemS') }
        ];
        return render.aside('conflict', 1, parts, { title: '详细信息' });
    };

    render.intentDetail = function (intent) {
        const data = intent || {};
        const agentName = (data.agent || {}).name || data.agentName || 'Agent';
        return render.aside('audit', 0, [
            { bgTitle: agentName + ' 的意图声明' },
            { title: 'Agent', html: listFieldHtml([data.agent], 'itemS') },
            { title: '目标', text: data.target },
            { title: '方式', text: data.mode },
            { title: '原因', text: data.reason },
            { title: '声明版本', text: data.version },
            { title: '租约', html: '<div class="tagZ' + (data.lease && data.lease.ok ? ' tagZOK' : '') + '">' + esc(data.lease && data.lease.text) + '</div>' }
        ], { title: '详细信息' });
    };

    render.leaseDetail = function (lease) {
        const data = lease || {};
        const agentName = (data.agent || {}).name || data.agentName || 'Agent';
        return render.aside('audit', 1, [
            { bgTitle: agentName + ' 的权限租约' },
            { title: 'Agent', html: listFieldHtml([data.agent], 'itemS') },
            { title: '批准范围', text: data.scope },
            { title: '声明版本', text: data.version },
            { title: '租约', html: '<div class="tagZ' + (data.lease && data.lease.ok ? ' tagZOK' : '') + '">' + esc(data.lease && data.lease.text) + '</div>' }
        ], { title: '详细信息' });
    };

    render.workspaceDetail = function (workspace) {
        const data = workspace || {};
        return render.aside('workspace', 0, [
            { bgTitle: data.name },
            { title: '修改者', html: listFieldHtml([data.agent], 'item') },
            { title: '隔离方式', text: data.isolation },
            { title: '改动的文件', text: toArray(data.files).join('\n') },
            { title: '当前状态', html: '<div class="textN">' + tagsHtml(data.states) + '</div>' },
            { title: '补丁', text: data.patch }
        ], { title: '详细信息' });
    };

    render.acceptanceDetail = function (acceptance) {
        const data = (acceptance || {}).standards || {};
        return render.aside('acceptance', 0, [
            { bgTitle: data.title },
            { text: data.text }
        ], { title: '详细信息' });
    };

    render.pathDetail = function (record) {
        const data = record || {};
        return render.aside('path', 0, [
            { title: '时间', text: data.time },
            { title: '操作人', text: (data.actor || {}).name },
            { title: '任务', text: data.task },
            { title: '操作', text: data.action }
        ], { title: '路径详情' });
    };

    /* ---- 一次性重绘 ------------------------------------------------------ */

    /* 把 state 里的所有数据铺到页面上（refresh / 初始化 / dispatch 之后调用） */
    render.all = function () {
        render.list(state.get('projects', []));
        render.overview(state.get('project', {}));
        render.inbox(state.get('inbox', {}));
        render.agents(state.get('agents', []));
        render.tasks(state.get('tasks', []));
        render.conflicts(state.get('conflicts', {}));
        render.audit(state.get('audits', {}));
        render.workspaces(state.get('workspaces', []));
        render.acceptance(state.get('acceptance', {}));
        render.checkpoints(state.get('checkpoints', {}));
        render.timeline(state.get('timeline', []));
        render.agentWindow(state.get('agentsWindow', []));
        render.settings(state.get('settings', {}));
        form.watch(document); /* 渲染出来的新 input 也自动装上失焦提交 */
        emit('render:all', null);
        return true;
    };

    /* ========================================================================
     * §6 动作与分发
     * ------------------------------------------------------------------------
     * 三件事：
     *   1) app.*     —— 给 index.html 的 onclick 用的页面级命令（短、稳定）
     *   2) actions.* —— 真正的业务动作：必要时先确认，再发请求，再提示 + 局部重绘
     *   3) dispatch  —— 反向通道：后端 / 宿主脚本用 {type, payload} 驱动前端
     * 另外这里还把"点击内容 → 唤出侧栏"的映射接上（侧栏默认全隐藏）。
     * ====================================================================== */

    /* ---- 动作路由 -------------------------------------------------------- */

    /* 渲染器写出的按钮带 data-tg-action="名字:参数"，在这里查表执行；
       没注册的名字不会被吞掉，而是以 action:request 事件抛给后端/宿主。*/
    const ACTION_HANDLERS = Object.create(null);

    function parseActionSpec(spec) {
        const text = toText(spec);
        const at = text.indexOf(':');
        return (at < 0) ? { name: text, id: '' } : { name: text.slice(0, at), id: text.slice(at + 1) };
    }

    function runAction(spec) {
        const parsed = parseActionSpec(spec);
        if (!parsed.name) return null;
        const handler = ACTION_HANDLERS[parsed.name];
        if (handler) return handler(parsed.id, parsed.name);
        /* 找不到专用处理器时，允许直接写 dispatch 的类型名（如 ui.workspace.home），
           冒号后面那截作为 payload。这样渲染器里可以放心地把接口名当动作名用。*/
        if (DISPATCH_ROUTES[parsed.name]) return Tsunagou.dispatch(parsed.name, parsed.id || undefined);
        emit('action:request', parsed);
        return null;
    }

    function registerAction(name, handler) { ACTION_HANDLERS[name] = handler; }

    /* ---- 数据查找小工具 -------------------------------------------------- */

    function findById(list, id) {
        const target = toText(id);
        let hit = null;
        toArray(list).forEach(function (item) {
            if (!hit && item && toText(item.id) === target) hit = item;
        });
        return hit;
    }

    function findInboxItem(id) {
        return findById(state.get('inbox.pending', []), id) || findById(state.get('inbox.done', []), id);
    }

    /* ---- 新建协作向导第 3 步：子 Agent 列表 ------------------------------ */

    /* （放在 §6 是因为它跟着 actions.addSubAgent 一起变） */
    render.wizardSubAgents = function (list) {
        const box = qs('#newXz3 .listfieldbox');
        if (!box) return null;
        fill(box, toArray(list).map(function (agent) {
            return chipHtml({ name: agent.name, icon: agent.icon, id: agent.api }, 'itemC');
        }).join('') + '<div class="itemAdd"><i class="fa fa-circle-plus"></i></div>');
        return box;
    };

    /* 向导第 2 步的"检测到的 Agent"：传 null 就清空 */
    render.wizardAgentBox = function (agent) {
        const box = qs('#newXz2 .agentbox');
        if (!box) return null;
        if (!agent || !toText(agent.name)) { fill(box, ''); return box; }
        fill(box, '<img class="left" src="' + esc(iconOf(agent)) + '" />' +
            '<div class="right">' + esc(agent.name) + '</div>');
        return box;
    };

    /* 向导第 4 步的"核对"：按当前输入重画一遍 */
    render.wizardReview = function (draft) {
        const data = draft || {};
        const box = qs('#newXz4 .freebox');
        if (!box) return null;
        const main = data.mainAgent || {};
        const subs = toArray(data.subAgents);
        fill(box,
            '<div class="descbox">项目名称</div>' +
            '<div class="title">' + esc(data.name || '（还没填写）') + '</div>' +
            '<div class="descbox">主 Agent</div>' +
            (main.name || main.api
                ? listFieldHtml([{ name: main.name || main.api, icon: main.icon }], 'itemJ')
                : '<div class="descbox">（还没填写）</div>') +
            '<div class="descbox">子 Agent</div>' +
            (subs.length ? listFieldHtml(subs, 'itemJ') : '<div class="descbox">（还没有添加）</div>'));
        return box;
    };

    /* ---- 业务动作 -------------------------------------------------------- */

    /* 「添加子 Agent」窗口（#addSubAgent）有两个入口，提交成功后要回到不同的地方：
      wizard —— 向导第 3 步的小加号，结果进向导的草稿列表；
      agents —— Agent 管理页的大加号，结果进 Agent 列表。
   打开窗口时把来源记下来（由 app.addSubAgent 写），提交时读它。*/
    let addSubAgentSource = 'agents';

    /* 统一"先确认、再提交"的写法 */
    function confirmThen(confirmOptions, task) {
        return dialog.confirm(confirmOptions).then(function (ok) {
            if (!ok) return false;
            return Promise.resolve(task());
        });
    }

    const actionsApi = {
        /* 新建协作：向导"完成"时调用 */
        createProject: function (draft) {
            const data = draft || {};
            if (!toText(data.name).trim()) {
                notify.error('请填写协作的名字');
                return Promise.resolve(false);
            }
            return notify.track('正在创建协作', api.post('projectCreate', data)).then(function () {
                notify.success({ title: '协作已创建', sub: data.name });
                /* live 模式：以后端为准，重新拉一次列表 */
                if (config.mode === 'live') {
                    return Tsunagou.refresh(['projects']).then(function () { return true; });
                }
                /* demo 模式：没有后端，就在本地插一张卡片让界面有反馈 */
                const list = toArray(state.get('projects', [])).slice();
                list.unshift({
                    id: 'p' + Date.now(),
                    name: data.name,
                    status: 'preparing',
                    time: '刚刚',
                    mainAgent: data.mainAgent,
                    agents: toArray(data.subAgents).map(function (agent) {
                        return { name: agent.name, icon: agent.icon };
                    }),
                    extra: toArray(data.subAgents).length,
                    selected: true
                });
                list.forEach(function (item, index) { item.selected = (index === 0); });
                state.set('projects', list);
                render.list(list);
                return true;
            });
        },

        /* 添加子 Agent（窗口 #addSubAgent 的"确定"）
           窗口是从哪开的，决定结果写到哪里去，见 addSubAgentSource。*/
        addSubAgent: function (payload) {
            const data = payload || {};
            const name = toText(data.name).trim();
            const address = toText(data.api).trim();
            if (!name || !address) {
                notify.error('请填写子 Agent 名称与 API 地址');
                return Promise.resolve(false);
            }
            const source = (data.source === 'wizard' || data.source === 'agents') ? data.source : addSubAgentSource;
            /* 只把该发的字段发给后端（source 这种界面信息不出去）*/
            const body = { name: name, api: address };
            if (data.icon) body.icon = data.icon;
            return api.post('subAgentCreate', body).then(function () {
                notify.success({ title: '已添加子 Agent', sub: name });
                ui.window.close('addSubAgent');
                ui.window.clearInputs('addSubAgent');
                if (source === 'wizard') {
                    /* 向导第 3 步：进草稿列表（"完成"时随项目一起提交）*/
                    const draft = toArray(state.get('wizard.draftSubAgents', [])).slice();
                    draft.push({ name: name, api: address, icon: body.icon || 'deepseek' });
                    state.set('wizard.draftSubAgents', draft);
                    render.wizardSubAgents(draft);
                    return true;
                }
                /* Agent 管理页：以后端为准重新拉一次（Agent 管理页 + Agent 列表窗口都跟着变；
                   demo 模式下没有后端，refresh 只重绘本地上已有的数据）。*/
                return Promise.resolve(Tsunagou.refresh(['agents', 'agentsWindow'])).then(function () { return true; });
            });
        },

        /* 向导第 2 步：拿 API 地址去后端探测这是哪个 Agent */
        detectMainAgent: function () {
            const inputs = qsa('#newXz2 input');
            const name = toText(inputs[0] && inputs[0].value).trim();
            const apiAddress = toText(inputs[1] && inputs[1].value).trim();
            if (!apiAddress) {
                state.set('wizard.detectedMainAgent', null);
                render.wizardAgentBox(null);
                return Promise.resolve(false);
            }
            return api.get('detectAgent', { api: apiAddress }, { silent: true }).then(function (data) {
                const info = isPlainObject(data) ? data : { name: data };
                const detected = {
                    name: info.name || name || apiAddress,
                    icon: info.icon || 'deepseek',
                    api: apiAddress
                };
                state.set('wizard.detectedMainAgent', detected);
                render.wizardAgentBox(detected);
                return detected;
            }, function () {
                /* 探测不到就清空显示，不要留着上一次的结果 */
                state.set('wizard.detectedMainAgent', null);
                render.wizardAgentBox(null);
                return false;
            });
        },

        /* 保存一条设置（主题、清理周期…）：后端只需要认 key / value 两个字段 */
        saveSetting: function (key, value) {
            return api.post('settingSave', { key: key, value: value }, { silent: true })
                .then(function () { return true; }, function () { return false; });
        },

        /* 添加 Agent（Agent 列表窗口用） */
        addAgent: function (payload) {
            const data = payload || {};
            return api.post('agentCreate', data).then(function () {
                notify.success({ title: '已添加 Agent', sub: data.name });
                return true;
            });
        },

        /* 删除 Agent：确认框 → 提交 */
        removeAgent: function (id) {
            return confirmThen({
                title: '删除 Agent',
                text: '确定要删除这个 Agent 吗？',
                description: '此操作不可挽回，请务必考虑清楚。',
                okText: '删除',
                danger: true
            }, function () {
                return api.post('agentRemove', { id: id }).then(function () {
                    notify.success({ title: '已删除 Agent' });
                    return true;
                });
            });
        },

        /* 设为主 Agent */
        setMainAgent: function (id) {
            return confirmThen({
                title: '设为主 Agent',
                text: '确定要让这个 Agent 接管主 Agent 的位置吗？',
                okText: '设为主 Agent'
            }, function () {
                return api.post('agentSetMain', { id: id }).then(function () {
                    notify.success({ title: '已设为主 Agent' });
                    return true;
                });
            });
        },

        /* 保存 Agent 详情窗口里的三个输入 */
        saveAgentInfo: function (values) {
            return api.post('settingSave', { window: 'mgrAgentInfo', values: values }).then(function () {
                notify.success({ title: '改动已成功保存' });
                ui.window.close('mgrAgentInfo');
                return true;
            });
        },

        /* 收件箱：移动一条消息（pending ↔ done）并重绘 */
        moveInbox: function (fromKey, toKey, id) {
            const from = toArray(state.get(fromKey, [])).slice();
            const to = toArray(state.get(toKey, [])).slice();
            const index = from.findIndex(function (item) { return toText(item.id) === toText(id); });
            if (index < 0) return null;
            const moved = from.splice(index, 1)[0];
            to.unshift(moved);
            state.set(fromKey, from);
            state.set(toKey, to);
            render.inbox(state.get('inbox', {}));
            return moved;
        },

        /* 收件箱"去处理"：**只是带你跳过去**，不在这里把消息标成已处理。
           去处看消息里的 target（见 openMessageTarget）；真要改数据是用户在那一页处理完之后
           由后端自己把消息挪到 done，前端下次 refresh(['inbox']) 就看到结果了。
           宿主/后端想记录"用户点过去处理了"，听 'inbox:open' 事件即可。*/
        inboxHandle: function (id) {
            const item = findInboxItem(id);
            if (!item) return false;
            const opened = openMessageTarget(item);
            emit('inbox:open', { id: id, item: item, target: item.target || null, opened: opened });
            return opened;
        },

        inboxRevoke: function (id) {
            const item = findInboxItem(id);
            if (!item) return Promise.resolve(false);
            return confirmThen({
                title: '撤销处理',
                text: '确定要撤销这条消息的处理结果吗？',
                description: item.title,
                okText: '撤销'
            }, function () {
                return api.post('inboxRevoke', { id: id }).then(function () {
                    actionsApi.moveInbox('inbox.done', 'inbox.pending', id);
                    ui.aside.hide('inbox');
                    notify.success({ title: '已撤销', sub: item.title });
                    return true;
                });
            });
        },

        acceptanceConfirm: function () {
            return confirmThen({
                title: '确认完成项目',
                text: '确定要确认项目完成吗？',
                description: '项目会立即被标注为"已完成"，并新建一个存档点。',
                okText: '确认完成'
            }, function () {
                return api.post('acceptanceConfirm', {}).then(function () {
                    notify.success({ title: '项目已完成', sub: '已新建存档点' });
                    /* 本地乐观更新：顶部状态 + 基本信息里的"项目状态" */
                    state.set('project.statusText', '已完成');
                    const basics = toArray(state.get('project.basics', []));
                    if (basics[0]) {
                        basics[0].value = '已完成';
                        basics[0].active = false;
                        state.set('project.basics', basics);
                    }
                    render.overview(state.get('project', {}));
                    /* 项目状态变了，左栏卡片的归属（进行中/已完成）也可能变，顺手刷一下列表 */
                    Tsunagou.refresh(['projects']);
                    return true;
                });
            });
        },

        acceptanceArchive: function () {
            return confirmThen({
                title: '归档项目',
                text: '确定要归档这个项目吗？',
                description: '归档后项目会移到"已完成的协作"里。',
                okText: '归档'
            }, function () {
                return api.post('acceptanceArchive', {}).then(function () {
                    notify.success({ title: '项目已归档' });
                    return true;
                });
            });
        },

        checkpointRetry: function (id) {
            return confirmThen({
                title: '重试存档',
                text: '确定要重新尝试这次存档吗？',
                okText: '重试'
            }, function () {
                return api.post('checkpointRetry', { id: id }).then(function () {
                    notify.success({ title: '已重新发起存档' });
                    return true;
                });
            });
        },

        wipeAllData: function () {
            return confirmThen({
                title: '抹除全部数据',
                text: '确定要抹除全部数据吗？',
                description: '此操作不可挽回，请务必考虑清楚。',
                okText: '确定',
                danger: true
            }, function () {
                return api.post('dataWipe', {}).then(function () {
                    notify.success({ title: '数据已抹除' });
                    return true;
                });
            });
        }
    };

    Object.assign(actions, actionsApi);

    /* 动作名 → 处理函数（渲染器里的 data-tg-action 就认这些名字） */
    registerAction('inbox.handle', function (id) { return actions.inboxHandle(id); });
    registerAction('inbox.revoke', function (id) { return actions.inboxRevoke(id); });
    registerAction('acceptance.confirm', function () { return actions.acceptanceConfirm(); });
    registerAction('acceptance.archive', function () { return actions.acceptanceArchive(); });
    registerAction('checkpoint.retry', function (id) { return actions.checkpointRetry(id); });
    registerAction('agent.remove', function (id) { return actions.removeAgent(id); });
    registerAction('agent.setMain', function (id) { return actions.setMainAgent(id); });
    registerAction('contract.detail', function (id) {
        /* 契约在冲突页的第 4 个子标签里，对应侧栏第 2 段 */
        openDetail('conflict', id, 3);
        return true;
    });
    registerAction('dissent.negotiate', function () {
        ui.blockTabs.conflict(2);
        ui.aside.hide('conflict');
        return true;
    });
    registerAction('dissent.contract', function (id) {
        const dissent = findById(state.get('conflicts.dissents', []), id);
        const contract = toArray(state.get('conflicts.contracts', []))[0];
        ui.blockTabs.conflict(3);
        if (contract) {
            render.contractDetail(contract);
            ui.aside.show('conflict', 1);
        } else if (dissent) {
            render.dissentDetail(dissent);
            ui.aside.show('conflict', 0);
        }
        return true;
    });
    registerAction('acceptance.detail', function () { return openDetail('acceptance'); });

    /* ---- 打开某条数据的详情（点内容唤侧栏 / 收件箱"去处理"都走这里） ----

       侧栏默认全部隐藏（切标签页也会全收起），只有"点到对应内容"或"跳到某条数据"才出现。
       每个页面的"拿 id 找数据 → 画进侧栏 → 用第几段"写在下表里，
       鼠标点击（bindContentClicks）和收件箱跳转（openMessageTarget）共用同一套规则。

       每个函数返回侧栏的分段号；找不到数据就返回 null（调用方什么都不做）。*/
    const DETAIL_VIEWS = {
        inbox: function (id) {
            const item = findInboxItem(id);
            if (!item) return null;
            render.inboxDetail(item);
            return 0;
        },
        tasks: function (id) {
            const row = findById(state.get('tasks', []), id) || {};
            /* 侧栏内容先就着表格行本身画（大多数字段行里就有）；
               如果后端另外发过这条任务的详情（dispatch 'task.detail'），
               且 id 对得上，再用它盖一层。保存的详情不属于这条任务时一律忽略。*/
            const detail = Object.assign({}, row);
            const stored = state.get('taskDetail', null);
            if (stored && toText(stored.id) === toText(row.id)) Object.assign(detail, stored);
            render.taskDetail(detail);
            return 0;
        },
        workspace: function (id) {
            const item = findById(state.get('workspaces', []), id);
            if (!item) return null;
            render.workspaceDetail(item);
            return 0;
        },
        path: function (id) {
            let found = null;
            toArray(state.get('timeline', [])).forEach(function (group) {
                toArray(group.items).forEach(function (line) {
                    if (!found && toText(line.id) === toText(id)) found = line;
                });
            });
            if (!found) return null;
            render.pathDetail(found);
            return 0;
        },
        /* 验收只有一个详情，不分条 */
        acceptance: function () {
            render.acceptanceDetail(state.get('acceptance', {}));
            return 0;
        },
        /* 冲突与协商：区块第 4 段（契约）对应侧栏第 2 段，其余都在第 1 段 */
        conflict: function (id, block) {
            if (Number(block) === 3) {
                const contract = findById(state.get('conflicts.contracts', []), id);
                if (!contract) return null;
                render.contractDetail(contract);
                return 1;
            }
            const dissent = findById(state.get('conflicts.dissents', []), id);
            if (!dissent) return null;
            render.dissentDetail(dissent);
            return 0;
        },
        /* 意图与权限审计：区块第 2 段（权限租约）对应侧栏第 2 段，其余都在第 1 段 */
        audit: function (id, block) {
            if (Number(block) === 1) {
                const lease = findById(state.get('audits.leases', []), id) ||
                    findById(state.get('audits.waiting', []), id);
                if (!lease) return null;
                render.leaseDetail(lease);
                return 1;
            }
            const intent = findById(state.get('audits.intents', []), id);
            if (!intent) return null;
            render.intentDetail(intent);
            return 0;
        }
    };

    /* 打开某页某条数据的详情并唤出侧栏。block 只对冲突/审计有意义（决定侧栏用哪一段）。
       返回是否打开了。*/
    function openDetail(slug, id, block) {
        const view = DETAIL_VIEWS[slug];
        if (!view) return false;
        const section = view(id, block);
        if (section === null || section === undefined) return false;
        ui.aside.show(slug, section);
        return true;
    }

    /* 点在哪一段上（区块子标签的序号）—— 决定侧栏用哪一段 */
    function blockIndexOf(node, blockId) {
        const block = byId(blockId);
        const panel = closest(node, '.tabContent');
        return block ? Math.max(blockPanels(block).indexOf(panel), 0) : 0;
    }

    /* ---- 收件箱"去处理"：跳到这条消息对应的页面 ----------------------------------

       语义是"带你去处理"，所以这里**不改任何数据、也不提示"已处理"** ——
       消息什么时候算处理完，由后端在真处理完之后自己把它挪到 done，
       前端下次 refresh(['inbox']) 自然就看到了。

       去处由消息里的 target 指定：{ tab:'conflict'|'audit'|…, block?:0..n, id?:'…' }。
       target 只给 tab 就只切页面；带 id 会顺带把那一条的详情拉到侧栏上。*/
    function openMessageTarget(item) {
        const target = (item && item.target) || {};
        const slug = normalizeSlug(target.tab);
        if (!slug) return false;
        const block = (target.block === undefined || target.block === null) ? null : Number(target.block);
        /* 先切到那一页，再切区块子标签，最后定位到具体那一条 */
        ui.tabs.project(slug);
        if (block !== null) ui.blockTabs.select(slug, block);
        if (target.id) openDetail(slug, target.id, block);
        return true;
    }

    function bindContentClicks() {
        document.addEventListener('click', function (event) {
            /* 按钮自己走动作通道，不参与"点内容唤侧栏" */
            if (closest(event.target, '[data-tg-action]')) return;

            const target = event.target;
            const rowId = function (node) { return node.getAttribute('data-row-id'); };

            const inboxRow = closest(target, '#pane-inbox .tablebox .tr');
            if (inboxRow) { openDetail('inbox', rowId(inboxRow)); return; }

            const taskRow = closest(target, '#pane-tasks .tablebox .tr');
            if (taskRow) { openDetail('tasks', rowId(taskRow)); return; }

            const auditRow = closest(target, '#pane-audit .tabContent .tablebox .tr');
            if (auditRow) {
                openDetail('audit', rowId(auditRow), blockIndexOf(auditRow, 'block-audit'));
                return;
            }

            /* 选择器里的 '>' 是必须的：卡片内部还有 .listfieldbox > .item 的胶囊，
               不加 '>' 就会命中胶囊本身（它没有身份标记），侧栏就打不开了。*/
            const conflictCard = closest(target, '#pane-conflict .tabContent > .boxerbox > .item');
            if (conflictCard) {
                openDetail('conflict', rowId(conflictCard), blockIndexOf(conflictCard, 'block-conflict'));
                return;
            }

            const workspaceCard = closest(target, '#pane-workspace .boxerbox > .item');
            if (workspaceCard) { openDetail('workspace', workspaceCard.getAttribute('data-workspace-id')); return; }

            const pathRow = closest(target, '#pane-path .taskFlow > .item');
            if (pathRow) { openDetail('path', rowId(pathRow)); return; }
        });
    }

    /* ---- 页面级命令（index.html 的 onclick 指向这里） -------------------- */

    Object.assign(app, {
        /* 工作区 —— openProject(id) 会顺带把"当前项目"切成 id，并拉这个项目的数据 */
        openProject: function (id) {
            const projectId = toText(id);
            if (projectId) {
                state.set('currentProjectId', projectId);
                /* 列表数据本来就在手上，直接重绘一次就能把选中态换过去，不用再请求 */
                render.list(state.get('projects', []));
                /* 换项目时统一回到主视图：上一个项目停在哪个标签页，不该带到新项目来。
                   顺带会把所有侧栏收起来，正好是"刚进一个新项目"该有的初始状态。*/
                ui.tabs.project('overview');
            }
            ui.workspace.project();
            if (!projectId) return true;
            emit('project:open', { id: projectId });
            return Tsunagou.refresh(PROJECT_SCOPED_KEYS);
        },
        openHome: function () { ui.workspace.home(); return true; },

        /* 左侧栏折叠 / 展开 */
        foldSidebar: function () { ui.sidebar.fold(); return true; },
        unfoldSidebar: function () { ui.sidebar.unfold(); return true; },
        toggleSidebar: function () { ui.sidebar.toggle(); return true; },

        /* 窗口 */
        openWindow: function (id) { ui.window.open(id); return true; },
        closeWindow: function (id) { ui.window.close(id); return true; },

        /* 设置窗口：打开并切到某一页（不传则停在个性化设置） */
        openSettings: function (key) {
            ui.window.open('setPanel');
            ui.settingTabs.select(key || 'personal');
            return true;
        },
        settingTab: function (key) { return ui.settingTabs.select(key); },

        /* Agent 列表窗口 */
        openAgents: function () {
            render.agentWindow(state.get('agentsWindow', []));
            ui.window.open('mgrAgent');
            return true;
        },
        /* 点 Agent 列表里的某一条 → 打开详情 */
        openAgentInfo: function (id) {
            const agent = findById(state.get('agentsWindow', []), id);
            render.agentInfoWindow(agent || {});
            ui.window.open('mgrAgentInfo');
            return true;
        },

        /* 新建协作向导 */
        createProject: function () { ui.wizard.open(); return true; },
        wizardNext: function () { return ui.wizard.next(); },
        wizardPrev: function () { return ui.wizard.prev(); },
        wizardFinish: function () { return ui.wizard.finish(); },

        /* 添加子 Agent（向导第 3 步的小加号、Agent 管理页的大加号都走这里）
           options.source 标记这次是从哪开的（见 addSubAgentSource）。*/
        addSubAgent: function (options) {
            const node = byId('addSubAgent');
            if (!node) return false;
            const opts = options || {};
            if (opts.source) addSubAgentSource = (opts.source === 'wizard') ? 'wizard' : 'agents';
            ui.window.clearInputs(node);
            /* 只有真给了名字/地址才回填，光传 source 不要清空输入框 */
            if (opts.name !== undefined || opts.api !== undefined) {
                ui.window.fillInputs(node, [opts.name, opts.api]);
            }
            ui.window.open(node);
            return true;
        },

        /* 项目卡片上的"编辑" */
        editProject: function (id) {
            emit('project:edit', { id: id });
            return true;
        },

        /* DEBUG 页的四个按钮 = 四类通用组件的现场演示 */
        demo: {
            success: function () { notify.success({ title: '改动已成功保存' }); return true; },
            info: function () { notify.info('请至少选择一个Agent'); return true; },
            loading: function () {
                notify.loading('正在连接 Agent');
                setTimeout(function () { notify.loadingEnd(); }, 2000);
                return true;
            },
            decision: function () {
                return dialog.decision({
                    title: '需要用户确认/决定的信息',
                    content: '项目"Hello World"的子 Agent（Claude Code 051）试图将 main() 函数的 printf("%d",a) ' +
                        '关键位置改为 printf("%f",a)，主 Agent 认为这一改动可能会影响整个程序的输出结果，需要人工裁定。',
                    actions: [
                        { label: '忽略', value: 'ignore' },
                        { label: '查看详情', kind: 'important', value: 'detail' }
                    ]
                }).then(function (value) {
                    if (value === 'detail') app.demo.info('已打开详情（示例）');
                    return value;
                });
            }
        }
    });

    /* 点任意 .itemAdd（大加号 / 小加号）都是"加人"，但要分清是哪张页面上的：
       向导第 3 步的小加号在 #newXz3 里面，其余（Agent 管理页末尾那个大加号）算 Agent 列表。*/
    delegateClick(['.itemAdd'], function (node) {
        app.addSubAgent({ source: closest(node, '#newXz3') ? 'wizard' : 'agents' });
    });

    /* 左栏协作卡片：点卡片 = 选中它 + 进入项目工作区；
       点右下角的 .edit 只算"编辑"，不选中、也不进项目。 */
    function selectProjectCard(card) {
        qsa('#projList .projItem').forEach(function (node) {
            if (node === card) node.className = 'projItem projItemSelected';
            else node.classList.remove('projItemSelected');
        });
        const id = card.getAttribute('data-project-id');
        const list = toArray(state.get('projects', []));
        list.forEach(function (item) { item.selected = (toText(item.id) === toText(id)); });
        state.set('projects', list);
        emit('project:select', { id: id });
        return id;
    }

    function bindProjectCards() {
        delegateClick(['#projList .projItem'], function (card, event) {
            if (closest(event.target, '.edit')) {
                app.editProject(card.getAttribute('data-project-id'));
                return;
            }
            const id = selectProjectCard(card);
            app.openProject(id);
        });
    }

    /* 点 Agent 卡片的选中态（先只广播事件，具体功能后面再补） */
    delegateClick(['#pane-agents .boxerbox > .item .listfieldbox .item'], function (node) {
        emit('agent:select', { id: node.getAttribute('data-agent-id') || '' });
    });

    /* ---- 静态窗口里的按钮 ------------------------------------------------ */

    function bindStaticWindowButtons() {
        delegateClick(['#addSubAgent .options .buttonbox2active'], function () {
            const values = form.collect('addSubAgent');
            actions.addSubAgent({ name: values[0], api: values[1] });
        });
        delegateClick(['#mgrAgentInfo .options .buttonbox2active'], function () {
            actions.saveAgentInfo(form.collect('mgrAgentInfo', { byKey: true }));
        });
        delegateClick(['#delDat .options .buttonbox2active'], function () {
            actions.wipeAllData();
        });
        delegateClick(['#mgrAgent .inner .table .item'], function (node) {
            app.openAgentInfo(node.getAttribute('data-agent-id'));
        });
    }

    /* 向导第 2 步的两个输入框：失焦后去后端探测主 Agent */
    function bindWizardDetect() {
        qsa('#newXz2 input').forEach(function (input) {
            input.addEventListener('blur', function () { actions.detectMainAgent(); });
        });
    }

    /* ---- 设置窗口里的两个下拉框 ------------------------------------------ */

    function bindSettingChooseboxes() {
        document.addEventListener('choosebox:change', function (event) {
            const panel = event.detail.panel;
            if (!panel) return;
            if (panel.id === 'uSetCol1') {
                app.setTheme(event.detail.value);
                actions.saveSetting('theme', event.detail.value);
                return;
            }
            if (panel.id === 'uSetCol2') {
                /* 选回同一个值不算改动，不提示 */
                if (state.get('settings.clearDays') === event.detail.value) return;
                state.set('settings.clearDays', event.detail.value);
                actions.saveSetting('clearDays', event.detail.value);
                notify.success({ title: '改动已成功保存' });
            }
        });
    }

    /* ---- 主题 ------------------------------------------------------------ */

    /* 只做两件事：改写 :root 上的颜色变量 + 把成对的配图切成 -l / -d 版。
       深色值 = style.css 里 :root 的原始值；浅色值 = 明暗反相。*/
    const THEME_VARS = {
        dark: {
            '--col-1': '#151517', '--col-1-a': '#1515178a', '--col-1-5': '#1a1a1a',
            '--col-2': '#1D1D1F', '--col-3': '#2C2C2E', '--col-4': '#303435',
            '--col-4-5': '#404040', '--col-5': '#595959', '--col-6': '#999999',
            '--col-7': '#C9C9C9', '--col-7-5': '#E4E4E4', '--col-8': 'white'
        },
        light: {
            '--col-1': '#FFFFFF', '--col-1-a': '#FFFFFFB3', '--col-1-5': '#E8E8EC',
            '--col-2': '#F4F4F7', '--col-3': '#E9E9EE', '--col-4': '#DFDFE5',
            '--col-4-5': '#D6D6DD', '--col-5': '#B9B9C1', '--col-6': '#7C7C85',
            '--col-7': '#414149', '--col-7-5': '#1F1F26', '--col-8': '#111114'
        }
    };

    /* 配图：-l 是白色版（深色模式用），-d 是深色版（浅色模式用） */
    function applyThemeImages(light) {
        const suffix = light ? '-d.png' : '-l.png';
        qsa('img').forEach(function (img) {
            const src = img.getAttribute('src');
            if (!src || !/-[ld]\.png$/i.test(src)) return;
            img.setAttribute('src', src.replace(/-[ld]\.png$/i, suffix));
        });
    }

    app.setTheme = function (mode) {
        const wanted = toText(mode) || '深色'; /* 不传参时按深色，不要写进 undefined */
        const systemLight = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        const name = (wanted === '浅色' || wanted === 'light' || (wanted === '自动' && systemLight)) ? 'light' : 'dark';
        const style = document.documentElement.style;
        Object.keys(THEME_VARS[name]).forEach(function (key) {
            style.setProperty(key, THEME_VARS[name][key]);
        });
        applyThemeImages(name === 'light');
        state.set('settings.theme', wanted);
        /* 回填下拉框：值不同才写，而且走 silent —— 回填不是用户操作，
           不该派发 choosebox:change（否则会反过来再进一次主题切换）。*/
        const box = qs('#uSet1 .choosebox');
        if (box && ui.choosebox.value(box) !== wanted) ui.choosebox.setValue(box, wanted, { silent: true });
        emit('theme:change', { mode: wanted, resolved: name });
        return name;
    };

    /* ---- 反向通道：dispatch ---------------------------------------------- */

    /* 路由表：type → 处理函数，payload 就是后端给的数据 */
    const DISPATCH_ROUTES = {
        /* 全量 / 增量数据 */
        'state.replace': function (payload) { state.replace(payload); render.all(); },
        'state.patch': function (payload) { state.patch(payload); render.all(); },
        'state.reset': function () { state.reset(); render.all(); },
        'render.all': function () { render.all(); },

        'project.list': function (payload) { state.set('projects', payload); render.list(payload); },
        'project.current': function (payload) { state.set('project', payload); render.overview(payload); },
        'inbox.list': function (payload) { state.set('inbox', payload); render.inbox(payload); },
        'agent.list': function (payload) { state.set('agents', payload); render.agents(payload); },
        'agent.window': function (payload) { state.set('agentsWindow', payload); render.agentWindow(payload); },
        'agent.info': function (payload) { render.agentInfoWindow(payload); ui.window.open('mgrAgentInfo'); },
        'task.list': function (payload) { state.set('tasks', payload); render.tasks(payload); },
        'task.detail': function (payload) { state.set('taskDetail', payload); return payload; },
        'conflict.data': function (payload) { state.set('conflicts', payload); render.conflicts(payload); },
        'audit.data': function (payload) { state.set('audits', payload); render.audit(payload); },
        'workspace.list': function (payload) { state.set('workspaces', payload); render.workspaces(payload); },
        'acceptance.data': function (payload) { state.set('acceptance', payload); render.acceptance(payload); },
        'checkpoint.list': function (payload) { state.set('checkpoints', payload); render.checkpoints(payload); },
        'timeline.list': function (payload) { state.set('timeline', payload); render.timeline(payload); },
        'settings.data': function (payload) { state.set('settings', payload); render.settings(payload); },
        'wizard.subAgents': function (payload) { state.set('wizard.draftSubAgents', payload); render.wizardSubAgents(payload); },

        /* 反馈 */
        'notify.success': function (payload) { notify.success(payload); },
        'notify.info': function (payload) {
            if (isPlainObject(payload)) notify.info(payload.text, payload); else notify.info(payload);
        },
        'notify.error': function (payload) {
            if (isPlainObject(payload)) notify.error(payload.text, payload); else notify.error(payload);
        },
        'notify.loading': function (payload) { notify.loading(isPlainObject(payload) ? payload.text : payload); },
        'notify.loading.hide': function () { notify.loadingEnd(); },
        'dialog.confirm': function (payload) { return dialog.confirm(payload); },
        'dialog.decision': function (payload) { return dialog.decision(payload); },

        /* 界面控制 */
        'ui.window.open': function (payload) { return ui.window.open(isPlainObject(payload) ? payload.id : payload); },
        'ui.window.close': function (payload) { return ui.window.close(isPlainObject(payload) ? payload.id : payload); },
        'ui.window.closeAll': function () { return ui.window.closeAll(); },
        'ui.workspace': function (payload) { return ui.workspace.show(payload); },
        'ui.sidebar': function (payload) { return (payload === 'fold' || payload === true) ? ui.sidebar.fold() : ui.sidebar.unfold(); },
        'ui.tab': function (payload) { return ui.tabs.project(isPlainObject(payload) ? payload.slug : payload); },
        'ui.project.open': function (payload) { return app.openProject(isPlainObject(payload) ? payload.id : payload); },
        'ui.workspace.home': function () { return app.openHome(); },
        'ui.blocktab': function (payload) {
            const data = isPlainObject(payload) ? payload : { block: 'conflict', index: payload };
            return ui.blockTabs.select(data.block, data.index);
        },
        'ui.settingtab': function (payload) { return ui.settingTabs.select(payload); },
        'ui.wizard.go': function (payload) { return ui.wizard.go(payload); },
        'ui.aside.show': function (payload) {
            const data = isPlainObject(payload) ? payload : { slug: payload };
            return ui.aside.show(data.slug, data.section);
        },
        'ui.aside.hide': function (payload) { return ui.aside.hide(payload); },
        'ui.aside.hideAll': function () { return ui.aside.hideAll(); },
        'ui.choosebox.set': function (payload) {
            const data = payload || {};
            const panel = byId(data.panel);
            const box = data.selector ? qs(data.selector) : (panel ? findCsBox(panel) : resolveEl(data.box));
            return ui.choosebox.setValue(box, data.value);
        },
        'theme.set': function (payload) { return app.setTheme(payload); }
    };

    /* 后端 / 宿主脚本的统一入口：
       Tsunagou.dispatch({type:'task.list', payload:[...]})
       Tsunagou.dispatch('ui.tab', 'tasks') */
    Tsunagou.dispatch = function (message, payload) {
        const msg = (typeof message === 'string') ? { type: message, payload: payload } : (message || {});
        const type = toText(msg.type);
        const route = DISPATCH_ROUTES[type];
        if (!route) {
            const error = new Error('未知的 dispatch 类型：' + type);
            emit('dispatch:error', { type: type, error: error });
            return { ok: false, type: type, error: error.message };
        }
        try {
            const result = route(msg.payload);
            if (result && typeof result.then === 'function') {
                return result.then(function (value) { return { ok: true, type: type, value: value }; },
                    function (error) { return { ok: false, type: type, error: error.message }; });
            }
            return { ok: true, type: type, value: result };
        } catch (error) {
            emit('dispatch:error', { type: type, error: error });
            return { ok: false, type: type, error: error.message };
        }
    };

    Tsunagou.types = function () { return Object.keys(DISPATCH_ROUTES); };

    /* ---- 从后端刷新 ------------------------------------------------------ */

    /* 需要"当前项目"才能请求的数据键（路径里带 {project}） */
    const PROJECT_SCOPED_KEYS = ['project', 'inbox', 'agents', 'tasks', 'conflicts',
        'audits', 'workspaces', 'acceptance', 'checkpoints', 'timeline'];

    /* 前端主动拉取的唯一入口。demo 模式直接重绘本地数据，不发请求。*/
    const REFRESH_ROUTES = [
        ['projects', 'project.list'],
        ['agentsWindow', 'agent.window'],
        ['settings', 'settings.data'],
        ['project', 'project.current'],
        ['inbox', 'inbox.list'],
        ['agents', 'agent.list'],
        ['tasks', 'task.list'],
        ['conflicts', 'conflict.data'],
        ['audits', 'audit.data'],
        ['workspaces', 'workspace.list'],
        ['acceptance', 'acceptance.data'],
        ['checkpoints', 'checkpoint.list'],
        ['timeline', 'timeline.list']
    ];

    Tsunagou.refresh = function (keys) {
        if (config.mode === 'demo') {
            render.all();
            return Promise.resolve({ demo: true, rendered: true });
        }
        const wanted = keys ? toArray(keys) : null;
        const hasProject = !!toText(state.get('currentProjectId'));
        const tasks = REFRESH_ROUTES.filter(function (pair) {
            /* 没选项目时不请求项目作用域的数据，免得白跑一趟错误提示 */
            if (pathNeedsProject(pair[0]) && !hasProject) return false;
            return !wanted || wanted.indexOf(pair[0]) >= 0 || wanted.indexOf(pair[1]) >= 0;
        }).map(function (pair) {
            return api.get(pair[0], null, { silent: true }).then(function (data) {
                const result = Tsunagou.dispatch(pair[1], data);
                return { key: pair[0], ok: result.ok };
            }, function (error) {
                return { key: pair[0], ok: false, error: error.message };
            });
        });
        return Promise.all(tasks).then(function (results) {
            const failed = results.filter(function (item) { return !item.ok; });
            if (failed.length) {
                notify.error('有 ' + failed.length + ' 项数据拉取失败：' + failed.map(function (item) { return item.key; }).join('、'));
            }
            return { results: results, failed: failed.length };
        });
    };

    /* ========================================================================
     * §7 初始（空）状态
     * ------------------------------------------------------------------------
     * 这里不再放演示数据 —— 页面上的内容一律由后端提供。
     * 本仓库自带的模拟后端在 assets/js/mock-backend.js，它按 method.md §6
     * 的接口表应答 GET/POST，可以直接对照阅读。
     *
     * 这份空骨架只做两件事：
     *   1) 页面在拿到数据之前有确定的形状，渲染器不会因为字段缺失而报错；
     *   2) 给 Tsunagou.state.reset() 一个"清空"的落点。
     * 字段含义见 method.md §7。
     * ====================================================================== */

    var EMPTY_STATE = {
        currentProjectId: null,
        projects: [],
        project: {},
        inbox: { pending: [], done: [] },
        agents: [],
        agentsWindow: [],
        tasks: [],
        taskDetail: {},
        conflicts: { dissents: [], conflicts: [], messages: [], contracts: [] },
        audits: { intents: [], leases: [], waiting: [] },
        workspaces: [],
        acceptance: { proposal: {}, issues: [], standards: {}, taskResults: [] },
        checkpoints: { latest: [], history: [], failed: [] },
        timeline: [],
        settings: { theme: '深色', savePath: '', clearDays: '永不' },
        wizard: { draftSubAgents: [], detectedMainAgent: null }
    };


    /* ========================================================================
     * §8 启动
     * ------------------------------------------------------------------------
     * 顺序很重要：先绑事件，再把数据铺上屏，最后摆正初始界面状态。
     * 脚本在 </body> 前引入，所以这里可以直接跑；万一被挪到 <head>，
     * 也会等 DOMContentLoaded 再启动。
     * ====================================================================== */

    /* 渲染出来的按钮都带 data-tg-action，统一在这里转成动作调用 */
    function bindActionButtons() {
        delegateClick(['[data-tg-action]'], function (node) {
            runAction(node.getAttribute('data-tg-action'));
        });
    }

    /* 初始标签页以 HTML 里标了 tabSactive 的那个为准 */
    function initialTabSlug() {
        const bar = qs('.secProjPanel .tabArea');
        const list = bar ? qsa(':scope > .tabS', bar) : [];
        for (let i = 0; i < list.length; i++) {
            if (list[i].classList.contains(TAB_ACTIVE_CLASS)) {
                return (PROJECT_TABS[i] || PROJECT_TABS[0]).slug;
            }
        }
        return PROJECT_TABS[0].slug;
    }

    function init() {
        /* 1) 事件绑定：全部走 document 级委托，动态渲染出来的元素自动生效 */
        ui.tabs.bindClicks();
        ui.blockTabs.bindClicks();
        ui.aside.bindClose();
        ui.asideDrag.bind();
        ui.choosebox.bindClicks();
        ui.window.bindBackdrop();
        bindContentClicks();
        bindActionButtons();
        bindProjectCards();
        bindStaticWindowButtons();
        bindWizardDetect();
        bindSettingChooseboxes();
        form.watch(document);

        /* 2) 数据 → 页面 */
        state.hydrate();
        render.all();
        render.wizardSubAgents(state.get('wizard.draftSubAgents', []));
        ui.aside.clearAll();
        ui.blockTabs.init();

        /* 3) 初始界面状态 */
        ui.workspace.home();
        ui.tabs.project(initialTabSlug());
        ui.wizard.reset();
        ui.settingTabs.personal();
        app.setTheme(state.get('settings.theme', '深色'));

        /* 4) 就绪信号：宿主脚本可以 Tsunagou.onReady(fn) 或听 'ready' 事件 */
        Tsunagou.ready = true;
        emit('ready', { version: Tsunagou.version });
        return true;
    }

    Object.assign(Tsunagou, {
        ready: false,
        init: init,
        on: on,
        off: off,
        once: once,
        emit: emit,
        onReady: function (handler) {
            if (Tsunagou.ready) { handler({ version: Tsunagou.version }); return function () {}; }
            return once('ready', handler);
        }
    });

    /* 补一个 §1 的配置键：抹除全部数据 */
    config.setPath('dataWipe', '/settings/wipe');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
