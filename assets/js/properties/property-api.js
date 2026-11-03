/** @import { ApiResult, LookupOption, Property } from "./types.js" */

import { PROPERTY_API_BASE_URL } from "../config/site-config.js";
import { mapApiLookupItem, mapApiProperty } from "./map-property.js";

/** The property API often takes 10–30s, so give it room while the loading state shows. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Raw feed items requested per featured home, leaving room for listings that get filtered out. */
const FEED_ITEMS_PER_HOME = 2;

/** The last good featured homes are kept for returning visitors for up to a week. */
const STORED_FEATURED_KEY = "cch:featured-homes:v1";
const STORED_FEATURED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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
 * @param {unknown} value
 * @returns {value is Property}
 */
const isStoredProperty = (value) =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "number" &&
  "title" in value &&
  typeof value.title === "string" &&
  "href" in value &&
  typeof value.href === "string" &&
  "images" in value &&
  Array.isArray(value.images);

/**
 * Featured homes saved by an earlier visit, or `null` when there are none, they are too old,
 * or storage is unavailable.
 *
 * @param {number} limit
 * @returns {Property[] | null}
 */
function readStoredFeatured(limit) {
  try {
    const raw = window.localStorage.getItem(STORED_FEATURED_KEY);
    if (!raw) return null;
    /** @type {unknown} */
    const stored = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null) return null;
    if (!("savedAt" in stored) || typeof stored.savedAt !== "number") return null;
    if (Date.now() - stored.savedAt > STORED_FEATURED_MAX_AGE_MS) return null;
    if (!("properties" in stored) || !Array.isArray(stored.properties)) return null;
    const properties = stored.properties.filter(isStoredProperty).slice(0, limit);
    return properties.length > 0 ? properties : null;
  } catch {
    return null;
  }
}

/** @param {Property[]} properties */
function storeFeatured(properties) {
  if (properties.length === 0) return;
  try {
    window.localStorage.setItem(
      STORED_FEATURED_KEY,
      JSON.stringify({ savedAt: Date.now(), properties }),
    );
  } catch {
    // Storage can be full or blocked; the next visit simply waits for the network.
  }
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
 *
 * A returning visitor gets the homes saved by their last visit straight away, while a fresh
 * copy is fetched in the background for next time. On failure with nothing saved, the result
 * is `{ ok: false, data: [] }`; callers show an honest message.
 *
 * @param {number} limit
 * @returns {Promise<ApiResult<Property[]>>}
 */
export function getFeaturedProperties(limit) {
  const fresh = cached(
    `featured:${limit}`,
    async () => {
      const items = await fetchList(`/feed/1/${limit * FEED_ITEMS_PER_HOME}/-1`);
      const properties = items
        .map(mapApiProperty)
        .filter(isPresent)
        .filter(isShowcaseReady)
        .slice(0, limit);
      storeFeatured(properties);
      return properties;
    },
    /** @type {Property[]} */ ([]),
  );

  const stored = readStoredFeatured(limit);
  return stored ? Promise.resolve({ ok: true, data: stored }) : fresh;
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
