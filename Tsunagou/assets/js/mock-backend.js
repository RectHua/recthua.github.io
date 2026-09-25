/* ============================================================================
 * 模拟后端 —— assets/js/mock-backend.js
 * ----------------------------------------------------------------------------
 * 这是一个**开发/演示用的假后端**，不是产品代码：
 *   1. 它把 window.fetch 拦下来，只处理 /api/ 开头的地址，其余一律放行；
 *   2. 按 method.md §6 的接口表应答，数据全部写死在下面的 PROJECTS 里；
 *   3. 写入类接口（POST）会真的改动内存里的数据，所以写完再刷新能看到结果。
 *
 * 为什么用"拦 fetch"而不是"直接调 Tsunagou.dispatch"？
 *   这样前端走的是**和真实后端完全相同**的代码路径：
 *   Tsunagou.api → 响应解包 → dispatch → 渲染器 → DOM。
 *   以后接真后端时，只需做两件事：
 *     · 删掉 index.html 里的 <script src="./assets/js/mock-backend.js"></script>
 *     · 在页面里调 Tsunagou.config.setMode('live') + Tsunagou.config.setBaseUrl(真实地址)
 *   本文件末尾做的那两件事，就是这两件事。
 *
 * 应答包统一用 { code: 0, message: 'ok', data: ... }（method.md 里的第一种风格），
 * 为的是顺便验证前端的响应解包逻辑。
 * ========================================================================== */

