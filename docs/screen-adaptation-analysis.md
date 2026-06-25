# 1920 设计稿屏幕适配方案分析

> 项目：DataCenterPlatform-II  
> 日期：2026-06-24  
> 问题：UI 设计稿基于 1920×1080，实际屏幕分辨率多样，需要一套可靠的适配策略

---

## 一、项目现状

### 1.1 已有方案及问题

项目已经尝试过 **CSS `transform: scale()` 整体缩放** 方案（[src/hooks/useAutoFit.js](../src/hooks/useAutoFit.js)），但已被**禁用**。

`.env` 中明确注释：

```
# 是否开启自适应---目前不太好使，所以把app.vue中的useAutoFit注释掉了
VITE_GLOB_AUTO_FIT = false
```

`App.vue` 中相关代码已被注释：

```javascript
// import { useAutoFit } from '@/hooks/useAutoFit'
// useAutoFit()
```

### 1.2 scale 方案「不好使」的根本原因

| 问题 | 原因 | 影响范围 |
|------|------|----------|
| **Ant Design 弹层错位** | `a-modal` / `a-dropdown` / `a-popover` / `a-select` 下拉通过 `Teleport` 挂载到 `document.body`，不受 `#app` 的 scale 影响 | 所有下拉框、气泡、弹窗位置偏移 |
| **Canvas 坐标错乱** | 项目大量使用 `@antv/g6` 和 `@antv/x6`（数据建模 ER 图、DAG 工作流、脑图），Canvas 内部坐标与 CSS transform 不在同一坐标系 | 拖拽、连线、框选、点击全部偏移 |
| **滚动条异常** | `transform: scale()` 不改变元素的布局占位，缩放后内容溢出但浏览器认为尺寸未变 | 多余滚动条或内容被裁切 |
| **事件坐标偏移** | `event.clientX/Y` 是屏幕坐标，元素被 scale 后视觉位置与事件坐标不一致 | 拖拽、悬浮提示等交互异常 |
| **字体模糊** | scale 缩小后字体渲染质量下降（尤其 Chrome 下 < 12px） | 可读性降低 |

### 1.3 项目交互特征（决定方案选择）

| 特性 | 说明 | 对适配方案的要求 |
|------|------|-----------------|
| Ant Design 弹层 | Modal / Drawer / Popover / Select / Dropdown | 不能影响 Portal 挂载元素的定位 |
| G6 脑图 | 主题域管理 - 思维导图 | Canvas 需要独立坐标系统 |
| X6 DAG | 数据采集工作流、数据建模 ER 图 | 拖拽/连线依赖精确坐标 |
| 数据表格 | 大量 CRUD 表格页面 | 列宽需要弹性空间 |
| Schema 表单 | BasicForm 动态表单 | 表单布局需要响应式列数 |

---

## 二、业界主流方案对比

```
┌──────────────────────────────────────────────────────────────────────┐
│                      大屏/管理后台适配方案对比                          │
├────────────┬─────────────────┬──────────────────┬───────────────────┤
│            │  A. CSS Scale   │  B. REM/VW 流式   │  C. 混合策略       │
│            │  (整体缩放)      │  (响应式布局)      │  (推荐)           │
├────────────┼─────────────────┼──────────────────┼───────────────────┤
│ 原理       │ transform:scale │ 基于视口单位       │ rem/vw + 弹性     │
│            │ 缩放整个根容器    │ 动态计算尺寸       │ + min-width 保底  │
├────────────┼─────────────────┼──────────────────┼───────────────────┤
│ 设计还原度  │ ★★★★★ 像素级    │ ★★★ 近似还原      │ ★★★★ 高还原度     │
│ 弹层兼容性  │ ★☆☆☆☆ 严重错位  │ ★★★★★ 完美        │ ★★★★★ 完美        │
│ Canvas 兼容 │ ★☆☆☆☆ 坐标错乱  │ ★★★★★ 完美        │ ★★★★★ 完美        │
│ 事件准确性  │ ★☆☆☆☆ 偏移      │ ★★★★★ 准确        │ ★★★★★ 准确        │
│ 字体渲染    │ ★★☆☆☆ 模糊      │ ★★★★★ 清晰        │ ★★★★★ 清晰        │
│ 开发成本    │ ★★★★★ 零成本    │ ★★★ 中等          │ ★★ 较高           │
│ 维护成本    │ ★★☆☆☆ 问题多    │ ★★★★ 低           │ ★★★★ 低           │
│ 适用场景    │ 无弹层大屏展示    │ 通用管理后台        │ 复杂交互管理后台    │
└────────────┴─────────────────┴──────────────────┴───────────────────┘
```

