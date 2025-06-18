import type { PositionEarn } from "@/src/types";

import { Amount } from "@/src/comps/Amount/Amount";
import { getCollToken, useEarnPool, useEarnPosition } from "@/src/liquity-utils";
import { css } from "@/styled-system/css";
import { HFlex, IconEarnAction, TokenIcon } from "@liquity2/uikit";
import { IconWrapper } from "../IconWrapper/IconWrapper";
import { PositionCard } from "./PositionCard";
import { CardRow, CardRows } from "./shared";

export function PositionCardEarn({
  owner,
  branchId,
}: Pick<
  PositionEarn,
  | "owner"
  | "branchId"
>) {
  const token = getCollToken(branchId);
  const earnPool = useEarnPool(branchId);
  const earnPosition = useEarnPosition(branchId, owner ?? null);
  return (
    <PositionCard
      className="position-card position-card-earn"
      href={token ? `/earn/${token.symbol.toLowerCase()}` : ""}
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
          Earn position
        </div>,
      ]}
      contextual={
        <IconWrapper>
          <IconEarnAction size={16} />
        </IconWrapper>
      }
      main={{
        value: (
          <HFlex gap={8} alignItems="center" justifyContent="flex-start">
            <Amount
              value={earnPosition.data?.deposit}
              fallback="−"
              format={2}
              size="lg"
            />
            <TokenIcon size={24} symbol="USDX" />
          </HFlex>
        ),
        label: token && (
          <HFlex
            gap={4}
            justifyContent="flex-start"
            className={css({
              fontSize: 12,
              color: "dimmed",
              fontWeight: 500,
            })}
          >
            In the {token.name} stability pool
          </HFlex>
        ),
      }}
      secondary={
        <CardRows>
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                })}
              >
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  })}
                >
                  <div
                    className={css({
                      color: "positionContentAlt",
                      fontSize: 12,
                      fontWeight: 500,
                    })}
                  >
                    APR
                  </div>
                  <div
                    className={css({
                      color: "content",
                      fontSize: 10,
                      fontWeight: 500,
                    })}
                  >
                    <Amount
                      fallback="−"
                      percentage
                      value={earnPool.data?.apr}
                    />
                  </div>
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  })}
                >
                  <div
                    className={css({
                      color: "positionContentAlt",
                      fontSize: 12,
                      fontWeight: 500,
                    })}
                  >
                    7d APR
                  </div>
                  <div
                    className={css({
                      color: "content",
                      fontSize: 10,
                      fontWeight: 500,
                    })}
                  >
                    <Amount
                      fallback="−"
                      percentage
                      value={earnPool.data?.apr7d}
                    />
                  </div>
                </div>
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
                    color: "positionContentAlt",
                    fontSize: 12,
                    fontWeight: 500,
                  })}
                >
                  Rewards
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "content",
                    fontSize: 10,
                    fontWeight: 500,
                  })}
                >
                  <Amount
                    fallback="−"
                    value={earnPosition.data?.rewards.usdx}
                    format={2}
                  />
                  <TokenIcon size="mini" symbol="USDX" />
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "content",
                    fontSize: 10,
                    fontWeight: 500,
                  })}
                >
                  <Amount
                    fallback="−"
                    value={earnPosition.data?.rewards.coll}
                    format={2}
                  />
                  {token && <TokenIcon size="mini" symbol={token.symbol} />}
                </div>
              </div>
            }
          />
        </CardRows>
      }
    />
  );
}
