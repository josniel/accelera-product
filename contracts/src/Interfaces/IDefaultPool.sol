// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IDefaultPool {
    function troveManagerAddress() external view returns (address);
    function activePoolAddress() external view returns (address);
    // --- Functions ---
    function getCollBalance() external view returns (uint256);
    function getUsdxDebt() external view returns (uint256);
    function sendCollToActivePool(uint256 _amount) external;
    function receiveColl(uint256 _amount) external;

    function increaseUsdxDebt(uint256 _amount) external;
    function decreaseUsdxDebt(uint256 _amount) external;
}