### 方案 A: CSS Scale 整体缩放 — ❌ 不适用

```
1920px 设计稿 → 任意分辨率
┌──────────────────────────┐
│  #app {                  │
│    width: 1920px;        │
│    transform: scale(0.8);│  ← 简单但问题多
│    transform-origin: 0 0;│
│  }                       │
└──────────────────────────┘
```

**适用场景**：纯展示大屏（无弹窗、无 Canvas、无拖拽交互）  
**本项目评估**：❌ 不适用（大量弹窗 + G6/X6 Canvas + 拖拽交互）

### 方案 B: REM/VW 流式响应式 — ⭐⭐⭐

```
设计稿 1920px
      │
      ├── 文字/间距/圆角 → rem（根据 font-size 动态缩放）
      │     html { font-size: calc(100vw / 19.2); }
      │     1rem = 100px @1920, 75px @1440
      │
      ├── 布局宽度 → vw / % / flex
      │     侧边栏: 固定 rem 宽度
      │     内容区: flex: 1 自适应
      │
      └── 表格列宽 → % / min-width + ellipsis
```

**优点**：弹层和 Canvas 完全不受影响，浏览器原生渲染清晰  
**缺点**：极端小屏（<1280）仍会出现布局挤压

### 方案 C: 混合策略 — ⭐⭐⭐⭐⭐ 推荐

```
┌─────────────────────────────────────────────────────────┐
│  分层适配策略：                                          │
│                                                         │
│  1. 布局层 (Layout)    → Flex + % + min-width           │
│     侧边栏用 rem 等比，内容区 flex 弹性伸缩               │
│     低于 1280px 出现横向滚动条                            │
│                                                         │
│  2. 组件层 (Component) → rem（间距/字体/圆角）           │
│     基于 viewport 动态计算 rem 基准值                     │
│     postcss-pxtorem 自动转换项目中的 px                   │
│                                                         │
│  3. 内容层 (Content)   → 弹性 + 最小宽度保底             │
│     表格设置 min-width，列宽弹性分配                      │
│     弹窗 max-width: 90vw 不超出屏幕                       │
│                                                         │
│  4. Canvas 层 (G6/X6) → 独立容器，内部自行缩放           │
│     Graph 容器用 % / vw 跟随父容器                        │
│     图内容通过 zoomToFit() 自适应                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、推荐方案详细设计

### 3.1 核心机制：动态 rem 基准值

**原理**：`rem` 单位相对于 `<html>` 的 `font-size`。动态改变 `font-size`，所有使用 `rem` 的元素等比缩放。

```
htmlFontSize = (viewportWidth / 1920) × 100

1920px → 1rem = 100px  （设计稿 1:1）
1680px → 1rem = 87.5px （缩小至 87.5%）
1440px → 1rem = 75px   （缩小至 75%）
1280px → 1rem = 66.7px （保底比例，不再缩小）
```

### 3.2 代码实现

#### 3.2.1 `initResponsive()` — 全局初始化

```javascript
// src/hooks/useResponsive.js

const DESIGN_WIDTH = 1920      // 设计稿宽度
const BASE_FONT_SIZE = 100      // 基准 rem 值 (1rem = 100px @1920)
const MIN_WIDTH = 1280          // 最小适配宽度（低于此值出现横向滚动条）
const MAX_WIDTH = 2560          // 最大适配宽度（超宽屏不再放大，避免元素过大）

/**
 * 初始化响应式适配
 * 在 main.js 中调用一次即可
 */
