import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Amount } from "@/src/comps/Amount/Amount";
import { EarnPositionSummary } from "@/src/comps/EarnPositionSummary/EarnPositionSummary";
import { DNUM_0 } from "@/src/dnum-utils";
import { getBranch, getCollToken } from "@/src/liquity-utils";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { vBranchId, vDnum, vPositionEarn } from "@/src/valibot-utils";
import * as dn from "dnum";
import * as v from "valibot";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "earnUpdate",
  {
    branchId: vBranchId(),
    claimRewards: v.boolean(),
    earnPosition: vPositionEarn(),
    poolDeposit: vDnum(),
    prevEarnPosition: vPositionEarn(),
    prevPoolDeposit: vDnum(),
  },
);

export type EarnUpdateRequest = v.InferOutput<typeof RequestSchema>;

export const earnUpdate: FlowDeclaration<EarnUpdateRequest> = {
  title: "Review & Send Transaction",

  Summary({ request }) {
    return (
      <EarnPositionSummary
        branchId={request.branchId}
        earnPosition={{
          ...request.earnPosition,

          // compound USDX rewards if not claiming
          deposit: dn.add(
            request.earnPosition.deposit,
            request.claimRewards
              ? DNUM_0
              : request.earnPosition.rewards.usdx,
          ),
          rewards: {
            // USDX rewards are claimed or compounded
            usdx: DNUM_0,
            coll: request.claimRewards
              ? DNUM_0
              : request.earnPosition.rewards.coll,
          },
        }}
        poolDeposit={request.poolDeposit}
        prevEarnPosition={dn.eq(request.prevEarnPosition.deposit, 0)
          ? null
          : request.prevEarnPosition}
        prevPoolDeposit={request.prevPoolDeposit}
        txPreviewMode
      />
    );
  },

  Details({ request }) {
    const { earnPosition, prevEarnPosition, claimRewards } = request;
    const { rewards } = earnPosition;

    const collateral = getCollToken(earnPosition.branchId);

    const usdxPrice = usePrice("USDX");
    const collPrice = usePrice(collateral.symbol);

    const depositChange = dn.sub(earnPosition.deposit, prevEarnPosition.deposit);

    const usdxAmount = dn.abs(depositChange);
    const usdAmount = usdxPrice.data && dn.mul(usdxAmount, usdxPrice.data);

    return (
      <>
        <TransactionDetailsRow
          label={dn.gt(depositChange, 0) ? "You deposit" : "You withdraw"}
          value={[
            <Amount
              key="start"
              suffix=" USDX"
              value={dn.abs(depositChange)}
            />,
            <Amount
              key="end"
              prefix="$"
              value={usdAmount}
            />,
          ]}
        />
        {dn.gt(rewards.usdx, 0) && (
          <TransactionDetailsRow
            label={claimRewards ? "Claim USDX rewards" : "Compound USDX rewards"}
            value={[
              <Amount
                key="start"
                value={rewards.usdx}
                suffix=" USDX"
              />,
              <Amount
                key="end"
                value={usdxPrice.data && dn.mul(rewards.usdx, usdxPrice.data)}
                prefix="$"
              />,
            ]}
          />
        )}
        {claimRewards && dn.gt(rewards.coll, 0) && (
          <TransactionDetailsRow
            label={`Claim ${collateral.name} rewards`}
            value={[
              <Amount
                key="start"
                value={rewards.coll}
                suffix={` ${collateral.symbol}`}
              />,
              <Amount
                key="end"
                value={collPrice.data && dn.mul(rewards.coll, collPrice.data)}
                prefix="$"
              />,
            ]}
          />
        )}
      </>
    );
  },

  steps: {
    provideToStabilityPool: {
      name: () => "Deposit",
      Status: TransactionStatus,
      async commit({ request, writeContract }) {
        const { earnPosition, prevEarnPosition, claimRewards } = request;
        const branch = getBranch(request.branchId);
        const change = earnPosition.deposit[0] - prevEarnPosition.deposit[0];
        return writeContract({
          ...branch.contracts.StabilityPool,
          functionName: "provideToSP",
          args: [change, claimRewards],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    withdrawFromStabilityPool: {
      name: () => "Withdraw",
      Status: TransactionStatus,
      async commit({ request, writeContract }) {
        const { earnPosition, prevEarnPosition, claimRewards } = request;
        const change = earnPosition.deposit[0] - prevEarnPosition.deposit[0];
        const branch = getBranch(request.branchId);
        return writeContract({
          ...branch.contracts.StabilityPool,
          functionName: "withdrawFromSP",
          args: [-change, claimRewards],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },
  },

  async getSteps({ request: { earnPosition, prevEarnPosition } }) {
    return dn.gt(earnPosition.deposit, prevEarnPosition.deposit)
      ? ["provideToStabilityPool"]
      : ["withdrawFromStabilityPool"];
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
