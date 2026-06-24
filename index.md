# 内部开发集成 MCP 组件 — 智能体快速开发集成框架 可行性分析方案

> 项目：DataCenterPlatform-II  
> 日期：2026-06-24  
> 目标：构建基于 MCP（Model Context Protocol）的智能体工具链，打通「原型需求 → Figma 设计稿 → 前端开发 → 后端开发 → 接口联调」全链路

---

## 一、核心理念

### 1.1 目标

构建一套 **MCP Server 工具链**，让 AI 智能体（Claude Code / Cursor / 自定义 Agent）能够：

1. **理解设计稿** — 从 Figma 自动提取页面结构、组件、设计 Token
2. **映射项目模式** — 将设计元素自动映射到项目现有的组件和代码模式
3. **生成规范代码** — 按项目约定生成 API 层、页面组件、路由、Store
4. **对接后端接口** — 解析 Swagger/YApi 文档，生成 API 调用代码和 Mock
5. **验证完整性** — 自动校验前后端接口一致性、代码规范、设计还原度

### 1.2 全链路打通

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 原型需求  │───→│ Figma    │───→│ 前端代码  │───→│ 后端接口  │───→│ 联调验证  │
│          │    │ 设计稿    │    │ 生成      │    │ 对接      │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     └───────────────┴───────────────┴───────────────┴───────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │     MCP 智能体集成层         │
                    │  (AI Agent 统一编排调度)     │
                    └─────────────┬──────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     ┌────────┴────────┐ ┌───────┴───────┐ ┌────────┴────────┐
     │   共享知识库      │ │   代码模板库   │ │   项目规范库     │
     │  (组件映射/API)   │ │  (CRUD/表单)  │ │  (CLAUDE.md)    │
     └─────────────────┘ └───────────────┘ └─────────────────┘
```

---

## 二、项目现有模式分析（自动化基础）

### 2.1 CRUD 页面标准架构

项目已形成高度标准化的 CRUD 开发模式，这是 MCP 自动化的核心基础：

```
┌─────────────────────────────────────────────────────────┐
│  SearchTable（高阶组件 - 位于 src/views/label-center/    │
│            components/searchTable.vue）                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  BasicForm（搜索区）                               │  │
│  │  ← searchSchema 数组驱动，component 字段映射组件    │  │
│  │  ← 支持: text/select/cascader/treeselect/datetime  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  BasicTable（数据区）                               │  │
│  │  ← columns 数组驱动，apiConfig.data 获取数据        │  │
│  │  ← operationBtns 控制表头/行按钮                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ModalForm（新增/编辑）                             │  │
│  │  ← modelConfig 控制弹窗尺寸/标题                   │  │
│  │  ← formSchema 驱动表单项                          │  │
│  │  ← apiConfig.add / apiConfig.update 提交数据       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  BasicModal + VerticalInfo（详情）                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心配置对象（MCP 自动生成的抽象层）

这些配置对象就是 AI 智能体的**生成目标**：

| 配置对象 | 职责 | 来源映射 |
|---------|------|----------|
| `searchSchema` | 搜索表单字段定义 | Figma 搜索区 → 字段类型映射 |
| `columns` | 表格列定义 | Figma 表格区 → 列配置映射 |
| `apiConfig` | CRUD API 端点 + 数据处理 | 后端接口文档 → API 方法映射 |
| `formSchema` | 新增/编辑表单字段 | Figma 表单弹窗 → 表单组件映射 |
| `modelConfig` | 弹窗配置 | Figma 弹窗尺寸 → 配置对象 |
| `operationBtns` | 操作按钮 | Figma 按钮区 → 按钮配置 |

### 2.3 API 层标准模式

```js
// 固定导入
import { defHttp } from '@/utils/axios'

// 统一方法签名
export function getXxx(params)   → defHttp.get({ url: '/path', params })
export function addXxx(params)   → defHttp.post({ url: '/path', params })
export function updateXxx(params) → defHttp.put({ url: '/path', params })
export function deleteXxx(id)    → defHttp.delete({ url: '/path/' + id })
```

### 2.4 Figma → 项目组件映射表

| Figma 元素类型 | 项目组件 | 组件来源 | schema.component 值 |
|---------------|---------|---------|-------------------|
| 文本输入框 | `a-input` | ant-design-vue | `'text'` |
| 多行文本 | `a-textarea` | ant-design-vue | `'textarea'` |
| 下拉选择 | `a-select` | ant-design-vue | `'select'` |
| 级联选择 | `a-cascader` | ant-design-vue | `'cascader'` |
| 树选择 | `a-tree-select` | ant-design-vue | `'treeselect'` |
| 日期时间 | `a-date-picker` | ant-design-vue | `'datetime'` |
| 日期范围 | `a-range-picker` | ant-design-vue | `'daterange'` |
| 开关 | `a-switch` | ant-design-vue | `'switch'` |
| 单选框 | `a-radio-group` | ant-design-vue | `'radio'` |
| 多选框 | `a-checkbox-group` | ant-design-vue | `'checkbox'` |
| Cron 表达式 | `CronExpression` | 自定义 | `'cron'` |
| 标签选择 | `tagSelect` | 标签中心组件 | `'tagSelect'` |
| 颜色选择 | `vue3-colorpicker` | 第三方 | `'colors'` |
| 数据图标 | `DataIcon` | 自定义 | `'dataIcon'` |

