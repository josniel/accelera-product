import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Amount } from "@/src/comps/Amount/Amount";
import { StakePositionSummary } from "@/src/comps/StakePositionSummary/StakePositionSummary";
import { dnum18 } from "@/src/dnum-utils";
import { signPermit } from "@/src/permit";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { getIndexedUserAllocated } from "@/src/subgraph";
import { vDnum, vPositionStake } from "@/src/valibot-utils";
import { useAccount } from "@/src/wagmi-utils";
import * as dn from "dnum";
import * as v from "valibot";
import { encodeFunctionData, maxUint256 } from "viem";
import { getBytecode } from "wagmi/actions";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "stakeDeposit",
  {
    accelAmount: vDnum(),
    stakePosition: vPositionStake(),
    prevStakePosition: v.union([v.null(), vPositionStake()]),
  },
);

export type StakeDepositRequest = v.InferOutput<typeof RequestSchema>;

export const stakeDeposit: FlowDeclaration<StakeDepositRequest> = {
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
        label="You deposit"
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
    deployUserProxy: {
      name: () => "Initialize Staking",
      Status: TransactionStatus,
      async commit(ctx) {
        return ctx.writeContract({
          ...ctx.contracts.Governance,
          functionName: "deployUserProxy",
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    approve: {
      name: () => "Approve ACCEL",
      Status: (props) => {
        const account = useAccount();
        return (
          <TransactionStatus
            {...props}
            // don’t use permit for safe transactions
            approval={account.safeStatus === null ? "all" : "approve-only"}
          />
        );
      },
      async commit(ctx) {
        const userProxyAddress = await ctx.readContract({
          ...ctx.contracts.Governance,
          functionName: "deriveUserProxyAddress",
          args: [ctx.account],
        });

        // permit
        if (ctx.preferredApproveMethod === "permit" && !ctx.isSafe) {
          const { deadline, ...permit } = await signPermit({
            token: ctx.contracts.AccelToken.address,
            spender: userProxyAddress,
            value: ctx.request.accelAmount[0],
            account: ctx.account,
            wagmiConfig: ctx.wagmiConfig,
          });

          return "permit:" + JSON.stringify({
            ...permit,
            deadline: Number(deadline),
            userProxyAddress,
          });
        }

        // approve()
        return ctx.writeContract({
          ...ctx.contracts.AccelToken,
          functionName: "approve",
          args: [
            userProxyAddress,
            ctx.preferredApproveMethod === "approve-infinite"
              ? maxUint256 // infinite approval
              : ctx.request.accelAmount[0], // exact amount
          ],
        });
      },
      async verify(ctx, hash) {
        if (!hash.startsWith("permit:")) {
          await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
        }
      },
    },

    // reset allocations + deposit ACCEL in a single transaction
    resetVotesAndDeposit: {
      name: () => "Stake",
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

        const approveStep = ctx.steps?.find((step) => step.id === "approve");
        const isPermit = approveStep?.artifact?.startsWith("permit:") === true;

        // deposit ACCEL via permit
        if (isPermit) {
          const { userProxyAddress, ...permit } = JSON.parse(
            approveStep?.artifact?.replace(/^permit:/, "") ?? "{}",
          );
          inputs.push(encodeFunctionData({
            abi: Governance.abi,
            functionName: "depositACCELViaPermit",
            args: [ctx.request.accelAmount[0], {
              owner: ctx.account,
              spender: userProxyAddress,
              value: ctx.request.accelAmount[0],
              deadline: permit.deadline,
              v: permit.v,
              r: permit.r,
              s: permit.s,
            }],
          }));
        } else {
          const userProxyAddress = await ctx.readContract({
            ...ctx.contracts.Governance,
            functionName: "deriveUserProxyAddress",
            args: [ctx.account],
          });

          const accelAllowance = await ctx.readContract({
            ...ctx.contracts.AccelToken,
            functionName: "allowance",
            args: [ctx.account, userProxyAddress],
          });

          if (dn.gt(ctx.request.accelAmount, dnum18(accelAllowance))) {
            throw new Error("ACCEL allowance is not enough");
          }

          // deposit approved ACCEL
          inputs.push(encodeFunctionData({
            abi: Governance.abi,
            functionName: "depositACCEL",
            args: [ctx.request.accelAmount[0]],
          }));
        }

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

  async getSteps(ctx) {
    const steps: string[] = [];

    // get the user proxy address
    const userProxyAddress = await ctx.readContract({
      ...ctx.contracts.Governance,
      functionName: "deriveUserProxyAddress",
      args: [ctx.account],
    });

    // check if the user proxy contract exists
    const userProxyBytecode = await getBytecode(ctx.wagmiConfig, {
      address: userProxyAddress,
    });

    // deploy the user proxy (optional, but prevents wallets
    // to show a warning for approving a non-deployed contract)
    if (!userProxyBytecode) {
      steps.push("deployUserProxy");
    }

    // check for allowance
    const accelAllowance = await ctx.readContract({
      ...ctx.contracts.AccelToken,
      functionName: "allowance",
      args: [ctx.account, userProxyAddress],
    });

    // approve needed
    if (dn.gt(ctx.request.accelAmount, dnum18(accelAllowance))) {
      steps.push("approve");
    }

    // stake
    steps.push("resetVotesAndDeposit");

    return steps;
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
