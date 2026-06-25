import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  lang: "zh-Hans",
  title: "gzn的乌托邦",
  description: "一个前端工程师的思考与记录",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/first-post" },
      { text: "方案", link: "/mcp-agent-framework-analysis" },
    ],

    sidebar: [
      {
        text: "文章",
        items: [
          { text: "简介", link: "/first-post" },
          { text: "WindiCSS迁移UnoCSS", link: "/second-post" },
          { text: "PostCss学习", link: "/postcss" },
          { text: "框架插件升级", link: "/框架插件升级" },
          { text: "Node全栈", link: "/notes" },
          { text: "大前端全栈架构", link: "/大前端全栈架构" },
        ],
      },
      {
        text: "技术方案",
        items: [
          { text: "MCP 智能体集成框架", link: "/mcp-agent-framework-analysis" },
          {
            text: "Monorepo 改造可行性分析",
            link: "/monorepo-feasibility-analysis",
          },
          { text: "设计稿屏幕适配方案", link: "/screen-adaptation-analysis" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
