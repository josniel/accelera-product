import type { Token } from "./types";

import tokenAccel from "./token-icons/accel.svg";
import tokenEth from "./token-icons/eth.svg";
import tokenLusd from "./token-icons/lusd.svg";
import tokenReth from "./token-icons/reth.svg";
import tokenUsdx from "./token-icons/usdx.svg";
import tokenSteth from "./token-icons/wsteth.svg";

export type CollateralSymbol = "ETH" | "RETH" | "WSTETH";

export function isCollateralSymbol(symbol: string): symbol is CollateralSymbol {
  return symbol === "ETH" || symbol === "RETH" || symbol === "WSTETH";
}

export type CollateralToken = Token & {
  collateralRatio: number;
  symbol: CollateralSymbol;
};

export const LUSD: Token = {
  icon: tokenLusd,
  name: "LUSD",
  symbol: "LUSD" as const,
} as const;

export const USDX: Token = {
  icon: tokenUsdx,
  name: "USDX",
  symbol: "USDX" as const,
} as const;

export const ACCEL: Token = {
  icon: tokenAccel,
  name: "ACCEL",
  symbol: "ACCEL" as const,
} as const;

export const ETH: CollateralToken = {
  collateralRatio: 1.1,
  icon: tokenEth,
  name: "ETH",
  symbol: "ETH" as const,
} as const;

export const RETH: CollateralToken = {
  collateralRatio: 1.2,
  icon: tokenReth,
  name: "rETH",
  symbol: "RETH" as const,
} as const;

export const WSTETH: CollateralToken = {
  collateralRatio: 1.2,
  icon: tokenSteth,
  name: "wstETH",
  symbol: "WSTETH" as const,
} as const;

export const COLLATERALS: CollateralToken[] = [
  ETH,
  RETH,
  WSTETH,
];

export const TOKENS_BY_SYMBOL = {
  USDX,
  ETH,
  ACCEL,
  RETH,
  WSTETH,
  LUSD,
} as const;
