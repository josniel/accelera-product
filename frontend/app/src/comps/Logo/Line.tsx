import { css } from "@/styled-system/css";

export const line = css({
  w: 1,
  position: "absolute",
  top: -40,
  right: 0,
  height: "calc(100% + 80px)",
  backgroundColor: "white",
  opacity: 0.5,
  zIndex: 0,
  mixBlendMode: "overlay",
  display: { lgDown: "none", lg: "block" },
});

export function Line(props: React.ComponentPropsWithoutRef<"div">) {
  return <div className={line} {...props} />;
}
