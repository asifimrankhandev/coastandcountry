/** @import { ApiResult, LookupOption, Property } from "./types.js" */

import { PROPERTY_API_BASE_URL } from "../config/site-config.js";
import { mapApiLookupItem, mapApiProperty } from "./map-property.js";

const REQUEST_TIMEOUT_MS = 8_000;

/** Featured homes shown by the homepage carousel and the menu; both share one request. */
export const FEATURED_HOMES_LIMIT = 3;

/**
 * Requests made during this page view, keyed by endpoint, so the menu and the homepage
 * share one request for the same data.
 *
 * @type {Map<string, Promise<ApiResult<unknown>>>}
 */
const cache = new Map();

/**
 * Loads once per page view; a failure resolves to `{ ok: false, data: fallback }`.
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} load
 * @param {T} fallback
 * @returns {Promise<ApiResult<T>>}
 */
function cached(key, load, fallback) {
  const existing = cache.get(key);
  if (existing) return /** @type {Promise<ApiResult<T>>} */ (existing);

  const request = load().then(
    (data) => ({ ok: true, data }),
    (error) => {
      console.error("[property-api]", error);
      cache.delete(key);
      return { ok: false, data: fallback };
    },
  );
  cache.set(key, request);
  return request;
}

/**
 * Fetches a `{ result: [] }` endpoint and returns its raw items.
 *
 * @param {string} path
 * @returns {Promise<unknown[]>}
 */
async function fetchList(path) {
  const response = await fetch(`${PROPERTY_API_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Property API ${path} responded with ${response.status}`);

  /** @type {unknown} */
  const body = await response.json();
  if (typeof body !== "object" || body === null || !("result" in body)) {
    throw new Error(`Property API ${path} returned an unexpected shape`);
  }
  return Array.isArray(body.result) ? body.result : [];
}

/**
 * @template T
 * @param {T | null} value
 * @returns {value is T}
 */
const isPresent = (value) => value !== null;

/**
 * @param {Property} property
 * @returns {boolean}
 */
const isShowcaseReady = (property) =>
  property.isComplete && property.images.length > 0 && property.listingType === "sale";

/**
 * Complete listings the agency has flagged as featured, for sale, with a photo.
 * On failure the result is `{ ok: false, data: [] }`; callers show an honest message.
 *
 * @param {number} limit
 * @returns {Promise<ApiResult<Property[]>>}
 */
export function getFeaturedProperties(limit) {
  return cached(
    `featured:${limit}`,
    async () => {
      const items = await fetchList(`/feed/1/${limit * 4}/-1`);
      return items.map(mapApiProperty).filter(isPresent).filter(isShowcaseReady).slice(0, limit);
    },
    /** @type {Property[]} */ ([]),
  );
}

/** @returns {Promise<ApiResult<LookupOption[]>>} */
export function getPropertyLocations() {
  return cached(
    "locations",
    async () => {
      const items = await fetchList("/property/location");
      return items.map(mapApiLookupItem).filter(isPresent);
    },
    /** @type {LookupOption[]} */ ([]),
  );
}

/** @returns {Promise<ApiResult<LookupOption[]>>} */
export function getPropertyTypes() {
  return cached(
    "types",
    async () => {
      const items = await fetchList("/property/type");
      return items.map(mapApiLookupItem).filter(isPresent);
    },
    /** @type {LookupOption[]} */ ([]),
  );
}
