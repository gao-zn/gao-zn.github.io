import { defineConfig } from "vitepress";

// 文章侧边栏
const articlesSidebar = [
  {
    text: "技术文章",
    items: [
      { text: "VitePress 搭建个人博客", link: "/first-post" },
      { text: "WindiCSS 迁移 UnoCSS", link: "/second-post" },
      { text: "PostCSS 学习笔记", link: "/PostCSS" },
      { text: "升级框架中的过时插件", link: "/框架插件升级" },
      { text: "Node.js + TS Monorepo 架构", link: "/notes" },
      { text: "大前端应用全栈开发", link: "/大前端全栈架构" },
    ],
  },
];

// 技术方案侧边栏
const proposalsSidebar = [
  {
    text: "技术方案",
    items: [
      { text: "MCP 智能体集成框架", link: "/mcp-agent-framework-analysis" },
      { text: "Monorepo 改造可行性分析", link: "/monorepo-feasibility-analysis" },
      { text: "设计稿屏幕适配方案", link: "/screen-adaptation-analysis" },
    ],
  },
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  lang: "zh-Hans",
  title: "gzn的乌托邦",
  description: "一个前端工程师的思考与记录",

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/articles" },
      { text: "方案", link: "/proposals" },
    ],

    sidebar: {
      "/articles": articlesSidebar,
      "/first-post": articlesSidebar,
      "/second-post": articlesSidebar,
      "/PostCSS": articlesSidebar,
      "/框架插件升级": articlesSidebar,
      "/notes": articlesSidebar,
      "/大前端全栈架构": articlesSidebar,

      "/proposals": proposalsSidebar,
      "/mcp-agent-framework-analysis": proposalsSidebar,
      "/monorepo-feasibility-analysis": proposalsSidebar,
      "/screen-adaptation-analysis": proposalsSidebar,
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/gao-zn" },
    ],

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    lastUpdated: {
      text: "最后更新",
    },
  },
});
