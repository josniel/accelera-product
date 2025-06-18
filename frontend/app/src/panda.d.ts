import type { Token } from "@pandacss/dev";

declare module "@pandacss/dev" {
  interface Breakpoints {
    xxs: Token;
    xs: Token;
    sm: Token;
    md: Token;
    lg: Token;
    xl: Token;
    xl1: Token;
    "2xl": Token;
  }
}
