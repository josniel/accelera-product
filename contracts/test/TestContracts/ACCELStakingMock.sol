// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

contract ACCELStakingMock {
    function setAddresses(
        address _accelTokenAddress,
        address _usdxTokenAddress,
        address _troveManagerAddress,
        address _borrowerOperationsAddress,
        address _activePoolAddress
    ) external {}

    function stake(uint256 _ACCELamount) external {}

    function unstake(uint256 _ACCELamount) external {}

    function increaseF_ETH(uint256 _ETHFee) external {}

    function increaseF_usdx(uint256 _ACCELFee) external {}

    function getPendingETHGain(address _user) external view returns (uint256) {}

    function getPendingUsdxGain(address _user) external view returns (uint256) {}
}
