// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/math/Math.sol";

import "../../../Interfaces/IWETH.sol";
import "../../LeftoversSweep.sol";
// Curve
import "./Curve/ICurveStableswapNGPool.sol";
// UniV3
import "./UniswapV3/ISwapRouter.sol";

import "../../Interfaces/IExchange.sol";

// import "forge-std/console2.sol";

contract HybridCurveUniV3Exchange is LeftoversSweep, IExchange {
    using SafeERC20 for IERC20;

    // TODO: pass it as param in functions, so we can reuse the same exchange for different branches
    IERC20 public immutable collToken;
    IUsdxToken public immutable usdxToken;
    IERC20 public immutable USDC;
    IWETH public immutable WETH;

    // Curve
    ICurveStableswapNGPool public immutable curvePool;
    uint128 public immutable USDC_INDEX;
    uint128 public immutable USDX_TOKEN_INDEX;

    // Uniswap
    uint24 public immutable feeUsdcWeth;
    uint24 public immutable feeWethColl;
    ISwapRouter public immutable uniV3Router;

    constructor(
        IERC20 _collToken,
        IUsdxToken _usdxToken,
        IERC20 _usdc,
        IWETH _weth,
        // Curve
        ICurveStableswapNGPool _curvePool,
        uint128 _usdcIndex,
        uint128 _usdxIndex,
        // UniV3
        uint24 _feeUsdcWeth,
        uint24 _feeWethColl,
        ISwapRouter _uniV3Router
    ) {
        collToken = _collToken;
        usdxToken = _usdxToken;
        USDC = _usdc;
        WETH = _weth;

        // Curve
        curvePool = _curvePool;
        USDC_INDEX = _usdcIndex;
        USDX_TOKEN_INDEX = _usdxIndex;

        // Uniswap
        feeUsdcWeth = _feeUsdcWeth;
        feeWethColl = _feeWethColl;
        uniV3Router = _uniV3Router;
    }

    // Usdx -> USDC on Curve; then USDC -> WETH, and optionally WETH -> Coll, on UniV3
    function swapFromUsdx(uint256 _usdxAmount, uint256 _minCollAmount) external {
        InitialBalances memory initialBalances;
        _setHybridExchangeInitialBalances(initialBalances);

        // Curve
        usdxToken.transferFrom(msg.sender, address(this), _usdxAmount);
        usdxToken.approve(address(curvePool), _usdxAmount);

        uint256 curveUsdcAmount = curvePool.exchange(int128(USDX_TOKEN_INDEX), int128(USDC_INDEX), _usdxAmount, 0);

        // Uniswap
        USDC.approve(address(uniV3Router), curveUsdcAmount);

        // See: https://docs.uniswap.org/contracts/v3/guides/swaps/multihop-swaps
        bytes memory path;
        if (address(WETH) == address(collToken)) {
            path = abi.encodePacked(USDC, feeUsdcWeth, WETH);
        } else {
            path = abi.encodePacked(USDC, feeUsdcWeth, WETH, feeWethColl, collToken);
        }

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: curveUsdcAmount,
            amountOutMinimum: _minCollAmount
        });

        // Executes the swap.
        uniV3Router.exactInput(params);

        // return leftovers to user
        _returnLeftovers(initialBalances);
    }

    // Optionally Coll -> WETH, and WETH -> USDC on UniV3; then USDC -> Usdx on Curve
    function swapToUsdx(uint256 _collAmount, uint256 _minUsdxAmount) external returns (uint256) {
        InitialBalances memory initialBalances;
        _setHybridExchangeInitialBalances(initialBalances);

        // Uniswap
        collToken.safeTransferFrom(msg.sender, address(this), _collAmount);
        collToken.approve(address(uniV3Router), _collAmount);

        // See: https://docs.uniswap.org/contracts/v3/guides/swaps/multihop-swaps
        bytes memory path;
        if (address(WETH) == address(collToken)) {
            path = abi.encodePacked(WETH, feeUsdcWeth, USDC);
        } else {
            path = abi.encodePacked(collToken, feeWethColl, WETH, feeUsdcWeth, USDC);
        }

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: _collAmount,
            amountOutMinimum: 0
        });

        // Executes the swap.
        uint256 uniV3UsdcAmount = uniV3Router.exactInput(params);

        // Curve
        USDC.approve(address(curvePool), uniV3UsdcAmount);

        uint256 usdxAmount =
            curvePool.exchange(int128(USDC_INDEX), int128(USDX_TOKEN_INDEX), uniV3UsdcAmount, _minUsdxAmount);
        usdxToken.transfer(msg.sender, usdxAmount);

        // return leftovers to user
        _returnLeftovers(initialBalances);

        return usdxAmount;
    }

    function _setHybridExchangeInitialBalances(InitialBalances memory initialBalances) internal view {
        initialBalances.tokens[0] = usdxToken;
        initialBalances.tokens[1] = USDC;
        initialBalances.tokens[2] = WETH;
        if (address(WETH) != address(collToken)) {
            initialBalances.tokens[3] = collToken;
        }
        _setInitialBalances(initialBalances);
    }
}
