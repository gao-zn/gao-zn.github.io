# Monorepo 改造可行性分析方案

> 项目：DataCenterPlatform-II  
> 日期：2026-06-24  
> 目标：将单体应用改造为 monorepo 架构，以「标签中心」为试点提取独立包

---

## 一、现状分析

### 1.1 项目概况

| 维度 | 现状 |
|---|---|
| 项目结构 | 单体应用，单一 `package.json` |
| 构建工具 | Vite 4.x，纯 JavaScript（无 TypeScript） |
| 包管理器 | 同时存在 npm / pnpm / yarn 的 lock 文件 |
| UI 框架 | Vue 3 (Composition API + `<script setup>`) + Ant Design Vue 4.x |
| 状态管理 | Pinia 2 + pinia-plugin-persist |
| HTTP 客户端 | Axios（自定义 VAxios 封装，路径 `src/utils/axios/`） |
| 样式方案 | Less + WindiCSS |
| 路由 | Vue Router 4，Hash 模式，模块化路由配置 |
| 自动导入 | unplugin-auto-import + unplugin-vue-components |

### 1.2 目录结构

```
DataCenterPlatform-II/
├── src/
│   ├── api/                    # API 层（按模块组织）
│   ├── assets/                 # 图标、图片、样式
│   ├── components/             # 共享 UI 组件
│   ├── hooks/                  # 共享组合式函数
│   ├── layouts/                # 布局组件
│   ├── router/                 # 路由配置
│   ├── store/                  # Pinia 状态管理
│   ├── utils/                  # 工具函数（axios、tree、date、is、ws 等）
│   └── views/                  # 页面模块（14 个子目录）
├── build/                      # 构建脚本与 Vite 插件
├── vite.config.js
├── windi.config.js
└── package.json
```

### 1.3 标签中心代码体量

| 层级 | 路径 | 文件数 | 说明 |
|------|------|--------|------|
| 视图层 | `src/views/label-center/` | ~15 个 `.vue` | 标签总览、标签管理、标签模板、打标规则、打标任务 |
| API 层 | `src/api/label-center/` | 2 个 `.js` | tagManagement.js、tagTemplate.js |
| 图标 | `src/assets/icons/labelCenter/` | 19 个 `.svg` | 标签可视化专用图标 |
| 路由 | `src/router/routes/modules/dataGovernance.js` | 5 个子路由 | 归属在数据治理模块下 |

---

## 二、标签中心依赖分析

### 2.1 依赖关系图

```
标签中心 (label-center)
│
├── 🔴 硬依赖（必须一起提取或改为共享包）
│   ├── src/api/label-center/           ← API 层，依赖 defHttp
│   ├── src/assets/icons/labelCenter/   ← 19 个 SVG 图标
│   └── src/views/label-center/data/    ← 模块静态数据
│
├── 🟡 共享组件依赖（需提取到 @datacenter/shared）
│   ├── src/components/BasicDrawer/     ← 抽屉容器
│   ├── src/components/BasicForm/       ← Schema 驱动表单
│   ├── src/components/BasicTable/      ← 表格容器
│   ├── src/components/BasicModal/      ← 弹窗容器
│   ├── src/components/Tree/            ← 树组件
│   ├── src/components/Tags/            ← 标签展示组件
│   ├── src/components/Icon/            ← 图标组件
│   ├── src/components/Loading/         ← 加载组件
│   ├── src/components/ErrorMask/       ← 错误遮罩
│   └── src/components/MonacoEditor/    ← 代码编辑器
│
├── 🟡 共享工具依赖（需提取到 @datacenter/shared）
│   ├── src/utils/axios/                ← HTTP 客户端（VAxios 封装）
│   ├── src/utils/tree.js               ← 树数据结构工具
│   ├── src/utils/dateUtil.js           ← 日期处理（基于 dayjs）
│   ├── src/utils/is.js                 ← 类型判断
│   ├── src/utils/cipher.js             ← 加密工具
│   └── src/utils/download.js           ← 文件下载
│
├── 🟡 共享状态依赖
│   ├── src/store/tab.js                ← 多 Tab 导航状态
│   └── src/store/theme.js              ← 主题状态
│
├── 🟢 外部依赖（npm 包）
│   ├── ant-design-vue (v4)             ← UI 组件库
│   ├── @ant-design/icons-vue (v6)      ← 图标库
│   ├── vue-router (v4)                 ← 路由
│   ├── pinia (v2)                      ← 状态管理
│   ├── @vueuse/core                    ← 组合式工具集
│   ├── dayjs                           ← 日期处理
│   └── lodash-es                       ← 通用工具
│
└── 🔴 宿主应用耦合点
    ├── 路由注册（dataGovernance.js 中定义）
    ├── 侧边栏菜单注册
    ├── Tab 导航 store
    ├── 全局样式/主题变量
    └── 布局组件（layouts/index.vue）
```

