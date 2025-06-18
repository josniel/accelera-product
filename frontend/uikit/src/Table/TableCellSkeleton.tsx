import React from "react";
import { cva, cx } from "../../styled-system/css";
import TableCell from "./TableCell";

interface ExtendedTableCellProps {
  width?: number;
  align?: "left" | "right" | "center";
  children?: React.ReactNode;
  className?: string;
}

const TableCellSkeleton = ({
  width,
  align = "left",
  children,
  className = "",
}: ExtendedTableCellProps) => {
  const tableCellSkeletonRecipe = cva({
    base: {
      display: "flex",
      minWidth: width,
      width: width,
      flexGrow: 1,
    },
    variants: {
      align: {
        left: {
          justifyContent: "flex-start",
        },
        center: {
          justifyContent: "center",
        },
        right: {
          justifyContent: "flex-end",
        },
      },
    },
    defaultVariants: {
      align: "center",
    },
  });

  const tableSkeletonClassName = tableCellSkeletonRecipe({ align: align });

  return <TableCell className={cx(className, tableSkeletonClassName)}>{children}</TableCell>;
};

export default TableCellSkeleton;
