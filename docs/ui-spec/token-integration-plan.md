# 项目 Token 体系分析 & ant-design 联动方案（修正版 v2）

> 分析日期: 2026-07-08  
> 分析范围: `App.vue`、`theme.js` store、`themes/*.less`、`ant_design_overwrite/*.less`、组件样式  
> **修正说明**: 经源码验证，ant-design-vue 4.2.6 不具备 cssVar 注入能力，Token 全走 CSS-in-JS。v1 方案中的"别名映射"不可行，已修正为"同源双通道同步"方案。

---

## 一、版本锁定

| 依赖 | 当前版本 | 锁定版本 | 说明 |
|------|---------|---------|------|
| ant-design-vue | 4.2.6 | **4.2.6** | npm 最新，`package.json` 改为 `"ant-design-vue": "4.2.6"` |
| @ant-design/icons-vue | 6.1.0 | **6.1.0** | 配套图标库 |
| vue | 3.5.29 | **^3.3.0** | peerDependency 范围 |

---

## 二、现状分析（修正后）

### 2.1 经源码验证的事实

```
ant-design-vue 4.2.6 主题系统
├── ✅ ConfigProvider theme.token    → 完整的 AliasToken（颜色/字号/圆角/间距/阴影…）
├── ✅ ConfigProvider theme.algorithm → darkAlgorithm / compactAlgorithm 自动派生
├── ✅ ConfigProvider theme.components → 逐组件 Token 覆盖
├── ✅ ConfigProvider theme.hashed    → 支持 false（关闭哈希类名）
├── ❌ 无 cssVar 注入                 → Token 不暴露为 CSS Variables
│                                       App.vue 中的 cssVar: true 是无效配置
├── ✅ 内部消费方式                   → CSS-in-JS + hashed class + useToken() hook
└── ✅ 自定义组件无法读取 antd Token  → 两条体系天然隔离
```

### 2.2 项目自定义主题体系

```
theme.js store
├── 4 个主题: default / dark / blue / grey
├── 切换方式: <html> class 切换 (theme-default / theme-dark / theme-blue / theme-grey)
├── 变量定义: themes/default.less (110+行) / dark.less (150+行) / blue.less / grey.less
├── antd 覆盖: ant_design_overwrite/ 13 个文件
├── 字体硬编码: FZLanTingHeiS-M-GB 散落在多处
├── 业务变量: 大量 --data-sync-* / --mindmap-* / --data-domain-* 等
└── x6 变量: x6-theme.less 使用 Less 变量 (@x6-*)，编译时写死，主题切换无效
```

### 2.3 核心问题

```
┌────────────────────────────┐      ┌──────────────────────────────┐
│  antd Token (CSS-in-JS)     │      │  自定义 CSS Variables         │
│                            │      │                              │
│  内部:                      │      │  :root 注入:                  │
│  colorPrimary → 派生梯度色   │      │  --primary-color             │
│  fontSize → 字号层级        │  ✗   │  --text-color                │
│  borderRadius → 圆角层级    │ 无桥 │  --bg-color-secondary        │
│  fontFamily → 全局字体      │      │  --border-color              │
│  ...                        │      │  ... 110+ 个                 │
│                            │      │                              │
│  特性:                      │      │  特性:                        │
│  ✅ 算法自动派生            │      │  ❌ 暗色需手动写 150 行        │
│  ✅ 全局联动                │      │  ❌ 改一个色需人工找所有引用    │
│  ✅ antd 组件自动消费        │      │  ❌ 需要 13 个 overwrite 文件   │
└────────────────────────────┘      └──────────────────────────────┘
```

**结论**: 两条体系天然隔离，无法通过 CSS Variables 别名桥接。正确做法是「同源双通道同步」——从同一个 token.json 出发，同时输出到两条通道。

---

## 三、决策确认

