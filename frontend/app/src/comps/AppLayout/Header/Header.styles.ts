import { css } from "@/styled-system/css";

export const headerWrapper = css({
  width: "auto",
  position: "relative",
  // zIndex: { lgDown: 10, lg: 0 },
  height: 80,
  lg: { overflow: "hidden" },
  // lgDown: {
  //   bgColor: "layout",
  //   backdropBlur: "[5.1px]",
  // },
});

export const bottomLine = css({
  w: "100%",
  pos: "absolute",
  bottom: "0",
  left: "50%",
  transform: "translateX(-50%)",
  h: 1,
  lgDown: { display: "none" },
  opacity: 0.5,
  mixBlendMode: "overlay",
  bgColor: "white",
});

export const innerWrapper = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  height: { lgDown: 72, lg: "100%" },
  pl: { xlDown: 16, xl: 32 },
  pr: { xlDown: 16, xl: 32 },
  width: "auto",
});