export function initResponsive() {
  const docEl = document.documentElement

  function setRootFontSize() {
    let w = docEl.clientWidth
    if (w < MIN_WIDTH) w = MIN_WIDTH
    if (w > MAX_WIDTH) w = MAX_WIDTH
    docEl.style.fontSize = `${(w / DESIGN_WIDTH) * BASE_FONT_SIZE}px`
  }

  setRootFontSize()
  new ResizeObserver(setRootFontSize).observe(docEl)
}
```

#### 3.2.2 `useResponsive()` — 组件内响应式 Hook

```javascript
// src/hooks/useResponsive.js (续)

import { onMounted, onUnmounted, ref } from 'vue'

export function useResponsive() {
  const screenWidth = ref(window.innerWidth)
  const screenHeight = ref(window.innerHeight)
  const isSmallScreen = ref(false)    // < 1440
  const isMediumScreen = ref(false)   // 1440 - 1680
  const isLargeScreen = ref(false)    // >= 1680

  function updateScreen() {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
    isSmallScreen.value = screenWidth.value < 1440
    isMediumScreen.value = screenWidth.value >= 1440 && screenWidth.value < 1680
    isLargeScreen.value = screenWidth.value >= 1680
  }

  let observer = null
  onMounted(() => {
    updateScreen()
    observer = new ResizeObserver(updateScreen)
    observer.observe(document.documentElement)
  })
  onUnmounted(() => observer?.disconnect())

  return { screenWidth, screenHeight, isSmallScreen, isMediumScreen, isLargeScreen }
}
```

#### 3.2.3 main.js 入口调用

```javascript
// main.js 中只需一行
import { initResponsive } from '@/hooks/useResponsive'
initResponsive()
```

### 3.3 布局层适配

```less
// src/assets/styles/responsive.less

// === 设计基准 ===
@designWidth: 1920;
@baseRem: 100;               // 1rem = 100px @1920

// === 布局关键尺寸 ===
@siderWidth: 2.2rem;         // 220px / 100 = 2.2rem（等比缩放）
@siderMinWidth: 180px;       // 最小宽度（防止过小）
@contentMinWidth: 900px;     // 内容区最小宽度
@headerHeight: 56px;         // 顶部高度（通常不需缩放）

.layout-wrapper {
  min-width: 1280px;         // 整体最小宽度

  .layout-center {
    height: calc(100% - @headerHeight);

    .layout-sider {
      width: @siderWidth;
      min-width: @siderMinWidth;
      flex-shrink: 0;        // 侧边栏不参与弹性收缩
    }

    .layout-content {
      flex: 1;
      min-width: @contentMinWidth;
      overflow: auto;        // 低于最小宽度出现滚动条
    }
  }
}
```

### 3.4 组件层适配（postcss-pxtorem 自动转换）

```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 100,            // 1rem = 100px（对应设计稿 1920）
      propList: ['*'],           // 所有属性都转换
      exclude: /node_modules/i,  // ⚠️ 关键：排除第三方库，避免影响 Ant Design 弹层定位
      minPixelValue: 2           // < 2px 的不转换（1px 边框保留）
    }
  }
}
```

**为什么 exclude node_modules 是关键**：

> Ant Design 的 Modal、Dropdown、Popover 使用 `position: fixed` + `left/top` px 值做定位。  
> 如果这些 px 被转为 rem，弹层位置将随视口变化而偏移，导致与触发元素的相对位置错乱。  
> exclude node_modules 后，Ant Design 内部样式保持 px，不受影响。

### 3.5 内容层适配（表格 / 弹窗）

#### 表格列宽策略

```javascript
// 推荐 columns 配置模式
const columns = [
  // 关键列：使用 minWidth + ellipsis，弹性伸缩
  { dataIndex: 'name', title: '名称', minWidth: 200, ellipsis: true },

  // 固定窄列：使用 width，内容短
  { dataIndex: 'status', title: '状态', width: 100 },

  // 中等列：使用 width
  { dataIndex: 'createTime', title: '创建时间', width: 180 },

  // 操作列：固定右侧
  { title: '操作', width: 220, fixed: 'right' }
]
```

#### 弹窗适配

```css
/* 全局弹窗适配 */
.ant-modal {
  max-width: 90vw;              /* 小屏下弹窗不超出屏幕 */
}
.ant-modal-content {
  max-height: 85vh;             /* 高度自适应 */
  overflow-y: auto;
}
.ant-drawer-content-wrapper {
  max-width: 90vw;              /* 抽屉不超出屏幕 */
}
```

#### 搜索表单响应式列数

```javascript
// BasicForm 中根据屏幕宽度调整 col span
import { useResponsive } from '@/hooks/useResponsive'

