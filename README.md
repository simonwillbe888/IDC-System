# IDC 运营指挥平台

一个基于 Vue 3 + Vite + TypeScript 的现代化 IDC（互联网数据中心）运营指挥平台。

## 🌐 在线演示

访问 GitHub Pages: [https://simonwillbe888.github.io/IDC-System/](https://simonwillbe888.github.io/IDC-System/)

## 功能特性

- 📊 实时数据监控仪表板
- 🗺️ 机架地图可视化
- 🤖 AI 智能助手（集成 Kimi AI）
- 📋 系统日志查看

## 快速开始

1. 安装依赖：
   ```bash
   npm install
   ```

2. 配置环境变量：
   复制 `.env.example` 到 `.env` 并设置你的 API 密钥

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

4. 构建生产版本：
   ```bash
   npm run build
   ```

## 部署到 GitHub Pages

运行部署脚本：
```bash
.\deploy.ps1
```

## 技术栈

- Vue 3
- Vite
- TypeScript
- Tailwind CSS
- Pinia (状态管理)
- D3.js (数据可视化)
