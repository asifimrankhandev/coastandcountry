/** @import { Money, Property } from "./types.js" */

/** @type {Map<string, Intl.NumberFormat>} */
const priceFormatters = new Map();

/**
 * @param {string} currency
 * @returns {Intl.NumberFormat}
 */
function getPriceFormatter(currency) {
  let formatter = priceFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    priceFormatters.set(currency, formatter);
  }
  return formatter;
}

/**
 * @param {Money | null} price
 * @param {Property["listingType"]} listingType
 * @returns {string}
 */
export function formatPrice(price, listingType) {
  if (!price) return "Price on request";
  const formatted = getPriceFormatter(price.currency).format(price.amount);
  return listingType === "rent" ? `${formatted} / month` : formatted;
}

/**
 * @param {number | null} areaSqm
 * @returns {string | null}
 */
export function formatArea(areaSqm) {
  return areaSqm === null ? null : `${new Intl.NumberFormat("en-GB").format(areaSqm)} m²`;
}
