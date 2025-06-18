export type Address = `0x${string}`;

export type Direction = -1 | 1;

export type TokenSymbol =
  | "USDX"
  | "ETH"
  | "ACCEL"
  | "RETH"
  | "LUSD"
  | "WSTETH";

export type Token = {
  icon: string;
  name: string;
  symbol: TokenSymbol;
};

export type StatusMode = "positive" | "warning" | "negative" | "neutral";

export interface TableHeaderCell {
  text: string;
  className: string;
  rangeClassName?: string;
  sortBy?: string;
  tooltip?: React.ReactNode;
  widthTooltip?: string;
}

export type TokenCellVariant = "Single" | "Pair" | "SingleSquare";
export type TextCellVariant = "OnlyText" | "WithInfo" | "WithInfoLeft" | "DoubleText";
export type ActionsCellVariant = "Single" | "Pair";
export type SliderCellVariant = "Default";
export type PointStackCellVariant = "Default";

export type TokenCell = {
  type: "Token";
  variant: TokenCellVariant;
};

export type TextCell = {
  type: "Text";
  variant: TextCellVariant;
};

export type ActionsCell = {
  type: "Actions";
  variant: ActionsCellVariant;
};

export type SliderCell = {
  type: "Slider";
  variant: SliderCellVariant;
};
export type PointStackCell = {
  type: "PointStack";
  variant: PointStackCellVariant;
};

export type Cells = TokenCell | TextCell | ActionsCell | SliderCell | PointStackCell;

export type Column = {
  cell: Cells;
  align: "left" | "center" | "right";
  width: number;
  showOnMobile?: boolean;
  className?: string;
};

export enum SortTypes {
  DESC = -1,
  ASC = 1,
}
