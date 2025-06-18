import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AllocateACCEL as AllocateACCELEvent,
  ClaimForInitiative as ClaimForInitiativeEvent,
  DepositACCEL as DepositACCELEvent,
  RegisterInitiative as RegisterInitiativeEvent,
  SnapshotVotesForInitiative as SnapshotVotesForInitiativeEvent,
  UnregisterInitiative as UnregisterInitiativeEvent,
  WithdrawACCEL as WithdrawACCELEvent,
} from "../generated/Governance/Governance";
import { GovernanceAllocation, GovernanceInitiative, GovernanceStats, GovernanceUser } from "../generated/schema";

function initializeStats(): GovernanceStats {
  // Create initial stats
  let stats = new GovernanceStats("stats");
  stats.totalACCELStaked = BigInt.fromI32(0);
  stats.totalOffset = BigInt.fromI32(0);
  stats.totalInitiatives = 0;
  stats.save();

  return stats;
}

export function handleRegisterInitiative(event: RegisterInitiativeEvent): void {
  let initiative = new GovernanceInitiative(event.params.initiative.toHex());
  initiative.registeredAt = event.block.timestamp;
  initiative.registeredAtEpoch = event.params.atEpoch;
  initiative.registrant = event.params.registrant;
  initiative.save();
}

export function handleUnregisterInitiative(event: UnregisterInitiativeEvent): void {
  let initiative = GovernanceInitiative.load(event.params.initiative.toHex());
  if (initiative) {
    initiative.unregisteredAt = event.block.timestamp;
    initiative.unregisteredAtEpoch = event.params.atEpoch;
    initiative.save();
  }
}

export function handleSnapshotVotesForInitiative(event: SnapshotVotesForInitiativeEvent): void {
  let initiative = GovernanceInitiative.load(event.params.initiative.toHex());
  if (initiative) {
    initiative.lastVoteSnapshotEpoch = event.params.forEpoch;
    initiative.lastVoteSnapshotVotes = event.params.votes;
    initiative.save();
  }
}

export function handleDepositACCEL(event: DepositACCELEvent): void {
  let user = GovernanceUser.load(event.params.user.toHex());
  if (user === null) {
    user = new GovernanceUser(event.params.user.toHex());
    user.allocated = [];
    user.allocatedACCEL = BigInt.fromI32(0);
    user.stakedACCEL = BigInt.fromI32(0);
    user.stakedOffset = BigInt.fromI32(0);
  }

  let offsetIncrease = event.params.accelAmount.times(event.block.timestamp);
  user.stakedOffset = user.stakedOffset.plus(offsetIncrease);
  user.stakedACCEL = user.stakedACCEL.plus(event.params.accelAmount);
  user.save();

  let stats = getStats();
  stats.totalOffset = stats.totalOffset.plus(offsetIncrease);
  stats.totalACCELStaked = stats.totalACCELStaked.plus(event.params.accelAmount);
  stats.save();
}

export function handleWithdrawACCEL(event: WithdrawACCELEvent): void {
  let user = GovernanceUser.load(event.params.user.toHex());
  if (user === null) {
    return;
  }

  let stats = getStats();

  if (event.params.accelReceived < user.stakedACCEL) {
    let offsetDecrease = user.stakedOffset.times(event.params.accelReceived).div(user.stakedACCEL);
    stats.totalOffset = stats.totalOffset.minus(offsetDecrease);
    user.stakedOffset = user.stakedOffset.minus(offsetDecrease);
  } else {
    stats.totalOffset = stats.totalOffset.minus(user.stakedOffset);
    user.stakedOffset = BigInt.fromI32(0);
  }

  user.stakedACCEL = user.stakedACCEL.minus(event.params.accelReceived);
  user.save();

  stats.totalACCELStaked = stats.totalACCELStaked.minus(event.params.accelReceived);
  stats.save();
}

export function handleAllocateACCEL(event: AllocateACCELEvent): void {
  let userId = event.params.user.toHex();
  let initiativeId = event.params.initiative.toHex();
  let allocationId = initiativeId + ":" + userId;

  let user = GovernanceUser.load(userId);
  let initiative = GovernanceInitiative.load(initiativeId);

  if (!user || !initiative) {
    return;
  }

  let allocation = GovernanceAllocation.load(allocationId);
  if (allocation === null) {
    allocation = new GovernanceAllocation(allocationId);
    allocation.user = user.id;
    allocation.initiative = initiative.id;
    allocation.voteACCEL = BigInt.fromI32(0);
    allocation.vetoACCEL = BigInt.fromI32(0);
  }

  let wasAllocated = allocation.voteACCEL.gt(BigInt.fromI32(0)) || allocation.vetoACCEL.gt(BigInt.fromI32(0));

  // votes
  allocation.voteACCEL = allocation.voteACCEL.plus(event.params.deltaVoteACCEL);
  user.allocatedACCEL = user.allocatedACCEL.plus(event.params.deltaVoteACCEL);

  // vetos
  allocation.vetoACCEL = allocation.vetoACCEL.plus(event.params.deltaVetoACCEL);
  user.allocatedACCEL = user.allocatedACCEL.plus(event.params.deltaVetoACCEL);

  allocation.atEpoch = event.params.atEpoch;

  let isAllocated = allocation.voteACCEL.gt(BigInt.fromI32(0)) || allocation.vetoACCEL.gt(BigInt.fromI32(0));

  let allocated = user.allocated;
  let initiativeAddress = Bytes.fromHexString(initiativeId);
  if (!wasAllocated && isAllocated && !allocated.includes(initiativeAddress)) {
    allocated.push(Bytes.fromHexString(initiativeId));
    user.allocated = allocated;
  } else if (wasAllocated && !isAllocated && allocated.includes(initiativeAddress)) {
    let index = allocated.indexOf(initiativeAddress);
    allocated.splice(index, 1);
    user.allocated = allocated;
  }

  allocation.save();
  user.save();
  initiative.save();
}

function getStats(): GovernanceStats {
  let stats = GovernanceStats.load("stats");
  if (stats === null) {
    return initializeStats();
  }
  return stats;
}

export function handleClaimForInitiative(event: ClaimForInitiativeEvent): void {
  let initiative = GovernanceInitiative.load(event.params.initiative.toHex());
  if (initiative) {
    initiative.lastClaimEpoch = event.params.forEpoch;
    initiative.save();
  }
}
