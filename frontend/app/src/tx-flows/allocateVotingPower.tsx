import type { FlowDeclaration } from "@/src/services/TransactionFlow";
import type { Address, Dnum, Initiative, VoteAllocation } from "@/src/types";

import { AddressLink } from "@/src/comps/AddressLink/AddressLink";
import { Amount } from "@/src/comps/Amount/Amount";
import { GAS_ALLOCATE_ACCEL_MIN_HEADROOM } from "@/src/constants";
import { getUserStates, useGovernanceUser, useNamedInitiatives } from "@/src/liquity-governance";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { getIndexedUserAllocated } from "@/src/subgraph";
import { vVoteAllocations } from "@/src/valibot-utils";
import { css } from "@/styled-system/css";
import { IconDownvote, IconStake, IconUpvote } from "@liquity2/uikit";
import * as dn from "dnum";
import * as v from "valibot";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "allocateVotingPower",
  {
    voteAllocations: vVoteAllocations(),
  },
);

export type AllocateVotingPowerRequest = v.InferOutput<typeof RequestSchema>;

export const allocateVotingPower: FlowDeclaration<AllocateVotingPowerRequest> = {
  title: "Review & Send Transaction",

  Summary({ request, account }) {
    const governanceUser = useGovernanceUser(account);
    const stakedAccel: Dnum = [governanceUser.data?.stakedACCEL ?? 0n, 18];

    let totalAccelAllocation: Dnum = [0n, 18];
    for (const vote of Object.values(request.voteAllocations)) {
      if (vote) {
        totalAccelAllocation = dn.add(
          totalAccelAllocation,
          dn.mul(stakedAccel, vote.value),
        );
      }
    }

    const votesCount = Object.keys(request.voteAllocations).length;

    return (
      <div
        className={css({
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "12px 16px",
          width: "100%",
          color: "positionContent",
          background: "position",
          userSelect: "none",
          borderRadius: 8,
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "flex-start",
            flexDirection: "column",
            paddingBottom: 12,
          })}
        >
          <h1
            title="ACCEL Stake"
            className={css({
              display: "flex",
              alignItems: "center",
              gap: 4,
              paddingBottom: 12,
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "strongSurfaceContent",
                fontSize: 12,
                textTransform: "uppercase",
              })}
            >
              <div
                className={css({
                  display: "flex",
                  color: "strongSurfaceContentAlt2",
                })}
              >
                <IconStake size={16} />
              </div>
              ACCEL Stake
            </div>
          </h1>
          <div
            className={css({
              flexGrow: 0,
              flexShrink: 0,
              display: "flex",
            })}
          >
          </div>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                fontSize: 40,
                lineHeight: 1,
                gap: 12,
              })}
            >
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 40,
                  paddingTop: 24,
                  paddingBottom: 24,
                })}
              >
                <Amount
                  value={totalAccelAllocation}
                  format={2}
                />{" "}
                ACCEL
              </div>
            </div>
            <div
              className={css({
                fontSize: 14,
                color: "token(colors.strongSurfaceContentAlt)",
              })}
            >
              Allocated to {votesCount} initiative{votesCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>
    );
  },

  Details({ request, account }) {
    const initiatives = useNamedInitiatives();
    const governanceUser = useGovernanceUser(account);
    const stakedACCEL = governanceUser.data?.stakedACCEL ?? 0n;
    const allocations = Object.entries(request.voteAllocations);
    if (allocations.length === 0) {
      return (
        <TransactionDetailsRow
          label="Allocation reset"
          value={[
            "All your votes will be dealocated.",
          ]}
        />
      );
    }
    return allocations.map(([address, vote]) => {
      const initiative = initiatives.data?.find((i) => i.address === address);
      return !initiative || !vote ? null : (
        <VoteAllocation
          key={address}
          initiative={initiative}
          vote={vote}
          stakedACCEL={stakedACCEL}
        />
      );
    });
  },

  steps: {
    allocateVotingPower: {
      name: () => "Cast votes",
      Status: TransactionStatus,

      async commit(ctx) {
        const userStates = await getUserStates(ctx.wagmiConfig, ctx.account);

        const { voteAllocations } = ctx.request;
        const { stakedACCEL } = userStates;

        const initiativeAddresses = Object.keys(voteAllocations) as Address[];

        const allocationArgs = {
          initiatives: initiativeAddresses,
          votes: Array.from<bigint>({ length: initiativeAddresses.length }).fill(0n),
          vetos: Array.from<bigint>({ length: initiativeAddresses.length }).fill(0n),
        };

        let remainingACCEL = stakedACCEL;
        let [remainingVotes] = Object.values(voteAllocations)
          .map((x) => x?.value)
          .filter((x) => x !== undefined)
          .reduce((a, b) => dn.add(a, b), [0n, 18]);

        for (const [index, address] of initiativeAddresses.entries()) {
          const vote = voteAllocations[address];
          if (!vote) {
            throw new Error("Vote not found");
          }

          let qty = remainingACCEL * vote.value[0] / remainingVotes;
          remainingACCEL -= qty;
          remainingVotes -= vote.value[0];

          if (vote?.vote === "for") {
            allocationArgs.votes[index] = qty;
          } else if (vote?.vote === "against") {
            allocationArgs.vetos[index] = qty;
          }
        }

        const allocated = await getIndexedUserAllocated(ctx.account);

        return ctx.writeContract({
          ...ctx.contracts.Governance,
          functionName: "allocateACCEL",
          args: [
            allocated, // allocations to reset
            allocationArgs.initiatives,
            allocationArgs.votes,
            allocationArgs.vetos,
          ],
        }, GAS_ALLOCATE_ACCEL_MIN_HEADROOM);
      },

      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },
  },

  async getSteps() {
    return ["allocateVotingPower"];
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};

function VoteAllocation({
  initiative,
  vote,
  stakedACCEL,
}: {
  initiative: Initiative;
  vote: VoteAllocation;
  stakedACCEL: bigint;
}) {
  const accelAllocation = dn.mul([stakedACCEL, 18], vote.value);
  return (
    <TransactionDetailsRow
      label={[
        initiative.name ?? "Initiative",
        <div
          key="end"
          title={initiative.address}
        >
          {initiative.protocol ?? <AddressLink address={initiative.address} />}
        </div>,
      ]}
      value={[
        <div
          key="start"
          className={css({
            display: "flex",
            gap: 4,
            alignItems: "center",
          })}
        >
          <Amount percentage value={vote.value} />
          {vote.vote === "for"
            ? <IconUpvote size={24} />
            : <IconDownvote size={24} />}
        </div>,
        <div
          key="end"
          className={css({
            display: "flex",
            gap: 4,
            alignItems: "center",
          })}
        >
          {vote.vote === "for" ? "Upvote" : "Downvote"} with <Amount value={accelAllocation} /> ACCEL
        </div>,
      ]}
    />
  );
}
