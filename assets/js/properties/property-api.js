/** @import { ApiResult, LookupOption, Property } from "./types.js" */

import { PROPERTY_API_BASE_URL } from "../config/site-config.js";
import { mapApiLookupItem, mapApiProperty } from "./map-property.js";

const REQUEST_TIMEOUT_MS = 8_000;

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

export const DEFAULT_FEATURED_PROPERTIES = [
  {
    id: 101,
    reference: "CC-4102",
    title: "Seafront Villa with Infinity Pool",
    summary: "Commanding panoramic Mediterranean views, private landscaped gardens, and direct private cove access in Catalkoy, Girne.",
    listingType: "sale",
    price: { amount: 595000, currency: "GBP" },
    bedrooms: 4,
    internalAreaSqm: 280,
    images: [{ id: 1, url: "./assets/images/home/villa-pool-sunloungers-1080.webp" }],
    isComplete: true,
    publishedAt: "2026-01-15",
    href: "/properties",
  },
  {
    id: 102,
    reference: "CC-3215",
    title: "Luxury Mountain View Penthouse",
    summary: "Spacious private rooftop terrace facing the Kyrenia range with high ceilings, private pool access, and sunset balconies.",
    listingType: "sale",
    price: { amount: 345000, currency: "GBP" },
    bedrooms: 3,
    internalAreaSqm: 195,
    images: [{ id: 2, url: "./assets/images/home/country-roof-terrace-mountains-1400.webp" }],
    isComplete: true,
    publishedAt: "2026-02-01",
    href: "/properties",
  },
  {
    id: 103,
    reference: "CC-5540",
    title: "Contemporary Residence & Gardens",
    summary: "Architect-designed villa nestled between the foothills and the coastline with open-plan living and private gated grounds.",
    listingType: "sale",
    price: { amount: 720000, currency: "GBP" },
    bedrooms: 5,
    internalAreaSqm: 360,
    images: [{ id: 3, url: "./assets/images/home/residence-pool-mountains-1600.webp" }],
    isComplete: true,
    publishedAt: "2026-02-20",
    href: "/properties",
  },
];

/**
 * Complete listings the agency has flagged as featured, for sale, with a photo.
 * Falls back to curated photography homes if the API is offline or slow.
 *
 * @param {number} limit
 * @returns {Promise<ApiResult<Property[]>>}
 */
export function getFeaturedProperties(limit) {
  return cached(
    `featured:${limit}`,
    async () => {
      try {
        const items = await fetchList(`/feed/1/${limit * 4}/-1`);
        const mapped = items.map(mapApiProperty).filter(isPresent).filter(isShowcaseReady).slice(0, limit);
        return mapped.length > 0 ? mapped : DEFAULT_FEATURED_PROPERTIES.slice(0, limit);
      } catch (err) {
        return DEFAULT_FEATURED_PROPERTIES.slice(0, limit);
      }
    },
    DEFAULT_FEATURED_PROPERTIES.slice(0, limit),
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
