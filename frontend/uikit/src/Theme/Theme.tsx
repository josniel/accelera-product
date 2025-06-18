"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useState } from "react";

// The Liquity V2 base color palette, meant
// to be used by themes rather than directly.
export const colors = {
  // Blue
  "blue:50": "#F0F3FE",
  "blue:100": "#DEE4FB",
  "blue:200": "#C4D0F9",
  "blue:300": "#9CB1F4",
  "blue:400": "#6D8AED",
  "blue:500": "#405AE5",
  "blue:600": "#3544DB",
  "blue:700": "#2D33C8",
  "blue:800": "#2A2BA3",
  "blue:900": "#272A81",
  "blue:950": "#1C1D4F",

  // Gray
  "gray:50": "#F5F6F8",
  "gray:100": "#EDEFF2",
  "gray:200": "#DDE0E8",
  "gray:300": "#C8CDD9",
  "gray:400": "#B1B7C8",
  "gray:500": "#9EA2B8",
  "gray:600": "#878AA4",
  "gray:700": "#73748F",
  "gray:800": "#5F6174",
  "gray:900": "#50525F",
  "gray:950": "#2F3037",

  // Yellow
  "yellow:50": "#FDFBE9",
  "yellow:100": "#FCF8C5",
  "yellow:200": "#FAEE8E",
  "yellow:300": "#F5D93A",
  "yellow:400": "#F1C91E",
  "yellow:500": "#E1B111",
  "yellow:600": "#C2890C",
  "yellow:700": "#9B620D",
  "yellow:800": "#804E13",
  "yellow:900": "#6D4016",
  "yellow:950": "#402108",

  // Green
  "green:50": "#F1FCF2",
  "green:100": "#DEFAE4",
  "green:200": "#BFF3CA",
  "green:300": "#8EE7A1",
  "green:400": "#63D77D",
  "green:500": "#2EB94D",
  "green:600": "#20993C",
  "green:700": "#1D7832",
  "green:800": "#1C5F2C",
  "green:900": "#194E27",
  "green:950": "#082B12",

  // Red
  "red:50": "#FEF5F2",
  "red:100": "#FFE7E1",
  "red:200": "#FFD5C9",
  "red:300": "#FEB7A3",
  "red:400": "#FB7C59",
  "red:500": "#F36740",
  "red:600": "#E14A21",
  "red:700": "#BD3C18",
  "red:800": "#9C3518",
  "red:900": "#82301A",
  "red:950": "#471608",

  // brown
  "brown:50": "#F8F6F4",

  // desert
  "desert:50": "#FAF9F7",
  "desert:100": "#EFECE5",
  "desert:950": "#2C231E",

  // Brand colors
  "brand:blue": "#405AE5",
  "brand:lightBlue": "#6D8AED",
  "brand:darkBlue": "#121B44",
  "brand:green": "#63D77D",
  "brand:golden": "#F5D93A",
  "brand:cyan": "#95CBF3",
  "brand:coral": "#FB7C59",
  "brand:brown": "#DBB79B",

  // Accelera colors
  "brand:layout": "#2F2F2F",
  "brand:dark": "#171717",
  "brand:background": "#141815",

  // White
  "white": "#FFFFFF",

  // Palm Green
  "palm-green:50": "#f2fbf3",
  "palm-green:100": "#e2f6e4",
  "palm-green:200": "#c6ecc9",
  "palm-green:300": "#99dc9f",
  "palm-green:400": "#65c36d",
  "palm-green:500": "#40a74a",
  "palm-green:600": "#308939",
  "palm-green:700": "#286d2f",
  "palm-green:800": "#245729",
  "palm-green:900": "#1f4824",
  "palm-green:950": "#0a1f0d",

  // Pastel Green
  "pastel-green:50": "#f0fdf0",
  "pastel-green:100": "#ddfbde",
  "pastel-green:200": "#bcf6bf",
  "pastel-green:300": "#88ed90",
  "pastel-green:400": "#5cde66", // main
  "pastel-green:500": "#25c232",
  "pastel-green:600": "#19a024",
  "pastel-green:700": "#177e20",
  "pastel-green:800": "#18631e",
  "pastel-green:900": "#15521b",
  "pastel-green:950": "#062d0b",

  // Hippie Green
  "hippie-green:50": "#f4f9f5",
  "hippie-green:100": "#e6f2e7",
  "hippie-green:200": "#cde5d0",
  "hippie-green:300": "#a6cfaa",
  "hippie-green:400": "#78b07d",
  "hippie-green:500": "#54935a",
  "hippie-green:600": "#47824d",
  "hippie-green:700": "#365f3a",
  "hippie-green:800": "#2e4d32",
  "hippie-green:900": "#27402a",
  "hippie-green:950": "#122114",

  // Woodsmoke
  "woodsmoke:50": "#f6f6f6",
  "woodsmoke:100": "#e7e7e7",
  "woodsmoke:200": "#d1d1d1",
  "woodsmoke:300": "#b0b0b0",
  "woodsmoke:400": "#888888",
  "woodsmoke:500": "#6d6d6d",
  "woodsmoke:600": "#5d5d5d",
  "woodsmoke:700": "#4f4f4f",
  "woodsmoke:800": "#454545",
  "woodsmoke:900": "#3d3d3d",
  "woodsmoke:950": "#151515",

  // Shark
  "shark:50": "#f5f5f6",
  "shark:100": "#e6e6e7",
  "shark:200": "#d0d0d1",
  "shark:300": "#afb0b1",
  "shark:400": "#86868a",
  "shark:500": "#6b6b6f",
  "shark:600": "#5b5b5f",
  "shark:700": "#4e4f50",
  "shark:800": "#444446",
  "shark:900": "#3c3c3d",
  "shark:950": "#222223", // Background

  "darkGreen:100": "#1A201C",
  "darkGreen:200": "#222A25",

  "gradientCardHeader:100": "linear-gradient(39deg, #0D110E 4.25%, #374A39 112.49%)",
  "gradientCardContent:100": "linear-gradient(72deg, rgba(13, 17, 14, 0.50) 24.79%, rgba(55, 74, 57, 0.50) 75.21%)",

  // Success
  "success:100": "#2FB869",
  "success:200": "#56D28A",
  "success:300": "#8EE7B3",

  // Warning
  "warning:100": "#EB5757",
  "warning:200": "#E8A1A1",
  "warning:300": "#ECC4C4",

  // Caution
  "caution:100": "#FFB800",
  "caution:200": "#FFEF9D",

  // Info
  "info:100": "#00527C",
  "info:200": "#E0F0FF",
};