### 2.2 耦合程度评估

| 耦合点 | 程度 | 解耦难度 |
|--------|------|----------|
| 与共享组件 | 深度耦合 | ⭐⭐⭐ 需要先提取 shared 包 |
| 与 defHttp | 深度耦合 | ⭐⭐⭐ 需要将拦截器改为可插拔模式 |
| 与路由系统 | 中度耦合 | ⭐⭐ 导出路由配置，宿主动态注册 |
| 与 Pinia Store | 低度耦合 | ⭐⭐ 导出 store 注册函数 |
| 与布局组件 | 低度耦合 | ⭐ 标签中心页面不直接依赖布局 |
| 与全局样式 | 中度耦合 | ⭐⭐ 提取设计 Token 到 shared |

---

## 三、推荐 Monorepo 架构

### 3.1 方案选型

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **pnpm workspace + Turborepo** | 原生支持、速度快、磁盘省、任务编排强 | 需要学习 Turborepo 配置 | ⭐⭐⭐⭐⭐ 推荐 |
| pnpm workspace only | 简单、无需额外工具 | 缺少任务编排和缓存 | ⭐⭐⭐ |
| Nx | 功能最全、插件丰富 | 学习曲线陡、配置复杂 | ⭐⭐ |
| Lerna + Yarn | 成熟稳定 | 性能不如 pnpm | ⭐⭐ |

### 3.2 目标目录结构

```
DataCenterPlatform-II/
├── apps/
│   └── main/                              # 主应用（原 src/ 大部分内容）
│       ├── package.json                   # name: "@datacenter/main"
│       ├── vite.config.js
│       ├── windi.config.js
│       ├── index.html
│       └── src/
│           ├── main.js
│           ├── App.vue
│           ├── layouts/                   # 布局（保留在主应用）
│           ├── router/                    # 路由（合并各包的 routes）
│           ├── store/                     # 全局 store
│           └── views/                    # 无需提取的页面模块
│
├── packages/
│   ├── shared/                            # 共享工具和组件库
│   │   ├── package.json                   # name: "@datacenter/shared"
│   │   ├── vite.config.js                 # 库模式构建
│   │   ├── index.js                       # 统一导出入口
│   │   └── src/
│   │       ├── utils/                     # axios, tree, dateUtil, is...
│   │       │   ├── axios/                 # defHttp + 可插拔拦截器
│   │       │   ├── tree.js
│   │       │   ├── dateUtil.js
│   │       │   └── index.js
│   │       ├── components/               # 通用 UI 组件
│   │       │   ├── BasicDrawer/
│   │       │   ├── BasicForm/
│   │       │   ├── BasicTable/
│   │       │   ├── BasicModal/
│   │       │   ├── Tree/
│   │       │   ├── Tags/
│   │       │   ├── Icon/
│   │       │   ├── Loading/
│   │       │   └── ErrorMask/
│   │       ├── hooks/                     # 共享 hooks
│   │       └── styles/                    # 共享样式/主题变量
│   │
│   ├── label-center/                      # 标签中心（独立包）
│   │   ├── package.json                   # name: "@datacenter/label-center"
│   │   ├── vite.config.js                 # 库模式 + 开发模式
│   │   ├── index.js                       # 统一导出
│   │   └── src/
│   │       ├── views/                     # 所有页面组件
│   │       │   ├── TagOverview/
│   │       │   ├── TagManagement/
│   │       │   ├── TagTemplate/
│   │       │   ├── LabelingRules/
│   │       │   └── MarkingTask/
│   │       ├── api/                       # API 层
│   │       ├── components/               # 模块专用组件
│   │       ├── assets/                    # 图标
│   │       ├── store/                     # 模块 Pinia store
│   │       └── router.js                  # 路由配置（导出给主应用）
│   │
│   └── data-modeling/                     # 未来：数据建模（同理提取）
│
├── pnpm-workspace.yaml                    # workspace 定义
├── turbo.json                             # Turborepo 任务编排
├── package.json                           # 根 package.json
├── .npmrc                                 # pnpm 配置
└── docs/                                  # 文档
```

