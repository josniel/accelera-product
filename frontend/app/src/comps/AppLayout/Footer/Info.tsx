import type { TokenSymbol } from "@/src/types";

import { Amount } from "@/src/comps/Amount/Amount";
import { LinkTextButton } from "@/src/comps/LinkTextButton/LinkTextButton";
import { ACCOUNT_SCREEN } from "@/src/env";
import { useLiquityStats } from "@/src/liquity-utils";
import { usePrice } from "@/src/services/Prices";
import { useAccount } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { HFlex, shortenAddress, TokenIcon } from "@liquity2/uikit";
import { StatusDot } from "@liquity2/uikit";
import { blo } from "blo";
import Image from "next/image";

const DISPLAYED_PRICES = ["ACCEL", "USDX", "ETH"] as const;
export const Info = () => {
  const account = useAccount();
  const stats = useLiquityStats();

  const tvl = stats.data?.totalValueLocked;
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        width: "100%",
        mt: 16,
        lgDown: { display: "none" },
      })}
    >
      <div
        className={css({
          overflowX: "auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          width: "100%",
          maxWidth: "100%",
          height: 48,
          ml: { xlDown: 16, xl: 32 },
          mr: { xlDown: 16, xl: 32 },
          // paddingLeft: {
          //   base: 12,
          //   md: 0,
          // },
          fontSize: 12,
          fontWeight: 500,
          color: "white",
          // borderTop: "1px solid token(colors.tableBorder)",
          userSelect: "none",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: 8,
            ml: 3,
          })}
        >
          <StatusDot
            mode={"positive"}
            size={12}
          />
          <span>TVL</span>{" "}
          <span>
            {tvl && (
              <Amount
                fallback="…"
                format="compact"
                prefix="$"
                value={tvl}
              />
            )}
          </span>
        </div>
        <HFlex gap={16}>
          {DISPLAYED_PRICES.map((symbol) => (
            <Price
              key={symbol}
              symbol={symbol}
            />
          ))}
          {account.address && ACCOUNT_SCREEN && (
            <LinkTextButton
              id="footer-account-button"
              href={`/account?address=${account.address}`}
              label={
                <HFlex gap={4} alignItems="center">
                  <Image
                    alt=""
                    width={16}
                    height={16}
                    src={blo(account.address)}
                    className={css({
                      borderRadius: "50%",
                    })}
                  />

                  {shortenAddress(account.address, 3)}
                </HFlex>
              }
              className={css({
                color: "content",
                borderRadius: 4,
                whiteSpace: "nowrap",
                _focusVisible: {
                  outline: "2px solid token(colors.focused)",
                },
                _active: {
                  translate: "0 1px",
                },
              })}
            />
          )}
        </HFlex>
      </div>
    </div>
  );
};

function Price({ symbol }: { symbol: TokenSymbol }) {
  const price = usePrice(symbol);
  return (
    <HFlex
      key={symbol}
      gap={4}
    >
      <TokenIcon
        size={16}
        symbol={symbol}
      />
      <HFlex gap={8}>
        <span>{symbol}</span>
        <Amount
          prefix="$"
          fallback="…"
          value={price.data}
          format="2z"
        />
      </HFlex>
    </HFlex>
  );
}