---

## 三、MCP Server 架构设计

### 3.1 五大 MCP Server

```
AI Agent (Claude/Cursor/自定义)
      │
      │  MCP 协议 (JSON-RPC)
      │
      ├────────────── Figma MCP Server ──────────────────
      │               提取设计结构、组件、Token
      │
      ├────────────── Requirements MCP Server ───────────
      │               解析 PRD/需求文档
      │
      ├────────────── Code Generator MCP Server ─────────
      │               生成代码（核心 Server）
      │
      ├────────────── API Integration MCP Server ────────
      │               解析接口文档、生成 Mock
      │
      └────────────── Validation MCP Server ─────────────
                      验证设计与代码一致性
```

### 3.2 MCP Server 1: Figma Design Server

**职责**：从 Figma 设计稿提取结构化设计信息，映射到项目组件

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| `extract_page_structure` | 提取页面整体布局 | Figma File Key + Node ID | 布局树 JSON |
| `extract_form_fields` | 提取表单字段列表 | 表单区域 Node ID | 字段数组 |
| `extract_table_columns` | 提取表格列定义 | 表格区域 Node ID | 列配置数组 |
| `extract_buttons` | 提取按钮定义 | 按钮区域 Node ID | 按钮配置数组 |
| `extract_design_tokens` | 提取设计 Token | Figma File Key | 颜色/间距/字体/圆角 |
| `map_to_project_components` | 映射到项目组件 | 设计元素列表 | 项目组件 + Props |
| `get_screenshot` | 获取节点截图 | Node ID | Base64 图片 |

**技术实现**：

```
方案一（推荐）：Figma REST API
  GET https://api.figma.com/v1/files/{file_key}/nodes?ids={node_id}
  → 返回节点树（类型、尺寸、颜色、文本、子节点）
  → 递归遍历，根据 layer 命名和类型识别 UI 元素

方案二（备选）：Figma Plugin
  在 Figma 内部运行 Plugin，导出结构化 JSON
  优势：权限不受限，可自定义导出格式

方案三（轻量）：截图 + Vision AI
  截取 Figma 页面 → 视觉模型识别 UI 元素
  优势：不依赖 Figma API，但精度较低
```

**关键实现逻辑**：

```javascript
// figma-mcp-server/src/tools/extract-page-structure.js
export async function extractPageStructure(fileKey, nodeId, accessToken) {
  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
    { headers: { 'X-Figma-Token': accessToken } }
  )
  const data = await response.json()
  const node = data.nodes[nodeId].document

  // 递归分析节点树
  function analyzeNode(node) {
    const result = {
      id: node.id,
      name: node.name,
      type: node.type,        // FRAME, TEXT, RECTANGLE, INSTANCE...
      children: []
    }

    // 根据命名约定识别功能区域
    if (/搜索|search|filter/i.test(node.name)) {
      result.functionalArea = 'search'
    } else if (/表格|table|datagrid/i.test(node.name)) {
      result.functionalArea = 'table'
    } else if (/新建|新增|编辑|modal|dialog/i.test(node.name)) {
      result.functionalArea = 'modal'
    } else if (/按钮|button/i.test(node.name)) {
      result.functionalArea = 'buttons'
    }

    if (node.children) {
      result.children = node.children.map(analyzeNode)
    }
    return result
  }

  return analyzeNode(node)
}
```

### 3.3 MCP Server 2: Requirements Parser Server

**职责**：解析需求文档/原型，提取数据模型和业务逻辑

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| `parse_prd` | 解析 PRD 文档 | Markdown/文本 | 功能点列表 |
| `extract_data_model` | 提取实体和字段 | 需求文档 | 实体定义 + 字段列表 |
| `extract_validation_rules` | 提取校验规则 | 需求文档 | 校验规则数组 |
| `extract_api_requirements` | 提取接口需求 | 需求文档 | 端点/方法/参数定义 |
| `generate_user_stories` | 生成验收标准 | 需求文档 | Given-When-Then 格式 |
| `match_to_existing_page` | 匹配已有相似页面 | 需求描述 | 最相似页面路径 |

**需求模板（推荐统一格式）**：

