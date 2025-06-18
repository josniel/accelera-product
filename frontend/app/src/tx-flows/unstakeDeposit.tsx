import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Amount } from "@/src/comps/Amount/Amount";
import { StakePositionSummary } from "@/src/comps/StakePositionSummary/StakePositionSummary";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { getIndexedUserAllocated } from "@/src/subgraph";
import { vDnum, vPositionStake } from "@/src/valibot-utils";
import * as dn from "dnum";
import * as v from "valibot";
import { encodeFunctionData } from "viem";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "unstakeDeposit",
  {
    accelAmount: vDnum(),
    stakePosition: vPositionStake(),
    prevStakePosition: v.union([v.null(), vPositionStake()]),
  },
);

export type UnstakeDepositRequest = v.InferOutput<typeof RequestSchema>;

export const unstakeDeposit: FlowDeclaration<UnstakeDepositRequest> = {
  title: "Review & Send Transaction",

  Summary({ request }) {
    return (
      <StakePositionSummary
        prevStakePosition={request.prevStakePosition}
        stakePosition={request.stakePosition}
        txPreviewMode
      />
    );
  },

  Details({ request }) {
    const accelPrice = usePrice("ACCEL");
    return (
      <TransactionDetailsRow
        label="You withdraw"
        value={[
          <Amount
            key="start"
            suffix=" ACCEL"
            value={request.accelAmount}
          />,
          <Amount
            key="end"
            prefix="$"
            value={accelPrice.data && dn.mul(request.accelAmount, accelPrice.data)}
          />,
        ]}
      />
    );
  },

  steps: {
    resetVotesAndWithdraw: {
      name: () => "Unstake",
      Status: TransactionStatus,
      async commit(ctx) {
        const { Governance } = ctx.contracts;

        const inputs: `0x${string}`[] = [];

        const allocatedInitiatives = await getIndexedUserAllocated(ctx.account);

        // reset allocations if the user has any
        if (allocatedInitiatives.length > 0) {
          inputs.push(encodeFunctionData({
            abi: Governance.abi,
            functionName: "resetAllocations",
            args: [allocatedInitiatives, true],
          }));
        }

        // withdraw ACCEL
        inputs.push(encodeFunctionData({
          abi: Governance.abi,
          functionName: "withdrawACCEL",
          args: [ctx.request.accelAmount[0]],
        }));

        return ctx.writeContract({
          ...ctx.contracts.Governance,
          functionName: "multiDelegateCall",
          args: [inputs],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },
  },

  async getSteps() {
    return ["resetVotesAndWithdraw"];
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
