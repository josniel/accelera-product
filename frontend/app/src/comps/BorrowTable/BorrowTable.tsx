import type { ReactNode } from "react";

import { css } from "@/styled-system/css";
import { useState } from "react";

import { getBranches } from "@/src/liquity-utils";
import { IconInfo } from "@liquity2/uikit";
import { TableHeaderCell } from "@liquity2/uikit";
import { useMediaQuery } from "@liquity2/uikit";
import { Column, SortTypes, TableBody, TableHead, TableSkeleton } from "@liquity2/uikit";
import { useSort } from "../../useSort";
import BorrowRow from "./BorrowRow";

type BorrowTableProps<Cols extends readonly ReactNode[]> = {
  // columns: Cols;
  // icon: ReactNode;
  loading?: ReactNode;
  placeholder?: ReactNode;
  rows: Array<ReactNode | { [K in keyof Cols]: ReactNode }>;
  subtitle: ReactNode;
  title: ReactNode;
};

interface PositionBorrow {
  collateral: string;
  avgRate: string;
  maxLTV: string;
}

const positions: PositionBorrow[] = [
  {
    collateral: "ETH",
    avgRate: "5.2%",
    maxLTV: "75%",
  },
  {
    collateral: "BTC",
    avgRate: "4.8%",
    maxLTV: "70%",
  },
  {
    collateral: "USDC",
    avgRate: "3.1%",
    maxLTV: "85%",
  },
];
export function BorrowTable<Cols extends readonly ReactNode[]>({
  // columns,
  // icon,
  loading,
  // placeholder,
  // rows,
  subtitle,
  title,
}: BorrowTableProps<Cols>) {
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const TableHeaderCells: TableHeaderCell[] = [
    { text: "Collateral", className: css({ w: "15%" }) },
    { text: "Avg rate, p.a.", className: css({ w: "30%", textAlign: "center" }), sortBy: "balance" },
    { text: "Max LTV", className: css({ w: "25%", textAlign: "center" }), sortBy: "points" },
    { text: "Action", className: css({ w: "30%", textAlign: "right" }) },
  ];
  const COLUMNS: Column[] = [
    {
      cell: { type: "Token", variant: "Single" },
      width: isMobile ? 50 : 20,
      align: "left",
      showOnMobile: true,
    },
    { cell: { type: "Text", variant: "OnlyText" }, width: 20, align: "center" },
    { cell: { type: "Text", variant: "OnlyText" }, width: 20, align: "center" },
    { cell: { type: "Text", variant: "OnlyText" }, width: 20, align: "center" },
    { cell: { type: "Text", variant: "OnlyText" }, width: 20, align: "right" },
  ];

  const [sort, setSort] = useState<SortTypes | null>(null);
  const [sortBy, setSortBy] = useState<keyof PositionBorrow | null>(null);
  //
  const sortedMappedTableData = useSort({
    sortBy,
    sort,
    data: positions,
    sortByDefault: "",
    sortFn: poolsSort,
  });
  console.log("sortedMappedTableData :>> ", sortedMappedTableData);
  function poolsSort(
    a: PositionBorrow,
    b: PositionBorrow,
    defaultSort: (a: PositionBorrow, b: PositionBorrow) => number,
  ): number {
    return defaultSort(a, b);
  }

  function toggleSort(sortBy: string | null, sort: SortTypes | null): void {
    setSortBy(sortBy as keyof PositionBorrow);
    setSort(sort);
  }
  return (
    <section
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: 16,
        pt: "18px",
        // px: "24px",
        background: " linear-gradient(39deg, rgba(12, 12, 12, 0.80) 4.25%, rgba(21, 27, 21, 0.80) 112.49%)",
        borderRadius: 20,
        // backdropFilter: "blur(15px)",
      })}
      style={{
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
      }}
    >
      <header
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: 8,
          px: "24px",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            fontWeight: 400,
            fontSize: {
              lg: 16,
              // md: 20,
            },
          })}
        >
          <span
            className={css({
              display: "flex",
              alignItems: "center",
              // minHeight: 24,
              gap: 8,
              color: "secondary",
            })}
          >
            {title}
            <div className={css({ color: "controlBorder" })}>
              <IconInfo size={16} />
            </div>
          </span>
        </div>
        <div
          className={css({
            color: "contentAlt",
            fontSize: 14,
            fontWeight: 400,
          })}
        >
          {subtitle}
        </div>
      </header>
      <div
        className={css({
          // mb-2.5 xl:mb-5 w-full h-[460px] max-h-[460px] overflow-hidden pt-4 pb-8 px-8 max-md:px-3 [background:linear-gradient(39deg,_rgba(12,_12,_12,_0.80)_4.25%,_rgba(21,_27,_21,_0.80)_112.49%)] rounded-[20px] backdrop-blur-[15px]
          // mb: 10,
          w: "auto",
          // h: "460px",
          maxH: "460px",
          overflow: "hidden",
          // pt: 8,
          pb: 16,
          // px: 32,
          // xl: { mb: 20 },
          mdDown: { px: 12 },
          borderRadius: 20,
          background: "background2",
          // backdropFilter: "blur(15px)",
          px: 24,
          pt: 30,
        })}
        style={{
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
        }}
      >
        {!(getBranches().length <= 0)
          ? (
            <div
              className={css({
                // hidden lg:block
                display: "block",
                // lgDown: { display: "none" },
              })}
            >
              <TableHead
                items={TableHeaderCells}
                sort={sort}
                sortBy={sortBy}
                setSort={toggleSort}
              />
            </div>
          )
          : null}

        <div
          className={css({
            // w-full relative max-h-[420px] pb-5 lg:pt-10 pt-28 pr-2 overflow-y-scroll custom-scrollbar flex flex-col justify-center h-full
            w: "auto",
            position: "relative",
            maxH: "420px",
            pb: 10,
            lg: { pt: 10 },
            pt: 112,
            pr: 8,
            overflowY: "scroll",
            overflowX: "hidden",
            // scrollbarWidth: "none",
            // msOverflowStyle: "none",
            // "&::-webkit-scrollbar": {
            //   display: "none",
            // },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            h: "auto",
          })}
        >
          <TableBody>
            {loading
              ? (
                Array.from({ length: 6 }).map((_, index) => <TableSkeleton key={index} columns={COLUMNS} />)
              )
              : getBranches().length <= 0 && !loading
              ? <div></div>
              : (
                getBranches().map(({ symbol }, index) => <BorrowRow index={index} key={index} symbol={symbol} />)
              )}
          </TableBody>
        </div>
      </div>
    </section>
  );
}
