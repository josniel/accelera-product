import type { ReactNode } from "react";

import { css } from "@/styled-system/css";
// import { token } from "@/styled-system/tokens";

export function MenuItem({
  icon,
  label,
  // selected,
}: {
  icon: ReactNode;
  label: ReactNode;
  selected?: boolean;
}) {
  return (
    <>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          width: 16,
          height: 16,
          _groupHover: { color: "accent" },
        })}
      >
        {icon}
      </div>
      <div
        className={css({
          fontSize: { "2xl": 14, "2xlDown": 12 },
          fontWeight: 400,
          // _hover: { color: "accent" },
          transitionProperty: "common",
          transitionDuration: "normal",
          transitionTimingFunction: "ease-in-out",
        })}
      >
        {label}
      </div>
    </>
  );
}