| # | 决策 | 处理方式 |
|---|------|---------|
| 1 | antdv 无 v5，基于 4.2.6 行为 | 已验证源码 + HTML，确认无 cssVar 注入 |
| 2 | 字体纳入 Token 体系 | `token.fontFamily` 统一配置，删除各处的硬编码 FZLanTingHei |
| 3 | 组件库不碰业务变量 | 业务变量（--data-sync-* 等）留在业务项目，不出现在组件库中 |
| 4 | x6 变量需要联动 | x6-theme.less 的 Less 变量迁移为 CSS Variables |
| 5 | Windi CSS 仅工具类 | 不影响，无冲突 |
| 6 | 去掉全局过渡动画 | 删除 `themes.less` 中 `* { transition: ... }` |
| 7 | 锁定 antdv 版本 | 改为 `"ant-design-vue": "4.2.6"` |
| 8 | 视觉回归测试 | 详见第五章 |

---

## 四、联动方案：同源双通道同步

### 4.1 核心原理

```
                    ┌─────────────────────┐
                    │     token.json       │  ← 唯一数据源
                    │  {                   │     Token Playground 导出
                    │    colorPrimary,      │
                    │    colorText,         │
                    │    borderRadius,      │
                    │    fontFamily,        │
                    │    ...                │
                    │  }                   │
                    └────────┬────────────┘
                             │
              ┌──────────────┴──────────────┐
              │    theme.js store            │
              │    setTheme(name) {          │
              │      const t = tokenMap[name] │
              │      injectCssVars(t)   ─────┼──→ 通道1: CSS Variables
              │      antTheme = { token: t } ─┼──→ 通道2: ConfigProvider
              │    }                         │
              └──────────────┬──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   自定义组件              antd 组件            x6 / 业务
   var(--primary-color)   内部 CSS-in-JS        var(--x6-*)
   自动跟随               自动跟随              自动跟随
```

### 4.2 token.json 结构（每个主题一份）

```json
{
  "colorPrimary": "#2575F5",
  "colorSuccess": "#52C41A",
  "colorWarning": "#FAAD14",
  "colorError": "#FF4D4F",
  "colorInfo": "#1890FF",
  "colorLink": "#2575F5",

  "colorTextBase": "#000000",
  "colorBgBase": "#FFFFFF",

  "borderRadius": 4,
  "fontSize": 14,
  "fontFamily": "'FZLanTingHeiS-M-GB', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  "controlHeight": 32,
  "lineWidth": 1,
  "sizeUnit": 4,
  "sizeStep": 4,
  "motion": true,
  "wireframe": false,

  "colorText": "rgba(0, 0, 0, 0.88)",
  "colorTextSecondary": "rgba(0, 0, 0, 0.65)",
  "colorTextTertiary": "rgba(0, 0, 0, 0.45)",
  "colorTextDisabled": "rgba(0, 0, 0, 0.25)",
  "colorBgContainer": "#FFFFFF",
  "colorBgElevated": "#FFFFFF",
  "colorBgLayout": "#F5F5F5",
  "colorBorder": "#D9D9D9",
  "colorSplit": "#F0F0F0",

  "boxShadow": "0 2px 8px rgba(0,0,0,0.15)",
  "boxShadowSecondary": "0 3px 6px -4px rgba(0,0,0,0.12)"
}
```

### 4.3 CSS Variables 注入函数

