# LingoFlow (v1.0) — YouTube Dual Subtitles Pro

[English] | [中文](./README_zh.md)

**LingoFlow** is a powerful browser extension that enhances your YouTube experience with real-time bilingual subtitles and intelligent language learning tools. Designed for learners, professionals, and polyglots who want to absorb languages naturally through video content.

## ✨ Features

### 🎬 Immersive Dual Subtitles
Seamlessly embed bilingual subtitles beneath any YouTube video. See the original captions alongside accurate translations — no context-switching needed.

### 📖 Hover-to-Translate Vocabulary
Hover over any word in the original subtitle to instantly reveal phonetics, definitions, and example sentences. Powered by Microsoft Dictionary for accurate, context-aware results.

### ⏯️ Smart Playback Sync
The video automatically pauses when you explore a new word and resumes when you move away. Learn without missing a beat.

### 📋 Learning Sidebar
- **Live Caption List**: Full scrollable transcript with clickable timestamps for instant navigation.
- **Dynamic Word Book**: Automatically collects every word you've looked up, along with its context from the video.

### 📤 Export & Review
Export your word book in **JSON**, **CSV**, **TXT**, or **Markdown** — ready for Anki, Notion, or any study workflow.

### 🌐 Multiple Translation Engines
Supports Microsoft Translate, Google Translate, DeepL, and more. Choose the engine that works best for your language pair.

## 🗂️ Project Structure

| Directory | Description |
|---|---|
| `src/subtitle/` | Core subtitle renderer, sidebar UI, and YouTube caption provider |
| `src/apis/` | Translation & Microsoft Dictionary API integrations |
| `src/injectors/` | Low-level request interception and Shadow DOM mapping scripts |
| `src/libs/` | Lightweight utilities (logging, caching, storage) |
| `src/config/` | Internationalization (i18n) and configuration |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development (with HMR)
```bash
npm start
```

### Build for Production
```bash
npm run build
```

Load the `dist/` folder as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).


## 📜 License & Credits

This project is based on [fishjar/kiss-translator](https://github.com/fishjar/kiss-translator) and is licensed under the [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) License.

---

Built with ❤️ by **LingoFlow Team**
