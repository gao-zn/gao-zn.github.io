# token.json 唯一数据源工作流（MasterGo + antd）

> 核心问题: MasterGo 不支持原生 Design Token 变量体系，antd 不暴露 CSS Variables。怎么得到并维护唯一的 `token.json`？

---

## 结论先行: 前端维护 token.json，MasterGo 消费

```
                    ┌─────────────────────────┐
                    │     token.json           │  ← 唯一数据源，存在代码仓库中
                    │  (src/config/theme-tokens/)│     前端维护，版本控制
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Token         │  │ ConfigProvider│  │ MasterGo     │
    │ Playground    │  │ :theme       │  │ 插件导入      │
    │ 可视化编辑     │  │ antd 组件消费  │  │ 生成颜色样式   │
    └──────┬───────┘  └──────────────┘  └──────────────┘
           │
           │ UI 设计师在 Playground 中调整 → 导出 → 提交 token.json
           │ 前端 review token.json diff → 合并 → 全端生效
```

**为什么不是 MasterGo 作为源头？**

MasterGo 无法维护完整的 Token（只有颜色样式，没有字号/圆角/间距/阴影等数字变量）。如果 MasterGo 作为源头，数字型 Token 会丢失。反过来，`token.json` 包含完整 Token → 颜色部分导入 MasterGo 作为样式 → 设计师在 MasterGo 中使用 → 需要修改时通过 Playground 或直接提 PR 改 token.json。

---

## 一、token.json 从哪里来

### 第一步：初始化（一次性）

从 antd 默认值 + 你们现有主题出发，生成第一版 token.json。

**方式 A: 从 Playground 导出（推荐）**

```
1. 打开 Token Playground (http://localhost:5173/#/demo/theme-playground)
2. 预设主题选「默认蓝色」→ 此时已经有你们现有视觉的 token
3. 逐个调整 token 参数，右侧实时预览效果
4. 满意后点「导出 token.json」
5. 把文件放入 src/config/theme-tokens/default.json
6. 切到暗色模式 → 导出 dark.json
7. 调整蓝色主题 → 导出 blue.json
8. 调整灰色主题 → 导出 grey.json
```

**方式 B: 从 antd 默认 SeedToken + 手动调整**

```js
// 在浏览器 console 中运行，导出 antd 默认 token
import { theme } from 'ant-design-vue'
const { defaultAlgorithm, defaultSeed } = theme
const mapToken = defaultAlgorithm(defaultSeed)
console.log(JSON.stringify(mapToken, null, 2))
// 复制输出 → 调整 colorPrimary 等为你们的值 → 保存为 token.json
```

### 第二步：token.json 结构规范

这个 JSON 必须同时满足两个消费方:

```json
{
  "colorPrimary": "#2575F5",
  "colorSuccess": "#52C41A",
  "colorError": "#FF4D4F",
  "colorWarning": "#FAAD14",
  "colorInfo": "#1890FF",

  "colorTextBase": "#000000",
  "colorBgBase": "#FFFFFF",

  "fontFamily": "'FZLanTingHeiS-M-GB', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
  "fontSize": 14,

  "borderRadius": 4,
  "controlHeight": 32,
  "lineWidth": 1,
  "sizeUnit": 4,
  "sizeStep": 4,

  "colorText": "rgba(0,0,0,0.85)",
  "colorTextSecondary": "rgba(0,0,0,0.65)",
  "colorTextTertiary": "rgba(0,0,0,0.45)",
  "colorTextDisabled": "rgba(0,0,0,0.25)",

  "colorBgContainer": "#FFFFFF",
  "colorBgElevated": "#FFFFFF",
  "colorBgLayout": "#F5F5F5",

  "colorBorder": "#D9D9D9",
  "colorBorderSecondary": "#F0F0F0",

  "boxShadow": "0 2px 8px rgba(0,0,0,0.15)",
  "boxShadowSecondary": "0 3px 6px -4px rgba(0,0,0,0.12)",

  "motionUnit": 0.1,
  "motionBase": 0,
  "wireframe": false
}
```

> **注意**: JSON 中的字段名必须与 antd 的 `AliasToken` 接口一致。因为这份 JSON 直接作为 `ConfigProvider :theme="{ token }"` 的输入。字段名不对会导致 Token 不生效。完整可用字段见附录。

---

## 二、MasterGo 如何消费 token.json

### 2.1 插件导入（颜色部分）

