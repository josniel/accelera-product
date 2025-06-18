"use client";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../../styled-system/css";
// import { cardContentRecipe, cardHeaderRecipe, cardRecipe } from "./Card.styles";

export type CardProps = {
  children: ReactNode;
  maxWidth?: number;
  wide?: boolean;
  mode?: "primary" | "secondary" | "tertiary";
} & ComponentPropsWithoutRef<"div">;

import { cva } from "../../styled-system/css";

const cardRecipe = cva({
  base: {
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "lg",
  },
  variants: {
    visual: {
      primary: {
        bg: "linear-gradient(39deg, #0D110E 4.25%, #374A39 112.49%)",
        _hover: {
          bg: "linear-gradient(39deg, #233024 4.25%, #29502C 112.49%)",
        },
      },
      secondary: {
        bg: "linear-gradient(36deg, rgba(13, 17, 14, 0.50) 0%, rgba(55, 74, 57, 0.50) 100%)",
      },
      tertiary: {
        bg: "rgba(87, 87, 87, 0.08)",
        backdropBlur: "15px",
      },
    },
  },
  defaultVariants: {
    visual: "primary",
  },
});

const cardHeaderRecipe = cva({
  base: {
    position: "relative",
    width: "auto",
    borderRadius: "20px",
  },
  variants: {
    variant: {
      primary: {
        bg: "rgba(255, 255, 255, 0.05)",
        _groupHover: { bg: "rgba(255, 255, 255, 0.15)" },
        px: 15,
        py: 12,
      },
      secondary: {
        bg: "linear-gradient(72deg, rgba(13, 17, 14, 0.50) 24.79%, rgba(55, 74, 57, 0.50) 75.21%)",
        px: 20,
        py: 18,
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

const cardContentRecipe = cva({
  base: {
    position: "relative",
    height: "auto",
  },
  variants: {
    variant: {
      primary: {
        px: 16,
      },
      secondary: {
        px: 20,
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export function Card({
  className,
  children,
  maxWidth,
  style,
  mode = "primary",
  wide,
  ...props
}: CardProps) {
  const cardClass = cardRecipe({ visual: mode });

  return (
    <div
      className={cx(cardClass, className, "group")}
      style={{
        maxWidth,
        width: wide ? "100%" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
} & ComponentPropsWithoutRef<"div">;

export function CardHeader({ children, variant = "primary", className, ...props }: CardHeaderProps) {
  const headerClass = cardHeaderRecipe({ variant });
  return (
    <div className={cx(headerClass, className)} {...props}>
      {children}
    </div>
  );
}

type CardContentProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
} & ComponentPropsWithoutRef<"div">;

export function CardContent({ children, variant = "primary", className, ...props }: CardContentProps) {
  const contentClass = cardContentRecipe({ variant });
  return (
    <div className={cx(contentClass, className)} {...props}>
      {children}
    </div>
  );
}
