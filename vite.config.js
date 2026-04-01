import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".json"],
    alias: {
      // 兼容某些写法
    },
  },

  define: {
    "process.env.REACT_APP_VERSION": JSON.stringify("1.0"), 
    "process.env.REACT_APP_CLIENT": JSON.stringify("chrome"),
    "process.env.REACT_APP_NAME": JSON.stringify("LingoFlow"),
    "process.env.REACT_APP_RULESURL": JSON.stringify("https://raw.githubusercontent.com/getlingoflow/lingoflow-youtube/main/rules.json"),
    "process.env.REACT_APP_RULESURL_ON": JSON.stringify(""),
    "process.env.REACT_APP_RULESURL_OFF": JSON.stringify(""),
    "process.env.REACT_APP_HOMEPAGE": JSON.stringify("https://github.com/getlingoflow/lingoflow-youtube"),
    "process.env.REACT_APP_OPTIONSPAGE": JSON.stringify("options.html"),
    "process.env.REACT_APP_OPTIONSPAGE_DEV": JSON.stringify("options.html"),
    "process.env": "{}",
  },
  build: {
    rollupOptions: {
      input: {
        // crx-plugin 通常会根据 manifest 自动处理
      },
    },
  },
});
