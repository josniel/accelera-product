// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IUsdxToken} from "src/Interfaces/IUsdxToken.sol";
import {ICollateralRegistry} from "src/Interfaces/ICollateralRegistry.sol";
import {IWETH} from "src/Interfaces/IWETH.sol";
import {HintHelpers} from "src/HintHelpers.sol";
import {TestDeployer} from "./Deployment.t.sol";

contract BaseMultiCollateralTest {
    struct Contracts {
        IWETH weth;
        ICollateralRegistry collateralRegistry;
        IUsdxToken usdxToken;
        HintHelpers hintHelpers;
        TestDeployer.LiquityContractsDev[] branches;
    }

    IERC20 weth;
    ICollateralRegistry collateralRegistry;
    IUsdxToken usdxToken;
    HintHelpers hintHelpers;
    TestDeployer.LiquityContractsDev[] branches;

    function setupContracts(Contracts memory contracts) internal {
        weth = contracts.weth;
        collateralRegistry = contracts.collateralRegistry;
        usdxToken = contracts.usdxToken;
        hintHelpers = contracts.hintHelpers;

        for (uint256 i = 0; i < contracts.branches.length; ++i) {
            branches.push(contracts.branches[i]);
        }
    }
}
