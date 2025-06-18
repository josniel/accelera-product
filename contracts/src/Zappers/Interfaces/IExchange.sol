// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IExchange {
    function swapFromUsdx(uint256 _usdxAmount, uint256 _minCollAmount) external;

    function swapToUsdx(uint256 _collAmount, uint256 _minUsdxAmount) external returns (uint256);
}
