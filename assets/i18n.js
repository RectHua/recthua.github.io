/* ============================================================
   IR 沉浸铁路教程站 · 英文翻译字典 (i18n)
   ------------------------------------------------------------
   工作机制：
   - 页面正文默认携带中文文本，并为每个可翻译片段标注
     data-i18n="键名" 属性（叶节点，无子标签）。
   - 本文件保存每个键对应的英文翻译；
   - assets/main.js 切换语言时，将带 data-i18n 的元素文本替换为
     英文；切回中文时恢复 HTML 中保存的原文（无需在 JS 里
     重复存放中文，天然避免"中英不同步"）。
   术语统一约定（全站一致）：
     轨道蓝图 Track Blueprint / 金道钉 Golden Spike / 道岔 switch
     转车台 turntable / 移车台 traverser / 道床 ballast
     蒸汽机车 steam locomotive / 内燃机车 diesel locomotive
     煤水车 tender / 手摇车 handcar / 节流阀 throttle / 换向器 reverser
     独立制动 independent brake / 列车制动 train brake
     失能开关 deadman switch / 涂装 livery / 互动驾驶 interactive controls
   ============================================================ */
"use strict";

/** 英文翻译字典：键名 -> 英文文本 */
const I18N_DICT = {

    /* ============ 通用 UI 文案 ============ */
    "ui.nav.ch1": "Ch.1 Track Construction",
    "ui.nav.ch2": "Ch.2 Locomotive Operation",
    "ui.toc.title": "On This Page",
    "ui.toc.open": "Contents",
    "ui.hero.meta": "By Suqiu1972 · 2nd Edition, July 2026",
    "ui.hero.quote": "The world has changed, but the heart of IR, the love and spirit of this community, hasn't faded.",
    "ui.footer.chapters": "Chapters",
    "ui.footer.links": "Related Links",
    "ui.footer.desc": "A Chinese tutorial for Minecraft 1.20.1 + Immersive Railroading 1.11.0, covering track construction, locomotive operation, train coupling and game configuration — a systematic introduction to everything IR. All content in this article is the original creation of the author alone.",
    "ui.footer.copyright": "Copyright © Yuejin Railway Workgroup 2023-2026. All rights reserved.",
    "ui.footer.license": "Licensed under CC BY-NC-SA",

    /* ============ 页面标题 ============ */
    "meta.title.ch1": "Immersive Railroading (IR) Mod Guide | Chapter 1 · Track Construction",
    "meta.title.ch2": "Immersive Railroading (IR) Mod Guide | Chapter 2 · Locomotive Operation",

    /* ======================================================
       第一章 · 轨道建设
       ====================================================== */
    "ch1.title": "Chapter 1 · Track Construction",
    "ch1.preface.title": "Preface",
    "ch1.preface.p1": "As a classic Minecraft railway mod, Immersive Railroading (IR) adds a brand-new railway system to the MC world, aiming to showcase truly magnificent railroads with realistic physics and true-to-scale trains. Based on Minecraft 1.20.1 and the latest 1.11.0 release of IR, this tutorial gives a systematic and comprehensive introduction to track construction, locomotive operation, train coupling, game configuration and more.",
    "ch1.preface.p2": "Readers are welcome to correct and supplement this tutorial.",

    "ch1.s1.title": "Chapter 1 · Rail Track Construction",
    "ch1.s1.p1": "The rail network is the foundation of the entire IR mod, so our tutorial starts right here. However, we will only discuss the basic methods of building track; building beautiful roadbeds, tunnels and bridges is left to your own exploration.",

    /* ---- 1. 轨道蓝图 ---- */
    "ch1.s1.b1.title": "1. Track Blueprint",
    "ch1.s1.b1.p1a": "The Track Blueprint",
    "ch1.s1.b1.p1b": " is the tool you use to build rails in IR; you can get it from the creative inventory. Holding the Track Blueprint and aiming at the ground shows a preview of the rail on the ground; right-click the ground to place a rail, and left-click a rail to break it. Rails cannot be placed in the air, on blocks with missing tops (like slabs), or on ice (but packed ice and blue ice are fine).",
    "ch1.s1.b1.p2": "While laying rails, any block in the way ahead of the rail will be broken; sand, gravel and similar blocks that fall onto rails become item drops, but snow can cover rails. Breaking the blocks underneath a rail will break the rail too (breaking just one or two is usually fine).",
    "ch1.s1.b1.p3": "In IR, without modifying the game config, you can place rails in 16 different directions, as shown below:",
    "ch1.s1.b1.p4": "Right-clicking the air with the Track Blueprint in hand opens the settings panel for configuring the rail's parameters. On the left are the parameters, on the right is the preview; changes on the left show up on the right in real time. Press ESC to close the panel. Next we will walk through the parameters on the left side.",

    /* ---- （1）轨道长度 ---- */
    "ch1.s1.b1.h4.1": "(1) Track Length",
    "ch1.s1.b1.h4.1p1a": "The first item on the left is the rail's length, in blocks (the unit we usually call “cells”). The default is 10 blocks. Length can be set from 1 to 1000 blocks, but it's not recommended to place more than 400 blocks at once, or you may experience lag.",
    "ch1.s1.b1.h4.1p1t": "And if you accidentally misclick a rail, a few hundred blocks of railway will vanish in an instant…",

    /* ---- （2）铁路轨距 ---- */
    "ch1.s1.b1.h4.2": "(2) Track Gauge",
    "ch1.s1.b1.h4.2p1a": "The gauge is the width of the rail. From wide to narrow, there are ",
    "ch1.s1.b1.h4.2p1b": "Brunel (broad), Standard, Narrow, Minecraft and Model",
    "ch1.s1.b1.h4.2p1c": " gauges. You should pick the gauge that matches the size of your rolling stock, otherwise the vehicle models will be scaled to the gauge and end up too large or too small. Most vehicles are standard gauge, so using standard gauge across the board is recommended.",
    "ch1.s1.b1.h4.2p2": "In particular, the Minecraft gauge is the size of vanilla minecart rails — only 1 block wide; the Model gauge is even smaller. The Minecraft and Model gauges are more for displaying locomotive models than for building real railways.",

    /* ---- （3）轨道类型 ---- */
    "ch1.s1.b1.h4.3": "(3) Track Type",
    "ch1.s1.b1.h4.3p1a": "The type option sets the kind of rail. There are ",
    "ch1.s1.b1.h4.3p1b": "straight, slope, curve, switch, turntable, traverser and custom curve",
    "ch1.s1.b1.h4.3p1c": " types in total. We will cover them in detail shortly, so no more here.",

    /* ---- （4）轨道样式 ---- */
    "ch1.s1.b1.h4.4": "(4) Track Style",
    "ch1.s1.b1.h4.4p1a": "The style option changes the appearance of the rail. IR ships with three styles by default: Default, Concrete Ties and Rails Only, as shown below. Beyond these, you can obtain more styles by installing add-on packs — we will leave that for later.",
    "ch1.s1.b1.h4.4p1t": "These style names are all in English… looks like IR forgot to translate them?",

    /* ---- （5）道床 ---- */
    "ch1.s1.b1.h4.5": "(5) Ballast",
    "ch1.s1.b1.h4.5p1a": "Ballast is a filling layer between the ground blocks and the rail, and is none by default. There are 93 kinds of ballast, such as cobblestone, concrete and planks. You can beautify your railway with ballast, but weaker computers should avoid using too much of it, or you may experience lag.",
    "ch1.s1.b1.h4.5p1t": "(In IR 1.10.0, ballast was translated as “rail foundation”)",

    /* ---- （6）道床填方 ---- */
    "ch1.s1.b1.h4.6": "(6) Ballast Fill",
    "ch1.s1.b1.h4.6p1": "You can use Ballast Fill to make construction easier. It is the block filled underneath the rail: once you set a block as ballast fill, rails placed where there is no block below will automatically have that block filled in first. However, ballast fill will not replace ice, half-slabs with missing tops, and other blocks that obstruct rail placement, so you must clear those obstacles manually beforehand. The image below shows the result of setting ballast fill to deepslate cobblestone and then placing a rail.",

    /* ---- （7）铁轨位置 ---- */
    "ch1.s1.b1.h4.7": "(7) Rail Position",
    "ch1.s1.b1.h4.7p1": "The “Position” parameter is a more advanced option that controls how the rail snaps to the blocks on the ground when placed. Its default is “Align to Blocks”. Generally speaking, you only need to know “Align to Blocks” and “Align to Pixels”. This is hard to explain — you will understand it once you try it yourself.",

    /* ---- （8）平交道口 ---- */
    "ch1.s1.b1.h4.8": "(8) Level Crossing",
    "ch1.s1.b1.h4.8p1": "Besides the buttons, there are two options at the bottom of the settings panel — “Place Blueprint” and “Set as Level Crossing” — which can be ticked with the mouse. “Place Blueprint” fits better later; here we focus on “Set as Level Crossing”. A level crossing is where a railway meets a road. If ballast fill is set, ticking “Set as Level Crossing” widens the ballast fill area by four blocks.",

    /* ---- 2. 铁路轨道类型 ---- */
    "ch1.s2.title": "2. Rail Track Types",
    "ch1.s2.p1": "IR has 7 types of rail: straight, slope, curve, switch, turntable, traverser and custom curve. Each has its own uses and special parameters — we will go through them one by one.",

    /* ---- （1）直行 ---- */
    "ch1.s2.b1.h4.1": "(1) Straight",
    "ch1.s2.b1.h4.1p1": "No explanation needed — it is just a straight railway, and you will use it all the time.",

    /* ---- （2）坡道 ---- */
    "ch1.s2.b1.h4.2": "(2) Slope",
    "ch1.s2.b1.h4.2p1a": "Slopes",
    "ch1.s2.b1.h4.2p1b": " are the ramps of the railway, used to raise the track height. Note that no matter how long the rail is, a single slope placed directly with the blueprint can only rise by 1 block; to climb higher, stack multiple slope segments. Also, do not make slopes too steep — they slow locomotives down, and a steep slope can even bring some locomotives (mainly steam ones) to 0 km/h mid-way, after which they slide back down to the bottom.",
    "ch1.s2.b1.h4.2p2a": "Besides regular parameters such as track length, slopes have an optional parameter called ",
    "ch1.s2.b1.h4.2p2b": "Vertical Smoothing",
    "ch1.s2.b1.h4.2p2c": ", which decides whether arcs are used to smoothly transition between the slope and level track. “Vertical Smoothing” has 4 states: “Smooth Both Ends”, “Smooth Near End Only”, “Smooth Far End Only” and “No Smoothing”, with “Smooth Both Ends” selected by default.",
    "ch1.s2.b1.h4.2p3": "With “Smooth Both Ends”, the slope is curved, and you can see smooth transitions at both ends where it joins level track.",
    "ch1.s2.b1.h4.2p4": "With “No Smoothing”, the slope is straight with no transitions to level track, as shown below.",
    "ch1.s2.b1.h4.2p5": "“Smooth Near End Only” and “Smooth Far End Only” keep the smooth transition at one end only, the other end staying straight. “Smooth Near End Only” smooths the end nearer the player while the far end has no smoothing; “Smooth Far End Only” is the opposite. In general, “Smooth Both Ends” is used most often, but the other three can come in handy sometimes.",

    /* ---- （3）圆弧 ---- */
    "ch1.s2.b1.h4.3": "(3) Curve",
    "ch1.s2.b1.h4.3p1a": "A curve",
    "ch1.s2.b1.h4.3p1b": " is a bend in the railway, where vehicles turn. For curves, ",
    "ch1.s2.b1.h4.3p1c": "the track length parameter determines the curve's radius",
    "ch1.s2.b1.h4.3p1d": "; curves also have three other parameters: ",
    "ch1.s2.b1.h4.3p1e": "Vertical Smoothing, Direction and Curve Angle",
    "ch1.s2.b1.h4.3p1f": ". Vertical smoothing is the same as for slopes, so we won't repeat it. As for why a flat curve even has a vertical smoothing option — that's because the Golden Spike can give curves a grade (see the “Golden Spike & Track Customization” section later).",
    "ch1.s2.b1.h4.3p2a": "1. Direction: ",
    "ch1.s2.b1.h4.3p2b": "“Direction” has three options: Unlocked (default), Lock Left and Lock Right. When you place a curve, it can bend two ways — toward your left hand or your right hand. With Unlocked, which way it bends mainly depends on which side of your crosshair is pointing; Lock Left always bends it left; Lock Right always bends it right.",
    "ch1.s2.b1.h4.3p3a": "2. Angle: ",
    "ch1.s2.b1.h4.3p3b": "Below the “Direction” button there is a slider used to set the curve's angle. The default is 90 degrees; 67.5, 45 and 22.5 degrees are also available (apparently more can be unlocked in the IR settings).",
    "ch1.s2.b1.h4.3p4": "When placing curves, it is recommended to build them large; avoid tiny, short curves, or some vehicles may get stuck while turning.",

    /* ---- （4）道岔 ---- */
    "ch1.s2.b1.h4.4": "(4) Switch (Turnout)",
    "ch1.s2.b1.h4.4p1a": "A switch",
    "ch1.s2.b1.h4.4p1b": " is where two railways meet; you can use it to join two sections of track and route vehicles from one line to the other. A switch consists of a “straight” part and a “diverging” part: the straight part is a straight rail and the diverging part is a curve. Either can be broken independently (break the curve part and the switch becomes a straight rail, and vice versa).",
    "ch1.s2.b1.h4.4p1t": "This is new in IR 1.11.0!",
    "ch1.s2.b1.h4.4p1c": " The switch's “track length” parameter controls the radius of the diverging curve.",
    "ch1.s2.b1.h4.4p2": "Like curves, switches also have Vertical Smoothing, Direction and Angle parameters governing the diverging curve — identical to what was covered above, so we won't repeat. Switches also have a “Curvature” parameter, but in practice its effect on switches is negligible, so we'll cover it later with the other rail type that has curvature.",
    "ch1.s2.b1.h4.4p3": "The switch state can be controlled by redstone. A switch defaults to straight, sending the locomotive straight ahead; on a redstone signal it switches to diverging and the locomotive takes the branch. Further research shows that redstone signals only work when applied near the first few blocks at the front of the switch.",
    "ch1.s2.b1.h4.4p4": "Besides redstone, IR's own “Switch Key” can control switches. Right-clicking a switch with the key cycles it through “Lock Straight”, “Lock Diverging” and “Unlocked”. Lock Straight keeps the branch closed; Lock Diverging keeps it open — neither responds to redstone. Unlocked closes any open branch and restores redstone control.",

    /* ---- （5）转车台 ---- */
    "ch1.s2.b1.h4.5": "(5) Turntable",
    "ch1.s2.b1.h4.5p1": "A turntable is a large device for rotating vehicles; you can use it to turn a locomotive to any of 16 directions, enabling turning trains around. Its radius is determined by the “track length” parameter.",
    "ch1.s2.b1.h4.5p2a": "It is worth noting that, unlike ordinary rails, ",
    "ch1.s2.b1.h4.5p2b": "the turntable is one block high",
    "ch1.s2.b1.h4.5p2c": ", so it is highly recommended to give it a ballast block (in the image below, the turntable's ballast is deepslate cobblestone); otherwise the turntable will look like a rail floating in mid-air.",
    "ch1.s2.b1.h4.5p3": "After driving a vehicle onto the turntable's rail (the turntable track), right-click a position on the turntable with a Large Wrench to rotate the loaded rail toward the rail closest to that position.",

    /* ---- （6）移车台 ---- */
    "ch1.s2.b1.h4.6": "(6) Traverser",
    "ch1.s2.b1.h4.6p1": "The traverser is a device new in IR 1.11.0 that moves rolling stock sideways from one track to another. Like the turntable, it is one block high, so ballast is strongly recommended. It is used the same way as the turntable — right-click the corresponding track with a Large Wrench to shift the vehicle across.",
    "ch1.s2.b1.h4.6p2a": "Besides the “track length” parameter controlling its length, the traverser has a couple more parameters: ",
    "ch1.s2.b1.h4.6p2b": "Traverser Track Count",
    "ch1.s2.b1.h4.6p2c": " and ",
    "ch1.s2.b1.h4.6p2d": "Traverser Track Spacing",
    "ch1.s2.b1.h4.6p2e": " (in blocks). These determine how many tracks the traverser carries and how far apart they are, as shown below.",

    /* ---- （7）自定义曲线 ---- */
    "ch1.s2.b1.h4.7": "(7) Custom Curve",
    "ch1.s2.b1.h4.7p1": "We will cover this in the next section, “Golden Spike & Track Customization”.",

    /* ---- 3. 金道钉与铁路自定义 ---- */
    "ch1.s3.title": "3. Golden Spike & Track Customization",

    /* ---- （1）金道钉 ---- */
    "ch1.s3.b1.h4.1": "(1) Golden Spike",
    "ch1.s3.b1.h4.1p1a": "All the methods above require setting the parameters in the Track Blueprint first, then placing the rail on the ground. In practice, though, you often can't know which parameters are right — measuring the ideal length and angles before building would be far too much trouble",
    "ch1.s3.b1.h4.1p1t": " (true, but still)",
    "ch1.s3.b1.h4.1p1b": "; besides, the railway you want may be irregular, and assembling it from the regular curves and slopes in the settings panel is extremely complex and may not even look good.",
    "ch1.s3.b1.h4.1p2": "To handle this, IR provides a tool called the “Golden Spike” that lets you adjust rails directly to the actual situation. To use it, tick “Place Blueprint” in the Track Blueprint, then right-click with the blueprint at the starting point of the rail — this places a Golden Spike and a preview rail on the ground. Right-click the Golden Spike on the ground with a Golden Spike in hand; if you hear a crisp metallic clink, your spike has successfully bound to the preview rail and you can proceed.",
    "ch1.s3.b1.h4.1p3a": "With a bound Golden Spike, right-click where you want the rail to extend to, and the spike will ",
    "ch1.s3.b1.h4.1p3b": "automatically adjust the rail's length",
    "ch1.s3.b1.h4.1p3c": " to reach that spot as best it can. Note that if the rail type is “Straight”, “Curve” or “Slope”, the rail's inherent direction (or curvature) will not change — it won't bend toward the block you right-clicked, as shown below.",
    "ch1.s3.b1.h4.1p4a": "Besides changing length, ",
    "ch1.s3.b1.h4.1p4b": "the Golden Spike can also give curves and switches a grade",
    "ch1.s3.b1.h4.1p4c": ", and can raise slopes beyond 1 block, as shown below. Right-clicking the air with the Golden Spike reopens the rail's settings panel (the same one as the Track Blueprint's) so you can re-adjust the type, style, length and other parameters. To bind a different preview rail, simply right-click its Golden Spike — the previous binding is released automatically.",
    "ch1.s3.b1.h4.1p5": "Once your railway is designed, hold SHIFT and left-click the Golden Spike at the preview's starting position to place the finished rail. And just like that, a new railway line is built.",
    "ch1.s3.b1.h4.1p6": "However, while the Golden Spike can flexibly adjust straight, curve and slope rails to the situation, those adjustments are limited — they cannot break the inherent limits of slopes, curves and straight rails. For complex, irregular lines, assembling regular curves and slopes is clearly a hassle. That's when we turn to an irregular rail type for designing lines — the Custom Curve. The Custom Curve is IR's ace tool for designing railway lines; it must be used with the Golden Spike while “Place Blueprint” is ticked.",
    "ch1.s3.b1.h4.1p7a": "Custom Curves have no shape limits like curves and slopes; they can change flexibly and extend the railway directly to the block you clicked with the Golden Spike. Once the start and end points are set, the slopes, straights and curves in between are generated automatically. As a result, Custom Curves can even replace straight, curve and slope types entirely",
    "ch1.s3.b1.h4.1p7t": " (provided you use them well)",
    "ch1.s3.b1.h4.1p7b": ", as shown below. Feel free to explore custom curves and how to fine-tune them yourself.",
    "ch1.s3.b1.h4.1p8a": "Custom Curve Curvature ",
    "ch1.s3.b1.h4.1p8b": "In the Custom Curve blueprint there is a “Curvature” slider that determines how much the custom curve bends. Curvature ranges from 0.25 to 1.50 — the smaller the value, the less it bends, as shown below. The default is 1.00; normally you don't need to change it, but you can fine-tune your railway by adjusting it.",

    /* ---- （2）轨道样式更换器 ---- */
    "ch1.s3.b1.h4.2": "(2) Track Style Changer",
    "ch1.s3.b1.h4.2p1": "If you want to restyle rails that are already built without tearing them down, use IR's “Track Style Changer” tool to modify the style of rails on the ground directly.",
    "ch1.s3.b1.h4.2p2a": "Right-clicking the air with the Track Style Changer opens its settings panel, where you can set three parameters: “Track Style”, “Ballast Type” and “Gauge”. After configuring, right-click rails on the ground with the tool to change that section to the chosen style.",
    "ch1.s3.b1.h4.2p2t": "The Track Style Changer still uses the UI from a very old IR version — maybe the author forgot to update it",

    /* ---- 表格：铁轨位置 ---- */
    "ch1.t1.th1": "Type",
    "ch1.t1.th2": "Effect",
    "ch1.t1.r1c1": "Align to Blocks",
    "ch1.t1.r1c2": "The default style; rails align with ground blocks when placed, most tidy.",
    "ch1.t1.r2c1": "Align to Pixels / Unrestricted",
    "ch1.t1.r2c2": "Both basically let you place freely; the difference is minor, the latter just being smoother.",
    "ch1.t1.r3c1": "Pixel Lock / Smooth Lock",
    "ch1.t1.r3c2": "Free placement back-and-forth, but follows “Align to Blocks” side-to-side. Again, the difference is minor; the latter is just smoother.",

    /* ---- 表格：垂直平滑 ---- */
    "ch1.t2.th1": "Type",
    "ch1.t2.th2": "Effect",
    "ch1.t2.r1c1": "Smooth Both Ends",
    "ch1.t2.r1c2": "Both ends transition smoothly to level track, forming an S-shaped arc.",
    "ch1.t2.r2c1": "Smooth Near End Only",
    "ch1.t2.r2c2": "The end near the player is smooth; the far end stays straight.",
    "ch1.t2.r3c1": "Smooth Far End Only",
    "ch1.t2.r3c2": "The far end is smooth; the end near the player stays straight.",
    "ch1.t2.r4c1": "Pixel Lock / Smooth Lock",
    "ch1.t2.r4c2": "Straight throughout, with no transition arc where it meets level track.",

    /* ---- 表格：版本信息 ---- */
    "ch1.t3.th1": "Component",
    "ch1.t3.th2": "Version / File Name",
    "ch1.t3.r1c1": "Minecraft Version",
    "ch1.t3.r2c1": "Forge Version",
    "ch1.t3.r3c1": "Immersive Railroading",
    "ch1.t3.r4c1": "Track API",
    "ch1.t3.r5c1": "Universal Mod Core",

    /* ---- 第一章结尾与附录 ---- */
    "ch1.ending": "That concludes this chapter. Once you master it, you will be able to lay the most basic routes for your rolling stock. In the next chapter we will discuss how to drive railway locomotives.",
    "ch1.appendix.title": "Appendix",
    "ch1.appendix.p1": "This tutorial was first written in 2024 and published on the MC百科 wiki and Bilibili, based on Minecraft 1.12.2 and IR 1.10.0. IR has since updated to 1.11.0, which not only supports newer Minecraft versions more stably, but also has much better Chinese translations and adjusted mechanics — so parts of the old guide were outdated. The author took this chance to revise it, added new content, and compiled this new edition in the hope that it will be more helpful to everyone.",
    "ch1.appendix.p2": "This tutorial is licensed under CC BY-NC-SA. All images, text and lists in this article are original creations of the author alone.",
    "ch1.appendix.p3": "The Minecraft version, Forge version and related mods used in this tutorial are as follows:",
    "ch1.appendix.p4": "※ Track API and Universal Mod Core are prerequisite mods for Immersive Railroading; without them IR will not run.",

    /* ======================================================
       第二章 · 机车驾驶
       ====================================================== */
    "ch2.title": "Chapter 2 · Locomotive Operation",
    "ch2.s1.title": "Chapter 2 · Locomotive Operation",
    "ch2.s1.p1": "In the previous chapter you learned how to lay rails and build a railway; in this chapter we'll learn how to drive and use various locomotives. IR features a realistic driving system simplified from real locomotives (one of its hallmarks), and that is the focus of this chapter.",

    /* ---- 1. 如何开始 ---- */
    "ch2.s1.b1.title": "1. Getting Started",

    /* ---- （1）修改键位 ---- */
    "ch2.s1.b1.h4.1": "(1) Change Key Bindings",
    "ch2.s1.b1.h4.1p1a": "IR controls locomotives with the numpad keys by default. If your computer has no numpad, you need to change the key bindings in the MC settings first ",
    "ch2.s1.b1.h4.1p1t": "or just buy a separate numpad",
    "ch2.s1.b1.h4.1p1b": " to continue. (The interactive controls added in IR 1.10.0 are covered in a dedicated section later.)",
    "ch2.s1.b1.h4.1p2a": "Throttle",
    "ch2.s1.b1.h4.1p2b": ", ",
    "ch2.s1.b1.h4.1p2c": "Independent Brake",
    "ch2.s1.b1.h4.1p2d": ", ",
    "ch2.s1.b1.h4.1p2e": "Train Brake",
    "ch2.s1.b1.h4.1p2f": " and ",
    "ch2.s1.b1.h4.1p2g": "Engine Start/Stop",
    "ch2.s1.b1.h4.1p2h": " are the core of the locomotive control system — be sure to bind keys for them. ",
    "ch2.s1.b1.h4.1p2i": "The Reverser",
    "ch2.s1.b1.h4.1p2j": " is also core, but it can be driven along with the throttle, so a dedicated key is optional. ",
    "ch2.s1.b1.h4.1p2k": "Deadman Switch",
    "ch2.s1.b1.h4.1p2l": ", ",
    "ch2.s1.b1.h4.1p2m": "Bell",
    "ch2.s1.b1.h4.1p2n": ", ",
    "ch2.s1.b1.h4.1p2o": "Horn",
    "ch2.s1.b1.h4.1p2p": ", ",
    "ch2.s1.b1.h4.1p2q": "Config Menu",
    "ch2.s1.b1.h4.1p2r": " and similar options can be skipped if you're short on keys. (Of course, having them makes for a richer experience.)",

    /* ---- （2）放置机车 ---- */
    "ch2.s1.b1.h4.2": "(2) Placing Locomotives",
    "ch2.s1.b1.h4.2p1a": "In IR, vehicles are divided into ",
    "ch2.s1.b1.h4.2p1b": "locomotives",
    "ch2.s1.b1.h4.2p1c": " (the engines that pull other cars), ",
    "ch2.s1.b1.h4.2p1d": "passenger cars",
    "ch2.s1.b1.h4.2p1e": " and ",
    "ch2.s1.b1.h4.2p1f": "freight cars",
    "ch2.s1.b1.h4.2p1g": ". Locomotives provide power, while the other cars carry passengers and cargo. IR comes with many locomotives — steam, diesel, handcars and more — which you can find in the creative inventory. Hovering the mouse cursor over a locomotive shows its details, including gauge and maximum speed.",
    "ch2.s1.b1.h4.2p2": "Right-click a rail while holding a locomotive to place it; SHIFT + left-click the locomotive to pick it back up. You should match the locomotive to the rail's gauge, or the model will be scaled to the gauge and end up too large or too small. (This tutorial uses standard-gauge locomotives throughout.)",
    "ch2.s1.b1.h4.2p3": "Right-click a locomotive to board it; press SHIFT to disembark. IR vehicles are climbable, so you can also ride on the roof (with noticeable rocking). Once aboard, you can move around inside, operate some of the interior components, and see the locomotive's control panel. Different locomotives have different control panels and starting methods, which we will introduce one by one.",

    /* ---- 2. 蒸汽机车 ---- */
    "ch2.s2.title": "2. Steam Locomotives",

    /* ---- （1）基本参数 ---- */
    "ch2.s2.b1.h4.1": "(1) Basic Parameters",
    "ch2.s2.b1.h4.1p1": "After boarding a steam locomotive, you'll see a control panel in the lower-left corner of the screen: the top shows speed, the left shows water level, boiler temperature and such, and the right shows the state of the driving and braking systems.",
    "ch2.s2.b1.h4.1p2a": "The three bars on the left are, from left to right, ",
    "ch2.s2.b1.h4.1p2b": "Water, Steam Pressure and Boiler Temperature",
    "ch2.s2.b1.h4.1p2c": ". There is a number above and below each bar: ",
    "ch2.s2.b1.h4.1p2d": "the bottom number is the maximum value",
    "ch2.s2.b1.h4.1p2e": " (except boiler temperature, which can go a bit above 100°C, as explained later), while ",
    "ch2.s2.b1.h4.1p2f": "the top number is the current value",
    "ch2.s2.b1.h4.1p2g": ". For example, the number below the water bar (26.0B) means this locomotive can hold 26 buckets of water, and the number above (12.0B) means 12 buckets are currently loaded.",
    "ch2.s2.b1.h4.1p3a": "Water, boiler temperature and steam pressure are the three basic parameters of a steam locomotive. Steam locomotives run by burning fuel to heat water and generate steam pressure — ",
    "ch2.s2.b1.h4.1p3b": "running consumes steam pressure",
    "ch2.s2.b1.h4.1p3c": " (and of course fuel and water too). So to start the locomotive you need to add fuel and water to produce pressure. Right-clicking anywhere while aboard (or SHIFT + right-click from the ground) opens the steam locomotive's GUI, where you can add water and fuel; changes appear live in the corner bars. Press ESC to exit.",
    "ch2.s2.b1.h4.1p4": "Anything usable as fuel in a vanilla furnace (wooden tools, coal, planks, lava buckets, etc.) works as steam locomotive fuel, though coal or coal blocks are recommended since planks burn out quickly. If you have Immersive Engineering installed, you can also burn its “coke (block)”, which burns twice as long as vanilla coal (blocks).",

    /* ---- （2）启动蒸汽机车 ---- */
    "ch2.s2.b1.h4.2": "(2) Starting a Steam Locomotive",
    "ch2.s2.b1.h4.2p1a": "The first way to start a steam locomotive is ",
    "ch2.s2.b1.h4.2p1b": "normal start",
    "ch2.s2.b1.h4.2p1c": " — slower, but simple and foolproof. Add water to above 50% ",
    "ch2.s2.b1.h4.2p1d": "(don't add too much at the start — more water means slower pressure build-up)",
    "ch2.s2.b1.h4.2p1e": ", then add fuel. As the fuel burns, the boiler temperature rises; once it hits 100°C, steam pressure starts building. When the pressure is high enough, top up the water and fuel, and the locomotive is ready to drive.",
    "ch2.s2.b1.h4.2p2": "Actually, any steam pressure is enough to drive — you don't have to fill it to max. But driving consumes pressure: if you didn't add enough fuel (didn't fill all slots), the pressure produced can be less than the pressure consumed, and the pressure will slowly drop; when it hits zero, the locomotive can't be driven anymore. Once pressure is full, the locomotive automatically opens its relief valve to vent excess steam, so it won't rise further.",
    "ch2.s2.b1.h4.2p3a": "The second way is ",
    "ch2.s2.b1.h4.2p3b": "fast start",
    "ch2.s2.b1.h4.2p3c": " — much quicker, but more skillful. Add a little water (2–3 buckets), then plenty of fuel. Less water means faster heating, so the boiler hits 100°C far sooner. When the boiler reaches 100°C, pressure starts to skyrocket; at that point you ",
    "ch2.s2.b1.h4.2p3d": "must quickly add water to above 25% before the pressure fills up",
    "ch2.s2.b1.h4.2p3e": ", then gradually top it off. If the water is still below 25% when the pressure maxes out, the water is consumed rapidly, pressure and boiler temperature reset, and you have to start all over.",
    "ch2.s2.b1.h4.2p4a": "A normal start takes several minutes, while a fast start usually gets the locomotive going within a minute. But not every locomotive supports fast start — some have huge boilers (the built-in “Big Boy”, for example, holds a whopping 95 buckets of water), making it very hard to push water above 25% in the brief window of rapid pressure rise; for these, fast start fails quite often. If you fail to get water above 25% before the pressure fills, then keep frantically adding water while it's being guzzled down — keeping the level below 25% but never at 0 — the boiler temperature keeps climbing past 100°C and eventually the locomotive ",
    "ch2.s2.b1.h4.2p4b": "explodes",
    "ch2.s2.b1.h4.2p4c": " (it destroys blocks, with a blast far stronger than vanilla TNT).",
    "ch2.s2.b1.h4.2p4t": "Compared to steam locomotives, diesels are much safer~",
    "ch2.s2.b1.h4.2p5a": "(No need to panic about explosions either: as long as you get water above 25% before the pressure maxes out, you're fine; if the water is still below 25% when it maxes out, just stop adding water and let it burn off — the water runs out far sooner than the boiler takes to explode.)",
    "ch2.s2.b1.h4.2p5t": "In years of playing IR, I've blown up a steam locomotive only once",
    "ch2.s2.b1.h4.2p6": "When a steam locomotive runs out of fuel or water, any remaining steam pressure slowly drains on its own; you can still drive for a while (driving accelerates the drain).",

    /* ---- （3）连接煤水车 ---- */
    "ch2.s2.b1.h4.3": "(3) Coupling a Tender",
    "ch2.s2.b1.h4.3p1a": "A steam locomotive can haul a ",
    "ch2.s2.b1.h4.3p1b": "tender",
    "ch2.s2.b1.h4.3p1c": " behind it to supply water and fuel (even though IR steam locomotives already carry enough to run for a long time). Tenders are found in the “Immersive Railroading | Freight Cars” tab of the creative inventory. Different locomotives have different tenders, but tenders are interchangeable between locomotives.",
    "ch2.s2.b1.h4.3p2": "A tender can be placed directly, or held and right-clicked onto the track behind a locomotive — it will then couple automatically (you'll hear a clunk). If it doesn't couple, back the locomotive into the tender; the clunk means success. There's a slight IR quirk: occasionally backing into a tender just passes right through it as if it were air — just try repositioning the tender and locomotive. Coupling is the subject of the next chapter; see it for marshalling details.",
    "ch2.s2.b1.h4.3p3": "Right-clicking anywhere aboard the tender (or SHIFT + right-click from the ground) opens its GUI, which is similar to the steam locomotive's — water on top, fuel below. Once water and fuel are added, a coupled tender automatically transfers them to the locomotive until the locomotive's tanks are full.",
    "ch2.s2.b1.h4.3p4a": "If any other vehicle is coupled between the tender and the locomotive, the tender can no longer supply the locomotive; but if it's another tender in between, supply still works.",
    "ch2.s2.b1.h4.3p4t": "By that logic you can keep nesting — one locomotive with dozens of tenders, infinite fuel and water~",
    "ch2.s2.b1.h4.3p5a": "Note: although tenders supply fuel and water, ",
    "ch2.s2.b1.h4.3p5b": "the tender's own weight slows the steam locomotive's acceleration",
    "ch2.s2.b1.h4.3p5c": " (and the more water and fuel inside, the heavier it gets), so more tenders is not better — one is usually enough.",

    /* ---- 3. 内燃机车 ---- */
    "ch2.s3.title": "3. Diesel Locomotives",
    "ch2.s3.p1a": "The diesel locomotive also has a control panel in the lower-left, showing ",
    "ch2.s3.p1b": "speed, fuel level and engine temperature",
    "ch2.s3.p1c": ", among other things. Right-clicking anywhere aboard (or SHIFT + right-click from the ground) opens the diesel's GUI, where you refuel it.",
    "ch2.s3.p2a": "Diesels run on liquid fuel such as ",
    "ch2.s3.p2b": "diesel",
    "ch2.s3.p2c": ", which comes from the Immersive Engineering mod (or its add-on Immersive Petroleum). It's therefore recommended to install Immersive Engineering alongside IR; otherwise, without editing config files, you cannot start or drive diesels, nor craft liquid fuel in survival.",
    "ch2.s3.p2t": "Yes, IR lets you build and play in survival! But you need Immersive Engineering",
    "ch2.s3.p3": "After refueling, press the “Engine Start/Stop” key you bound earlier to start the engine; its temperature begins to rise. Once it reaches 75°C, the diesel is started — you can drive. Diesels burn fuel slowly, and fuel amount doesn't affect starting speed, so there's no limit on refueling — you can even add just one bucket (filling it all the way is fine too).",
    "ch2.s3.p4": "After refueling and starting, the engine temperature rises on its own, but very slowly. To start quickly, pull up the throttle (the locomotive's accelerator); this greatly speeds up engine heating. However, the throttle is then open, so the locomotive starts moving forward on its own; if you only want to start it without moving, apply the brakes. We're about to get to the driving and braking systems.",

    /* ---- 4. 机车驾驶 ---- */
    "ch2.s4.title": "4. Driving the Locomotive",
    "ch2.s4.p1a": "Once the locomotive is started, you can drive it. IR's driving can be split into two parts: the ",
    "ch2.s4.p1b": "driving system",
    "ch2.s4.p1c": " (throttle and reverser) that moves the train, and the ",
    "ch2.s4.p1d": "braking system",
    "ch2.s4.p1e": " (air brake and independent brake) that stops it.",

    /* ---- （1）驾驶系统：节流阀和换向器 ---- */
    "ch2.s4.b1.h4.1": "(1) The Driving System: Throttle and Reverser",
    "ch2.s4.b1.h4.1p1": "In the driving system section of the control panel you'll find two sliders: one sits in the middle of the track by default, protruding right; the other sits at the bottom, protruding left. The middle one is the reverser; the bottom one is the throttle.",
    "ch2.s4.b1.h4.1p2a": "The reverser",
    "ch2.s4.b1.h4.1p2b": " controls the direction of travel. It has three positions — “Forward”, “Off” and “Reverse” — corresponding to the top, middle and bottom of the slider, defaulting to “Off” (the reverser knob sits in the middle). Use the “Reverser Forward”, “Reverser Backward” and “Reverser Center” keys to move it and change direction.",
    "ch2.s4.b1.h4.1p2t": "The reverser was displayed as “Reverser” in IR 1.10.0; the Chinese translation was added in IR 1.11.0",
    "ch2.s4.b1.h4.1p3a": "The throttle",
    "ch2.s4.b1.h4.1p3b": " is the locomotive's “gas pedal”, controlling acceleration and deceleration. It defaults to the very bottom of the slider, meaning closed. Use “Throttle Up” and “Throttle Down” to raise or lower it: more throttle means more power and faster acceleration; less means less. “Throttle Reset” snaps it back to zero (closed), and the locomotive stops providing power.",
    "ch2.s4.b1.h4.1p4": "The throttle and reverser must work together — power is only provided when both are engaged.",
    "ch2.s4.b1.h4.1p5a": "Note: ",
    "ch2.s4.b1.h4.1p5b": "Perhaps because controlling both throttle and reverser is troublesome, the IR author designed two driving modes — ",
    "ch2.s4.b1.h4.1p5c": "Independent Mode and Linked Mode",
    "ch2.s4.b1.h4.1p5d": " (names are mine), switchable in the IR settings (config → Immersion Level → Disable Independent Throttle; true = Linked Mode, false = Independent Mode), ",
    "ch2.s4.b1.h4.1p5e": "and Linked Mode is the default.",
    "ch2.s4.b1.h4.1li1a": "Independent Mode",
    "ch2.s4.b1.h4.1li1b": ": the throttle and reverser are unrelated, each controlled by its own keys; increasing/decreasing the throttle is exactly that, unaffected by the reverser. This mode is simpler to understand (though linked mode isn't hard either) and more “immersive” (realistic), but managing two controls is less convenient and needs more key bindings.",
    "ch2.s4.b1.h4.1li2a": "Linked Mode",
    "ch2.s4.b1.h4.1li2b": ": the throttle and reverser interact — ",
    "ch2.s4.b1.h4.1li2c": "IR disables the reverser keys (pressing them does nothing); only the throttle drives the reverser.",
    "ch2.s4.b1.h4.1li2d": " In linked mode: ① pressing “Throttle Reset” switches both the throttle and reverser to off; ② with the reverser in forward, “Throttle Up” raises the throttle and “Throttle Down” lowers it; lowering it to the minimum and pressing “Throttle Down” again auto-switches the reverser to reverse; ③ with the reverser in reverse, “Throttle Down” actually raises the throttle and “Throttle Up” lowers it; lowering it to the minimum and pressing “Throttle Up” again auto-switches the reverser back to forward.",
    "ch2.s4.b1.h4.1p6": "This may be a bit hard to follow in words, but it's actually very simple in practice — be sure to try it in MC yourself; a hands-on test makes it click. In my opinion, Linked Mode is more convenient than Independent Mode.",

    /* ---- （2）驾驶机车的注意事项 ---- */
    "ch2.s4.b1.h4.2": "(2) Driving Tips & Precautions",
    "ch2.s4.b1.h4.2p1a": "1. Steam pressure: ",
    "ch2.s4.b1.h4.2p1b": "When driving a steam locomotive, a wider throttle drains pressure faster. Generally, if every fuel slot is filled, the locomotive produces pressure roughly at or above the rate a full throttle consumes it. With the throttle maxed, some locomotives only lose pressure very slowly, and some even gain it — so as long as fuel is sufficient and water stays above 25%, you can keep the throttle pinned.",
    "ch2.s4.b1.h4.2p2a": "2. Engine overheating: ",
    "ch2.s4.b1.h4.2p2b": "In diesels, a wider throttle heats the engine faster. The temperature bar turns red at 140°C, and ",
    "ch2.s4.b1.h4.2p2c": "at 150°C the engine stalls from overheating",
    "ch2.s4.b1.h4.2p2d": " (it shuts off automatically); the locomotive loses power, the throttle and reverser stop working, and you can't restart immediately. Only when the engine cools below 100°C can you restart with “Engine Start/Stop”, so ",
    "ch2.s4.b1.h4.2p2e": "always watch the engine temperature in diesels",
    "ch2.s4.b1.h4.2p2f": " — don't let it overheat.",
    "ch2.s4.b1.h4.2p3": "As long as the engine is on and the throttle is open, the engine temperature rises — regardless of brakes or reverser position.",
    "ch2.s4.b1.h4.2p4a": "3. Cooling the engine: ",
    "ch2.s4.b1.h4.2p4b": "Two methods. First, stop accelerating — reset the throttle (if the engine already stalled, resetting isn't required) — the temperature gradually falls (slower below 100°C, stops falling below 75°C). Second, shut the engine off directly; the temperature drops faster than the throttle-reset method, but if it falls below 75°C you'll have to start the engine again.",
    "ch2.s4.b1.h4.2p5a": "4. Weather affects speed: ",
    "ch2.s4.b1.h4.2p5b": "Weather affects acceleration. In rain/thunderstorms, acceleration is noticeably worse than in clear weather. Breaking blocks also slows the train. When it snows, snow layers pile up on the track but don't affect speed — the weather (snowfall) itself does.",

    /* ---- （3）制动系统 ---- */
    "ch2.s4.b1.h4.3": "(3) The Braking System: Independent Brake and Air Brake",
    "ch2.s4.b1.h4.3p1a": "The braking system is the railway vehicle's brake system",
    "ch2.s4.b1.h4.3p1b": " (“kinetic energy control”), used to slow vehicles down. Modeled on real railway brakes, IR's system has two types: the independent brake, which directly brakes the locomotive's own wheels; and the air brake, which brakes the entire train — every car's wheels (in reality, via compressed air). Without trailing cars the two perform nearly identically; with cars coupled, the air brake slows noticeably better than the independent brake, and using both together is about the same as the air brake alone. (Results from MC testing below.)",
    "ch2.s4.b1.h4.3p2a": "Note: the “air brake” is called the “train brake” in IR 1.11.0; they're the same thing. For clarity, we keep using the term “air brake”.",
    "ch2.s4.b1.h4.3p2t": "The air brake is just one mode of train braking; IR currently only has the air brake. Maybe future versions will add dynamic braking and more?",
    "ch2.s4.b1.h4.3p3": "The brakes work at any time, regardless of whether the engine is running. In the braking section of the panel you'll see two sliders at the bottom (partially overlapping, so they look like one): the one protruding left is the air brake; the one protruding right is the independent brake. Both are simple to use — press the corresponding increase/decrease keys to adjust; the harder you brake, the faster the locomotive slows.",
    "ch2.s4.b1.h4.3p4a": "The more cars coupled, the worse the independent brake performs, so trains with many cars are generally braked with the air brake",
    "ch2.s4.b1.h4.3p4t": " (that's how it is in real life too)",
    "ch2.s4.b1.h4.3p4b": " — though I haven't verified this in IR specifically. Also, when you pull the air brake lever, a darker button rises a bit slower than the white one (see below): that's the “actual” air brake, because it takes time for the compressed air to reach every car. The “actual” air brake trails the lever, eventually catching up to the same level; more cars mean it lags longer.",
    "ch2.s4.b1.h4.3p4t2": "I've tested this — IR is remarkably realistic!",
    "ch2.s4.b1.h4.3p5a": "Other uses of the brakes: ",
    "ch2.s4.b1.h4.3p5b": "① Prevent rollaways. IR simulates real physics: speed increases downhill and decreases uphill, so to park on a grade you must apply the brakes, or the train will roll off on its own. ② Starting diesels. As mentioned, quick diesel starts need the throttle up, which makes the train move as soon as it starts; apply the brakes beforehand to keep it put.",
    "ch2.s4.b1.h4.3p6a": "Braking trick: ",
    "ch2.s4.b1.h4.3p6b": "Besides the brakes, you can brake by “throwing the throttle against the direction of travel” — set the throttle and reverser opposite to the current direction so the locomotive applies “power” backwards; this slows it down, and works great on powerful locomotives (sometimes even better than the brakes). Combining this trick with the brakes stops the train faster, but it consumes steam pressure/fuel.",
    "ch2.s4.b1.h4.3p6t": "In real life you'd never do this except as a last resort — it damages the locomotive!",

    /* ---- （4）其他功能 ---- */
    "ch2.s4.b1.h4.4": "(4) Other Features (Horn, Bell, Deadman Switch)",
    "ch2.s4.b1.h4.4p1a": "Horn",
    "ch2.s4.b1.h4.4p1b": ": pressing the horn key sounds the locomotive's whistle or air horn; the duration depends on how long you hold the key. Handcars can't honk; steam locomotives can only honk with steam pressure; diesels can honk as soon as the engine is started (no need to wait for 75°C).",
    "ch2.s4.b1.h4.4p2a": "The whistle/horn sound depends on the locomotive. All stock IR locomotives ",
    "ch2.s4.b1.h4.4p2t": "(the handcar isn't a locomotive, right?)",
    "ch2.s4.b1.h4.4p2b": "can honk, but some third-party locomotive packs (how to add third-party packs is covered later) may have no horn sounds. Some locomotives loop the horn (honk indefinitely); others cap its length — hold the button long enough and the sound simply ends.",
    "ch2.s4.b1.h4.4p3a": "Bell",
    "ch2.s4.b1.h4.4p3b": ": pressing the bell key starts a looping “clang-clang” (the sound depends on the locomotive); press again to stop. Except for handcars, any locomotive can ring its bell at any time, no need to start the engine.",
    "ch2.s4.b1.h4.4p4a": "Deadman switch",
    "ch2.s4.b1.h4.4p4b": ": decides whether “deadman protection”",
    "ch2.s4.b1.h4.4p4t": " (I came up with the name)",
    "ch2.s4.b1.h4.4p4c": " is enabled for a locomotive. It defaults to off; pressing the key toggles it, and the current state appears in chat. When enabled, if the player leaves the locomotive, it automatically applies full air brake (independent brake unchanged), cuts the throttle to minimum (reverser unchanged), forcing it to stop. When disabled (default), if you accidentally hit SHIFT and dismount while driving, the unmanned locomotive keeps going as-is — and then you have to catch it",
    "ch2.s4.b1.h4.4p4t2": " (a real-life “Unstoppable” moment — time to play hero)",
    "ch2.s4.b1.h4.4p4d": ", because IR locomotives keep running through unloaded chunks, getting farther and farther away. If it's too fast to catch, your only options are /tp or destroying the track.",
    "ch2.s4.b1.h4.4p5": "The deadman switch keeps things safe (chasing trains is painful), but in a single-player world, if you want to hop off and film your moving train, turn it off (and keep the speed catchable — under 50 km/h is advisable). Also, the switch applies per-locomotive, not globally — enabling it on one doesn't enable it on others.",

    /* ---- 5. 手摇车 ---- */
    "ch2.s5.title": "5. Handcars",
    "ch2.s5.p1": "The handcar is IR's most primitive powered vehicle — a “manpowered railway car”, as shown.",
    "ch2.s5.p2a": "The handcar tops out at 20 km/h and has no GUI for adding fuel etc.",
    "ch2.s5.p2t": " (duh)",
    "ch2.s5.p2b": " — its panel has only speed plus the independent brake and throttle sliders. It can't honk or ring a bell, and its tractive effort is so weak it can barely pull anything but itself. It has no reverser; the throttle doubles as the reverser, with only Forward, Off and Reverse — pick a position and it goes that way. Its power comes from the player: no fuel or water needed; it runs on the player's hunger (in survival), and stops accelerating the moment you dismount. (The handcar supports the deadman switch, but it has no effect.)",

    /* ---- 6. 互动驾驶 ---- */
    "ch2.s6.title": "6. Interactive Controls",
    "ch2.s6.p1a": "Interactive controls",
    "ch2.s6.p1b": " are a feature new in IR 1.10.0 and a hallmark of IR: they let you operate the levers, buttons and other parts on the locomotive model directly — starting/stopping the engine, adjusting the throttle/reverser and brakes, and more — for a truly “immersive” driving experience. They're also highly extensible, covering many things keys can't (like toggling headlights and wipers). Not every locomotive supports them though — some authors don't model interactive parts, so those can only be driven by keyboard. A good portion of IR's stock locomotives support interactive controls; we'll use the SW1500 diesel as an example.",
    "ch2.s6.p2": "After boarding, move the crosshair near an interactive part (buttons, levers on the control stand); IR shows the name of the nearest part.",
    "ch2.s6.p3": "IR 1.11.0 has localized every part into Chinese, so they're all self-explanatory and need no introduction; but since some players may still be on IR 1.10.0, and third-party packs may still contain English parts, here's a bilingual table explaining what each English name corresponds to.",
    "ch2.s6.p4a": "Note: ",
    "ch2.s6.p4b": "Interactive part names may differ between locomotives (authors can customize them), though they mostly follow this pattern. Likewise, not every locomotive has all the buttons above — the SW1500, for instance, has no engine start button",
    "ch2.s6.p4t": " (maybe the IR author forgot to add it)",
    "ch2.s6.p4c": " and can only be started from the keyboard.",
    "ch2.s6.p5": "To operate a part, aim the crosshair at it and left-click. IR has two kinds of interactive parts — levers and buttons — each with its own control method.",
    "ch2.s6.li1a": "Levers",
    "ch2.s6.li1b": ": aim at the lever and hold the left mouse button; IR highlights its name and hides the others. While selected, drag the crosshair in the desired direction to pull the lever; the result shows in the lower-left control panel. Release the button once it's in position. Below is a demo of controlling the throttle interactively.",
    "ch2.s6.li1ul1a": "① Throttle/Reverser levers: ",
    "ch2.s6.li1ul1b": "In interactive mode, the throttle and reverser are controlled independently, with no linking (see above). The lever positions represent the opening amount, also shown as a percentage after the lever name. Throttle range is 0–100%, e.g. 85% means the throttle is pulled 85% up the track. The reverser also shows a percentage (−100% to 100%, sign indicating direction); since it has only three positions, releasing the lever snaps it to the nearest one (above 50% → Forward at 100%; between −50% and 50% → Off at 0%; below −50% → Reverse at −100%). Besides dragging, you can also operate levers with the mouse wheel while aiming.",
    "ch2.s6.li1ul2a": "② Brake levers: ",
    "ch2.s6.li1ul2b": "The independent/air brake levers work differently from the throttle/reverser levers. Pulling a brake lever in the positive direction increases braking regardless of position (from 0% to 100%); the harder you pull, the faster the brakes apply. Releasing the lever snaps it back while the brakes hold. Hence brake levers show no percentage and ignore the mouse wheel. To release the brakes, pull the lever the opposite way — everything else is the same.",
    "ch2.s6.li2a": "Buttons",
    "ch2.s6.li2b": ": engine switches, light switches and so on are buttons. IR shows the button's state after its name; left-clicking toggles it on/off. The “Horn” button is special: it's on while held (sounding the horn) and turns off when released.",
    "ch2.s6.p6": "You don't actually need to board to use interactive controls; you can operate parts from outside the locomotive too, though they're usually hard to reach from outside.",
    "ch2.s6.p7a": "Worth mentioning: IR 1.10.0 didn't just add interactive driving — it added ",
    "ch2.s6.p7b": "an entire interactive system",
    "ch2.s6.p7c": " enabling rich features: usable gauge instruments (showing live speed, fuel, engine temperature, etc.), doors you can drag open to board/alight, connecting doors that block or allow movement between cars, openable windows and curtains, switchable headlights (some third-party packs even support per-side lights), animated wipers, pantographs that raise and lower, seats you can sit in, and much more — an incredibly rich set (though not every car supports all of it; it depends on whether the pack author bothered, and stock IR cars only have a subset). So you may well find other interactive parts on some cars — explore them yourself.",

    /* ---- 7. 机车的其他内容 ---- */
    "ch2.s7.title": "7. Other Locomotive Topics",

    /* ---- （1）油漆刷 ---- */
    "ch2.s7.b1.h4.1": "(1) Paintbrush",
    "ch2.s7.b1.h4.1p1": "In IR, some locomotives have multiple appearances; use the “Paintbrush” to switch them. The Paintbrush is found in the “Immersive Railroading” tab of the creative inventory, as shown.",
    "ch2.s7.b1.h4.1p2": "We call the different appearances different “liveries”. Right-clicking a vehicle with the Paintbrush opens the livery selection screen: pick a livery on the left, and the right side previews it live. To pick randomly, click “Apply Random Livery” in the top-right.",
    "ch2.s7.b1.h4.1p3": "After choosing, click “Apply to This Car” or “Apply to Entire Train” at the bottom-right to save and exit, and the locomotive takes on its new look. The difference: the former restyles only the selected car; the latter also restyles every car of the same model coupled to it.",
    "ch2.s7.b1.h4.1p4a": "The Paintbrush has 3 modes: ",
    "ch2.s7.b1.h4.1p4b": "“Livery Selection Menu”, “Random (This Car Only)” and “Random (Whole Train)”",
    "ch2.s7.b1.h4.1p4c": ", defaulting to “Livery Selection Menu”. Switch modes by holding SHIFT and right-clicking the air or a block with the Paintbrush. What we described above — right-clicking a locomotive to open the menu and manually picking a livery — is the “Livery Selection Menu” mode. In “Random (This Car Only)” mode, right-clicking a locomotive skips the menu and instantly applies a random livery to that car; “Random (Whole Train)” differs only in that it applies to all cars of the same model in the train.",
    "ch2.s7.b1.h4.1p5": "Worth noting: the Paintbrush restyles freight cars, passenger cars and other vehicles too — the operation is the same as for locomotives. Only some stock IR vehicles have liveries, but third-party packs may offer selectable liveries as well.",

    /* ---- （2）机车与生物/方块的关系 ---- */
    "ch2.s7.b1.h4.2": "(2) Locomotives vs. Mobs & Blocks",
    "ch2.s7.b1.h4.2p1": "IR's physics engine is fairly realistic — railway vehicles have collision boxes and can damage mobs or destroy blocks on the line. Per my experiments, locomotives under 10 km/h don't hurt mobs (regardless of gauge or locomotive); at 10 km/h or above, collisions damage mobs, and the faster you go, the more damage — fast enough and the mob dies outright.",
    "ch2.s7.b1.h4.2p2a": "Blocks placed on the track ahead are destroyed (bedrock included!), which slows the train (harder blocks slow it more; more blocks destroyed = faster deceleration). The destruction range depends on the collision box — ",
    "ch2.s7.b1.h4.2p2b": "some large locomotives destroy blocks within one block of both sides of the track, so when building for them, don't place blocks within one block of the rails.",
    "ch2.s7.b1.h4.2p3": "If the collision box of a stationary locomotive contains blocks, it won't be able to move once started. If a locomotive won't go after being placed on rails, check its collision box for blocks (some big locomotives have five-block-wide boxes — no blocks on the rail but blocks beside it can still block movement).",

    /* ---- 表格：互动部件中英对照 ---- */
    "ch2.t1.th1": "English Name",
    "ch2.t1.th2": "Chinese Name",
    "ch2.t1.th3": "Type",
    "ch2.t1.r1c2": "Throttle",
    "ch2.t1.r1c3": "Lever",
    "ch2.t1.r2c2": "Reverser",
    "ch2.t1.r2c3": "Lever",
    "ch2.t1.r3c2": "Independent Brake",
    "ch2.t1.r3c3": "Lever",
    "ch2.t1.r4c2": "Train Brake (Air Brake)",
    "ch2.t1.r4c3": "Lever",
    "ch2.t1.r5c2": "Horn",
    "ch2.t1.r5c3": "Button",
    "ch2.t1.r6c2": "Bell",
    "ch2.t1.r6c3": "Button",
    "ch2.t1.r7c2": "Engine Start/Stop",
    "ch2.t1.r7c3": "Button",
    "ch2.t1.r8c2": "Headlights",
    "ch2.t1.r8c3": "Button",

    /* ---- 第二章结尾与附录 ---- */
    "ch2.ending": "That concludes this chapter. Once you master it, you can start, drive and operate all kinds of locomotives on your own. Do remember to try everything in MC yourself — words alone can be hard to follow, but a quick hands-on attempt makes it all clear. Despite being “immersive” and realistic, IR isn't hard to operate; once you get familiar, it all feels simple. In the next tutorial we will discuss coupling cars, marshalling trains, and building supporting railway facilities (like water towers linked with Immersive Engineering).",
    "ch2.appendix.title": "Appendix",
    "ch2.appendix.p1": "This tutorial was first written in 2025 and published on the MC百科 wiki and Bilibili, based on Minecraft 1.12.2 and IR 1.10.0. IR has since updated to 1.11.0, which not only supports newer Minecraft versions more stably, but also has much better Chinese translations and adjusted mechanics — so parts of the old guide were outdated. The author took this chance to revise it, added new content, and compiled this new edition in the hope that it will be more helpful to everyone.",
    "ch2.appendix.p2": "An earlier edition of this tutorial explained how to use a Chinese localization pack for IR 1.10.0 (the IR 1.10.0 downloaded from CurseForge uses the IR 1.9.0 Chinese pack, which is quite incomplete). Since IR 1.11.0 has greatly improved its built-in Chinese translations, that pack is no longer needed, so it is no longer provided here.",
    "ch2.appendix.p3": "This tutorial is licensed under CC BY-NC-SA. All images, text and lists in this article are original creations of the author alone.",
    "ch2.appendix.p4": "For the Minecraft, Forge and mod versions used in this tutorial, please see the first chapter."
};