// The dark theme, which is the only theme for now. These
// colors are meant to be used by components via useTheme(),
// so that the theme can be changed at runtime.

// Some notes about naming conventions:
// - "xContent" is the color used over a "x" background (text, icons or outlines).
// - "xHint" is the color used to hint that "x" is interactive (generally on hover).
// - "xActive" is the color used to indicate that "x" is being interacted with (generally on press).
// - "xSurface" is the color used for the surface of "x" (generally the background).

export const darkTheme = {
  name: "dark" as const,
  colors: {
    // surfaceHint: "pastel-green:400",
    // surfaceHover: "pastel-green:500",

    accent: "pastel-green:400",
    accentHover: "pastel-green:500",
    accentActive: "pastel-green:500",
    accentContent: "white",
    accentHint: "pastel-green:300",

    background: "woodsmoke:950",
    background2: "brand:background",
    layout: "brand:layout",
    dark: "brand:dark",
    backgroundActive: "woodsmoke:900",

    border: "woodsmoke:800",
    borderSoft: "woodsmoke:700",
    content: "woodsmoke:50",
    contentAlt: "pastel-green:400",
    contentAlt2: "woodsmoke:400",

    controlBorder: "woodsmoke:600",
    controlBorderStrong: "palm-green:800",
    controlSurface: "woodsmoke:950",
    controlSurfaceAlt: "woodsmoke:900",

    hint: "woodsmoke:400",
    infoSurface: "woodsmoke:900",
    infoSurfaceBorder: "woodsmoke:700",
    infoSurfaceContent: "white",

    dimmed: "woodsmoke:600",
    fieldBorder: "woodsmoke:600",
    fieldBorderFocused: "woodsmoke:400",
    fieldSurface: "woodsmoke:900",

    focused: "pastel-green:400",
    focusedSurface: "pastel-green:50",
    focusedSurfaceActive: "pastel-green:100",

    strongSurface: "pastel-green:950",
    strongSurfaceContent: "white",
    strongSurfaceContentAlt: "woodsmoke:500",
    strongSurfaceContentAlt2: "woodsmoke:300",

    position: "#2E2E3D",
    positionContent: "woodsmoke:50",
    positionContentAlt: "woodsmoke:600",

    interactive: "pastel-green:950",

    negative: "warning:100",
    negativeStrong: "red:600",
    negativeActive: "red:600",
    negativeContent: "white",
    negativeHint: "red:400",
    negativeSurface: "red:50",
    negativeSurfaceBorder: "red:100",
    negativeSurfaceContent: "red:900",
    negativeSurfaceContentAlt: "red:400",
    negativeInfoSurface: "red:50",
    negativeInfoSurfaceBorder: "red:200",
    negativeInfoSurfaceContent: "red:950",
    negativeInfoSurfaceContentAlt: "woodsmoke:600",

    positive: "success:100",
    positiveAlt: "success:200",
    positiveActive: "success:300",
    positiveContent: "white",
    positiveHint: "palm-green:300",

    secondary: "pastel-green:50",
    secondaryActive: "pastel-green:200",
    secondaryContent: "pastel-green:600",
    secondaryHint: "pastel-green:100",

    selected: "pastel-green:500",

    separator: "woodsmoke:800",
    surface: "woodsmoke:950",
    tableBorder: "woodsmoke:800",

    warning: "caution:100",
    warningAlt: "caution:200",

    disabledBorder: "woodsmoke:800",
    disabledContent: "woodsmoke:600",
    disabledSurface: "woodsmoke:200",

    brandBlue: "pastel-green:400",
    brandBlueContent: "white",
    brandBlueContentAlt: "pastel-green:50",

    brandDarkBlue: "palm-green:950",
    brandDarkBlueContent: "white",
    brandDarkBlueContentAlt: "woodsmoke:50",

    brandLightBlue: "pastel-green:300", // usado como versión clara
    brandGolden: "#F1C91E", // mismo hex
    brandGoldenContent: "yellow:950",
    brandGoldenContentAlt: "yellow:800",

    brandGreen: "pastel-green:500",
    brandSecondaryGreen: "hippie-green:600",
    brandGreenContent: "palm-green:950",
    brandGreenContentAlt: "palm-green:800",

    // Gradientes (mantienen hex directo)
    riskGradient0: "#00000040",
    riskGradient1: "#5cde6666",
    riskGradient2: "#B8E549",
    riskGradient3: "#F1C91E",
    riskGradient4: "#FFA12B",
    riskGradient5: "#FB7C59",

    riskGradientDimmed1: "red:100",
    riskGradientDimmed2: "yellow:100",
    riskGradientDimmed3: "pastel-green:100",

    loadingGradient1: "pastel-green:50",
    loadingGradient2: "pastel-green:100",
    loadingGradientContent: "pastel-green:400",

    // Otros colores de marca
    darkGreen1: "darkGreen:100",
    darkGreen2: "darkGreen:200",

    // Reservados por ahora
    brandCyan: "brand:cyan",
    brandCoral: "brand:coral",
    brandBrown: "brand:brown",
  } satisfies Record<string, (keyof typeof colors) | `#${string}`>,
} as const;

export type ThemeDescriptor = {
  name: "dark"; // will be "dark" | "dark" once dark mode is added
  colors: typeof darkTheme.colors; // darkTheme acts as a reference for types
};
export type ThemeColorName = keyof ThemeDescriptor["colors"];

export function themeColor(theme: ThemeDescriptor, name: ThemeColorName) {
  const themeColor = theme.colors[name];

  if (themeColor.startsWith("#")) {
    return themeColor;
  }

  if (themeColor in colors) {
    return colors[themeColor as keyof typeof colors];
  }

  throw new Error(`Color ${themeColor} not found in theme`);
}

const ThemeContext = createContext({
  theme: darkTheme,
  setTheme: (_: ThemeDescriptor) => {},
});

export function useTheme() {
  const { theme, setTheme } = useContext(ThemeContext);
  return {
    color: (name: ThemeColorName) => themeColor(theme, name),
    setTheme,
    theme,
  };
}

export function Theme({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeDescriptor>(darkTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
