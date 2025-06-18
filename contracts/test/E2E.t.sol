// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {IERC20Metadata as IERC20} from "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {MockStakingV1} from "V2-gov/test/mocks/MockStakingV1.sol";
import {CurveV2GaugeRewards} from "V2-gov/src/CurveV2GaugeRewards.sol";
import {Governance} from "V2-gov/src/Governance.sol";
import {ILeverageZapper} from "src/Zappers/Interfaces/ILeverageZapper.sol";
import {IZapper} from "src/Zappers/Interfaces/IZapper.sol";
import {Ownable} from "src/Dependencies/Ownable.sol";
import {IPriceFeed} from "src/Interfaces/IPriceFeed.sol";
import {ICurveStableSwapNG} from "./Interfaces/Curve/ICurveStableSwapNG.sol";
import {ILiquidityGaugeV6} from "./Interfaces/Curve/ILiquidityGaugeV6.sol";
import {IBorrowerOperationsV1} from "./Interfaces/LiquityV1/IBorrowerOperationsV1.sol";
import {IPriceFeedV1} from "./Interfaces/LiquityV1/IPriceFeedV1.sol";
import {ISortedTrovesV1} from "./Interfaces/LiquityV1/ISortedTrovesV1.sol";
import {ITroveManagerV1} from "./Interfaces/LiquityV1/ITroveManagerV1.sol";
import {ERC20Faucet} from "./TestContracts/ERC20Faucet.sol";
import {StringEquality} from "./Utils/StringEquality.sol";
import {UseDeployment} from "./Utils/UseDeployment.sol";

uint256 constant PRICE_TOLERANCE = 0.02 ether;

address constant ETH_WHALE = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil account #1
address constant WETH_WHALE = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil account #2
address constant WSTETH_WHALE = 0xd85351181b3F264ee0FDFa94518464d7c3DefaDa;
address constant RETH_WHALE = 0xE76af4a9A3E71681F4C9BE600A0BA8D9d249175b;
address constant USDC_WHALE = 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341;
address constant ACCEL_WHALE = 0xA78f19D7f331247212C6d9C0F27D3d9464D3604D;
address constant LUSD_WHALE = 0xcd6Eb888e76450eF584E8B51bB73c76ffBa21FF2;

IBorrowerOperationsV1 constant mainnet_V1_borrowerOperations =
    IBorrowerOperationsV1(0x24179CD81c9e782A4096035f7eC97fB8B783e007);
IPriceFeedV1 constant mainnet_V1_priceFeed = IPriceFeedV1(0x4c517D4e2C851CA76d7eC94B805269Df0f2201De);
ISortedTrovesV1 constant mainnet_V1_sortedTroves = ISortedTrovesV1(0x8FdD3fbFEb32b28fb73555518f8b361bCeA741A6);
ITroveManagerV1 constant mainnet_V1_troveManager = ITroveManagerV1(0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2);

function coalesce(address a, address b) pure returns (address) {
    return a != address(0) ? a : b;
}

contract SideEffectFreeGetPriceHelper {
    function _revert(bytes memory revertData) internal pure {
        assembly {
            revert(add(32, revertData), mload(revertData))
        }
    }

    function throwPrice(IPriceFeed priceFeed) external {
        (uint256 price,) = priceFeed.fetchPrice();
        _revert(abi.encode(price));
    }

    function throwPriceV1(IPriceFeedV1 priceFeed) external {
        _revert(abi.encode(priceFeed.fetchPrice()));
    }
}