```yaml
# .claude/templates/page-request.yaml
page:
  name: "标签管理"
  module: "dataGovernance"
  route_path: "/labelCenter/tagManagement"

search_area:
  - field: tagName
    label: "标签名称"
    component: a-input
    placeholder: "请输入标签名称"
  - field: categoryId
    label: "标签分类"
    component: a-tree-select
    api: "/tag-category/tree"
  - field: createTime
    label: "创建时间"
    component: a-range-picker

table_area:
  columns:
    - dataIndex: tagName
      title: "标签名称"
      width: 200
      ellipsis: true
    - dataIndex: categoryName
      title: "标签分类"
      width: 150
    - dataIndex: tagType
      title: "标签类型"
      width: 120
      type: tag                    # 使用 Tag 组件渲染
      enum:                          # 枚举值映射
        STATIC: { color: "blue", label: "静态标签" }
        DYNAMIC: { color: "green", label: "动态标签" }
    - dataIndex: createTime
      title: "创建时间"
      width: 180
      type: datetime
    - dataIndex: updateTime
      title: "更新时间"
      width: 180
      type: datetime
    - title: "操作"
      width: 220
      fixed: "right"
      type: operation

operations:
  header:
    - type: add
      label: "新增标签"
      permission: "tag:add"
    - type: batchDelete
      label: "批量删除"
      permission: "tag:delete"
  row:
    - type: edit
      label: "编辑"
    - type: delete
      label: "删除"
      confirm: "确认删除该标签？"
    - type: detail
      label: "详情"

modal:
  add:
    title: "新增标签"
    width: 800
  edit:
    title: "编辑标签"
    width: 800
  detail:
    title: "标签详情"
    width: 600

form_fields:
  - field: tagName
    label: "标签名称"
    component: text
    required: true
    rules: [{ max: 50, message: "不超过50个字符" }]
  - field: categoryId
    label: "标签分类"
    component: treeselect
    required: true
    api: "/tag-category/tree"
  - field: tagType
    label: "标签类型"
    component: select
    required: true
    options:
      - { label: "静态标签", value: "STATIC" }
      - { label: "动态标签", value: "DYNAMIC" }
  - field: tagStyle
    label: "标签样式"
    component: colors
  - field: configValues
    label: "标签配置"
    component: textarea
  - field: remark
    label: "备注"
    component: textarea

api_endpoints:
  list:   { method: GET,    url: "/tag/list" }
  add:    { method: POST,   url: "/tag" }
  update: { method: PUT,    url: "/tag" }
  delete: { method: DELETE, url: "/tag/{id}" }
  detail: { method: GET,    url: "/tag/{id}" }
  batchDelete: { method: POST, url: "/tag/batch-delete" }
```

### 3.4 MCP Server 3: Code Generator Server（核心）

**职责**：基于设计 Token + 需求规格，生成符合项目规范的完整模块代码

| Tool 名称 | 功能 | 输出文件 |
|-----------|------|----------|
| `generate_api_layer` | 生成 API 层代码 | `src/api/{module}/{entity}.js` |
| `generate_search_schema` | 生成搜索表单 schema | `searchSchema` 数组 |
| `generate_table_columns` | 生成表格列配置 | `columns` 数组 |
| `generate_form_schema` | 生成表单 schema | `formSchema` 数组 |
| `generate_api_config` | 生成 apiConfig 对象 | 完整 CRUD 配置 |
| `generate_crud_page` | 生成 CRUD 页面 | `{Entity}/index.vue` |
| `generate_router_config` | 生成路由配置 | 路由配置片段 |
| `generate_store_module` | 生成 Pinia Store | `store/modules/{entity}.js` |
| `scaffold_module` | 一键生成完整模块 | 模块目录 + 全部文件 |

**代码生成模板（基于项目实际模式）**：

