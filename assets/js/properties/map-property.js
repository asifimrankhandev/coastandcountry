/** @import { ListingType, LookupOption, Property, PropertyImage } from "./types.js" */

/**
 * The legacy CMS stores some prices in thousands or as placeholders (e.g. `190`).
 * Anything below this is shown as "price on request" until the client corrects the record.
 */
const MIN_PLAUSIBLE_SALE_PRICE = 10_000;

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toText(value) {
  return typeof value === "string" ? value : null;
}

/**
 * The legacy API uses `0` for "not entered"; a 0-bedroom home is not a real value there.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
function toPositiveNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * `cdn.proppy.app` permanently redirects to `cdn2.proppy.app`; use the final host directly.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
function toImageUrl(value) {
  const url = toText(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "cdn.proppy.app") parsed.hostname = "cdn2.proppy.app";
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * @param {string | null} description
 * @returns {ListingType}
 */
function toListingType(description) {
  return description?.toLowerCase().includes("rent") ? "rent" : "sale";
}

/**
 * @param {string} value
 * @returns {string}
 */
function toSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The CMS uses " * " as a separator inside titles and summaries.
 *
 * @param {string | null} value
 * @returns {string}
 */
function tidyCmsText(value) {
  return (value ?? "")
    .replace(/\s*\*\s*/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .trim();
}

/**
 * @param {string} value
 * @returns {string}
 */
function toTitleCase(value) {
  return value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

/**
 * Maps one raw feed item to a `Property`, or `null` when it is not a usable record.
 *
 * @param {unknown} source
 * @returns {Property | null}
 */
export function mapApiProperty(source) {
  if (!isRecord(source) || !Number.isInteger(source.id)) return null;
  const id = /** @type {number} */ (source.id);

  const details = Array.isArray(source.PropertyDetail)
    ? source.PropertyDetail.filter(isRecord)
    : [];
  const detail =
    details.find((item) => isRecord(item.Locale) && item.Locale.name === "en-GB") ?? details[0];

  const listingType = toListingType(toText(source.buisnessDescription));
  const bedrooms = toPositiveNumber(source.numberOfBedrooms);
  const propertyType = isRecord(source.propertyType)
    ? toText(source.propertyType.name)?.trim() || null
    : null;

  const amount = toPositiveNumber(source.price);
  const currency = toText(source.currency)?.trim().toUpperCase();
  const price =
    amount !== null &&
    currency !== undefined &&
    /^[A-Z]{3}$/.test(currency) &&
    (listingType === "rent" || amount >= MIN_PLAUSIBLE_SALE_PRICE)
      ? { amount, currency }
      : null;

  const cmsTitle = tidyCmsText(toText(detail?.title));
  const fallbackTitle = [bedrooms ? `${bedrooms}-bedroom` : null, propertyType ?? "Property"]
    .filter(Boolean)
    .join(" ");

  const rawImages = Array.isArray(source.PropertyImage) ? source.PropertyImage : [];
  /** @type {PropertyImage[]} */
  const images = rawImages.flatMap((image) => {
    if (!isRecord(image) || typeof image.id !== "number") return [];
    const url = toImageUrl(image.proppyUrl);
    return url ? [{ id: image.id, url }] : [];
  });

  return {
    id,
    reference: toText(source.reference)?.trim() || null,
    title: cmsTitle || fallbackTitle,
    summary: tidyCmsText(toText(detail?.shortDescription)) || null,
    listingType,
    price,
    bedrooms,
    internalAreaSqm: toPositiveNumber(source.houseArea),
    images,
    isComplete: Boolean(cmsTitle) && price !== null,
    publishedAt: toText(source.publishDate),
    href: `/properties/${id}`,
  };
}

/**
 * @param {unknown} source
 * @returns {LookupOption | null}
 */
export function mapApiLookupItem(source) {
  if (!isRecord(source) || !Number.isInteger(source.id)) return null;
  const name = toText(source.name)?.trim();
  if (!name) return null;
  const label = toTitleCase(name);
  return { id: /** @type {number} */ (source.id), slug: toSlug(label), label };
}
