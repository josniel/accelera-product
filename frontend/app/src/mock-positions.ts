import * as dn from "dnum";
import type {
  BranchId,
  Position,
  PositionEarn,
  PositionLoanCommitted,
  PositionLoanUncommitted,
  PositionStake,
  TroveId,
  TroveStatus,
} from "./types";

// ——— Loans (“borrow” y “multiply”) ———
export const mockLoanBorrowCommittedActive: PositionLoanCommitted = {
  type: "borrow",
  batchManager: null,
  borrower: "0x1234567890abcdef1234567890abcdef12345678",
  borrowed: dn.from(1200, 2), // 1 200 USDe prestados
  deposit: dn.from(2.5, 18), // 2.5 ETH de colateral
  interestRate: dn.from(0.05, 18), // 5% p.a.
  branchId: 1 as BranchId,
  status: "active" as TroveStatus,
  troveId: "0xaaa111bbb222ccc333ddd444eee555fff6660000" as TroveId,
  createdAt: Date.now() - 86400_000,
  updatedAt: Date.now(),
};

export const mockLoanBorrowCommittedLiquidated: PositionLoanCommitted = {
  ...mockLoanBorrowCommittedActive,
  status: "redeemed",
  updatedAt: Date.now() - 3600_000,
};

export const mockLoanMultiplyUncommitted: PositionLoanUncommitted = {
  type: "multiply",
  batchManager: "0x1234567890abcdef1234567890abcdef12345678",
  borrowed: dn.from(0),
  borrower: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  deposit: dn.from(1.0),
  interestRate: dn.from(0.045),
  branchId: 2 as BranchId,
  status: "closed" as TroveStatus,
  troveId: null,
};

// ——— Earn (“earn”) ———
export const mockEarnSmall: PositionEarn = {
  type: "earn",
  owner: "0xfeedfacecafebeefdeadbeef0123456789abcdef",
  branchId: 0 as BranchId,
  deposit: dn.from(500),
  rewards: {
    usdx: dn.from(12.34),
    coll: dn.from(0.02),
  },
};

export const mockEarnZeroRewards: PositionEarn = {
  ...mockEarnSmall,
  rewards: { usdx: dn.from(0), coll: dn.from(0) },
};

// ——— Stake (“stake”) ———
export const mockStakeStandard: PositionStake = {
  type: "stake",
  owner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  deposit: dn.from(1000),
  totalStaked: dn.from(1500),
  rewards: {
    lusd: dn.from(5.5),
    eth: dn.from(0.1),
  },
};

export const mockStakeNoDeposit: PositionStake = {
  ...mockStakeStandard,
  deposit: dn.from(0),
  totalStaked: dn.from(0),
  rewards: {
    lusd: dn.from(0),
    eth: dn.from(0),
  },
};

// ——— Export de todos los mocks como una sola lista ———
export const allMockPositions: Position[] = [
  // Loans
  mockLoanBorrowCommittedActive,
  mockLoanBorrowCommittedLiquidated,
  // mockLoanMultiplyUncommitted,

  // Earn
  mockEarnSmall,
  mockEarnZeroRewards,

  // Stake
  mockStakeStandard,
  mockStakeNoDeposit,
];
