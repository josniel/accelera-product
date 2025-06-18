import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Governance } from "@/src/abi/Governance";
import { Amount } from "@/src/comps/Amount/Amount";
import { LEGACY_CHECK } from "@/src/env";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { vAddress, vDnum } from "@/src/valibot-utils";
import * as dn from "dnum";
import * as v from "valibot";
import { encodeFunctionData } from "viem";
import { readContracts } from "wagmi/actions";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "legacyUnstakeAll",
  {
    accelAmount: vDnum(),
  },
);

export type LegacyUnstakeAllRequest = v.InferOutput<typeof RequestSchema>;

export const legacyUnstakeAll: FlowDeclaration<LegacyUnstakeAllRequest> = {
  title: "Withdraw from Legacy Stake",
  Summary: null,

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
    resetVotesAndWithdrawAll: {
      name: () => "Unstake",
      Status: TransactionStatus,
      async commit(ctx) {
        if (!LEGACY_CHECK) {
          throw new Error("LEGACY_CHECK is not defined");
        }

        const inputs: `0x${string}`[] = [];

        const initiativesFromSnapshotResult = await fetch(LEGACY_CHECK.INITIATIVES_SNAPSHOT_URL).catch((err) => {
          console.error("Error fetching initiatives from snapshot.");
          console.error("LEGACY_CHECK.INITIATIVES_SNAPSHOT_URL:", LEGACY_CHECK?.INITIATIVES_SNAPSHOT_URL);
          throw err;
        });

        const initiativesFromSnapshot = v.parse(
          v.array(vAddress()),
          await initiativesFromSnapshotResult.json(),
        );

        const accelAllocatedByUser = await readContracts(ctx.wagmiConfig, {
          contracts: initiativesFromSnapshot.map((initiative) => {
            if (!LEGACY_CHECK) {
              throw new Error("LEGACY_CHECK is not defined");
            }
            return {
              abi: Governance,
              address: LEGACY_CHECK.GOVERNANCE,
              functionName: "accelAllocatedByUserToInitiative",
              args: [ctx.account, initiative],
            } as const;
          }),
          allowFailure: false,
        });

        const allocatedInitiatives = accelAllocatedByUser
          .map((allocation, index) => {
            const [voteACCEL, _, vetoACCEL] = allocation;
            const initiative = initiativesFromSnapshot[index];
            if (!initiative) {
              throw new Error("initiative missing");
            }
            return voteACCEL > 0n || vetoACCEL > 0n ? initiative : null;
          })
          .filter((initiative) => initiative !== null);

        // reset allocations if the user has any
        if (allocatedInitiatives.length > 0) {
          inputs.push(encodeFunctionData({
            abi: Governance,
            functionName: "resetAllocations",
            args: [allocatedInitiatives, true],
          }));
        }

        // withdraw all staked ACCEL
        inputs.push(encodeFunctionData({
          abi: Governance,
          functionName: "withdrawACCEL",
          args: [ctx.request.accelAmount[0]],
        }));

        return ctx.writeContract({
          abi: Governance,
          address: LEGACY_CHECK.GOVERNANCE,
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
    return ["resetVotesAndWithdrawAll"];
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
