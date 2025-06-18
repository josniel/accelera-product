import { Logo } from "@/src/comps/Logo/Logo";
import { css } from "@/styled-system/css";
import Socials from "./Socials";

export function Footer() {
  return (
    <div
      className={css({
        position: "absolute",
        bottom: 0,
        width: "100%",
        lg: { py: 24 },
        lgDown: {
          display: "none",
        },
      })}
    >
      <div
        className={css({
          position: "absolute",
          width: "100%",
          height: "100%",
          bg: "layout",
          backdropBlur: "6.44px",
          opacity: 0.3,
          bottom: 0,
          left: 0,
          top: 0,
          right: 0,
        })}
      >
      </div>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          w: "auto",
          ml: { xlDown: 16, xl: 32 },
          mr: { xlDown: 16, xl: 32 },
          position: "relative",
        })}
      >
        <Logo isFooter />
        <div
          className={css({
            fontSize: 12,
            color: "secondaryHint",
            pos: "relative",
            zIndex: 5,
          })}
        >
          All rights reserved © Accelera
        </div>
        <Socials />
      </div>
    </div>
  );
}
