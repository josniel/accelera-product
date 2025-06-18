// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {CommonBase} from "forge-std/Base.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {IERC20Metadata as IERC20} from "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {IUserProxy} from "V2-gov/src/interfaces/IUserProxy.sol";
import {CurveV2GaugeRewards} from "V2-gov/src/CurveV2GaugeRewards.sol";
import {Governance} from "V2-gov/src/Governance.sol";
import {ILeverageZapper} from "src/Zappers/Interfaces/ILeverageZapper.sol";
import {IZapper} from "src/Zappers/Interfaces/IZapper.sol";
import {IActivePool} from "src/Interfaces/IActivePool.sol";
import {IAddressesRegistry} from "src/Interfaces/IAddressesRegistry.sol";
import {IUsdxToken} from "src/Interfaces/IUsdxToken.sol";
import {IBorrowerOperations} from "src/Interfaces/IBorrowerOperations.sol";
import {ICollateralRegistry} from "src/Interfaces/ICollateralRegistry.sol";
import {IDefaultPool} from "src/Interfaces/IDefaultPool.sol";
import {IHintHelpers} from "src/Interfaces/IHintHelpers.sol";
import {ISortedTroves} from "src/Interfaces/ISortedTroves.sol";
import {ITroveManager} from "src/Interfaces/ITroveManager.sol";
import {ITroveNFT} from "src/Interfaces/ITroveNFT.sol";
import {IPriceFeed} from "src/Interfaces/IPriceFeed.sol";
import {IStabilityPool} from "src/Interfaces/IStabilityPool.sol";
import {IWETH} from "src/Interfaces/IWETH.sol";
import {ICurveStableSwapNG} from "../Interfaces/Curve/ICurveStableSwapNG.sol";
import {ILiquidityGaugeV6} from "../Interfaces/Curve/ILiquidityGaugeV6.sol";
import {StringEquality} from "./StringEquality.sol";

function coalesce(address a, address b) pure returns (address) {
    return a != address(0) ? a : b;
}