```vue
<!-- 模板: crud-page.template.vue -->
<template>
  <div>
    <SearchTable
      :search-schema="searchSchema"
      :columns="columns"
      :api-config="apiConfig"
      :model-config="modelConfig"
      :operation-btns="operationBtns"
      @add="onAdd"
      @edit="onEdit"
      @delete="onDelete"
      @detail="onDetail"
      @batch-delete="onBatchDelete"
    >
      <!-- 自定义表单项插槽（按需生成） -->
      {{#each customFieldSlots}}
      <template #modal-{{this.field}}="slotProps">
        <{{this.component}} v-model:value="slotProps.value" v-bind="slotProps.props" />
      </template>
      {{/each}}

      <!-- 自定义表格列插槽（按需生成） -->
      {{#each customColumnSlots}}
      <template #table-column-{{this.dataIndex}}="{ text, record }">
        {{this.renderTemplate}}
      </template>
      {{/each}}
    </SearchTable>
  </div>
</template>

<script setup>
import SearchTable from '@/views/{{module}}/components/searchTable.vue'
import {
  get{{Entity}}Page,
  add{{Entity}},
  update{{Entity}},
  delete{{Entity}},
  batchDelete{{Entity}},
  get{{Entity}}Detail
} from '@/api/{{module}}/{{entity}}.js'

const searchSchema = {{searchSchemaJson}}

const columns = {{columnsJson}}

const apiConfig = {
  header: { api: get{{Entity}}Header, params: {}, handleData: (res) => res },
  data: {
    api: get{{Entity}}Page,
    params: {},
    handleData: (res) => ({ data: res.records, total: res.total })
  },
  add: {
    api: add{{Entity}},
    handleParams: (params) => params,
    handleData: (res) => res
  },
  update: {
    api: update{{Entity}},
    handleParams: (params) => params,
    handleData: (res) => res
  },
  delete: {
    api: delete{{Entity}},
    handleParams: ({ id }) => id,
    handleData: (res) => res
  },
  batchDelete: {
    api: batchDelete{{Entity}},
    handleParams: (ids) => ids,
    handleData: (res) => res
  },
  detail: {
    api: get{{Entity}}Detail,
    handleParams: ({ id }) => ({ id }),
    handleData: (res) => res
  }
}

const modelConfig = {{modelConfigJson}}

const operationBtns = {{operationBtnsJson}}
</script>
```

**API 层生成模板**：

```javascript
// 模板: api-module.template.js
import { defHttp } from '@/utils/axios'

{{#each endpoints}}
export function {{this.funcName}}(params) {
  return defHttp.{{this.method}}({ url: '{{this.url}}', params })
}
{{/each}}
```

**路由配置生成模板**：

```javascript
// 模板: router-config.template.js
{
  path: '{{routePath}}',
  name: '{{routeName}}',
  component: () => import('@/views/{{module}}/{{Entity}}/index.vue'),
  meta: {
    title: '{{pageTitle}}',
    icon: '{{icon}}'
  }
}
```

### 3.5 MCP Server 4: API Integration Server

**职责**：解析后端接口文档，生成 API 代码和 Mock 数据

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| `parse_swagger` | 解析 Swagger/OpenAPI 文档 | Swagger URL | 结构化 API 定义 |
| `parse_yapi` | 解析 YApi 接口文档 | YApi 项目 ID | 结构化 API 定义 |
| `generate_api_code` | 基于接口文档生成 API 层 | API 定义 | `api/{module}/{entity}.js` |
| `generate_mock_data` | 生成 Mock 数据 | API 定义 | Mock JSON / MSW handlers |
| `generate_api_config` | 生成 apiConfig | API 定义 | apiConfig 对象 |
| `validate_alignment` | 校验前后端接口对齐 | 前端 API 调用 + 接口文档 | 差异报告 |
| `generate_ts_types` | 生成 TypeScript 类型 | API 定义 | `.d.ts` 类型文件 |

**Swagger 解析示例**：

```javascript
// api-server/src/tools/parse-swagger.js
export async function parseSwagger(swaggerUrl) {
  const doc = await fetch(swaggerUrl).then(r => r.json())

  const apis = []
  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const [method, detail] of Object.entries(methods)) {
      apis.push({
        path,
        method: method.toUpperCase(),
        summary: detail.summary,
        tags: detail.tags,
        parameters: detail.parameters || [],
        requestBody: detail.requestBody,
        responses: detail.responses
      })
    }
  }

  // 按 tag 分组（对应前端模块）
  const groupedApis = groupBy(apis, api => api.tags[0])

  // 自动匹配 CRUD 模式
  for (const [tag, apiList] of Object.entries(groupedApis)) {
    const crud = {
      list:   apiList.find(a => a.method === 'GET'    && !a.path.includes('{')),
      detail: apiList.find(a => a.method === 'GET'    && a.path.includes('{')),
      add:    apiList.find(a => a.method === 'POST'   && !a.path.includes('{')),
      update: apiList.find(a => a.method === 'PUT'    && a.path.includes('{')),
      delete: apiList.find(a => a.method === 'DELETE' && a.path.includes('{'))
    }
    // 映射到 apiConfig 结构
  }

  return groupedApis
}
```

### 3.6 MCP Server 5: Validation Server

**职责**：验证代码质量、设计还原度、前后端一致性

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| `validate_design_fidelity` | 设计还原度检查 | 页面截图 + Figma 截图 | 差异热力图 |
| `validate_code_convention` | 代码规范检查 | 文件路径 | 违规项列表 |
| `validate_api_alignment` | 前后端接口对齐 | 前端 apiConfig + Swagger | 差异报告 |
| `validate_crud_completeness` | CRUD 功能完整性 | 页面文件 | 缺失功能列表 |
| `run_visual_diff` | 视觉差异对比 | 两张截图 | 差异像素百分比 |
| `generate_test_case` | 生成测试用例 | 需求规格 | 测试用例清单 |

---

