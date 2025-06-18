// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

contract CommunityIssuanceMock {
    function setAddresses(address _accelTokenAddress, address _stabilityPoolAddress) external {}

    function issueACCEL() external returns (uint256) {}

    function sendACCEL(address _account, uint256 _ACCELamount) external {}
}
