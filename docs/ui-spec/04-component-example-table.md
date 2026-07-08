# 04. 表格 Table（完整示例）

> **组件路径**: `@company/ui/BasicTable`  
> **底层依赖**: ant-design-vue `a-table`  
> **设计稿 Figma 链接**: `[待 UI 补充]`  
> **关联组件**: BasicForm（搜索区）、BasicModal（新增/编辑弹窗）、Pagination（分页器）

---

## 一、使用规则

| 使用场景 | 不使用场景 |
|----------|-----------|
| 展示结构化、行列格式的数据 | 数据为非结构化内容（用列表/卡片） |
| 需要排序、筛选、多选等数据操作 | 仅展示少量字段，无操作需求（用描述列表） |
| 需要对比多个数据维度的场景 | 数据更适合用图表表达（用图表组件） |
| 数据量较大需要分页 | 数据在 10 条以内且无分页需求（用简易列表） |

---

## 二、组成要素

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐ ┌──────────┐ ┌──┐ ┌──┐        │
│  │  搜索区 (查询条件 + 按钮)     │ │ 新增  删除 │ │列设置│ │导出│        │  ← 工具栏区
│  └─────────────────────────────┘ └──────────┘ └──┘ └──┘        │
│                                                                  │
│  ┌────┬──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ ☐  │ 名称  ↑↓ │ 状态     │ 创建时间  │ 负责人    │ 操作     │  │  ← 表头
│  ├────┼──────────┼──────────┼──────────┼──────────┼──────────┤  │
│  │ ☐  │ 数据1    │ ● 运行中  │ 2024-01-01│ 张三     │ 编辑 删除│  │  ← 数据行
│  │ ☐  │ 数据2    │ ○ 已停止  │ 2024-01-02│ 李四     │ 编辑 删除│  │
│  │ ☐  │ 数据3    │ ● 运行中  │ 2024-01-03│ 王五     │ 编辑 删除│  │
│  └────┴──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                                  │
│  共 100 条记录  10条/页  [1] [2] [3] ... [10]  跳至 [__] 页     │  ← 分页器
└──────────────────────────────────────────────────────────────────┘
```

| 序号 | 要素名称 | 说明 | 是否必选 |
|------|---------|------|---------|
| 1 | **搜索区** | 可选，表单查询条件 + 查询/重置按钮，可折叠 | 可选 |
| 2 | **工具栏** | 批量操作按钮（新增、删除、导出等）+ 列设置 + 密度切换 | 可选 |
| 3 | **表头** | 列标题 + 排序图标 + 必填标识 + 提示图标 | 必选 |
| 4 | **复选框列** | 多选时出现，支持全选/半选 | 可选 |
| 5 | **序号列** | 自动编号，支持分页后连续编号 | 可选 |
| 6 | **数据行** | 每行一条记录 | 必选 |
| 7 | **操作列** | 每行的操作按钮（编辑、删除、详情等），固定在右侧 | 可选 |
| 8 | **分页器** | 页码切换 + 每页条数 + 跳转 + 总数展示 | 条件必选（数据超过 1 页时） |

---

## 三、尺寸规格

### 3.1 表格密度

| 密度 | Token | 行高 | 表头行高 | 单元格 padding-vertical | 字号 | 适用场景 |
|------|-------|------|---------|------------------------|------|---------|
| **Compact**（紧凑） | `density.compact` | `36px` | `36px` | `--spacing-xs` (`4px`) | `--font-size-sm` | 数据密集的后台管理系统 |
| **Default**（默认） | `density.default` | `44px` | `44px` | `--spacing-sm` (`8px`) | `--font-size-base` | **默认**，标准后台 |
| **Comfortable**（宽松） | `density.comfortable` | `52px` | `52px` | `--spacing-md` (`12px`) | `--font-size-base` | 数据量少、强调可读性 |

### 3.2 列宽建议

| 列类型 | 默认宽度 | 最小宽度 | 最大宽度 | 超出处理 |
|--------|---------|---------|---------|---------|
| 复选框列 | `48px` | `48px` | `48px` | 固定 |
| 序号列 | `60px` | `60px` | `80px` | 固定 |
| 普通文本列 | `120px` | `80px` | `300px` | 省略号 |
| 状态标签列 | `100px` | `80px` | `150px` | — |
| 时间日期列 | `160px` | `140px` | `200px` | — |
| 操作列 | `根据按钮数量自适应` | `80px` | `240px` | 固定右侧 |

---

## 四、状态矩阵（⚠️ 核心交付物）

### 4.1 表头

| 状态 | 背景色 | 文字色 | 字重 | 边框 | 排序图标颜色 |
|------|--------|--------|------|------|------------|
| **Default** | `--color-bg-container` 或浅灰（取决于主题） | `--color-text-primary` | `--font-weight-medium` | `--color-border-split` (下边框) | `--color-text-tertiary` |
| **Hover（可排序列）** | 同 Default | 同 Default | 同 Default | 同 Default | `--color-text-secondary` |
| **Sorting（排序中）** | 同 Default | `--color-primary` | 同 Default | 同 Default | `--color-primary` |
| **Fixed（固定列）** | 同 Default + 右侧阴影 | 同 Default | 同 Default | 同 Default | — |

> **Default 背景色**: Light → `#FAFAFA`, Dark → `#1F1F1F`