## 四、共享知识库设计

知识库是整个框架的**核心基础设施**，存储项目特定的约定和映射关系。

### 4.1 知识库结构

```
.claude/knowledge-base/
├── component-mapping.yaml        # Figma 元素 → 项目组件映射
├── api-conventions.yaml           # API 层编码规范
├── code-templates/                # 代码模板
│   ├── crud-page.template.vue     # CRUD 页面模板
│   ├── api-module.template.js     # API 模块模板
│   ├── store-module.template.js   # Pinia Store 模板
│   ├── router-config.template.js  # 路由配置模板
│   └── form-modal.template.vue    # 表单弹窗模板
├── project-conventions.yaml       # 项目整体规范
└── figma-naming-conventions.yaml  # Figma 命名规范（与设计师约定）
```

### 4.2 Component Mapping 定义

```yaml
# .claude/knowledge-base/component-mapping.yaml
figma_to_project:
  # 基础输入
  - figma_pattern: "TextField|Input|Text Box"
    component: "a-input"
    import: "ant-design-vue"
    schema_type: "text"
    default_props:
      allowClear: true
      maxlength: 255

  - figma_pattern: "TextArea|Text Area|Multiline"
    component: "a-textarea"
    import: "ant-design-vue"
    schema_type: "textarea"
    default_props:
      rows: 4
      maxlength: 500

  - figma_pattern: "Select|Dropdown|ComboBox|Picker"
    component: "a-select"
    import: "ant-design-vue"
    schema_type: "select"
    default_props:
      showSearch: true
      allowClear: true

  - figma_pattern: "Cascader|Cascade|层级"
    component: "a-cascader"
    import: "ant-design-vue"
    schema_type: "cascader"
    default_props:
      changeOnSelect: false

  - figma_pattern: "TreeSelect|Tree Select|树选择"
    component: "a-tree-select"
    import: "ant-design-vue"
    schema_type: "treeselect"
    default_props:
      treeDefaultExpandAll: true

  - figma_pattern: "DatePicker|Date Picker|日期"
    component: "a-date-picker"
    import: "ant-design-vue"
    schema_type: "datetime"
    default_props:
      valueFormat: "YYYY-MM-DD"
      showTime: false

  - figma_pattern: "DateRange|Date Range|日期范围"
    component: "a-range-picker"
    import: "ant-design-vue"
    schema_type: "daterange"
    default_props:
      valueFormat: "YYYY-MM-DD"

  - figma_pattern: "Switch|Toggle|开关"
    component: "a-switch"
    import: "ant-design-vue"
    schema_type: "switch"

  - figma_pattern: "Radio|RadioGroup|单选"
    component: "a-radio-group"
    import: "ant-design-vue"
    schema_type: "radio"

  - figma_pattern: "Checkbox|多选"
    component: "a-checkbox-group"
    import: "ant-design-vue"
    schema_type: "checkbox"

  # 自定义组件
  - figma_pattern: "Cron|CronExpression|定时"
    component: "CronExpression"
    import: "@/components/Form/components/CronExpression.vue"
    schema_type: "cron"

  - figma_pattern: "ColorPicker|Color|颜色"
    component: "colors"
    import: "@/components/colors/index.vue"
    schema_type: "colors"

  - figma_pattern: "TagSelect|Tag Select|标签选择"
    component: "tagSelect"
    import: "@/views/label-center/TagManagement/components/tagSelect.vue"
    schema_type: "tagSelect"

  # 容器组件
  - figma_pattern: "Table|DataGrid|表格"
    component: "BasicTable"
    import: "@/components/Table/BasicTable.vue"

  - figma_pattern: "Form|表单"
    component: "BasicForm"
    import: "@/components/Form/BasicForm.vue"

  - figma_pattern: "Modal|Dialog|弹窗"
    component: "BasicModal"
    import: "@/components/Modal/BasicModal.vue"

  - figma_pattern: "Drawer|抽屉"
    component: "BasicDrawer"
    import: "@/components/Drawer/BasicDrawer.vue"

  # 按钮
  - figma_pattern: "Primary Button|主按钮|确认"
    component: "a-button"
    props:
      type: "primary"

  - figma_pattern: "Danger Button|删除|危险"
    component: "a-button"
    props:
      type: "primary"
      danger: true

  - figma_pattern: "Table Action|表格操作"
    component: "a-button"
    props:
      type: "link"
      size: "small"
```

### 4.3 项目规范定义

