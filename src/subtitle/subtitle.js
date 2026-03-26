import { YouTubeInitializer } from "./YouTubeCaptionProvider";
import { isMatch } from "../libs/utils";
import { DEFAULT_API_SETTING } from "../config/api";
import { DEFAULT_SUBTITLE_SETTING } from "../config/setting";
import { logger } from "../libs/log";
import { injectJs, INJECTOR } from "../injectors/index";

const providers = [
  { pattern: "https://www.youtube.com", start: YouTubeInitializer },
];

export function runSubtitle({ href, setting }) {
  try {
    const subtitleSetting = setting.subtitleSetting || DEFAULT_SUBTITLE_SETTING;
    if (!subtitleSetting.enabled) {
      return;
    }

    const provider = providers.find((item) => isMatch(href, item.pattern));
    if (provider) {
      injectJs(INJECTOR.shadowroot, "lingoflow-inject-shadowroot-js");
      injectJs(INJECTOR.subtitle, "lingoflow-inject-subtitle-js");

      const apiSetting =
        setting.transApis.find(
          (api) => api.apiSlug === subtitleSetting.apiSlug
        ) || DEFAULT_API_SETTING;
      const segApiSetting = setting.transApis.find(
        (api) => api.apiSlug === subtitleSetting.segSlug
      );
      provider.start({
        ...subtitleSetting,
        apiSetting,
        segApiSetting,
        uiLang: setting.uiLang,
      });
    }
  } catch (err) {
    logger.error("start subtitle provider", err);
  }
}
