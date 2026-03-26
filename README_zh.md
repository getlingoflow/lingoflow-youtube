# LingoFlow (v1.0) — YouTube 双语字幕专业版

[English](./README.md) | [中文]

**LingoFlow** 是一款功能强大的浏览器扩展，通过实时双语字幕和智能语言学习工具提升您的 YouTube 体验。专为想要通过视频内容自然吸收语言的学习者、专业人士和多语言爱好者设计。

## ✨ 特性

### 🎬 沉浸式双语字幕
在任何 YouTube 视频下方无缝嵌入双语字幕。同时查看原始字幕和精准译文 — 无需频繁切换上下文。

### 📖 悬停翻译生词
将鼠标悬停在原始字幕中的任何单词上，即可立即显示读音、释义和例句。由微软词典提供动力，为您提供精准且符合语境的结果。

### ⏯️ 智能播放同步
当您探索新单词时，视频会自动暂停；当您的视线移开时，视频会自动恢复播放。在不遗漏任何细节的情况下进行学习。

### 📋 学习侧边栏
- **实时字幕列表**：完整的可滚动字幕列表，带有可点击的时间戳，可实现即时导航。
- **动态生词本**：自动收集您查过的每一个单词，并附带视频中的原始上下文。

### 📤 导出与复习
将您的单词本导出为 **JSON**、**CSV**、**TXT** 或 **Markdown** 格式 — 随时可导入 Anki、Notion 或任何学习流程。

### 🌐 多种翻译引擎
支持 Microsoft Translate、Google Translate、DeepL 等多种引擎。根据您的语言对选择最适合的翻译引擎。

## 🗂️ 项目结构

| 目录 | 描述 |
|---|---|
| `src/subtitle/` | 核心字幕渲染器、侧边栏 UI 和 YouTube 字幕提供程序 |
| `src/apis/` | 翻译和微软词典 API 集成 |
| `src/injectors/` | 低层请求拦截和 Shadow DOM 映射脚本 |
| `src/libs/` | 轻量级工具库 (日志、缓存、存储) |
| `src/config/` | 国际化 (i18n) 和全局配置 |

## 🚀 快速入门

### 前提条件
- Node.js 18+
- npm 或 yarn

### 安装
```bash
npm install
```

### 开发模式 (支持热更新)
```bash
npm start
```

### 生产环境构建
```bash
npm run build
```

在 Chrome 中将 `dist/` 文件夹加载为已解压的扩展程序 (`chrome://extensions` → 开发者模式 → 加载已解压的扩展程序)。


## 📜 开源协议与致谢

本项目基于 [fishjar/kiss-translator](https://github.com/fishjar/kiss-translator) 开发，并采用 [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) 协议开源。

---

由 **LingoFlow 团队** 用 ❤️ 构建
