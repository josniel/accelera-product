// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IExchangeHelpers {
    function getCollFromUsdx(uint256 _usdxAmount, IERC20 _collToken, uint256 _desiredCollAmount)
        external /* view */
        returns (uint256, uint256);
}
