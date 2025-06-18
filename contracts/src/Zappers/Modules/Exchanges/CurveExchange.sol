// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../../Interfaces/IUsdxToken.sol";
import "./Curve/ICurvePool.sol";
import "../../Interfaces/IExchange.sol";

contract CurveExchange is IExchange {
    using SafeERC20 for IERC20;

    IERC20 public immutable collToken;
    IUsdxToken public immutable usdxToken;
    ICurvePool public immutable curvePool;
    uint256 public immutable COLL_TOKEN_INDEX;
    uint256 public immutable USDX_TOKEN_INDEX;

    constructor(
        IERC20 _collToken,
        IUsdxToken _usdxToken,
        ICurvePool _curvePool,
        uint256 _collIndex,
        uint256 _usdxIndex
    ) {
        collToken = _collToken;
        usdxToken = _usdxToken;
        curvePool = _curvePool;
        COLL_TOKEN_INDEX = _collIndex;
        USDX_TOKEN_INDEX = _usdxIndex;
    }

    function swapFromUsdx(uint256 _usdxAmount, uint256 _minCollAmount) external {
        ICurvePool curvePoolCached = curvePool;
        uint256 initialUsdxBalance = usdxToken.balanceOf(address(this));
        usdxToken.transferFrom(msg.sender, address(this), _usdxAmount);
        usdxToken.approve(address(curvePoolCached), _usdxAmount);

        uint256 output = curvePoolCached.exchange(USDX_TOKEN_INDEX, COLL_TOKEN_INDEX, _usdxAmount, _minCollAmount);
        collToken.safeTransfer(msg.sender, output);

        uint256 currentUsdxBalance = usdxToken.balanceOf(address(this));
        if (currentUsdxBalance > initialUsdxBalance) {
            usdxToken.transfer(msg.sender, currentUsdxBalance - initialUsdxBalance);
        }
    }

    function swapToUsdx(uint256 _collAmount, uint256 _minUsdxAmount) external returns (uint256) {
        ICurvePool curvePoolCached = curvePool;
        uint256 initialCollBalance = collToken.balanceOf(address(this));
        collToken.safeTransferFrom(msg.sender, address(this), _collAmount);
        collToken.approve(address(curvePoolCached), _collAmount);

        uint256 output = curvePoolCached.exchange(COLL_TOKEN_INDEX, USDX_TOKEN_INDEX, _collAmount, _minUsdxAmount);
        usdxToken.transfer(msg.sender, output);

        uint256 currentCollBalance = collToken.balanceOf(address(this));
        if (currentCollBalance > initialCollBalance) {
            collToken.safeTransfer(msg.sender, currentCollBalance - initialCollBalance);
        }

        return output;
    }
}