const { isSmallScreen, isMediumScreen, isLargeScreen } = useResponsive()

const colProps = computed(() => ({
  span: isSmallScreen.value ? 12    // 小屏: 每行 2 个
      : isMediumScreen.value ? 8    // 中屏: 每行 3 个
      : 6                            // 大屏: 每行 4 个
}))
```

### 3.6 Canvas 层适配（G6 / X6）

Canvas 图组件**不参与 rem 缩放**，使用独立的适配策略：

```javascript
// 通用图自适应 Hook
export function useGraphFit(graphInstance, containerRef) {
  // 1. 容器宽高使用 CSS % / vw 跟随父容器
  //    .graph-container { width: 100%; height: calc(100vh - header - toolbar); }

  // 2. 图内容自适应
  function fitGraph() {
    if (!graphInstance.value) return
    graphInstance.value.zoomToFit({
      padding: 40,
      maxZoom: 2,
      minZoom: 0.3
    })
  }

  // 3. 初始化 + resize 时重新适配
  onMounted(() => {
    fitGraph()
    window.addEventListener('resize', fitGraph)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', fitGraph)
  })

  return { fitGraph }
}
```

**为什么 Canvas 不能参与 rem 缩放**：

> G6/X6 内部维护自己的坐标系统，节点位置用 px 存储。  
> 如果容器被 rem 缩放，Canvas 的 `getBoundingClientRect()` 返回值与内部坐标不一致，  
> 导致 `clientX → canvasX` 的坐标转换出错，表现为点击位置偏移、拖拽异常。

---

## 四、适配效果预估

| 屏幕分辨率 | 常见设备 | 缩放比例 | 1rem = | 侧边栏 | 表格字体 | 效果 |
|-----------|---------|---------|--------|--------|---------|------|
| **2560×1440** | 2K 显示器 | 1.33x | 133px | 293px | 17px | 内容放大，宽屏充分利用 |
| **1920×1080** | 标准显示器 | 1.0x | 100px | 220px | 14px | 完美还原设计稿 |
| **1680×1050** | MacBook Pro 16" | 0.875x | 87.5px | 193px | 12px | 等比缩小，布局完整 |
| **1440×900** | MacBook Air 13" | 0.75x | 75px | 165px | 11px | 缩小但可用 |
| **1280×720** | 老旧显示器 | 0.67x | 66.7px | 147px | 10px | 达到最小阈值，出现横向滚动条 |

---

## 五、实施计划

### 5.1 渐进式推进步骤

| 优先级 | 步骤 | 改动文件 | 工时 |
|--------|------|---------|------|
| **P0** | 编写 `useResponsive.js`，在 `main.js` 中调用 `initResponsive()` | `src/hooks/useResponsive.js`、`main.js` | 0.5h |
| **P0** | 布局层改用 rem + flex | `src/layouts/index.vue`、全局样式 | 1h |
| **P1** | 引入 `postcss-pxtorem` 自动转换 px→rem | `postcss.config.cjs`、`package.json` | 0.5h |
| **P1** | 表格列宽改为 min-width + 弹性策略 | 各页面 columns 配置 | 按页面渐进 |
| **P2** | 弹窗/抽屉添加 `max-width: 90vw` | 全局 CSS | 0.5h |
| **P2** | G6/X6 Canvas 添加 `zoomToFit` | 图组件 hooks | 1h |
| **P3** | 渐进式调整各页面 px 为 rem（或等 postcss-pxtorem 自动处理） | 各页面 | 按需 |

### 5.2 关键红线

| ❌ 禁止 | ✅ 正确 |
|--------|--------|
| 对 `#app` 或根容器使用 `transform: scale()` | 使用 `rem` + `flex` + `%` |
| 对 `a-modal`/`a-dropdown` 的定位样式做 rem 转换 | `postcss-pxtorem` exclude `node_modules` |
| 对 G6/X6 Canvas 容器使用 rem 宽度 | Canvas 容器用 `%` / `vw` |
| 无限制缩小（比如到 800px） | `min-width: 1280px` 硬底线 |
| 大屏下无限放大（比如到 4K） | `max-width: 2560px` 上限 |

