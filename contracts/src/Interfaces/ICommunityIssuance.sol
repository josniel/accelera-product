// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICommunityIssuance {
    function setAddresses(address _accelTokenAddress, address _stabilityPoolAddress) external;

    function issueACCEL() external returns (uint256);

    function sendACCEL(address _account, uint256 _ACCELamount) external;
}
