// import BigNumber from "bignumber.js";

// BigNumber.config({ EXPONENTIAL_AT: 30 });

// export function toBN(number: BigNumber.Value): BigNumber {
//   return new BigNumber(number);
// }

// export const BN_ZERO: BigNumber = toBN("0");
// export const BN_ONE: BigNumber = toBN("1");
// export const BN_TEN: BigNumber = toBN("10");

// export enum RoundMode {
//   ROUND_UP,
//   ROUND_DOWN,
// }

// export function removeTrailingZeros(number: BigNumber.Value): string {
//   return toBN(number).toString();
// }

// // TODO: delete
// /**
//  * @deprecated Use formatCurrency or formatDollarAmount instead
//  */
// export function formatPrice(
//   number: BigNumber.Value,
//   pricePrecision = 2,
//   separator = false,
//   roundMode = RoundMode.ROUND_DOWN,
// ): string {
//   const toFixed = toBN(number).toFixed(pricePrecision, roundMode);
//   return separator ? toBN(toFixed).toFormat() : removeTrailingZeros(toFixed);
// }

// export const formatAmount = (amount: BigNumber.Value | undefined | null, fixed = 6, separator = false): string => {
//   if (amount === null || amount === undefined) return "";

//   const bnAmount = toBN(amount);
//   if (BN_TEN.pow(fixed - 1).lte(bnAmount)) {
//     return separator ? toBN(amount).toFormat(0, BigNumber.ROUND_DOWN) : bnAmount.toFixed(0, BigNumber.ROUND_DOWN);
//   }

//   const rounded = bnAmount.sd(fixed, BigNumber.ROUND_DOWN);
//   return separator ? toBN(rounded.toFixed()).toFormat() : rounded.toFixed();
// };

// export const formatCurrency = (
//   amount: BigNumber.Value | undefined | null,
//   decimals = 2,
//   fixed = 6,
//   separator = false,
// ) => {
//   if (amount === undefined || amount === null || amount === "") return "-";
//   const bnAmount = toBN(amount);
//   if (bnAmount.isZero()) {
//     return "0";
//   }
//   if (bnAmount.lt(0.001) && bnAmount.gt(0)) {
//     return "< 0.001";
//   }

//   if (bnAmount.gte(1e9)) {
//     const numericAmount = parseFloat(formatAmount(bnAmount.div(1e9), fixed, separator)).toFixed(decimals);
//     const numericAmountWithComa = numericAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     return numericAmountWithComa + "B";
//   }

//   if (bnAmount.abs().gte(1e6)) {
//     // Return the millions parsed with , every 3 digits
//     const numericAmount = parseFloat(formatAmount(bnAmount.div(1e6), fixed, separator)).toFixed(decimals);
//     const numericAmountWithComa = numericAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     return numericAmountWithComa + "M";
//   }

//   if (bnAmount.abs().gte(1e3)) {
//     const numericAmount = parseFloat(formatAmount(bnAmount.div(1e3), fixed, separator)).toFixed(decimals);
//     const numericAmountWithComa = numericAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     return numericAmountWithComa + "K";
//   }

//   const formattedAmount = parseFloat(formatAmount(bnAmount, fixed, separator));

//   return formattedAmount.toFixed(formattedAmount < 1 ? 5 : 2);
// };

// export const formatDollarAmount = (
//   amount: BigNumber.Value | undefined | null,
//   showSymbol = true,
//   decimals = 2,
//   fixed = 4,
// ) => {
//   const formattedAmount = formatCurrency(amount, decimals, fixed, false);
//   if (formattedAmount === "< 0.001") {
//     return `< ${showSymbol ? "$" : ""}0.001`;
//   }
//   return formattedAmount !== "-" ? `${showSymbol ? "$" : ""}${formattedAmount}` : "-";
// };

// /**
//  * @deprecated Use parseEther or parseUnits instead
//  */
// export function toWei(amount: BigNumber.Value | null | bigint, decimals = 18): bigint {
//   return BigInt(toWeiBN(amount?.toString() || "0", decimals).toFixed(0));
// }
// /**
//  * @deprecated Use parseEther or parseUnits instead
//  */
// export function toWeiBN(amount: BigNumber.Value | null, decimals = 18): BigNumber {
//   if (amount === undefined || amount === null || amount === "") return BN_ZERO;
//   if (typeof amount === "string" && isNaN(Number(amount))) {
//     return BN_ZERO;
//   }
//   return toBN(amount).times(BN_TEN.pow(decimals));
// }
// /**
//  * @deprecated Use formatEther or formatUnits instead
//  */
// export function fromWei(amount: BigNumber.Value | null | undefined, decimals = 18, defaultOutput?: string): string {
//   if (amount === undefined || amount === null || amount === "") return "0";
//   if (typeof amount === "string" && isNaN(Number(amount))) {
//     return defaultOutput ?? "0";
//   }

//   return toBN(amount).div(BN_TEN.pow(decimals)).toString();
// }

// // TODO: delete
// /**
//  * @deprecated Use formatCurrency, formatDollarAmount or formatAmount instead
//  */
// export function formatNumber(n: number, dec: number = 18) {
//   if (Number.isInteger(n)) {
//     return n.toString();
//   } else {
//     return n.toFixed(dec).replace(/(\.\d*?[1-9])0+$|\.$/, "$1");
//   }
// }

// // TODO: delete
// /**
//  * @deprecated Use formatCurrency, formatDollarAmount or formatAmount instead
//  */
// export function formatNumberWithDots(number: number | undefined) {
//   if (number === undefined || isNaN(number)) {
//     return "0";
//   }

//   const numberAsString = number.toString();

//   const parts = numberAsString.split(",");
//   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//   return parts.join(",");
// }

// // TODO: delete
// /**
//  * @deprecated Use formatCurrency, formatDollarAmount or formatAmount instead
//  */
// export function formatCurrencyWithDotsAndDecimals(amount: number, decimals?: number): string {
//   if (decimals !== undefined) {
//     return `$${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
//   } else {
//     return `$${
//       Math.floor(amount)
//         .toString()
//         .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//     }`;
//   }
// }
