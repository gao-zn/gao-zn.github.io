# 01. Design Tokens（设计令牌）

> **交付说明**: 这是 UI 设计师需要交付的第一份文档。要求用设计工具导出 JSON，前端直接映射为 CSS Variables。  
> **交付格式**: Token JSON + 本表格（标注 Token 名称和用途）  
> **主题要求**: 至少包含 default（亮色）和 dark（暗色）两套

---

## ⚠️ 设计工具兼容说明

根据实际使用的设计工具选择对应方案：

| 设计工具 | 颜色 Token | 间距/字号 Token | 多主题切换 | 推荐方案 |
|---------|-----------|----------------|-----------|---------|
| **Figma** | ✅ Variables 原生 | ✅ Variables 原生 | ✅ Mode 切换 | Figma Variables → [Token Studio](https://tokens.studio/) 插件导出 JSON |
| **MasterGo** | ✅ 原生颜色样式 | ❌ 不支持数字变量 | ❌ 插件模拟 | 见下方「MasterGo 对接方案」 |
| **Pixso** | ✅ 支持 | ⚠️ 部分支持 | ⚠️ | Figma 迁移优先 |

### MasterGo 对接方案

MasterGo 原生只支持样式变量，Token 体系通过 **社区插件 + JSON 文件** 双向同步：

```
                token.json（单一数据源）
               ┌───────┴───────┐
               ▼               ▼
      前端脚本转 CSS        MasterGo 插件导入
      Variables 注入       → 「样式导出为CSS」
      到项目全局样式          插件自动创建颜色样式
```

**插件**: [样式导出为CSS / Token导入导出](https://mastergo.com/community/plugin/82378924950162)

**操作流程**:
1. 前端根据本文档维护一份 `token.json`（只含颜色，间距字号走约定）
2. UI 设计师在 MasterGo 中通过插件导入 `token.json` → 自动创建颜色样式
3. 颜色样式在 MasterGo 中绑定到设计稿
4. UI 修改颜色后，通过插件导出 → 覆盖 `token.json`
5. 前端 diff `token.json` 变更 → 更新 CSS Variables
6. **间距和字号**因 MasterGo 不支持数字变量，走人工约定：UI 在标注中写 `--spacing-md`，前端按本文档数值实现

---

## 1.1 颜色系统（Color）

### 1.1.1 品牌色 / 功能色

| CSS Variable | Token 名称 | 用途 | Default (亮色) | Dark (暗色) |
|-------------|-----------|------|---------------|------------|
| `--color-primary` | `color.primary` | 主色：主要按钮、链接、选中态 | `#2575F5` | `#4D94F5` |
| `--color-primary-hover` | `color.primaryHover` | 主色悬浮 | `#3D85F7` | `#6BA6F7` |
| `--color-primary-active` | `color.primaryActive` | 主色点击 | `#1A5FCF` | `#3D85F7` |
| `--color-primary-bg` | `color.primaryBg` | 主色浅底（选中行背景等） | `#EBF2FE` | `#1A2840` |
| `--color-primary-disabled` | `color.primaryDisabled` | 主色禁用 | `#A3C6FA` | `#3D5273` |
| `--color-success` | `color.success` | 成功：成功提示、通过状态 | `#52C41A` | `#6CD932` |
| `--color-success-bg` | `color.successBg` | 成功浅底 | `#F0FAE8` | `#1A3010` |
| `--color-warning` | `color.warning` | 警告：警告提示 | `#FAAD14` | `#F0B832` |
| `--color-warning-bg` | `color.warningBg` | 警告浅底 | `#FFF8E6` | `#302810` |
| `--color-danger` | `color.danger` | 危险：删除按钮、错误状态 | `#FF4D4F` | `#F26669` |
| `--color-danger-bg` | `color.dangerBg` | 危险浅底 | `#FFF0F0` | `#301010` |
| `--color-info` | `color.info` | 信息：信息提示 | `#1890FF` | `#3DA0FF` |
| `--color-info-bg` | `color.infoBg` | 信息浅底 | `#EBF6FF` | `#102840` |

### 1.1.2 中性色（文字/背景/边框）

| CSS Variable | Token 名称 | 用途 | Default (亮色) | Dark (暗色) |
|-------------|-----------|------|---------------|------------|
| `--color-text-primary` | `color.textPrimary` | 主要文字 | `#262626` | `#E8E8E8` |
| `--color-text-secondary` | `color.textSecondary` | 次要文字、描述文字 | `#595959` | `#A6A6A6` |
| `--color-text-tertiary` | `color.textTertiary` | 辅助文字、placeholder | `#BFBFBF` | `#666666` |
| `--color-text-disabled` | `color.textDisabled` | 禁用文字 | `#D9D9D9` | `#4D4D4D` |
| `--color-text-inverse` | `color.textInverse` | 反色文字（深底白字） | `#FFFFFF` | `#1A1A1A` |
| `--color-bg-base` | `color.bgBase` | 页面底色 | `#F5F5F5` | `#0D0D0D` |
| `--color-bg-container` | `color.bgContainer` | 容器背景（卡片、表格、弹窗） | `#FFFFFF` | `#1A1A1A` |
| `--color-bg-elevated` | `color.bgElevated` | 浮层背景（下拉菜单、气泡） | `#FFFFFF` | `#262626` |
| `--color-bg-mask` | `color.bgMask` | 遮罩层 | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.65)` |
| `--color-border-base` | `color.borderBase` | 默认边框 | `#D9D9D9` | `#404040` |
| `--color-border-split` | `color.borderSplit` | 分割线（表格行线等） | `#F0F0F0` | `#2E2E2E` |
| `--color-border-light` | `color.borderLight` | 浅色边框 | `#F5F5F5` | `#262626` |

### 1.1.3 数据可视化色板（图表专用）

| CSS Variable | Token 名称 | 色值 |
|-------------|-----------|------|
| `--color-chart-1` | `color.chart.1` | `#2575F5` |
| `--color-chart-2` | `color.chart.2` | `#52C41A` |
| `--color-chart-3` | `color.chart.3` | `#FAAD14` |
| `--color-chart-4` | `color.chart.4` | `#FF4D4F` |
| `--color-chart-5` | `color.chart.5` | `#722ED1` |
| `--color-chart-6` | `color.chart.6` | `#13C2C2` |
| `--color-chart-7` | `color.chart.7` | `#EB2F96` |
| `--color-chart-8` | `color.chart.8` | `#FA8C16` |

---

## 1.2 字体系统（Typography）

### 1.2.1 字号

| CSS Variable | Token 名称 | 字号 | 行高 | 用途 |
|-------------|-----------|------|------|------|
| `--font-size-xs` | `fontSize.xs` | `12px` | `20px` | 标签、辅助说明、badge |
| `--font-size-sm` | `fontSize.sm` | `13px` | `22px` | 表单 label、表格内容 |
| `--font-size-base` | `fontSize.base` | `14px` | `22px` | 正文、按钮、输入框、下拉选项 |
| `--font-size-lg` | `fontSize.lg` | `16px` | `24px` | 小标题、卡片标题 |
| `--font-size-xl` | `fontSize.xl` | `20px` | `28px` | 弹窗标题、页面标题 |
| `--font-size-xxl` | `fontSize.xxl` | `24px` | `32px` | 页面大标题 |
| `--font-size-display` | `fontSize.display` | `32px` | `40px` | 数字展示（统计卡片） |

### 1.2.2 字重

| CSS Variable | Token 名称 | 值 | 用途 |
|-------------|-----------|-----|------|
| `--font-weight-regular` | `fontWeight.regular` | `400` | 正文 |
| `--font-weight-medium` | `fontWeight.medium` | `500` | 加粗文字、表头 |
| `--font-weight-semibold` | `fontWeight.semibold` | `600` | 标题 |
| `--font-weight-bold` | `fontWeight.bold` | `700` | 强调数据 |

### 1.2.3 字族

| CSS Variable | Token 名称 | 值 |
|-------------|-----------|-----|
| `--font-family-base` | `fontFamily.base` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif` |
| `--font-family-code` | `fontFamily.code` | `'SF Mono', 'Cascadia Code', 'Consolas', 'Menlo', monospace` |

---

## 1.3 间距系统（Spacing）

> **原则**: 所有间距必须是 4px 的倍数

| CSS Variable | Token 名称 | 值 | 用途 |
|-------------|-----------|-----|------|
| `--spacing-xxs` | `spacing.xxs` | `2px` | 极小间距（图标与文字紧贴） |
| `--spacing-xs` | `spacing.xs` | `4px` | 文字与分割符（面包屑） |
| `--spacing-sm` | `spacing.sm` | `8px` | 组件内部间距、label 与 input |
| `--spacing-md` | `spacing.md` | `12px` | 按钮组间距、表单行间距 |
| `--spacing-lg` | `spacing.lg` | `16px` | 卡片内边距、弹窗内容区 |
| `--spacing-xl` | `spacing.xl` | `24px` | 栅格间距、卡片间距 |
| `--spacing-xxl` | `spacing.xxl` | `32px` | 大区块间距 |
| `--spacing-xxxl` | `spacing.xxxl` | `48px` | 页面级区块间距 |

---

## 1.4 圆角系统（Border Radius）

| CSS Variable | Token 名称 | 值 | 用途 |
|-------------|-----------|-----|------|
| `--radius-none` | `radius.none` | `0` | 表格（直角风格时） |
| `--radius-sm` | `radius.sm` | `2px` | 小型元素（Tag、Badge） |
| `--radius-base` | `radius.base` | `4px` | 输入框、选择器、按钮 |
| `--radius-lg` | `radius.lg` | `8px` | 卡片、面板、弹窗 |
| `--radius-round` | `radius.round` | `9999px` | 胶囊按钮、头像 |

---

## 1.5 阴影系统（Shadow）

| CSS Variable | Token 名称 | 值 | 用途 |
|-------------|-----------|-----|------|
| `--shadow-none` | `shadow.none` | `none` | 默认 |
| `--shadow-sm` | `shadow.sm` | `0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)` | 卡片、表格行悬浮 |
| `--shadow-base` | `shadow.base` | `0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05)` | 下拉面板、气泡 |
| `--shadow-lg` | `shadow.lg` | `0 6px 16px -8px rgba(0,0,0,0.12), 0 9px 28px 0 rgba(0,0,0,0.08), 0 12px 48px 16px rgba(0,0,0,0.05)` | 弹窗、抽屉 |
| `--shadow-drawer-left` | `shadow.drawerLeft` | `-6px 0 16px -8px rgba(0,0,0,0.08), -9px 0 28px 0 rgba(0,0,0,0.05)` | 左侧抽屉 |

---

## 1.6 组件尺寸体系（Size）

| CSS Variable | Token 名称 | 高度 | 用途 |
|-------------|-----------|------|------|
| `--size-control-xs` | `size.control.xs` | `24px` | 紧凑型输入框/按钮 |
| `--size-control-sm` | `size.control.sm` | `28px` | 小型输入框/按钮 |
| `--size-control-base` | `size.control.base` | `32px` | 默认输入框/按钮/选择器 |
| `--size-control-lg` | `size.control.lg` | `40px` | 大型输入框/按钮 |

---

## 1.7 Figma Variables → 前端映射规则

UI 设计师在 Figma 中的变量命名应与 CS Tokens 一致，前端收到 JSON 后做如下转换:

```json
// Figma Variables 导出示例 (JSON)
{
  "color": {
    "primary": { "$type": "color", "$value": { "hex": "#2575F5" } },
    "primaryHover": { "$type": "color", "$value": { "hex": "#3D85F7" } }
  }
}
```

```css
/* 前端注入为 CSS Variables */
:root {
  --color-primary: #2575F5;
  --color-primary-hover: #3D85F7;
}

/* 暗色主题 */
[data-theme='dark'] {
  --color-primary: #4D94F5;
  --color-primary-hover: #6BA6F7;
}
```

```typescript
// 前端组件中使用
// ❌ 禁止: color: #2575f5;
// ✅ 必须: color: var(--color-primary);
```

---

## 1.8 UI 设计师交付物

| 序号 | 交付物 | 格式 | 说明 |
|------|--------|------|------|
| 1 | 本表格完整填写 | Markdown | 每个 Token 填写 light + dark 两列值 |
| 2 | Figma Variables 导出 | JSON | 可直接通过脚本转为 CSS Variables |
| 3 | Figma 色彩板页面 | Figma 链接 | 展示所有色值在 UI 中的实际效果 |
| 4 | 字体层级展示页 | Figma 链接 | 展示所有字号 + 行高 + 字重的组合效果 |
