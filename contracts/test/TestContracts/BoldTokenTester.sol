// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "src/UsdxToken.sol";

contract UsdxTokenTester is UsdxToken {
    constructor(address _owner) UsdxToken(_owner) {}

    function unprotectedMint(address _account, uint256 _amount) external {
        _mint(_account, _amount);
    }
}
