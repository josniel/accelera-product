"use client";

import type { BranchId } from "@/src/types";

import { EarnPositionSummary } from "@/src/comps/EarnPositionSummary/EarnPositionSummary";
import { LinkTextButton } from "@/src/comps/LinkTextButton/LinkTextButton";
import { Screen } from "@/src/comps/Screen/Screen";
import content from "@/src/content";
import { getBranches, useEarnPosition } from "@/src/liquity-utils";
import { useAccount } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { TokenIcon } from "@liquity2/uikit";
import { a, useTransition } from "@react-spring/web";

export function EarnPoolsListScreen() {
  const branches = getBranches();
  const collSymbols = branches.map((b) => b.symbol);

  const poolsTransition = useTransition(branches.map((c) => c.branchId), {
    from: { opacity: 0, transform: "scale(1.1) translateY(64px)" },
    enter: { opacity: 1, transform: "scale(1) translateY(0px)" },
    leave: { opacity: 0, transform: "scale(1) translateY(0px)" },
    trail: 80,
    config: {
      mass: 1,
      tension: 1800,
      friction: 140,
    },
  });

  return (
    <Screen
      heading={{
        title: (
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexFlow: "wrap",
              gap: "0 8px",
            })}
          >
            {content.earnHome.headline(
              <TokenIcon.Group>
                {["USDX" as const, ...collSymbols].map((symbol) => (
                  <TokenIcon
                    key={symbol}
                    symbol={symbol}
                  />
                ))}
              </TokenIcon.Group>,
              <TokenIcon symbol="USDX" />,
            )}
          </div>
        ),
        subtitle: (
          <>
            {content.earnHome.subheading}{" "}
            <LinkTextButton
              label={content.earnHome.learnMore[1]}
              href={content.earnHome.learnMore[0]}
              external
            />
          </>
        ),
      }}
    >
      <div
        className={css({
          display: "grid",
          gap: 16,
        })}
      >
        {poolsTransition((style, branchId) => (
          <a.div style={style}>
            <EarnPool branchId={branchId} />
          </a.div>
        ))}
      </div>
    </Screen>
  );
}

function EarnPool({
  branchId,
}: {
  branchId: BranchId;
}) {
  const account = useAccount();
  const earnPosition = useEarnPosition(branchId, account.address ?? null);
  return (
    <EarnPositionSummary
      branchId={branchId}
      earnPosition={earnPosition.data ?? null}
      linkToScreen
    />
  );
}