```js
// src/config/theme-tokens/css-vars-map.js

/**
 * token JSON → CSS Variables 的字段映射表
 * key: token.json 中的字段名
 * value: CSS Variable 名称（不含 -- 前缀）
 */
export const TOKEN_TO_CSS_VAR_MAP = {
  // 颜色
  colorPrimary:          'primary-color',
  colorSuccess:          'success-color',
  colorWarning:          'warning-color',
  colorError:            'error-color',
  colorInfo:             'info-color',
  colorLink:             'link-color',
  colorPrimaryHover:     'link-hover-color',

  // 文字
  colorText:             'text-color',
  colorTextSecondary:    'text-color-secondary',
  colorTextDisabled:     'text-color-disabled',
  colorTextHeading:      'heading-color',

  // 背景
  colorBgLayout:         'bg-color',
  colorBgContainer:      'bg-color-secondary',
  colorFillSecondary:    'bg-color-tertiary',

  // 边框
  colorBorder:           'border-color',
  borderRadius:          'border-radius',    // 特殊处理: 加 'px' 后缀

  // 阴影
  boxShadow:             'box-shadow',
  boxShadowSecondary:    'box-shadow-secondary',
}

/**
 * 将 token JSON 注入为 CSS Variables
 * 调用时机: 主题切换时
 */
export function injectTokenAsCssVars(token) {
  const root = document.documentElement

  for (const [tokenKey, cssVarName] of Object.entries(TOKEN_TO_CSS_VAR_MAP)) {
    let value = token[tokenKey]
    if (value === undefined || value === null) continue

    // 数值类型的 Token 需要加 px
    if (tokenKey === 'borderRadius' || tokenKey === 'fontSize' || tokenKey === 'controlHeight') {
      value = `${value}px`
    }

    root.style.setProperty(`--${cssVarName}`, value)
  }

  // 字体单独设置（fontFamily 不需要加 px）
  if (token.fontFamily) {
    root.style.setProperty('--font-family', token.fontFamily)
  }
}
```

### 4.4 theme.js store 改造

```js
// src/store/modules/theme.js（改造后）

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { theme } from 'ant-design-vue'
import { injectTokenAsCssVars } from '@/config/theme-tokens/css-vars-map'

// 加载各主题的 token.json
import defaultTokens from '@/config/theme-tokens/default.json'
import darkTokens from '@/config/theme-tokens/dark.json'
import blueTokens from '@/config/theme-tokens/blue.json'
import greyTokens from '@/config/theme-tokens/grey.json'

const tokenSources = { default: defaultTokens, dark: darkTokens, blue: blueTokens, grey: greyTokens }

export const useThemeStore = defineStore('theme', () => {
  const themes = [
    { name: 'default', label: '信息管理主题' },
    { name: 'dark',    label: '暗黑主题' },
    { name: 'blue',    label: '蓝色主题' },
    { name: 'grey',    label: '灰色主题' },
  ]

  const currentTheme = ref(localStorage.getItem('theme') || 'default')

  // ====== 通道1: antd ConfigProvider 用的 Token ======
  const antTheme = computed(() => {
    const token = tokenSources[currentTheme.value] || defaultTokens
    return {
      token,
      // 暗色主题使用 darkAlgorithm，其余用 default
      algorithm: currentTheme.value === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      hashed: false,
    }
  })

  // ====== 通道2: CSS Variables（自定义组件用） ======
  function applyCssVars(themeName) {
    const token = tokenSources[themeName] || defaultTokens
    injectTokenAsCssVars(token)

    // 业务特有的 CSS 变量不来自 token.json，单独设置
    // 这些变量 token.json 中不存在，保持原来的值不变
    // （由业务项目的 css 文件定义，这里不需要处理）
  }

  function setTheme(themeName) {
    if (themes.some(t => t.name === themeName)) {
      currentTheme.value = themeName
      localStorage.setItem('theme', themeName)
      applyCssVars(themeName)
    }
  }

  function initTheme() {
    applyCssVars(currentTheme.value)
  }

  return {
    themes,
    currentTheme,
    antTheme,
    setTheme,
    initTheme,
  }
})
```

### 4.5 App.vue 改造

```vue
<script setup>
import { RouterView } from 'vue-router'
import { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()
themeStore.initTheme()
</script>

<template>
  <ConfigProvider :locale="zhCN" :theme="themeStore.antTheme">
    <RouterView />
  </ConfigProvider>
</template>
```

### 4.6 字体统一

```json
// 每个 token.json 里加:
{
  "fontFamily": "'FZLanTingHeiS-M-GB', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
}
```

