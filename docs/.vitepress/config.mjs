import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/my-blog/" : "/",
  lang: "zh-Hans",
  title: "gzn的乌托邦",
  description: "一个前端工程师的思考与记录",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/first-post" },
    ],

    sidebar: [
      {
        items: [
          { text: "简介", link: "/first-post" },
          { text: "WindiCSS迁移UnoCSS", link: "/second-post" },
          { text: "PostCss学习", link: "/postcss" },
          { text: "框架插件升级", link: "/框架插件升级" },
          { text: "Node全栈", link: "/notes" },
          { text: "大前端全栈架构", link: "/大前端全栈架构" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
