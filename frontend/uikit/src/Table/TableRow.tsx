"use client";
// import { useState } from "react";
import React from "react";
import { css, cx } from "../../styled-system/css";

interface TableRowProps {
  className?: string;
  children: React.ReactNode;
}

const TableRow = ({ className, children }: TableRowProps) => {
  // const [isHover, setIsHover] = useState(false);

  // const mergeClass = cn(
  //   "flex rounded-[.625rem] min-h-[3.4375rem] bg-[#1A201C] px-5 max-md:px-2.5 hover:bg-[#222A25] transition-all",
  //   className,
  // );

  // const handleMouseEnter = () => setIsHover(true);

  // const handleMouseLeave = () => {
  //   setTimeout(() => {
  //     setIsHover(false);
  //   }, 350);
  // };

  return (
    <div
      className={cx(
        className,
        css({
          position: "relative",
          display: "flex",
          borderRadius: "0.625rem",
          minHeight: "3.4375rem",
          backgroundColor: "darkGreen1",
          px: 20,
          mdDown: { px: 10 },
          _hover: { bg: "darkGreen2", transition: "background-color 0.3s ease-in-out" },
        }),
      )}
      // onMouseLeave={handleMouseLeave}
      // onMouseEnter={handleMouseEnter}
    >
      {children}
    </div>
  );
};

export default TableRow;
