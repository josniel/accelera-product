// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./TestContracts/DevTestSetup.sol";
import "./TestContracts/WETH.sol";
import "src/Zappers/WETHZapper.sol";

contract ZapperWETHTest is DevTestSetup {
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

        WETH = new WETH9();

        TestDeployer.TroveManagerParams[] memory troveManagerParams = new TestDeployer.TroveManagerParams[](1);
        troveManagerParams[0] = TestDeployer.TroveManagerParams(150e16, 110e16, 10e16, 110e16, 5e16, 10e16);

        TestDeployer deployer = new TestDeployer();
        TestDeployer.LiquityContractsDev[] memory contractsArray;
        TestDeployer.Zappers[] memory zappersArray;
        (contractsArray, collateralRegistry, usdxToken,,, zappersArray) =
            deployer.deployAndConnectContracts(troveManagerParams, WETH);

        // Set price feeds
        contractsArray[0].priceFeed.setPrice(2000e18);

        // Give some Collateral to test accounts
        uint256 initialCollateralAmount = 10_000e18;

        // A to F
        for (uint256 i = 0; i < 6; i++) {
            // Give some raw ETH to test accounts
            deal(accountsList[i], initialCollateralAmount);
        }

        // Set first branch as default
        addressesRegistry = contractsArray[0].addressesRegistry;
        borrowerOperations = contractsArray[0].borrowerOperations;
        troveManager = contractsArray[0].troveManager;
        troveNFT = contractsArray[0].troveNFT;
        wethZapper = zappersArray[0].wethZapper;
    }

    function testCanOpenTrove() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        uint256 ethBalanceBefore = A.balance;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: 5e16,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        assertEq(troveNFT.ownerOf(troveId), A, "Wrong owner");
        assertGt(troveId, 0, "Trove id should be set");
        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount, "Coll mismatch");
        assertGt(troveManager.getTroveEntireDebt(troveId), usdxAmount, "Debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxAmount, "USDX bal mismatch");
        assertEq(A.balance, ethBalanceBefore - (ethAmount + ETH_GAS_COMPENSATION), "ETH bal mismatch");
    }

    function testCanOpenTroveWithBatchManager() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        uint256 ethBalanceBefore = A.balance;

        registerBatchManager(B);

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: 0,
            batchManager: B,
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        assertEq(troveNFT.ownerOf(troveId), A, "Wrong owner");
        assertGt(troveId, 0, "Trove id should be set");
        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount, "Coll mismatch");
        assertGt(troveManager.getTroveEntireDebt(troveId), usdxAmount, "Debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxAmount, "USDX bal mismatch");
        assertEq(A.balance, ethBalanceBefore - (ethAmount + ETH_GAS_COMPENSATION), "ETH bal mismatch");
        assertEq(borrowerOperations.interestBatchManagerOf(troveId), B, "Wrong batch manager");
        (,,,,,,,, address tmBatchManagerAddress,) = troveManager.Troves(troveId);
        assertEq(tmBatchManagerAddress, B, "Wrong batch manager (TM)");
    }

    function testCanNotOpenTroveWithBatchManagerAndInterest() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        registerBatchManager(B);

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: 5e16,
            batchManager: B,
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        vm.expectRevert("WZ: Cannot choose interest if joining a batch");
        wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();
    }

    function testCanAddColl() external {
        uint256 ethAmount1 = 10 ether;
        uint256 usdxAmount = 10000e18;
        uint256 ethAmount2 = 5 ether;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: 5e16,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount1 + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 ethBalanceBefore = A.balance;
        vm.startPrank(A);
        wethZapper.addCollWithRawETH{value: ethAmount2}(troveId);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount1 + ethAmount2, "Coll mismatch");
        assertGt(troveManager.getTroveEntireDebt(troveId), usdxAmount, "Debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxAmount, "USDX bal mismatch");
        assertEq(A.balance, ethBalanceBefore - ethAmount2, "ETH bal mismatch");
    }

    function testCanWithdrawColl() external {
        uint256 ethAmount1 = 10 ether;
        uint256 usdxAmount = 10000e18;
        uint256 ethAmount2 = 1 ether;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: 5e16,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount1 + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 ethBalanceBefore = A.balance;
        vm.startPrank(A);
        wethZapper.withdrawCollToRawETH(troveId, ethAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount1 - ethAmount2, "Coll mismatch");
        assertGt(troveManager.getTroveEntireDebt(troveId), usdxAmount, "Debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxAmount, "USDX bal mismatch");
        assertEq(A.balance, ethBalanceBefore + ethAmount2, "ETH bal mismatch");
    }

    function testCanNotAddReceiverWithoutRemoveManager() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount1 = 10000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        // Try to add a receiver for the zapper without remove manager
        vm.startPrank(A);
        vm.expectRevert(AddRemoveManagers.EmptyManager.selector);
        wethZapper.setRemoveManagerWithReceiver(troveId, address(0), B);
        vm.stopPrank();
    }

    function testCanRepayUsdx() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount1 = 10000e18;
        uint256 usdxAmount2 = 1000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 usdxBalanceBeforeB = usdxToken.balanceOf(B);
        uint256 ethBalanceBeforeB = B.balance;

        // Add a remove manager for the zapper, and send usdx
        vm.startPrank(A);
        wethZapper.setRemoveManagerWithReceiver(troveId, B, A);
        usdxToken.transfer(B, usdxAmount2);
        vm.stopPrank();

        // Approve and repay
        vm.startPrank(B);
        usdxToken.approve(address(wethZapper), usdxAmount2);
        wethZapper.repayUsdx(troveId, usdxAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount, "Trove coll mismatch");
        assertApproxEqAbs(
            troveManager.getTroveEntireDebt(troveId), usdxAmount1 - usdxAmount2, 2e18, "Trove  debt mismatch"
        );
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA - usdxAmount2, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), usdxBalanceBeforeB, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB, "B ETH bal mismatch");
    }

    function testCanWithdrawUsdx() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount1 = 10000e18;
        uint256 usdxAmount2 = 1000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 usdxBalanceBeforeB = usdxToken.balanceOf(B);
        uint256 ethBalanceBeforeB = B.balance;

        // Add a remove manager for the zapper
        vm.startPrank(A);
        wethZapper.setRemoveManagerWithReceiver(troveId, B, A);
        vm.stopPrank();

        // Withdraw usdx
        vm.startPrank(B);
        wethZapper.withdrawUsdx(troveId, usdxAmount2, usdxAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount, "Trove coll mismatch");
        assertApproxEqAbs(
            troveManager.getTroveEntireDebt(troveId), usdxAmount1 + usdxAmount2, 2e18, "Trove  debt mismatch"
        );
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA + usdxAmount2, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), usdxBalanceBeforeB, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB, "B ETH bal mismatch");
    }

    // TODO: more adjustment combinations
    function testCanAdjustTroveWithdrawCollAndUsdx() external {
        uint256 ethAmount1 = 10 ether;
        uint256 ethAmount2 = 1 ether;
        uint256 usdxAmount1 = 10000e18;
        uint256 usdxAmount2 = 1000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount1 + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 usdxBalanceBeforeB = usdxToken.balanceOf(B);
        uint256 ethBalanceBeforeB = B.balance;

        // Add a remove manager for the zapper
        vm.startPrank(A);
        wethZapper.setRemoveManagerWithReceiver(troveId, B, A);
        vm.stopPrank();

        // Adjust (withdraw coll and Usdx)
        vm.startPrank(B);
        wethZapper.adjustTroveWithRawETH(troveId, ethAmount2, false, usdxAmount2, true, usdxAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount1 - ethAmount2, "Trove coll mismatch");
        assertApproxEqAbs(
            troveManager.getTroveEntireDebt(troveId), usdxAmount1 + usdxAmount2, 2e18, "Trove  debt mismatch"
        );
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA + usdxAmount2, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA + ethAmount2, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), usdxBalanceBeforeB, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB, "B ETH bal mismatch");
    }

    function testCanAdjustTroveAddCollAndUsdx() external {
        uint256 ethAmount1 = 10 ether;
        uint256 ethAmount2 = 1 ether;
        uint256 usdxAmount1 = 10000e18;
        uint256 usdxAmount2 = 1000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount1 + ETH_GAS_COMPENSATION}(params);
        // A sends Usdx to B
        usdxToken.transfer(B, usdxAmount2);
        vm.stopPrank();

        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 usdxBalanceBeforeB = usdxToken.balanceOf(B);
        uint256 ethBalanceBeforeB = B.balance;

        // Add an add manager for the zapper
        vm.startPrank(A);
        wethZapper.setAddManager(troveId, B);
        vm.stopPrank();

        // Adjust (add coll and Usdx)
        vm.startPrank(B);
        usdxToken.approve(address(wethZapper), usdxAmount2);
        wethZapper.adjustTroveWithRawETH{value: ethAmount2}(troveId, ethAmount2, true, usdxAmount2, false, usdxAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), ethAmount1 + ethAmount2, "Trove coll mismatch");
        assertApproxEqAbs(
            troveManager.getTroveEntireDebt(troveId), usdxAmount1 - usdxAmount2, 2e18, "Trove  debt mismatch"
        );
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), usdxBalanceBeforeB - usdxAmount2, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB - ethAmount2, "B ETH bal mismatch");
    }

    function testCanAdjustZombieTroveWithdrawCollAndUsdx() external {
        uint256 ethAmount1 = 10 ether;
        uint256 ethAmount2 = 1 ether;
        uint256 usdxAmount1 = 10000e18;
        uint256 usdxAmount2 = 1000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount1,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount1 + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        // Add a remove manager for the zapper
        vm.startPrank(A);
        wethZapper.setRemoveManagerWithReceiver(troveId, B, A);
        vm.stopPrank();

        // Redeem to make trove zombie
        vm.startPrank(A);
        collateralRegistry.redeemCollateral(usdxAmount1 - usdxAmount2, 10, 1e18);
        vm.stopPrank();

        uint256 troveCollBefore = troveManager.getTroveEntireColl(troveId);
        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 ethBalanceBeforeB = B.balance;

        // Adjust (withdraw coll and Usdx)
        vm.startPrank(B);
        wethZapper.adjustZombieTroveWithRawETH(troveId, ethAmount2, false, usdxAmount2, true, 0, 0, usdxAmount2);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), troveCollBefore - ethAmount2, "Trove coll mismatch");
        assertApproxEqAbs(troveManager.getTroveEntireDebt(troveId), 2 * usdxAmount2, 2e18, "Trove  debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA + usdxAmount2, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA + ethAmount2, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), 0, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB, "B ETH bal mismatch");
    }

    function testCanAdjustZombieTroveAddCollAndWithdrawUsdx() external {
        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: 10000e18,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: 10 ether + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        // Add a remove manager for the zapper
        vm.startPrank(A);
        wethZapper.setRemoveManagerWithReceiver(troveId, B, A);
        vm.stopPrank();

        uint256 ethAmount2 = 1 ether;
        uint256 usdxAmount2 = 1000e18;

        // Redeem to make trove zombie
        vm.startPrank(A);
        collateralRegistry.redeemCollateral(10000e18 - usdxAmount2, 10, 1e18);
        vm.stopPrank();

        uint256 troveCollBefore = troveManager.getTroveEntireColl(troveId);
        uint256 usdxBalanceBeforeA = usdxToken.balanceOf(A);
        uint256 ethBalanceBeforeA = A.balance;
        uint256 ethBalanceBeforeB = B.balance;

        // Adjust (add coll and withdraw Usdx)
        vm.startPrank(B);
        wethZapper.adjustZombieTroveWithRawETH{value: ethAmount2}(
            troveId, ethAmount2, true, usdxAmount2, true, 0, 0, usdxAmount2
        );
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), troveCollBefore + ethAmount2, "Trove coll mismatch");
        assertApproxEqAbs(troveManager.getTroveEntireDebt(troveId), 2 * usdxAmount2, 2e18, "Trove  debt mismatch");
        assertEq(usdxToken.balanceOf(A), usdxBalanceBeforeA + usdxAmount2, "A USDX bal mismatch");
        assertEq(A.balance, ethBalanceBeforeA, "A ETH bal mismatch");
        assertEq(usdxToken.balanceOf(B), 0, "B USDX bal mismatch");
        assertEq(B.balance, ethBalanceBeforeB - ethAmount2, "B ETH bal mismatch");
    }

    function testCanCloseTrove() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        uint256 ethBalanceBefore = A.balance;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        // open a 2nd trove so we can close the 1st one, and send Usdx to account for interest and fee
        vm.startPrank(B);
        deal(address(WETH), B, 100 ether + ETH_GAS_COMPENSATION);
        WETH.approve(address(borrowerOperations), 100 ether + ETH_GAS_COMPENSATION);
        borrowerOperations.openTrove(
            B,
            0, // index,
            100 ether, // coll,
            10000e18, //usdxAmount,
            0, // _upperHint
            0, // _lowerHint
            MIN_ANNUAL_INTEREST_RATE, // annualInterestRate,
            10000e18, // upfrontFee
            address(0),
            address(0),
            address(0)
        );
        usdxToken.transfer(A, troveManager.getTroveEntireDebt(troveId) - usdxAmount);
        vm.stopPrank();

        vm.startPrank(A);
        usdxToken.approve(address(wethZapper), type(uint256).max);
        wethZapper.closeTroveToRawETH(troveId);
        vm.stopPrank();

        assertEq(troveManager.getTroveEntireColl(troveId), 0, "Coll mismatch");
        assertEq(troveManager.getTroveEntireDebt(troveId), 0, "Debt mismatch");
        assertEq(usdxToken.balanceOf(A), 0, "USDX bal mismatch");
        assertEq(A.balance, ethBalanceBefore, "ETH bal mismatch");
    }

    function testExcessRepaymentByAdjustGoesBackToUser() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 ethBalanceBefore = A.balance;
        uint256 collBalanceBefore = WETH.balanceOf(A);
        uint256 usdxDebtBefore = troveManager.getTroveEntireDebt(troveId);

        // Adjust trove: remove 1 ETH and try to repay 9k (only will repay ~8k, up to MIN_DEBT)
        vm.startPrank(A);
        usdxToken.approve(address(wethZapper), type(uint256).max);
        wethZapper.adjustTroveWithRawETH(troveId, 1 ether, false, 9000e18, false, 0);
        vm.stopPrank();

        assertEq(usdxToken.balanceOf(A), usdxAmount + MIN_DEBT - usdxDebtBefore, "USDX bal mismatch");
        assertEq(usdxToken.balanceOf(address(wethZapper)), 0, "Zapper USDX bal should be zero");
        assertEq(A.balance, ethBalanceBefore + 1 ether, "ETH bal mismatch");
        assertEq(address(wethZapper).balance, 0, "Zapper ETH bal should be zero");
        assertEq(WETH.balanceOf(A), collBalanceBefore, "Coll bal mismatch");
        assertEq(WETH.balanceOf(address(wethZapper)), 0, "Zapper Coll bal should be zero");
    }

    function testExcessRepaymentByRepayGoesBackToUser() external {
        uint256 ethAmount = 10 ether;
        uint256 usdxAmount = 10000e18;

        IZapper.OpenTroveParams memory params = IZapper.OpenTroveParams({
            owner: A,
            ownerIndex: 0,
            collAmount: 0, // not needed
            usdxAmount: usdxAmount,
            upperHint: 0,
            lowerHint: 0,
            annualInterestRate: MIN_ANNUAL_INTEREST_RATE,
            batchManager: address(0),
            maxUpfrontFee: 1000e18,
            addManager: address(0),
            removeManager: address(0),
            receiver: address(0)
        });
        vm.startPrank(A);
        uint256 troveId = wethZapper.openTroveWithRawETH{value: ethAmount + ETH_GAS_COMPENSATION}(params);
        vm.stopPrank();

        uint256 usdxDebtBefore = troveManager.getTroveEntireDebt(troveId);
        uint256 collBalanceBefore = WETH.balanceOf(A);

        // Adjust trove: try to repay 9k (only will repay ~8k, up to MIN_DEBT)
        vm.startPrank(A);
        usdxToken.approve(address(wethZapper), type(uint256).max);
        wethZapper.repayUsdx(troveId, 9000e18);
        vm.stopPrank();

        assertEq(usdxToken.balanceOf(A), usdxAmount + MIN_DEBT - usdxDebtBefore, "USDX bal mismatch");
        assertEq(usdxToken.balanceOf(address(wethZapper)), 0, "Zapper USDX bal should be zero");
        assertEq(address(wethZapper).balance, 0, "Zapper ETH bal should be zero");
        assertEq(WETH.balanceOf(A), collBalanceBefore, "Coll bal mismatch");
        assertEq(WETH.balanceOf(address(wethZapper)), 0, "Zapper Coll bal should be zero");
    }

    // TODO: tests for add/remove managers of zapper contract
}
