import { css } from "@/styled-system/css";

export const socialsWrapper = css({
  display: "flex",
  alignItems: "center",
  gap: 16,
  lgDown: { display: "none" },
  position: "relative",
  zIndex: 10,
});

export const SocialsLinks = css({
  bg: "dark",
  borderRadius: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  w: 25,
  h: 25,
  color: "white",
  border: "0.93px solid token(colors.border)",
  transition: "all 0.3s ease-in-out",
  _hover: {
    border: "0.93px solid token(colors.accent)",
  },
});