"use client";

import { Amount } from "@/src/comps/Amount/Amount";
import { ConnectWarningBox } from "@/src/comps/ConnectWarningBox/ConnectWarningBox";
import { Field } from "@/src/comps/Field/Field";
import { Screen } from "@/src/comps/Screen/Screen";
import content from "@/src/content";
import { getProtocolContract } from "@/src/contracts";
import { dnum18 } from "@/src/dnum-utils";
import { parseInputPercentage, useInputFieldValue } from "@/src/form-utils";
import { fmtnum } from "@/src/formatting";
import { getBranches, getCollToken } from "@/src/liquity-utils";
import { useTransactionFlow } from "@/src/services/TransactionFlow";
import { useAccount, useBalance } from "@/src/wagmi-utils";
import { css } from "@/styled-system/css";
import { Button, HFlex, InfoTooltip, InputField, TextButton, TokenIcon } from "@liquity2/uikit";
import * as dn from "dnum";
import Link from "next/link";
import { useRef } from "react";
import { useReadContract } from "wagmi";

export function RedeemScreen() {
  const account = useAccount();
  const txFlow = useTransactionFlow();

  const usdxBalance = useBalance(account.address, "USDX");

  const CollateralRegistry = getProtocolContract("CollateralRegistry");
  const redemptionRate = useReadContract({
    ...CollateralRegistry,
    functionName: "getRedemptionRateWithDecay",
  });

  const amount = useInputFieldValue(fmtnum);
  const maxFee = useInputFieldValue((value) => `${fmtnum(value, "pct2z")}%`, {
    parse: parseInputPercentage,
  });

  const hasUpdatedRedemptionRate = useRef(false);
  if (!hasUpdatedRedemptionRate.current && redemptionRate.data) {
    if (maxFee.isEmpty) {
      maxFee.setValue(
        fmtnum(
          dn.mul(dnum18(redemptionRate.data), 1.1),
          "pct2z",
        ),
      );
    }
    hasUpdatedRedemptionRate.current = true;
  }

  const branches = getBranches();

  const allowSubmit = account.isConnected
    && amount.parsed
    && maxFee.parsed
    && usdxBalance.data
    && dn.gte(usdxBalance.data, amount.parsed);

  return (
    <Screen
      heading={{
        title: (
          <HFlex>
            Redeem <TokenIcon symbol="USDX" /> USDX for
            <TokenIcon.Group>
              {branches.map((b) => getCollToken(b.branchId)).map(({ symbol }) => (
                <TokenIcon
                  key={symbol}
                  symbol={symbol}
                />
              ))}
            </TokenIcon.Group>{" "}
            ETH
          </HFlex>
        ),
      }}
    >
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: 48,
          width: 534,
        })}
      >
        <Field
          field={
            <InputField
              id="input-redeem-amount"
              contextual={
                <InputField.Badge
                  icon={<TokenIcon symbol="USDX" />}
                  label="USDX"
                />
              }
              drawer={amount.isFocused
                ? null
                : usdxBalance.data
                    && amount.parsed
                    && dn.gt(amount.parsed, usdxBalance.data)
                ? {
                  mode: "error",
                  message: `Insufficient USDX balance. You have ${fmtnum(usdxBalance.data)} USDX.`,
                }
                : null}
              label="Redeeming"
              placeholder="0.00"
              secondary={{
                start: `$${
                  amount.parsed
                    ? fmtnum(amount.parsed)
                    : "0.00"
                }`,
                end: (
                  usdxBalance.data && dn.gt(usdxBalance.data, 0) && (
                    <TextButton
                      label={`Max ${fmtnum(usdxBalance.data)} USDX`}
                      onClick={() => {
                        if (usdxBalance.data) {
                          amount.setValue(dn.toString(usdxBalance.data));
                        }
                      }}
                    />
                  )
                ),
              }}
              {...amount.inputFieldProps}
            />
          }
        />

        <Field
          field={
            <InputField
              id="input-max-fee"
              drawer={maxFee.isFocused
                ? null
                : maxFee.parsed && dn.gt(maxFee.parsed, 0.01)
                ? {
                  mode: "warning",
                  message: `A high percentage will result in a higher fee.`,
                }
                : null}
              label="Max redemption fee"
              placeholder="0.00"
              {...maxFee.inputFieldProps}
            />
          }
          footer={[
            {
              end: (
                <span
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 14,
                  })}
                >
                  <>
                    Current redemption rate:
                    <Amount
                      percentage
                      suffix="%"
                      value={redemptionRate.data ? dnum18(redemptionRate.data) : null}
                      format="pct1z"
                    />
                  </>
                  <InfoTooltip
                    content={{
                      heading: "Maximum redemption fee",
                      body: (
                        <>
                          This is the maximum redemption fee you are willing to pay. The redemption fee is a percentage
                          of the redeemed amount that is paid to the protocol. The redemption fee must be higher than
                          the current fee.
                        </>
                      ),
                      footerLink: {
                        href: "https://dune.com/queries/4641717/7730245",
                        label: "Redemption fee on Dune",
                      },
                    }}
                  />
                </span>
              ),
            },
          ]}
        />

        <section
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 16,
            color: "infoSurfaceContent",
            background: "infoSurface",
            border: "1px solid token(colors.infoSurfaceBorder)",
            borderRadius: 8,
          })}
        >
          <header
            className={css({
              display: "flex",
              flexDirection: "column",
              fontSize: 16,
            })}
          >
            <h1
              className={css({
                fontWeight: 600,
              })}
            >
              Important note
            </h1>
          </header>
          <p
            className={css({
              fontSize: 15,
              "& a": {
                color: "accent",
                textDecoration: "underline",
              },
            })}
          >
            You will be charged a dynamic redemption fee (the more redemptions, the higher the fee). Trading USDX on an
            exchange could be more favorable.{" "}
            <Link
              href="https://docs.liquity.org/v2-faq/redemptions-and-delegation"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about redemptions.
            </Link>
          </p>
        </section>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 32,
            width: "100%",
          }}
        >
          <ConnectWarningBox />
          <Button
            disabled={!allowSubmit}
            label={content.borrowScreen.action}
            mode="primary"
            size="lg"
            wide
            onClick={() => {
              if (
                amount.parsed
                && maxFee.parsed
              ) {
                txFlow.start({
                  flowId: "redeemCollateral",
                  backLink: ["/redeem", "Back"],
                  successLink: ["/", "Go to the Dashboard"],
                  successMessage: "The redemption was successful.",

                  amount: amount.parsed,
                  maxFee: maxFee.parsed,
                });
              }
            }}
          />
        </div>
      </div>
    </Screen>
  );
}
