"use client";

import React from "react";
import { css, cx } from "../../styled-system/css";

interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

const TableBody = ({ className, children }: TableBodyProps) => {
  return (
    <div
      className={cx(
        className,
        css({
          display: "flex",
          flexDirection: "column",
          gap: 8,
          color: "white",
        }),
      )}
    >
      {children}
    </div>
  );
};

export default TableBody;
