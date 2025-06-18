// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {UseDeployment} from "test/Utils/UseDeployment.sol";

contract ProvideCurveLiquidity is Script, UseDeployment {
    function run() external {
        vm.startBroadcast();
        _loadDeploymentFromManifest("deployment-manifest.json");

        uint256 usdxAmount = 200_000 ether;
        uint256 usdcAmount = usdxAmount * 10 ** usdc.decimals() / 10 ** usdxToken.decimals();

        uint256[] memory amounts = new uint256[](2);
        (amounts[0], amounts[1]) = curveUsdcUsdx.coins(0) == USDX ? (usdxAmount, usdcAmount) : (usdcAmount, usdxAmount);

        usdxToken.approve(address(curveUsdcUsdx), usdxAmount);
        usdc.approve(address(curveUsdcUsdx), usdcAmount);
        curveUsdcUsdx.add_liquidity(amounts, 0);
    }
}
