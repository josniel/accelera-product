export type TokenCellVariant = 'Single' | 'Pair' | 'SingleSquare'
export type TextCellVariant = 'OnlyText' | 'WithInfo' | 'WithInfoLeft' | 'DoubleText'
export type ActionsCellVariant = 'Single' | 'Pair'
export type SliderCellVariant = 'Default'
export type PointStackCellVariant = 'Default'

export type TokenCell = {
  type: 'Token'
  variant: TokenCellVariant
}

export type TextCell = {
  type: 'Text'
  variant: TextCellVariant
}

export type ActionsCell = {
  type: 'Actions'
  variant: ActionsCellVariant
}

export type SliderCell = {
  type: 'Slider'
  variant: SliderCellVariant
}
export type PointStackCell = {
  type: 'PointStack'
  variant: PointStackCellVariant
}

export type Cells = TokenCell | TextCell | ActionsCell | SliderCell | PointStackCell

export type Column = {
  cell: Cells
  align: 'left' | 'center' | 'right'
  width: number
  showOnMobile?: boolean
  className?: string
}
