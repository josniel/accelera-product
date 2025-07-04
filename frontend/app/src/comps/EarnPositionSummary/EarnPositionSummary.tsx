import type { BranchId, Dnum, PositionEarn } from "@/src/types";
import type { ReactNode } from "react";

import { Amount } from "@/src/comps/Amount/Amount";
import { TagPreview } from "@/src/comps/TagPreview/TagPreview";
import { fmtnum } from "@/src/formatting";
import { getCollToken, isEarnPositionActive, useEarnPool } from "@/src/liquity-utils";
import { css } from "@/styled-system/css";
import { HFlex, IconArrowRight, IconPlus, InfoTooltip, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import Link from "next/link";
export function EarnPositionSummary({
  branchId,
  earnPosition,
  linkToScreen,
  poolDeposit,
  prevEarnPosition = null,
  prevPoolDeposit,
  title,
  txPreviewMode,
}:
  & {
    branchId: BranchId;
    earnPosition: PositionEarn | null;
    linkToScreen?: boolean;
    prevEarnPosition?: PositionEarn | null;
    title?: ReactNode;
    txPreviewMode?: boolean;
  }
  & (
    | { poolDeposit: Dnum; prevPoolDeposit: Dnum }
    | { poolDeposit?: undefined; prevPoolDeposit?: undefined }
  ))
{
  const collToken = getCollToken(branchId);
  const earnPool = useEarnPool(branchId);

  // The earnUpdate tx flow provides static values
  // for poolDeposit and prevPoolDeposit. If these are
  // not provided, we use the values from the earnPool data.
  if (!poolDeposit) {
    poolDeposit = earnPool.data?.totalDeposited ?? undefined;
  }

  let share = dn.from(0, 18);
  if (earnPosition && poolDeposit && dn.gt(poolDeposit, 0)) {
    share = dn.div(earnPosition.deposit, poolDeposit);
  }

  let prevShare = dn.from(0, 18);
  if (prevEarnPosition && prevPoolDeposit && dn.gt(prevPoolDeposit, 0)) {
    prevShare = dn.div(prevEarnPosition.deposit, prevPoolDeposit);
  }

  const active = txPreviewMode || isEarnPositionActive(earnPosition);

  return (
    <div
      className={css({
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "12px 16px",
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: "solid",
        width: "100%",
        userSelect: "none",

        "--fg-primary-active": "token(colors.positionContent)",
        "--fg-primary-inactive": "token(colors.content)",

        "--fg-secondary-active": "token(colors.positionContentAlt)",
        "--fg-secondary-inactive": "token(colors.contentAlt)",

        "--border-active": "color-mix(in srgb, token(colors.secondary) 15%, transparent)",
        "--border-inactive": "token(colors.infoSurfaceBorder)",

        "--bg-active": "token(colors.position)",
        "--bg-inactive": "token(colors.infoSurface)",
      })}
      style={{
        color: `var(--fg-primary-${active ? "active" : "inactive"})`,
        background: `var(--bg-${active ? "active" : "inactive"})`,
        borderColor: active ? "transparent" : "var(--border-inactive)",
      }}
    >
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: 16,
          paddingBottom: 12,
        })}
        style={{
          borderBottom: `1px solid var(--border-${active ? "active" : "inactive"})`,
        }}
      >
        <div
          className={css({
            flexGrow: 0,
            flexShrink: 0,
            display: "flex",
          })}
        >
          <TokenIcon
            symbol={collToken.symbol}
            size={34}
          />
        </div>
        <div
          className={css({
            flexGrow: 1,
            display: "flex",
            justifyContent: "space-between",
          })}
        >
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
            })}
          >
            <div>
              {title ?? `${collToken.name} Stability Pool`}
            </div>
            <div
              className={css({
                display: "flex",
                gap: 4,
                fontSize: 14,
              })}
              style={{
                color: `var(--fg-secondary-${active ? "active" : "inactive"})`,
              }}
            >
              <div>TVL</div>
              <div>
                <Amount
                  fallback="-"
                  format="compact"
                  prefix="$"
                  value={poolDeposit}
                />
              </div>
              <InfoTooltip heading="Total Value Locked (TVL)">
                Total amount of USDX deposited in this stability pool.
              </InfoTooltip>
            </div>
          </div>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            })}
          >
            {txPreviewMode ? <TagPreview /> : (
              <>
                <div
                  className={css({
                    display: "flex",
                    gap: 6,
                  })}
                >
                  <div
                    className={css({
                      color: "contentAlt2",
                    })}
                  >
                    APR
                  </div>
                  <div>
                    <Amount
                      fallback="-%"
                      format="1z"
                      percentage
                      value={earnPool.data?.apr}
                    />
                  </div>
                  <InfoTooltip
                    content={{
                      heading: "Current APR",
                      body: "The annualized rate this stability pool’s "
                        + "deposits earned over the last 24 hours.",
                      footerLink: {
                        label: "Check Dune for more details",
                        href: "https://dune.com/liquity/liquity-v2",
                      },
                    }}
                  />
                </div>
                <div
                  className={css({
                    display: "flex",
                    gap: 4,
                    fontSize: 14,
                  })}
                >
                  <div
                    className={css({
                      whiteSpace: "nowrap",
                      color: "contentAlt2",
                    })}
                  >
                    7d APR
                  </div>
                  <Amount
                    fallback="-%"
                    format="1z"
                    percentage
                    value={earnPool.data?.apr7d}
                  />
                  <InfoTooltip
                    content={{
                      heading: "APR (last 7 days)",
                      body: "The annualized percentage rate this stability pool’s "
                        + "deposits earned over the past 7 days.",
                      footerLink: {
                        label: "Check Dune for more details",
                        href: "https://dune.com/liquity/liquity-v2",
                      },
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        className={css({
          position: "relative",
          display: "flex",
          gap: 32,
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          height: {
            base: "auto",
            lg: 56,
          },
          fontSize: 14,
        })}
      >
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: 8,
            lg: {
              flexDirection: "row",
              gap: 32,
            },
          })}
        >
          <div>
            <div
              style={{
                color: `var(--fg-secondary-${active ? "active" : "inactive"})`,
              }}
            >
              Deposit
            </div>
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: 8,
              })}
            >
              <div
                title={active
                  ? `${fmtnum(earnPosition?.deposit, "full")} USDX`
                  : undefined}
                className={css({
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 4,
                  height: 24,
                })}
              >
                {active && fmtnum(earnPosition?.deposit)}
                <TokenIcon symbol="USDX" size="mini" title={null} />
              </div>
              {prevEarnPosition && (
                <div
                  title={`${fmtnum(prevEarnPosition.deposit, "full")} USDX`}
                  className={css({
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 4,
                    height: 24,
                    color: "contentAlt",
                    textDecoration: "line-through",
                  })}
                >
                  {fmtnum(prevEarnPosition.deposit)}
                  <TokenIcon symbol="USDX" size="mini" title={null} />
                </div>
              )}
            </div>
          </div>
          {!txPreviewMode && (
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              })}
            >
              <div
                style={{
                  color: `var(--fg-secondary-${active ? "active" : "inactive"})`,
                }}
              >
                Rewards
              </div>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 8,
                  height: 24,
                })}
              >
                {active
                  ? (
                    <>
                      <HFlex
                        gap={4}
                        title={`${fmtnum(earnPosition?.rewards.usdx, "full")} USDX`}
                        className={css({
                          fontVariantNumeric: "tabular-nums",
                        })}
                      >
                        {fmtnum(earnPosition?.rewards.usdx)}
                        <TokenIcon symbol="USDX" size="mini" title={null} />
                      </HFlex>
                      <HFlex gap={4}>
                        <Amount value={earnPosition?.rewards.coll} />
                        <TokenIcon symbol={collToken.symbol} size="mini" />
                      </HFlex>
                    </>
                  )
                  : (
                    <TokenIcon.Group size="mini">
                      <TokenIcon symbol="USDX" />
                      <TokenIcon symbol={collToken.symbol} />
                    </TokenIcon.Group>
                  )}
              </div>
            </div>
          )}
          {active && (
            <div>
              <div
                className={css({
                  whiteSpace: "nowrap",
                })}
                style={{
                  color: `var(--fg-secondary-${active ? "active" : "inactive"})`,
                }}
              >
                Pool share
              </div>
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 24,
                })}
              >
                <Amount percentage value={share} />
                {prevEarnPosition && (
                  <div
                    className={css({
                      display: "inline",
                      color: "contentAlt",
                      textDecoration: "line-through",
                    })}
                  >
                    <Amount percentage value={prevShare} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {linkToScreen && (
          <OpenLink
            active={active}
            path={`/earn/${collToken.symbol.toLowerCase()}`}
            title={`${active ? "Manage" : "Deposit to"} ${collToken.name} pool`}
          />
        )}
      </div>
    </div>
  );
}

function OpenLink({
  active,
  path,
  title,
}: {
  active: boolean;
  path: string;
  title: string;
}) {
  return (
    <Link
      title={title}
      href={path}
      className={css({
        position: "absolute",
        inset: "0 -16px -12px auto",
        display: "grid",
        placeItems: {
          base: "end center",
          lg: "center",
        },
        padding: {
          base: "16px 12px",
          lg: "0 12px 0 24px",
        },
        borderRadius: 8,
        _focusVisible: {
          outline: "2px solid token(colors.focused)",
          outlineOffset: -2,
        },
        _active: {
          translate: "0 1px",
        },

        "& > div": {
          transformOrigin: "50% 50%",
          transition: "scale 80ms",
        },
        _hover: {
          "& > div": {
            scale: 1.05,
          },
        },
      })}
    >
      <div
        className={css({
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          color: "accentContent",
          background: "accent",
          borderRadius: "50%",
        })}
      >
        {active
          ? <IconArrowRight size={24} />
          : <IconPlus size={24} />}
      </div>
    </Link>
  );
}