### 3.3 配置文件内容

**pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

**根 package.json（关键字段）**
```json
{
  "name": "datacenter-platform",
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "dev:main": "pnpm --filter @datacenter/main dev",
    "dev:label-center": "pnpm --filter @datacenter/label-center dev",
    "build:shared": "pnpm --filter @datacenter/shared build"
  },
  "devDependencies": {
    "turbo": "^2.x"
  }
}
```

**packages/shared/package.json**
```json
{
  "name": "@datacenter/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./utils/*": "./dist/utils/*",
    "./components/*": "./dist/components/*"
  },
  "peerDependencies": {
    "vue": "^3.4",
    "ant-design-vue": "^4.0"
  },
  "dependencies": {
    "axios": "^1.7",
    "dayjs": "^1.11",
    "lodash-es": "^4.17"
  }
}
```

**packages/label-center/package.json**
```json
{
  "name": "@datacenter/label-center",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": "./dist/index.js",
    "./routes": "./dist/router.js",
    "./stores": "./dist/store/index.js",
    "./*": "./dist/*"
  },
  "peerDependencies": {
    "vue": "^3.4",
    "ant-design-vue": "^4.0"
  },
  "dependencies": {
    "@datacenter/shared": "workspace:*"
  }
}
```

---

## 四、关键问题与解决方案

### 4.1 问题一：defHttp 拦截器耦合

**现状**：`src/utils/axios/index.js` 中的拦截器包含项目特定的 Token 获取、错误处理、重试逻辑。

**解决方案**：将核心 HTTP 客户端提取到 shared，拦截器改为可插拔模式。

```js
// packages/shared/src/utils/axios.js
import { VAxios } from './Axios'

// 默认不绑定任何业务拦截器
export function createHttpClient(options = {}) {
  return new VAxios({
    timeout: 10000,
    ...options,
    // 宿主通过 transform 注入自己的逻辑
    transform: {
      requestInterceptors: options.requestInterceptors,
      responseInterceptors: options.responseInterceptors,
      ...options.transform
    }
  })
}

// 提供默认实例（无拦截器）
export const defHttp = createHttpClient()
```

```js
// apps/main 中使用时注入业务拦截器
import { createHttpClient } from '@datacenter/shared'
import { getToken } from '@/utils/auth'

export const defHttp = createHttpClient({
  transform: {
    requestInterceptors: (config) => {
      config.headers.Authorization = `Bearer ${getToken()}`
      return config
    }
  }
})
```

### 4.2 问题二：Auto-import 机制

**现状**：`unplugin-auto-import` 和 `unplugin-vue-components` 全局工作。

**解决方案**：每个包独立配置插件，或显式导入。

```js
// packages/label-center/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    // 开发模式：独立运行 label-center 页面
    return {
      plugins: [
        vue(),
        AutoImport({ imports: ['vue', 'vue-router', '@vueuse/core'] }),
        Components({ resolvers: [AntDesignVueResolver()] })
      ],
      resolve: {
        alias: { '@': '/src' }
      }
    }
  }
  // 库模式：构建给主应用消费
  return {
    build: {
      lib: { entry: './index.js', name: 'LabelCenter' },
      rollupOptions: {
        external: ['vue', 'ant-design-vue', '@datacenter/shared']
      }
    }
  }
})
```

