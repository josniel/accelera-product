import { css } from "@/styled-system/css";

export const linkWrapperHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: { xxsDown: "100%", lgDown: "fit-content", lg: "auto" },
  height: "100%",
  position: { lg: "relative" },
  pr: 40,
  // lgDown: {
  //   ml: 0,
  //   top: "50%",
  //   transform: "translateY(-50%)",
  //   left: 40,
  // },
});

export const imageHeader = css({
  lgDown: {
    w: 111,
    h: 32,
  },
  position: "relative",
  userSelect: "none",
  // zIndex: 8,
});

export const linkWrapperFooter = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: { xxsDown: "100%", lgDown: "fit-content", lg: "auto" },
  height: "100%",
  position: { lg: "relative", lgDown: "absolute" },
  pr: 40,
  lgDown: {
    ml: 0,
    top: "1/2",
    transform: "translateY(-50%)",
    left: 0,
  },
});

export const imageFooter = css({
  position: "relative",
  userSelect: "none",
  // zIndex: 8,
});