(function () {
    'use strict';

    if (!window.Tsunagou) {
        console.warn('[模拟后端] 没有找到 Tsunagou（behavior.js 还没加载？），已跳过。');
        return;
    }

    /* ========================================================================
     * 一、数据：两个完整的协作项目
     * ------------------------------------------------------------------------
     * 每个项目的字段与 method.md §7 完全对应，可以直接当作"后端 JSON 长什么样"的样例。
     * 项目之间**故意做成两套完全不同的内容**，用来验证切换项目时各个面板都会跟着换。
     * ====================================================================== */

    const PROJECTS = {

        /* ══════════════════ 项目一：Minecraft 模组 ══════════════════════ */
        'p-mc-fire': {

            /* 左栏卡片 */
            list: {
                id: 'p-mc-fire',
                name: 'Minecraft 模组：可变色火焰与可燃方块',
                status: 'working',
                time: '12 分钟前',
                mainAgent: { name: 'DeepSeek Harness', icon: 'deepseek' },
                agents: [
                    { name: 'Codex 021', icon: 'codex' },
                    { name: 'Claude Code 051', icon: 'claudecode' }
                ],
                extra: 2
            },

            /* 主视图 */
            overview: {
                id: 'p-mc-fire',
                name: 'Minecraft 模组：可变色火焰与可燃方块',
                description: '基于 Java 8 / Forge 的 Minecraft 1.12.2 模组。目标有两个：' +
                    '让火焰能按所在方块呈现不同颜色，以及允许模组作者用配置文件声明哪些方块可以被点燃。' +
                    '目前火焰渲染的调用链已经摸清，正在实现颜色配置的解析。',
                statusText: '工作中',
                basics: [
                    { label: '项目状态', value: '工作中', active: true },
                    { label: '协调仓库', value: 'E:\\workspace\\mc-fire-color' },
                    { label: '创建时间', value: '2026年9月18日' }
                ],
                progress: {
                    total: '45%',
                    plan: [
                        { text: '搭建模组骨架与构建脚本', state: 'done' },
                        { text: '摸清火焰贴图的渲染调用链', state: 'done' },
                        { text: '实现颜色配置解析', state: 'doing' },
                        { text: '实现可燃方块白名单', state: 'todo' },
                        { text: '与其它火焰类模组兼容', state: 'todo' }
                    ]
                },
                versions: [
                    { label: '代码版本', value: '9月25日 09:40 的代码快照' },
                    { label: '协议版本', value: '第 3 版' },
                    { label: '项目版本', value: '第 12 次修订' },
                    { label: '最近存档点', value: '9月25日 09:40 的存档点' }
                ],
                stats: [
                    { label: '子 Agent 数', value: '2' },
                    { label: '冲突数', value: '1' },
                    { label: '协商数', value: '2' },
                    { label: '契约数', value: '1' },
                    { label: '存档数', value: '5' },
                    { label: '耗时', value: '6 小时 52 分钟' }
                ],
                storage: [
                    { label: '项目基础信息', value: '.tsunagou/project.json' },
                    { label: '存档点', value: '.tsunagou/checkpoints/' },
                    { label: '数据库/授权/票据/日志', value: '.tsunagou/local/' }
                ]
            },

            /* 我的收件箱 */
            inbox: {
                pending: [
                    {
                        id: 'mc-m-001', level: '接口未约定',
                        title: 'FlameColorAPI.getColor() 的返回值含义未约定',
                        detail: 'Codex 021 认为应返回 0xRRGGBB，Claude Code 051 认为要带透明度通道 0xAARRGGBB，双方实现不一致',
                        agent: { name: 'Codex 021', icon: 'codex' }, time: '今天 09:12',
                        /* target = “去处理”跳到哪里：冲突与协商的第 1 个子标签（分歧）里的 mc-d-001 */
                        target: { tab: 'conflict', block: 0, id: 'mc-d-001' },
                        action: 'inbox.handle:mc-m-001', actionText: '去处理'
                    },
                    {
                        id: 'mc-m-002', level: '权限申请',
                        title: 'Claude Code 051 申请修改 build.gradle',
                        detail: '需要引入 shadow 插件来打包配置模板，会影响构建产物结构，需要人工批准',
                        agent: { name: 'Claude Code 051', icon: 'claudecode' }, time: '今天 08:55',
                        /* 意图与权限审计的第 2 个子标签（权限）里的等待队列 mc-w-001 */
                        target: { tab: 'audit', block: 1, id: 'mc-w-001' },
                        action: 'inbox.handle:mc-m-002', actionText: '去处理'
                    }
                ],
                done: [
                    {
                        id: 'mc-m-101', level: '契约确认',
                        title: '火焰颜色配置文件格式（第 1 版）',
                        detail: '已确认采用 config/firecolor.json，键为方块注册名（如 minecraft:stone），值为 16 进制颜色',
                        agent: { name: 'Codex 021', icon: 'codex' }, time: '昨天 18:20',
                        target: { tab: 'conflict', block: 3, id: 'mc-ct-001' },
                        action: 'inbox.revoke:mc-m-101', actionText: '撤销'
                    }
                ]
            },

            /* Agent 管理 */
            agents: [
                {
                    id: 'mc-a-main', role: '主 Agent', name: 'DeepSeek Harness', icon: 'deepseek', api: '127.0.0.1:65531',
                    statusText: '可用', statusOk: true,
                    desc: '负责拆任务、评审代码和所有 Git 操作',
                    currentTask: '把"颜色配置解析"拆成可并行的子任务',
                    basic: [
                        { text: '会话身份隔离', ok: true }, { text: '会话连续性证据', ok: true },
                        { text: '读取项目上下文', ok: true }, { text: '结构化工具调用', ok: true }
                    ],
                    ops: [
                        { text: '跑完整任务流程', ok: true }, { text: '提交理解报告', ok: true },
                        { text: '参与约定', ok: true }, { text: '收取消息', ok: true },
                        { text: '正式答复', ok: true }, { text: '断线安全重连', ok: true },
                        { text: '消息不重复', ok: true }
                    ],
                    /* 卡片上的按钮暂不接线，留作占位 */
                    actions: [{ text: '撤销任务' }, { text: '撤销主 Agent', kind: 'active' }]
                },
                {
                    id: 'mc-a-codex', role: '子 Agent', name: 'Codex 021', icon: 'codex', api: '127.0.0.1:65532',
                    statusText: '可用', statusOk: true,
                    desc: '负责 Forge 渲染层改动，改动范围限定在 client/render 目录',
                    currentTask: 'D-002 实现火焰颜色配置的解析',
                    basic: [
                        { text: '会话身份隔离', ok: true }, { text: '会话连续性证据', ok: true },
                        { text: '读取项目上下文', ok: true }, { text: '结构化工具调用', ok: true }
                    ],
                    ops: [
                        { text: '跑完整任务流程', ok: true }, { text: '提交理解报告', ok: true },
                        { text: '参与约定', ok: true }, { text: '收取消息', ok: true },
                        { text: '正式答复', ok: true }, { text: '断线安全重连' }, { text: '消息不重复', ok: true }
                    ],
                    actions: [{ text: '撤销任务' }, { text: '设为主 Agent', kind: 'active' }]
                },
                {
                    id: 'mc-a-claude', role: '子 Agent', name: 'Claude Code 051', icon: 'claudecode', api: '127.0.0.1:65533',
                    statusText: '受限', statusOk: false,
                    desc: '负责构建脚本与配置模板，改动范围限定在 gradle 与 resources',
                    currentTask: '等待权限批准：修改 build.gradle',
                    basic: [
                        { text: '会话身份隔离', ok: true }, { text: '会话连续性证据', ok: true },
                        { text: '读取项目上下文', ok: true }, { text: '结构化工具调用', ok: true }
                    ],
                    ops: [
                        { text: '跑完整任务流程', ok: true }, { text: '提交理解报告', ok: true },
                        { text: '参与约定', ok: true }, { text: '收取消息', ok: true },
                        { text: '正式答复' }, { text: '断线安全重连', ok: true }, { text: '消息不重复', ok: true }
                    ],
                    actions: [{ text: '撤销任务' }, { text: '设为主 Agent', kind: 'active' }]
                }
            ],

            /* 任务区 */
            tasks: [
                {
                    id: 'mc-t-001',
                    title: 'D-001 摸清火焰贴图的渲染调用链',
                    detail: '从 BlockFire 的 getFireIcon 一路追到 TextureAtlasSprite 与 BufferBuilder 的调用顺序',
                    status: 7, statusText: '已完成', statusClass: 'status-start',
                    report: '理解报告（摘要）：\n火焰贴图并不是在 BlockFire 里直接指定的，而是 getFireIcon() 返回一个 TextureAtlasSprite，' +
                        '再由 BufferBuilder 拼进渲染批次。要对颜色动手，最省事的位置是拿到 sprite 之后、写进 buffer 之前。',
                    agent: { name: 'Codex 021', icon: 'codex' }, time: '今天 09:40',
                    conditions: ['理解报告', '契约'], scope: 'client/render 目录',
                    deliverable: '一张调用链示意图 + 结论注释'
                },
                {
                    id: 'mc-t-002',
                    title: 'D-002 实现火焰颜色配置的解析',
                    detail: '读取 config/firecolor.json，把方块注册名映射成颜色，并在渲染时取用',
                    status: 5, statusText: '执行中', statusClass: 'status-start',
                    report: '理解报告（摘要）：\n1. 解析放在模组初始化阶段完成，渲染路径上只做一次查表，不要每帧读文件；\n' +
                        '2. 方块注册名可能带命名空间，需要规范化，缺省时补 minecraft:；\n' +
                        '3. 解析失败只降级、不报错，返回 -1 让调用方沿用原版颜色。',
                    agent: { name: 'Codex 021', icon: 'codex' }, time: '今天 10:05',
                    conditions: ['理解报告', '契约', '工作区', '操作许可'], scope: 'client/render 目录',
                    deliverable: 'FlameColorAPI 实现 + 单测'
                },
                {
                    id: 'mc-t-003',
                    title: 'D-003 可燃方块白名单',
                    detail: '让模组作者声明哪些方块能被点燃，默认沿用原版行为',
                    status: 4, statusText: '已认领', statusClass: 'status-start',
                    report: '尚未提交理解报告。',
                    agent: { name: 'Claude Code 051', icon: 'claudecode' }, time: '今天 10:20',
                    conditions: ['契约'], scope: 'common/config 目录',
                    deliverable: '配置项 + 文档'
                },
                {
                    id: 'mc-t-004',
                    title: 'D-004 打包配置模板到产物里',
                    detail: '把 firecolor.json 模板随 jar 一起发布，首次启动时落到 config 目录',
                    status: 2, statusText: '已就绪', statusClass: 'status-start',
                    report: '等待 build.gradle 的修改权限。',
                    agent: { name: 'Claude Code 051', icon: 'claudecode' }, time: '——',
                    conditions: ['操作许可'], scope: 'build.gradle、resources 目录',
                    deliverable: '构建脚本改动'
                }
            ],

            /* 冲突与协商 */
            conflicts: {
                dissents: [
                    {
                        id: 'mc-d-001',
                        title: 'FlameColorAPI.getColor() 返回值的含义分歧',
                        agents: [
                            { name: 'Codex 021', icon: 'codex' },
                            { name: 'Claude Code 051', icon: 'claudecode' }
                        ],
                        time: '今天 09:12',
                        scope: '后端（服务端逻辑）任务 D-003，渲染任务 D-002',
                        understandings: [
                            { agent: 'Codex 021', text: '返回 0xRRGGBB 就够了。原版火焰本来就没有透明度，带 alpha 只会让调用方多一次位运算。' },
                            { agent: 'Claude Code 051', text: '应该返回 0xAARRGGBB。将来要做半透明的幽灵火焰时，没有 alpha 通道就得改接口，属于破坏性变更。' }
                        ],
                        actions: [
                            { text: '查看协商', action: 'dissent.negotiate:mc-d-001' },
                            { text: '查看契约', kind: 'active', action: 'dissent.contract:mc-d-001' }
                        ]
                    }
                ],
                conflicts: [
                    {
                        id: 'mc-c-001',
                        title: 'build.gradle 被同时修改',
                        detail: 'Claude Code 051 想加 shadow 插件，Codex 021 同时改了 sourceSets 的路径，两处改动落在同一文件的相邻行',
                        scope: '项目根目录 build.gradle',
                        agents: [
                            { name: 'Codex 021', icon: 'codex' },
                            { name: 'Claude Code 051', icon: 'claudecode' }
                        ],
                        time: '今天 08:55',
                        solution: '——'
                    }
                ],
                messages: [
                    {
                        id: 'mc-msg-001', from: 'Codex 021', to: 'Claude Code 051',
                        content: '请认领 FlameColorAPI 的返回值约定。我倾向 0xRRGGBB，如果坚持带 alpha，请在契约里写清高 8 位的含义与默认值。',
                        answered: '已答复', answeredOk: true,
                        progress: [{ text: '已送达', ok: true }, { text: '已答复', ok: true }]
                    },
                    {
                        id: 'mc-msg-002', from: 'Claude Code 051', to: 'Codex 021',
                        content: '已答复：接受 0xAARRGGBB，默认 alpha 固定为 0xFF；契约里补充"缺省时不参与混合"的说明。',
                        answered: '无需答复', answeredOk: true,
                        progress: [{ text: '已送达', ok: true }, { text: '已归档', ok: true }]
                    }
                ],
                contracts: [
                    {
                        id: 'mc-ct-001',
                        title: 'FlameColorAPI 返回值契约（第 1 版）',
                        time: '今天 09:30',
                        proposers: [{ name: 'Codex 021', icon: 'codex' }],
                        scope: '任务 D-002 与 D-003 的接口边界',
                        text: '约定 FlameColorAPI.getColor(IBlockState) 返回 int：\n' +
                            '· 高 8 位为 alpha，默认 0xFF；\n' +
                            '· 低 24 位为 RGB；\n' +
                            '· 方块未在配置中声明时返回 -1，调用方沿用原版颜色；\n' +
                            '· 解析失败不得抛出异常，一律返回 -1。',
                        confirmed: [{ name: 'Codex 021', icon: 'codex' }, { name: 'DeepSeek Harness', icon: 'deepseek' }],
                        unconfirmed: [{ name: 'Claude Code 051', icon: 'claudecode' }],
                        action: 'contract.detail:mc-ct-001'
                    }
                ]
            },

            /* 意图与权限审计 */
            audits: {
                intents: [
                    {
                        id: 'mc-i-001',
                        agent: { name: 'Codex 021', icon: 'codex' },
                        target: 'client/render/FlameColorAPI.java',
                        mode: '独占',
                        reason: '该文件正在重写，多人同时改动会冲突',
                        version: '第 2 版',
                        lease: { text: '28 分 10 秒后过期', ok: true }
                    },
                    {
                        id: 'mc-i-002',
                        agent: { name: 'Claude Code 051', icon: 'claudecode' },
                        target: 'build.gradle',
                        mode: '独占',
                        reason: '需要引入 shadow 插件打包配置模板，等用户批准',
                        version: '第 1 版',
                        lease: { text: '尚未取得' }
                    }
                ],
                leases: [
                    {
                        id: 'mc-l-001', agent: { name: 'Codex 021', icon: 'codex' },
                        scope: 'client/render/FlameColorAPI.java', version: '第 2 版',
                        lease: { text: '28 分 10 秒后过期', ok: true }
                    },
                    {
                        id: 'mc-l-002', agent: { name: 'Codex 021', icon: 'codex' },
                        scope: 'client/render/BlockFirePatch.java', version: '第 1 版',
                        lease: { text: '已过期' }
                    }
                ],
                waiting: [
                    {
                        id: 'mc-w-001', agent: { name: 'Claude Code 051', icon: 'claudecode' },
                        scope: 'build.gradle', version: '第 1 版',
                        lease: { text: '等待租约' }
                    }
                ]
            },

            /* 工作区 */
            workspaces: [
                {
                    id: 'mc-ws-001',
                    name: '工作区1 · 颜色解析',
                    agent: { name: 'Codex 021', icon: 'codex' },
                    isolation: '独立目录（worktrees/color）',
                    files: ['client/render/FlameColorAPI.java', 'client/render/BlockFirePatch.java'],
                    states: [{ text: '已记录结果', ok: true }, { text: '与开工前一致', ok: true }],
                    patch: '补丁 55aa10'
                },
                {
                    id: 'mc-ws-002',
                    name: '工作区2 · 构建脚本',
                    agent: { name: 'Claude Code 051', icon: 'claudecode' },
                    isolation: '共享目录',
                    files: ['build.gradle'],
                    states: [{ text: '等待权限', ok: false }, { text: '未提交', ok: false }],
                    patch: '——'
                }
            ],

            /* 项目验收 */
            acceptance: {
                proposal: {
                    title: '还不具备完工条件',
                    time: '今天 10:30',
                    text: '主 Agent 认为"可燃方块白名单"（D-003）与兼容性验证都还没开始，现在不具备完工条件。' +
                        '下面的遗留问题处理完之后再发起验收。',
                    actions: [
                        { text: '确认完成', kind: 'active', action: 'acceptance.confirm' },
                        { text: '归档', action: 'acceptance.archive' }
                    ]
                },
                issues: [
                    {
                        title: '与其它火焰模组的兼容性未验证',
                        detail: '同时安装两个会替换火焰渲染的模组时，谁的改动生效还没有结论；需要至少跑一轮对照实验。'
                    }
                ],
                standards: {
                    title: '主 Agent 的验收标准',
                    text: '1. 火焰颜色可由配置文件驱动，改动配置后重启即可生效；\n' +
                        '2. 未在配置里声明的方块，行为与原版完全一致；\n' +
                        '3. 解析失败只降级、不崩溃；\n' +
                        '4. 单测覆盖配置解析的三个分支（命中 / 未命中 / 格式错误）。',
                    actions: [{ text: '查看详情', kind: 'active', action: 'acceptance.detail' }]
                },
                taskResults: [
                    { agent: { name: 'Codex 021', icon: 'codex' }, task: 'D-001 摸清渲染调用链', result: '验收通过', ok: true },
                    { agent: { name: 'Codex 021', icon: 'codex' }, task: 'D-002 颜色配置解析', result: '验收中' },
                    { agent: { name: 'Claude Code 051', icon: 'claudecode' }, task: 'D-004 打包配置模板', result: '要求返工' }
                ]
            },

            /* 存档点 */
            checkpoints: {
                latest: [{ id: 'mc-cp-005', title: '今天 09:40 的存档点' }],
                history: [
                    { id: 'mc-cp-004', title: '昨天 18:20 的存档点' },
                    { id: 'mc-cp-003', title: '昨天 15:05 的存档点' }
                ],
                failed: [
                    { id: 'mc-cp-002', title: '昨天 14:40 的存档点', reason: '工作区1 有未提交的改动，拒绝存档' }
                ]
            },

            /* 总路径 */
            timeline: [
                {
                    era: '09:05 项目初始化',
                    items: [
                        { id: 'mc-log-001', time: '09:05', actor: { name: '用户', user: true }, task: '启动主项目', action: '启动主项目并邀请 DeepSeek Harness' },
                        { id: 'mc-log-002', time: '09:06', actor: { name: 'DeepSeek Harness', icon: 'deepseek', mainAgent: true }, task: '项目初始化', action: '生成 D-001~D-004 四条任务并写入契约草案' }
                    ]
                },
                {
                    era: '09:10 正式开工',
                    items: [
                        { id: 'mc-log-003', time: '09:10', actor: { name: 'Codex 021', icon: 'codex' }, task: 'D-001', action: '领取 D-001 并建立工作区1' },
                        { id: 'mc-log-004', time: '09:40', actor: { name: 'Codex 021', icon: 'codex' }, task: 'D-001', action: '提交理解报告，任务标记为已完成' },
                        { id: 'mc-log-005', time: '09:12', actor: { name: 'Codex 021', icon: 'codex' }, task: 'D-002', action: '提出分歧：getColor() 的返回值含义' },
                        { id: 'mc-log-006', time: '09:30', actor: { name: 'DeepSeek Harness', icon: 'deepseek', mainAgent: true }, task: 'D-002 / D-003', action: '裁定并落成契约 mc-ct-001' },
                        { id: 'mc-log-007', time: '08:55', actor: { name: 'Claude Code 051', icon: 'claudecode' }, task: 'D-004', action: '申请修改 build.gradle，等待用户授权' }
                    ]
                }
            ]
        },

        /* ══════════════════ 项目二：Tsunagou 前端控制层 ══════════════════ */
        'p-tg-web': {

            list: {
                id: 'p-tg-web',
                name: 'Tsunagou 前端控制层：把静态页面改造成后端可驱动的界面',
                status: 'preparing',
                time: '3 小时前',
                mainAgent: { name: 'Claude Code 127', icon: 'claudecode' },
                agents: [
                    { name: 'Codex 022', icon: 'codex' },
                    { name: 'DeepSeek Harness', icon: 'deepseek' },
                    { name: 'Claude Code 127', icon: 'claudecode' }
                ],
                extra: 3
            },

            overview: {
                id: 'p-tg-web',
                name: 'Tsunagou 前端控制层：把静态页面改造成后端可驱动的界面',
                description: '把 index.html + behavior.js 这套静态界面，改造成"后端给数据、前端只负责渲染"的结构。' +
                    '当前状态：命名空间、渲染层、通信层、分发入口都已成型，正在做接口联调前的准备。',
                statusText: '准备中',
                basics: [
                    { label: '项目状态', value: '准备中', active: true },
                    { label: '协调仓库', value: 'E:\\Tsunagou' },
                    { label: '创建时间', value: '2026年9月22日' }
                ],
                progress: {
                    total: '70%',
                    plan: [
                        { text: '整理现有的弹窗/标签页切换逻辑', state: 'done' },
                        { text: '设计并落地 Tsunagou.* 命名空间', state: 'done' },
                        { text: '按接口表实现通信层与响应解包', state: 'done' },
                        { text: '接模拟后端跑通全部面板', state: 'doing' },
                        { text: '与真实后端联调', state: 'todo' }
                    ]
                },
                versions: [
                    { label: '代码版本', value: '9月25日 11:20 的代码快照' },
                    { label: '协议版本', value: '第 1 版' },
                    { label: '项目版本', value: '第 7 次修订' },
                    { label: '最近存档点', value: '9月25日 11:20 的存档点' }
                ],
                stats: [
                    { label: '子 Agent 数', value: '2' },
                    { label: '冲突数', value: '2' },
                    { label: '协商数', value: '1' },
                    { label: '契约数', value: '2' },
                    { label: '存档数', value: '3' },
                    { label: '耗时', value: '2 小时 05 分钟' }
                ],
                storage: [
                    { label: '项目基础信息', value: '.tsunagou/project.json' },
                    { label: '存档点', value: '.tsunagou/checkpoints/' },
                    { label: '接口文档', value: 'method.md' }
                ]
            },

            inbox: {
                pending: [
                    {
                        id: 'tg-m-001', level: '契约待确认',
                        title: '响应解包格式：code 字段的取值范围',
                        detail: '前端已兼容 0 / "0" / 200 / "ok" / "success" / true，需要后端确认是否只用 0 与非 0',
                        agent: { name: 'Codex 022', icon: 'codex' }, time: '2 小时前',
                        /* 只给到子标签、不给具体条目的写法：切到“冲突与协商 → 契约”即可 */
                        target: { tab: 'conflict', block: 3 },
                        action: 'inbox.handle:tg-m-001', actionText: '去处理'
                    }
                ],
                done: [
                    {
                        id: 'tg-m-101', level: '接口约定',
                        title: '项目作用域接口路径确定',
                        detail: '统一为 /projects/{id}/xxx，前端用 {project} 占位符替换，没选项目时不发请求',
                        agent: { name: 'Claude Code 127', icon: 'claudecode' }, time: '3 小时前',
                        action: 'inbox.revoke:tg-m-101', actionText: '撤销'
                    },
                    {
                        id: 'tg-m-102', level: '接口约定',
                        title: '写操作不再走 GET',
                        detail: '早期为了实现简单全部用 GET，现已改回 POST，请求体为 JSON',
                        agent: { name: 'Claude Code 127', icon: 'claudecode' }, time: '昨天 16:40',
                        action: 'inbox.revoke:tg-m-102', actionText: '撤销'
                    }
                ]
            },

            agents: [
                {
                    id: 'tg-a-main', role: '主 Agent', name: 'Claude Code 127', icon: 'claudecode', api: '127.0.0.1:65541',
                    statusText: '可用', statusOk: true,
                    desc: '负责整体结构设计与 method.md 的维护',
                    currentTask: '准备与真实后端的联调清单',
                    basic: [
                        { text: '会话身份隔离', ok: true }, { text: '会话连续性证据', ok: true },
                        { text: '读取项目上下文', ok: true }, { text: '结构化工具调用', ok: true }
                    ],
                    ops: [
                        { text: '跑完整任务流程', ok: true }, { text: '提交理解报告', ok: true },
                        { text: '参与约定', ok: true }, { text: '收取消息', ok: true },
                        { text: '正式答复', ok: true }, { text: '断线安全重连', ok: true },
                        { text: '消息不重复', ok: true }
                    ],
                    actions: [{ text: '撤销任务' }, { text: '撤销主 Agent', kind: 'active' }]
                },
                {
                    id: 'tg-a-codex', role: '子 Agent', name: 'Codex 022', icon: 'codex', api: '127.0.0.1:65542',
                    statusText: '可用', statusOk: true,
                    desc: '负责渲染层与模板，改动范围限定在 assets/js/behavior.js 的渲染区段',
                    currentTask: '核对接每个渲染器需要的字段',
                    basic: [
                        { text: '会话身份隔离', ok: true }, { text: '会话连续性证据', ok: true },
                        { text: '读取项目上下文', ok: true }, { text: '结构化工具调用', ok: true }
                    ],
                    ops: [
                        { text: '跑完整任务流程', ok: true }, { text: '提交理解报告', ok: true },
                        { text: '参与约定', ok: true }, { text: '收取消息', ok: true },
                        { text: '正式答复', ok: true }, { text: '断线安全重连' }, { text: '消息不重复', ok: true }
                    ],
                    actions: [{ text: '撤销任务' }, { text: '设为主 Agent', kind: 'active' }]
                }
            ],

            tasks: [
                {
                    id: 'tg-t-001',
                    title: 'F-001 把标签页/弹窗逻辑收进 Tsunagou.ui',
                    detail: '原来散在各个全局函数里的显隐逻辑，统一成 UI 原语，并保持"显隐只写 display"',
                    status: 7, statusText: '已完成', statusClass: 'status-start',
                    report: '理解报告（摘要）：\n标签页、弹窗、侧栏三者的显隐规则其实只有两种：面板类（CSS 默认 none，必须写 flex）' +
                        '与区块类（CSS 默认 flex，清成空串即可）。先分清这两类，再谈其它。',
                    agent: { name: 'Codex 022', icon: 'codex' }, time: '今天 09:20',
                    conditions: ['理解报告'], scope: 'behavior.js 的 §2 区段',
                    deliverable: 'ui.* 全部原语 + 说明'
                },
                {
                    id: 'tg-t-002',
                    title: 'F-002 按接口表实现通信层',
                    detail: 'fetch 封装、响应解包、超时与错误归一，以及失焦自动提交的表单规则',
                    status: 6, statusText: '待验收', statusClass: 'status-start',
                    report: '理解报告（摘要）：\n响应解包要兼容三种风格（{code,data}、{code,result}、裸 JSON）。' +
                        '失败一律归一到 ApiError，并默认弹一次提示，除非调用方显式要求 silent。',
                    agent: { name: 'Claude Code 127', icon: 'claudecode' }, time: '今天 10:40',
                    conditions: ['理解报告', '契约'], scope: 'behavior.js 的 §4 区段',
                    deliverable: 'api.* 与 form.*'
                },
                {
                    id: 'tg-t-003',
                    title: 'F-003 接模拟后端跑通全部面板',
                    detail: '用两个完整的协作项目数据，验证十个标签页与七个侧栏都能被数据填充',
                    status: 5, statusText: '执行中', statusClass: 'status-start',
                    report: '理解报告（摘要）：\n模拟后端必须走真实代码路径（拦 fetch），否则测不出接真实后端时才会暴露的问题；' +
                        '两个项目的数据要足够不同，才能看出"切换项目"是否真的换掉了所有面板。',
                    agent: { name: 'Codex 022', icon: 'codex' }, time: '今天 11:20',
                    conditions: ['理解报告', '契约', '工作区'], scope: 'assets/js/mock-backend.js',
                    deliverable: '模拟后端 + 联调结论'
                }
            ],

            conflicts: {
                dissents: [
                    {
                        id: 'tg-d-001',
                        title: '状态提示该不该带"自动消失"',
                        agents: [
                            { name: 'Claude Code 127', icon: 'claudecode' },
                            { name: 'Codex 022', icon: 'codex' }
                        ],
                        time: '1 小时前',
                        scope: '所有写操作的反馈路径',
                        understandings: [
                            { agent: 'Claude Code 127', text: '失败提示必须常驻直到用户处理。写操作失败意味着数据没落库，2 秒就滑走等于没提示。' },
                            { agent: 'Codex 022', text: '都做成自动消失更统一。需要留痕的场景应该进收件箱，而不是靠在右下角堆通知。' }
                        ],
                        actions: [
                            { text: '查看协商', action: 'dissent.negotiate:tg-d-001' },
                            { text: '查看契约', kind: 'active', action: 'dissent.contract:tg-d-001' }
                        ]
                    }
                ],
                conflicts: [
                    {
                        id: 'tg-c-001',
                        title: '侧栏显隐时机被两处代码同时修改',
                        detail: '一处改成"随标签页一起显示"，另一处改成"点击内容才显示"，后者的改动被覆盖',
                        scope: 'ui.tabs 与 ui.aside 交界处',
                        agents: [
                            { name: 'Codex 022', icon: 'codex' },
                            { name: 'Claude Code 127', icon: 'claudecode' }
                        ],
                        time: '2 小时前',
                        solution: '——'
                    },
                    {
                        id: 'tg-c-002',
                        title: '谁负责清掉用不到的演示数据',
                        detail: 'behavior.js 里的演示数据已迁到模拟后端，但文件里仍留有一份重复数据',
                        scope: 'assets/js/behavior.js 的 §7 区段',
                        agents: [
                            { name: 'Codex 022', icon: 'codex' },
                            { name: 'Claude Code 127', icon: 'claudecode' }
                        ],
                        time: '1 小时前',
                        solution: '——'
                    }
                ],
                messages: [
                    {
                        id: 'tg-msg-001', from: 'Claude Code 127', to: 'Codex 022',
                        content: '请认领"失败提示不自动消失"这条，把结论写进契约；成功提示保持 2.6 秒自动收起不变。',
                        answered: '已答复', answeredOk: true,
                        progress: [{ text: '已送达', ok: true }, { text: '已答复', ok: true }]
                    }
                ],
                contracts: [
                    {
                        id: 'tg-ct-001',
                        title: '反馈提示契约（第 1 版）',
                        time: '今天 10:00',
                        proposers: [{ name: 'Claude Code 127', icon: 'claudecode' }],
                        scope: '所有写操作的反馈路径',
                        text: '约定：\n' +
                            '· 成功提示：右下角，进度条走完自动收起；\n' +
                            '· 失败提示：同一样式，但不自动消失，直到用户进行下一次操作；\n' +
                            '· 需要用户决策的事情一律用底部决策卡，不用提示条。',
                        confirmed: [{ name: 'Claude Code 127', icon: 'claudecode' }],
                        unconfirmed: [{ name: 'Codex 022', icon: 'codex' }, { name: 'DeepSeek Harness', icon: 'deepseek' }],
                        action: 'contract.detail:tg-ct-001'
                    },
                    {
                        id: 'tg-ct-002',
                        title: '表单提交契约（第 1 版）',
                        time: '今天 09:30',
                        proposers: [{ name: 'Codex 022', icon: 'codex' }],
                        scope: '所有 input 的提交时机',
                        text: '约定：有提交按钮的表单交给按钮；没有按钮的 input 失焦即提交，值没变不重复提交。',
                        confirmed: [{ name: 'Codex 022', icon: 'codex' }, { name: 'Claude Code 127', icon: 'claudecode' }],
                        unconfirmed: [],
                        action: 'contract.detail:tg-ct-002'
                    }
                ]
            },

            audits: {
                intents: [
                    {
                        id: 'tg-i-001',
                        agent: { name: 'Codex 022', icon: 'codex' },
                        target: 'assets/js/behavior.js（§5 渲染层）',
                        mode: '独占',
                        reason: '正在按最终字段名重写渲染器',
                        version: '第 3 版',
                        lease: { text: '45 分 00 秒后过期', ok: true }
                    },
                    {
                        id: 'tg-i-002',
                        agent: { name: 'Claude Code 127', icon: 'claudecode' },
                        target: 'method.md',
                        mode: '共享',
                        reason: '需要同步更新接口表与字段对照',
                        version: '第 2 版',
                        lease: { text: '已过期' }
                    }
                ],
                leases: [
                    {
                        id: 'tg-l-001', agent: { name: 'Codex 022', icon: 'codex' },
                        scope: 'assets/js/behavior.js（§5 渲染层）', version: '第 3 版',
                        lease: { text: '45 分 00 秒后过期', ok: true }
                    }
                ],
                waiting: [
                    {
                        id: 'tg-w-001', agent: { name: 'DeepSeek Harness', icon: 'deepseek' },
                        scope: 'assets/js/mock-backend.js', version: '第 1 版',
                        lease: { text: '等待租约' }
                    }
                ]
            },

            workspaces: [
                {
                    id: 'tg-ws-001',
                    name: '工作区1 · 渲染层',
                    agent: { name: 'Codex 022', icon: 'codex' },
                    isolation: '独立目录（worktrees/render）',
                    files: ['assets/js/behavior.js'],
                    states: [{ text: '已记录结果', ok: true }, { text: '与开工前一致', ok: true }],
                    patch: '补丁 7c31e9'
                }
            ],

            acceptance: {
                proposal: {
                    title: '还不具备完工条件',
                    time: '今天 11:30',
                    text: '主 Agent 认为与真实后端的联调还没开始，且"失败提示不自动消失"这条契约尚未全员确认，' +
                        '现在提出完工为时尚早。',
                    actions: [
                        { text: '确认完成', kind: 'active', action: 'acceptance.confirm' },
                        { text: '归档', action: 'acceptance.archive' }
                    ]
                },
                issues: [
                    {
                        title: '真实后端的响应格式尚未确认',
                        detail: '当前只按 { code, message, data } 一种风格实现，如果后端返回裸 JSON 或 { code, result } 也能兼容，' +
                            '但需要一轮真实对接来验证。'
                    },
                    {
                        title: '键盘可访问性未处理',
                        detail: '所有交互目前只覆盖鼠标，Tab 焦点顺序与 Esc 关闭窗口都还没有做。'
                    }
                ],
                standards: {
                    title: '主 Agent 的验收标准',
                    text: '1. 十个标签页、七个侧栏都能被后端数据完整填充，切换项目时全部跟着换；\n' +
                        '2. 所有写操作都有成功与失败的反馈；\n' +
                        '3. 页面在没有任何后端时也能正常打开，不报错；\n' +
                        '4. method.md 与代码一致。',
                    actions: [{ text: '查看详情', kind: 'active', action: 'acceptance.detail' }]
                },
                taskResults: [
                    { agent: { name: 'Codex 022', icon: 'codex' }, task: 'F-001 UI 原语', result: '验收通过', ok: true },
                    { agent: { name: 'Claude Code 127', icon: 'claudecode' }, task: 'F-002 通信层', result: '验收中' }
                ]
            },

            checkpoints: {
                latest: [{ id: 'tg-cp-003', title: '今天 11:20 的存档点' }],
                history: [{ id: 'tg-cp-002', title: '今天 10:40 的存档点' }],
                failed: [
                    { id: 'tg-cp-001', title: '今天 10:05 的存档点', reason: '工作区1 与主目录存在未合并的差异' }
                ]
            },

            timeline: [
                {
                    era: '08:50 项目初始化',
                    items: [
                        { id: 'tg-log-001', time: '08:50', actor: { name: '用户', user: true }, task: '启动主项目', action: '启动主项目并指定 Claude Code 127 为主 Agent' },
                        { id: 'tg-log-002', time: '08:52', actor: { name: 'Claude Code 127', icon: 'claudecode', mainAgent: true }, task: '项目初始化', action: '写入 F-001~F-003 三条任务' }
                    ]
                },
                {
                    era: '09:00 正式开工',
                    items: [
                        { id: 'tg-log-003', time: '09:00', actor: { name: 'Codex 022', icon: 'codex' }, task: 'F-001', action: '领取 F-001，建立工作区1' },
                        { id: 'tg-log-004', time: '09:20', actor: { name: 'Codex 022', icon: 'codex' }, task: 'F-001', action: '提交理解报告并完成' },
                        { id: 'tg-log-005', time: '10:00', actor: { name: 'Claude Code 127', icon: 'claudecode', mainAgent: true }, task: 'F-002', action: '落成"反馈提示契约"tg-ct-001' },
                        { id: 'tg-log-006', time: '11:20', actor: { name: 'Codex 022', icon: 'codex' }, task: 'F-003', action: '模拟后端就位，发起面板填充验证' }
                    ]
                }
            ]
        }
    };

    /* 全局设置（不属于任何项目） */
    const SETTINGS = { theme: '深色', savePath: '', clearDays: '永不' };

    /* 向导第 2 步"检测到的 Agent"用的地址表 */
    const KNOWN_AGENTS = [
        { api: '127.0.0.1:65531', name: 'DeepSeek Harness', icon: 'deepseek' },
        { api: '127.0.0.1:65532', name: 'Codex 021', icon: 'codex' },
        { api: '127.0.0.1:65533', name: 'Claude Code 051', icon: 'claudecode' },
        { api: '127.0.0.1:65541', name: 'Claude Code 127', icon: 'claudecode' },
        { api: '127.0.0.1:65542', name: 'Codex 022', icon: 'codex' }
    ];

    /* ========================================================================
     * 二、几个取数用的小函数
     * ====================================================================== */

    function project(id) { return PROJECTS[id] || null; }

    /* GET /projects —— 左栏卡片列表 */
    function projectList() {
        return Object.keys(PROJECTS).map(function (id) { return PROJECTS[id].list; });
    }

    /* GET /agents —— Agent 列表窗口，跨项目汇总（顺便验证"全局接口"和"项目接口"的差别） */
    function agentsWindowList() {
        const out = [];
        Object.keys(PROJECTS).forEach(function (id) {
            const item = PROJECTS[id];
            (item.agents || []).forEach(function (agent) {
                out.push({
                    id: agent.id,
                    title: agent.name + '（' + String(agent.api || '').split(':').pop() + '）',
                    name: agent.name,
                    icon: agent.icon,
                    project: item.list.name,
                    task: agent.currentTask,
                    api: agent.api || '——'
                });
            });
        });
        return out;
    }

    /* 在一个项目里找任务/消息，用于写操作 */
    function findInbox(pid, id) {
        const item = project(pid);
        if (!item) return null;
        const hit = (item.inbox.pending || []).filter(function (m) { return m.id === id; })[0];
        if (hit) return { box: 'pending', item: hit };
        const done = (item.inbox.done || []).filter(function (m) { return m.id === id; })[0];
        return done ? { box: 'done', item: done } : null;
    }

    function moveInbox(pid, id, to) {
        const found = findInbox(pid, id);
        if (!found || found.box === to) return false;
        const item = project(pid);
        item.inbox[found.box] = item.inbox[found.box].filter(function (m) { return m.id !== id; });
        item.inbox[to].unshift(found.item);
        return true;
    }

    /* POST /projects —— 新建协作：造一份空骨架，保证点进去不会缺字段 */
    function createProject(body) {
        const data = body || {};
        const id = 'p-' + Date.now().toString(36);
        const mainAgent = data.mainAgent || {};
        const subs = Array.isArray(data.subAgents) ? data.subAgents : [];
        PROJECTS[id] = {
            list: {
                id: id,
                name: data.name || '（未命名协作）',
                status: 'preparing',
                time: '刚刚',
                mainAgent: { name: mainAgent.name || '——', icon: mainAgent.icon || 'deepseek' },
                agents: subs.map(function (a) { return { name: a.name, icon: a.icon || 'deepseek' }; }),
                extra: subs.length
            },
            overview: {
                id: id,
                name: data.name || '（未命名协作）',
                description: '这个协作刚刚创建，还没有开始工作。',
                statusText: '准备中',
                basics: [
                    { label: '项目状态', value: '准备中', active: true },
                    { label: '协调仓库', value: '——' },
                    { label: '创建时间', value: '刚刚' }
                ],
                progress: { total: '0%', plan: [{ text: '等待主 Agent 拆分任务', state: 'todo' }] },
                versions: [{ label: '代码版本', value: '——' }, { label: '协议版本', value: '第 1 版' }],
                stats: [{ label: '子 Agent 数', value: String(subs.length) }, { label: '冲突数', value: '0' }],
                storage: [{ label: '项目基础信息', value: '.tsunagou/project.json' }]
            },
            inbox: { pending: [], done: [] },
            agents: [{
                id: id + '-main', role: '主 Agent', name: mainAgent.name || '——', icon: mainAgent.icon || 'deepseek',
                api: mainAgent.api || '', statusText: '可用', statusOk: true,
                desc: '刚接入，还没上报能力清单', currentTask: '——',
                basic: [{ text: '会话身份隔离', ok: true }],
                ops: [{ text: '跑完整任务流程', ok: true }],
                actions: [{ text: '撤销任务' }, { text: '撤销主 Agent', kind: 'active' }]
            }].concat(subs.map(function (a, i) {
                return {
                    id: id + '-sub-' + i, role: '子 Agent', name: a.name, icon: a.icon || 'deepseek',
                    api: a.api || '', statusText: '可用', statusOk: true,
                    desc: '刚接入，还没上报能力清单', currentTask: '——',
                    basic: [{ text: '会话身份隔离', ok: true }],
                    ops: [{ text: '跑完整任务流程', ok: true }],
                    actions: [{ text: '撤销任务' }, { text: '设为主 Agent', kind: 'active' }]
                };
            })),
            tasks: [],
            taskDetail: {},
            conflicts: { dissents: [], conflicts: [], messages: [], contracts: [] },
            audits: { intents: [], leases: [], waiting: [] },
            workspaces: [],
            acceptance: {
                proposal: { title: '项目刚开始', time: '刚刚', text: '还没有可验收的成果。', actions: [] },
                issues: [], standards: { title: '还没有验收标准', text: '主 Agent 尚未提出。', actions: [] },
                taskResults: []
            },
            checkpoints: { latest: [], history: [], failed: [] },
            timeline: [{
                era: '刚刚 项目初始化',
                items: [{ id: id + '-log-1', time: '刚刚', actor: { name: '用户', user: true }, task: '启动主项目', action: '创建协作' }]
            }]
        };
        return { id: id, name: PROJECTS[id].list.name };
    }

    /* 子资源名 → 项目数据里的键名 */
    const SUB_RESOURCE = {
        inbox: 'inbox', agents: 'agents', tasks: 'tasks', conflicts: 'conflicts',
        audits: 'audits', workspaces: 'workspaces', acceptance: 'acceptance',
        checkpoints: 'checkpoints', timeline: 'timeline'
    };

    /* ========================================================================
     * 三、路由表：method.md §6 的接口表
     * ====================================================================== */

    const ROUTES = [
        /* --- 全局读 --- */
        { method: 'GET', pattern: /^\/api\/projects$/, handle: function () { return projectList(); } },
        { method: 'GET', pattern: /^\/api\/agents$/, handle: function () { return agentsWindowList(); } },
        { method: 'GET', pattern: /^\/api\/settings$/, handle: function () { return SETTINGS; } },

        /* --- 探测 Agent（向导第 2 步用） --- */
        {
            method: 'GET', pattern: /^\/api\/agents\/detect$/,
            handle: function (match, url) {
                const address = url.searchParams.get('api') || '';
                if (!address) return fail(400, '缺少 api 参数');
                const known = KNOWN_AGENTS.filter(function (a) { return a.api === address; })[0];
                /* 认不出来就按约定造一个，方便前端演示"地址填什么都有人应答" */
                return known || { name: 'Agent @' + address, icon: 'deepseek' };
            }
        },

        /* --- 项目作用域读 --- */
        {
            method: 'GET', pattern: /^\/api\/projects\/([^/]+)\/([^/]+)$/,
            handle: function (match) {
                const item = project(match[1]);
                const key = SUB_RESOURCE[match[2]];
                if (!item || !key) return fail(404, '没有这个项目或子资源：' + match[1] + '/' + match[2]);
                return item[key];
            }
        },
        {
            method: 'GET', pattern: /^\/api\/projects\/([^/]+)$/,
            handle: function (match) {
                const item = project(match[1]);
                return item ? item.overview : fail(404, '没有这个项目：' + match[1]);
            }
        },

        /* --- 写 --- */
        {
            method: 'POST', pattern: /^\/api\/projects$/,
            handle: function (match, url, body) {
                const result = createProject(body);
                return { id: result.id, name: result.name };
            }
        },
        {
            method: 'POST', pattern: /^\/api\/sub-agents$/,
            handle: function (match, url, body) {
                if (!body || !body.name || !body.api) return fail(400, '子 Agent 缺少 name 或 api');
                /* 这个接口本身是全局的（method.md §6 里没有项目前缀），真后端自己决定它归到哪个协作；
                   模拟后端为了让"添加完能在界面上看到"这件事可验证，就挂到前端当前选中的协作下 ——
                   所以前端提交成功后 refresh(['agents']) 就能拿到它。*/
                const pid = Tsunagou.state.get('currentProjectId') || Object.keys(PROJECTS)[0];
                const item = project(pid);
                let id = '';
                if (item) {
                    id = pid + '-sub-' + Date.now().toString(36);
                    item.agents.push({
                        id: id, role: '子 Agent', name: body.name, icon: body.icon || 'deepseek',
                        api: body.api, statusText: '可用', statusOk: true,
                        desc: '刚接入，还没上报能力清单', currentTask: '——',
                        basic: [{ text: '会话身份隔离', ok: true }],
                        ops: [{ text: '跑完整任务流程', ok: true }],
                        actions: [{ text: '撤销任务' }, { text: '设为主 Agent', kind: 'active' }]
                    });
                    /* 顺带更新左栏卡片的头像堆叠和主视图的统计数字，免得数据前后对不上 */
                    item.list.agents = (item.list.agents || []).concat([{ name: body.name, icon: body.icon || 'deepseek' }]);
                    item.list.extra = item.list.agents.length;
                    (item.overview.stats || []).forEach(function (stat) {
                        if (stat.label === '子 Agent 数') stat.value = String(item.agents.length - 1);
                    });
                }
                return { ok: true, id: id, name: body.name };
            }
        },
        {
            method: 'POST', pattern: /^\/api\/projects\/([^/]+)\/inbox\/(handle|revoke)$/,
            handle: function (match, url, body) {
                const id = body && body.id;
                if (!id) return fail(400, '缺少消息 id');
                const moved = moveInbox(match[1], id, match[2] === 'handle' ? 'done' : 'pending');
                return moved ? { ok: true, id: id } : fail(404, '没有这条消息：' + id);
            }
        },
        {
            method: 'POST', pattern: /^\/api\/projects\/([^/]+)\/acceptance\/(confirm|archive)$/,
            handle: function (match) {
                const item = project(match[1]);
                if (!item) return fail(404, '没有这个项目：' + match[1]);
                const archived = match[2] === 'archive';
                item.overview.statusText = archived ? '已归档' : '已完成';
                item.list.status = 'finished';
                item.list.group = 'done';
                item.overview.basics[0] = { label: '项目状态', value: item.overview.statusText, active: !archived };
                return { ok: true, status: item.overview.statusText };
            }
        },
        {
            method: 'POST', pattern: /^\/api\/projects\/([^/]+)\/checkpoints\/retry$/,
            handle: function (match, url, body) {
                const item = project(match[1]);
                if (!item) return fail(404, '没有这个项目：' + match[1]);
                const id = body && body.id;
                const failed = item.checkpoints.failed.filter(function (c) { return c.id === id; })[0];
                if (failed) {
                    item.checkpoints.failed = item.checkpoints.failed.filter(function (c) { return c.id !== id; });
                    item.checkpoints.history.unshift(failed);
                }
                return { ok: true, id: id };
            }
        },
        {
            method: 'POST', pattern: /^\/api\/settings$/,
            handle: function (match, url, body) {
                const data = body || {};
                /* 前端有两种提交形状，这里都认：
                   1) { key:'theme', value:'浅色' }                    —— 下拉框选值 / 通用保存
                   2) { key:'setPanel.调度数据保存地址', value:'D:\\…' } —— input 失焦提交
                   统一取 key 的最后一段，再认常见后缀。*/
                if (data.key !== undefined && data.value !== undefined) {
                    const rawKey = String(data.key);
                    const short = rawKey.split('.').pop();
                    const value = data.value;
                    if (/保存地址$/.test(short)) SETTINGS.savePath = value;
                    else if (rawKey === 'theme' || /主题$/.test(short)) SETTINGS.theme = value;
                    else if (rawKey === 'clearDays' || /清空$/.test(short)) SETTINGS.clearDays = value;
                    else SETTINGS[short] = value;
                } else {
                    Object.assign(SETTINGS, data);
                }
                return { ok: true, settings: Object.assign({}, SETTINGS) };
            }
        },
        {
            method: 'POST', pattern: /^\/api\/settings\/wipe$/,
            handle: function () { return { ok: true, note: '模拟后端不会真的删数据' }; }
        },
        {
            method: 'POST', pattern: /^\/api\/agents(\/(remove|set-main))?$/,
            handle: function (match, url, body) { return { ok: true, id: body && body.id }; }
        },
        {
            method: 'POST', pattern: /^\/api\/projects\/([^/]+)\/finish$/,
            handle: function () { return { ok: true }; }
        }
    ];

    /* ========================================================================
     * 四、拦截 fetch
     * ====================================================================== */

    const realFetch = window.fetch ? window.fetch.bind(window) : null;
    const DELAY = 120; /* 模拟一点网络延迟，方便看到加载态；设 0 可关掉 */

    function ok(data) { return { code: 0, message: 'ok', data: data === undefined ? null : data }; }
    function fail(code, message) { return { code: code, message: message, data: null }; }

    function abortError() {
        const error = new Error('请求被中止');
        error.name = 'AbortError';
        return error;
    }

    function respond(payload, status) {
        return new Response(JSON.stringify(payload), {
            status: status || 200,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        });
    }

    window.fetch = function (input, init) {
        const target = (typeof input === 'string') ? input : (input && input.url) || '';
        let url;
        try {
            url = new URL(target, window.location.href);
        } catch (error) {
            return realFetch ? realFetch(input, init) : Promise.reject(error);
        }

        /* 注意 file:// 这个坑：页面上 new URL('/api/x', href) 的 pathname 会带上盘符
           （得到 /E:/api/x），所以不能拿 pathname 直接和 /api/... 比前缀。
           这里改成"找到 /api 之后的部分"，http:// 与 file:// 两种打开方式都能用。*/
        const at = url.pathname.indexOf('/api');
        if (at < 0) {
            return realFetch ? realFetch(input, init) : Promise.reject(new Error('没有可用的 fetch'));
        }
        const routePath = url.pathname.slice(at);

        const method = String((init && init.method) || 'GET').toUpperCase();
        let body = null;
        if (init && init.body) {
            try { body = JSON.parse(init.body); } catch (error) { body = init.body; }
        }

        const route = ROUTES.filter(function (item) {
            return item.method === method && item.pattern.test(routePath);
        })[0];

        let payload;
        if (!route) {
            console.warn('[模拟后端] 没有这条路由：' + method + ' ' + routePath);
            payload = fail(404, '模拟后端里没有这个接口：' + method + ' ' + routePath);
        } else {
            try {
                payload = route.handle(routePath.match(route.pattern), url, body);
            } catch (error) {
                console.error('[模拟后端] 处理出错：' + routePath, error);
                payload = fail(500, '模拟后端处理出错：' + error.message);
            }
        }
        /* 路由自己返回了失败包时，HTTP 状态也跟着变，好让前端的 !response.ok 分支也能被测到 */
        const status = (payload && payload.code && payload.code !== 0) ? 400 : 200;
        const response = respond(payload, status);

        const signal = init && init.signal;
        if (signal && signal.aborted) return Promise.reject(abortError());

        return new Promise(function (resolve, reject) {
            const timer = setTimeout(function () { resolve(response); }, DELAY);
            if (signal) {
                signal.addEventListener('abort', function () {
                    clearTimeout(timer);
                    reject(abortError());
                });
            }
        });
    };

    /* ========================================================================
     * 五、挂上去：切到 live 模式，拉一次数据
     * ------------------------------------------------------------------------
     * 这两行就是"接真实后端"时要做的全部事情（把 baseUrl 换成真实地址即可）。
     * ====================================================================== */

    Tsunagou.config.setBaseUrl('/api');
    Tsunagou.config.setMode('live');

    /* 暴露给控制台，方便手动看数据 / 改数据 */
    window.MockBackend = {
        projects: PROJECTS,
        settings: SETTINGS,
        list: projectList,
        /** 改完数据后重新渲染：MockBackend.refresh() */
        refresh: function (keys) { return Tsunagou.refresh(keys); },
        /** 打开某个项目：MockBackend.open('p-mc-fire') */
        open: function (id) { return Tsunagou.app.openProject(id); },
        /** 当前项目 id */
        current: function () { return Tsunagou.state.get('currentProjectId'); }
    };

    /* 页面加载后先只拉"列表 + 设置 + Agent 列表"这三个全局数据；
       项目相关的面板等用户点开某个协作时再拉（见 app.openProject）。*/
    Tsunagou.refresh(['projects', 'agentsWindow', 'settings']).then(function (result) {
        console.info('[模拟后端] 已就绪，接口前缀 ' + Tsunagou.config.get().baseUrl +
            '；可用 MockBackend.open("p-mc-fire") / MockBackend.open("p-tg-web") 打开协作。', result);
    });
})();