然后删除各 overwrite 文件中的硬编码 `font-family: FZLanTingHeiS-M-GB`，改为由 ConfigProvider 统一注入。对需要特殊字体的业务场景（如表格表头用了 `FZLanTingHeiS-M-GB`），通过 `components` Token 设置：

```js
components: {
  Table: {
    fontWeightStrong: 400,           // 表头不需要 bold
  }
}
```

### 4.7 x6-theme.less 变量迁移

`x6-theme.less` 中使用 Less 变量（`@x6-canvas-bg: #f7faff`），编译后值被写死，主题切换无效。

迁移方案：将 `@x6-*` 改为 CSS Variables。

**迁移前**（`src/assets/styles/x6-theme.less`）:

```less
@x6-canvas-bg: #f7faff;
@x6-edge-color: #9bc6ff;
@x6-primary:    #2575f5;

.my-canvas {
  background: @x6-canvas-bg;
  .edge { stroke: @x6-edge-color; }
}
```

**迁移后**:

```less
// x6-theme.less 改为引用 CSS Variables
.my-canvas {
  background: var(--x6-canvas-bg);
  .edge { stroke: var(--x6-edge-color); }
}
```

```css
/* 在各个主题的 CSS 中定义 x6 变量 */
.theme-default {
  --x6-canvas-bg:   #f7faff;
  --x6-edge-color:  #9bc6ff;
  --x6-edge-hover:  #1890ff;
  --x6-primary:     #2575f5;
  --x6-node-border: #cccccc;
}

.theme-dark {
  --x6-canvas-bg:   #1a1a1a;
  --x6-edge-color:  #434343;
  --x6-edge-hover:  #4D94F5;
  --x6-primary:     #4D94F5;
  --x6-node-border: #404040;
}
```

### 4.8 去掉全局过渡动画

删除 `themes.less` 中的:

```css
/* ❌ 删除这段 */
* {
  transition: background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}
```

antd 组件自带过渡动画，全局 `*` 选择器会影响性能且可能与 antd 的内置动画冲突。主题切换时，CSS Variables 的变化会即时生效，不需要 CSS transition 来辅助。

### 4.9 组件库与业务变量隔离

**原则**: 组件库的所有 CSS 变量使用统一的 `--dcp-*` 前缀（Data Center Platform），业务项目继续使用业务变量。

```
组件库不碰的变量（留在业务项目中）:
  --data-sync-*          → 数据同步业务
  --data-domain-*        → 主题域管理
  --data-collect-*       → 元数据采集
  --mindmap-*            → 思维导图
  --metadata-*           → 元数据目录
  --card-*               → 统计卡片

组件库使用的变量（来自 token.json → CSS Variables 注入）:
  --primary-color        → 品牌主色
  --text-color           → 主要文字
  --bg-color             → 页面背景
  --border-color         → 边框
  --border-radius        → 圆角
  ...（约 30 个）
```

组件库内部不应出现 `--data-sync-step-pair-hover-bg-color` 这类变量。如果某个组件在不同项目中表现不同，通过 **props** 控制而非全局 CSS 变量。

---

## 五、视觉回归测试指南

### 5.1 为什么需要

```
改造前                      改造后
┌──────────┐               ┌──────────┐
│ 手动 dark.less             │ darkAlgorithm
│ --primary-color: #1a5e72  │ colorPrimary: #2575F5
│ 派生色人工写                │ 算法自动派生
│ antd overwrite 手动覆盖    │ ConfigProvider token
└──────────┘               └──────────┘
        │                         │
        └─────────┬───────────────┘
                  │
        ⚠️ 视觉上一定有差异！
        
        比如:
        - 暗色背景: 手动写的 #141414 vs 算法算的 #0D0D0D
        - hover 色: 手动写的 #1a5e72 vs 算法算的 #3D85F7 opacity
        - 圆角: 手动写的 3px vs token 的 4px
```

### 5.2 工具选型

