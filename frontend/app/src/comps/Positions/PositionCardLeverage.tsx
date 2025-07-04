import type { PositionLoanCommitted } from "@/src/types";
import type { Dnum } from "dnum";
import type { ReactNode } from "react";

import { formatRedemptionRisk } from "@/src/formatting";
import { fmtnum } from "@/src/formatting";
import { getLiquidationRisk, getLtv, getRedemptionRisk } from "@/src/liquity-math";
import { getCollToken } from "@/src/liquity-utils";
import { usePrice } from "@/src/services/Prices";
import { riskLevelToStatusMode } from "@/src/uikit-utils";
import { css } from "@/styled-system/css";
import { HFlex, IconLeverageAction, StatusDot, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import { IconWrapper } from "../IconWrapper/IconWrapper";
import { PositionCard } from "./PositionCard";
import { CardRow, CardRows } from "./shared";

export function PositionCardLeverage({
  debt,
  branchId,
  deposit,
  interestRate,
  statusTag,
  troveId,
}:
  & Pick<
    PositionLoanCommitted,
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
  if (!token) {
    throw new Error(`Collateral token not found for index ${branchId}`);
  }

  const collateralPriceUsd = usePrice(token.symbol);

  const maxLtv = dn.from(1 / token.collateralRatio, 18);
  const ltv = debt && collateralPriceUsd.data
    && getLtv(deposit, debt, collateralPriceUsd.data);
  const liquidationRisk = ltv && getLiquidationRisk(ltv, maxLtv);
  const redemptionRisk = getRedemptionRisk(interestRate);

  return (
    <PositionCard
      className="position-card  position-card-loan position-card-leverage"
      href={`/loan?id=${branchId}:${troveId}`}
      heading={[
        <div
          key="start"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "content",
          })}
        >
          <div>Multiply position</div>
          {statusTag}
        </div>,
      ]}
      contextual={
        <IconWrapper>
          <IconLeverageAction size={16} />
        </IconWrapper>
      }
      main={{
        value: (
          <HFlex gap={8} alignItems="center" justifyContent="flex-start">
            {deposit ? fmtnum(deposit, 2) : "−"}
            <TokenIcon size={24} symbol={token.symbol} />
          </HFlex>
        ),
        label: "Net value",
      }}
      secondary={
        <CardRows>
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
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
                  fontSize: 14,
                })}
              >
                {liquidationRisk && (
                  <div
                    className={css({
                      color: "content",
                      fontSize: 10,
                      fontWeight: 500,
                    })}
                  >
                    {liquidationRisk === "low" ? "Low" : liquidationRisk === "medium" ? "Medium" : "High"}{" "}
                    liquidation risk
                  </div>
                )}
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
                  Interest rate
                </div>
                <div
                  className={css({
                    color: "content",
                    fontSize: 10,
                    fontWeight: 500,
                  })}
                >
                  {fmtnum(interestRate, "pct2")}%
                </div>
              </div>
            }
            end={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                })}
              >
                <div
                  className={css({
                    color: "content",
                    fontSize: 10,
                    fontWeight: 500,
                  })}
                >
                  {formatRedemptionRisk(redemptionRisk)}
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
