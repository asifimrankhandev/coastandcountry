/**
 * Domain types shared by the property modules. Unknown values are `null`, never `0`.
 *
 * @typedef {"sale" | "rent"} ListingType
 *
 * @typedef {object} Money
 * @property {number} amount
 * @property {string} currency ISO 4217 code, e.g. "GBP".
 *
 * @typedef {object} PropertyImage
 * @property {number} id
 * @property {string} url
 *
 * @typedef {object} Property
 * @property {number} id
 * @property {string | null} reference
 * @property {string} title
 * @property {string | null} summary
 * @property {ListingType} listingType
 * @property {Money | null} price
 * @property {number | null} bedrooms
 * @property {number | null} internalAreaSqm
 * @property {readonly PropertyImage[]} images
 * @property {boolean} isComplete Has a CMS-written title and a valid price.
 * @property {string | null} publishedAt
 * @property {string} href
 *
 * @typedef {object} LookupOption
 * @property {number} id
 * @property {string} slug
 * @property {string} label
 */

/**
 * A generic typedef needs its own comment block for `@template` to apply to it.
 *
 * @template T
 * @typedef {object} ApiResult
 * @property {boolean} ok `false` when the request failed and `data` is a fallback.
 * @property {T} data
 */

export {};
