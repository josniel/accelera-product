"use client";

import React from "react";
import { css, cx } from "../../styled-system/css";

interface TableCellProps {
  className?: string;
  children?: React.ReactNode;
}

const TableCell = ({ className, children }: TableCellProps) => {
  return (
    <div
      className={cx(
        className,
        css({
          display: "flex",
          py: 8,
        }),
      )}
    >
      {children}
    </div>
  );
};

export default TableCell;