### 4.2 数据行

| 状态 | 背景色 | 文字色 | 边框 |
|------|--------|--------|------|
| **Default（奇数行）** | `--color-bg-container` | `--color-text-primary` | `--color-border-split` (下边框) |
| **Default（偶数行 - 斑马纹）** | `--color-bg-container` 稍微加深 | `--color-text-primary` | `--color-border-split` |
| **Hover** | `--color-primary-bg` 或浅灰 | `--color-text-primary` | 同 Default |
| **Selected（选中）** | `--color-primary-bg` | `--color-text-primary` | 同 Default |
| **Active（点击）** | 比 Selected 稍深 | `--color-text-primary` | 同 Default |
| **Expanded（展开行）** | 同 Selected | `--color-text-primary` | 同 Default |
| **Disabled（禁用行）** | 同 Default | `--color-text-disabled` | 同 Default |

> **斑马纹**: Light → `#FAFAFA`, Dark → `#1A1A1A`  
> **Hover**: Light → `#F5F5F5`, Dark → `#262626`  
> **Selected**: Light → `#EBF2FE` (`--color-primary-bg`), Dark → `#1A2840`

### 4.3 复选框

| 状态 | 边框色 | 背景色 | 勾选图标色 |
|------|--------|--------|-----------|
| **Unchecked** | `--color-border-base` | `--color-bg-container` | — |
| **Unchecked Hover** | `--color-primary` | `--color-bg-container` | — |
| **Checked** | `--color-primary` | `--color-primary` | `--color-text-inverse` |
| **Checked Hover** | `--color-primary-hover` | `--color-primary-hover` | `--color-text-inverse` |
| **Indeterminate（半选）** | `--color-primary` | `--color-primary` | `--color-text-inverse`（横线） |
| **Disabled** | `--color-border-base` | `--color-bg-container` | `--color-text-disabled` |

### 4.4 工具栏按钮

| 按钮类型 | Token | Default | Hover | Active | Disabled |
|---------|-------|---------|-------|--------|----------|
| **主按钮**（新增） | — | `bg: --color-primary` `text: white` | `bg: --color-primary-hover` | `bg: --color-primary-active` | `bg: --color-primary-disabled` |
| **默认按钮**（导出） | — | `bg: white` `border: --color-border-base` | `border: --color-primary` `text: --color-primary` | `border: --color-primary-active` | `text: --color-text-disabled` |
| **危险按钮**（批量删除） | — | `text: --color-danger` | `bg: --color-danger-bg` | — | `text: --color-text-disabled` |
| **文字按钮**（操作列） | — | `text: --color-primary` | `text: --color-primary-hover` | `text: --color-primary-active` | `text: --color-text-disabled` |

### 4.5 空状态

| 场景 | 视觉描述 |
|------|---------|
| **无数据** | 居中展示空状态插图 + `暂无数据` 文字 |
| **搜索无结果** | 插图 + `未找到符合条件的结果` + `清除筛选条件` 链接 |
| **接口报错** | 插图 + `数据加载失败` + `重新加载` 按钮 |
| **无权限** | 插图 + `暂无访问权限，请联系管理员` |

---

## 五、通用样式规则

| 属性 | Token 变量 | 值 |
|------|-----------|-----|
| 表格外边框 | `--color-border-base` | — |
| 表格圆角 | `--radius-base` | `4px` |
| 表头与数据行分割线 | `--color-border-split` | — |
| 行分割线 | `--color-border-split` | — |
| 单元格水平内边距 | `--spacing-lg` | `16px` |
| 表头 sticky 顶部阴影 | 自定义 | `0 2px 8px rgba(0,0,0,0.06)` |
| 固定列右侧阴影 | 自定义 | `box-shadow: -6px 0 16px -8px rgba(0,0,0,0.08)` |
| 搜索区与表格间距 | `--spacing-md` | `12px` |
| 工具栏与表格间距 | `--spacing-sm` | `8px` |
| 分页器与表格间距 | `--spacing-lg` | `16px` |
| 分页器内元素间距 | `--spacing-sm` | `8px` |

---

## 六、可编辑表格（Editable Cell）

当表格支持单元格编辑时，额外需要以下规范:

