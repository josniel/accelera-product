import type { Preset } from "@pandacss/dev";

import { liquityUiKitPreset } from "@liquity2/uikit/panda.config";
import { defineConfig, defineGlobalStyles } from "@pandacss/dev";
// import { BREAKPOINTS } from "./src/breakpoints";

export default defineConfig({
  // preflight: true, // CSS reset
  jsxFramework: "react", // needed for panda to extract props named `css`
  presets: [
    liquityUiKitPreset as Preset, // `as Preset` prevents a type error: "Expression produces a union type that is too complex to represent."
    // definePreset({
    //   name: "liquity-app",
    //   theme: {
    //     extend: {
    //       breakpoints: {
    //         xxs: "415px",
    //         xs: "530px",
    //         sm: "640px",
    //         md: "768px",
    //         lg: "1024px",
    //         xl: "1280px",
    //         xl1: "1400px",
    //         "2xl": "1740px",
    //       },
    //     },
    //   },
    // }),
  ],
  exclude: [],
  outdir: "styled-system",
  include: [
    "../uikit/src/**/*.tsx",
    "./src/**/*.{ts,tsx}",
    "./*.tsx",
  ],
  globalCss: defineGlobalStyles({
    "html, body": {
      height: "100%",
      margin: 0,
      minWidth: 360,
      lineHeight: 1.5,
      fontSize: 16,
      fontWeight: 500,
      color: "content",
      background: "background",
      pos: "relative",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
    },
    html: {
      overflowX: "auto",
      overflowY: "scroll",
    },
    // Estilos personalizados para el scrollbar
    "::-webkit-scrollbar": {
      width: "4px",
      height: "6px",
    },
    "::-webkit-scrollbar-track": {
      backgroundColor: "#1A201C",
      borderRadius: "0.75rem",
      opacity: 0.4,
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "#5cde66",
      borderRadius: "0.75rem",
      border: "none",
    },
  }),
});
