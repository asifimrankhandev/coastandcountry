(function () {
  "use strict";

  // --- assets/js/config/site-config.js ---
  /** Read-only public property feed used by the current site (CORS-enabled). */
  const PROPERTY_API_BASE_URL = "https://api.cypruscoastandcountry.com/apis/v1";
  

  // --- assets/js/lib/text.js ---
  /**
   * Splits text at word boundaries into at most `count` lines of roughly equal length.
   *
   * @param {string} text
   * @param {number} count
   * @returns {string[]}
   */
  function splitIntoLines(text, count) {
    const words = text.split(/\s+/).filter(Boolean);
    const targetLength = text.length / count;
    /** @type {string[]} */
    const lines = [];
    let current = "";
  
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && candidate.length > targetLength && lines.length < count - 1) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
  
  /**
   * Keeps whole words from the start of `text` until adding another would exceed `maxLength`.
   *
   * @param {string} text
   * @param {number} maxLength
   * @returns {string}
   */
  function shortenTitle(text, maxLength) {
    let result = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const candidate = result ? `${result} ${word}` : word;
      if (candidate.length > maxLength && result) break;
      result = candidate;
    }
    // Drop a dangling connector such as "with" or "&" left at the cut.
    return result.replace(/\s+(with|and|&|in|of|for|-)$/i, "");
  }
  

  // --- assets/js/lib/dom.js ---
  /**
   * Creates an element. Text is always set as text, never parsed as HTML, so content from
   * the property API cannot inject markup.
   *
   * @template {keyof HTMLElementTagNameMap} Tag
   * @param {Tag} tag
   * @param {{ className?: string, text?: string, attributes?: Record<string, string> }} [options]
   * @param {(Node | null)[]} [children]
   * @returns {HTMLElementTagNameMap[Tag]}
   */
  function createElement(tag, options = {}, children = []) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    for (const [name, value] of Object.entries(options.attributes ?? {})) {
      element.setAttribute(name, value);
    }
    for (const child of children) if (child) element.append(child);
    return element;
  }
  
  /**
   * Builds headline lines that each slide up out of their own mask (see `.mask-line`).
   *
   * @param {readonly string[]} lines
   * @returns {HTMLSpanElement[]}
   */
  function createMaskedLines(lines) {
    return lines.map((line, index) => {
      const inner = createElement("span", { text: `${line} ` });
      const outer = createElement("span", { className: "mask-line" }, [inner]);
      outer.style.setProperty("--i", String(index));
      return outer;
    });
  }
  
  /**
   * A `<picture>`-less cover image for remote photos, which come in a single size.
   *
   * @param {string} src
   * @param {string} alt
   * @param {{ eager?: boolean }} [options]
   * @returns {HTMLImageElement}
   */
  function createCoverImage(src, alt, options = {}) {
    return createElement("img", {
      className: "cover",
      attributes: {
        src,
        alt,
        loading: options.eager ? "eager" : "lazy",
        decoding: "async",
        draggable: "false",
      },
    });
  }
  
  /** @returns {boolean} */
  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  

  // --- assets/js/properties/format-property.js ---
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
  function formatPrice(price, listingType) {
    if (!price) return "Price on request";
    const formatted = getPriceFormatter(price.currency).format(price.amount);
    return listingType === "rent" ? `${formatted} / month` : formatted;
  }
  
  /**
   * @param {number | null} areaSqm
   * @returns {string | null}
   */
  function formatArea(areaSqm) {
    return areaSqm === null ? null : `${new Intl.NumberFormat("en-GB").format(areaSqm)} m²`;
  }
  

  // --- assets/js/properties/map-property.js ---
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
  function mapApiProperty(source) {
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
  function mapApiLookupItem(source) {
    if (!isRecord(source) || !Number.isInteger(source.id)) return null;
    const name = toText(source.name)?.trim();
    if (!name) return null;
    const label = toTitleCase(name);
    return { id: /** @type {number} */ (source.id), slug: toSlug(label), label };
  }
  

  // --- assets/js/properties/property-api.js ---
  /** @import { ApiResult, LookupOption, Property } from "./types.js" */
  
  
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
  const DEFAULT_FEATURED_PROPERTIES = [
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
  function getFeaturedProperties(limit) {
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
  function getPropertyLocations() {
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
  function getPropertyTypes() {
    return cached(
      "types",
      async () => {
        const items = await fetchList("/property/type");
        return items.map(mapApiLookupItem).filter(isPresent);
      },
      /** @type {LookupOption[]} */ ([]),
    );
  }
  

  // --- assets/js/components/count-up.js ---
  
  const numberFormat = new Intl.NumberFormat("en-GB");
  const DURATION_MS = 1800;
  
  /**
   * Counts `output` from zero to `value` the first time it scrolls into view. Its visually
   * hidden sibling carries the final value for screen readers.
   *
   * @param {HTMLElement} output
   * @param {number} value
   */
  function countUp(output, value) {
    const render = (/** @type {number} */ current) => {
      output.textContent = numberFormat.format(current);
    };
  
    if (prefersReducedMotion()) {
      render(value);
      return;
    }
  
    render(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (/** @type {number} */ now) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          // Ease out quartically so the last digits settle slowly.
          render(Math.round(value * (1 - (1 - progress) ** 4)));
          if (progress < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(output);
  }
  

  // --- assets/js/components/scroll-reveal.js ---
  /**
   * Marks `[data-reveal]` elements with `data-revealed` the first time they enter the
   * viewport; CSS then plays their entrance once (see base.css).
   */
  function initScrollReveal() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (elements.length === 0) return;
  
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -4% 0px" },
    );
    for (const element of elements) observer.observe(element);
  }
  

  // --- assets/js/components/site-header.js ---
  /** Scroll distance before the header gains its backdrop. */
  const SOLID_AFTER_PX = 48;
  
  /**
   * The header gains a blurred backdrop once the page scrolls and tucks away while scrolling
   * down, so content has the full screen. Keyboard focus always brings it back.
   */
  function initSiteHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
  
    let lastY = window.scrollY;
    let frame = 0;
  
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      header.classList.toggle("is-solid", y > SOLID_AFTER_PX);
      header.classList.toggle("is-hidden", y > lastY && y > window.innerHeight * 0.5);
      lastY = y;
    };
  
    window.addEventListener(
      "scroll",
      () => {
        if (!frame) frame = window.requestAnimationFrame(update);
      },
      { passive: true },
    );
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
    update();
  }
  

  // --- assets/js/components/site-menu.js ---
  
  
  
  /** Matches the homepage carousel, so both read one request. */
  const MENU_MENU_FEATURED_LIMIT = 3;
  
  /**
   * Full-screen menu on the native <dialog>, which traps focus and closes on Escape.
   * The newest featured home is added the first time the menu opens.
   */
  function initSiteMenu() {
    const dialog = document.querySelector("dialog.site-menu");
    const openButton = document.querySelector("[data-menu-open]");
    if (!(dialog instanceof HTMLDialogElement) || !openButton) return;
  
    let hasLoadedFeatured = false;
  
    openButton.addEventListener("click", () => {
      dialog.showModal();
      if (!hasLoadedFeatured) {
        hasLoadedFeatured = true;
        void renderFeaturedListing(dialog);
      }
    });
    dialog.addEventListener("toggle", () => {
      openButton.setAttribute("aria-expanded", String(dialog.open));
    });
    for (const closer of dialog.querySelectorAll("[data-menu-close], a")) {
      closer.addEventListener("click", () => dialog.close());
    }
  }
  
  /** @param {HTMLDialogElement} dialog */
  async function renderFeaturedListing(dialog) {
    const slot = dialog.querySelector("[data-menu-featured]");
    if (!slot) return;
  
    const { data: properties } = await getFeaturedProperties(FEATURED_LIMIT);
    const [lead] = properties;
    const cover = lead?.images[0];
    if (!lead || !cover) return;
  
    const link = createElement(
      "a",
      { className: "site-menu__featured", attributes: { href: lead.href } },
      [
        createElement("p", { className: "label", text: "(Featured home)" }),
        createElement("div", { className: "frame" }, [
          createCoverImage(cover.url, "", { eager: true }),
        ]),
        createElement("p", { className: "site-menu__featured-title display-sm", text: lead.title }),
        createElement("p", {
          className: "text-secondary",
          text: formatPrice(lead.price, lead.listingType),
        }),
      ],
    );
    link.addEventListener("click", () => dialog.close());
    slot.replaceChildren(link);
  }
  

  // --- assets/js/components/stack-sections.js ---
  
  /**
   * Drives the scroll stack (`.slide`, see layout.css). Each slide is pinned by its bottom
   * edge so all of its content is seen, and exposes how far the next slide covers it as
   * `--cover`, which shrinks and dims its card.
   *
   * All slides share one animation frame: every position is read first, then every style is
   * written, so scrolling never forces a layout between slides.
   */
  function initStackSections() {
    const slides = [...document.querySelectorAll(".slide")].filter(
      (slide) => slide instanceof HTMLElement,
    );
    if (slides.length === 0 || prefersReducedMotion()) return;
  
    /** Last written values, so unchanged frames cost no style work. */
    const written = new Map(slides.map((slide) => [slide, { top: "", cover: "" }]));
    const heights = new Map(slides.map((slide) => [slide, slide.offsetHeight]));
    let frame = 0;
  
    const update = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const measured = slides.map((slide) => {
        const next = slide.nextElementSibling;
        return {
          slide,
          height: heights.get(slide) || viewportHeight,
          nextTop: next?.classList.contains("slide") ? next.getBoundingClientRect().top : null,
        };
      });
  
      for (const { slide, height, nextTop } of measured) {
        const state = written.get(slide);
        if (!state) continue;
        const top = `${Math.min(0, viewportHeight - height)}px`;
        const cover =
          nextTop === null ? "0" : Math.min(1, Math.max(0, 1 - nextTop / viewportHeight)).toFixed(3);
        if (top !== state.top) slide.style.top = state.top = top;
        if (cover !== state.cover) slide.style.setProperty("--cover", (state.cover = cover));
      }
    };
  
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
  
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          heights.set(entry.target, entry.contentRect.height);
        }
      }
      schedule();
    });
    for (const slide of slides) resizeObserver.observe(slide);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }
  

  // --- assets/js/home/hero-intro.js ---
  /**
   * The intro loader plays for at least LOADER_MIN_MS so it never flashes on a cached visit,
   * and at most LOADER_MAX_MS so a slow connection never blocks the page.
   */
  const LOADER_MIN_MS = 250;
  const LOADER_MAX_MS = 600;
  function initHeroIntro() {
    const loader = document.querySelector(".page-loader");
    const hero = document.querySelector(".hero");
    if (!hero) return;
  
    if (!loader) {
      hero.classList.add("is-ready");
      return;
    }
  
    let photoReady = false;
    let minElapsed = false;
    let finished = false;
  
    const heroImg = hero.querySelector(".hero__photo img");
  
    const finish = () => {
      if (finished) return;
      finished = true;
      loader.classList.add("is-done");
      hero.classList.add("is-ready");
      setTimeout(() => {
        loader.remove();
      }, 500);
    };
  
    const check = () => {
      if (photoReady && minElapsed) {
        finish();
      }
    };
  
    const minTimer = setTimeout(() => {
      minElapsed = true;
      check();
    }, LOADER_MIN_MS);
  
    const maxTimer = setTimeout(() => {
      finish();
    }, LOADER_MAX_MS);
  
    if (heroImg) {
      if (heroImg.complete && heroImg.naturalWidth > 0) {
        photoReady = true;
        check();
      } else {
        heroImg.addEventListener(
          "load",
          () => {
            photoReady = true;
            check();
          },
          { once: true },
        );
        heroImg.addEventListener(
          "error",
          () => {
            photoReady = true;
            check();
          },
          { once: true },
        );
      }
    } else {
      photoReady = true;
      check();
    }
  }
  

  // --- assets/js/home/figures-section.js ---
  function initFiguresSection() {
    const section = document.querySelector(".figures");
    if (!section) return;
  
    const areasEl = section.querySelector('[data-figure="areas"]');
    const typesEl = section.querySelector('[data-figure="types"]');
    const regionsEl = section.querySelector('[data-figure="regions"]');
    const phonesEl = section.querySelector('[data-figure="phones"]');
  
    if (regionsEl) countUp(regionsEl, 3);
    if (phonesEl) countUp(phonesEl, 2);
  
    void Promise.all([getPropertyLocations(), getPropertyTypes()]).then(([locations, types]) => {
      if (areasEl) {
        if (locations.ok && locations.data.length > 0) {
          countUp(areasEl, locations.data.length);
        } else {
          areasEl.textContent = "—";
        }
      }
      if (typesEl) {
        if (types.ok && types.data.length > 0) {
          countUp(typesEl, types.data.length);
        } else {
          typesEl.textContent = "—";
        }
      }
    });
  }
  

  // --- assets/js/home/featured-carousel.js ---
  
  
  
  
  const FEATURED_LIMIT = 3;
  const OVERLAY_TITLE_LENGTH = 26;
  const SWIPE_THRESHOLD_PX = 48;
  const SLOTS = [-2, -1, 0, 1, 2];
  function initFeaturedCarousel() {
    const container = document.querySelector("[data-featured-carousel]");
    if (!container) return;
  
    void getFeaturedProperties(FEATURED_LIMIT).then(({ data: properties }) => {
      const list = properties && properties.length > 0 ? properties : DEFAULT_FEATURED_PROPERTIES;
      renderCarousel(container, list);
    });
  }
  
  /**
   * @param {HTMLElement} container
   * @param {import("../properties/types.js").Property[]} properties
   */
  function renderCarousel(container, properties) {
    const count = properties.length;
    let position = 0;
    let hasKeyboardFocus = false;
    let isInView = false;
    let isHovered = false;
    let swipeStartX = null;
    let didSwipe = false;
  
    const itemAt = (virtualIndex) => properties[((virtualIndex % count) + count) % count];
  
    container.innerHTML = `
      <div class="featured__head">
        <h2 id="featured-title" class="label">Featured homes</h2>
        <div class="featured__controls">
          <div class="featured__pagination" role="tablist" aria-label="Featured homes"></div>
          <div class="featured__arrows">
            <button type="button" class="featured__arrow-btn" aria-label="Previous home" data-carousel-prev>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button type="button" class="featured__arrow-btn" aria-label="Next home" data-carousel-next>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="featured__stage">
        <div class="featured__track"></div>
        <p class="featured__title display-md" aria-hidden="true"></p>
      </div>
      <div class="featured__details-container" aria-live="polite"></div>
    `;
  
    const paginationEl = container.querySelector(".featured__pagination");
    const trackEl = container.querySelector(".featured__track");
    const overlayTitleEl = container.querySelector(".featured__title");
    const detailsEl = container.querySelector(".featured__details-container");
    const stageEl = container.querySelector(".featured__stage");
    const prevBtn = container.querySelector("[data-carousel-prev]");
    const nextBtn = container.querySelector("[data-carousel-next]");
  
    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));
  
    // Create pagination buttons
    const pageButtons = properties.map((property, index) => {
      const btn = createElement("button", {
        className: "featured__page label",
        text: `(${index + 1})`,
        attributes: {
          type: "button",
          role: "tab",
          "aria-label": `Show featured home ${index + 1} of ${count}`,
        },
      });
      btn.addEventListener("click", () => {
        const activeIndex = ((position % count) + count) % count;
        step((index - activeIndex + count) % count);
      });
      paginationEl.append(btn);
      return btn;
    });
  
    // Create frames for each slot: [-2, -1, 0, 1, 2]
    const frames = SLOTS.map((slot) => {
      const frame = createElement("div", {
        className: "featured__frame",
        attributes: { "data-slot": String(slot) },
      });
  
      const img = createCoverImage("", "", { eager: false });
      frame.append(img);
  
      const link = createElement("a", {
        className: "featured__frame-link",
        attributes: { draggable: "false" },
      });
      frame.append(link);
  
      const stepBtn = createElement("button", {
        className: "featured__frame-step",
        attributes: {
          type: "button",
          tabIndex: "-1",
          "aria-label": slot < 0 ? "Show previous home" : "Show next home",
        },
      });
      stepBtn.addEventListener("click", () => step(slot));
      frame.append(stepBtn);
  
      trackEl.append(frame);
      return { frame, img, link, stepBtn, slot };
    });
  
    function update() {
      const activeIndex = ((position % count) + count) % count;
      const active = itemAt(position);
  
      // Update pagination tabs and progress bar
      pageButtons.forEach((btn, index) => {
        const isActive = index === activeIndex;
        btn.setAttribute("aria-current", String(isActive));
        btn.setAttribute("aria-selected", String(isActive));
        btn.querySelectorAll(".featured__progress").forEach((p) => p.remove());
  
        if (isActive && count > 1 && !prefersReducedMotion()) {
          const progress = createElement("span", {
            className: "featured__progress",
            attributes: { "aria-hidden": "true" },
          });
          progress.addEventListener("animationend", () => {
            step(1);
          });
          if (!shouldAutoplay()) {
            progress.style.animationPlayState = "paused";
          }
          btn.append(progress);
        }
      });
  
      // Update conveyor frames
      SLOTS.forEach((slot, slotIndex) => {
        const item = itemAt(position + slot);
        const frameObj = frames[slotIndex];
        frameObj.frame.setAttribute("data-slot", String(slot));
        frameObj.frame.setAttribute("aria-hidden", String(slot !== 0));
  
        const cover = item?.images?.[0];
        if (cover) {
          frameObj.img.src = cover.url;
          frameObj.img.alt = slot === 0 ? item.title : "";
        }
        if (item) {
          frameObj.link.href = item.href;
          frameObj.link.setAttribute("aria-label", item.title);
        }
      });
  
      // Update overlay title
      overlayTitleEl.replaceChildren();
      const shortTitle = shortenTitle(active.title, OVERLAY_TITLE_LENGTH);
      const titleLines = splitIntoLines(shortTitle, 2);
      const maskedSpans = createMaskedLines(titleLines);
      overlayTitleEl.append(...maskedSpans);
      overlayTitleEl.classList.remove("rise-in");
      void overlayTitleEl.offsetWidth;
      overlayTitleEl.classList.add("rise-in");
  
      // Update details
      const facts = [
        active.bedrooms ? `${active.bedrooms} bed` : null,
        formatArea(active.internalAreaSqm),
        active.reference ? `Ref. ${active.reference}` : null,
      ].filter(Boolean);
  
      const factsList = createElement(
        "ul",
        { className: "featured__facts" },
        facts.map((fact) => createElement("li", { text: fact })),
      );
  
      const buyCol = createElement("div", { className: "featured__buy" }, [
        createElement("p", {
          className: "display-md",
          text: formatPrice(active.price, active.listingType),
        }),
        facts.length > 0 ? factsList : null,
        createElement(
          "a",
          {
            className: "pill pill--outline",
            attributes: { href: active.href },
          },
          [
            createElement("span", { className: "pill__label" }, [
              createElement("span", { text: "View this home" }),
              createElement("span", {
                text: "View this home",
                attributes: { "aria-hidden": "true" },
              }),
            ]),
          ],
        ),
      ]);
  
      const detailsGrid = createElement("div", { className: "featured__details fade-in" }, [
        createElement("div", {}, [
          createElement("h3", { className: "featured__name", text: active.title }),
          active.summary
            ? createElement("p", { className: "featured__summary", text: active.summary })
            : null,
        ]),
        buyCol,
      ]);
  
      detailsEl.replaceChildren(detailsGrid);
    }
  
    function step(direction) {
      if (direction === 0) return;
      position += direction;
      update();
    }
  
    function shouldAutoplay() {
      return count > 1 && !prefersReducedMotion() && !hasKeyboardFocus && isInView && !isHovered;
    }
  
    function syncAutoplayState() {
      const progress = container.querySelector(".featured__progress");
      if (progress) {
        progress.style.animationPlayState = shouldAutoplay() ? "running" : "paused";
      }
    }
  
    // IntersectionObserver for view detection
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView = entry?.isIntersecting ?? false;
        syncAutoplayState();
      },
      { threshold: 0.2 },
    );
    observer.observe(container);
  
    // Focus & hover listeners
    container.addEventListener("focusin", (e) => {
      if (e.target.matches(":focus-visible")) {
        hasKeyboardFocus = true;
        syncAutoplayState();
      }
    });
    container.addEventListener("focusout", (e) => {
      if (!container.contains(e.relatedTarget)) {
        hasKeyboardFocus = false;
        syncAutoplayState();
      }
    });
    stageEl.addEventListener("mouseenter", () => {
      isHovered = true;
      syncAutoplayState();
    });
    stageEl.addEventListener("mouseleave", () => {
      isHovered = false;
      syncAutoplayState();
    });
  
    // Swipe handlers
    stageEl.addEventListener("pointerdown", (e) => {
      swipeStartX = e.clientX;
    });
    stageEl.addEventListener("pointerup", (e) => {
      if (swipeStartX === null) return;
      const distance = e.clientX - swipeStartX;
      swipeStartX = null;
      didSwipe = Math.abs(distance) >= SWIPE_THRESHOLD_PX;
      if (didSwipe) step(distance < 0 ? 1 : -1);
    });
    stageEl.addEventListener("pointercancel", () => {
      swipeStartX = null;
    });
    stageEl.addEventListener("dragstart", (e) => e.preventDefault());
    stageEl.addEventListener(
      "click",
      (e) => {
        if (didSwipe) {
          didSwipe = false;
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  
    // Initial render
    update();
  }
  

  // --- assets/js/main.js ---
  
  
  
  
  
  
  
  // Mark document root with .js so progressive CSS and reveal animations activate
  document.documentElement.classList.add("js");
  
  function init() {
    initSiteHeader();
    initSiteMenu();
    initStackSections();
    initScrollReveal();
    initHeroIntro();
    initFiguresSection();
    initFeaturedCarousel();
  }
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
  

})();
