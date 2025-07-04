import type { BranchId, PositionEarn, TokenSymbol } from "@/src/types";
import type { Dnum } from "dnum";
import { ReactNode } from "react";

import { Amount } from "@/src/comps/Amount/Amount";
import { FlowButton } from "@/src/comps/FlowButton/FlowButton";
import content from "@/src/content";
import { DNUM_0 } from "@/src/dnum-utils";
import { getCollToken } from "@/src/liquity-utils";
import { usePrice } from "@/src/services/Prices";
import { useAccount } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { HFlex, TokenIcon, VFlex } from "@liquity2/uikit";
import * as dn from "dnum";

export function PanelClaimRewards({
  branchId,
  position,
}: {
  branchId: null | BranchId;
  position?: PositionEarn;
}) {
  const account = useAccount();

  const collateral = getCollToken(branchId);
  if (!collateral) {
    throw new Error(`Invalid branch: ${branchId}`);
  }

  const usdxPriceUsd = usePrice("USDX");
  const collPriceUsd = usePrice(collateral.symbol);

  const totalRewards = collPriceUsd.data && usdxPriceUsd.data && dn.add(
    dn.mul(position?.rewards?.usdx ?? DNUM_0, usdxPriceUsd.data),
    dn.mul(position?.rewards?.coll ?? DNUM_0, collPriceUsd.data),
  );

  const gasFeeUsd = collPriceUsd.data && dn.multiply(dn.from(0.0015, 18), collPriceUsd.data);

  const allowSubmit = account.isConnected && totalRewards && dn.gt(totalRewards, 0);

  return (
    <VFlex gap={48}>
      <VFlex gap={0}>
        <Rewards
          amount={position?.rewards?.usdx ?? DNUM_0}
          label={content.earnScreen.rewardsPanel.usdxRewardsLabel}
          symbol="USDX"
        />
        <Rewards
          amount={position?.rewards?.coll ?? DNUM_0}
          label={content.earnScreen.rewardsPanel.collRewardsLabel}
          symbol={collateral.symbol}
        />

        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "24px 0",
            color: "contentAlt",
          })}
        >
          <HFlex justifyContent="space-between" gap={24}>
            <div>{content.earnScreen.rewardsPanel.totalUsdLabel}</div>
            <Amount
              prefix="$"
              value={totalRewards}
              format={2}
            />
          </HFlex>
          <HFlex justifyContent="space-between" gap={24}>
            <div>{content.earnScreen.rewardsPanel.expectedGasFeeLabel}</div>
            <Amount
              prefix="~$"
              value={gasFeeUsd}
              format={2}
            />
          </HFlex>
        </div>
      </VFlex>

      <FlowButton
        disabled={!allowSubmit}
        request={position && {
          flowId: "earnClaimRewards",
          backLink: [
            `/earn/${collateral.name.toLowerCase()}`,
            "Back to earn position",
          ],
          successLink: ["/", "Go to the Dashboard"],
          successMessage: "The rewards have been claimed successfully.",
          earnPosition: position,
        }}
      />
    </VFlex>
  );
}

function Rewards({
  amount,
  label,
  symbol,
}: {
  amount: Dnum;
  label: ReactNode;
  symbol: TokenSymbol;
}) {
  return (
    <div
      className={css({
        display: "grid",
        gap: 24,
        md: {
          gridTemplateColumns: "1.2fr 1fr",
        },
        alignItems: "start",
        padding: "24px 0",
        borderBottom: "1px solid token(colors.separator)",
      })}
    >
      <div>{label}</div>
      <div
        className={css({
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 8,
          fontSize: 20,
          md: {
            justifyContent: "flex-end",
            fontSize: 28,
          },
        })}
      >
        <Amount value={amount} />
        <TokenIcon symbol={symbol} size={24} />
      </div>
    </div>
  );
}
