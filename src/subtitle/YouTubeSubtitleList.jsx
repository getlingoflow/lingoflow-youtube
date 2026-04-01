import { logger } from "../libs/log";

/**
 * YouTube 字幕列表管理器
 * 负责在 YouTube 视频播放时显示同步滚动的字幕列表和生词本
 */
export class YouTubeSubtitleList {
  constructor(videoElement) {
    this.videoEl = videoElement;
    this.subtitleData = [];
    this.subtitleDataTime = [];
    this.bilingualSubtitles = [];
    this.vocabulary = [];

    this.container = null;
    this.subtitleListEl = null;
    this.vocabularyListEl = null;
    this.loopAutoScroll = null;
    this._resizeObserver = null;
    this._themeObserver = null;
    this._isDragging = false;
    this._dragStartY = 0;
    this._dragStartHeight = 0;
    
    this._theme = this._detectTheme();

    this.activeTab = "subtitles";

    this.handleWordAdded = this.handleWordAdded.bind(this);
    document.addEventListener("lingoflow-add-word", this.handleWordAdded);
    
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "LINGOFLOW_TRANSLATOR_JUMP_TO_TIME") {
        if (this.videoEl) {
          this.videoEl.currentTime = event.data.time / 1000;
          if (this.videoEl.paused) {
            this.videoEl.play();
          }
        }
      }
    });
  }

  handleWordAdded(event) {
    if (event.detail && event.detail.word) {
      this.addWord(
        event.detail.word, 
        event.detail.phonetic || "", 
        event.detail.definition || "", 
        event.detail.examples || [],
        event.detail.timestamp || null
      );
    }
  }

  addWord(word, phonetic = "", definition = "", examples = [], timestamp = null) {
    if (word) {
      const existingIndex = this.vocabulary.findIndex(item => item.word === word);
      if (existingIndex !== -1) {
        const currentItem = this.vocabulary[existingIndex];
        if (phonetic && !currentItem.phonetic) currentItem.phonetic = phonetic;
        if (definition && !currentItem.definition) currentItem.definition = definition;
        if (examples.length > 0 && (!currentItem.examples || currentItem.examples.length === 0)) {
          currentItem.examples = examples;
        }
        if (timestamp && !currentItem.timestamp) currentItem.timestamp = timestamp;
      } else {
        this.vocabulary.push({ word, phonetic, definition, examples, timestamp });
      }
      this._renderVocabulary();
    }
  }

  _detectTheme() {
    return document.documentElement.hasAttribute('dark') || 
           window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // ==================== 样式常量 ====================
  get _styles() {
    return {
      primary: 'var(--lingoflow-primary)',
      primarySubtle: 'var(--lingoflow-primary-subtle)',
      bg: 'var(--lingoflow-bg)',
      bgCard: 'var(--lingoflow-bg-card)',
      bgHover: 'var(--lingoflow-bg-hover)',
      bgActive: 'var(--lingoflow-bg-active)',
      textEn: 'var(--lingoflow-text-en)',
      textEnActive: 'var(--lingoflow-text-en-active)',
      textZh: 'var(--lingoflow-text-zh)',
      textZhActive: 'var(--lingoflow-text-zh-active)',
      textTime: 'var(--lingoflow-text-time)',
      textTimeActive: 'var(--lingoflow-text-time-active)',
      divider: 'var(--lingoflow-divider)',
      tabBorder: 'var(--lingoflow-tab-border)',
      btnBg: 'var(--lingoflow-btn-bg)',
      dragHandle: 'var(--lingoflow-drag-handle)',
    };
  }

  // ==================== 获取视频播放器高度 ====================
  _getVideoPlayerHeight() {
    try {
      const player = document.getElementById('movie_player') || 
                     this.videoEl?.closest('#movie_player') ||
                     this.videoEl?.closest('.html5-video-player');
      if (player) return player.offsetHeight;
      if (this.videoEl) return this.videoEl.offsetHeight;
      return 500;
    } catch {
      return 500;
    }
  }

  _syncContainerHeight() {
    if (!this.container) return;
    const playerH = this._getVideoPlayerHeight();
    this.container.style.height = `${playerH}px`;
  }

  // ==================== 拖拽改变高度 ====================
  _createDragHandle() {
    const s = this._styles;
    const handle = document.createElement("div");
    handle.className = "lingoflow-drag-handle";
    Object.assign(handle.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      right: "0",
      height: "8px",
      cursor: "ns-resize",
      background: `linear-gradient(to bottom, transparent, ${s.dragHandle})`,
      borderRadius: "0 0 12px 12px",
      transition: "background 0.2s",
      zIndex: "10",
    });

    // 中间指示条
    const indicator = document.createElement("div");
    Object.assign(indicator.style, {
      width: "40px",
      height: "3px",
      background: s.dragHandle,
      borderRadius: "2px",
      margin: "3px auto 0",
      transition: "background 0.2s, width 0.2s",
    });
    handle.appendChild(indicator);

    handle.addEventListener("mouseenter", () => {
      indicator.style.background = s.dragHandleHover;
      indicator.style.width = "60px";
      handle.style.background = `linear-gradient(to bottom, transparent, ${s.dragHandleHover})`;
    });
    handle.addEventListener("mouseleave", () => {
      if (!this._isDragging) {
        indicator.style.background = s.dragHandle;
        indicator.style.width = "40px";
        handle.style.background = `linear-gradient(to bottom, transparent, ${s.dragHandle})`;
      }
    });

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this._isDragging = true;
      this._dragStartY = e.clientY;
      this._dragStartHeight = this.container.offsetHeight;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e) => {
        if (!this._isDragging) return;
        const delta = e.clientY - this._dragStartY;
        const newHeight = Math.max(200, Math.min(window.innerHeight - 100, this._dragStartHeight + delta));
        this.container.style.height = `${newHeight}px`;
      };

      const onMouseUp = () => {
        this._isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        indicator.style.background = s.dragHandle;
        indicator.style.width = "40px";
        handle.style.background = `linear-gradient(to bottom, transparent, ${s.dragHandle})`;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    return handle;
  }

  // ==================== 生词本渲染 ====================
  _renderVocabulary() {
    if (!this.vocabularyListEl) return;
    const s = this._styles;
    this.vocabularyListEl.replaceChildren();

    // 导出按钮栏
    const exportBar = document.createElement("div");
    Object.assign(exportBar.style, {
      padding: "10px 16px",
      borderBottom: `1px solid ${s.border}`,
      display: "flex",
      justifyContent: "flex-end",
      gap: "6px",
      flexShrink: "0",
    });

    if (this.vocabulary.length > 0) {
      const formats = [
        { label: "JSON", fn: () => this.exportVocabularyAsJson() },
        { label: "CSV", fn: () => this.exportVocabularyAsCsv() },
        { label: "TXT", fn: () => this.exportVocabularyAsTxt() },
        { label: "MD", fn: () => this.exportVocabularyAsMd() },
      ];

      formats.forEach(({ label, fn }) => {
        const btn = document.createElement("button");
        btn.textContent = `Export ${label}`;
        Object.assign(btn.style, {
          padding: "5px 10px",
          background: s.btnBg,
          color: s.textZh,
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "500",
          transition: "all 0.15s",
          fontFamily: "inherit",
        });
        btn.addEventListener("mouseenter", () => { btn.style.background = s.bgHover; });
        btn.addEventListener("mouseleave", () => { btn.style.background = s.btnBg; });
        btn.addEventListener("click", fn);
        exportBar.appendChild(btn);
      });
    }

    // 词汇列表
    const vocabScroll = document.createElement("div");
    Object.assign(vocabScroll.style, {
      overflowY: "auto",
      overflowX: "hidden",
      flex: "1",
      padding: "0 12px",
      minHeight: "0",
    });

    const vocabList = document.createElement("div");
    Object.assign(vocabList.style, {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      padding: "8px 0",
    });

    if (this.vocabulary.length === 0) {
      const empty = document.createElement("div");
      Object.assign(empty.style, {
        padding: "40px 20px",
        textAlign: "center",
        color: s.textMuted,
        fontSize: "13px",
        lineHeight: "1.6",
      });
      empty.innerHTML = `<div style="font-size:28px;margin-bottom:12px">📖</div>
        <div>Hover over words in subtitles to<br/>add them to your vocabulary list</div>`;
      vocabList.appendChild(empty);
    }

    this.vocabulary.forEach((item) => {
      const card = document.createElement("div");
      Object.assign(card.style, {
        padding: "12px 14px",
        borderBottom: `1px solid ${s.divider}`,
        transition: "background 0.15s",
      });
      card.addEventListener("mouseenter", () => { card.style.background = s.bgHover; });
      card.addEventListener("mouseleave", () => { card.style.background = "transparent"; });

      // 单词行
      const wordLine = document.createElement("div");
      Object.assign(wordLine.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "6px",
        flexWrap: "wrap",
      });

      const wordEl = document.createElement("span");
      wordEl.textContent = item.word;
      Object.assign(wordEl.style, {
        fontWeight: "600",
        fontSize: "16px",
        color: s.textEn,
      });

      wordLine.appendChild(wordEl);

      if (item.phonetic) {
        const phoneticEl = document.createElement("span");
        const clean = item.phonetic.replace(/US\s*/g, '').replace(/[\[\]]/g, '');
        phoneticEl.textContent = `[${clean}]`;
        Object.assign(phoneticEl.style, {
          color: s.textTime,
          fontStyle: "italic",
          fontSize: "13px",
        });
        wordLine.appendChild(phoneticEl);
      }

      if (item.timestamp) {
        const tsBtn = document.createElement("button");
        tsBtn.textContent = this.millisToMinutesAndSeconds(item.timestamp);
        Object.assign(tsBtn.style, {
          color: s.primary,
          background: "rgba(79, 142, 247, 0.1)",
          border: "none",
          padding: "2px 6px",
          fontSize: "11px",
          cursor: "pointer",
          borderRadius: "3px",
          fontFamily: "monospace",
        });
        tsBtn.addEventListener("click", () => {
          if (this.videoEl) {
            this.videoEl.currentTime = item.timestamp / 1000;
            if (this.videoEl.paused) this.videoEl.play();
          }
        });
        wordLine.appendChild(tsBtn);
      }

      card.appendChild(wordLine);

      if (item.definition) {
        const defEl = document.createElement("div");
        defEl.textContent = item.definition;
        Object.assign(defEl.style, {
          color: s.textZh,
          fontSize: "14px",
          lineHeight: "1.5",
          marginBottom: "6px",
        });
        card.appendChild(defEl);
      }

      if (item.examples && item.examples.length > 0) {
        const exWrap = document.createElement("div");
        Object.assign(exWrap.style, {
          fontSize: "12px",
          lineHeight: "1.5",
          paddingLeft: "8px",
          borderLeft: `2px solid ${s.primaryBorder}`,
        });
        item.examples.slice(0, 2).forEach((ex) => {
          const exDiv = document.createElement("div");
          Object.assign(exDiv.style, { marginBottom: "4px" });
          const eng = document.createElement("div");
          eng.textContent = ex.eng;
          Object.assign(eng.style, { color: s.textSecondary });
          const chs = document.createElement("div");
          chs.textContent = ex.chs;
          Object.assign(chs.style, { color: s.textMuted, fontStyle: "italic" });
          exDiv.appendChild(eng);
          exDiv.appendChild(chs);
          exWrap.appendChild(exDiv);
        });
        card.appendChild(exWrap);
      }

      vocabList.appendChild(card);
    });

    vocabScroll.appendChild(vocabList);
    this.vocabularyListEl.appendChild(exportBar);
    this.vocabularyListEl.appendChild(vocabScroll);
  }

  // ==================== 导出功能（保留原有逻辑，标题改英文） ====================
  exportVocabularyAsJson() {
    if (this.vocabulary.length === 0) return;
    const videoId = this._getYouTubeVideoId();
    const processed = this.vocabulary.map(item => {
      const n = { ...item };
      if (item.phonetic) {
        const clean = item.phonetic.replace(/US\s*/g, '').replace(/[\[\]]/g, '');
        n.phonetic = clean ? `[${clean}]` : "";
      }
      return n;
    });
    const data = {
      videoInfo: {
        title: this._getYouTubeVideoTitle(),
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
        exportTime: new Date().toISOString()
      },
      vocabulary: processed
    };
    this._downloadFile(
      JSON.stringify(data, null, 2), 
      'application/json', 
      `lingoflow-vocab-${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  exportVocabularyAsCsv() {
    if (this.vocabulary.length === 0) return;
    const videoId = this._getYouTubeVideoId();
    const esc = (f) => f ? `"${f.toString().replace(/"/g, '""')}"` : '""';
    const header = "Word,Phonetic,Definition,Example1,Translation1,Example2,Translation2,Video Link";
    const rows = this.vocabulary.map(item => {
      const clean = item.phonetic ? item.phonetic.replace(/US\s*/g, '').replace(/[\[\]]/g, '') : "";
      const ph = clean ? `[${clean}]` : "";
      let e1 = "", t1 = "", e2 = "", t2 = "";
      if (item.examples?.[0]) { e1 = item.examples[0].eng || ""; t1 = item.examples[0].chs || ""; }
      if (item.examples?.[1]) { e2 = item.examples[1].eng || ""; t2 = item.examples[1].chs || ""; }
      let link = "";
      if (item.timestamp && videoId) {
        link = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(item.timestamp / 1000)}s`;
      }
      return [item.word, ph, item.definition || "", e1, t1, e2, t2, link].map(esc).join(",");
    });
    const csv = '\uFEFF' + [
      `"${this._getYouTubeVideoTitle()}",,,,,,`,
      `"${videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'Vocabulary Export'}",,,,,,`,
      `,,,,,,`,
      header, ...rows
    ].join("\n");
    this._downloadFile(csv, 'text/csv;charset=utf-8;', `lingoflow-vocab-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportVocabularyAsTxt() {
    if (this.vocabulary.length === 0) return;
    const videoId = this._getYouTubeVideoId();
    const title = this._getYouTubeVideoTitle();
    const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
    const lines = [
      "Vocabulary Export",
      `Video: ${title}`,
      ...(link ? [`Link: ${link}`] : []),
      `Exported: ${new Date().toLocaleString('en-US')}`,
      ''
    ];
    this.vocabulary.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.word}`);
      const clean = item.phonetic ? item.phonetic.replace(/US\s*/g, '').replace(/[\[\]]/g, '') : "";
      if (clean) lines.push(`   Phonetic: [${clean}]`);
      if (item.definition) lines.push(`   Definition: ${item.definition}`);
      if (item.examples?.length > 0) {
        lines.push("   Examples:");
        item.examples.slice(0, 2).forEach((ex, j) => {
          lines.push(`   ${j + 1}. ${ex.eng}`);
          if (ex.chs) lines.push(`      ${ex.chs}`);
        });
      }
      if (item.timestamp && videoId) {
        lines.push(`   Video: https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(item.timestamp / 1000)}s`);
      }
      lines.push("");
    });
    this._downloadFile(lines.join("\n"), 'text/plain;charset=utf-8;', `lingoflow-vocab-${new Date().toISOString().slice(0, 10)}.txt`);
  }

  exportVocabularyAsMd() {
    if (this.vocabulary.length === 0) return;
    const videoId = this._getYouTubeVideoId();
    const title = this._getYouTubeVideoTitle();
    const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
    const lines = [
      "# Vocabulary Export",
      `**Video:** ${title}`,
      ...(link ? [`**Link:** [${link}](${link})`] : []),
      `**Exported:** ${new Date().toLocaleString('en-US')}`,
      ''
    ];
    this.vocabulary.forEach((item, i) => {
      lines.push(`${i + 1}. **${item.word}**`);
      const clean = item.phonetic ? item.phonetic.replace(/US\s*/g, '').replace(/[\[\]]/g, '') : "";
      if (clean) lines.push(`   *Phonetic:* [${clean}]`);
      if (item.definition) lines.push(`   *Definition:* ${item.definition}`);
      if (item.examples?.length > 0) {
        lines.push("   *Examples:*");
        item.examples.slice(0, 2).forEach((ex, j) => {
          lines.push(`   ${j + 1}. ${ex.eng}`);
          if (ex.chs) lines.push(`      ${ex.chs}`);
        });
      }
      if (item.timestamp && videoId) {
        const vl = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(item.timestamp / 1000)}s`;
        lines.push(`   *Video:* [Jump to timestamp](${vl})`);
      }
      lines.push("");
    });
    this._downloadFile(lines.join("\n"), 'text/markdown;charset=utf-8;', `lingoflow-vocab-${new Date().toISOString().slice(0, 10)}.md`);
  }

  _downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ==================== 初始化与字幕渲染 ====================
  initialize(subtitleEvents) {
    this.subtitleData = subtitleEvents.filter(
      (k) => k?.segs && Boolean(k?.segs.map((s) => s.utf8 || "").join("").replace(/\s+/g, " ").trim())
    );
    this.subtitleDataTime = subtitleEvents.map((k) => k.tStartMs);
    if (this.subtitleData.length > 0) {
      this.createSubtitleList();
      this.setupEventListeners();
    }
  }

  setBilingualSubtitles(bilingualData) {
    this.bilingualSubtitles = bilingualData;
    if (this.subtitleListEl) {
      this.updateBilingualSubtitles();
    } else {
      this.createSubtitleList();
      this.setupEventListeners();
    }
  }

  updateBilingualSubtitles() {
    if (!this.subtitleListEl) return;
    const items = this.subtitleListEl.querySelectorAll(".lingoflow-youtube-item");
    for (let i = 0; i < items.length && i < this.bilingualSubtitles.length; i++) {
      const item = items[i];
      const sub = this.bilingualSubtitles[i];
      if (sub) {
        if (typeof sub.start === "number") {
          item.dataset.time = sub.start;
          const timeSpan = item.querySelector(".lingoflow-time-badge");
          if (timeSpan) timeSpan.textContent = this.millisToMinutesAndSeconds(sub.start);
        }
        const textSpan = item.querySelector(".lingoflow-youtube-original");
        if (textSpan && sub.text) textSpan.textContent = sub.text;
        const translationEl = item.querySelector(".lingoflow-youtube-translation");
        if (translationEl && sub.translation) {
          translationEl.textContent = sub.translation;
          translationEl.style.display = "block";
        } else if (translationEl) {
          translationEl.style.display = "none";
        }
      }
    }
    for (let i = this.bilingualSubtitles.length; i < items.length; i++) {
      const translationEl = items[i].querySelector(".lingoflow-youtube-translation");
      if (translationEl) translationEl.style.display = "none";
    }
  }

  millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  getClosest(data, value) {
    if (!data || data.length === 0) return 0;
    let closest = data[0];
    for (let i = 0; i < data.length; i++) {
      if (data[i] <= value) closest = data[i]; else break;
    }
    return closest;
  }

  createSubtitleList() {
    if (!this.videoEl) return;
    const s = this._styles;

    this.container = document.getElementById("lingoflow-youtube-subtitle-list-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "lingoflow-youtube-subtitle-list-container";
      Object.assign(this.container.style, {
        height: `${this._getVideoPlayerHeight()}px`,
        zIndex: "999",
        background: s.bgCard,
        bottom: "0",
        right: "0",
        fontSize: "14px",
        padding: "0",
        marginRight: "24px",
        border: `1px solid ${s.tabBorder}`,
        borderRadius: "8px",
        minWidth: "340px",
        maxWidth: "420px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      });

      const secondary = document.getElementById("secondary") || 
                        document.getElementById("secondary-inner") || 
                        document.querySelector("#related");
      if (secondary) secondary.prepend(this.container);

      // 设置初始主题
      this.container.setAttribute('data-theme', this._theme);

      // 监听视频播放器大小变化
      this._observePlayerResize();
    }

    if (this.container) {
      this.container.replaceChildren();
    }

    // 拖拽手柄
    this.container.appendChild(this._createDragHandle());

    // ===== Tab Header =====
    const tabHeader = document.createElement("div");
    Object.assign(tabHeader.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${s.tabBorder}`,
      flexShrink: "0",
      paddingRight: "8px",
    });

    const tabButtons = document.createElement("div");
    Object.assign(tabButtons.style, { display: "flex" });

    const subtitleTab = this._createTab("Subtitles", "subtitles");
    const vocabularyTab = this._createTab("Vocabulary", "vocabulary");
    
    tabButtons.appendChild(subtitleTab);
    tabButtons.appendChild(vocabularyTab);

    this._styleTab(subtitleTab, this.activeTab === 'subtitles');
    this._styleTab(vocabularyTab, this.activeTab === 'vocabulary');

    // Tab 切换逻辑
    subtitleTab.addEventListener('click', () => {
      this.activeTab = 'subtitles';
      this._styleTab(subtitleTab, true);
      this._styleTab(vocabularyTab, false);
      this.subtitleListEl.style.display = 'flex';
      this.vocabularyListEl.style.display = 'none';
    });
    vocabularyTab.addEventListener('click', () => {
      this.activeTab = 'vocabulary';
      this._styleTab(subtitleTab, false);
      this._styleTab(vocabularyTab, true);
      this.subtitleListEl.style.display = 'none';
      this.vocabularyListEl.style.display = 'flex';
    });

    // 主题切换按钮
    const themeToggle = document.createElement("button");
    themeToggle.id = "lingoflow-theme-toggle";
    themeToggle.innerHTML = this._theme === 'dark' ? '🌙' : '☀️';
    Object.assign(themeToggle.style, {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "6px",
      transition: "all 0.2s ease",
      padding: "0",
      margin: "0",
    });
    
    themeToggle.addEventListener('mouseenter', () => {
      themeToggle.style.backgroundColor = s.bgHover;
      themeToggle.style.transform = "scale(1.1)";
    });
    themeToggle.addEventListener('mouseleave', () => {
      themeToggle.style.backgroundColor = "transparent";
      themeToggle.style.transform = "scale(1)";
    });
    
    themeToggle.addEventListener('click', () => {
      this._theme = this._theme === 'dark' ? 'light' : 'dark';
      this.container.setAttribute('data-theme', this._theme);
      themeToggle.innerHTML = this._theme === 'dark' ? '🌙' : '☀️';
    });

    // LingoFlow 官方链接
    const brandLink = document.createElement("a");
    brandLink.href = "https://getlingoflow.com/";
    brandLink.target = "_blank";
    brandLink.textContent = "LingoFlow";
    Object.assign(brandLink.style, {
      color: s.primary,
      textDecoration: "none",
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      marginLeft: "auto",
      marginRight: "12px",
      opacity: "0.7",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    });
    brandLink.addEventListener("mouseenter", () => {
      brandLink.style.opacity = "1";
      brandLink.style.transform = "scale(1.05)";
    });
    brandLink.addEventListener("mouseleave", () => {
      brandLink.style.opacity = "0.7";
      brandLink.style.transform = "scale(1)";
    });

    tabHeader.appendChild(tabButtons);
    tabHeader.appendChild(brandLink);
    tabHeader.appendChild(themeToggle);

    // ===== Content Area =====
    const tabContent = document.createElement("div");
    Object.assign(tabContent.style, {
      overflow: "hidden",
      flexGrow: "1",
      display: "flex",
      flexDirection: "column",
      minHeight: "0",
    });

    // 字幕列表面板
    this.subtitleListEl = document.createElement("div");
    this.subtitleListEl.id = "lingoflow-youtube-subtitle-list";
    Object.assign(this.subtitleListEl.style, {
      display: this.activeTab === 'subtitles' ? 'flex' : 'none',
      flexDirection: "column",
      overflow: "hidden",
      flex: "1",
    });

    const subtitleScroll = document.createElement("div");
    Object.assign(subtitleScroll.style, {
      overflowY: "auto",
      overflowX: "hidden",
      flex: "1",
      padding: "4px 8px",
      scrollBehavior: "smooth",
    });

    const subtitleListUl = document.createElement("ul");
    Object.assign(subtitleListUl.style, {
      listStyleType: "none",
      padding: "0",
      margin: "0",
    });
    subtitleListUl.addEventListener("click", (e) => {
      const li = e.target.closest(".lingoflow-youtube-item");
      if (li && li.dataset.time) this.videoEl.currentTime = parseFloat(li.dataset.time) / 1000;
    });

    subtitleScroll.appendChild(subtitleListUl);
    this.subtitleListEl.appendChild(subtitleScroll);

    // 词汇表面板
    this.vocabularyListEl = document.createElement("div");
    this.vocabularyListEl.id = "lingoflow-youtube-vocabulary-list";
    Object.assign(this.vocabularyListEl.style, {
      display: this.activeTab === 'vocabulary' ? 'flex' : 'none',
      flexDirection: "column",
      flex: "1",
      overflow: "hidden",
    });

    tabContent.appendChild(this.subtitleListEl);
    tabContent.appendChild(this.vocabularyListEl);
    this.container.appendChild(tabHeader);
    this.container.appendChild(tabContent);

    // ===== 填充字幕 =====
    const itemCount = Math.max(this.bilingualSubtitles.length, this.subtitleData.length);
    for (let i = 0; i < itemCount; i++) {
      const el = this.subtitleData[i];
      const { segs = [], tStartMs, dDurationMs } = el || {};

      const li = document.createElement("li");
      li.id = `lingoflow-youtube-item-${i}`;
      li.className = "lingoflow-youtube-item";
      Object.assign(li.style, {
        cursor: "pointer",
        padding: "12px 16px",
        transition: "all 0.1s ease",
        display: "flex",
        alignItems: "flex-start",
        gap: "0",
        borderLeft: "2px solid transparent",
        borderBottom: `1px solid ${s.divider}`,
      });

      const subTime = this.bilingualSubtitles[i] ? this.bilingualSubtitles[i].start : el ? tStartMs : null;
      if (subTime !== null) li.dataset.time = subTime;

      // 时间标签
      const timeSpan = document.createElement("span");
      timeSpan.className = "lingoflow-time-badge";
      timeSpan.textContent = subTime !== null ? this.millisToMinutesAndSeconds(subTime) : "--:--";
      Object.assign(timeSpan.style, {
        color: s.textTime,
        fontSize: "12px",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        flexShrink: "0",
        width: "42px",
        lineHeight: "24px",
        marginTop: "1px",
      });

      // 文本容器
      const textContainer = document.createElement("div");
      Object.assign(textContainer.style, { flexGrow: "1", minWidth: "0" });

      const textSpan = document.createElement("div");
      textSpan.className = "lingoflow-youtube-original";
      if (this.bilingualSubtitles[i]) {
        textSpan.textContent = this.bilingualSubtitles[i].text || "";
      } else if (el) {
        textSpan.textContent = segs.map((k) => k.utf8 || "").join("").replace(/\s+/g, " ").trim();
      } else {
        textSpan.textContent = "";
      }
      Object.assign(textSpan.style, {
        color: s.textEn,
        fontSize: "16px",
        lineHeight: "1.5",
        fontWeight: "400",
        wordBreak: "break-word",
      });

      const translationEl = document.createElement("div");
      translationEl.className = "lingoflow-youtube-translation";
      if (this.bilingualSubtitles[i] && this.bilingualSubtitles[i].translation) {
        translationEl.textContent = this.bilingualSubtitles[i].translation;
        translationEl.style.display = "block";
      } else {
        translationEl.style.display = "none";
      }
      Object.assign(translationEl.style, {
        color: s.textZh,
        fontSize: "14.5px",
        lineHeight: "1.5",
        marginTop: "4px",
        wordBreak: "break-word",
      });

      // 悬停效果
      li.addEventListener("mouseenter", () => {
        if (!li.classList.contains("lingoflow-active")) {
          li.style.backgroundColor = s.bgHover;
        }
      });
      li.addEventListener("mouseleave", () => {
        if (!li.classList.contains("lingoflow-active")) {
          li.style.backgroundColor = "transparent";
        }
      });

      if (el) {
        li.dataset.startTime = tStartMs;
        li.dataset.endTime = tStartMs + (dDurationMs || 0);
      }

      textContainer.appendChild(textSpan);
      textContainer.appendChild(translationEl);
      li.appendChild(timeSpan);
      li.appendChild(textContainer);
      subtitleListUl.appendChild(li);
    }

    // 填充初始词汇表
    this._renderVocabulary();

    // 添加自定义滚动条样式
    this._injectScrollbarStyle();
  }

  _createTab(text, id) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.dataset.tabId = id;
    return btn;
  }

  _styleTab(tab, isActive) {
    const s = this._styles;
    Object.assign(tab.style, {
      padding: "14px 20px",
      cursor: "pointer",
      border: "none",
      background: "transparent",
      fontSize: "15px",
      fontWeight: isActive ? '600' : '500',
      color: isActive ? s.primary : s.textZh,
      borderBottom: `2px solid ${isActive ? s.primary : 'transparent'}`,
      marginBottom: "-1px",
      transition: "all 0.15s",
      fontFamily: "inherit",
      letterSpacing: "0.3px",
      opacity: isActive ? '1' : '0.6',
    });
  }

  _observePlayerResize() {
    try {
      const player = document.getElementById('movie_player') || 
                     this.videoEl?.closest('#movie_player');
      if (player && typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => {
          if (!this._isDragging) {
            this._syncContainerHeight();
          }
        });
        this._resizeObserver.observe(player);
      }
    } catch (e) {
      // ResizeObserver not available
    }
  }

  _injectScrollbarStyle() {
    const styleId = "lingoflow-subtitle-theme-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #lingoflow-youtube-subtitle-list-container {
        --lingoflow-primary: #4f8ef7;
        --lingoflow-primary-subtle: rgba(79, 142, 247, 0.1);
      }
      #lingoflow-youtube-subtitle-list-container[data-theme='dark'] {
        --lingoflow-bg: #0f0f11;
        --lingoflow-bg-card: #0f0f11;
        --lingoflow-bg-hover: rgba(255, 255, 255, 0.03);
        --lingoflow-bg-active: rgba(79, 142, 247, 0.1);
        --lingoflow-text-en: rgba(255, 255, 255, 0.78);
        --lingoflow-text-en-active: rgba(255, 255, 255, 0.96);
        --lingoflow-text-zh: rgba(255, 255, 255, 0.58);
        --lingoflow-text-zh-active: rgba(255, 255, 255, 0.75);
        --lingoflow-text-time: rgba(255, 255, 255, 0.28);
        --lingoflow-text-time-active: #4f8ef7;
        --lingoflow-divider: rgba(255, 255, 255, 0.05);
        --lingoflow-tab-border: rgba(255, 255, 255, 0.08);
        --lingoflow-btn-bg: rgba(255, 255, 255, 0.05);
        --lingoflow-drag-handle: rgba(255, 255, 255, 0.1);
      }
      #lingoflow-youtube-subtitle-list-container[data-theme='light'] {
        --lingoflow-bg: #ffffff;
        --lingoflow-bg-card: #ffffff;
        --lingoflow-bg-hover: rgba(0, 0, 0, 0.03);
        --lingoflow-bg-active: rgba(79, 142, 247, 0.08);
        --lingoflow-text-en: rgba(0, 0, 0, 0.85);
        --lingoflow-text-en-active: rgba(0, 0, 0, 1);
        --lingoflow-text-zh: rgba(0, 0, 0, 0.65);
        --lingoflow-text-zh-active: rgba(0, 0, 0, 0.85);
        --lingoflow-text-time: rgba(0, 0, 0, 0.35);
        --lingoflow-text-time-active: #4f8ef7;
        --lingoflow-divider: rgba(0, 0, 0, 0.06);
        --lingoflow-tab-border: rgba(0, 0, 0, 0.08);
        --lingoflow-btn-bg: rgba(0, 0, 0, 0.04);
        --lingoflow-drag-handle: rgba(0, 0, 0, 0.08);
      }
      #lingoflow-youtube-subtitle-list-container *::-webkit-scrollbar {
        width: 4px;
      }
      #lingoflow-youtube-subtitle-list-container *::-webkit-scrollbar-track {
        background: transparent;
      }
      #lingoflow-youtube-subtitle-list-container *::-webkit-scrollbar-thumb {
        background: var(--lingoflow-drag-handle);
        border-radius: 4px;
      }
      #lingoflow-youtube-subtitle-list-container *::-webkit-scrollbar-thumb:hover {
        background: var(--lingoflow-text-time);
      }
    `;
    document.head.appendChild(style);
  }

  _observeTheme() {
    if (this._themeObserver) return;
    this._themeObserver = new MutationObserver(() => {
      const newTheme = this._detectTheme();
      if (newTheme !== this._theme) {
        this._theme = newTheme;
        if (this.container) {
          this.container.setAttribute('data-theme', this._theme);
        }
      }
    });
    this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
  }

  setupEventListeners() {
    if (!this.container || !this.videoEl) return;
    this.container.addEventListener("mouseenter", () => this.turnOffAutoSub());
    this.container.addEventListener("mouseleave", () => this.turnOnAutoSub());
    this.videoEl.addEventListener("ended", () => this.turnOffAutoSub());
    this._observeTheme();
  }

  turnOnAutoSub() {
    this.turnOffAutoSub();
    const s = this._styles;
    this.loopAutoScroll = setInterval(() => {
      if (!this.videoEl || this.activeTab !== 'subtitles') return;
      const currentTimeMs = this.videoEl.currentTime * 1000;
      let currentIndex = -1;

      if (this.bilingualSubtitles.length > 0) {
        for (let i = 0; i < this.bilingualSubtitles.length; i++) {
          const sub = this.bilingualSubtitles[i];
          if (currentTimeMs >= sub.start && currentTimeMs <= sub.end) {
            currentIndex = i;
            break;
          }
        }
        if (currentIndex === -1) {
          for (let i = this.bilingualSubtitles.length - 1; i >= 0; i--) {
            if (currentTimeMs >= this.bilingualSubtitles[i].start) {
              currentIndex = i;
              break;
            }
          }
        }
      } else if (this.subtitleDataTime.length > 0) {
        const closestTime = this.getClosest(this.subtitleDataTime, currentTimeMs);
        currentIndex = this.subtitleDataTime.indexOf(closestTime);
      }

      if (this.subtitleListEl && currentIndex !== -1) {
        const allItems = this.subtitleListEl.querySelectorAll(".lingoflow-youtube-item");
        allItems.forEach((el) => {
          el.classList.remove("lingoflow-active");
          el.style.backgroundColor = "transparent";
          el.style.borderLeftColor = "transparent";
          
          const time = el.querySelector(".lingoflow-time-badge");
          if (time) time.style.color = s.textTime;
          
          const original = el.querySelector(".lingoflow-youtube-original");
          if (original) {
            original.style.color = s.textEn;
            original.style.fontWeight = "400";
          }
          
          const trans = el.querySelector(".lingoflow-youtube-translation");
          if (trans) trans.style.color = s.textZh;
        });

        const liElement = this.subtitleListEl.querySelector(`#lingoflow-youtube-item-${currentIndex}`);
        if (liElement) {
          liElement.classList.add("lingoflow-active");
          liElement.style.backgroundColor = s.bgActive;
          liElement.style.borderLeftColor = s.primary;

          const time = liElement.querySelector(".lingoflow-time-badge");
          if (time) time.style.color = s.textTimeActive;
          
          const original = liElement.querySelector(".lingoflow-youtube-original");
          if (original) {
            original.style.color = s.textEnActive;
            original.style.fontWeight = "500";
          }
          
          const trans = liElement.querySelector(".lingoflow-youtube-translation");
          if (trans) trans.style.color = s.textZhActive;

          const scrollContainer = this.subtitleListEl.querySelector("div");
          if (scrollContainer) {
            const targetTop = liElement.offsetTop - scrollContainer.clientHeight / 2 + liElement.clientHeight / 2;
            scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
          }
        }
      }
    }, 100);
  }

  turnOffAutoSub() {
    if (this.loopAutoScroll) {
      clearInterval(this.loopAutoScroll);
      this.loopAutoScroll = null;
    }
  }

  destroy() {
    this.turnOffAutoSub();
    document.removeEventListener("lingoflow-add-word", this.handleWordAdded);
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.subtitleListEl = null;
    this.vocabularyListEl = null;
    this.subtitleData = [];
    this.subtitleDataTime = [];
    this.bilingualSubtitles = [];
    this.vocabulary = [];
  }

  _getYouTubeVideoId() {
    try {
      return new URLSearchParams(window.location.search).get('v');
    } catch { return null; }
  }

  _getYouTubeVideoTitle() {
    try {
      const el = document.querySelector('h1 yt-formatted-string');
      return el ? el.textContent : 'YouTube Video';
    } catch { return 'YouTube Video'; }
  }
}
