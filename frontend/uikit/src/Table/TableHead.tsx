"use client";
import { useState } from "react";
import { css, cx } from "../../styled-system/css";
import { IconArrowFilter, IconInfo } from "../icons";
import { TableHeaderCell } from "../types";
// models

// export interface TableHeaderCell {
//   text: string;
//   className: string;
//   rangeClassName?: string;
//   sortBy?: string;
//   tooltip?: React.ReactNode;
//   widthTooltip?: string;
// }

export enum SortTypes {
  DESC = -1,
  ASC = 1,
}

// personal models
interface TableHeadProps {
  items: TableHeaderCell[];
  setSort: (sortBy: string | null, sort: SortTypes | null) => void;
  sortBy: string | null;
  sort: SortTypes | null;
  // defaultSortClass?: string;
}

const TableHead = ({
  items,
  setSort,
  sortBy,
  sort,
  // defaultSortClass,
}: TableHeadProps) => {
  const [indexTooltip, setIndexTooltip] = useState<null | number>();

  // helpers
  function handleSort(newSortBy: string | null): void {
    if (!newSortBy) {
      return;
    }

    const newSort = newSortBy === sortBy && sort
      ? sort === SortTypes.DESC
        ? SortTypes.ASC
        : null
      : SortTypes.DESC;

    setSort(newSortBy, newSort);
  }

  // function mergeClassName(item: TableHeaderCell): string {
  //   return cn(
  //     " ",
  //     item.sortBy
  //       ? "cursor-pointer select-none justify-center "
  //       : "cursor-default",
  //     item.className,
  //   );
  // }

  // function sortClassName(item: TableHeaderCell): string {
  //   return cn(
  //     "text-[11px] inlinicon-arrow-down e-block ml-2",
  //     (item.sortBy === sortBy && sort) === SortTypes.DESC ? "-scale-y-100" : "",
  //     item.sortBy === sortBy && sort ? "" : defaultSortClass || "hidden  ",
  //   );
  // }

  return (
    <div
      className={css({
        // "flex text-[#888] text-xs font-medium mb-3.5 px-5 relative justify-center "
        display: "flex",
        width: "auto",
        color: "hint",
        fontSize: "12px",
        fontWeight: "500",
        marginBottom: "14px",
        px: "10px",
        justifyContent: "center",
        position: "relative",
      })}
    >
      {items.map((item, index) => {
        //
        const openInfo = indexTooltip === index;
        return (
          <div
            key={index}
            className={cx(
              // mergeClassName(item)
              item.className ?? "",
              item.sortBy
                ? css({
                  // cursor-pointer select-none justify-center
                  cursor: "pointer",
                  userSelect: "none",
                  justifyContent: "center",
                })
                : css({
                  // cursor-default
                  cursor: "default",
                }),
            )}
            onClick={() => handleSort(item.sortBy || null)}
          >
            {item.text}
            <span
              onMouseOver={() => item.tooltip && setIndexTooltip(index)}
              onMouseLeave={() => item.tooltip && setIndexTooltip(null)}
              className={css({
                // "leading-normal relative max-w-[20px]"
                position: "relative",
                maxWidth: "20px",
                lineHeight: "normal",
              })}
            >
              {item.tooltip && (
                <span
                  className={css({
                    width: "16px",
                    height: "16px",
                    cursor: "pointer",
                  })}
                >
                  <IconInfo size={16} />
                </span>
              )}
              {openInfo && (
                <div
                  // className={`absolute text-start z-[100]  ${
                  //   item.widthTooltip
                  //     ? "item.widthTooltip"
                  //     : "max-w-[17.25rem] w-[17.25rem]"
                  // } rounded-[.625rem] bottom-10 flex-col flex p-4 h-auto bg-[#222A25]  gap-3 items-start left-1/2 transform -translate-x-1/2`}
                  className={cx(css({
                    position: "absolute",
                    textAlign: "start",
                    zIndex: 100,
                    bottom: "40px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    gap: "12px",
                    backgroundColor: "darkGreen2",
                    borderRadius: "0.625rem",
                    maxWidth: item.widthTooltip ?? "17.25rem",
                    width: item.widthTooltip ?? "17.25rem",
                  }))}
                >
                  <h2
                    className={css({
                      // text-sm font-medium
                      fontSize: "14px",
                      fontWeight: "500",
                    })}
                  >
                    {item.text}
                  </h2>
                  <p
                    className={css({
                      // "text-shark-100 text-xs whitespace-normal break-words"
                      color: "shark:100",
                      fontSize: "12px",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    })}
                  >
                    {item.tooltip}
                  </p>
                </div>
              )}
            </span>
            {item.sortBy
              ? (
                <span
                  className={cx(
                    css({
                      marginLeft: "8px",
                    }),
                    (item.sortBy === sortBy && sort) === SortTypes.DESC
                      ? css({
                        transform: "scaleY(-1)",
                      })
                      : css({
                        transform: "scaleY(1)",
                      }),
                    item.sortBy === sortBy && sort ? "" : "hidden",
                  )}
                >
                  <IconArrowFilter size={11} />
                </span>
              )
              : null}
          </div>
        );
      })}
    </div>
  );
};

export default TableHead;
