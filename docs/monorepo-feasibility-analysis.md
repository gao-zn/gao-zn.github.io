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
| 包管理器 | 同时存在 npm / pnpm / yarn 的 lock 文件 → **决策：统一迁移到 pnpm** |
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

### 1.4 锁文件现状 — ⚠️ 迁移前置条件

项目根目录同时存在**三个**锁文件：

| 文件 | 大小 | 状态 |
|------|------|------|
| `package-lock.json` | 530 KB | npm（当前使用） |
| `pnpm-lock.yaml` | 279 KB | pnpm（曾用） |
| `yarn.lock` | 291 KB | yarn（曾用，最近有修改） |

**迁移前必须执行**：
1. 确认全团队切换到 pnpm（统一版本 ≥ 8.x）
2. 删除 `package-lock.json` 和 `yarn.lock`
3. 重新执行 `pnpm install` 生成唯一的 `pnpm-lock.yaml`
4. 在 `.gitignore` 中排除其他锁文件

### 1.5 基础设施现状

| 维度 | 现状 | monorepo 后需补充 |
|------|------|-------------------|
| CI/CD | ❌ 无任何配置 | 需搭建，基于 Turborepo 增量构建 |
| 测试框架 | ❌ 零测试代码 | 暂不强制（shared 包也暂不加入） |
| Docker | ❌ 无 Dockerfile | 可选，后续按需添加 |
| Git Hooks | ❌ 无 Husky/lint-staged | 建议引入 commitlint + pre-commit lint |
| TypeScript | ❌ 纯 JavaScript | 暂不引入，保持 JS |
| Storybook | ❌ 无 | 后续按需添加 |
| 部署方式 | 手动 Nginx 配置 | 需加入自动部署流程 |
| npm 私有仓库 | ❌ 无 | 暂不考虑，包通过 workspace 协议引用 |
| 知识库体系 | `docs/knowledge-base/` 含 YAML + HTML | Figma → MasterGo 迁移中，MCP 对接方式可能变化，暂不纳入本次改造 |

### 1.6 实际模块全景

当前 `src/views/` 下共 **14 个模块**，远超文档最初分析的标签中心范围：

