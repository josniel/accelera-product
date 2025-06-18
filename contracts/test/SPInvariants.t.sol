// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUsdxToken} from "src/Interfaces/IUsdxToken.sol";
import {IStabilityPool} from "src/Interfaces/IStabilityPool.sol";
import {HintHelpers} from "src/HintHelpers.sol";
import {Assertions} from "./TestContracts/Assertions.sol";
import {BaseInvariantTest} from "./TestContracts/BaseInvariantTest.sol";
import {TestDeployer} from "./TestContracts/Deployment.t.sol";
import {SPInvariantsTestHandler} from "./TestContracts/SPInvariantsTestHandler.t.sol";

abstract contract SPInvariantsBase is Assertions, BaseInvariantTest {
    IStabilityPool stabilityPool;
    SPInvariantsTestHandler handler;

    function setUp() public override {
        super.setUp();

        TestDeployer deployer = new TestDeployer();
        (TestDeployer.LiquityContractsDev memory contracts,, IUsdxToken usdxToken, HintHelpers hintHelpers,,,) =
            deployer.deployAndConnectContracts();
        stabilityPool = contracts.stabilityPool;

        handler = new SPInvariantsTestHandler(
            SPInvariantsTestHandler.Contracts({
                usdxToken: usdxToken,
                borrowerOperations: contracts.borrowerOperations,
                collateralToken: contracts.collToken,
                priceFeed: contracts.priceFeed,
                stabilityPool: contracts.stabilityPool,
                troveManager: contracts.troveManager,
                collSurplusPool: contracts.pools.collSurplusPool
            }),
            hintHelpers
        );

        vm.label(address(handler), "handler");
        targetContract(address(handler));
    }

    function assert_AllFundsClaimable() internal view {
        uint256 stabilityPoolColl = stabilityPool.getCollBalance();
        uint256 stabilityPoolUsdx = stabilityPool.getTotalUsdxDeposits();
        uint256 yieldGainsOwed = stabilityPool.getYieldGainsOwed();

        uint256 claimableColl = 0;
        uint256 claimableUsdx = 0;
        uint256 sumYieldGains = 0;

        for (uint256 i = 0; i < actors.length; ++i) {
            claimableColl += stabilityPool.getDepositorCollGain(actors[i].account);
            claimableUsdx += stabilityPool.getCompoundedUsdxDeposit(actors[i].account);
            sumYieldGains += stabilityPool.getDepositorYieldGain(actors[i].account);
        }

        // These tolerances might seem quite loose, but we have to consider
        // that we're dealing with quintillions of USDX in this test
        assertGeDecimal(stabilityPoolColl, claimableColl, 18, "SP coll insolvency");
        assertApproxEqAbsRelDecimal(stabilityPoolColl, claimableColl, 1e-5 ether, 1, 18, "SP coll loss");

        assertGeDecimal(stabilityPoolUsdx, claimableUsdx, 18, "SP USDX insolvency");
        assertApproxEqAbsRelDecimal(stabilityPoolUsdx, claimableUsdx, 1e-7 ether, 1, 18, "SP USDX loss");

        assertGeDecimal(yieldGainsOwed, sumYieldGains, 18, "SP yield insolvency");
        assertApproxEqAbsRelDecimal(yieldGainsOwed, sumYieldGains, 1 ether, 1, 18, "SP yield loss");
    }
}

contract SPInvariantsTest is SPInvariantsBase {
    function invariant_AllFundsClaimable() external view {
        assert_AllFundsClaimable();
    }
}