library SideEffectFreeGetPrice {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Random address
    address private constant helperDeployer = 0x9C82588e2B9229168aDbb55E730e0d20c0581a3B;

    // Deterministic address of first contract deployed by `helperDeployer`
    SideEffectFreeGetPriceHelper private constant helper =
        SideEffectFreeGetPriceHelper(0xc583097AE39B039fA74bB5bd6479469290B7cDe5);

    function deploy() internal {
        if (address(helper).code.length == 0) {
            vm.prank(helperDeployer);
            new SideEffectFreeGetPriceHelper();
        }
    }

    function getPrice(IPriceFeed priceFeed) internal returns (uint256) {
        deploy();

        try helper.throwPrice(priceFeed) {
            revert("SideEffectFreeGetPrice: throwPrice() should have reverted");
        } catch (bytes memory revertData) {
            return abi.decode(revertData, (uint256));
        }
    }

    function getPrice(IPriceFeedV1 priceFeed) internal returns (uint256) {
        deploy();

        try helper.throwPriceV1(priceFeed) {
            revert("SideEffectFreeGetPrice: throwPriceV1() should have reverted");
        } catch (bytes memory revertData) {
            return abi.decode(revertData, (uint256));
        }
    }
}

contract E2ETest is Test, UseDeployment {
    using SideEffectFreeGetPrice for IPriceFeed;
    using SideEffectFreeGetPrice for IPriceFeedV1;
    using StringEquality for string;

    struct Initiative {
        address addr;
        ILiquidityGaugeV6 gauge; // optional
    }

    mapping(address token => address) providerOf;

    address[] ownables;

    address[] _allocateACCEL_initiativesToReset;
    address[] _allocateACCEL_initiatives;
    int256[] _allocateACCEL_votes;
    int256[] _allocateACCEL_vetos;

    function setUp() external {
        vm.skip(vm.envOr("FOUNDRY_PROFILE", string("")).notEq("e2e"));
        vm.createSelectFork(vm.envString("E2E_RPC_URL"));
        _loadDeploymentFromManifest("deployment-manifest.json");

        vm.label(ETH_WHALE, "ETH_WHALE");
        vm.label(WETH_WHALE, "WETH_WHALE");
        vm.label(WSTETH_WHALE, "WSTETH_WHALE");
        vm.label(RETH_WHALE, "RETH_WHALE");
        vm.label(USDC_WHALE, "USDC_WHALE");
        vm.label(ACCEL_WHALE, "ACCEL_WHALE");
        vm.label(LUSD_WHALE, "LUSD_WHALE");

        providerOf[WETH] = WETH_WHALE;
        providerOf[WSTETH] = WSTETH_WHALE;
        providerOf[RETH] = RETH_WHALE;
        providerOf[USDC] = USDC_WHALE;
        providerOf[ACCEL] = ACCEL_WHALE;
        providerOf[LUSD] = LUSD_WHALE;

        vm.prank(WETH_WHALE);
        weth.deposit{value: WETH_WHALE.balance}();

        // Testnet
        if (block.chainid != 1) {
            address[5] memory coins = [WSTETH, RETH, USDC, ACCEL, LUSD];

            for (uint256 i = 0; i < coins.length; ++i) {
                ERC20Faucet faucet = ERC20Faucet(coins[i]);
                vm.prank(faucet.owner());
                faucet.mint(providerOf[coins[i]], 1e6 ether);
            }
        }
    }

    function deal(address to, uint256 give) internal virtual override {
        if (to.balance < give) {
            vm.prank(ETH_WHALE);
            payable(to).transfer(give - to.balance);
        } else {
            vm.prank(to);
            payable(ETH_WHALE).transfer(to.balance - give);
        }
    }

    function deal(address token, address to, uint256 give) internal virtual override {
        uint256 balance = IERC20(token).balanceOf(to);
        address provider = providerOf[token];

        assertNotEq(provider, address(0), string.concat("No provider for ", IERC20(token).symbol()));

        if (balance < give) {
            vm.prank(provider);
            IERC20(token).transfer(to, give - balance);
        } else {
            vm.prank(to);
            IERC20(token).transfer(provider, balance - give);
        }
    }

    function deal(address token, address to, uint256 give, bool) internal virtual override {
        deal(token, to, give);
    }

    function _openTrove(uint256 i, address owner, uint256 ownerIndex, uint256 usdxAmount) internal returns (uint256) {
        IZapper.OpenTroveParams memory p;
        p.owner = owner;
        p.ownerIndex = ownerIndex;
        p.usdxAmount = usdxAmount;
        p.collAmount = usdxAmount * 2 ether / branches[i].priceFeed.getPrice();
        p.annualInterestRate = 0.05 ether;
        p.maxUpfrontFee = hintHelpers.predictOpenTroveUpfrontFee(i, usdxAmount, p.annualInterestRate);

        (uint256 collTokenAmount, uint256 value) = branches[i].collToken == weth
            ? (0, p.collAmount + ETH_GAS_COMPENSATION)
            : (p.collAmount, ETH_GAS_COMPENSATION);

        deal(owner, value);
        deal(address(branches[i].collToken), owner, collTokenAmount);

        vm.startPrank(owner);
        branches[i].collToken.approve(address(branches[i].zapper), collTokenAmount);
        branches[i].zapper.openTroveWithRawETH{value: value}(p);
        vm.stopPrank();

        return usdxAmount;
    }

    function _troveId(address owner, uint256 ownerIndex) internal pure returns (uint256) {
        return uint256(keccak256(abi.encode(owner, ownerIndex)));
    }

    function _closeTroveFromCollateral(uint256 i, address owner, uint256 ownerIndex) internal returns (uint256) {
        uint256 troveId = _troveId(owner, ownerIndex);
        uint256 debt = branches[i].troveManager.getLatestTroveData(troveId).entireDebt;
        IZapper zapper = IZapper(branches[i].borrowerOperations.addManagerOf(troveId));

        vm.startPrank(owner);
        zapper.closeTroveFromCollateral({
            _troveId: troveId,
            _flashLoanAmount: debt * (1 ether + PRICE_TOLERANCE) / branches[i].priceFeed.getPrice()
        });
        vm.stopPrank();

        return debt;
    }

    function _openLeveragedTrove(uint256 i, address owner, uint256 ownerIndex, uint256 usdxAmount)
        internal
        returns (uint256)
    {
        uint256 price = branches[i].priceFeed.getPrice();

        ILeverageZapper.OpenLeveragedTroveParams memory p;
        p.owner = owner;
        p.ownerIndex = ownerIndex;
        p.usdxAmount = usdxAmount;
        p.collAmount = usdxAmount * 0.5 ether / price;
        p.flashLoanAmount = usdxAmount * (1 ether - PRICE_TOLERANCE) / price;
        p.annualInterestRate = 0.1 ether;
        p.maxUpfrontFee = hintHelpers.predictOpenTroveUpfrontFee(i, usdxAmount, p.annualInterestRate);

        (uint256 collTokenAmount, uint256 value) = branches[i].collToken == weth
            ? (0, p.collAmount + ETH_GAS_COMPENSATION)
            : (p.collAmount, ETH_GAS_COMPENSATION);

        deal(owner, value);
        deal(address(branches[i].collToken), owner, collTokenAmount);

        vm.startPrank(owner);
        branches[i].collToken.approve(address(branches[i].leverageZapper), collTokenAmount);
        branches[i].leverageZapper.openLeveragedTroveWithRawETH{value: value}(p);
        vm.stopPrank();

        return usdxAmount;
    }

    function _leverUpTrove(uint256 i, address owner, uint256 ownerIndex, uint256 usdxAmount)
        internal
        returns (uint256)
    {
        uint256 troveId = _troveId(owner, ownerIndex);

        ILeverageZapper.LeverUpTroveParams memory p = ILeverageZapper.LeverUpTroveParams({
            troveId: troveId,
            usdxAmount: usdxAmount,
            flashLoanAmount: usdxAmount * (1 ether - PRICE_TOLERANCE) / branches[i].priceFeed.getPrice(),
            maxUpfrontFee: hintHelpers.predictAdjustTroveUpfrontFee(i, troveId, usdxAmount)
        });

        vm.prank(owner);
        branches[i].leverageZapper.leverUpTrove(p);

        return usdxAmount;
    }

    function _leverDownTrove(uint256 i, address owner, uint256 ownerIndex, uint256 usdxAmount)
        internal
        returns (uint256)
    {
        uint256 troveId = _troveId(owner, ownerIndex);
        uint256 debtBefore = branches[i].troveManager.getLatestTroveData(troveId).entireDebt;

        ILeverageZapper.LeverDownTroveParams memory p = ILeverageZapper.LeverDownTroveParams({
            troveId: troveId,
            minUsdxAmount: usdxAmount,
            flashLoanAmount: usdxAmount * (1 ether + PRICE_TOLERANCE) / branches[i].priceFeed.getPrice()
        });

        vm.prank(owner);
        branches[i].leverageZapper.leverDownTrove(p);

        return debtBefore - branches[i].troveManager.getLatestTroveData(troveId).entireDebt;
    }

    function _addCurveLiquidity(
        address liquidityProvider,
        ICurveStableSwapNG pool,
        uint256 coin0Amount,
        address coin0,
        uint256 coin1Amount,
        address coin1
    ) internal {
        uint256[] memory amounts = new uint256[](2);
        (amounts[0], amounts[1]) = pool.coins(0) == coin0 ? (coin0Amount, coin1Amount) : (coin1Amount, coin0Amount);

        deal(coin0, liquidityProvider, coin0Amount);
        deal(coin1, liquidityProvider, coin1Amount);

        vm.startPrank(liquidityProvider);
        IERC20(coin0).approve(address(pool), coin0Amount);
        IERC20(coin1).approve(address(pool), coin1Amount);
        pool.add_liquidity(amounts, 0);
        vm.stopPrank();
    }

    function _depositIntoCurveGauge(address liquidityProvider, ILiquidityGaugeV6 gauge, uint256 amount) internal {
        vm.startPrank(liquidityProvider);
        gauge.lp_token().approve(address(gauge), amount);
        gauge.deposit(amount);
        vm.stopPrank();
    }

    function _claimRewardsFromCurveGauge(address liquidityProvider, ILiquidityGaugeV6 gauge) internal {
        vm.prank(liquidityProvider);
        gauge.claim_rewards();
    }

    function _provideToSP(uint256 i, address depositor, uint256 usdxAmount) internal {
        deal(USDX, depositor, usdxAmount);
        vm.prank(depositor);
        branches[i].stabilityPool.provideToSP(usdxAmount, false);
    }

    function _claimFromSP(uint256 i, address depositor) internal {
        vm.prank(depositor);
        branches[i].stabilityPool.withdrawFromSP(0, true);
    }

    function _depositACCEL(address voter, uint256 amount) internal {
        deal(ACCEL, voter, amount);

        vm.startPrank(voter);
        accel.approve(governance.deriveUserProxyAddress(voter), amount);
        governance.depositACCEL(amount);
        vm.stopPrank();
    }

    function _allocateACCEL_begin(address voter) internal {
        vm.startPrank(voter);
    }

    function _allocateACCEL_reset(address initiative) internal {
        _allocateACCEL_initiativesToReset.push(initiative);
    }

    function _allocateACCEL_vote(address initiative, int256 accelAmount) internal {
        _allocateACCEL_initiatives.push(initiative);
        _allocateACCEL_votes.push(accelAmount);
        _allocateACCEL_vetos.push();
    }

    function _allocateACCEL_veto(address initiative, int256 accelAmount) internal {
        _allocateACCEL_initiatives.push(initiative);
        _allocateACCEL_votes.push();
        _allocateACCEL_vetos.push(accelAmount);
    }

    function _allocateACCEL_end() internal {
        governance.allocateACCEL(
            _allocateACCEL_initiativesToReset, _allocateACCEL_initiatives, _allocateACCEL_votes, _allocateACCEL_vetos
        );

        delete _allocateACCEL_initiativesToReset;
        delete _allocateACCEL_initiatives;
        delete _allocateACCEL_votes;
        delete _allocateACCEL_vetos;

        vm.stopPrank();
    }

    function _mainnet_V1_openTroveAtTail(address owner, uint256 lusdAmount) internal returns (uint256 borrowingFee) {
        uint256 price = mainnet_V1_priceFeed.getPrice();
        address lastTrove = mainnet_V1_sortedTroves.getLast();
        assertGeDecimal(mainnet_V1_troveManager.getCurrentICR(lastTrove, price), 1.1 ether, 18, "last ICR < MCR");

        uint256 borrowingRate = mainnet_V1_troveManager.getBorrowingRateWithDecay();
        borrowingFee = lusdAmount * borrowingRate / 1 ether;
        uint256 debt = lusdAmount + borrowingFee + 200 ether;
        uint256 collAmount = Math.ceilDiv(debt * 1.1 ether, price);
        deal(owner, collAmount);

        vm.startPrank(owner);
        mainnet_V1_borrowerOperations.openTrove{value: collAmount}({
            _LUSDAmount: lusdAmount,
            _maxFeePercentage: borrowingRate,
            _upperHint: lastTrove,
            _lowerHint: address(0)
        });
        vm.stopPrank();

        assertEq(mainnet_V1_sortedTroves.getLast(), owner, "last Trove != new Trove");
    }

    function _mainnet_V1_redeemCollateralFromTroveAtTail(address redeemer, uint256 lusdAmount)
        internal
        returns (uint256 redemptionFee)
    {
        address lastTrove = mainnet_V1_sortedTroves.getLast();
        address prevTrove = mainnet_V1_sortedTroves.getPrev(lastTrove);
        (uint256 lastTroveDebt, uint256 lastTroveColl,,) = mainnet_V1_troveManager.getEntireDebtAndColl(lastTrove);
        assertLeDecimal(lusdAmount, lastTroveDebt - 2_000 ether, 18, "lusdAmount > redeemable from last Trove");

        uint256 price = mainnet_V1_priceFeed.getPrice();
        uint256 collAmount = lusdAmount * 1 ether / price;
        uint256 balanceBefore = redeemer.balance;

        vm.startPrank(redeemer);
        mainnet_V1_troveManager.redeemCollateral({
            _LUSDamount: lusdAmount,
            _maxFeePercentage: 1 ether,
            _maxIterations: 1,
            _firstRedemptionHint: lastTrove,
            _upperPartialRedemptionHint: prevTrove,
            _lowerPartialRedemptionHint: prevTrove,
            _partialRedemptionHintNICR: (lastTroveColl - collAmount) * 100 ether / (lastTroveDebt - lusdAmount)
        });
        vm.stopPrank();

        redemptionFee = collAmount * mainnet_V1_troveManager.getBorrowingRateWithDecay() / 1 ether;
        assertEqDecimal(redeemer.balance - balanceBefore, collAmount - redemptionFee, 18, "coll received != expected");
    }

    function _generateStakingRewards() internal returns (uint256 lusdAmount, uint256 ethAmount) {
        if (block.chainid == 1) {
            address stakingRewardGenerator = makeAddr("stakingRewardGenerator");
            lusdAmount = _mainnet_V1_openTroveAtTail(stakingRewardGenerator, 1e6 ether);
            ethAmount = _mainnet_V1_redeemCollateralFromTroveAtTail(stakingRewardGenerator, 1_000 ether);
        } else {
            // Testnet
            lusdAmount = 10_000 ether;
            ethAmount = 1 ether;

            MockStakingV1 stakingV1 = MockStakingV1(address(governance.stakingV1()));
            address owner = stakingV1.owner();

            deal(LUSD, owner, lusdAmount);
            deal(owner, ethAmount);

            vm.startPrank(owner);
            lusd.approve(address(stakingV1), lusdAmount);
            stakingV1.mock_addLUSDGain(lusdAmount);
            stakingV1.mock_addETHGain{value: ethAmount}();
            vm.stopPrank();
        }
    }

    function test_OwnershipRenounced() external {
        ownables.push(address(usdxToken));

        for (uint256 i = 0; i < branches.length; ++i) {
            ownables.push(address(branches[i].addressesRegistry));
            if (block.chainid == 1) ownables.push(address(branches[i].priceFeed));
        }

        for (uint256 i = 0; i < ownables.length; ++i) {
            assertEq(
                Ownable(ownables[i]).owner(),
                address(0),
                string.concat("Ownership of ", vm.getLabel(ownables[i]), " should have been renounced")
            );
        }

        ILiquidityGaugeV6[2] memory gauges = [curveUsdcUsdxGauge, curveLusdUsdxGauge];

        for (uint256 i = 0; i < gauges.length; ++i) {
            address gaugeManager = gauges[i].manager();
            assertEq(gaugeManager, address(0), "Gauge manager role should have been renounced");
        }
    }

    function _epoch(uint256 n) internal view returns (uint256) {
        return EPOCH_START + (n - 1) * EPOCH_DURATION;
    }

    function test_Initially_NewInitiativeCannotBeRegistered() external {
        vm.skip(governance.epoch() > 2);

        address registrant = makeAddr("registrant");
        address newInitiative = makeAddr("newInitiative");

        _openTrove(0, registrant, 0, Math.max(REGISTRATION_FEE, MIN_DEBT));

        uint256 epoch2 = _epoch(2);
        if (block.timestamp < epoch2) vm.warp(epoch2);

        vm.startPrank(registrant);
        {
            usdxToken.approve(address(governance), REGISTRATION_FEE);
            vm.expectRevert("Governance: registration-not-yet-enabled");
            governance.registerInitiative(newInitiative);
        }
        vm.stopPrank();
    }

    function test_AfterOneEpoch_NewInitiativeCanBeRegistered() external {
        vm.skip(governance.epoch() > 2);

        address registrant = makeAddr("registrant");
        address newInitiative = makeAddr("newInitiative");

        _openTrove(0, registrant, 0, Math.max(REGISTRATION_FEE, MIN_DEBT));

        uint256 epoch3 = _epoch(3);
        if (block.timestamp < epoch3) vm.warp(epoch3);

        vm.startPrank(registrant);
        {
            usdxToken.approve(address(governance), REGISTRATION_FEE);
            governance.registerInitiative(newInitiative);
        }
        vm.stopPrank();
    }

    function test_E2E() external {
        // Test assumes that all Stability Pools are empty in the beginning
        for (uint256 i = 0; i < branches.length; ++i) {
            vm.skip(branches[i].stabilityPool.getTotalUsdxDeposits() != 0);
        }

        uint256 repaid;
        uint256 borrowed = usdxToken.totalSupply() - usdxToken.balanceOf(address(governance));

        for (uint256 i = 0; i < branches.length; ++i) {
            borrowed -= usdxToken.balanceOf(address(branches[i].stabilityPool));
        }

        if (block.chainid == 1) {
            assertEqDecimal(borrowed, 0, 18, "Mainnet deployment script should not have borrowed anything");
            assertNotEq(address(curveUsdcUsdxGauge), address(0), "Mainnet should have USDC-USDX gauge");
            assertNotEq(address(curveUsdcUsdxInitiative), address(0), "Mainnet should have USDC-USDX initiative");
            assertNotEq(address(curveLusdUsdx), address(0), "Mainnet should have LUSD-USDX pool");
            assertNotEq(address(curveLusdUsdxGauge), address(0), "Mainnet should have LUSD-USDX gauge");
            assertNotEq(address(curveLusdUsdxInitiative), address(0), "Mainnet should have LUSD-USDX initiative");
            assertNotEq(address(defiCollectiveInitiative), address(0), "Mainnet should have DeFi Collective initiative");
        }

        address borrower = providerOf[USDX] = makeAddr("borrower");

        for (uint256 j = 0; j < 5; ++j) {
            for (uint256 i = 0; i < branches.length; ++i) {
                skip(5 minutes);
                borrowed += _openTrove(i, borrower, j, 20_000 ether);
            }
        }

        address liquidityProvider = makeAddr("liquidityProvider");
        {
            skip(5 minutes);

            uint256 usdxAmount = usdxToken.balanceOf(borrower) * 2 / 5;
            uint256 usdcAmount = usdxAmount * 10 ** usdc.decimals() / 10 ** usdxToken.decimals();
            uint256 lusdAmount = usdxAmount;

            _addCurveLiquidity(liquidityProvider, curveUsdcUsdx, usdxAmount, USDX, usdcAmount, USDC);

            if (address(curveLusdUsdx) != address(0)) {
                _addCurveLiquidity(liquidityProvider, curveLusdUsdx, usdxAmount, USDX, lusdAmount, LUSD);
            }

            if (address(curveUsdcUsdxGauge) != address(0)) {
                _depositIntoCurveGauge(
                    liquidityProvider, curveUsdcUsdxGauge, curveUsdcUsdx.balanceOf(liquidityProvider)
                );
            }

            if (address(curveLusdUsdxGauge) != address(0)) {
                _depositIntoCurveGauge(
                    liquidityProvider, curveLusdUsdxGauge, curveLusdUsdx.balanceOf(liquidityProvider)
                );
            }
        }

        address stabilityDepositor = makeAddr("stabilityDepositor");

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            _provideToSP(i, stabilityDepositor, usdxToken.balanceOf(borrower) / (branches.length - i));
        }

        address leverageSeeker = makeAddr("leverageSeeker");

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            borrowed += _openLeveragedTrove(i, leverageSeeker, 0, 10_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            borrowed += _leverUpTrove(i, leverageSeeker, 0, 1_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            repaid += _leverDownTrove(i, leverageSeeker, 0, 1_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            repaid += _closeTroveFromCollateral(i, leverageSeeker, 0);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            repaid += _closeTroveFromCollateral(i, borrower, 0);
        }

        skip(5 minutes);

        uint256 numInitiatives;
        Initiative[3] memory initiatives = [
            Initiative({addr: address(curveUsdcUsdxInitiative), gauge: curveUsdcUsdxGauge}),
            Initiative({addr: address(curveLusdUsdxInitiative), gauge: curveLusdUsdxGauge}),
            Initiative({addr: defiCollectiveInitiative, gauge: ILiquidityGaugeV6(address(0))})
        ];

        for (uint256 i = 0; i < initiatives.length; ++i) {
            if (initiatives[i].addr != address(0)) {
                ++numInitiatives;
            }
        }

        address staker = makeAddr("staker");
        {
            uint256 accelStake = 30_000 ether;
            _depositACCEL(staker, accelStake);

            skip(5 minutes);

            (uint256 lusdAmount, uint256 ethAmount) = _generateStakingRewards();
            uint256 totalACCELStaked = governance.stakingV1().totalACCELStaked();

            skip(5 minutes);

            vm.prank(staker);
            governance.claimFromStakingV1(staker);

            assertApproxEqAbsDecimal(
                lusd.balanceOf(staker), lusdAmount * accelStake / totalACCELStaked, 1e5, 18, "LUSD reward"
            );
            assertApproxEqAbsDecimal(staker.balance, ethAmount * accelStake / totalACCELStaked, 1e5, 18, "ETH reward");

            skip(5 minutes);

            if (numInitiatives > 0) {
                // Voting on initial initiatives opens in epoch #2
                uint256 votingStart = _epoch(2);
                if (block.timestamp < votingStart) vm.warp(votingStart);

                _allocateACCEL_begin(staker);

                for (uint256 i = 0; i < initiatives.length; ++i) {
                    if (initiatives[i].addr != address(0)) {
                        _allocateACCEL_vote(initiatives[i].addr, int256(accelStake / numInitiatives));
                    }
                }

                _allocateACCEL_end();
            }
        }

        skip(EPOCH_DURATION);

        for (uint256 i = 0; i < branches.length; ++i) {
            skip(5 minutes);
            _claimFromSP(i, stabilityDepositor);
        }

        uint256 interest = usdxToken.totalSupply() + repaid - borrowed;
        uint256 spShareOfInterest = usdxToken.balanceOf(stabilityDepositor);
        uint256 governanceShareOfInterest = usdxToken.balanceOf(address(governance));

        assertApproxEqRelDecimal(
            interest,
            spShareOfInterest + governanceShareOfInterest,
            1e-16 ether,
            18,
            "Stability depositor and Governance should have received the interest"
        );

        if (numInitiatives > 0) {
            uint256 initiativeShareOfInterest;

            for (uint256 i = 0; i < initiatives.length; ++i) {
                if (initiatives[i].addr != address(0)) {
                    governance.claimForInitiative(initiatives[i].addr);
                    initiativeShareOfInterest +=
                        usdxToken.balanceOf(coalesce(address(initiatives[i].gauge), initiatives[i].addr));
                }
            }

            assertApproxEqRelDecimal(
                governanceShareOfInterest,
                initiativeShareOfInterest,
                1e-15 ether,
                18,
                "Initiatives should have received the interest from Governance"
            );

            uint256 numGauges;
            uint256 maxGaugeDuration;

            for (uint256 i = 0; i < initiatives.length; ++i) {
                if (address(initiatives[i].gauge) != address(0)) {
                    assertNotEq(initiatives[i].addr, address(0), "Gauge should imply addr");
                    maxGaugeDuration = Math.max(maxGaugeDuration, CurveV2GaugeRewards(initiatives[i].addr).duration());
                    ++numGauges;
                }
            }

            skip(maxGaugeDuration);

            if (numGauges > 0) {
                uint256 gaugeShareOfInterest;

                for (uint256 i = 0; i < initiatives.length; ++i) {
                    if (address(initiatives[i].gauge) != address(0)) {
                        gaugeShareOfInterest += usdxToken.balanceOf(address(initiatives[i].gauge));
                        _claimRewardsFromCurveGauge(liquidityProvider, initiatives[i].gauge);
                    }
                }

                assertApproxEqRelDecimal(
                    usdxToken.balanceOf(liquidityProvider),
                    gaugeShareOfInterest,
                    1e-13 ether,
                    18,
                    "Liquidity provider should have earned the rewards from the Curve gauges"
                );
            }
        }
    }

    // This can be used to check that everything's still working as expected in a live testnet deployment
    function test_Borrowing_InExistingDeployment() external {
        for (uint256 i = 0; i < branches.length; ++i) {
            vm.skip(branches[i].troveManager.getTroveIdsCount() == 0);
        }

        address borrower = makeAddr("borrower");

        for (uint256 i = 0; i < branches.length; ++i) {
            _openTrove(i, borrower, 0, 10_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            _closeTroveFromCollateral(i, borrower, 0);
        }

        address leverageSeeker = makeAddr("leverageSeeker");

        for (uint256 i = 0; i < branches.length; ++i) {
            _openLeveragedTrove(i, leverageSeeker, 0, 10_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            _leverUpTrove(i, leverageSeeker, 0, 1_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            _leverDownTrove(i, leverageSeeker, 0, 1_000 ether);
        }

        for (uint256 i = 0; i < branches.length; ++i) {
            _closeTroveFromCollateral(i, leverageSeeker, 0);
        }
    }

    function test_ManagerOfCurveGauge_UnlessRenounced_CanReassignRewardDistributor() external {
        vm.skip(address(curveUsdcUsdxGauge) == address(0));

        address manager = curveUsdcUsdxGauge.manager();
        vm.skip(manager == address(0));
        vm.label(manager, "manager");

        address newRewardDistributor = makeAddr("newRewardDistributor");
        uint256 rewardAmount = 10_000 ether;
        _openTrove(0, newRewardDistributor, 0, rewardAmount);

        vm.startPrank(newRewardDistributor);
        usdxToken.approve(address(curveUsdcUsdxGauge), rewardAmount);
        vm.expectRevert();
        curveUsdcUsdxGauge.deposit_reward_token(USDX, rewardAmount, 7 days);
        vm.stopPrank();

        vm.prank(manager);
        curveUsdcUsdxGauge.set_reward_distributor(USDX, newRewardDistributor);

        vm.startPrank(newRewardDistributor);
        curveUsdcUsdxGauge.deposit_reward_token(USDX, rewardAmount, 7 days);
        vm.stopPrank();
    }
}
