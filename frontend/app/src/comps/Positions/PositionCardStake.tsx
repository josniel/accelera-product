import type { PositionStake } from "@/src/types";

import { Amount } from "@/src/comps/Amount/Amount";
import { fmtnum } from "@/src/formatting";
import { useVotingPower } from "@/src/liquity-governance";
import { css } from "@/styled-system/css";
import { HFlex, IconStakeAction, TokenIcon } from "@liquity2/uikit";
import { useRef } from "react";
import { IconWrapper } from "../IconWrapper/IconWrapper";
import { PositionCard } from "./PositionCard";
import { CardRow, CardRows } from "./shared";

export function PositionCardStake({
  deposit,
  owner,
  rewards,
}: Pick<
  PositionStake,
  | "deposit"
  | "owner"
  | "rewards"
>) {
  const votingPowerRef = useRef<HTMLDivElement>(null);
  useVotingPower(owner, (share) => {
    if (!votingPowerRef.current) {
      return;
    }

    if (!share) {
      votingPowerRef.current.innerHTML = "−";
      votingPowerRef.current.title = "";
      return;
    }

    const shareFormatted = fmtnum(share, { preset: "12z", scale: 100 }) + "%";
    votingPowerRef.current.innerHTML = fmtnum(share, "pct2z") + "%";
    votingPowerRef.current.title = shareFormatted;
  });
  return (
    <PositionCard
      className="position-card position-card-stake"
      href="/stake"
      heading={[
        <div
          key="start"
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "content",
          })}
        >
          ACCEL stake
        </div>,
      ]}
      contextual={
        <IconWrapper>
          <IconStakeAction size={16} />
        </IconWrapper>
      }
      main={{
        value: (
          <HFlex gap={8} alignItems="center" justifyContent="flex-start">
            <Amount value={deposit} format={2} size="lg" />
            <TokenIcon size={24} symbol="ACCEL" />
          </HFlex>
        ),
        label: (
          <HFlex
            gap={4}
            justifyContent="flex-start"
            className={css({
              fontSize: 12,
              color: "dimmed",
              fontWeight: 500,
            })}
          >
            Staked ACCEL
          </HFlex>
        ),
      }}
      secondary={
        <CardRows>
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                })}
              >
                <div
                  className={css({
                    fontSize: 12,
                    color: "dimmed",
                    fontWeight: 500,
                  })}
                >
                  Voting power
                </div>
                <div
                  className={css({
                    color: "content",
                    fontWeight: 500,
                    fontSize: 10,
                  })}
                >
                  <div ref={votingPowerRef} />
                </div>
              </div>
            }
          />
          <CardRow
            start={
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                })}
              >
                <div
                  className={css({
                    fontSize: 12,
                    color: "dimmed",
                    fontWeight: 500,
                  })}
                >
                  Rewards
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "content",
                    fontWeight: 500,
                    fontSize: 10,
                  })}
                >
                  <Amount value={rewards.lusd} format="2diff" />
                  <TokenIcon size="mini" symbol="LUSD" />
                </div>
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "content",
                    fontWeight: 500,
                    fontSize: 10,
                  })}
                >
                  <Amount value={rewards.eth} format="4diff" />
                  <TokenIcon size="mini" symbol="ETH" />
                </div>
              </div>
            }
          />
        </CardRows>
      }
    />
  );
}
