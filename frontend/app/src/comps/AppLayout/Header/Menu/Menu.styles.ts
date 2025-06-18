import { css } from "@/styled-system/css";

export const menuWrapper = css({
  display: "flex",
  alignItems: "center",
  mx: 32,
  "2xlDown": {
    mx: 0,
  },
  color: "accentContent",
  lgDown: { display: "none" },
  position: "relative",
  zIndex: 10,
});