### 4.3 问题三：路由动态注册

**解决方案**：包导出路由配置，主应用合并注册。

```js
// packages/label-center/src/router.js
export const labelCenterRoutes = [
  {
    path: '/labelCenter',
    redirect: '/labelCenter/TagOverview',
    children: [
      {
        path: 'TagOverview',
        name: 'TagOverview',
        component: () => import('./views/TagOverview/index.vue'),
        meta: { title: '标签总览' }
      },
      {
        path: 'tagManagement',
        name: 'TagManagement',
        component: () => import('./views/TagManagement/index.vue'),
        meta: { title: '标签管理' }
      }
      // ... 其他子路由
    ]
  }
]
```

```js
// apps/main/src/router/index.js
import { labelCenterRoutes } from '@datacenter/label-center/routes'

const routes = [
  ...basicRoutes,
  ...dataDevelopRoutes,
  labelCenterRoutes,   // 直接合并
  ...otherRoutes
]
```

### 4.4 问题四：Pinia Store 跨包使用

**解决方案**：包导出 store 注册函数。

```js
// packages/label-center/src/store/tagStore.js
import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', {
  state: () => ({
    selectedTags: [],
    currentCategory: null
  }),
  // ...
})
```

```js
// packages/label-center/index.js
export { useTagStore } from './src/store/tagStore'
export { labelCenterRoutes } from './src/router'
```

```js
// apps/main 中使用
import { useTagStore } from '@datacenter/label-center'
const tagStore = useTagStore()  // Pinia 自动识别
```

### 4.5 问题五：图标和静态资源

**解决方案**：使用 Vite 库模式将 SVG 内联或导出为资源路径。

```js
// packages/label-center/src/assets/icons.js
// 批量导入 SVG
const iconModules = import.meta.glob('./icons/*.svg', { 
  query: '?raw', 
  import: 'default' 
})

export async function getIcon(name) {
  const key = `./icons/${name}.svg`
  return iconModules[key] ? iconModules[key]() : null
}
```

---

## 五、分阶段实施计划

### 第一阶段：基础设施搭建（Week 1）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 安装配置 pnpm workspace | 0.5 天 | `pnpm-workspace.yaml`、`.npmrc` |
| 安装配置 Turborepo | 0.5 天 | `turbo.json` |
| 创建 `packages/shared/` 骨架 | 1 天 | 包结构 + vite 库模式配置 |
| 迁移通用工具到 shared | 1 天 | `utils/axios/`, `utils/tree.js`, `utils/dateUtil.js` 等 |
| 迁移通用组件到 shared | 2 天 | BasicDrawer, BasicForm, BasicTable, BasicModal 等 |

**第一阶段验收标准**：`@datacenter/shared` 可独立构建，主应用可从 shared 包导入

### 第二阶段：标签中心提取（Week 2）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 创建 `packages/label-center/` 骨架 | 0.5 天 | 包结构 |
| 迁移标签中心视图组件 | 1 天 | views/ 迁移 |
| 迁移 API 层并适配 shared | 1 天 | api/ 迁移 |
| 迁移图标和静态资源 | 0.5 天 | assets/ 迁移 |
| 导出路由配置和 Store | 0.5 天 | router.js + store 注册 |
| 主应用集成 | 1 天 | 修改路由、菜单、导入路径 |

**第二阶段验收标准**：主应用通过 `@datacenter/label-center` 正常渲染标签中心全部功能

### 第三阶段：验证与优化（Week 3）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 全功能回归测试 | 1 天 | 测试报告 |
| 构建和部署验证 | 1 天 | 生产构建无报错 |
| 性能对比 | 0.5 天 | 加载时间对比 |
| 文档编写 | 1 天 | 开发指南、包使用说明 |
| 团队培训和规范制定 | 1 天 | 新模块开发规范 |

### 第四阶段：推广到其他模块（按需）

遵循相同模式提取以下模块：
- **数据建模** (`data-modeling`) — 包含 ER 模型编辑器，可复用性高
- **数据同步** (`dataSync`) — 同步任务管理
- **元数据目录** (`metadata-catalog`) — 血缘分析和元数据浏览
- **算子中心** (`operator-center`) — 数据处理算子库