### 5.3 验证检查清单

- [ ] 1920×1080：页面与设计稿 1:1 还原
- [ ] 1440×900：布局完整，无横向滚动条，弹窗不超出屏幕
- [ ] 1280×720：出现横向滚动条，内容可滚动查看
- [ ] 2560×1440：内容适度放大，不超出屏幕
- [ ] Ant Design Modal / Drawer 弹层位置正确
- [ ] G6 / X6 图的点击、拖拽、框选交互准确
- [ ] a-select / a-dropdown / a-popover 下拉位置正确
- [ ] 所有表单提交按钮在可视区域内

---

## 六、与其他方案的兼容性

### 与 Monorepo 改造的兼容

Monorepo 不影响适配方案。`initResponsive()` 在 `apps/main` 的 `main.js` 中调用，shared 包中的组件使用 rem 单位，在任意宿主应用中都会基于该应用的 `html.fontSize` 正确缩放。

### 与 MCP 代码生成的兼容

在代码模板中，样式使用 rem 单位（或依赖 postcss-pxtorem 自动转换），MCP 生成的代码自动具备响应式能力。

---

## 七、总结

| 维度 | 结论 |
|------|------|
| **推荐方案** | rem 动态基准 + 弹性布局 + min-width 保底 |
| **核心原理** | `html.fontSize` 随视口宽度动态变化，元素用 rem 等比缩放 |
| **为什么不用 scale** | 弹窗坐标错位 + Canvas 交互异常 + 滚动条问题，已被项目验证不可行 |
| **为什么不用 vw 全量** | vw 无法设置最大/最小边界，超宽屏元素过大，超小屏元素过小 |
| **实施成本** | 核心改造 0.5 天，全面铺开按页面渐进 |
| **副作用** | 无。弹窗、Canvas、拖拽交互全部不受影响 |
| **与现有方案关系** | 替代 `useAutoFit.js`，禁用 scale 方案 |

---

## 附录

### A. postcss-pxtorem 配置详解

| 参数 | 值 | 说明 |
|------|---|------|
| `rootValue` | 100 | 1rem = 100px，设计稿中 16px → 0.16rem |
| `propList` | `['*']` | 所有 CSS 属性都转换 |
| `exclude` | `/node_modules/i` | 关键配置：排除第三方库 |
| `minPixelValue` | 2 | 小于 2px 不转换（保留 1px 边框） |
| `mediaQuery` | false | 媒体查询中的 px 不转换 |
| `selectorBlackList` | `['.norem']` | 可通过 class 排除特定元素 |

### B. 需要单独处理的情况

```css
/* 以下情况需要在 CSS 中加 .norem 或使用 Px 大写（pxtorem 默认不转换大写 Px） */

/* 1. 1px 边框（其实 minPixelValue: 2 已经排除） */
.border-bottom { border-bottom: 1px solid #eee; }

/* 2. Canvas 容器尺寸（建议用 % 而非 px） */
.graph-container { width: 100%; height: calc(100vh - 56px); }

/* 3. 固定宽度的操作列（建议保持 px，不转换为 rem） */
.operation-column { width: 220Px; }  /* 大写 P 不被转换 */
```

### C. 参考资源

- [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Ant Design 响应式布局](https://antdv.com/components/grid)
- [G6 图适配](https://g6.antv.antgroup.com/api/graph-function#graphtozoomtofit)
