"use client";

// import Slider from "@/src/comps/Slider/Slider";
import type { CollateralSymbol } from "@/src/types";
// import { InputField } from "@liquity2/uikit";
// import type { ReactNode } from "react";

import { useBreakpoint } from "@/src/breakpoints";
import { Amount } from "@/src/comps/Amount/Amount";
import { BorrowTable } from "@/src/comps/BorrowTable/BorrowTable";
import { EarnTable } from "@/src/comps/EarnTable/EarnTable";
import { LinkTextButton } from "@/src/comps/LinkTextButton/LinkTextButton";
import { Positions } from "@/src/comps/Positions/Positions";
import { DNUM_1 } from "@/src/dnum-utils";
import {
  getBranch,
  getBranches,
  getCollToken,
  useAverageInterestRate,
  useBranchDebt,
  useEarnPool,
} from "@/src/liquity-utils";
import { useAccount } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import { useState } from "react";
// import { HomeTable } from "./HomeTable";

export function HomeScreen() {
  const account = useAccount();
  // const [value, setValue] = useState(0);
  const [compact, setCompact] = useState(false);
  useBreakpoint(({ md }) => {
    setCompact(!md);
  });

  return (
    <div
      className={css({
        // flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        lg: { pt: 81 },
        // gap: {
        //   base: 40,
        //   md: 40,
        //   lg: 64,
        // },
        width: "100%",
      })}
    >
      <Positions address={account.address ?? null} />
      <div
        className={css({
          display: "grid",
          gap: 24,
          gridTemplateColumns: {
            base: "1fr",
            "2xl": "1fr 1fr",
          },
          mt: 60,
          lgDown: { mt: 80 },
        })}
      >
        <BorrowTable
          title={
            <>
              <span className={css({ fontWeight: 600 })}>Borrow USDx</span> against ETH and staked ETH
            </>
          }
          subtitle=""
          // icon={<IconBorrow />}
          rows={getBranches().map(({ symbol }) => (
            <BorrowingRow
              key={symbol}
              compact={compact}
              symbol={symbol}
            />
          ))}
        />
        <EarnTable
          title={
            <>
              <span className={css({ fontWeight: 600 })}>Earn rewards</span> with USDX
            </>
          }
          subtitle=""
          // icon={<IconBorrow />}
          rows={getBranches().map(({ symbol }) => (
            <EarnRewardsRow
              key={symbol}
              compact={compact}
              symbol={symbol}
            />
          ))}
        />
      </div>
    </div>
  );
}

// function BorrowTable({
//   compact,
// }: {
//   compact: boolean;
// }) {
//   const columns: ReactNode[] = [
//     "Collateral",
//     <span
//       key="avg-interest-rate"
//       title="Average interest rate, per annum"
//     >
//       {compact ? "Rate" : "Avg rate, p.a."}
//     </span>,
//     <span
//       key="max-ltv"
//       title="Maximum Loan-to-Value ratio"
//     >
//       Max LTV
//     </span>,
//     <span
//       key="total-debt"
//       title="Total debt"
//     >
//       {compact ? "Debt" : "Total debt"}
//     </span>,
//   ];

//   if (!compact) {
//     columns.push(null);
//   }

//   return (
//     <HomeTable
//       title={
//         <>
//           <span className={css({ fontWeight: 600 })}>Borrow USDx</span> against ETH and staked ETH
//         </>
//       }
//       subtitle=""
//       // icon={<IconBorrow />}
//       columns={columns}
//       rows={getBranches().map(({ symbol }) => (
//         <BorrowingRow
//           key={symbol}
//           compact={compact}
//           symbol={symbol}
//         />
//       ))}
//     />
//   );
// }

// function EarnTable({
//   compact,
// }: {
//   compact: boolean;
// }) {
//   const columns: ReactNode[] = [
//     "Pool",
//     <abbr
//       key="apr1d"
//       title="Annual Percentage Rate over the last 24 hours"
//     >
//       APR
//     </abbr>,
//     <abbr
//       key="apr7d"
//       title="Annual Percentage Rate over the last 7 days"
//     >
//       7d APR
//     </abbr>,
//     "Pool size",
//   ];

//   if (!compact) {
//     columns.push(null);
//   }
//   console.log("getBranches() :>> ", getBranches());
//   return (
//     <HomeTable
//       title={
//         <>
//           <span className={css({ fontWeight: 600 })}>Earn rewards</span> with USDX
//         </>
//       }
//       subtitle=""
//       // icon={<IconEarn />}
//       columns={columns}
//       rows={getBranches().map(({ symbol }) => (
//         <EarnRewardsRow
//           key={symbol}
//           compact={compact}
//           symbol={symbol}
//         />
//       ))}
//     />
//   );
// }

function BorrowingRow({
  compact,
  symbol,
}: {
  compact: boolean;
  symbol: CollateralSymbol;
}) {
  const branch = getBranch(symbol);
  const collateral = getCollToken(branch.id);
  const avgInterestRate = useAverageInterestRate(branch.id);
  const branchDebt = useBranchDebt(branch.id);

  const maxLtv = collateral?.collateralRatio && dn.gt(collateral.collateralRatio, 0)
    ? dn.div(DNUM_1, collateral.collateralRatio)
    : null;

  return (
    <tr>
      <td>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
          })}
        >
          <TokenIcon symbol={symbol} size="mini" />
          <span>{collateral?.name}</span>
        </div>
      </td>
      <td>
        <Amount
          fallback="…"
          percentage
          value={avgInterestRate.data}
        />
      </td>
      <td>
        <Amount
          value={maxLtv}
          percentage
        />
      </td>
      <td>
        <Amount
          format="compact"
          prefix="$"
          fallback="…"
          value={branchDebt.data}
        />
      </td>
      {!compact && (
        <td>
          <div
            className={css({
              display: "flex",
              gap: 16,
              justifyContent: "flex-end",
            })}
          >
            <LinkTextButton
              href={`/borrow/${symbol.toLowerCase()}`}
              label={
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 14,
                  })}
                >
                  Borrow
                  <TokenIcon symbol="USDX" size="mini" />
                </div>
              }
              title={`Borrow ${collateral?.name} from ${symbol}`}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

function EarnRewardsRow({
  compact,
  symbol,
}: {
  compact: boolean;
  symbol: CollateralSymbol;
}) {
  const branch = getBranch(symbol);
  const collateral = getCollToken(branch.id);
  const earnPool = useEarnPool(branch.id);
  return (
    <tr>
      <td>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
          })}
        >
          <TokenIcon symbol={symbol} size="mini" />
          <span>{collateral?.name}</span>
        </div>
      </td>
      <td>
        <Amount
          fallback="…"
          percentage
          value={earnPool.data?.apr}
        />
      </td>
      <td>
        <Amount
          fallback="…"
          percentage
          value={earnPool.data?.apr7d}
        />
      </td>
      <td>
        <Amount
          fallback="…"
          format="compact"
          prefix="$"
          value={earnPool.data?.totalDeposited}
        />
      </td>
      {!compact && (
        <td>
          <LinkTextButton
            href={`/earn/${symbol.toLowerCase()}`}
            label={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 14,
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
        </td>
      )}
    </tr>
  );
}