```yaml
# .claude/knowledge-base/project-conventions.yaml
project:
  name: "DataCenterPlatform-II"
  framework: "Vue 3"
  language: "JavaScript"
  composition_api: "<script setup>"

api_layer:
  base_import: "import { defHttp } from '@/utils/axios'"
  http_methods: ["get", "post", "put", "delete"]
  file_location: "src/api/{module}/{entity}.js"
  naming: "camelCase"
  crud_methods:
    list: "get{Entity}Page"
    add: "add{Entity}"
    update: "edit{Entity}"  # 或 update{Entity}
    delete: "delete{Entity}"
    batchDelete: "batchDelete{Entity}"
    detail: "get{Entity}Detail"

views:
  file_location: "src/views/{module}/{Entity}/index.vue"
  detail_page: "src/views/{module}/{Entity}/details.vue"
  component_dir: "src/views/{module}/components/"
  naming:
    page: "PascalCase"
    component: "PascalCase"

router:
  file_location: "src/router/routes/modules/{module}.js"
  mode: "hash"
  lazy_loading: "() => import('@/views/...')"
  meta_fields: ["title", "icon", "hideMenu", "activeMenu", "allowMultipleTabs"]

store:
  lib: "pinia"
  file_location: "src/store/modules/{name}.js"
  pattern: "defineStore('{name}', { state, getters, actions })"
  persist: "pinia-plugin-persist"

forms:
  lib: "BasicForm"
  driver: "schema 数组 + component 字段映射"
  component_map: "src/components/Form/config.js"
  search_form: "searchSchema (reactive 数组)"
  edit_form: "formSchema (在 ModalForm 中)"

tables:
  lib: "BasicTable"
  driver: "columns 数组 + apiConfig 对象"
  pagination: "localPagination"
  operations: "operationBtns 数组 (table-header / table-middle)"
```

---

## 五、开发流程对比

### 传统流程 vs MCP 智能体辅助流程

```
传统流程（约 11-16 天）:
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────┐
│ 需求评审  │→│ 设计稿   │→│ 前端手动  │→│ 后端接口   │→│ 联调    │→│ 测试  │
│ (1天)    │ │ (2天)   │ │ 开发      │ │ 开发      │ │ (2天)  │ │ (2天)│
│          │ │         │ │ (3-5天)  │ │ (3-5天)  │ │        │ │      │
└─────────┘  └─────────┘  └──────────┘  └──────────┘  └────────┘  └──────┘

MCP 智能体辅助流程（约 2-3 天）:
┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐
│ 需求模板  │→│ AI 解析    │→│ 一键生成   │→│ 接口文档   │→│ AI 联调  │→│ 自动   │
│ 填写      │ │ Figma     │ │ 代码       │ │ 导入      │ │ 修正     │ │ 验证   │
│ (0.5天)  │ │ (0.5天)   │ │ (0.5天)   │ │ (0.5天)  │ │ (0.5天) │ │(0.5天)│
└──────────┘  └───────────┘  └──────────┘  └──────────┘  └─────────┘  └───────┘

效率提升：5-8x（CRUD 页面由 3-5 天缩短至 0.5 天）
```

### 各阶段耗时对比

| 阶段 | 传统方式 | MCP 辅助 | 提升倍数 |
|------|---------|---------|----------|
| 需求理解 | 2-4 小时（阅读文档+沟通） | 0.5 小时（结构化模板） | 4-8x |
| API 层编码 | 1-2 小时 | 5 分钟（自动生成） | 12-24x |
| 搜索+表格 | 2-4 小时 | 10 分钟（自动生成） | 12-24x |
| 表单弹窗 | 2-3 小时 | 10 分钟（自动生成） | 12-18x |
| 路由+菜单 | 0.5 小时 | 2 分钟（自动生成） | 15x |
| 接口联调 | 4-8 小时 | 1-2 小时（Mock + 自动校验） | 4-8x |
| 代码 Review | 1-2 小时 | 0.5 小时（自动验证） | 2-4x |

---

## 六、技术选型

### 6.1 MCP Server 技术栈

| 组件 | 推荐技术 | 备选 |
|------|---------|------|
| MCP SDK | `@modelcontextprotocol/sdk` (TypeScript) | Python MCP SDK |
| 运行时 | Node.js 20+ | — |
| Figma API | REST API v1 + Personal Access Token | Figma Plugin API |
| 代码模板引擎 | Handlebars / EJS | 纯字符串模板 |
| 接口文档解析 | swagger-parser (OpenAPI 3.x) | yapi-to-api |
| Mock 生成 | Mock.js / MSW | faker.js |
| 视觉对比 | pixelmatch / resemble.js | Playwright 截图对比 |
| 代码验证 | ESLint API + 自定义 AST 规则 | — |

### 6.2 MCP Server 部署配置