### 6.1 编辑态单元格

| 组件类型 | 嵌入后高度 | 对齐方式 | 说明 |
|---------|-----------|---------|------|
| Input（文本输入） | 与行高一致 | 左对齐 | 替换原文本为输入框 |
| Select（下拉选择） | 与行高一致 | 左对齐 | 替换原文本为选择器 |
| InputNumber（数字输入） | 与行高一致 | 右对齐 | 替换原文本为数字输入框 |
| DatePicker（日期选择） | 与行高一致 | 居中 | 替换原文本为日期选择器 |
| Switch（开关） | 居中 | 居中 | 替换原文本为开关 |
| Checkbox（复选框） | 居中 | 居中 | 替换原文本为单个复选框 |

### 6.2 编辑态交互

| 交互 | 说明 |
|------|------|
| 进入编辑 | 双击单元格 / 点击编辑图标 进入编辑态 |
| 退出编辑 | 点击其他单元格 / 按 Esc / 按 Enter 退出 |
| 校验失败 | 红色边框 + 单元格下方红色错误提示 |
| 保存中 | 单元格右侧显示 Loading 图标 |
| 保存失败 | 单元格红色闪烁 + Tooltip 提示错误原因 |

---

## 七、排序 / 筛选 / 列设置

### 7.1 排序

| 状态 | 图标 | 颜色 |
|------|------|------|
| 不可排序 | 无 | — |
| 可排序 - 默认 | `CaretUpOutlined` + `CaretDownOutlined` 上下排列 | `--color-text-tertiary` |
| 升序中 | `CaretUpOutlined` 高亮 | `--color-primary` |
| 降序中 | `CaretDownOutlined` 高亮 | `--color-primary` |

### 7.2 列设置

| 属性 | 规范 |
|------|------|
| 触发图标 | 齿轮图标 `SettingOutlined`，尺寸 `16px` |
| 弹出面板 | `--shadow-base` 阴影，宽度 `200px`，圆角 `--radius-base` |
| 面板结构 | 标题 "列设置" + Checkbox 列表（10 列内单列，超过 10 列双列展示） |
| 操作列 | 不可取消勾选（始终显示） |
| 重置按钮 | 面板底部"重置为默认"文字按钮 |

---

## 八、超长 / 边界情况处理

| 场景 | 处理规则 |
|------|---------|
| **列宽总和超出容器** | 出现水平滚动条，操作列固定在右侧 |
| **单元格文本超长** | `text-overflow: ellipsis` + `white-space: nowrap`，hover 气泡展示完整内容 |
| **数据条数为 0** | 展示空状态，不展示分页器 |
| **全屏 Loading** | 首次加载时显示全屏 Spin |
| **翻页 Loading** | 表格区域半透明遮罩 + Spin（不遮挡表头） |
| **行高不固定** | 关闭斑马纹，使用 `--color-border-split` 分割线 |
| **固定表头** | 表头 sticky 在顶部，滚动时显示底部阴影 |
| **移动端** | 表格转为卡片列表展示（responsive 断点 `768px`） |

---

## 九、亮色 / 暗色双主题对比

| 场景 | Light 截图 | Dark 截图 |
|------|-----------|-----------|
| 默认（含数据 + 斑马纹） | `[待 UI 补充]` | `[待 UI 补充]` |
| 行 Hover | `[待 UI 补充]` | `[待 UI 补充]` |
| 行选中 | `[待 UI 补充]` | `[待 UI 补充]` |
| 搜索区展开 | `[待 UI 补充]` | `[待 UI 补充]` |
| 空状态 | `[待 UI 补充]` | `[待 UI 补充]` |
| Loading 态 | `[待 UI 补充]` | `[待 UI 补充]` |
| 列设置面板 | `[待 UI 补充]` | `[待 UI 补充]` |
| 可编辑单元格 | `[待 UI 补充]` | `[待 UI 补充]` |

---

## 十、前端实现注意事项

| 序号 | 注意事项 |
|------|---------|
| 1 | ant-design-vue `a-table` 自带斑马纹不支持自定义颜色，需通过 `rowClassName` + CSS 覆盖 |
| 2 | 表头 sticky 需要设置 `scroll.x` 和 `scroll.y`，且父容器必须有确定高度 |
| 3 | 可编辑表格的性能：超过 50 行不建议全部渲染为编辑组件，考虑懒加载编辑态 |
| 4 | 搜索区折叠/展开需要与 BasicForm 组件联动 |
| 5 | 暗色主题下斑马纹对比度极低（`#1A1A1A` vs `#1F1F1F`），建议调整为更明显的色差 |
| 6 | 操作列的"固定右侧"在列数较少（< 3 列）时建议不固定，避免视觉上割裂 |
