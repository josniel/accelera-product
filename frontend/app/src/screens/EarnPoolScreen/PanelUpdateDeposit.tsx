import type { BranchId, PositionEarn } from "@/src/types";
import type { Dnum } from "dnum";

import { Amount } from "@/src/comps/Amount/Amount";
import { Field } from "@/src/comps/Field/Field";
import { FlowButton } from "@/src/comps/FlowButton/FlowButton";
import { InputTokenBadge } from "@/src/comps/InputTokenBadge/InputTokenBadge";
import content from "@/src/content";
import { DNUM_0, dnumMax } from "@/src/dnum-utils";
import { parseInputFloat } from "@/src/form-utils";
import { fmtnum } from "@/src/formatting";
import { getCollToken, isEarnPositionActive, useEarnPool } from "@/src/liquity-utils";
import { infoTooltipProps } from "@/src/uikit-utils";
import { useAccount, useBalance } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { Checkbox, HFlex, InfoTooltip, InputField, Tabs, TextButton, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import { useState } from "react";

type ValueUpdateMode = "add" | "remove";

export function PanelUpdateDeposit({
  deposited,
  branchId,
  position,
}: {
  deposited: Dnum;
  branchId: BranchId;
  position?: PositionEarn;
}) {
  const account = useAccount();

  const [mode, setMode] = useState<ValueUpdateMode>("add");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [claimRewards, setClaimRewards] = useState(true);

  const hasDeposit = dn.gt(position?.deposit ?? DNUM_0, 0);
  const isActive = isEarnPositionActive(position ?? null);

  const parsedValue = parseInputFloat(value);
  const depositDifference = dn.mul(parsedValue ?? DNUM_0, mode === "remove" ? -1 : 1);
  const value_ = (focused || !parsedValue || dn.lte(parsedValue, 0)) ? value : `${fmtnum(parsedValue, "full")}`;
  const updatedDeposit = dnumMax(
    dn.add(position?.deposit ?? DNUM_0, depositDifference),
    DNUM_0,
  );

  const earnPool = useEarnPool(branchId);
  const poolDeposit = earnPool.data?.totalDeposited;
  const updatedPoolDeposit = poolDeposit && dn.add(poolDeposit, depositDifference);

  const usdxBalance = useBalance(account.address, "USDX");

  const updatedUsdxQty = dn.add(deposited, depositDifference);

  const updatedPoolShare = depositDifference && dn.gt(updatedUsdxQty, 0)
    ? dn.div(updatedDeposit, updatedUsdxQty)
    : DNUM_0;

  const collateral = getCollToken(branchId);

  const insufficientBalance = mode === "add"
    && parsedValue
    && usdxBalance.data
    && dn.lt(usdxBalance.data, parsedValue);

  const withdrawAboveDeposit = mode === "remove"
    && parsedValue
    && dn.gt(parsedValue, position?.deposit ?? DNUM_0);

  const allowSubmit = account.isConnected
    && parsedValue
    && dn.gt(parsedValue, 0)
    && !insufficientBalance
    && !withdrawAboveDeposit;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        gap: 48,
      }}
    >
      <Field
        field={
          <InputField
            drawer={insufficientBalance
              ? {
                mode: "error",
                message: `Insufficient balance. You have ${fmtnum(usdxBalance.data ?? 0)} USDX.`,
              }
              : withdrawAboveDeposit
              ? {
                mode: "error",
                message: hasDeposit
                  ? `You can’t withdraw more than you have deposited.`
                  : `No USDX deposited.`,
              }
              : null}
            contextual={
              <InputTokenBadge
                background={false}
                icon={<TokenIcon symbol="USDX" />}
                label="USDX"
              />
            }
            id="input-deposit-change"
            label={{
              start: mode === "remove"
                ? content.earnScreen.withdrawPanel.label
                : content.earnScreen.depositPanel.label,
              end: (
                <Tabs
                  compact
                  items={[
                    { label: "Deposit", panelId: "panel-deposit", tabId: "tab-deposit" },
                    { label: "Withdraw", panelId: "panel-withdraw", tabId: "tab-withdraw" },
                  ]}
                  onSelect={(index, { origin, event }) => {
                    setMode(index === 1 ? "remove" : "add");
                    setValue("");
                    if (origin !== "keyboard") {
                      event.preventDefault();
                      (event.target as HTMLElement).focus();
                    }
                  }}
                  selected={mode === "remove" ? 1 : 0}
                />
              ),
            }}
            labelHeight={32}
            onFocus={() => setFocused(true)}
            onChange={setValue}
            onBlur={() => setFocused(false)}
            value={value_}
            placeholder="0.00"
            secondary={{
              start: (
                <HFlex gap={4}>
                  <div>{content.earnScreen.depositPanel.shareLabel}</div>
                  <div>
                    <Amount
                      format={2}
                      percentage
                      value={updatedPoolShare}
                    />
                  </div>
                  <InfoTooltip {...infoTooltipProps(content.earnScreen.infoTooltips.depositPoolShare)} />
                </HFlex>
              ),
              end: mode === "add"
                ? usdxBalance.data && (
                  <TextButton
                    label={dn.gt(usdxBalance.data, 0) ? `Max ${fmtnum(usdxBalance.data, 2)} USDX` : null}
                    onClick={() => {
                      if (usdxBalance.data) {
                        setValue(dn.toString(usdxBalance.data));
                      }
                    }}
                  />
                )
                : position?.deposit && dn.gt(position.deposit, 0) && (
                  <TextButton
                    label={`Max ${fmtnum(position.deposit, 2)} USDX`}
                    onClick={() => {
                      setValue(dn.toString(position.deposit));
                      setClaimRewards(true);
                    }}
                  />
                ),
            }}
          />
        }
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          width: "100%",
        }}
      >
        {isActive && (
          <HFlex justifyContent="space-between">
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: 8,
              })}
            >
              <label
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  userSelect: "none",
                })}
              >
                <Checkbox
                  id="checkbox-claim-rewards"
                  checked={claimRewards}
                  onChange={setClaimRewards}
                />
                {content.earnScreen.depositPanel.claimCheckbox}
              </label>
              <InfoTooltip
                {...infoTooltipProps(
                  mode === "remove"
                    ? content.earnScreen.infoTooltips.alsoClaimRewardsWithdraw
                    : content.earnScreen.infoTooltips.alsoClaimRewardsDeposit,
                )}
              />
            </div>
            {position && (
              <div
                className={css({
                  display: "flex",
                  gap: 24,
                })}
              >
                <div>
                  <Amount value={position.rewards.usdx} />{" "}
                  <span
                    className={css({
                      color: "contentAlt",
                    })}
                  >
                    USDX
                  </span>
                </div>
                {collateral && (
                  <div>
                    <Amount value={position.rewards.coll} />{" "}
                    <span
                      className={css({
                        color: "contentAlt",
                      })}
                    >
                      {collateral.name}
                    </span>
                  </div>
                )}
              </div>
            )}
          </HFlex>
        )}

        <FlowButton
          disabled={!allowSubmit}
          request={() => {
            if (
              !account.address
              || !collateral
              || (mode === "remove" && !position)
              || !poolDeposit
              || !updatedPoolDeposit
            ) {
              return null;
            }

            const prevEarnPosition = position ?? {
              type: "earn" as const,
              owner: account.address,
              branchId,
              deposit: DNUM_0,
              rewards: { usdx: DNUM_0, coll: DNUM_0 },
            };

            return {
              flowId: "earnUpdate",
              backLink: [
                `/earn/${collateral.name.toLowerCase()}`,
                "Back to editing",
              ],
              successLink: ["/", "Go to the Dashboard"],
              successMessage: mode === "remove"
                ? "The withdrawal has been processed successfully."
                : "The deposit has been processed successfully.",

              branchId,
              poolDeposit: updatedPoolDeposit,
              prevPoolDeposit: poolDeposit,
              prevEarnPosition,
              earnPosition: {
                ...prevEarnPosition,
                deposit: updatedDeposit,
              },
              claimRewards,
            };
          }}
        />
      </div>
    </div>
  );
}