| 模块 | 目录 | 提取优先级 | 说明 |
|------|------|-----------|------|
| 标签中心 | `label-center/` | 🟢 试点 | 首批提取 |
| 数据建模 | `data-modeling/` | 🟡 第二梯队 | 重度依赖 @antv/g6/x6 图引擎 |
| 数据集成 | `dataIntegration/` | 🟡 第二梯队 | — |
| 数据开发 | `datadevelop/` | 🟡 第二梯队 | — |
| 算子中心 | `operator-center/` | 🟡 第二梯队 | — |
| 数据治理 | `data-governance/` | 🔵 第三梯队 | 含路由注册耦合 |
| 元数据采集 | `data-collection/` | 🔵 第三梯队 | — |
| 数据源管理 | `datasource/` | 🔵 第三梯队 | — |
| 系统管理 | `system-manage/` | 🔵 第三梯队 | — |
| 首页 | `home/` | ⚪ 保留在主应用 | 项目入口 |
| 登录 | `login/` | ⚪ 保留在主应用 | 认证入口 |
| 异常页 | `exception/` | ⚪ 保留在主应用 | 404/500 等 |
| Demo | `demo/` | ⚪ 保留在主应用 | 组件演示 |
| 测试页 | `testPage/` | ⚪ 保留在主应用 | 开发调试 |

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
│   ├── src/components/Drawer/          ← 抽屉容器（原文档称 BasicDrawer）
│   ├── src/components/Form/            ← Schema 驱动表单（原文档称 BasicForm）
│   ├── src/components/Table/           ← 表格容器（原文档称 BasicTable）
│   ├── src/components/Modal/           ← 弹窗容器（原文档称 BasicModal）
│   ├── src/components/Tree/            ← 树组件
│   ├── src/components/Tags/            ← 标签展示组件
│   ├── src/components/Icon/            ← 图标组件
│   ├── src/components/Loading/         ← 加载组件
│   ├── src/components/ErrorMask/       ← 错误遮罩
│   ├── src/components/MonacoEditor/    ← 代码编辑器
│   ├── src/components/Graph/           ← 🆕 图可视化组件（@antv/g6/x6）
│   ├── src/components/MindToolbar/     ← 🆕 脑图工具栏
│   └── src/components/TableTrace/     ← 🆕 表格追溯
│
├── 🟡 共享工具依赖（需提取到 @datacenter/shared）
│   ├── src/utils/axios/                ← HTTP 客户端（VAxios 封装）
│   ├── src/utils/tree.js               ← 树数据结构工具
│   ├── src/utils/dateUtil.js           ← 日期处理（基于 dayjs）
│   ├── src/utils/is.js                 ← 类型判断
│   ├── src/utils/cipher.js             ← 加密工具（依赖 crypto-js）🆕
│   ├── src/utils/download.js           ← 文件下载
│   ├── src/utils/ws/                   ← 🆕 WebSocket（STOMP over SockJS）
│   ├── src/utils/env.js                ← 🆕 环境变量工具
│   └── src/utils/index.js              ← 🆕 通用工具集
│
├── 🟡 共享 Hooks（需提取到 @datacenter/shared）
│   ├── src/hooks/index.js              ← 🆕 useGlobSetting() 环境变量 composable
│   └── src/hooks/useAutoFit.js         ← 🆕 屏幕自适应 composable
│
├── 🟡 共享状态依赖（实际 9 个 store，以下列出全部）
│   ├── src/store/modules/tab.js        ← 多 Tab 导航状态（3.9KB，最大）🆕
│   ├── src/store/modules/theme.js      ← 主题状态
│   ├── src/store/modules/menu.js       ← 🆕 导航菜单
│   ├── src/store/modules/domain.js     ← 🆕 域/工作空间
│   ├── src/store/modules/model.js      ← 🆕 数据模型
│   ├── src/store/modules/dataCatalog.js← 🆕 数据目录
│   ├── src/store/modules/workflow.js   ← 🆕 工作流
│   ├── src/store/modules/demo.js       ← 🆕 Demo 状态
│   └── src/store/index.js              ← 🆕 Pinia 注册入口
│
├── 🟢 外部依赖（npm 包）
│   ├── ant-design-vue (v4)             ← UI 组件库
│   ├── @ant-design/icons-vue (v6)      ← 图标库
│   ├── vue-router (v4)                 ← 路由
│   ├── pinia (v2)                      ← 状态管理
│   ├── @vueuse/core                    ← 组合式工具集
│   ├── dayjs                           ← 日期处理
│   ├── lodash-es                       ← 通用工具
│   ├── @antv/g6 (v5)                   ← 🆕 图可视化引擎
│   ├── @antv/x6 (v3)                   ← 🆕 图编辑引擎
│   ├── @antv/x6-vue-shape (v3)         ← 🆕 图编辑 Vue 组件
│   ├── monaco-editor (v0.55)           ← 🆕 代码编辑器
│   ├── crypto-js (v4)                  ← 🆕 加密库
│   ├── qs (v6)                         ← 🆕 查询字符串序列化
│   ├── sockjs-client (v1.6)            ← 🆕 WebSocket 客户端
│   ├── stompjs (v2.3)                  ← 🆕 STOMP over WebSocket
│   ├── cron-parser (v4)                ← 🆕 Cron 表达式解析
│   ├── dagre (v0.8)                    ← 🆕 有向图布局
│   └── vue3-colorpicker                ← 🆕 颜色选择器
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
  "tasks": {
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
    "dev": "turbo run dev",
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
    "lodash-es": "^4.17",
    "crypto-js": "^4.1",
    "qs": "^6.11",
    "sockjs-client": "^1.6",
    "stompjs": "^2.3",
    "cron-parser": "^4.9"
  },
  "peerDependencies": {
    "vue": "^3.5",
    "ant-design-vue": "^4.0",
    "@ant-design/icons-vue": "^6.0",
    "@antv/g6": "^5.0",
    "@antv/x6": "^3.0",
    "@antv/x6-vue-shape": "^3.0",
    "monaco-editor": "^0.55",
    "pinia": "^2.1",
    "vue-router": "^4.2",
    "@vueuse/core": "^11.0"
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

### 4.6 问题六：`build/` 目录迁移（🔴 关键遗漏）

**现状**：当前 `build/` 目录包含 6 个自定义 Vite 插件和 2 个构建脚本，是构建体系的核心。

```
build/
├── constant.js              ← 构建常量（OUTPUT_DIR 等）
├── getConfigFileName.js     ← 配置文件名获取
├── utils.js                 ← env 包装函数（wrapperEnv）
├── script/
│   ├── buildConf.js         ← 构建配置文件生成
│   └── postBuild.js         ← 构建后处理脚本
└── vite/
    ├── proxy.js             ← 开发代理配置
    └── plugin/
        ├── index.js         ← 插件统一导出
        ├── compress.js      ← gzip/brotli 压缩
        ├── html.js          ← HTML 模板处理
        ├── imagemin.js      ← 图片压缩
        ├── pwa.js           ← PWA 支持
        └── svgSprite.js     ← SVG 雪碧图生成
```

**解决方案**：将 Vite 插件提取为 `@datacenter/vite-plugins` 包，构建脚本保留在主应用。

```
packages/
├── vite-plugins/                    ← 🆕 独立的 Vite 插件包
│   ├── package.json                 # name: "@datacenter/vite-plugins"
│   ├── index.js                     # 统一导出
│   └── src/
│       ├── compress.js
│       ├── html.js
│       ├── imagemin.js
│       ├── pwa.js
│       └── svgSprite.js
│
apps/main/
├── build/                           ← 保留，仅构建脚本
│   ├── constant.js
│   ├── getConfigFileName.js
│   ├── utils.js
│   └── script/
│       ├── buildConf.js
│       └── postBuild.js
└── vite.config.js                   ← 引用 @datacenter/vite-plugins
```

```js
// apps/main/vite.config.js
import { createVitePlugins } from '@datacenter/vite-plugins'
import { createProxy } from './build/vite/proxy'
import { wrapperEnv } from './build/utils'

// 各包在自己的 vite.config.js 中按需引入插件
```

**各插件在各包中的分配**：

| 插件 | shared | label-center | main | 说明 |
|------|--------|-------------|------|------|
| compress | ❌ | ❌ | ✅ | 仅最终构建需要 |
| html | ❌ | ✅ (dev) | ✅ | dev 模式各自需要 HTML 处理 |
| imagemin | ❌ | ❌ | ✅ | 仅最终构建需要 |
| pwa | ❌ | ❌ | ✅ | 仅主应用需要 |
| svgSprite | ❌ | ✅ | ✅ | label-center 有 19 个 SVG 图标 |

### 4.7 问题七：共享 Vite 基础配置

**现状**：`vite.config.js` 包含 Less、esbuild、build target、resolve alias 等通用配置，各包需要复制。

**解决方案**：提取 `vite.config.base.js` 供各包继承。

```js
// packages/shared/vite.config.base.js
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import WindiCSS from 'vite-plugin-windicss'

export function createBaseConfig({ alias = {}, plugins = [] } = {}) {
  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        ...alias
      }
    },
    css: {
      preprocessorOptions: {
        less: { javascriptEnabled: true }
      }
    },
    esbuild: {
      // 生产构建去除 console
      pure: process.env.VITE_DROP_CONSOLE === 'true' 
        ? ['console.log', 'debugger'] 
        : []
    },
    build: {
      target: 'es2015',
      cssTarget: 'chrome80'
    },
    plugins: [
      vue(),
      vueJsx(),
      WindiCSS(),
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', 'pinia']
      }),
      Components({
        resolvers: [AntDesignVueResolver()]
      }),
      ...plugins
    ]
  }
}
```

```js
// packages/label-center/vite.config.js
import { defineConfig } from 'vite'
import { createBaseConfig } from '@datacenter/shared/vite.config.base'

export default defineConfig(({ mode }) => {
  const base = createBaseConfig()
  
  if (mode === 'development') {
    return {
      ...base,
      server: { port: 3104 }  // 独立端口
    }
  }
  
  return {
    ...base,
    build: {
      ...base.build,
      lib: {
        entry: './index.js',
        name: 'LabelCenter'
      },
      rollupOptions: {
        external: ['vue', 'ant-design-vue', '@datacenter/shared']
      }
    }
  }
})
```

### 4.8 问题八：WindiCSS 配置共享

**现状**：`windi.config.js` 定义了主题色（`primary: '#0960bd'`）、动画插件、响应式断点。各包需要共享。

**解决方案**：提取到 shared，各包在 windi config 中继承。

```js
// packages/shared/windi.config.base.js
export const sharedWindiConfig = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0960bd'
      },
      screens: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        '2xl': '1600px'
      }
    }
  }
}
```

```js
// packages/label-center/windi.config.js
import { defineConfig } from 'vite-plugin-windicss'
import { sharedWindiConfig } from '@datacenter/shared/windi.config.base'

export default defineConfig({
  ...sharedWindiConfig,
  // 各包可覆盖或扩展
})
```

### 4.9 问题九：开发模式入口 HTML

**现状**：只有一个 `index.html`。label-center 独立开发时需要自己的入口。

**解决方案**：为 label-center 创建独立的 dev 入口。

```html
<!-- packages/label-center/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>标签中心 - 独立开发</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./dev/main.js"></script>
</body>
</html>
```

```js
// packages/label-center/dev/main.js
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { labelCenterRoutes } from '../src/router'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
  .use(createRouter({
    history: createWebHashHistory(),
    routes: labelCenterRoutes
  }))
  .use(Antd)
  .mount('#app')
```

```vue
<!-- packages/label-center/dev/App.vue -->
<template>
  <router-view />
</template>
```

### 4.10 问题十：Monaco Editor Worker 配置

**现状**：Monaco Editor 需要 Web Worker 处理语法高亮等。库模式下 Worker 路径可能出错。

**解决方案**：确保 Worker 文件在主应用构建时正确处理。

```js
// 主应用中配置 Monaco Editor Worker
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}
```

> ⚠️ **风险提示**：库模式下 import 路径可能被外部化导致 Worker 加载失败。建议在主应用的 `vite.config.js` 中将 `monaco-editor` 加入 `optimizeDeps.include`，并在 `build.rollupOptions.output.manualChunks` 中将 Monaco 拆分为独立 chunk。

### 4.11 问题十一：侧边栏菜单动态注册

**现状**：菜单在 `src/store/modules/menu.js` 中静态定义，新增模块需要修改 store 代码。

**解决方案**：提供菜单注册接口，各包导出菜单配置。

```js
// packages/label-center/src/menu.js
export const labelCenterMenu = {
  key: 'label-center',
  icon: 'TagsOutlined',
  title: '标签中心',
  children: [
    { key: '/labelCenter/TagOverview', title: '标签总览' },
    { key: '/labelCenter/tagManagement', title: '标签管理' },
    { key: '/labelCenter/TagTemplate', title: '标签模板' },
    { key: '/labelCenter/LabelingRules', title: '打标规则' },
    { key: '/labelCenter/MarkingTask', title: '打标任务' }
  ]
}
```

```js
// apps/main 启动时注册
import { labelCenterMenu } from '@datacenter/label-center/menu'
import { useMenuStore } from '@/store/modules/menu'

const menuStore = useMenuStore()
menuStore.registerModule(labelCenterMenu)
```

### 4.12 问题十二：图组件支持规划

**现状**：项目重度使用 `@antv/g6` (v5)、`@antv/x6` (v3) 图引擎，主要服务于数据建模模块的 ER 图编辑器。提取数据建模之前，需要先确认 shared 包对图组件的支持层级。

**分析**：

| 组件 | 依赖引擎 | 当前使用模块 | 提取策略 |
|------|----------|-------------|----------|
| `Graph/` | @antv/g6 | data-modeling, data-governance | 放入 shared，作为基础图能力 |
| `MindToolbar/` | @antv/x6 | data-modeling | 放入 shared |
| `TableTrace/` | — | 多模块 | 放入 shared |

**建议分层**：

```
packages/shared/
├── src/components/
│   ├── Graph/              ← 基础图可视化（v-graph 包装）
│   ├── MindToolbar/        ← 脑图工具栏
│   └── TableTrace/         ← 表格追溯
│
packages/data-modeling/     ← 未来提取
├── src/
│   ├── views/ErEditor/     ← ER 模型编辑器（深度使用 @antv/x6）
│   └── components/         ← 建模专用图组件
```

> **注意**：`@antv/g6` 和 `@antv/x6` 作为 peerDependencies 放在 shared 中，实际版本由主应用锁定。数据建模模块提取前，需完成 shared 中图基础组件建设。

### 4.13 问题十三：CI/CD 与自动部署

**现状**：无任何 CI/CD 配置。当前部署流程为手动 Nginx 配置：`npm run build` → 将 dist/ 上传到服务器 → 手动修改 Nginx 配置。

**目标**：基于 Turborepo 实现增量构建，加入自动部署流程。

**CI/CD 流水线设计**：

```yaml
# .github/workflows/ci.yml（推荐方案）
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint        # turbo run lint（按包并行）

  build:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/cache@v4     # Turborepo 远程缓存
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: turbo-
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build        # turbo run build（增量构建）
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: apps/main/dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Deploy to Nginx
        run: |
          rsync -avz dist/ user@server:/usr/share/nginx/html/
          # 或 scp + ssh 远程重启 nginx
```

**Turborepo 增量构建优势**：
- 仅构建变更的包及其依赖方（`turbo run build --filter=[HEAD^1]`）
- 远程缓存（`turbo run build --cache-dir=.turbo`）共享 CI 和本地构建结果
- shared 包变更才触发全部重建，label-center 变更仅构建 label-center → main

**Nginx 配置模板**（纳入版本管理）：
```nginx
# deploy/nginx/datacenter.conf
server {
    listen 80;
    server_name datacenter.example.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:7904/;
        proxy_set_header Host $host;
    }
}
```

---

## 五、分阶段实施计划

### 前置阶段：环境统一（0.5 天）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 全团队安装 pnpm ≥ 8.x | — | 统一包管理器 |
| 删除 `package-lock.json`、`yarn.lock` | 0.1 天 | 仅保留 `pnpm-lock.yaml` |
| 创建 `.npmrc` 配置 | 0.1 天 | `shamefully-hoist=true` |
| 添加 `.gitignore` 规则（排除其他锁文件） | 0.1 天 | 防止误提交 |
| 验证 pnpm install 成功 | 0.2 天 | 全员开发环境正常 |

### 第一阶段：基础设施搭建（Week 1）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 安装配置 pnpm workspace | 0.5 天 | `pnpm-workspace.yaml`、`.npmrc` |
| 安装配置 Turborepo | 0.5 天 | `turbo.json` |
| 提取 `@datacenter/vite-plugins` 包 | 1 天 | 🆕 6 个插件独立构建 |
| 创建 `packages/shared/` 骨架 | 1 天 | 包结构 + vite 基础配置 + windi 基础配置 |
| 迁移通用工具到 shared | 1.5 天 | utils（含 axios、ws、tree、date、cipher 等） 🆕 增加了 ws/ |
| 迁移通用组件到 shared | 2 天 | Drawer, Form, Table, Modal, Tree, Tags, Graph 等 🆕 增加了 Graph/ |

**第一阶段验收标准**：
- ✅ `@datacenter/shared` 可独立构建
- ✅ `@datacenter/vite-plugins` 可独立构建
- ✅ 主应用可从 shared 包导入工具和组件
- ✅ 开发服务器正常启动，HMR 正常

### 第二阶段：标签中心提取（Week 2）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| 创建 `packages/label-center/` 骨架 | 0.5 天 | 包结构 + dev index.html + dev 入口 🆕 |
| 迁移标签中心视图组件 | 1 天 | views/ 迁移 |
| 迁移 API 层并适配 shared | 1 天 | api/ 迁移，使用 shared 的 defHttp |
| 迁移图标和静态资源 | 0.5 天 | assets/ 迁移（svgSprite 插件支持） |
| 导出路由配置和 Store | 0.5 天 | router.js + store 注册 |
| 导出菜单配置 | 0.3 天 | 🆕 menu.js |
| 主应用集成 | 1.5 天 | 修改路由、菜单注册、导入路径 🆕 增加了菜单集成 |
| Monaco Editor Worker 验证 | 0.2 天 | 🆕 确认库模式下 Worker 正常加载 |

**第二阶段验收标准**：主应用通过 `@datacenter/label-center` 正常渲染标签中心全部功能

### 第三阶段：CI/CD 搭建 & 验证（Week 3）

| 任务 | 预估工时 | 产出 |
|------|---------|------|
| GitHub Actions 流水线配置 | 1 天 | 🆕 CI 文件（lint + build + deploy） |
| Turborepo 远程缓存配置 | 0.3 天 | 🆕 加速 CI 构建 |
| Nginx 配置模板纳入仓库 | 0.2 天 | 🆕 `deploy/nginx/` |
| 自动部署脚本编写 | 0.5 天 | 🆕 rsync/ssh 自动部署 |
| 全功能回归测试 | 1 天 | 测试报告 |
| 构建和部署验证 | 0.5 天 | 生产构建无报错 |
| 性能对比（Bundle 大小） | 0.5 天 | 前后构建产物体积对比 |
| 迁移脚本编写 | 0.5 天 | 🆕 批量替换导入路径的脚本 |
| 文档编写 | 1 天 | 开发指南、包使用说明 |
| 团队培训和规范制定 | 0.5 天 | 新模块开发规范 |

**第三阶段验收标准**：
- ✅ CI 流水线正常执行（lint → build → deploy）
- ✅ 标签中心功能回归测试通过
- ✅ 生产构建体积无明显增大（允许 ±5%）
- ✅ 部署流程文档化

### 第四阶段：推广到其他模块（按需）

遵循相同模式提取以下模块：

| 优先级 | 模块 | 关键依赖 | 预估难度 |
|--------|------|----------|----------|
| 🟡 第一批 | **数据建模** (`data-modeling`) | @antv/x6 图引擎、Graph 组件 | ⭐⭐⭐⭐ 高（图引擎+ER编辑器） |
| 🟡 第一批 | **算子中心** (`operator-center`) | shared 基础组件 | ⭐⭐ 较低 |
| 🔵 第二批 | **数据同步** (`dataIntegration`) | 待分析 | ⭐⭐⭐ 中等 |
| 🔵 第二批 | **元数据目录** (`data-collection`) | 待分析 | ⭐⭐⭐ 中等 |
| 🔵 第二批 | **数据源管理** (`datasource`) | 待分析 | ⭐⭐ 较低 |
| 🔵 第三批 | **数据治理** (`data-governance`) | 路由耦合较深 | ⭐⭐⭐ 中等 |
| 🔵 第三批 | **数据开发** (`datadevelop`) | 待分析 | ⭐⭐⭐ 中等 |

> **数据建模优先的原因**：重度依赖 @antv/x6（ER 图编辑器），组件可复用性最高。但需先完成 shared 中 Graph 基础组件建设。预估需额外 1.5-2 周。

---

## 六、可行性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 代码解耦难度 | ⭐⭐⭐ 中等 | 标签中心与 shared 耦合深，需三层分离 |
| 构建配置复杂度 | ⭐⭐⭐ 中等 | 🆕 需提取 vite-plugins 包、共享 base config、WindiCSS 配置 |
| 路由/菜单集成 | ⭐⭐ 较易 | Vue Router 天然支持动态注册 |
| 状态管理迁移 | ⭐⭐ 较易 | Pinia 自动注册，跨包使用无额外成本 |
| API 层解耦 | ⭐⭐⭐ 中等 | defHttp 需要重构为可插拔拦截器 |
| 样式/主题一致性 | ⭐⭐⭐ 中等 | Less 变量和 WindiCSS 配置需要共享 |
| 开发体验保持 | ⭐⭐ 较易 | pnpm workspace 支持本地包热更新 |
| 回滚风险 | ⭐ 低 | 可逐包迁移、逐包回滚 |
| **综合可行性** | **✅ 可行** | 建议分阶段推进，3.5 周完成 MVP 🆕 增加了前置+CICD |

---

## 七、风险与缓解措施

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| shared 包范围界定不清 | 🔴 高 | 先梳理完整依赖图，定义明确的包边界 |
| 库模式构建配置复杂 | 🟡 中 | 复用 Vite 配置模板，参考成熟库的配置 |
| 主应用导入路径大量修改 | 🟡 中 | 编写迁移脚本批量替换导入路径 |
| 各包版本管理混乱 | 🟡 中 | 使用 Changesets 统一版本管理 |
| lock 文件冲突 | 🟡 中 | 统一切换到 pnpm，删除 package-lock.json 和 yarn.lock |
| **build/ 目录拆分导致插件失效** | 🔴 🆕 高 | 先在 vite-plugins 包中逐个验证插件独立可用 |
| **Monaco Editor Worker 路径错误** | 🟡 🆕 中 | 在主应用 vite.config 中手动配置 Worker，加入 optimizeDeps |
| **Graph 组件库模式兼容性** | 🟡 🆕 中 | @antv/g6/x6 在库模式下可能有问题，提前验证 |
| **跨包 Store 循环引用** | 🟡 🆕 中 | 约定 Store 引用方向：子包 → 主应用 Store，不可反向 |
| **shared 变更触发全量构建** | 🟢 🆕 低 | Turborepo 自动处理，仅影响依赖方 |
| **pnpm 团队学习成本** | 🟢 🆕 低 | pnpm CLI 与 npm 高度兼容，迁移成本极低 |

---

## 八、收益预估

| 收益 | 当前 | 目标 |
|------|------|------|
| 标签中心复用性 | 无法复用（单体耦合） | 可通过 workspace 协议在任意项目使用 |
| 新模块开发效率 | 需在单体中手动搭建 | 基于 shared 包快速组装 |
| 代码一致性 | 依赖人工 Review | shared 包强制统一组件和工具 |
| 构建速度 | 全量构建 2-5 分钟 | 按包增量构建，修改 shared 才触发完整构建 |
| 团队协作 | 同一仓库冲突频繁 | 按包 Code Review，减少冲突 |
| CI/CD 自动化 | 手动构建 + 手动部署 | 🆕 自动化 lint → build → deploy 流水线 |
| 部署可靠性 | 手动操作易出错 | 🆕 部署配置纳入版本管理（`deploy/nginx/`） |
| 新成员上手 | 需理解全量代码 | 🆕 按包边界理解，新人可专注于单个模块 |
| 跨项目共享组件 | 组件沉淀在单体内部 | 🆕 @datacenter/vite-plugins 和 shared 可跨项目复用 |

---

## 九、结论

**技术可行性：✅ 高度可行**

以 pnpm workspace + Turborepo 为基础设施，分阶段将标签中心提取为独立包，同时建设 `@datacenter/shared` 共享层和 `@datacenter/vite-plugins` 构建插件包。整个过程的回滚风险低，每一步都有明确的验收标准。

**推荐启动条件**：
1. ✅ 确认 pnpm 为统一包管理器，删除 npm/yarn 锁文件
2. ✅ 确认 Turborepo 作为任务编排工具
3. ✅ 确认「标签中心」作为首个试点模块
4. 🆕 确认 CI/CD 平台选型（推荐 GitHub Actions）

**预估总工期**：3.5 周（含前置环境统一 + CI/CD 搭建）

**关键里程碑**：

| 里程碑 | 时间点 | 交付物 |
|--------|--------|--------|
| M0: 环境就绪 | Day 0.5 | 全员切换 pnpm，唯一 lock 文件 |
| M1: shared 可构建 | Week 1 末 | `@datacenter/shared` + `@datacenter/vite-plugins` 独立构建成功 |
| M2: 标签中心可独立运行 | Week 2 末 | `pnpm --filter @datacenter/label-center dev` 正常 |
| M3: 主应用集成 | Week 2 末 | 主应用通过 workspace 协议渲染标签中心 |
| M4: CI/CD 就绪 | Week 3 中 | 自动化 lint → build → deploy |
| M5: 上线 | Week 3 末 | 生产环境切换 monorepo 构建产物 |

**暂不纳入本次改造**：
- ❌ TypeScript 迁移
- ❌ Storybook 组件文档
- ❌ 单元测试（包括 shared 包）
- ❌ npm 私有仓库
- ❌ 知识库体系改造（等待 Figma → MasterGo 迁移完成）
- ❌ Docker 容器化部署

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

### B. .npmrc 推荐配置

```ini
# .npmrc
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
```

### C. 参考资源

- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Turborepo 文档](https://turbo.build/repo/docs)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [Changesets 版本管理](https://github.com/changesets/changesets)
- [GitHub Actions 文档](https://docs.github.com/en/actions) 🆕
- [Monaco Editor ESM + Vite 集成指南](https://github.com/microsoft/monaco-editor/tree/main/samples/browser-esm-vite-react) 🆕
