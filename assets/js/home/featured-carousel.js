/** @import { Property } from "../properties/types.js" */

import {
  createCoverImage,
  createElement,
  createMaskedLines,
  prefersReducedMotion,
} from "../lib/dom.js";
import { shortenTitle, splitIntoLines } from "../lib/text.js";
import { formatArea, formatPrice } from "../properties/format-property.js";
import { FEATURED_HOMES_LIMIT, getFeaturedProperties } from "../properties/property-api.js";

/** The overlaid title keeps to two short lines; the full title is in the details. */
const OVERLAY_TITLE_LENGTH = 30;
/** Matches the `.featured__strip` transition in home.css. */
const SLIDE_MS = 800;
/** Pointer travel before a press becomes a drag, and the travel that counts as a swipe. */
const DRAG_START_PX = 8;
const SWIPE_THRESHOLD_PX = 48;

export function initFeaturedCarousel() {
  const root = document.querySelector("[data-featured-carousel]");
  if (!(root instanceof HTMLElement)) return;

  void getFeaturedProperties(FEATURED_HOMES_LIMIT).then(({ ok, data }) => {
    if (data.length > 0) createCarousel(root, data);
    else showUnavailable(root, ok);
  });
}

/**
 * @template {Element} T
 * @param {HTMLElement} root
 * @param {string} selector
 * @param {new (...args: never[]) => T} type
 * @returns {T}
 */