---

## 六、可行性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 代码解耦难度 | ⭐⭐⭐ 中等 | 标签中心与 shared 耦合深，需三层分离 |
| 构建配置复杂度 | ⭐⭐ 较易 | Vite 库模式成熟，配置模板化 |
| 路由/菜单集成 | ⭐⭐ 较易 | Vue Router 天然支持动态注册 |
| 状态管理迁移 | ⭐⭐ 较易 | Pinia 自动注册，跨包使用无额外成本 |
| API 层解耦 | ⭐⭐⭐ 中等 | defHttp 需要重构为可插拔拦截器 |
| 样式/主题一致性 | ⭐⭐⭐ 中等 | Less 变量和 WindiCSS 配置需要共享 |
| 开发体验保持 | ⭐⭐ 较易 | pnpm workspace 支持本地包热更新 |
| 回滚风险 | ⭐ 低 | 可逐包迁移、逐包回滚 |
| **综合可行性** | **✅ 可行** | 建议分阶段推进，2-3 周完成 MVP |

---

## 七、风险与缓解措施

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| shared 包范围界定不清 | 🔴 高 | 先梳理依赖图，定义明确的包边界 |
| 库模式构建配置复杂 | 🟡 中 | 复用 Vite 配置模板，参考成熟库的配置 |
| 主应用导入路径大量修改 | 🟡 中 | 编写迁移脚本批量替换导入路径 |
| 开发时热更新变慢 | 🟢 低 | pnpm workspace 原生支持符号链接，影响极小 |
| 各包版本管理混乱 | 🟡 中 | 使用 Changesets 统一版本管理 |
| lock 文件冲突 | 🟡 中 | 统一切换到 pnpm，删除 package-lock.json 和 yarn.lock |

---

## 八、收益预估

| 收益 | 当前 | 目标 |
|------|------|------|
| 标签中心复用性 | 无法复用（单体耦合） | 可通过 `npm install @datacenter/label-center` 在任意项目使用 |
| 新模块开发效率 | 需在单体中手动搭建 | 基于 shared 包快速组装 |
| 代码一致性 | 依赖人工 Review | shared 包强制统一组件和工具 |
| 构建速度 | 全量构建 2-5 分钟 | 按包增量构建，修改 shared 才触发完整构建 |
| 团队协作 | 同一仓库冲突频繁 | 按包 Code Review，减少冲突 |
| 测试隔离性 | 全量测试 | 按包独立测试，CI 并行 |

---

## 九、结论

**技术可行性：✅ 高度可行**

以 pnpm workspace + Turborepo 为基础设施，分阶段将标签中心提取为独立包，同时建设 `@datacenter/shared` 共享层。整个过程的回滚风险低，每一步都有明确的验收标准。

**推荐启动条件**：
1. 确认 pnpm 为统一包管理器
2. 确认 Turborepo 作为任务编排工具
3. 确认「标签中心」作为首个试点模块

**预估总工期**：3 周（含测试验证）

---

## 附录

### A. 与其他方案的对比

| | Monorepo | 微前端 (qiankun) | 独立仓库 + npm 私服 |
|---|---|---|---|
| 共享组件 | ✅ 直接引用 | ⚠️ 需额外处理 | ⚠️ 需发布到 npm |
| 开发体验 | ✅ 热更新 | ⚠️ 需启动多个应用 | ❌ 需 npm link |
| 构建速度 | ✅ 增量构建 | ⚠️ 独立构建 | ✅ 独立构建 |
| 部署独立性 | ⚠️ 统一部署 | ✅ 独立部署 | ✅ 独立部署 |
| 学习成本 | ⭐⭐ 较低 | ⭐⭐⭐ 中等 | ⭐ 最低 |
| **适用场景** | 内部复用 | 多团队独立交付 | 松散耦合 |

### B. 参考资源

- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Turborepo 文档](https://turbo.build/repo/docs)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [Changesets 版本管理](https://github.com/changesets/changesets)
