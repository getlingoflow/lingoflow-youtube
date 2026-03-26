import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import "./popup.css";
import { 
  getSettingWithDefault, 
  putSetting 
} from "./libs/storage";
import { 
  API_SPE_TYPES,
  DEFAULT_API_LIST,
  OPT_TRANS_MICROSOFT,
  OPT_LANGS_TO,
  OPT_ALL_TRANS_TYPES,
  OPT_TRANS_BUILTINAI,
} from "./config/api";
import { newI18n } from "./config/i18n";

/**
 * 获取浏览器语言并映射到支持的 I18N 语言代码 (zh, en, zh_TW, ja, ko)
 */
const getBrowserLangForI18n = () => {
  try {
    const lang = navigator.language || navigator.languages?.[0] || "zh";
    if (lang.startsWith("zh-TW") || lang.startsWith("zh-HK")) return "zh_TW";
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("ko")) return "ko";
    return "en";
  } catch {
    return "zh";
  }
};

const getBrowserLang = () => {
  try {
    const lang = navigator.language || navigator.languages?.[0] || "zh-CN";
    const exactMatch = OPT_LANGS_TO.find(([code]) => code === lang);
    if (exactMatch) return exactMatch[0];
    const prefixMatch = OPT_LANGS_TO.find(([code]) => code.startsWith(lang.slice(0, 2)));
    if (prefixMatch) return prefixMatch[0];
    return "zh-CN";
  } catch {
    return "zh-CN";
  }
};

// 翻译引擎分类
const TRANS_CATEGORIES = {
  free: {
    label: "🆓 免费引擎",
    types: new Set(["Microsoft", "Google"])
  }
};

const CATEGORY_LABELS = {
  free: "🆓 免费引擎"
};

// 判断引擎是否需要 API Key
const needsApiKey = (apiType) => {
  const keyRequired = new Set([
    "DeepL", "NiuTrans", "AzureAI", "CloudflareAI",
    "OpenAI", "Gemini", "Gemini2", "Claude", "Ollama", "OpenRouter", "Custom"
  ]);
  return keyRequired.has(apiType);
};

// 判断引擎是否需要 Model
const needsModel = (apiType) => {
  return API_SPE_TYPES.ai.has(apiType);
};

// 判断引擎是否需要自定义 URL
const needsUrl = (apiType) => {
  const urlCustomizable = new Set([
    "DeepL", "DeepLX", "NiuTrans", "AzureAI", "CloudflareAI",
    "OpenAI", "Gemini", "Gemini2", "Claude", "Ollama", "OpenRouter", "Custom"
  ]);
  return urlCustomizable.has(apiType);
};

