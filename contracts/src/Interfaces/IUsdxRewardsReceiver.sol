// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUsdxRewardsReceiver {
    function triggerUsdxRewards(uint256 _usdxYield) external;
}
