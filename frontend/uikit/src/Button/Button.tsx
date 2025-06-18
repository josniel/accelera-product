"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cva, cx } from "../../styled-system/css";

export type ButtonProps = {
  label: ReactNode;
  icon?: ReactNode;
  maxWidth?: number;
  mode?: "primary" | "secondary" | "tertiary";
  shape?: "rounded" | "rectangular";
  size?: "mini" | "sm" | "md" | "lg";
  wide?: boolean;
};

const buttonRecipe = cva({
  base: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    px: "16px",
    py: "12px",
    fontSize: "14px",
    fontWeight: "400",
    w: "100%",
    h: "45px",
    transitionProperty:
      "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: "300ms",
    _focus: { outline: "2px solid transparent", outlineOffset: "2px" },
    zIndex: 2,
    lgDown: { px: "8", fontSize: "12px" },
    border: "none",
  },
  variants: {
    visual: {
      primary: {
        bg: "accent",
        _hover: { bg: "accentHover", borderColor: "accentHover" },
        color: "dark",
        borderWidth: "2px",
        borderColor: "accent",
        clipPath: "polygon(0% 11px, 13px 0%, 100% 0%, 100% calc(100% - 11px), calc(100% - 13px) 100%, 0% 100% )",
      },
      secondary: {
        borderRadius: "100px",
        bg: "accent",
        _hover: { bg: "accentHint", boxShadow: "0px 10px 20px 0px token(colors.riskGradient1)" },
        _active: {
          bg: "accent",
          boxShadow:
            "0px 4px 10px 0px token(colors.riskGradient0) inset, 0px 10px 20px 0px token(colors.riskGradient1)",
        },
        _disabled: {
          color: "disabledContent",
          bg: "disabledSurface",
          _hover: { bg: "disabledSurface", boxShadow: "none" },
        },
      },
      tertiary: {
        bg: "transparent",
        color: "secondaryHint",
        borderRadius: "100px",
        border: "1px solid token(colors.secondaryHint)",
        _hover: { color: "accent", border: "1px solid token(colors.accent)" },
        _disabled: {
          color: "disabledContent",
          border: "1px solid token(colors.disabledContent)",
          _hover: { color: "disabledContent", border: "1px solid token(colors.disabledContent)" },
        },
      },
    },
  },
  defaultVariants: {
    visual: "secondary",
  },
});

export function Button({
  className,
  label,
  maxWidth,
  mode = "secondary",
  shape = "rounded",
  size = "md",
  style,
  wide,
  icon,
  ...props
}: ComponentPropsWithoutRef<"button"> & ButtonProps) {
  const buttonClass = buttonRecipe({ visual: mode });
  return (
    <button
      className={cx(buttonClass, className, "group")}
      style={{
        maxWidth,
        width: wide ? "100%" : undefined,
        ...style,
      }}
      {...props}
    >
      <span
        style={{
          padding: props.disabled ? 0 : "0 1px",
        }}
      >
        {label}
      </span>
      {icon && <>{icon}</>}
    </button>
  );
}
