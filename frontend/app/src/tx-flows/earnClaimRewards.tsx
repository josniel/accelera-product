import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Amount } from "@/src/comps/Amount/Amount";
import { EarnPositionSummary } from "@/src/comps/EarnPositionSummary/EarnPositionSummary";
import { getBranch, getCollToken } from "@/src/liquity-utils";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { vPositionEarn } from "@/src/valibot-utils";
import * as dn from "dnum";
import * as v from "valibot";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "earnClaimRewards",
  {
    earnPosition: vPositionEarn(),
  },
);

export type EarnClaimRewardsRequest = v.InferOutput<typeof RequestSchema>;

export const earnClaimRewards: FlowDeclaration<EarnClaimRewardsRequest> = {
  title: "Review & Send Transaction",

  Summary({ request }) {
    return (
      <EarnPositionSummary
        branchId={request.earnPosition.branchId}
        earnPosition={request.earnPosition}
        txPreviewMode
      />
    );
  },

  Details({ request }) {
    const collateral = getCollToken(request.earnPosition.branchId);

    const usdxPrice = usePrice("USDX");
    const collPrice = usePrice(collateral.symbol);

    const rewardsUsdx = request.earnPosition.rewards.usdx;
    const rewardsColl = request.earnPosition.rewards.coll;
    const rewardsUsdxUsd = usdxPrice.data && dn.mul(rewardsUsdx, usdxPrice.data);
    const rewardsCollUsd = collPrice.data && dn.mul(rewardsColl, collPrice.data);

    return (
      <>
        <TransactionDetailsRow
          label="Claim USDX rewards"
          value={[
            <Amount
              key="start"
              value={rewardsUsdx}
              suffix=" USDX"
            />,
            <Amount
              key="end"
              value={rewardsUsdxUsd}
              prefix="$"
            />,
          ]}
        />
        <TransactionDetailsRow
          label={`Claim ${collateral.name} rewards`}
          value={[
            <Amount
              key="start"
              value={rewardsColl}
              suffix={` ${collateral.symbol}`}
            />,
            <Amount
              key="end"
              value={rewardsCollUsd}
              prefix="$"
            />,
          ]}
        />
      </>
    );
  },

  steps: {
    claimRewards: {
      name: () => "Claim rewards",
      Status: TransactionStatus,

      async commit(ctx) {
        const { branchId } = ctx.request.earnPosition;
        const branch = getBranch(branchId);
        return ctx.writeContract({
          ...branch.contracts.StabilityPool,
          functionName: "withdrawFromSP",
          args: [0n, true],
        });
      },

      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },
  },

  async getSteps() {
    return ["claimRewards"];
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
