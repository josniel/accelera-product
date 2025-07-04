// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./TestContracts/DevTestSetup.sol";

contract MulticollateralTest is DevTestSetup {
    uint256 NUM_COLLATERALS = 4;
    TestDeployer.LiquityContractsDev[] public contractsArray;

    function openMulticollateralTroveNoHints100pctWithIndex(
        uint256 _collIndex,
        address _account,
        uint256 _index,
        uint256 _coll,
        uint256 _usdxAmount,
        uint256 _annualInterestRate
    ) public returns (uint256 troveId) {
        TroveChange memory troveChange;
        troveChange.debtIncrease = _usdxAmount;
        troveChange.newWeightedRecordedDebt = troveChange.debtIncrease * _annualInterestRate;
        uint256 avgInterestRate =
            contractsArray[_collIndex].activePool.getNewApproxAvgInterestRateFromTroveChange(troveChange);
        uint256 upfrontFee = calcUpfrontFee(troveChange.debtIncrease, avgInterestRate);

        vm.startPrank(_account);

        troveId = contractsArray[_collIndex].borrowerOperations.openTrove(
            _account,
            _index,
            _coll,
            _usdxAmount,
            0, // _upperHint
            0, // _lowerHint
            _annualInterestRate,
            upfrontFee,
            address(0),
            address(0),
            address(0)
        );

        vm.stopPrank();
    }

    function makeMulticollateralSPDepositAndClaim(uint256 _collIndex, address _account, uint256 _amount) public {
        vm.startPrank(_account);
        contractsArray[_collIndex].stabilityPool.provideToSP(_amount, true);
        vm.stopPrank();
    }

    function setUp() public override {
        // Start tests at a non-zero timestamp
        vm.warp(block.timestamp + 600);

        accounts = new Accounts();
        createAccounts();

        (A, B, C, D, E, F, G) = (
            accountsList[0],
            accountsList[1],
            accountsList[2],
            accountsList[3],
            accountsList[4],
            accountsList[5],
            accountsList[6]
        );

        TestDeployer.TroveManagerParams[] memory troveManagerParamsArray =
            new TestDeployer.TroveManagerParams[](NUM_COLLATERALS);
        troveManagerParamsArray[0] = TestDeployer.TroveManagerParams(150e16, 110e16, 10e16, 110e16, 5e16, 10e16);
        troveManagerParamsArray[1] = TestDeployer.TroveManagerParams(160e16, 120e16, 10e16, 120e16, 5e16, 10e16);
        troveManagerParamsArray[2] = TestDeployer.TroveManagerParams(160e16, 120e16, 10e16, 120e16, 5e16, 10e16);
        troveManagerParamsArray[3] = TestDeployer.TroveManagerParams(160e16, 125e16, 10e16, 125e16, 5e16, 10e16);

        TestDeployer deployer = new TestDeployer();
        TestDeployer.LiquityContractsDev[] memory _contractsArray;
        (_contractsArray, collateralRegistry, usdxToken,,, WETH,) =
            deployer.deployAndConnectContractsMultiColl(troveManagerParamsArray);
        // Unimplemented feature (...):Copying of type struct LiquityContracts memory[] memory to storage not yet supported.
        for (uint256 c = 0; c < NUM_COLLATERALS; c++) {
            contractsArray.push(_contractsArray[c]);
        }
        // Set price feeds
        contractsArray[0].priceFeed.setPrice(2000e18);
        contractsArray[1].priceFeed.setPrice(200e18);
        contractsArray[2].priceFeed.setPrice(20000e18);
        contractsArray[3].priceFeed.setPrice(2500e18);
        // Just in case
        for (uint256 c = 4; c < NUM_COLLATERALS; c++) {
            contractsArray[c].priceFeed.setPrice(2000e18 + c * 1e18);
        }

        // Give some Collateral to test accounts, and approve it to BorrowerOperations
        uint256 initialCollateralAmount = 10_000e18;

        for (uint256 c = 0; c < NUM_COLLATERALS; c++) {
            for (uint256 i = 0; i < 6; i++) {
                // A to F
                giveAndApproveCollateral(
                    contractsArray[c].collToken,
                    accountsList[i],
                    initialCollateralAmount,
                    address(contractsArray[c].borrowerOperations)
                );
                // Approve WETH for gas compensation in all branches
                vm.startPrank(accountsList[i]);
                WETH.approve(address(contractsArray[c].borrowerOperations), type(uint256).max);
                vm.stopPrank();
            }
        }
    }

    function testMultiCollateralDeployment() public {
        // check deployment
        assertEq(collateralRegistry.totalCollaterals(), NUM_COLLATERALS, "Wrong number of branches");
        for (uint256 c = 0; c < NUM_COLLATERALS; c++) {
            assertNotEq(address(collateralRegistry.getToken(c)), ZERO_ADDRESS, "Missing collateral token");
            assertNotEq(address(collateralRegistry.getTroveManager(c)), ZERO_ADDRESS, "Missing TroveManager");
        }
        for (uint256 c = NUM_COLLATERALS; c < 10; c++) {
            assertEq(address(collateralRegistry.getToken(c)), ZERO_ADDRESS, "Extra collateral token");
            assertEq(address(collateralRegistry.getTroveManager(c)), ZERO_ADDRESS, "Extra TroveManager");
        }
        // reverts for invalid index
        vm.expectRevert("Invalid index");
        collateralRegistry.getToken(10);
        vm.expectRevert("Invalid index");
        collateralRegistry.getTroveManager(10);
    }

    struct TestValues {
        uint256 troveId;
        uint256 price;
        uint256 unbackedPortion;
        uint256 redeemAmount;
        uint256 fee;
        uint256 collInitialBalance;
        uint256 collFinalBalance;
        uint256 branchDebt;
        uint256 collTokenBalBefore_A;
        uint256 redeemed;
        uint256 correspondingETH;
        uint256 ETHFee;
        uint256 spUsdxAmount;
    }

    function testMultiCollateralRedemption() public {
        TestValues memory testValues1;
        TestValues memory testValues2;
        TestValues memory testValues3;
        TestValues memory testValues4;
        uint256 redeemAmount = 1600e18;

        // First collateral unbacked Usdx: 10k (SP empty)
        testValues1.troveId = openMulticollateralTroveNoHints100pctWithIndex(0, A, 0, 10e18, 10000e18, 5e16);

        // Second collateral unbacked Usdx: 5k
        testValues2.troveId = openMulticollateralTroveNoHints100pctWithIndex(1, A, 0, 100e18, 10000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(1, A, 5000e18);

        // Third collateral unbacked Usdx: 1k
        testValues3.troveId = openMulticollateralTroveNoHints100pctWithIndex(2, A, 0, 10e18, 10000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(2, A, 9000e18);

        // Fourth collateral unbacked Usdx: 0
        testValues4.troveId = openMulticollateralTroveNoHints100pctWithIndex(3, A, 0, 10e18, 10000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(3, A, 10000e18);

        // let time go by to reduce redemption rate (/16)
        vm.warp(block.timestamp + 1 days);

        // Check A’s final bal
        assertEq(usdxToken.balanceOf(A), 16000e18, "Wrong Usdx balance before redemption");

        // initial balances
        testValues1.collInitialBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collInitialBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collInitialBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collInitialBalance = contractsArray[3].collToken.balanceOf(A);

        testValues1.price = contractsArray[0].priceFeed.getPrice();
        testValues2.price = contractsArray[1].priceFeed.getPrice();
        testValues3.price = contractsArray[2].priceFeed.getPrice();
        testValues4.price = contractsArray[3].priceFeed.getPrice();

        testValues1.unbackedPortion = contractsArray[0].troveManager.getTroveEntireDebt(testValues1.troveId);
        testValues2.unbackedPortion = contractsArray[1].troveManager.getTroveEntireDebt(testValues2.troveId) - 5000e18;
        testValues3.unbackedPortion = contractsArray[2].troveManager.getTroveEntireDebt(testValues3.troveId) - 9000e18;
        testValues4.unbackedPortion = contractsArray[3].troveManager.getTroveEntireDebt(testValues4.troveId) - 10000e18;
        uint256 totalUnbacked = testValues1.unbackedPortion + testValues2.unbackedPortion + testValues3.unbackedPortion
            + testValues4.unbackedPortion;

        testValues1.redeemAmount = redeemAmount * testValues1.unbackedPortion / totalUnbacked;
        testValues2.redeemAmount = redeemAmount * testValues2.unbackedPortion / totalUnbacked;
        testValues3.redeemAmount = redeemAmount * testValues3.unbackedPortion / totalUnbacked;
        testValues4.redeemAmount = redeemAmount * testValues4.unbackedPortion / totalUnbacked;

        // fees
        uint256 fee = collateralRegistry.getEffectiveRedemptionFeeInUsdx(redeemAmount);
        testValues1.fee = fee * testValues1.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues1.price;
        testValues2.fee = fee * testValues2.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues2.price;
        testValues3.fee = fee * testValues3.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues3.price;
        testValues4.fee = fee * testValues4.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues4.price;

        // Check redemption rate
        assertApproxEqAbs(
            collateralRegistry.getRedemptionFeeWithDecay(redeemAmount),
            redeemAmount * (INITIAL_BASE_RATE / 16 + REDEMPTION_FEE_FLOOR) / DECIMAL_PRECISION,
            1e7,
            "Wrong redemption fee with decay"
        );

        uint256 initialUsdxSupply = usdxToken.totalSupply();

        // A redeems 1.6k
        redeem(A, redeemAmount);

        // Check redemption rate
        assertApproxEqAbs(
            collateralRegistry.getRedemptionRate(),
            INITIAL_BASE_RATE / 16 + REDEMPTION_FEE_FLOOR + redeemAmount * DECIMAL_PRECISION / initialUsdxSupply,
            1e5,
            "Wrong redemption rate"
        );

        // Check usdx balance
        assertApproxEqAbs(usdxToken.balanceOf(A), 14400e18, 10, "Wrong Usdx balance after redemption");

        // Check collateral balances
        // final balances
        testValues1.collFinalBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collFinalBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collFinalBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collFinalBalance = contractsArray[3].collToken.balanceOf(A);

        assertApproxEqAbs(
            testValues1.collFinalBalance - testValues1.collInitialBalance,
            testValues1.redeemAmount * DECIMAL_PRECISION / testValues1.price - testValues1.fee,
            1e14,
            "Wrong Collateral 1 balance"
        );
        assertApproxEqAbs(
            testValues2.collFinalBalance - testValues2.collInitialBalance,
            testValues2.redeemAmount * DECIMAL_PRECISION / testValues2.price - testValues2.fee,
            1e14,
            "Wrong Collateral 2 balance"
        );
        assertApproxEqAbs(
            testValues3.collFinalBalance - testValues3.collInitialBalance,
            testValues3.redeemAmount * DECIMAL_PRECISION / testValues3.price - testValues3.fee,
            1e13,
            "Wrong Collateral 3 balance"
        );
        assertApproxEqAbs(
            testValues4.collFinalBalance - testValues4.collInitialBalance,
            testValues4.redeemAmount * DECIMAL_PRECISION / testValues4.price - testValues4.fee,
            1e11,
            "Wrong Collateral 4 balance"
        );
    }

    function testMultiCollateralRedemptionFuzz(
        uint256 _spUsdxAmount1,
        uint256 _spUsdxAmount2,
        uint256 _spUsdxAmount3,
        uint256 _spUsdxAmount4,
        uint256 _redemptionFraction
    ) public {
        uint256 usdxAmount = 10000e18;
        uint256 minUsdxBalance = 1;
        // TODO: remove gas compensation
        _spUsdxAmount1 = bound(_spUsdxAmount1, 0, usdxAmount);
        _spUsdxAmount2 = bound(_spUsdxAmount2, 0, usdxAmount);
        _spUsdxAmount3 = bound(_spUsdxAmount3, 0, usdxAmount);
        _spUsdxAmount4 = bound(_spUsdxAmount4, 0, usdxAmount - minUsdxBalance);
        _redemptionFraction = bound(_redemptionFraction, DECIMAL_PRECISION / minUsdxBalance, DECIMAL_PRECISION);

        _testMultiCollateralRedemption(
            usdxAmount, _spUsdxAmount1, _spUsdxAmount2, _spUsdxAmount3, _spUsdxAmount4, _redemptionFraction
        );
    }

    function testMultiCollateralRedemptionMaxSPAmount() public {
        uint256 usdxAmount = 10000e18;
        uint256 minUsdxBalance = 1;

        _testMultiCollateralRedemption(
            usdxAmount,
            usdxAmount,
            usdxAmount,
            usdxAmount,
            usdxAmount - minUsdxBalance,
            DECIMAL_PRECISION / minUsdxBalance
        );
    }

    function _testMultiCollateralRedemption(
        uint256 _usdxAmount,
        uint256 _spUsdxAmount1,
        uint256 _spUsdxAmount2,
        uint256 _spUsdxAmount3,
        uint256 _spUsdxAmount4,
        uint256 _redemptionFraction
    ) internal {
        TestValues memory testValues1;
        TestValues memory testValues2;
        TestValues memory testValues3;
        TestValues memory testValues4;

        testValues1.price = contractsArray[0].priceFeed.getPrice();
        testValues2.price = contractsArray[1].priceFeed.getPrice();
        testValues3.price = contractsArray[2].priceFeed.getPrice();
        testValues4.price = contractsArray[3].priceFeed.getPrice();

        // First collateral
        openMulticollateralTroveNoHints100pctWithIndex(0, A, 0, 10e18, _usdxAmount, 5e16);
        if (_spUsdxAmount1 > 0) makeMulticollateralSPDepositAndClaim(0, A, _spUsdxAmount1);

        // Second collateral
        testValues2.troveId = openMulticollateralTroveNoHints100pctWithIndex(1, A, 0, 100e18, _usdxAmount, 5e16);
        if (_spUsdxAmount2 > 0) makeMulticollateralSPDepositAndClaim(1, A, _spUsdxAmount2);

        // Third collateral
        openMulticollateralTroveNoHints100pctWithIndex(2, A, 0, 10e18, _usdxAmount, 5e16);
        if (_spUsdxAmount3 > 0) makeMulticollateralSPDepositAndClaim(2, A, _spUsdxAmount3);

        // Fourth collateral
        openMulticollateralTroveNoHints100pctWithIndex(3, A, 0, 10e18, _usdxAmount, 5e16);
        if (_spUsdxAmount4 > 0) makeMulticollateralSPDepositAndClaim(3, A, _spUsdxAmount4);

        uint256 usdxBalance = usdxToken.balanceOf(A);
        // Check A’s final bal
        // TODO: change when we switch to new gas compensation
        //assertEq(usdxToken.balanceOf(A), _usdxAmount * 4 - _spUsdxAmount1 - _spUsdxAmount2 - _spUsdxAmount3 - _spUsdxAmount4, "Wrong Usdx balance before redemption");
        // Stack too deep
        //assertEq(usdxBalance, _usdxAmount * 4 - _spUsdxAmount1 - _spUsdxAmount2 - _spUsdxAmount3 - _spUsdxAmount4 - 800e18, "Wrong Usdx balance before redemption");

        uint256 redeemAmount = usdxBalance * _redemptionFraction / DECIMAL_PRECISION;

        // initial balances
        testValues1.collInitialBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collInitialBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collInitialBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collInitialBalance = contractsArray[3].collToken.balanceOf(A);

        testValues1.unbackedPortion = contractsArray[0].troveManager.getEntireBranchDebt() - _spUsdxAmount1;
        testValues2.unbackedPortion = contractsArray[1].troveManager.getEntireBranchDebt() - _spUsdxAmount2;
        testValues3.unbackedPortion = contractsArray[2].troveManager.getEntireBranchDebt() - _spUsdxAmount3;
        testValues4.unbackedPortion = contractsArray[3].troveManager.getEntireBranchDebt() - _spUsdxAmount4;
        uint256 totalUnbacked = testValues1.unbackedPortion + testValues2.unbackedPortion + testValues3.unbackedPortion
            + testValues4.unbackedPortion;

        testValues1.redeemAmount = redeemAmount * testValues1.unbackedPortion / totalUnbacked;
        testValues2.redeemAmount = redeemAmount * testValues2.unbackedPortion / totalUnbacked;
        testValues3.redeemAmount = redeemAmount * testValues3.unbackedPortion / totalUnbacked;
        testValues4.redeemAmount = redeemAmount * testValues4.unbackedPortion / totalUnbacked;

        // fees
        uint256 fee = collateralRegistry.getEffectiveRedemptionFeeInUsdx(redeemAmount);
        testValues1.fee = fee * testValues1.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues1.price;
        testValues2.fee = fee * testValues2.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues2.price;
        testValues3.fee = fee * testValues3.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues3.price;
        testValues4.fee = fee * testValues4.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues4.price;

        console.log(testValues1.fee, "fee1");
        console.log(testValues2.fee, "fee2");
        console.log(testValues3.fee, "fee3");
        console.log(testValues4.fee, "fee4");

        // A redeems
        vm.startPrank(A);
        collateralRegistry.redeemCollateral(redeemAmount, 0, 1e18);
        vm.stopPrank();

        // Check usdx balance
        assertApproxEqAbs(usdxToken.balanceOf(A), usdxBalance - redeemAmount, 10, "Wrong Usdx balance after redemption");

        // Check collateral balances
        // final balances
        testValues1.collFinalBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collFinalBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collFinalBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collFinalBalance = contractsArray[3].collToken.balanceOf(A);

        console.log(redeemAmount, "redeemAmount");
        console.log(testValues1.unbackedPortion, "testValues1.unbackedPortion");
        console.log(totalUnbacked, "totalUnbacked");
        console.log(testValues1.redeemAmount, "partial redeem amount 1");
        assertApproxEqAbs(
            testValues1.collFinalBalance - testValues1.collInitialBalance,
            testValues1.redeemAmount * DECIMAL_PRECISION / testValues1.price - testValues1.fee,
            10,
            "Wrong Collateral 1 balance"
        );
        assertApproxEqAbs(
            testValues2.collFinalBalance - testValues2.collInitialBalance,
            testValues2.redeemAmount * DECIMAL_PRECISION / testValues2.price - testValues2.fee,
            10,
            "Wrong Collateral 2 balance"
        );
        assertApproxEqAbs(
            testValues3.collFinalBalance - testValues3.collInitialBalance,
            testValues3.redeemAmount * DECIMAL_PRECISION / testValues3.price - testValues3.fee,
            10,
            "Wrong Collateral 3 balance"
        );
        assertApproxEqAbs(
            testValues4.collFinalBalance - testValues4.collInitialBalance,
            testValues4.redeemAmount * DECIMAL_PRECISION / testValues4.price - testValues4.fee,
            10,
            "Wrong Collateral 4 balance"
        );
    }

    function testMultiCollRedemptionIncreasesRedeemerETHBalanceByCorrespondingETHLessTheETHFee() public {
        TestValues memory testValues0;
        TestValues memory testValues1;
        TestValues memory testValues2;
        TestValues memory testValues3;

        uint256 usdxAmount = 100000e18;
        testValues0.spUsdxAmount = usdxAmount / 2;
        testValues1.spUsdxAmount = usdxAmount / 4;
        testValues2.spUsdxAmount = usdxAmount / 8;
        testValues3.spUsdxAmount = usdxAmount / 16;

        uint256 redemptionFraction = 25e16;

        testValues0.price = contractsArray[0].priceFeed.getPrice();
        testValues1.price = contractsArray[1].priceFeed.getPrice();
        testValues2.price = contractsArray[2].priceFeed.getPrice();
        testValues3.price = contractsArray[3].priceFeed.getPrice();

        // First collateral
        openMulticollateralTroveNoHints100pctWithIndex(0, A, 0, 100e18, usdxAmount, 5e16);
        makeMulticollateralSPDepositAndClaim(0, A, testValues0.spUsdxAmount);

        // Second collateral
        openMulticollateralTroveNoHints100pctWithIndex(1, A, 0, 1000e18, usdxAmount, 5e16);
        makeMulticollateralSPDepositAndClaim(1, A, testValues1.spUsdxAmount);

        // Third collateral
        openMulticollateralTroveNoHints100pctWithIndex(2, A, 0, 100e18, usdxAmount, 5e16);
        makeMulticollateralSPDepositAndClaim(2, A, testValues2.spUsdxAmount);

        // Fourth collateral
        openMulticollateralTroveNoHints100pctWithIndex(3, A, 0, 100e18, usdxAmount, 5e16);
        makeMulticollateralSPDepositAndClaim(3, A, testValues3.spUsdxAmount);

        uint256 usdxBalance = usdxToken.balanceOf(A);

        uint256 redeemAmount = usdxBalance * redemptionFraction / DECIMAL_PRECISION;
        uint256 expectedFeePct =
            collateralRegistry.getEffectiveRedemptionFeeInUsdx(redeemAmount) * DECIMAL_PRECISION / redeemAmount;
        assertGt(expectedFeePct, 0);

        // Get USDX debts from each branch
        testValues0.branchDebt = contractsArray[0].troveManager.getEntireBranchDebt();
        testValues1.branchDebt = contractsArray[1].troveManager.getEntireBranchDebt();
        testValues2.branchDebt = contractsArray[2].troveManager.getEntireBranchDebt();
        testValues3.branchDebt = contractsArray[3].troveManager.getEntireBranchDebt();

        testValues0.collTokenBalBefore_A = contractsArray[0].collToken.balanceOf(A);
        testValues1.collTokenBalBefore_A = contractsArray[1].collToken.balanceOf(A);
        testValues2.collTokenBalBefore_A = contractsArray[2].collToken.balanceOf(A);
        testValues3.collTokenBalBefore_A = contractsArray[3].collToken.balanceOf(A);

        // A redeems
        redeem(A, redeemAmount);

        // Check how much USDX was redeemed from each branch
        testValues0.redeemed = testValues0.branchDebt - contractsArray[0].troveManager.getEntireBranchDebt();
        testValues1.redeemed = testValues1.branchDebt - contractsArray[1].troveManager.getEntireBranchDebt();
        testValues2.redeemed = testValues2.branchDebt - contractsArray[2].troveManager.getEntireBranchDebt();
        testValues3.redeemed = testValues3.branchDebt - contractsArray[3].troveManager.getEntireBranchDebt();

        assertGt(testValues0.redeemed, 0);
        assertGt(testValues1.redeemed, 0);
        assertGt(testValues2.redeemed, 0);
        assertGt(testValues3.redeemed, 0);

        // Get corresponding ETH from each branch, and fee
        testValues0.correspondingETH = testValues0.redeemed * DECIMAL_PRECISION / testValues0.price;
        testValues1.correspondingETH = testValues1.redeemed * DECIMAL_PRECISION / testValues1.price;
        testValues2.correspondingETH = testValues2.redeemed * DECIMAL_PRECISION / testValues2.price;
        testValues3.correspondingETH = testValues3.redeemed * DECIMAL_PRECISION / testValues3.price;

        testValues0.ETHFee = testValues0.correspondingETH * expectedFeePct / DECIMAL_PRECISION;
        testValues1.ETHFee = testValues1.correspondingETH * expectedFeePct / DECIMAL_PRECISION;
        testValues2.ETHFee = testValues2.correspondingETH * expectedFeePct / DECIMAL_PRECISION;
        testValues3.ETHFee = testValues3.correspondingETH * expectedFeePct / DECIMAL_PRECISION;
        assertGt(testValues0.ETHFee, 0);
        assertGt(testValues1.ETHFee, 0);
        assertGt(testValues2.ETHFee, 0);
        assertGt(testValues3.ETHFee, 0);

        // Expect collToken balance of redeemer increased by drawn ETH, leaving the ETH fee in the branch
        assertApproxEqAbs(
            contractsArray[0].collToken.balanceOf(A) - testValues0.collTokenBalBefore_A,
            testValues0.correspondingETH - testValues0.ETHFee,
            20
        );
        assertApproxEqAbs(
            contractsArray[1].collToken.balanceOf(A) - testValues1.collTokenBalBefore_A,
            testValues1.correspondingETH - testValues1.ETHFee,
            100
        );
        assertApproxEqAbs(
            contractsArray[2].collToken.balanceOf(A) - testValues2.collTokenBalBefore_A,
            testValues2.correspondingETH - testValues2.ETHFee,
            20
        );
        assertApproxEqAbs(
            contractsArray[3].collToken.balanceOf(A) - testValues3.collTokenBalBefore_A,
            testValues3.correspondingETH - testValues3.ETHFee,
            20
        );
    }

    function testMultiCollateralRedemptionWithZeroUnbacked() public {
        TestValues memory testValues1;
        TestValues memory testValues2;
        TestValues memory testValues3;
        TestValues memory testValues4;
        uint256 redeemAmount = 1600e18;

        // First collateral unbacked Usdx: 10k (SP empty) - will be shutdown
        testValues1.troveId = openMulticollateralTroveNoHints100pctWithIndex(0, A, 0, 10e18, 10000e18, 5e16);

        // Second collateral unbacked Usdx: 0
        testValues2.troveId = openMulticollateralTroveNoHints100pctWithIndex(1, A, 0, 100e18, 10000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(1, A, 10100e18); // we put some more for interest

        // Third collateral unbacked Usdx: 0
        testValues3.troveId = openMulticollateralTroveNoHints100pctWithIndex(2, A, 0, 10e18, 4000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(2, A, 4100e18); // we put some more for interest

        // Fourth collateral unbacked Usdx: 0
        testValues4.troveId = openMulticollateralTroveNoHints100pctWithIndex(3, A, 0, 10e18, 2000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(3, A, 2100e18); // we put some more for interest

        // Check A’s final bal
        // 10k of first branch - 3 * 100 in the other SPs
        assertEq(usdxToken.balanceOf(A), 9700e18, "Wrong Usdx balance before redemption");

        // initial balances
        testValues1.collInitialBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collInitialBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collInitialBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collInitialBalance = contractsArray[3].collToken.balanceOf(A);

        // Shut first branch down
        contractsArray[0].priceFeed.setPrice(1000e18);
        contractsArray[0].borrowerOperations.shutdown();

        // First branch is shutdown, the other 3 are fully backed
        assertGt(contractsArray[0].troveManager.shutdownTime(), 0, "First branch should be shut down");
        (uint256 unbackedPortion1,,) = contractsArray[1].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion1, 0, "Second branch should be fully backed");
        (uint256 unbackedPortion2,,) = contractsArray[2].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion2, 0, "Third branch should be fully backed");
        (uint256 unbackedPortion3,,) = contractsArray[3].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion3, 0, "Fourth branch should be fully backed");

        testValues1.price = contractsArray[0].priceFeed.getPrice();
        testValues2.price = contractsArray[1].priceFeed.getPrice();
        testValues3.price = contractsArray[2].priceFeed.getPrice();
        testValues4.price = contractsArray[3].priceFeed.getPrice();

        // Effectively (second loop in CollateralRegistry.redeemCollateral)
        testValues1.unbackedPortion = 0;
        testValues2.unbackedPortion = contractsArray[1].troveManager.getTroveEntireDebt(testValues2.troveId);
        testValues3.unbackedPortion = contractsArray[2].troveManager.getTroveEntireDebt(testValues3.troveId);
        testValues4.unbackedPortion = contractsArray[3].troveManager.getTroveEntireDebt(testValues4.troveId);
        uint256 totalUnbacked = testValues1.unbackedPortion + testValues2.unbackedPortion + testValues3.unbackedPortion
            + testValues4.unbackedPortion;

        testValues1.redeemAmount = redeemAmount * testValues1.unbackedPortion / totalUnbacked;
        testValues2.redeemAmount = redeemAmount * testValues2.unbackedPortion / totalUnbacked;
        testValues3.redeemAmount = redeemAmount * testValues3.unbackedPortion / totalUnbacked;
        testValues4.redeemAmount = redeemAmount * testValues4.unbackedPortion / totalUnbacked;

        // fees
        uint256 fee = collateralRegistry.getEffectiveRedemptionFeeInUsdx(redeemAmount);
        testValues1.fee = fee * testValues1.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues1.price;
        testValues2.fee = fee * testValues2.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues2.price;
        testValues3.fee = fee * testValues3.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues3.price;
        testValues4.fee = fee * testValues4.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues4.price;

        // A redeems 1.6k
        redeem(A, redeemAmount);

        // Check usdx balance
        assertApproxEqAbs(usdxToken.balanceOf(A), 8100e18, 10, "Wrong Usdx balance after redemption");

        // Check collateral balances
        // final balances
        testValues1.collFinalBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collFinalBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collFinalBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collFinalBalance = contractsArray[3].collToken.balanceOf(A);

        assertApproxEqAbs(
            testValues1.collFinalBalance - testValues1.collInitialBalance,
            testValues1.redeemAmount * DECIMAL_PRECISION / testValues1.price - testValues1.fee,
            1e14,
            "Wrong Collateral 1 balance"
        );
        assertApproxEqAbs(
            testValues2.collFinalBalance - testValues2.collInitialBalance,
            testValues2.redeemAmount * DECIMAL_PRECISION / testValues2.price - testValues2.fee,
            1e14,
            "Wrong Collateral 2 balance"
        );
        assertApproxEqAbs(
            testValues3.collFinalBalance - testValues3.collInitialBalance,
            testValues3.redeemAmount * DECIMAL_PRECISION / testValues3.price - testValues3.fee,
            1e13,
            "Wrong Collateral 3 balance"
        );
        assertApproxEqAbs(
            testValues4.collFinalBalance - testValues4.collInitialBalance,
            testValues4.redeemAmount * DECIMAL_PRECISION / testValues4.price - testValues4.fee,
            1e11,
            "Wrong Collateral 4 balance"
        );
    }

    function testMultiCollateralRedemptionWithZeroUnbackedLowSCRButNoShutdown() public {
        TestValues memory testValues1;
        TestValues memory testValues2;
        TestValues memory testValues3;
        TestValues memory testValues4;
        uint256 redeemAmount = 1600e18;

        // First collateral unbacked Usdx: 10k (SP empty) - will become below SCR
        testValues1.troveId = openMulticollateralTroveNoHints100pctWithIndex(0, A, 0, 10e18, 10000e18, 5e16);

        // Second collateral unbacked Usdx: 0
        testValues2.troveId = openMulticollateralTroveNoHints100pctWithIndex(1, A, 0, 100e18, 10000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(1, A, 10100e18); // we put some more for interest

        // Third collateral unbacked Usdx: 0
        testValues3.troveId = openMulticollateralTroveNoHints100pctWithIndex(2, A, 0, 10e18, 4000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(2, A, 4100e18); // we put some more for interest

        // Fourth collateral unbacked Usdx: 0
        testValues4.troveId = openMulticollateralTroveNoHints100pctWithIndex(3, A, 0, 10e18, 2000e18, 5e16);
        makeMulticollateralSPDepositAndClaim(3, A, 2100e18); // we put some more for interest

        // Check A’s final bal
        // 10k of first branch - 3 * 100 in the other SPs
        assertEq(usdxToken.balanceOf(A), 9700e18, "Wrong Usdx balance before redemption");

        // initial balances
        testValues1.collInitialBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collInitialBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collInitialBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collInitialBalance = contractsArray[3].collToken.balanceOf(A);

        // Bring first branch below SCR
        contractsArray[0].priceFeed.setPrice(1000e18);

        testValues1.price = contractsArray[0].priceFeed.getPrice();
        testValues2.price = contractsArray[1].priceFeed.getPrice();
        testValues3.price = contractsArray[2].priceFeed.getPrice();
        testValues4.price = contractsArray[3].priceFeed.getPrice();

        // First branch is shutdown, the other 3 are fully backed
        assertEq(contractsArray[0].troveManager.shutdownTime(), 0, "First branch should not be shut down");
        assertLt(
            contractsArray[0].troveManager.getTCR(testValues1.price),
            contractsArray[0].troveManager.get_SCR(),
            "First branch should be below SCR"
        );
        (uint256 unbackedPortion1,,) = contractsArray[1].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion1, 0, "Second branch should be fully backed");
        (uint256 unbackedPortion2,,) = contractsArray[2].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion2, 0, "Third branch should be fully backed");
        (uint256 unbackedPortion3,,) = contractsArray[3].troveManager.getUnbackedPortionPriceAndRedeemability();
        assertEq(unbackedPortion3, 0, "Fourth branch should be fully backed");

        // Effectively (second loop in CollateralRegistry.redeemCollateral)
        testValues1.unbackedPortion = 0;
        testValues2.unbackedPortion = contractsArray[1].troveManager.getTroveEntireDebt(testValues2.troveId);
        testValues3.unbackedPortion = contractsArray[2].troveManager.getTroveEntireDebt(testValues3.troveId);
        testValues4.unbackedPortion = contractsArray[3].troveManager.getTroveEntireDebt(testValues4.troveId);
        uint256 totalUnbacked = testValues1.unbackedPortion + testValues2.unbackedPortion + testValues3.unbackedPortion
            + testValues4.unbackedPortion;

        testValues1.redeemAmount = redeemAmount * testValues1.unbackedPortion / totalUnbacked;
        testValues2.redeemAmount = redeemAmount * testValues2.unbackedPortion / totalUnbacked;
        testValues3.redeemAmount = redeemAmount * testValues3.unbackedPortion / totalUnbacked;
        testValues4.redeemAmount = redeemAmount * testValues4.unbackedPortion / totalUnbacked;

        // fees
        uint256 fee = collateralRegistry.getEffectiveRedemptionFeeInUsdx(redeemAmount);
        testValues1.fee = fee * testValues1.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues1.price;
        testValues2.fee = fee * testValues2.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues2.price;
        testValues3.fee = fee * testValues3.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues3.price;
        testValues4.fee = fee * testValues4.redeemAmount / redeemAmount * DECIMAL_PRECISION / testValues4.price;

        // A redeems 1.6k
        redeem(A, redeemAmount);

        // Check usdx balance
        assertApproxEqAbs(usdxToken.balanceOf(A), 8100e18, 10, "Wrong Usdx balance after redemption");

        // Check collateral balances
        // final balances
        testValues1.collFinalBalance = contractsArray[0].collToken.balanceOf(A);
        testValues2.collFinalBalance = contractsArray[1].collToken.balanceOf(A);
        testValues3.collFinalBalance = contractsArray[2].collToken.balanceOf(A);
        testValues4.collFinalBalance = contractsArray[3].collToken.balanceOf(A);

        assertApproxEqAbs(
            testValues1.collFinalBalance - testValues1.collInitialBalance,
            testValues1.redeemAmount * DECIMAL_PRECISION / testValues1.price - testValues1.fee,
            1e14,
            "Wrong Collateral 1 balance"
        );
        assertApproxEqAbs(
            testValues2.collFinalBalance - testValues2.collInitialBalance,
            testValues2.redeemAmount * DECIMAL_PRECISION / testValues2.price - testValues2.fee,
            1e14,
            "Wrong Collateral 2 balance"
        );
        assertApproxEqAbs(
            testValues3.collFinalBalance - testValues3.collInitialBalance,
            testValues3.redeemAmount * DECIMAL_PRECISION / testValues3.price - testValues3.fee,
            1e13,
            "Wrong Collateral 3 balance"
        );
        assertApproxEqAbs(
            testValues4.collFinalBalance - testValues4.collInitialBalance,
            testValues4.redeemAmount * DECIMAL_PRECISION / testValues4.price - testValues4.fee,
            1e11,
            "Wrong Collateral 4 balance"
        );
    }
}
