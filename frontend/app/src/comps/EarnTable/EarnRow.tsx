"use client";
import { Amount } from "@/src/comps/Amount/Amount";
import { LinkTextButton } from "@/src/comps/LinkTextButton/LinkTextButton";
// import { DNUM_1 } from "@/src/dnum-utils";
import {
  getBranch,
  getCollToken,
  // useAverageInterestRate,
  // useBranchDebt,
  useEarnPool,
} from "@/src/liquity-utils";
import type { CollateralSymbol } from "@/src/types";
import { css, cx } from "@/styled-system/css";
import { TokenIcon } from "@liquity2/uikit";
// import * as dn from "dnum";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// components
// import MobileRow from "@/components/SeasonZero/Rewards/Table/MobileRow";
import { TableCell, TableRow } from "@liquity2/uikit";

// models

interface Props {
  symbol: CollateralSymbol;
  index: number;
}

const RowData = ({ symbol }: Props) => {
  const branch = getBranch(symbol);
  const collateral = getCollToken(branch.id);
  const earnPool = useEarnPool(branch.id);

  const commonStyles = css({
    // w-[20%] flex justify-center items-center
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  });
  return (
    <>
      <TableRow
        className={css({
          // hidden lg:flex
          display: "flex",
          // lgDown: { display: "none" },
        })}
      >
        <TableCell
          className={css({
            // w-[20%] flex items-center gap-1.5
            width: "15%",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "content",
          })}
        >
          <TokenIcon symbol={symbol} size="mini" />
          <span>{collateral?.name}</span>
        </TableCell>

        <TableCell className={cx(commonStyles, css({ w: "30%" }))}>
          <Amount
            fallback="…"
            percentage
            value={earnPool.data?.apr}
          />
        </TableCell>

        <TableCell className={cx(commonStyles, css({ w: "25%" }))}>
          <Amount
            fallback="…"
            format="compact"
            prefix="$"
            value={earnPool.data?.totalDeposited}
          />
        </TableCell>

        {
          /* <TableCell className={commonStyles}>
          <Amount
            format="compact"
            prefix="$"
            fallback="…"
            value={branchDebt.data}
          />
        </TableCell> */
        }
        <TableCell
          className={css({
            // w-[20%] flex justify-center items-center
            width: "30%",
            display: "flex",
            gap: 16,
            justifyContent: "end",
            alignItems: "center",
          })}
        >
          <LinkTextButton
            href={`/earn/${symbol.toLowerCase()}`}
            className={css({ textDecoration: "none", color: "content" })}
            label={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "content",
                })}
              >
                Earn
                <TokenIcon.Group size="mini">
                  <TokenIcon symbol="USDX" />
                  <TokenIcon symbol={symbol} />
                </TokenIcon.Group>
              </div>
            }
            title={`Earn USDX with ${collateral?.name}`}
          />
        </TableCell>
      </TableRow>
      {/* <MobileRow row={row} index={index} /> */}
    </>
  );
};

export default RowData;
