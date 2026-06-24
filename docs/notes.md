# 基于Nodejs + Typescript 以及monorepo的架构设计思路

- cli 工具启动
- 从零手搭
  - 工程组织 monorepo
  - 规范化 eslint stylelint spellcheck commitlint
  - 构建打包 vite esbuild webpack
  - 测试 jest vitest **Playwright cypress**

monorepo的优势

```bash
    npm init -y
```

- nodejs 环境
- typescript
- monorepo 架构
  1. 配置文件 (pnpm-workspace.yaml)
  2. 分析子包结构
  3. 划分子包与子模块
  ```json
  packages:
      - "packages/*"
      - "apps/*"
  ```

## AI应用赋能产品全栈开发，详细架构和核心流程拆解

1. AI可协助的模块
   - CRM，用户追踪数据借助AI统计分析
   - 开发， 基于AI自动审查工具审查成员代码
   - codereview, 借助AI做自动化代码审查
   - 报表类公司（BI、数据分析）， 基于ChatDB + RAG做一些自动化报表场景
   - 后台管理系统, 简化操作， 把AI作为客服助手
     - RAG知识库
     - PLaywright 进行自动化操作
     - AI + 自动化解决方案（LLM + PLaywright、Auto）

2. 实施
   - LLM 本地化 【ollama+qwen3】
   - CI/CD
   - Docker 虚拟化， 分配资源统计资源 【docker compose】
   - AI 大模型应用开发 【langChainjs、mastra】
   - 监控告警
   - 安全
   - 日志

3. 具体实施
   - 安装包
   ```json
       langchain
       @langchain/core
       @langchain/ollama
       @langchain/community
       @types/node
   ```