function part(root, selector, type) {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Featured carousel is missing ${selector}`);
  return element;
}

/**
 * The feed failed or has no complete listings: say so plainly and point to all properties.
 *
 * @param {HTMLElement} root
 * @param {boolean} ok
 */
function showUnavailable(root, ok) {
  const track = part(root, "[data-carousel-track]", HTMLElement);
  const status = part(root, "[data-carousel-status]", HTMLElement);
  track.classList.remove("is-loading");
  status.replaceChildren(
    createElement("p", {
      text: ok
        ? "New featured homes are being prepared."
        : "Featured homes are taking longer than usual to load.",
    }),
    createPill("/properties", "Browse all properties", "pill pill--outline"),
  );
}

/**
 * @param {string} href
 * @param {string} label
 * @param {string} className
 * @param {Record<string, string>} [attributes]
 */
function createPill(href, label, className, attributes = {}) {
  return createElement("a", { className, attributes: { href, ...attributes } }, [
    createElement("span", { className: "pill__label" }, [
      createElement("span", { text: label }),
      createElement("span", { text: label, attributes: { "aria-hidden": "true" } }),
    ]),
  ]);
}

/**
 * A looping strip of photo cards with the active one centred. Only `transform` and
 * `opacity` animate, so slides glide on the compositor without repainting.
 *
 * The strip holds a copy of the last home before the first and of the first after the last.
 * Stepping onto a copy is animated like any other step; once it settles, the strip jumps,
 * with transitions off for one frame, to the real slide showing the same photo.
 *
 * @param {HTMLElement} root
 * @param {Property[]} properties
 */
function createCarousel(root, properties) {
  const track = part(root, "[data-carousel-track]", HTMLElement);
  const strip = part(root, "[data-carousel-strip]", HTMLElement);
  const status = part(root, "[data-carousel-status]", HTMLElement);
  const title = part(root, "[data-carousel-title]", HTMLElement);
  const details = part(root, "[data-carousel-details]", HTMLElement);
  const controls = part(root, "[data-carousel-controls]", HTMLElement);
  const pagination = part(root, "[data-carousel-pagination]", HTMLElement);

  const count = properties.length;
  const loops = count > 1;
  /** Slide order on the strip; with looping, a copy sits at each end. */
  const order = loops ? [count - 1, ...properties.keys(), 0] : [0];
  const firstReal = loops ? 1 : 0;

  let position = firstReal;
  let shownIndex = -1;
  let slideWidth = 0;
  let trackWidth = 0;
  let settleTimer = 0;

  const slides = order.map((realIndex, slideIndex) => {
    const property = /** @type {Property} */ (properties[realIndex]);
    const isCopy = loops && (slideIndex === 0 || slideIndex === order.length - 1);
    const cover = property.images[0];
    const card = createElement(
      "a",
      { className: "featured__card", attributes: { href: property.href, draggable: "false" } },
      // Eager: only three to five cards exist, and each must be ready before it slides in.
      [cover ? createCoverImage(cover.url, isCopy ? "" : property.title, { eager: true }) : null],
    );
    const slide = createElement("div", { className: "featured__slide" }, [card]);
    slide.addEventListener("click", (event) => {
      if (slideIndex === position) return;
      // A side card brings its home to the centre instead of opening it.
      event.preventDefault();
      moveTo(slideIndex);
    });
    strip.append(slide);
    return { slide, card, realIndex };
  });

  const pageButtons = properties.map((_, index) => {
    const button = createElement("button", {
      className: "featured__page",
      text: `(${index + 1})`,
      attributes: { type: "button", "aria-label": `Show featured home ${index + 1} of ${count}` },
    });
    button.addEventListener("click", () => moveTo(index + firstReal));
    pagination.append(button);
    return button;
  });

  track.classList.remove("is-loading");
  status.remove();
  controls.hidden = !loops;

  /** @param {number} slideIndex */
  const offsetFor = (slideIndex) => trackWidth / 2 - (slideIndex + 0.5) * slideWidth;

  /** @param {number} extra */
  const applyTransform = (extra = 0) => {
    strip.style.transform = `translate3d(${offsetFor(position) + extra}px, 0, 0)`;
  };

  /** Runs `change` with transitions off, so the strip moves without animating. */
  const instantly = (/** @type {() => void} */ change) => {
    root.classList.add("is-instant");
    change();
    void strip.offsetWidth; // Commit the new position before transitions return.
    root.classList.remove("is-instant");
  };

  const measure = () => {
    trackWidth = track.clientWidth;
    slideWidth = slides[0]?.slide.offsetWidth ?? 0;
  };

  /** If the strip rests on a copy, swap to the real slide showing the same photo. */
  const settle = () => {
    window.clearTimeout(settleTimer);
    if (!loops) return;
    if (position === 0) position = count;
    else if (position === order.length - 1) position = firstReal;
    else return;
    instantly(() => {
      markActive();
      applyTransform();
    });
  };

  const markActive = () => {
    for (const [slideIndex, { slide, card }] of slides.entries()) {
      const isActive = slideIndex === position;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      card.tabIndex = isActive ? 0 : -1;
    }
  };

  const isOnCopy = () => loops && (position === 0 || position === order.length - 1);

  /** @param {number} slideIndex */
  const moveTo = (slideIndex) => {
    // Starting from a copy (a step mid-flight), hop to its real twin first; they look identical.
    if (isOnCopy()) settle();
    const target = Math.max(0, Math.min(order.length - 1, slideIndex));
    if (target === position) return;
    position = target;
    markActive();
    applyTransform();
    showDetails(slides[position]?.realIndex ?? 0);
    // `transitionend` settles the strip; the timer covers moves that never transition.
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, SLIDE_MS + 100);
  };

  /** @param {number} direction */
  const step = (direction) => {
    if (isOnCopy()) settle();
    moveTo(position + direction);
  };

  /** Title, details and pagination for the home in focus; skipped when it has not changed. */
  const showDetails = (/** @type {number} */ realIndex) => {
    if (realIndex === shownIndex) return;
    shownIndex = realIndex;
    const property = /** @type {Property} */ (properties[realIndex]);

    title.replaceChildren(
      ...createMaskedLines(splitIntoLines(shortenTitle(property.title, OVERLAY_TITLE_LENGTH), 2)),
    );
    details.replaceChildren(createDetails(property));

    for (const [index, button] of pageButtons.entries()) {
      button.setAttribute("aria-current", String(index === realIndex));
      button.querySelector(".featured__progress")?.remove();
    }
    startCountdown(realIndex);
  };

  // Autoplay: a progress line fills under the active number, and its end advances the slide.
  const autoplay = loops && !prefersReducedMotion();
  /** @type {Set<string>} */
  const pauseReasons = new Set();

  const setPaused = (/** @type {string} */ reason, /** @type {boolean} */ paused) => {
    if (paused) pauseReasons.add(reason);
    else pauseReasons.delete(reason);
    root.classList.toggle("is-paused", pauseReasons.size > 0);
  };

  const startCountdown = (/** @type {number} */ realIndex) => {
    const button = pageButtons[realIndex];
    if (!autoplay || !button) return;
    const progress = createElement("span", {
      className: "featured__progress",
      attributes: { "aria-hidden": "true" },
    });
    progress.addEventListener("animationend", () => step(1), { once: true });
    button.append(progress);
  };

  if (autoplay) {
    new IntersectionObserver(([entry]) => setPaused("offscreen", !entry?.isIntersecting)).observe(
      root,
    );
    document.addEventListener("visibilitychange", () => setPaused("hidden", document.hidden));
    // Keyboard users hold the slide while they read it; mouse clicks do not.
    root.addEventListener("focusin", (event) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) {
        setPaused("keyboard", true);
      }
    });
    root.addEventListener("focusout", (event) => {
      if (!root.contains(/** @type {Node | null} */ (event.relatedTarget))) {
        setPaused("keyboard", false);
      }
    });
  }

  strip.addEventListener("transitionend", (event) => {
    if (event.target === strip && event.propertyName === "transform") settle();
  });

  part(root, "[data-carousel-prev]", HTMLButtonElement).addEventListener("click", () => step(-1));
  part(root, "[data-carousel-next]", HTMLButtonElement).addEventListener("click", () => step(1));
  root.addEventListener("keydown", (event) => {
    if (!loops || !(event.target instanceof Element) || !track.contains(event.target)) return;
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });

  // Swipe and drag: the strip follows the pointer 1:1. Vertical swipes stay with the page
  // (`touch-action: pan-y`), and the browser cancels the gesture when it scrolls.
  let dragStartX = 0;
  let dragDistance = 0;
  let pointerId = -1;
  let wasDragged = false;

  track.addEventListener("pointerdown", (event) => {
    if (!loops || event.button !== 0) return;
    pointerId = event.pointerId;
    dragStartX = event.clientX;
    dragDistance = 0;
    wasDragged = false;
    if (isOnCopy()) settle();
  });

  track.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    dragDistance = event.clientX - dragStartX;
    if (!wasDragged && Math.abs(dragDistance) < DRAG_START_PX) return;
    if (!wasDragged) {
      wasDragged = true;
      track.setPointerCapture(pointerId);
      root.classList.add("is-dragging");
      setPaused("drag", true);
    }
    applyTransform(dragDistance);
  });

  const endDrag = (/** @type {PointerEvent} */ event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = -1;
    if (!wasDragged) return;
    root.classList.remove("is-dragging");
    setPaused("drag", false);
    const swiped = event.type === "pointerup" && Math.abs(dragDistance) >= SWIPE_THRESHOLD_PX;
    if (swiped) step(dragDistance < 0 ? 1 : -1);
    else applyTransform();
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // A drag ends with a click on whatever is under the pointer; do not let it open a card.
  track.addEventListener(
    "click",
    (event) => {
      if (!wasDragged) return;
      wasDragged = false;
      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true },
  );
  track.addEventListener("dragstart", (event) => event.preventDefault());

  // Re-centre only when the track's width changes; mobile address bars change only height.
  new ResizeObserver(() => {
    const previousWidth = trackWidth;
    measure();
    if (trackWidth !== previousWidth) instantly(applyTransform);
  }).observe(track);

  measure();
  instantly(() => {
    markActive();
    applyTransform();
  });
  showDetails(slides[position]?.realIndex ?? 0);
}

/**
 * @param {Property} property
 * @returns {HTMLElement}
 */
function createDetails(property) {
  const facts = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    formatArea(property.internalAreaSqm),
    property.reference ? `Ref. ${property.reference}` : null,
  ].filter((fact) => fact !== null);

  return createElement("div", { className: "featured__details fade-in" }, [
    createElement("div", { className: "featured__summary-block" }, [
      createElement("h3", { className: "featured__name", text: property.title }),
      property.summary
        ? createElement("p", { className: "featured__desc", text: property.summary })
        : null,
      createElement("p", { className: "featured__meta" }, [
        createElement("span", {
          className: "featured__price",
          text: formatPrice(property.price, property.listingType),
        }),
        facts.length > 0
          ? createElement("span", { className: "featured__specs", text: ` · ${facts.join(" · ")}` })
          : null,
      ]),
    ]),
    createPill(property.href, "View this home", "pill pill--outline featured__cta"),
  ]);
}
