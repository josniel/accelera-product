"use client";

import type { StatusMode } from "../types";

import { css } from "../../styled-system/css";

export function StatusDot({
  size = 12,
  mode,
}: {
  size?: number;
  mode: StatusMode;
}) {
  return (
    <div
      className={css({
        position: "relative",
      })}
      style={{
        height: size,
        width: size,
      }}
    >
      <div
        className={css({
          borderRadius: "0",
          transform: "rotate(45deg)",
          // position: "absolute",
          // top: "50%",
          // left: "50%",
          opacity: 0.5,
          "--status-dot-positive": "token(colors.accent)",
          "--status-dot-warning": "token(colors.warning)",
          "--status-dot-negative": "token(colors.negative)",
          "--status-dot-neutral": "token(colors.contentAlt2)",
        })}
        style={{
          background: `var(--status-dot-${mode})`,
          height: size,
          width: size,
        }}
      />
      <div
        className={css({
          borderRadius: "0",
          transform: "translateX(-50%) translateY(-50%) rotate(45deg)",
          position: "absolute",
          left: "50%",
          top: "50%",
          "--status-dot-positive": "token(colors.accent)",
          "--status-dot-warning": "token(colors.warning)",
          "--status-dot-negative": "token(colors.negative)",
          "--status-dot-neutral": "token(colors.contentAlt2)",
        })}
        style={{
          background: `var(--status-dot-${mode})`,
          height: size * 0.4,
          width: size * 0.4,
        }}
      />
    </div>
  );
}