function StatusDot({ status }) {
  const colors = {
    ok: "#10b981",
    warn: "#f59e0b",
    error: "#ef4444",
  };
  return (
    <span style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: colors[status] || colors.ok,
      marginRight: 6,
      boxShadow: `0 0 6px ${colors[status] || colors.ok}`,
    }} />
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [apis, setApis] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(OPT_TRANS_MICROSOFT);
  const [segSlug, setSegSlug] = useState("-");
  const [isAISegment, setIsAISegment] = useState(false);
  const [targetLang, setTargetLang] = useState(getBrowserLang());
  const [isSaved, setIsSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("translation"); // translation | ai | about
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uiLang, setUiLang] = useState(getBrowserLangForI18n());

  const i18n = useMemo(() => newI18n(uiLang), [uiLang]);

  // 获取 AI 列表
  const aiList = useMemo(() => Array.from(API_SPE_TYPES.ai), []);

  // 所有可用翻译引擎
  const allTransTypes = useMemo(() => {
    const allowed = new Set(["Microsoft", "Google"]);
    return OPT_ALL_TRANS_TYPES.filter(t => allowed.has(t));
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const setting = await getSettingWithDefault();
        const allApis = setting.transApis || DEFAULT_API_LIST;
        const subtitleSet = setting.subtitleSetting || {};
        
        setApis(allApis);
        setSelectedSlug(subtitleSet.apiSlug || OPT_TRANS_MICROSOFT);
        setSegSlug(subtitleSet.segSlug || "-");
        setIsAISegment(subtitleSet.isAISegment || false);
        setTargetLang(subtitleSet.toLang || getBrowserLang());
        if (setting.uiLang) {
          setUiLang(setting.uiLang);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const updateApiField = (slug, key, value) => {
    setApis(prev => prev.map(a => 
      a.apiSlug === slug ? { ...a, [key]: value } : a
    ));
  };

  const getApiBySlug = (slug) => apis.find(a => a.apiSlug === slug);

  const saveSettings = async () => {
    try {
      const setting = await getSettingWithDefault();
      const isAI = API_SPE_TYPES.ai.has(selectedSlug);
      const newSubtitleSetting = {
        ...setting.subtitleSetting,
        apiSlug: selectedSlug,
        segSlug: isAI ? selectedSlug : segSlug,
        isAISegment: isAI ? true : isAISegment,
        toLang: targetLang
      };

      await putSetting({
        transApis: apis,
        subtitleSetting: newSubtitleSetting
      });

      setIsSaved(true);
      
      // 刷新当前活动标签页
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });

      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  if (loading) {
    return (
      <div className="glow-container" style={{height: 500, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const selectedApi = getApiBySlug(selectedSlug);
  const segApi = getApiBySlug(segSlug);

  return (
    <div className="glow-container">
      <header className="header animate">
        <h1 className="logo-text">LingoFlow</h1>
        <p className="subtitle">{i18n("app_subtitle")}</p>
      </header>

      {/* Tab Navigation */}
      <nav className="glass-nav">
        <button 
          className={`nav-item ${activeSection === "translation" ? "active" : ""}`}
          onClick={() => setActiveSection("translation")}
        >
          <span className="icon">🌐</span> {i18n("tab_translate")}
        </button>
        <button 
          className={`nav-item ${activeSection === "about" ? "active" : ""}`}
          onClick={() => setActiveSection("about")}
        >
          <span className="icon">ℹ️</span> {i18n("tab_about")}
        </button>
      </nav>

      {/* Translation Settings */}
      {activeSection === "translation" && (
        <section className="config-card animate">
          <div className="section-title">{i18n("translate_service")}</div>
          
          <div className="form-group">
            <label className="form-label">{i18n("translate_service")}</label>
            <select 
              className="input-field" 
              value={selectedSlug} 
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {Object.entries(TRANS_CATEGORIES).map(([key, cat]) => {
                const items = apis.filter(a => cat.types.has(a.apiType));
                if (items.length === 0) return null;
                return (
                  <optgroup key={key} label={CATEGORY_LABELS[key]}>
                    {items.map(api => (
                      <option key={api.apiSlug} value={api.apiSlug}>
                        {api.name || api.apiType}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* 当前引擎状态 */}
          <div className="engine-status animate-in">
            <StatusDot status={needsApiKey(selectedSlug) && !selectedApi?.key ? "warn" : "ok"} />
            <span className="status-text">
              {needsApiKey(selectedSlug) && !selectedApi?.key 
                ? `${selectedSlug} 需要 API Key 才能使用`
                : `${selectedSlug} 已就绪`}
            </span>
          </div>

          {/* API Key / Model / URL 配置 */}
          {needsApiKey(selectedSlug) && selectedApi && (
            <div className="credentials-card animate-in">
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder={`输入 ${selectedSlug} API Key`}
                  value={selectedApi.key || ""}
                  onChange={(e) => updateApiField(selectedSlug, "key", e.target.value)}
                />
              </div>
              
              {needsModel(selectedSlug) && (
                <div className="form-group">
                  <label className="form-label">模型 (Model)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={`例如: ${selectedApi.model || "gpt-4o"}`}
                    value={selectedApi.model || ""}
                    onChange={(e) => updateApiField(selectedSlug, "model", e.target.value)}
                  />
                </div>
              )}

              {needsUrl(selectedSlug) && (
                <div className="form-group">
                  <label className="form-label">
                    自定义 API 地址
                    <span className="form-hint"> (可选)</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={selectedApi.url || "使用默认地址"}
                    value={selectedApi.url || ""}
                    onChange={(e) => updateApiField(selectedSlug, "url", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="divider" />

          <div className="section-title">{i18n("target_lang")}</div>
          <div className="form-group">
            <label className="form-label">{i18n("sub_translate_to")}</label>
            <select 
              className="input-field" 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {OPT_LANGS_TO.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          <button 
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▼" : "▶"} {i18n("advanced_options")}
          </button>

          {showAdvanced && selectedApi && (
            <div className="advanced-section animate-in">
              {/* 非 AI 引擎时显示 AI 分段开关（因为 AI 引擎强制开启了） */}
              
              {API_SPE_TYPES.ai.has(selectedSlug) && (
                <>
                  <div className="form-group">
                    <label className="form-label">Temperature</label>
                    <input 
                      type="number" 
                      className="input-field small" 
                      min="0" max="2" step="0.1"
                      value={selectedApi.temperature ?? 0}
                      onChange={(e) => updateApiField(selectedSlug, "temperature", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Tokens</label>
                    <input 
                      type="number" 
                      className="input-field small" 
                      value={selectedApi.maxTokens ?? 20480}
                      onChange={(e) => updateApiField(selectedSlug, "maxTokens", parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">{i18n("request_timeout")} (ms)</label>
                <input 
                  type="number" 
                  className="input-field small" 
                  value={selectedApi.httpTimeout ?? 30000}
                  onChange={(e) => updateApiField(selectedSlug, "httpTimeout", parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          <button 
            className={`save-btn ${isSaved ? "success" : ""}`} 
            onClick={saveSettings}
            disabled={isSaved}
          >
            {isSaved ? `✓ ${i18n("saved")}` : i18n("save_and_refresh")}
          </button>
        </section>
      )}



      {/* About Section */}
      {activeSection === "about" && (
        <section className="config-card animate">
          <div className="section-title">{i18n("about_lingoflow")}</div>
          <div className="about-content">
            <div className="about-item">
              <span className="about-label">{i18n("version")}</span>
              <span className="about-value">v1.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">{i18n("author")}</span>
              <span className="about-value">Norman</span>
            </div>
            <div className="about-item">
              <span className="about-label">{i18n("website")}</span>
              <a 
                href="https://getlingoflow.com/" 
                target="_blank" 
                className="about-value"
                style={{ color: "var(--primary-color, #4f8ef7)", textDecoration: "none", fontWeight: "600" }}
              >
                getlingoflow.com
              </a>
            </div>
            <div className="about-item">
              <span className="about-label">{i18n("license")}</span>
              <span className="about-value">GPL-3.0</span>
            </div>
          </div>
          <div className="divider" />
          <div className="about-features">
            <p>{i18n("feature_immersive")}</p>
            <p>{i18n("feature_hover")}</p>
            <p>{i18n("feature_smart_play")}</p>
            <p>{i18n("feature_learning")}</p>
            <p>{i18n("feature_export")}</p>
          </div>
        </section>
      )}

      <p className="tip-text animate">
        {activeSection === "translation" 
          ? "Tip: Microsoft and Google are free and require no configuration. Use them for immediate bilingual subtitles."
          : "LingoFlow - The Professional Bilingual Subtitle Assistant for YouTube"}
      </p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
