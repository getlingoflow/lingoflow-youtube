import { YouTubeInitializer } from "./YouTubeCaptionProvider";
import { isMatch } from "../libs/utils";
import { DEFAULT_API_SETTING } from "../config/api";
import { DEFAULT_SUBTITLE_SETTING } from "../config/setting";
import { logger } from "../libs/log";
import { injectJs, INJECTOR } from "../injectors/index";

const providers = [
  { pattern: "youtube.com", start: YouTubeInitializer },
];

export function runSubtitle({ href, setting }) {
  try {
    const subtitleSetting = setting.subtitleSetting || DEFAULT_SUBTITLE_SETTING;
    if (!subtitleSetting.enabled) {
      console.log("[LingoFlow] Subtitle is disabled in settings.");
      return;
    }

    const provider = providers.find((item) => {
      const match = isMatch(href, item.pattern);
      if (match) {
        console.log(`[LingoFlow] Matched provider for pattern: ${item.pattern}`);
      }
      return match;
    });

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
      
      console.log(`[LingoFlow] Starting provider for: ${href}`);
      provider.start({
        ...subtitleSetting,
        apiSetting,
        segApiSetting,
        uiLang: setting.uiLang,
      });
    } else {
      console.log(`[LingoFlow] No matching provider found for: ${href}`);
    }
  } catch (err) {
    logger.error("start subtitle provider", err);
  }
}