```json
// .claude/mcp.json 或 claude_desktop_config.json
{
  "mcpServers": {
    "datacenter-figma": {
      "command": "node",
      "args": [".claude/mcp-servers/figma-server/dist/index.js"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_PERSONAL_TOKEN}"
      }
    },
    "datacenter-code-gen": {
      "command": "node",
      "args": [".claude/mcp-servers/code-gen-server/dist/index.js"],
      "env": {
        "PROJECT_ROOT": "${workspaceFolder}",
        "KNOWLEDGE_BASE": ".claude/knowledge-base/"
      }
    },
    "datacenter-api": {
      "command": "node",
      "args": [".claude/mcp-servers/api-server/dist/index.js"],
      "env": {
        "SWAGGER_URL": "http://172.16.10.190:8080/v2/api-docs",
        "YAPI_URL": "http://yapi.internal.example.com"
      }
    },
    "datacenter-validate": {
      "command": "node",
      "args": [".claude/mcp-servers/validate-server/dist/index.js"]
    }
  }
}
```

---

## 七、方案路径对比

| | 路径 A: 最小可行 (MVP) | 路径 B: 标准方案 | 路径 C: 完整平台 |
|---|---|---|---|
| **核心能力** | CLAUDE.md + 代码模板 + AI 对话 | MCP Server + 知识库 + 半自动 | 完整 MCP 工具链 + Web UI |
| **Figma 集成** | 手动截图 → AI 理解 | Figma API 自动提取 | 自动提取 + Token 同步 |
| **代码生成** | 对话式逐文件生成 | MCP Tool 一键批量生成 | 脚手架 + HMR 预览 |
| **接口集成** | 手动粘贴文档 | Swagger 自动解析 | 实时同步 + Mock Server |
| **验证** | 人工 Review | Lint + 截图对比 | 完整自动化 CI |
| **开发工作量** | **1-2 周** | **4-6 周** | **3-6 月** |
| **适用团队** | 1-3 人小团队 | 5-10 人中型团队 | 10+ 人大团队 |
| **维护成本** | 极低 | 中等 | 较高 |

### 推荐路径：A → B 渐进式演进

```
Week 1-2:  MVP（路径 A）
  ├── 编写 CLAUDE.md 项目规范
  ├── 建立代码模板库（CRUD 页面、API 模块、Store）
  ├── 建立 component-mapping.yaml 知识库
  └── 验证：用 AI 对话式生成 1-2 个 CRUD 页面

Week 3-6:  标准方案（路径 B）
  ├── 实现 Figma MCP Server（extract + map 核心 Tool）
  ├── 实现 Code Generator MCP Server（generate 核心 Tool）
  ├── 实现 API Integration MCP Server（parse-swagger + generate-api）
  ├── 实现 Validation MCP Server（validate-code + validate-api）
  └── 验证：全流程自动生成标签中心新增页面

按需:      完整平台（路径 C）
  ├── Web 管理界面
  ├── 设计 Token 实时同步
  ├── CI/CD 集成
  └── 多项目支持
```

---

## 八、MVP 快速启动清单

### Week 1: 知识基础设施建设

| 任务 | 产出 | 预估 |
|------|------|------|
| 编写 CLAUDE.md | 项目开发规范文档 | 1天 |
| 建立组件映射字典 | `component-mapping.yaml` | 0.5天 |
| 建立 API 规范文档 | `api-conventions.yaml` | 0.5天 |
| 编写代码模板（CRUD） | `crud-page.template.vue` | 1天 |
| 编写代码模板（API） | `api-module.template.js` | 0.5天 |
| 编写代码模板（Store） | `store-module.template.js` | 0.5天 |
| 建立页面请求模板 | `page-request.yaml` Schema | 1天 |

### Week 2: MCP Server MVP 实现

| 任务 | 产出 | 预估 |
|------|------|------|
| Figma Server: `extract_page_structure` | Figma → 结构化 JSON | 2天 |
| Figma Server: `map_to_project_components` | JSON → 组件配置 | 1天 |
| Code Gen Server: `generate_crud_page` | 配置 → .vue 文件 | 1.5天 |
| Code Gen Server: `generate_api_layer` | 配置 → API 文件 | 0.5天 |
| 端到端验证 | 自动生成 1 个完整 CRUD 页面 | 1天 |

---

## 九、风险与应对策略

| 风险 | 等级 | 概率 | 应对措施 |
|------|------|------|----------|
| Figma 设计稿规范不统一 | 🔴 高 | 高 | 与设计团队制定命名约定；提供 Figma Plugin 辅助标注；命名格式：`[类型] [功能名]`（如 `TextField 标签名称`） |
| 代码生成质量不达预期 | 🟡 中 | 中 | 以模板为基础，AI 仅做字段填充和适配；人工 Review 作为合入门禁；迭代优化模板 |
| 后端接口文档不完整 | 🟡 中 | 中 | 优先支持 Swagger 标准格式；推动后端规范化；对非标准接口手动补充 |
| MCP Server 维护成本高 | 🟡 中 | 低 | 从 MVP 开始，每个 Server 保持单一职责；插件化架构方便扩展 |
| 团队接受度低 | 🟢 低 | 中 | 先在标签中心等成熟模块试点；用效率数据说服；提供培训和文档 |
| Figma API 限流 (120 req/min) | 🟢 低 | 低 | 加缓存层；设计稿变更时才重新获取；批量请求合并 |
| AI 理解设计稿精度不足 | 🟡 中 | 中 | 多层校验：Vision AI 初筛 → Figma API 精确提取 → 人工确认 |
| 生成的代码与现有风格不一致 | 🟡 中 | 中 | 以项目实际代码为模板；Lint 自动修正；风格一致性自动检查 |

