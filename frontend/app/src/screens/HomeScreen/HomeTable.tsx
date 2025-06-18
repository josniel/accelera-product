import type { ReactNode } from "react";

import { css } from "@/styled-system/css";
import { Fragment } from "react";

import { IconInfo } from "@liquity2/uikit";

type HomeTableProps<Cols extends readonly ReactNode[]> = {
  columns: Cols;
  // icon: ReactNode;
  loading?: ReactNode;
  placeholder?: ReactNode;
  rows: Array<ReactNode | { [K in keyof Cols]: ReactNode }>;
  subtitle: ReactNode;
  title: ReactNode;
};

export function HomeTable<Cols extends readonly ReactNode[]>({
  columns,
  // icon,
  loading,
  placeholder,
  rows,
  subtitle,
  title,
}: HomeTableProps<Cols>) {
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
      {loading
        ? (
          <div
            className={css({
              display: "flex",
              gap: 16,
              justifyContent: "center",
              height: 48,
              border: "1px solid red",
            })}
          >
            {loading}
          </div>
        )
        : rows.length === 0
        ? (
          <div
            className={css({
              display: "grid",
              placeItems: "center",
              height: 64,
              margin: "-16px 0",
              padding: "0 0 16px",
              fontSize: 14,
              color: "contentAlt",
              userSelect: "none",
              border: "1px solid red",
            })}
          >
            <div
              className={css({
                display: "grid",
                placeItems: "center",
                width: "100%",
                padding: "12px 16px",
                color: "disabledContent",
                background: "disabledSurface",
                borderRadius: 8,
              })}
            >
              {placeholder ?? "No data"}
            </div>
          </div>
        )
        : (
          <table
            className={css({
              width: "100%",
              fontSize: 14,
              // border: "1px solid red",
              borderRadius: 20,
              background: "background2",
              // backdropFilter: "blur(15px)",
              px: "24px",
              pt: 30,
              "& th, & td": {
                fontWeight: "inherit",
                whiteSpace: "nowrap",
                textAlign: "right",
              },
              "& th": {
                paddingBottom: 8,
                color: "contentAlt2",
                fontSize: 12,
                fontWeight: 500,
                userSelect: "none",
              },
              "& td": {
                padding: "12px 0",
                // borderTop: "1px solid token(colors.tableBorder)",
              },
              "& th:first-of-type, & td:first-of-type": {
                textAlign: "left",
              },
              "& thead tr + tr th": {
                color: "contentAlt2",
              },
            })}
            style={{
              backdropFilter: "blur(15px)",
              WebkitBackdropFilter: "blur(15px)",
            }}
          >
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th key={index}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <Fragment key={rowIndex}>
                  {!Array.isArray(row) ? row : (
                    <tr>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
}
