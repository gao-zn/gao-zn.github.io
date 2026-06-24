---
title: 从0到1：我用vitePress搭建了一个个人博客
date: 2024-03-09
---

# 从0到1： 我用VitePress搭了一个个人博客

## 为什么要写这篇文章

作为一个前端工程师，一直想要一个自己的技术博客
作为vue开发者，发现VitePress更符合我的技术栈
这篇文还在那个记录我的搭建过程，希望能帮到想搭博客的朋友

## 选型对比

对比了三个方案

- **Hexo**: 老博客工具，但主题定制需要会ejs
- **VuePress**: Vue2生态，配置稍重
- **VitePress**: Vue3 + Vite, 轻量快速，最终选它

## 搭建步骤

### 1.创建项目文件夹并进入

```bash
mkdir my-blog && cd my-blog
```

### 2.安装VitePress

```bash
npm add -D vitepress
```

### 3.启动初始化向导

```bash
npx vitepress init
```

### 4.启动项目，预览效果

```bash
npm run docs:dev
```

## 遇到的坑

### 1.启动报错 crypto.getRandomValues is not a function

- **解决**：Node.js 版本太低，crypto.getRandomValues 是一个 Web API，在旧版本 Node.js 中可能不完全支持,升级到 18+ 就好了