---

## 十、与 Monorepo 方案的协同

两个方案可以**协同推进**，相互增强：

```
Monorepo 改造                     MCP 智能体框架
      │                                  │
      ├── @datacenter/shared ────────────┤ 代码模板引用共享组件
      │   (通用组件 + 工具 + 规范)         │ 知识库定义组件映射
      │                                  │
      ├── @datacenter/label-center ──────┤ MCP 生成新模块时
      │   (标杆提取案例)                   │ 自动遵循 monorepo 包结构
      │                                  │
      └── 包边界清晰 ─────────────────────┤ MCP 理解模块边界
          (独立构建 + 清晰依赖)            │ 生成正确的跨包导入
```

**协同效应**：
- Monorepo 提供**结构基础**（共享包的物理隔离和清晰依赖）
- MCP 智能体提供**自动化能力**（从设计到代码的快速生成）
- 两者结合 → **标准化的快速开发平台**

---

## 十一、结论与建议

### 可行性总结

| 维度 | 结论 |
|------|------|
| **技术可行性** | ✅ **高度可行**。MCP 协议成熟，项目模式标准化程度高，具备自动化基础 |
| **推荐路径** | MVP (1-2周) → 标准方案 (4-6周) → 按需演进 |
| **关键前提** | ① 制定 Figma 设计命名规范 ② 完善后端接口文档（Swagger） ③ 建立结构化知识库 |
| **最大挑战** | 设计稿规范性和接口文档完整性的组织推动（非技术问题） |
| **预期收益** | CRUD 页面开发效率提升 **5-8 倍**；代码一致性显著提升；新人上手成本降低 |
| **投资回报** | MVP 投入 2 周，每个 CRUD 页面节省 2-4 天，生成 3-5 个页面即可回本 |

### 下一步行动建议

| 优先级 | 行动 | 产出 |
|--------|------|------|
| P0 | 编写 `CLAUDE.md` | 项目开发规范文档（半天） |
| P0 | 建立 `component-mapping.yaml` | Figma→组件映射字典（半天） |
| P0 | 编写 CRUD 页面代码模板 | 可复用的模板文件（1天） |
| P1 | 设计 `page-request.yaml` Schema | 结构化页面需求模板（1天） |
| P1 | 实现 Figma MCP Server MVP | 2 个核心 Tool（2天） |
| P1 | 实现 Code Gen MCP Server MVP | 3 个核心 Tool（2天） |
| P2 | 端到端试点：自动生成标签中心新页面 | 完整验证流程（1天） |

---

## 附录

### A. MCP 协议简介

MCP (Model Context Protocol) 是 Anthropic 发布的一个开放标准，用于连接 AI 模型和外部工具/数据源。它基于 JSON-RPC 2.0，定义了：

- **Server**: 提供 Tools（可调用的函数）、Resources（可读取的数据）、Prompts（可复用的提示模板）
- **Client**: AI 应用（如 Claude Desktop、Claude Code）作为 Client，发现并调用 Server 的能力
- **Transport**: 支持 stdio（本地进程通信）和 HTTP+SSE（远程通信）

### B. MCP Server 骨架代码

```javascript
// .claude/mcp-servers/code-gen-server/src/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// 注册 Tools
const server = new Server(
  { name: 'datacenter-code-gen', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'generate_crud_page',
      description: '基于页面规格生成 CRUD 页面 .vue 文件',
      inputSchema: {
        type: 'object',
        properties: {
          module: { type: 'string', description: '模块名，如 label-center' },
          entity: { type: 'string', description: '实体名，如 TagManagement' },
          spec: { type: 'object', description: '页面规格对象' }
        },
        required: ['module', 'entity', 'spec']
      }
    },
    {
      name: 'generate_api_layer',
      description: '生成 API 层代码',
      inputSchema: { /* ... */ }
    }
  ]
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  switch (name) {
    case 'generate_crud_page':
      return generateCrudPage(args.module, args.entity, args.spec)
    case 'generate_api_layer':
      return generateApiLayer(args.module, args.entity, args.endpoints)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
```

### C. 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Figma REST API](https://www.figma.com/developers/api)
- [OpenAPI (Swagger) 规范](https://swagger.io/specification/)
- [Claude Code MCP 集成指南](https://docs.anthropic.com/en/docs/claude-code/mcp)
