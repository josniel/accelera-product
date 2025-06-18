import { Amount } from "@/src/comps/Amount/Amount";
import { Field } from "@/src/comps/Field/Field";
import { FlowButton } from "@/src/comps/FlowButton/FlowButton";
import { InputTokenBadge } from "@/src/comps/InputTokenBadge/InputTokenBadge";
import content from "@/src/content";
import { DNUM_0, dnumMax } from "@/src/dnum-utils";
import { parseInputFloat } from "@/src/form-utils";
import { fmtnum } from "@/src/formatting";
import { useGovernanceStats, useGovernanceUser } from "@/src/liquity-governance";
import { useStakePosition } from "@/src/liquity-utils";
import { usePrice } from "@/src/services/Prices";
import { infoTooltipProps } from "@/src/uikit-utils";
import { useAccount, useBalance } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { HFlex, InfoTooltip, InputField, Tabs, TextButton, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import { useState } from "react";

export function PanelStaking() {
  const account = useAccount();
  const accelPrice = usePrice("ACCEL");

  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const govStats = useGovernanceStats();
  const govUser = useGovernanceUser(account.address ?? null);

  const stakePosition = useStakePosition(account.address ?? null);

  const parsedValue = parseInputFloat(value);

  const value_ = (focused || !parsedValue || dn.lte(parsedValue, 0))
    ? value
    : fmtnum(parsedValue, "full");

  const depositDifference = dn.mul(
    parsedValue ?? DNUM_0,
    mode === "withdraw" ? -1 : 1,
  );

  const updatedShare = (() => {
    const { totalACCELStaked } = govStats.data ?? {};
    const { allocatedACCEL } = govUser.data ?? {};

    if (
      allocatedACCEL === undefined
      || totalACCELStaked === undefined
    ) {
      return DNUM_0;
    }

    const updatedUserAccelAllocated = allocatedACCEL + depositDifference[0];
    const updatedTotalAccelStaked = totalACCELStaked + depositDifference[0];

    // make sure we don't divide by zero or show negative percentages
    return (updatedUserAccelAllocated <= 0n || updatedTotalAccelStaked <= 0n)
      ? DNUM_0
      : dn.div(
        [updatedUserAccelAllocated, 18],
        [updatedTotalAccelStaked, 18],
      );
  })();

  const updatedDeposit = stakePosition.data?.deposit
    ? dnumMax(
      dn.add(stakePosition.data?.deposit, depositDifference),
      DNUM_0,
    )
    : DNUM_0;

  const accelBalance = useBalance(account.address, "ACCEL");
  const isDepositFilled = parsedValue && dn.gt(parsedValue, 0);
  const hasDeposit = stakePosition.data?.deposit && dn.gt(
    stakePosition.data?.deposit,
    0,
  );

  const insufficientBalance = mode === "deposit" && isDepositFilled && (
    !accelBalance.data || dn.lt(accelBalance.data, parsedValue)
  );

  const withdrawOutOfRange = mode === "withdraw" && isDepositFilled && (
    !stakePosition.data || dn.lt(stakePosition.data.deposit, parsedValue)
  );

  const allowSubmit = Boolean(
    account.isConnected
      && isDepositFilled
      && !insufficientBalance,
  );

  const rewardsLusd = stakePosition.data?.rewards.lusd ?? DNUM_0;
  const rewardsEth = stakePosition.data?.rewards.eth ?? DNUM_0;

  return (
    <>
      <Field
        field={
          <InputField
            id="input-staking-change"
            drawer={insufficientBalance
              ? {
                mode: "error",
                message: `Insufficient balance. You have ${fmtnum(accelBalance.data ?? 0, 2)} ACCEL.`,
              }
              : withdrawOutOfRange
              ? {
                mode: "error",
                message: `You can’t withdraw more than you have staked.`,
              }
              : null}
            contextual={
              <InputTokenBadge
                background={false}
                icon={<TokenIcon symbol="ACCEL" />}
                label="ACCEL"
              />
            }
            label={{
              start: mode === "withdraw" ? "You withdraw" : "You deposit",
              end: (
                <Tabs
                  compact
                  items={[
                    { label: "Deposit", panelId: "panel-deposit", tabId: "tab-deposit" },
                    { label: "Withdraw", panelId: "panel-withdraw", tabId: "tab-withdraw" },
                  ]}
                  onSelect={(index, { origin, event }) => {
                    setMode(index === 1 ? "withdraw" : "deposit");
                    setValue("");
                    if (origin !== "keyboard") {
                      event.preventDefault();
                      (event.target as HTMLElement).focus();
                    }
                  }}
                  selected={mode === "withdraw" ? 1 : 0}
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
                <Amount
                  prefix="$"
                  value={dn.mul(
                    parsedValue ?? DNUM_0,
                    accelPrice.data ?? DNUM_0,
                  )}
                />
              ),
              end: mode === "deposit"
                ? (
                  accelBalance.data && dn.gt(accelBalance.data, 0) && (
                    <TextButton
                      className="button-max"
                      label={`Max. ${(fmtnum(accelBalance.data, 2))} ACCEL`}
                      onClick={() => {
                        if (accelBalance.data) {
                          setValue(dn.toString(accelBalance.data));
                        }
                      }}
                    />
                  )
                )
                : (
                  stakePosition.data?.deposit && dn.gt(stakePosition.data?.deposit, 0) && (
                    <TextButton
                      className="button-max"
                      label={`Max. ${fmtnum(stakePosition.data.deposit, 2)} ACCEL`}
                      onClick={() => {
                        if (stakePosition.data) {
                          setValue(dn.toString(stakePosition.data.deposit));
                        }
                      }}
                    />
                  )
                ),
            }}
          />
        }
        footer={{
          start: (
            <Field.FooterInfo
              label="New voting share"
              value={
                <HFlex>
                  <div>
                    <Amount value={updatedShare} percentage suffix="%" />
                  </div>
                  <InfoTooltip>
                    Your voting share is the amount of ACCEL have staked and that is available to vote, divided by the
                    total amount of ACCEL staked via the governance contract.
                  </InfoTooltip>
                </HFlex>
              }
            />
          ),
        }}
      />
      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
          width: "100%",
          paddingTop: 16,
        })}
      >
        {hasDeposit && (
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
                {content.stakeScreen.depositPanel.rewardsLabel}
              </label>
              <InfoTooltip
                {...infoTooltipProps(
                  content.stakeScreen.infoTooltips.alsoClaimRewardsDeposit,
                )}
              />
            </div>
            <div
              className={css({
                display: "flex",
                gap: 24,
              })}
            >
              <div>
                <Amount value={rewardsLusd} />{" "}
                <span
                  className={css({
                    color: "contentAlt",
                  })}
                >
                  LUSD
                </span>
              </div>
              <div>
                <Amount value={rewardsEth} />{" "}
                <span
                  className={css({
                    color: "contentAlt",
                  })}
                >
                  ETH
                </span>
              </div>
            </div>
          </HFlex>
        )}

        <FlowButton
          disabled={!allowSubmit}
          request={account.address && {
            flowId: mode === "deposit" ? "stakeDeposit" : "unstakeDeposit",
            backLink: ["/stake", "Back to stake position"],
            successLink: ["/stake/voting", "Go to Voting"],
            successMessage: "The stake position has been updated successfully.",
            accelAmount: dn.abs(depositDifference),
            stakePosition: {
              type: "stake",
              owner: account.address,
              deposit: updatedDeposit,
              totalStaked: dn.add(
                stakePosition.data?.totalStaked ?? DNUM_0,
                depositDifference,
              ),
              rewards: {
                eth: rewardsEth,
                lusd: rewardsLusd,
              },
            },
            prevStakePosition: stakePosition.data
                && dn.gt(stakePosition.data.deposit, 0)
              ? stakePosition.data
              : null,
          }}
        />
      </div>
    </>
  );
}