使用 MasterGo 社区插件:[「样式导出为CSS / Token导入导出」](https://mastergo.com/community/plugin/82378924950162)

**操作流程**:

```
token.json (仓库中的完整版)
    │
    ▼
提取颜色字段 → 生成 MasterGo 插件格式的 JSON
    │
    ▼
在 MasterGo 中打开插件 → 导入 → 自动创建颜色样式
    │
    ▼
设计师在 MasterGo 中将颜色样式绑定到设计稿
```

**提取脚本**（放在 `scripts/extract-mastergo-tokens.js`）:

```js
// 从 token.json 提取 MasterGo 插件格式
const fs = require('fs')

const token = JSON.parse(fs.readFileSync('./src/config/theme-tokens/default.json', 'utf-8'))

// MasterGo 插件需要的格式: { "样式名": "#色值" }
const mastergoFormat = {}

const colorKeys = [
  'colorPrimary', 'colorSuccess', 'colorWarning', 'colorError', 'colorInfo',
  'colorText', 'colorTextSecondary', 'colorTextTertiary', 'colorTextDisabled',
  'colorBgBase', 'colorBgContainer', 'colorBgElevated', 'colorBgLayout',
  'colorBorder', 'colorBorderSecondary',
]

for (const key of colorKeys) {
  if (token[key]) {
    mastergoFormat[key] = token[key]
  }
}

fs.writeFileSync('./src/config/theme-tokens/mastergo-tokens.json', JSON.stringify(mastergoFormat, null, 2))
console.log('已生成 mastergo-tokens.json，复制内容到 MasterGo 插件导入')
```

运行:

```bash
node scripts/extract-mastergo-tokens.js
# → 生成 src/config/theme-tokens/mastergo-tokens.json
# → 打开这个文件，复制全部内容
# → 在 MasterGo 中打开「样式导出为CSS」插件
# → 粘贴 → 点击「导入Token」
# → MasterGo 自动创建颜色样式
```

### 2.2 数字型 Token 的处理（MasterGo 的硬伤）

间距、字号、圆角这些 Token 在 MasterGo 中没有对应的变量系统。处理方式:

**方案: 文档约定 + 人工遵守**

在 MasterGo 设计稿中用一个专门的「Design Tokens」页面标注:

```
┌─────────────────────────────────────────┐
│  Design Tokens (非颜色)                   │
│                                          │
│  圆角:  4px (小) / 8px (大)              │
│  间距:  4, 8, 12, 16, 24, 32, 48       │
│  字号:  12, 13, 14, 16, 20, 24          │
│  控件高: 24, 28, 32, 40                 │
│  阴影:  见 token.json                   │
│                                          │
│  ⚠️ 设计时请严格使用以上数值，不要随意写   │
└─────────────────────────────────────────┘
```

### 2.3 MasterGo 导出 → 回写 token.json

如果设计师在 MasterGo 中修改了颜色样式，需要同步回 token.json:

```
MasterGo 插件「样式导出为CSS」
    │  导出 → { "colorPrimary": "#00B96B", ... }
    ▼
复制内容
    │
    ▼
Token Playground → 粘贴到「导入 JSON」区域（未来功能）
    或
手动更新 token.json 对应字段
    │
    ▼
git diff → review 变更 → 合并
```

> **建议**: 颜色修改尽量通过 Token Playground 完成（可实时预览效果），而不是在 MasterGo 中改了再回写。Playground 改 → 导出 → 同时更新 token.json 和 MasterGo 样式 — 这条路径更可控。

---

## 三、日常维护流程

### 3.1 新增主题

```
1. Token Playground 中调整参数 → 导出 new-theme.json
2. 放入 src/config/theme-tokens/new-theme.json
3. 运行 extract-mastergo-tokens.js → 导入 MasterGo
4. theme.js store 中注册新主题
5. 提交 PR
```

### 3.2 修改某个 Token 值

```
场景A: UI 设计师发起
  1. 在 Token Playground 中调整 → 导出 token.json
  2. 覆盖对应主题的 JSON 文件
  3. 设计师在 MasterGo 中同步修改颜色样式
  4. 提 PR → 前端 review

场景B: 前端发起
  1. 直接修改 token.json 文件
  2. 运行 extract-mastergo-tokens.js → 通知设计师在 MasterGo 中重新导入
  3. 提 PR
```

### 3.3 token.json 的版本管理

```
src/config/theme-tokens/
├── default.json      ← 信息管理主题（git 追踪）
├── dark.json         ← 暗色主题（git 追踪）
├── blue.json         ← 蓝色主题（git 追踪）
├── grey.json         ← 灰色主题（git 追踪）
├── mastergo-tokens.json  ← 自动生成（.gitignore 排除，每次生成即可）
└── css-vars-map.js   ← 映射表（git 追踪）
```

每次 token.json 变更都会留下 git history，方便回溯。

---

## 四、为什么这个方案是"唯一数据源"

```
                    ┌──────────────┐
                    │  token.json  │  ← 唯一的"真值"
                    │  (Git 追踪)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ConfigProvider    CSS Variables     MasterGo
    antd 组件        自定义组件         颜色样式
    (CSS-in-JS)      (:root 注入)      (插件导入)

    三处消费方，只有一处定义。
    改了 token.json → 三处全部跟随。
    不存在"MasterGo 里改了但代码没改"或反之的情况。
```

对比没有唯一数据源的旧方案:

```
旧方案（三处独立维护）:
  default.less (110行)  →  自定义 CSS Variables
  dark.less (150行)     →  自定义 CSS Variables
  overwrite/*.less (13文件) → antd 组件覆盖
  三者之间没有关联，改一处另外两处不动

新方案（token.json 为唯一源头）:
  token.json (1 个文件, ~30 个字段) → 同时驱动三处
  改 colorPrimary → antd + 自定义 + MasterGo 全部变化
```

---

## 附录: antd AliasToken 完整可用字段

以下字段都可以放入 token.json 并通过 ConfigProvider 生效:

```json
{
  // === 品牌色 ===
  "colorPrimary": "#1677ff",
  "colorSuccess": "#52c41a",
  "colorWarning": "#faad14",
  "colorError": "#ff4d4f",
  "colorInfo": "#1677ff",
  "colorLink": "#1677ff",

  // === 中性色 ===
  "colorText": "rgba(0,0,0,0.88)",
  "colorTextSecondary": "rgba(0,0,0,0.65)",
  "colorTextTertiary": "rgba(0,0,0,0.45)",
  "colorTextQuaternary": "rgba(0,0,0,0.25)",
  "colorTextHeading": "rgba(0,0,0,0.88)",
  "colorTextLabel": "rgba(0,0,0,0.65)",
  "colorTextDescription": "rgba(0,0,0,0.45)",
  "colorTextDisabled": "rgba(0,0,0,0.25)",
  "colorTextPlaceholder": "rgba(0,0,0,0.25)",
  "colorTextLightSolid": "#fff",

  "colorBgBase": "#fff",
  "colorBgContainer": "#fff",
  "colorBgElevated": "#fff",
  "colorBgLayout": "#f5f5f5",
  "colorBgSpotlight": "rgba(0,0,0,0.85)",
  "colorBgMask": "rgba(0,0,0,0.45)",

  "colorBorder": "#d9d9d9",
  "colorBorderSecondary": "#f0f0f0",

  "colorFill": "rgba(0,0,0,0.15)",
  "colorFillSecondary": "rgba(0,0,0,0.06)",
  "colorFillTertiary": "rgba(0,0,0,0.04)",

  // === 尺寸 ===
  "borderRadius": 6,
  "borderRadiusLG": 8,
  "borderRadiusSM": 4,
  "borderRadiusXS": 2,

  "controlHeight": 32,
  "controlHeightLG": 40,
  "controlHeightSM": 24,
  "controlHeightXS": 16,

  "lineWidth": 1,
  "lineWidthBold": 2,

  "size": 16,
  "sizeLG": 24,
  "sizeSM": 12,
  "sizeXS": 8,
  "sizeXXS": 4,
  "sizePopupArrow": 16,

  "padding": 16,
  "paddingLG": 24,
  "paddingSM": 12,
  "paddingXS": 8,
  "paddingXXS": 4,
  "paddingContentHorizontal": 16,
  "paddingContentVertical": 12,

  "margin": 16,
  "marginLG": 24,
  "marginSM": 12,
  "marginXS": 8,
  "marginXXS": 4,

  // === 字体 ===
  "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "fontFamilyCode": "'SFMono-Regular', Consolas, monospace",
  "fontSize": 14,
  "fontSizeLG": 16,
  "fontSizeSM": 12,
  "fontSizeXL": 20,
  "fontSizeHeading1": 38,
  "fontSizeHeading2": 30,
  "fontSizeHeading3": 24,
  "fontSizeHeading4": 20,
  "fontSizeHeading5": 16,
  "fontSizeIcon": 12,
  "fontWeightStrong": 600,
  "lineHeight": 1.5714285714285714,
  "lineHeightLG": 1.5,
  "lineHeightSM": 1.6666666666666667,
  "lineHeightHeading1": 1.2105263157894737,
  "lineHeightHeading2": 1.2666666666666666,
  "lineHeightHeading3": 1.3333333333333333,
  "lineHeightHeading4": 1.4,
  "lineHeightHeading5": 1.5,

  // === 阴影 ===
  "boxShadow": "0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), ...",
  "boxShadowSecondary": "0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), ...",

  // === 动效 ===
  "motionDurationFast": "0.1s",
  "motionDurationMid": "0.2s",
  "motionDurationSlow": "0.3s",

  // === 其他 ===
  "wireframe": false,
  "opacityLoading": 0.65
}
```

> **建议**: token.json 中只放你需要覆盖的字段，不需要全部列出来。未列出的字段 antd 会使用默认值。