| 工具 | 适用场景 | 成本 |
|------|---------|------|
| **Playwright**（推荐） | 自动化截图对比，支持 Chromium/Firefox/WebKit | 中（需写脚本） |
| BackstopJS | 专门做视觉回归，有 GUI 审批界面 | 中 |
| Percy / Chromatic | SaaS 服务，自动对比 + 审批工作流 | 高（付费） |
| 手动截图对比 | 临时验证 | 低（但易遗漏） |

### 5.3 Playwright 方案

**安装**:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**截图脚本**（`scripts/visual-diff/`）:

```js
// scripts/visual-diff/screenshot.js
const { chromium } = require('playwright')

// 需要截图的页面列表
const PAGES = [
  { name: 'data-modeling',  path: '/#/dataDevelop/dataModeling' },
  { name: 'data-dictionary', path: '/#/dataGovernance/dataDictionary' },
  { name: 'data-collection', path: '/#/dataIntegration/dataCollection' },
  { name: 'data-sync',      path: '/#/dataIntegration/dataSync' },
  { name: 'domain-manage',  path: '/#/dataDevelop/dataDomainManage' },
  { name: 'metadata-catalog', path: '/#/dataGovernance/metadataCatalog' },
]

const THEMES = ['default', 'dark', 'blue', 'grey']

async function takeScreenshots({ baseUrl, outputDir, label }) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })

  for (const theme of THEMES) {
    const page = await context.newPage()
    await page.goto(baseUrl)
    // 切换到目标主题
    await page.evaluate((t) => localStorage.setItem('theme', t), theme)
    await page.reload()
    await page.waitForLoadState('networkidle')

    for (const p of PAGES) {
      await page.goto(`${baseUrl}${p.path}`)
      await page.waitForTimeout(2000) // 等待组件渲染完成
      await page.screenshot({
        path: `${outputDir}/${label}/${theme}-${p.name}.png`,
        fullPage: false,
      })
    }
    await page.close()
  }
  await browser.close()
}

// 使用:
// 改造前: node screenshot.js --label before --output-dir screenshots
// 改造后: node screenshot.js --label after  --output-dir screenshots
```

**对比脚本**:

```bash
# 使用 ImageMagick 或 pixelmatch 对比
# 方案1: ImageMagick (命令行)
compare screenshots/before/default-data-modeling.png \
         screenshots/after/default-data-modeling.png \
         screenshots/diff/default-data-modeling.png

# 方案2: pixelmatch (Node.js)
npx pixelmatch screenshots/before/default-data-modeling.png \
                screenshots/after/default-data-modeling.png \
                screenshots/diff/default-data-modeling.png \
                0.05  # 5% 容差阈值
```

### 5.4 需要重点对比的场景

| 优先级 | 页面/组件 | 关注点 |
|--------|----------|--------|
| P0 | 数据建模（ER 图） | 画布背景、节点边框、边颜色（x6 变量迁移影响） |
| P0 | 表格（浅色+斑马纹+选中） | 表头颜色、行 hover、分割线色 |
| P0 | 暗色全页面 | 所有组件在暗色下的对比度 |
| P1 | 弹窗 (Modal/Drawer) | 遮罩透明度、标题栏渐变、表单组件 |
| P1 | 树形控件 | 选中背景色、hover 色、展开箭头色 |
| P1 | Tab 导航 | 激活态颜色、hover 效果 |
| P1 | 统计卡片 | 渐变色、数值颜色、图标颜色 |
| P2 | 表单（搜索区 + 编辑表单） | label 色、placeholder 色、错误态 |
| P2 | Steps 步骤条 | 激活色、完成色 |
| P2 | Alert / Tag / Badge | 各类型颜色是否正确 |

### 5.5 审批流程

```
1. 运行改造前截图 → screenshots/before/
2. 实施 Phase 1-2 改造
3. 运行改造后截图 → screenshots/after/
4. 自动生成 diff 对比 → screenshots/diff/
5. 人工检查 diff:
   ├── 差异 < 1%  → 通过 ✅
   ├── 差异 1-5%  → 评估是否可接受
   └── 差异 > 5%  → 调整 token 参数 → 回到步骤 3
6. 全部通过 → 合并代码
```

