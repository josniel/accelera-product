// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/math/Math.sol";

import "../../LeftoversSweep.sol";
import "../../../Interfaces/IUsdxToken.sol";
import "./UniswapV3/ISwapRouter.sol";
import "./UniswapV3/UniPriceConverter.sol";
import "../../Interfaces/IExchange.sol";
import {DECIMAL_PRECISION} from "../../../Dependencies/Constants.sol";

contract UniV3Exchange is LeftoversSweep, UniPriceConverter, IExchange {
    using SafeERC20 for IERC20;

    IERC20 public immutable collToken;
    IUsdxToken public immutable usdxToken;
    uint24 public immutable fee;
    ISwapRouter public immutable uniV3Router;

    constructor(IERC20 _collToken, IUsdxToken _usdxToken, uint24 _fee, ISwapRouter _uniV3Router) {
        collToken = _collToken;
        usdxToken = _usdxToken;
        fee = _fee;
        uniV3Router = _uniV3Router;
    }

    function swapFromUsdx(uint256 _usdxAmount, uint256 _minCollAmount) external {
        ISwapRouter uniV3RouterCached = uniV3Router;

        // Set initial balances to make sure there are not lefovers
        InitialBalances memory initialBalances;
        _setInitialTokensAndBalances(collToken, usdxToken, initialBalances);

        usdxToken.transferFrom(msg.sender, address(this), _usdxAmount);
        usdxToken.approve(address(uniV3RouterCached), _usdxAmount);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
            tokenIn: address(usdxToken),
            tokenOut: address(collToken),
            fee: fee,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountOut: _minCollAmount,
            amountInMaximum: _usdxAmount,
            sqrtPriceLimitX96: 0 // See: https://ethereum.stackexchange.com/a/156018/9205
        });

        uniV3RouterCached.exactOutputSingle(params);

        // return leftovers to user
        _returnLeftovers(initialBalances);
    }

    function swapToUsdx(uint256 _collAmount, uint256 _minUsdxAmount) external returns (uint256) {
        ISwapRouter uniV3RouterCached = uniV3Router;

        // Set initial balances to make sure there are not lefovers
        InitialBalances memory initialBalances;
        _setInitialTokensAndBalances(collToken, usdxToken, initialBalances);

        collToken.safeTransferFrom(msg.sender, address(this), _collAmount);
        collToken.approve(address(uniV3RouterCached), _collAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(collToken),
            tokenOut: address(usdxToken),
            fee: fee,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: _collAmount,
            amountOutMinimum: _minUsdxAmount,
            sqrtPriceLimitX96: 0 // See: https://ethereum.stackexchange.com/a/156018/9205
        });

        uint256 amountOut = uniV3RouterCached.exactInputSingle(params);

        // return leftovers to user
        _returnLeftovers(initialBalances);

        return amountOut;
    }

    function priceToSqrtPrice(IUsdxToken _usdxToken, IERC20 _collToken, uint256 _price) public pure returns (uint160) {
        // inverse price if Usdx goes first
        uint256 price = _zeroForOne(_usdxToken, _collToken) ? DECIMAL_PRECISION * DECIMAL_PRECISION / _price : _price;
        return priceToSqrtPriceX96(price);
    }

    // See: https://github.com/Uniswap/v3-periphery/blob/main/contracts/lens/QuoterV2.sol#L207C9-L207C60
    function _zeroForOne(IUsdxToken _usdxToken, IERC20 _collToken) internal pure returns (bool) {
        return address(_usdxToken) < address(_collToken);
    }
}
