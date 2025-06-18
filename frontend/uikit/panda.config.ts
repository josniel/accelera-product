import { defineConfig, definePreset } from "@pandacss/dev";
import { colors, darkTheme } from "./src/Theme/Theme";

const tokenColors = Object.fromEntries(
  Object.entries(colors).map(([key, value]) => [
    key,
    { value },
  ]),
);

const semanticColors = Object.fromEntries(
  Object.entries(darkTheme.colors).map(([key, value]) => [
    key,
    {
      value: value.startsWith("#") ? value : `{colors.${value}}`,
      // this is where the dark theme can be added,
      // see https://panda-css.com/docs/theming/tokens
      // _dark: `{colors.${otherValue}}`,
    },
  ]),
);

export const keyframes = {
  pulse: {
    "0%, 100%": {
      opacity: "1",
    },
    "50%": {
      opacity: "0.5",
    },
  },
};

export const animations = {
  pulse: {
    keyframes: "pulse",
    duration: "2s",
    timingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
    iterationCount: "infinite",
  },
};

export const liquityUiKitPreset = definePreset({
  name: "liquity-ui-kit",
  theme: {
    extend: {
      breakpoints: {
        xxs: "415px",
        xs: "530px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        xl1: "1400px",
        "2xl": "1740px",
      },
      keyframes,
      // animation: animations,
    },
    tokens: {
      colors: tokenColors,
      fonts: {
        body: {
          value: "InstrumentSans, sans-serif",
        },
      },
    },
    semanticTokens: {
      colors: semanticColors,
    },
  },
});

export default defineConfig({
  preflight: true, // CSS reset
  presets: [liquityUiKitPreset],
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",
});
