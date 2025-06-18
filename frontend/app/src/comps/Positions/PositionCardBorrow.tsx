import type { PositionLoanCommitted } from "@/src/types";
import type { Dnum } from "dnum";
import type { ReactNode } from "react";

import { Amount } from "@/src/comps/Amount/Amount";
import { formatLiquidationRisk } from "@/src/formatting";
import { fmtnum } from "@/src/formatting";
import { getLiquidationRisk, getLtv, getRedemptionRisk } from "@/src/liquity-math";
import { getCollToken, shortenTroveId } from "@/src/liquity-utils";
import { usePrice } from "@/src/services/Prices";
import { riskLevelToStatusMode } from "@/src/uikit-utils";
import { css } from "@/styled-system/css";
import { HFlex, IconBorrowAction, StatusDot, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import { IconWrapper } from "../IconWrapper/IconWrapper";
import { PositionCard } from "./PositionCard";
import { CardRow, CardRows } from "./shared";

export function PositionCardBorrow({
  batchManager,
  debt,
  branchId,
  deposit,
  interestRate,
  statusTag,
  troveId,
}:
  & Pick<
    PositionLoanCommitted,
    | "batchManager"
    | "branchId"
    | "deposit"
    | "interestRate"
    | "troveId"
  >
  & {
    debt: null | Dnum;
    statusTag?: ReactNode;
  })
{
  const token = getCollToken(branchId);
  const collateralPriceUsd = usePrice(token?.symbol ?? null);

  const ltv = debt && collateralPriceUsd.data
    && getLtv(deposit, debt, collateralPriceUsd.data);
  const redemptionRisk = getRedemptionRisk(interestRate);

  const maxLtv = token && dn.from(1 / token.collateralRatio, 18);
  const liquidationRisk = ltv && maxLtv && getLiquidationRisk(ltv, maxLtv);

  const title = token
    ? [
      `Loan ID: ${shortenTroveId(troveId)}…`,
      `Debt: ${fmtnum(debt, "full")} USDX`,
      `Collateral: ${fmtnum(deposit, "full")} ${token.name}`,
      `Interest rate: ${fmtnum(interestRate, "pctfull")}%`,
    ]
    : [];

  return (
    <PositionCard
      className="position-card position-card-loan position-card-borrow"
      href={`/loan?id=${branchId}:${troveId}`}
      title={title.join("\n")}
      heading={
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "content",
          })}
        >
          <div>USDX loan</div>
          {statusTag}
        </div>
      }
      contextual={
        <IconWrapper>
          <IconBorrowAction size={16} />
        </IconWrapper>
      }
      main={{
        value: (
          <HFlex gap={8} alignItems="center" justifyContent="flex-start">
            {/* debt */}
            <Amount value={debt} fallback="−" size="lg" />
            <TokenIcon
              size={24}
              symbol="USDX"
            />
          </HFlex>
        ),
        // label: "Total debt",
        label: token && (
          <div
            className={css({
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontSize: 12,
              color: "positionContentAlt",
              fontWeight: 500,
            })}
          >
            Backed by {deposit ? fmtnum(deposit) : "−"} {token.name}
            <TokenIcon size="mini" symbol={token.symbol} />
          </div>
        ),
      }}
      secondary={
        <CardRows>
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                })}
              >
                <div
                  className={css({
                    fontSize: 12,
                    color: "positionContentAlt",
                    fontWeight: 500,
                  })}
                >
                  LTV
                </div>
                {ltv && (
                  <div
                    className={css({
                      "--status-positive": "token(colors.content)",
                      "--status-warning": "token(colors.warning)",
                      "--status-negative": "token(colors.negative)",
                      fontSize: 10,
                      fontWeight: 500,
                    })}
                    style={{
                      color: liquidationRisk === "low"
                        ? "var(--status-positive)"
                        : liquidationRisk === "medium"
                        ? "var(--status-warning)"
                        : "var(--status-negative)",
                    }}
                  >
                    {fmtnum(ltv, "pct2")}%
                  </div>
                )}
              </div>
            }
            end={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "content",
                  fontSize: 10,
                  fontWeight: 500,
                })}
              >
                <div
                  className={css({
                    color: "positionContent",
                  })}
                >
                  {liquidationRisk && formatLiquidationRisk(liquidationRisk)}
                </div>
                <StatusDot
                  mode={riskLevelToStatusMode(liquidationRisk)}
                  size={12}
                />
              </div>
            }
          />
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                })}
              >
                <div
                  className={css({
                    fontSize: 12,
                    color: "positionContentAlt",
                    fontWeight: 500,
                  })}
                >
                  {batchManager ? "Int. rate" : "Interest rate"}
                </div>
                <div
                  className={css({
                    color: "positionContent",
                    fontSize: 10,
                    fontWeight: 500,
                  })}
                >
                  {fmtnum(interestRate, "pct2")}%
                </div>
                {batchManager && (
                  <div
                    title={`Interest rate delegate: ${batchManager}`}
                    className={css({
                      display: "grid",
                      placeItems: "center",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 500,
                      color: "content",
                      background: "brandCyan",
                      borderRadius: "50%",
                    })}
                  >
                    D
                  </div>
                )}
              </div>
            }
            end={
              <div
                className={css({
                  display: "flex",
                  // gridTemplateColumns: "auto auto",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 10,
                  color: "content",
                  fontWeight: 500,
                })}
              >
                <div
                  className={css({
                    flexShrink: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "positionContent",
                  })}
                >
                  {redemptionRisk === "low" ? "Low" : redemptionRisk === "medium" ? "Medium" : "High"} redemption risk
                </div>
                <StatusDot
                  mode={riskLevelToStatusMode(redemptionRisk)}
                  size={12}
                />
              </div>
            }
          />
        </CardRows>
      }
    />
  );
}
