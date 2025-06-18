"use client";

import { Card } from "@liquity2/uikit";
import { useFixtureInput } from "react-cosmos/client";
import { css } from "../../styled-system/css";
import { HStack, VStack } from "../../styled-system/jsx";

const modes = ["primary", "secondary", "tertiary"] as const;

export function CardFixture() {
  const [wide] = useFixtureInput("wide", false);
  const [showHeader] = useFixtureInput("showHeader", true);
  const [mode] = useFixtureInput<typeof modes[number]>("mode", "primary");

  const header = (
    <HStack justify="space-between" p="4">
      <div className={css({ fontWeight: "medium" })}>USDx Loan</div>
      <div className={css({ color: "white", fontSize: "sm", px: "2", py: "0.5", bg: "pastel-green:200" })}>
        Redeemed
      </div>
    </HStack>
  );

  const content = (
    <VStack alignItems={"center"} p="4" gap="2">
      <h1>5,412.32</h1>
      <div className={css({ fontSize: "sm" })}>
        Backed by 2 ETH
      </div>
      <HStack justify="space-between" w="full">
        <div>LTV 40.00%</div>
        <div>Low liquidation risk</div>
      </HStack>
      <HStack justify="space-between" w="full">
        <div>Interest 4.50%</div>
        <div>Medium redemption risk</div>
      </HStack>
    </VStack>
  );

  return (
    <div style={{ padding: 32, backgroundColor: "#121212" }}>
      <Card
        wide={wide}
        mode={mode}
        style={{ margin: "0 auto" }}
      >
        {showHeader && header}
        {content}
      </Card>
    </div>
  );
}
