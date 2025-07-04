import type { Delegate, Position, PositionLoanUncommitted } from "@/src/types";
import type { CollateralToken } from "@liquity2/uikit";
import type { Dnum } from "dnum";

import { INTEREST_RATE_END, INTEREST_RATE_START } from "@/src/constants";
import * as dn from "dnum";

const INTEREST_RATE_INCREMENT = 0.1;
const INTEREST_RATE_MIN = INTEREST_RATE_START * 100;
const INTEREST_RATE_MAX = INTEREST_RATE_END * 100;

export const STAKED_ACCEL_TOTAL = [43_920_716_739_092_664_364_409_174n, 18] as const;

export const ACCOUNT_STAKED_ACCEL = {
  deposit: dn.from(3414, 18),
  rewardEth: dn.from(0.0054, 18),
  rewardLusd: dn.from(234.24, 18),
} as const;

export const ACCOUNT_BALANCES = {
  USDX: dn.from(3_987, 18),
  ETH: dn.from(2.429387, 18),
  ACCEL: dn.from(2008.217, 18),
  RETH: dn.from(1.3732, 18),
  WSTETH: dn.from(17.912, 18),
  LUSD: dn.from(1_200, 18),
} as const;

const DEMO_ACCOUNT = `0x${"0".repeat(39)}1` as const;

let lastTime = new Date("2024-01-01T00:00:00Z").getTime();
function getTime() {
  return lastTime += 24 * 60 * 60 * 1000;
}

export const ACCOUNT_POSITIONS: Exclude<Position, PositionLoanUncommitted>[] = [
  {
    type: "borrow",
    status: "active",
    borrowed: dn.from(12_789, 18),
    borrower: DEMO_ACCOUNT,
    deposit: dn.from(5.5, 18),
    interestRate: dn.from(0.067, 18),
    troveId: "0x01",
    branchId: 1,
    batchManager: null,
    createdAt: getTime(),
    updatedAt: getTime(),
  },
  {
    type: "multiply",
    status: "active",
    borrowed: dn.from(28_934.23, 18),
    borrower: DEMO_ACCOUNT,
    deposit: dn.from(19.20, 18), // 8 ETH @ 2.4 leverage
    interestRate: dn.from(0.045, 18),
    troveId: "0x02",
    branchId: 0,
    batchManager: null,
    createdAt: getTime(),
    updatedAt: getTime(),
  },
  {
    type: "earn",
    owner: DEMO_ACCOUNT,
    branchId: 0,
    deposit: dn.from(5_000, 18),
    rewards: {
      usdx: dn.from(789.438, 18),
      coll: dn.from(0.943, 18),
    },
  },
  {
    type: "stake",
    owner: DEMO_ACCOUNT,
    deposit: dn.from(3414, 18),
    totalStaked: STAKED_ACCEL_TOTAL,
    rewards: {
      lusd: dn.from(789.438, 18),
      eth: dn.from(0.943, 18),
    },
  },
];

export const BORROW_STATS = {
  ETH: {
    branchId: 0,
    totalDeposited: dn.from(30_330.9548, 18),
  },
  RETH: {
    branchId: 1,
    totalDeposited: dn.from(22_330.9548, 18),
  },
  WSTETH: {
    branchId: 2,
    totalDeposited: dn.from(18_030.9548, 18),
  },
} as const;

export const EARN_POOLS: Record<
  CollateralToken["symbol"],
  { apr: Dnum; usdxQty: Dnum }
> = {
  ETH: {
    apr: dn.from(0.068, 18),
    usdxQty: [65_700_000n, 0],
  },
  RETH: {
    apr: dn.from(0.057, 18),
    usdxQty: [44_100_000n, 0],
  },
  WSTETH: {
    apr: dn.from(0.054, 18),
    usdxQty: [25_700_000n, 0],
  },
};

const BUCKET_SIZE_MAX = 20_000_000;
const RATE_STEPS = Math.round((INTEREST_RATE_MAX - INTEREST_RATE_MIN) / INTEREST_RATE_INCREMENT) + 1;

