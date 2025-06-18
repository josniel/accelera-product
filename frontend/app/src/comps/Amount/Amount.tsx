import type { FmtnumOptions, FmtnumPresetName } from "@/src/formatting";

import { fmtnum } from "@/src/formatting";
import { cva } from "@/styled-system/css";
import { a, useTransition } from "@react-spring/web";

const AmountRecipe = cva({
  base: {
    display: "inline-flex",
    width: "fit-content",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    transformOrigin: "50% 50%",
    textDecoration: "inherit",
    color: "content",
  },
  variants: {
    size: {
      sm: { fontSize: 12 }, // 14px
      md: { fontSize: 24 }, // 16px
      lg: { fontSize: 32 }, // 18px
    },
    weight: {
      normal: { fontWeight: "normal" },
      medium: { fontWeight: "500" },
      bold: { fontWeight: "bold" },
    },
    colors: {
      content: { color: "token(colors.content)" },
      // contentAlt: { color: colors.contentAlt },
      // contentAlt2: { color: colors.contentAlt2 },
      // accent: { color: colors.accent },
      // brandCyan: { color: colors.brandCyan },
      // negative: { color: colors.negative },
    },
  },
  defaultVariants: {
    size: "sm",
    weight: "medium",
    colors: "content",
  },
});

export function Amount({
  fallback = "",
  format,
  percentage = false,
  prefix = "",
  suffix = "",
  title: titleParam,
  value,
  size = "sm",
  weight = "medium",
  colors = "content",
}: {
  fallback?: string;
  format?: FmtnumPresetName | number;
  percentage?: boolean;
  prefix?: string;
  suffix?: string;
  title?: string | null | {
    prefix?: string;
    suffix?: string;
  };
  value: Parameters<typeof fmtnum>[0];
  size?: "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "bold";
  colors?: "content" /* | "contentAlt" | "contentAlt2" | "accent" | "brandCyan" | "negative" */;
}) {
  const scale = percentage ? 100 : 1;

  if (percentage && !suffix) {
    suffix = "%";
  }
  if (format === undefined) {
    if (percentage) {
      format = "pct2z";
    } else {
      format = "2z";
    }
  }

  const showFallback = value === null || value === undefined;

  const fmtOptions: FmtnumOptions = { prefix, scale, suffix };
  if (typeof format === "number") {
    fmtOptions.digits = format;
  } else if (typeof format === "string") {
    fmtOptions.preset = format;
  }

  const content = showFallback ? fallback : fmtnum(value, fmtOptions);

  const title = showFallback ? undefined : (
    titleParam === undefined
      ? fmtnum(value, { prefix, preset: "full", scale }) + suffix
      : typeof titleParam === "string"
      ? titleParam
      : titleParam === null
      ? undefined
      : fmtnum(value, {
        prefix: titleParam.prefix,
        preset: "full",
        scale,
        suffix: titleParam.suffix,
      })
  );

  const fallbackTransition = useTransition([{ content, title, showFallback }], {
    keys: (item) => String(item.showFallback),
    initial: {
      transform: "scale(1)",
    },
    from: {
      transform: "scale(0.9)",
    },
    enter: {
      transform: "scale(1)",
    },
    leave: {
      display: "none",
      immediate: true,
    },
    config: {
      mass: 1,
      tension: 2000,
      friction: 80,
    },
  });

  const AmountClass = AmountRecipe({
    size: size,
    weight: weight,
    colors: colors,
  });

  return fallbackTransition((style, { content, title }) => (
    <a.div
      title={title ?? undefined}
      className={AmountClass}
      style={style}
    >
      {content}
    </a.div>
  ));
}
