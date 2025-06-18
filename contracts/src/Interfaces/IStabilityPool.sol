// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IActivePool.sol";
import "./ILiquityBase.sol";
import "./IUsdxToken.sol";
import "./ITroveManager.sol";
import "./IUsdxRewardsReceiver.sol";

/*
 * The Stability Pool holds Usdx tokens deposited by Stability Pool depositors.
 *
 * When a trove is liquidated, then depending on system conditions, some of its Usdx debt gets offset with
 * Usdx in the Stability Pool:  that is, the offset debt evaporates, and an equal amount of Usdx tokens in the Stability Pool is burned.
 *
 * Thus, a liquidation causes each depositor to receive a Usdx loss, in proportion to their deposit as a share of total deposits.
 * They also receive an Coll gain, as the collateral of the liquidated trove is distributed among Stability depositors,
 * in the same proportion.
 *
 * When a liquidation occurs, it depletes every deposit by the same fraction: for example, a liquidation that depletes 40%
 * of the total Usdx in the Stability Pool, depletes 40% of each deposit.
 *
 * A deposit that has experienced a series of liquidations is termed a "compounded deposit": each liquidation depletes the deposit,
 * multiplying it by some factor in range ]0,1[
 *
 * Please see the implementation spec in the proof document, which closely follows on from the compounded deposit / Coll gain derivations:
 * https://github.com/liquity/liquity/blob/master/papers/Scalable_Reward_Distribution_with_Compounding_Stakes.pdf
 *
*/
interface IStabilityPool is ILiquityBase, IUsdxRewardsReceiver {
    function usdxToken() external view returns (IUsdxToken);
    function troveManager() external view returns (ITroveManager);

    /*  provideToSP():
    * - Calculates depositor's Coll gain
    * - Calculates the compounded deposit
    * - Increases deposit, and takes new snapshots of accumulators P and S
    * - Sends depositor's accumulated Coll gains to depositor
    */
    function provideToSP(uint256 _amount, bool _doClaim) external;

    /*  withdrawFromSP():
    * - Calculates depositor's Coll gain
    * - Calculates the compounded deposit
    * - Sends the requested USDX withdrawal to depositor
    * - (If _amount > userDeposit, the user withdraws all of their compounded deposit)
    * - Decreases deposit by withdrawn amount and takes new snapshots of accumulators P and S
    */
    function withdrawFromSP(uint256 _amount, bool doClaim) external;

    function claimAllCollGains() external;

    /*
     * Initial checks:
     * - Caller is TroveManager
     * ---
     * Cancels out the specified debt against the Usdx contained in the Stability Pool (as far as possible)
     * and transfers the Trove's collateral from ActivePool to StabilityPool.
     * Only called by liquidation functions in the TroveManager.
     */
    function offset(uint256 _debt, uint256 _coll) external;

    function deposits(address _depositor) external view returns (uint256 initialValue);
    function stashedColl(address _depositor) external view returns (uint256);

    /*
     * Returns the total amount of Coll held by the pool, accounted in an internal variable instead of `balance`,
     * to exclude edge cases like Coll received from a self-destruct.
     */
    function getCollBalance() external view returns (uint256);

    /*
     * Returns Usdx held in the pool. Changes when users deposit/withdraw, and when Trove debt is offset.
     */
    function getTotalUsdxDeposits() external view returns (uint256);

    function getYieldGainsOwed() external view returns (uint256);
    function getYieldGainsPending() external view returns (uint256);

    /*
     * Calculates the Coll gain earned by the deposit since its last snapshots were taken.
     */
    function getDepositorCollGain(address _depositor) external view returns (uint256);

    /*
     * Calculates the USDX yield gain earned by the deposit since its last snapshots were taken.
     */
    function getDepositorYieldGain(address _depositor) external view returns (uint256);

    /*
     * Calculates what `getDepositorYieldGain` will be if interest is minted now.
     */
    function getDepositorYieldGainWithPending(address _depositor) external view returns (uint256);

    /*
     * Return the user's compounded deposit.
     */
    function getCompoundedUsdxDeposit(address _depositor) external view returns (uint256);

    function scaleToS(uint256 _scale) external view returns (uint256);

    function scaleToB(uint256 _scale) external view returns (uint256);

    function P() external view returns (uint256);
    function currentScale() external view returns (uint256);

    function P_PRECISION() external view returns (uint256);
}