### 5.6 持续集成

在 CI 中加入视觉回归检查（可选，成熟后启用）:

```yaml
# .github/workflows/visual-diff.yml
- name: Visual Regression
  run: |
    npm run test:visual
    # 与 baseline 对比，超过阈值则失败
```

---

## 六、实施路径

### Phase 1: 基础设施（1 天）

**不修改现有主题文件，只新增功能**

1. 新建 `src/config/theme-tokens/` 目录
2. 从 Token Playground 导出 4 套 `token.json` 放入该目录
3. 新建 `src/config/theme-tokens/css-vars-map.js`
4. 改造 `theme.js` store → 加入 `injectTokenAsCssVars` + `antTheme` computed
5. 改造 `App.vue` → ConfigProvider 绑定 `themeStore.antTheme`
6. 删除 `themes.less` 中的 `* { transition: ... }` 全局动画
7. `package.json` 锁定 `"ant-design-vue": "4.2.6"`

**验证**: 切换主题 → 自定义组件 + antd 组件同时变化

### Phase 2: 变量迁移（2-3 天）

1. 将 x6-theme.less 中 `@x6-*` Less 变量迁移为 CSS Variables
2. 将 4 个主题文件中可通过 token.json 覆盖的变量（约 30 个）标记为 deprecated
3. 字体统一：通过 token.fontFamily 注入，删除分散的硬编码
4. 逐步删除 `ant_design_overwrite/` 中可被 ConfigProvider token 替代的覆盖

**验证**: 视觉回归测试，对比改造前后截图

### Phase 3: 清理（1-2 天）

1. 删除已废弃的主题变量
2. 删除不再需要的 overwrite 文件
3. 全局搜索硬编码色值 `#[0-9a-fA-F]{6}`，替换为 CSS Variables
4. 更新组件文档

**验证**: 全页面截图对比通过

---

## 七、文件变更总览

```
新增:
  src/config/theme-tokens/
    ├── default.json          ← 信息管理主题 token（Token Playground 导出）
    ├── dark.json             ← 暗色主题 token
    ├── blue.json             ← 蓝色主题 token
    ├── grey.json             ← 灰色主题 token
    └── css-vars-map.js       ← token → CSS Variables 映射 + injectTokenAsCssVars()

修改:
  package.json                ← 锁定 ant-design-vue@4.2.6
  src/App.vue                 ← ConfigProvider 绑定 themeStore.antTheme, 删除无效 cssVar
  src/store/modules/theme.js  ← 加入双通道同步逻辑
  src/assets/styles/themes/themes.less  ← 删除全局 * transition
  src/assets/styles/x6-theme.less       ← @x6-* → CSS Variables

逐步删除（Phase 2-3）:
  src/assets/styles/ant_design_overwrite/
    ├── button.less           ← ConfigProvider token 替代
    ├── input.less            ← ConfigProvider token 替代
    ├── form.less             ← 部分可删
    ├── table.less            ← 部分可删（字体/颜色可走 token）
    ├── tree.less             ← ConfigProvider token 替代
    ├── tabs.less             ← ConfigProvider token 替代
    ├── modal.less            ← 部分可删
    ├── message.less          ← ConfigProvider token 替代
    ├── popover.less          ← ConfigProvider token 替代
    ├── drawer.less           ← ConfigProvider token 替代
    ├── steps.less            ← ConfigProvider token 替代
    ├── collapse.less         ← ConfigProvider token 替代
    └── (保留自定义渐变/背景等无法被 token 替代的部分)

  src/assets/styles/themes/
    ├── default.less          ← 删掉已被 token.json 覆盖的变量
    ├── dark.less             ← 删掉已被 token.json 覆盖的变量（大部分可用 darkAlgorithm 替代）
    ├── blue.less             ← 同上
    └── grey.less             ← 同上
```
