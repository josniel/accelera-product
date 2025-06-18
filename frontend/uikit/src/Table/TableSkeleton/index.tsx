"use client";
import { Fragment } from "react";
import { css } from "../../../styled-system/css";

// Components
import { TableCellSkeleton, TableRow } from "../index";
import ActionsCell from "./Cells/ActionsCell";
import PointStackCell from "./Cells/PointStackCell";
import SliderCell from "./Cells/SliderCell";
import TextCell from "./Cells/TextCell";
import TokenCell from "./Cells/TokenCell";

// Utilities
import { useMediaQuery } from "../../react-utils";

// Types
import { Cells, Column } from "./types";

const getTypeCell = (cell: Cells) => {
  switch (cell.type) {
    case "Token":
      return <TokenCell variant={cell.variant} />;
    case "Text":
      return <TextCell variant={cell.variant} />;
    case "Actions":
      return <ActionsCell variant={cell.variant} />;
    case "Slider":
      return <SliderCell />;
    case "PointStack":
      return <PointStackCell />;
    default:
      return null;
  }
};

interface TableSkeletonProps {
  columns?: Column[];
  mobileSize?: string;
}
const TableSkeleton = ({
  columns = [],
  mobileSize = "1024px",
}: TableSkeletonProps) => {
  const isMobile = useMediaQuery(`(max-width: ${mobileSize})`);
  return (
    <>
      <TableRow
        className={css({
          // w-full flex items-center
          display: "flex",
          width: "auto",
          alignItems: "center",
        })}
      >
        {columns.map((column, index) => (
          <Fragment key={index}>
            {isMobile
              ? (
                <>
                  {column.showOnMobile && (
                    <TableCellSkeleton
                      key={index}
                      align={column.align}
                      width={column.width}
                      className={column.className}
                    >
                      {getTypeCell(column.cell)}
                    </TableCellSkeleton>
                  )}
                </>
              )
              : (
                <TableCellSkeleton
                  key={index}
                  align={column.align}
                  width={column.width}
                  className={column.className}
                >
                  {getTypeCell(column.cell)}
                </TableCellSkeleton>
              )}
          </Fragment>
        ))}
      </TableRow>
    </>
  );
};

export default TableSkeleton;
