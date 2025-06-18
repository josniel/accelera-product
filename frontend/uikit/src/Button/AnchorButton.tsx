"use client";

import type { ComponentPropsWithRef, ComponentType } from "react";
import type { ButtonProps } from "./Button";

import { createElement } from "react";
// import { useButtonStyles } from "./Button";

export function AnchorButton({
  AnchorComponent,
  external,
  label,
  maxWidth,
  mode = "secondary",
  ref,
  shape,
  size = "md",
  wide,
  ...props
}: ComponentPropsWithRef<"a"> & ButtonProps & {
  AnchorComponent?: ComponentType<ComponentPropsWithRef<"a">>;
  external?: boolean;
}) {
  // const buttonStyles = useButtonStyles({ mode, size });
  const externalProps = !external ? {} : {
    target: "_blank",
    rel: "noopener noreferrer",
  };
  return createElement(AnchorComponent ?? "a", {
    ref,
    className: "",
    style: {
      display: "inline-flex",
      maxWidth,
      width: wide ? "100%" : undefined,
      // ...buttonStyles.styles,
    },
    ...externalProps,
    ...props,
  }, label);
}