export const INTEREST_RATE_BUCKETS = Array.from({ length: RATE_STEPS }, (_, i) => {
  const rate = Math.round(
    (INTEREST_RATE_MIN + i * INTEREST_RATE_INCREMENT) * 10,
  ) / 10;
  const baseFactor = 1 - Math.pow((i / (RATE_STEPS - 1) - 0.5) * 2, 2);
  return [
    rate,
    dn.from(Math.pow(baseFactor * Math.random(), 2) * BUCKET_SIZE_MAX, 18),
  ];
}) as Array<[number, dn.Dnum]>;

export const INTEREST_CHART = INTEREST_RATE_BUCKETS.map(([_, size]) => (
  Math.max(
    0.1,
    dn.toNumber(size) / Math.max(
      ...INTEREST_RATE_BUCKETS.map(([_, size]) => dn.toNumber(size)),
    ),
  )
));

export function getDebtBeforeRateBucketIndex(index: number) {
  let debt = dn.from(0, 18);
  for (let i = 0; i < index; i++) {
    const bucket = INTEREST_RATE_BUCKETS[i];
    if (!bucket) {
      break;
    }
    debt = dn.add(debt, bucket[1]);
    if (i === index - 1) {
      break;
    }
  }
  return debt;
}

export const DELEGATES: Delegate[] = [
  {
    id: "0x01",
    address: "0x0000000000000000000000000000000000000001",
    name: "DeFi Saver",
    interestRate: dn.from(0.065, 18),
    followers: 1202,
    usdxAmount: dn.from(25_130_000, 18),
    lastDays: 180,
    redemptions: dn.from(900_000, 18),
    interestRateChange: {
      min: dn.from(0.028, 18),
      max: dn.from(0.0812, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x02",
    address: "0x0000000000000000000000000000000000000002",
    name: "Yield Harbor",
    interestRate: dn.from(0.041, 18),
    followers: 700,
    usdxAmount: dn.from(15_730_000, 18),
    lastDays: 180,
    redemptions: dn.from(2_600_000, 18),
    interestRateChange: {
      min: dn.from(0.032, 18),
      max: dn.from(0.069, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x03",
    address: "0x0000000000000000000000000000000000000003",
    name: "Crypto Nexus",
    interestRate: dn.from(0.031, 18),
    followers: 500,
    usdxAmount: dn.from(12_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_200_000, 18),
    interestRateChange: {
      min: dn.from(0.025, 18),
      max: dn.from(0.078, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x04",
    address: "0x0000000000000000000000000000000000000004",
    name: "Block Ventures",
    interestRate: dn.from(0.021, 18),
    followers: 200,
    usdxAmount: dn.from(7_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_280_000, 18),
    interestRateChange: {
      min: dn.from(0.018, 18),
      max: dn.from(0.065, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x05",
    address: "0x0000000000000000000000000000000000000005",
    name: "Chain Gains",
    interestRate: dn.from(0.011, 18),
    followers: 100,
    usdxAmount: dn.from(3_000_000, 18),
    lastDays: 47,
    redemptions: dn.from(1_100_000, 18),
    interestRateChange: {
      min: dn.from(0.009, 18),
      max: dn.from(0.058, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x06",
    address: "0x0000000000000000000000000000000000000006",
    name: "TokenTrust",
    interestRate: dn.from(0.001, 18),
    followers: 50,
    usdxAmount: dn.from(1_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(334_000, 18),
    interestRateChange: {
      min: dn.from(0.001, 18),
      max: dn.from(0.043, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x07",
    address: "0x0000000000000000000000000000000000000007",
    name: "Yield Maximizer",
    interestRate: dn.from(0.072, 18),
    followers: 1500,
    usdxAmount: dn.from(30_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(750_000, 18),
    interestRateChange: {
      min: dn.from(0.035, 18),
      max: dn.from(0.089, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x08",
    address: "0x0000000000000000000000000000000000000008",
    name: "Stable Growth",
    interestRate: dn.from(0.055, 18),
    followers: 980,
    usdxAmount: dn.from(22_500_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_100_000, 18),
    interestRateChange: {
      min: dn.from(0.041, 18),
      max: dn.from(0.072, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x09",
    address: "0x0000000000000000000000000000000000000009",
    name: "Risk Taker",
    interestRate: dn.from(0.089, 18),
    followers: 750,
    usdxAmount: dn.from(18_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(2_200_000, 18),
    interestRateChange: {
      min: dn.from(0.038, 18),
      max: dn.from(0.102, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0a",
    address: "0x000000000000000000000000000000000000000a",
    name: "Conservative Gains",
    interestRate: dn.from(0.038, 18),
    followers: 620,
    usdxAmount: dn.from(14_800_000, 18),
    lastDays: 180,
    redemptions: dn.from(500_000, 18),
    interestRateChange: {
      min: dn.from(0.029, 18),
      max: dn.from(0.061, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0b",
    address: "0x000000000000000000000000000000000000000b",
    name: "Crypto Innovator",
    interestRate: dn.from(0.062, 18),
    followers: 890,
    usdxAmount: dn.from(20_500_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_500_000, 18),
    interestRateChange: {
      min: dn.from(0.033, 18),
      max: dn.from(0.085, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0c",
    address: "0x000000000000000000000000000000000000000c",
    name: "DeFi Pioneer",
    interestRate: dn.from(0.075, 18),
    followers: 1100,
    usdxAmount: dn.from(26_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_800_000, 18),
    interestRateChange: {
      min: dn.from(0.037, 18),
      max: dn.from(0.091, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0d",
    address: "0x000000000000000000000000000000000000000d",
    name: "Steady Returns",
    interestRate: dn.from(0.049, 18),
    followers: 780,
    usdxAmount: dn.from(17_500_000, 18),
    lastDays: 180,
    redemptions: dn.from(600_000, 18),
    interestRateChange: {
      min: dn.from(0.036, 18),
      max: dn.from(0.067, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0e",
    address: "0x000000000000000000000000000000000000000e",
    name: "Blockchain Believer",
    interestRate: dn.from(0.058, 18),
    followers: 850,
    usdxAmount: dn.from(19_800_000, 18),
    lastDays: 180,
    redemptions: dn.from(1_300_000, 18),
    interestRateChange: {
      min: dn.from(0.031, 18),
      max: dn.from(0.076, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x0f",
    address: "0x000000000000000000000000000000000000000f",
    name: "Crypto Sage",
    interestRate: dn.from(0.069, 18),
    followers: 1300,
    usdxAmount: dn.from(28_500_000, 18),
    lastDays: 180,
    redemptions: dn.from(950_000, 18),
    interestRateChange: {
      min: dn.from(0.034, 18),
      max: dn.from(0.088, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
  {
    id: "0x10",
    address: "0x0000000000000000000000000000000000000010",
    name: "Usdx Strategist",
    interestRate: dn.from(0.082, 18),
    followers: 970,
    usdxAmount: dn.from(23_000_000, 18),
    lastDays: 180,
    redemptions: dn.from(2_500_000, 18),
    interestRateChange: {
      min: dn.from(0.039, 18),
      max: dn.from(0.098, 18),
      period: 7n * 24n * 60n * 60n,
    },
  },
];

export const IC_STRATEGIES: Delegate[] = [
  {
    id: "0x11",
    address: "0x0000000000000000000000000000000000000011",
    name: "Conservative",
    interestRate: dn.from(0.065, 18),
    followers: 1202,
    usdxAmount: dn.from(25_130_000, 18),
    lastDays: 180,
    redemptions: dn.from(900_000, 18),
    interestRateChange: {
      min: dn.from(0.028, 18),
      max: dn.from(0.0812, 18),
      period: 7n * 24n * 60n * 60n,
    },
    fee: dn.from(0.00003, 18),
  },
];