contract UseDeployment is CommonBase {
    using stdJson for string;
    using Strings for uint256;
    using StringEquality for string;

    struct BranchContracts {
        IERC20 collToken;
        IAddressesRegistry addressesRegistry;
        IPriceFeed priceFeed;
        ITroveNFT troveNFT;
        ITroveManager troveManager;
        IBorrowerOperations borrowerOperations;
        ISortedTroves sortedTroves;
        IActivePool activePool;
        IDefaultPool defaultPool;
        IStabilityPool stabilityPool;
        ILeverageZapper leverageZapper;
        IZapper zapper;
    }

    address WETH;
    address WSTETH;
    address RETH;
    address USDX;
    address USDC;
    address ACCEL;
    address LUSD;

    uint256 ETH_GAS_COMPENSATION;
    uint256 MIN_DEBT;
    uint256 EPOCH_START;
    uint256 EPOCH_DURATION;
    uint256 REGISTRATION_FEE;

    IWETH weth;
    IERC20 usdc;
    IERC20 accel;
    IERC20 lusd;

    ICollateralRegistry collateralRegistry;
    IUsdxToken usdxToken;
    IHintHelpers hintHelpers;
    Governance governance;
    ICurveStableSwapNG curveUsdcUsdx;
    ILiquidityGaugeV6 curveUsdcUsdxGauge;
    CurveV2GaugeRewards curveUsdcUsdxInitiative;
    ICurveStableSwapNG curveLusdUsdx;
    ILiquidityGaugeV6 curveLusdUsdxGauge;
    CurveV2GaugeRewards curveLusdUsdxInitiative;
    address defiCollectiveInitiative;
    BranchContracts[] branches;

    function _loadDeploymentFromManifest(string memory deploymentManifestJson) internal {
        string memory json = vm.readFile(deploymentManifestJson);
        collateralRegistry = ICollateralRegistry(json.readAddress(".collateralRegistry"));
        usdxToken = IUsdxToken(USDX = json.readAddress(".usdxToken"));
        hintHelpers = IHintHelpers(json.readAddress(".hintHelpers"));
        governance = Governance(json.readAddress(".governance.governance"));
        curveUsdcUsdx = ICurveStableSwapNG(json.readAddress(".governance.curveUsdcUsdxPool"));
        curveUsdcUsdxGauge = ILiquidityGaugeV6(json.readAddress(".governance.curveUsdcUsdxGauge"));
        curveUsdcUsdxInitiative = CurveV2GaugeRewards(json.readAddress(".governance.curveUsdcUsdxInitiative"));
        curveLusdUsdx = ICurveStableSwapNG(json.readAddress(".governance.curveLusdUsdxPool"));
        curveLusdUsdxGauge = ILiquidityGaugeV6(json.readAddress(".governance.curveLusdUsdxGauge"));
        curveLusdUsdxInitiative = CurveV2GaugeRewards(json.readAddress(".governance.curveLusdUsdxInitiative"));
        defiCollectiveInitiative = json.readAddress(".governance.defiCollectiveInitiative");

        vm.label(address(collateralRegistry), "CollateralRegistry");
        vm.label(address(hintHelpers), "HintHelpers");
        vm.label(address(governance), "Governance");
        vm.label(address(curveUsdcUsdx), "CurveStableSwapNG");
        vm.label(address(curveUsdcUsdxGauge), "LiquidityGaugeV6");
        vm.label(address(curveUsdcUsdxInitiative), "CurveV2GaugeRewards");

        ETH_GAS_COMPENSATION = json.readUint(".constants.ETH_GAS_COMPENSATION");
        MIN_DEBT = json.readUint(".constants.MIN_DEBT");
        EPOCH_START = json.readUint(".governance.constants.EPOCH_START");
        EPOCH_DURATION = json.readUint(".governance.constants.EPOCH_DURATION");
        REGISTRATION_FEE = json.readUint(".governance.constants.REGISTRATION_FEE");
        ACCEL = json.readAddress(".governance.ACCELToken");
        USDC = curveUsdcUsdx.coins(0) != USDX ? curveUsdcUsdx.coins(0) : curveUsdcUsdx.coins(1);
        LUSD = address(IUserProxy(governance.userProxyImplementation()).lusd());

        for (uint256 i = 0; i < collateralRegistry.totalCollaterals(); ++i) {
            string memory branch = string.concat(".branches[", i.toString(), "]");

            branches.push() = BranchContracts({
                collToken: IERC20(json.readAddress(string.concat(branch, ".collToken"))),
                addressesRegistry: IAddressesRegistry(json.readAddress(string.concat(branch, ".addressesRegistry"))),
                priceFeed: IPriceFeed(json.readAddress(string.concat(branch, ".priceFeed"))),
                troveNFT: ITroveNFT(json.readAddress(string.concat(branch, ".troveNFT"))),
                troveManager: ITroveManager(json.readAddress(string.concat(branch, ".troveManager"))),
                borrowerOperations: IBorrowerOperations(json.readAddress(string.concat(branch, ".borrowerOperations"))),
                sortedTroves: ISortedTroves(json.readAddress(string.concat(branch, ".sortedTroves"))),
                activePool: IActivePool(json.readAddress(string.concat(branch, ".activePool"))),
                defaultPool: IDefaultPool(json.readAddress(string.concat(branch, ".defaultPool"))),
                stabilityPool: IStabilityPool(json.readAddress(string.concat(branch, ".stabilityPool"))),
                leverageZapper: ILeverageZapper(json.readAddress(string.concat(branch, ".leverageZapper"))),
                zapper: IZapper(
                    coalesce(
                        json.readAddress(string.concat(branch, ".wethZapper")),
                        json.readAddress(string.concat(branch, ".gasCompZapper"))
                    )
                )
            });

            vm.label(address(branches[i].priceFeed), "PriceFeed");
            vm.label(address(branches[i].troveNFT), "TroveNFT");
            vm.label(address(branches[i].troveManager), "TroveManager");
            vm.label(address(branches[i].borrowerOperations), "BorrowerOperations");
            vm.label(address(branches[i].sortedTroves), "SortedTroves");
            vm.label(address(branches[i].activePool), "ActivePool");
            vm.label(address(branches[i].defaultPool), "DefaultPool");
            vm.label(address(branches[i].stabilityPool), "StabilityPool");
            vm.label(address(branches[i].leverageZapper), "LeverageZapper");
            vm.label(address(branches[i].zapper), "Zapper");

            string memory collSymbol = branches[i].collToken.symbol();
            if (collSymbol.eq("WETH")) {
                WETH = address(branches[i].collToken);
            } else if (collSymbol.eq("wstETH")) {
                WSTETH = address(branches[i].collToken);
            } else if (collSymbol.eq("rETH")) {
                RETH = address(branches[i].collToken);
            } else {
                revert(string.concat("Unexpected collateral ", collSymbol));
            }
        }

        vm.label(WETH, "WETH");
        vm.label(WSTETH, "wstETH");
        vm.label(RETH, "rETH");
        vm.label(USDX, "USDX");
        vm.label(USDC, "USDC");
        vm.label(ACCEL, "ACCEL");
        vm.label(LUSD, "LUSD");

        weth = IWETH(WETH);
        usdc = IERC20(USDC);
        accel = IERC20(ACCEL);
        lusd = IERC20(LUSD);
    }
}
