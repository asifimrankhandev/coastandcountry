import {
  createCoverImage,
  createElement,
  createMaskedLines,
  prefersReducedMotion,
} from "../lib/dom.js";
import { shortenTitle, splitIntoLines } from "../lib/text.js";
import { formatArea, formatPrice } from "../properties/format-property.js";
import { DEFAULT_FEATURED_PROPERTIES, getFeaturedProperties } from "../properties/property-api.js";

const FEATURED_LIMIT = 3;
const OVERLAY_TITLE_LENGTH = 34;
const SWIPE_THRESHOLD_PX = 40;
const AUTOPLAY_INTERVAL_MS = 6000;

export function initFeaturedCarousel() {
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
  if (count === 0) return;

  // Build extended slides array with clones: [cloneLast, ...items, cloneFirst]
  const extendedItems = [
    { ...properties[count - 1], realIndex: count - 1, isClone: true },
    ...properties.map((p, idx) => ({ ...p, realIndex: idx, isClone: false })),
    { ...properties[0], realIndex: 0, isClone: true },
  ];

  let currentSlide = 1; // Start at first real item (index 1)
  let isTransitioning = false;
  let autoplayTimer = null;
  let isHovered = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;

  container.innerHTML = `
    <div class="featured__head">
      <h2 id="featured-title" class="label featured__eyebrow">(FEATURED HOMES)</h2>
      <div class="featured__controls">
        <div class="featured__pagination" role="tablist" aria-label="Featured homes"></div>
        <div class="featured__arrows">
          <button type="button" class="featured__arrow-btn" aria-label="Previous home" data-carousel-prev>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button type="button" class="featured__arrow-btn" aria-label="Next home" data-carousel-next>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="featured__stage">
      <div class="featured__track">
        <div class="featured__strip"></div>
      </div>
      <h3 class="featured__title" aria-hidden="true"></h3>
    </div>
    <div class="featured__details-container" aria-live="polite"></div>
  `;

  const paginationEl = container.querySelector(".featured__pagination");
  const trackEl = container.querySelector(".featured__track");
  const stripEl = container.querySelector(".featured__strip");
  const overlayTitleEl = container.querySelector(".featured__title");
  const detailsEl = container.querySelector(".featured__details-container");
  const prevBtn = container.querySelector("[data-carousel-prev]");
  const nextBtn = container.querySelector("[data-carousel-next]");

  // Pagination buttons: (1) (2) (3)
  const pageButtons = properties.map((property, idx) => {
    const btn = createElement("button", {
      className: "featured__page",
      text: `(${idx + 1})`,
      attributes: {
        type: "button",
        role: "tab",
        "aria-label": `Show featured home ${idx + 1} of ${count}`,
      },
    });
    btn.addEventListener("click", () => {
      goToRealIndex(idx);
    });
    paginationEl.append(btn);
    return btn;
  });

  // Build slide elements inside the strip
  const slideElements = extendedItems.map((item, slideIdx) => {
    const slide = createElement("div", {
      className: "featured__slide",
      attributes: {
        "data-slide-index": String(slideIdx),
        "data-real-index": String(item.realIndex),
      },
    });

    const card = createElement("div", { className: "featured__card" });
    const coverUrl = item.images?.[0]?.url || "";
    const img = createCoverImage(coverUrl, item.title, { eager: slideIdx <= 2 });
    img.className = "cover featured__card-img";
    card.append(img);

    const link = createElement("a", {
      className: "featured__card-link",
      attributes: {
        href: item.href || "/properties",
        "aria-label": item.title,
        draggable: "false",
      },
    });
    card.append(link);

    slide.append(card);

    // Clicking a side slide advances to it
    slide.addEventListener("click", (e) => {
      if (isDragging) return;
      if (slideIdx !== currentSlide) {
        e.preventDefault();
        goToSlide(slideIdx);
      }
    });

    stripEl.append(slide);
    return slide;
  });

  function getRealIndex() {
    return extendedItems[currentSlide].realIndex;
  }

  function getBaseTranslateX(slideIdx) {
    const trackWidth = trackEl.offsetWidth;
    const targetSlide = slideElements[slideIdx];
    if (!targetSlide) return 0;
    const slideCenter = targetSlide.offsetLeft + targetSlide.offsetWidth / 2;
    return trackWidth / 2 - slideCenter;
  }

  function updateView(animate = true) {
    const realIdx = getRealIndex();
    const active = properties[realIdx];

    // Update active classes on slides
    slideElements.forEach((el, idx) => {
      const isActive = idx === currentSlide;
      el.classList.toggle("is-active", isActive);
      el.setAttribute("aria-hidden", String(!isActive));
      const link = el.querySelector(".featured__card-link");
      if (link) {
        link.tabIndex = isActive ? 0 : -1;
      }
    });

    // Update pagination tabs
    pageButtons.forEach((btn, idx) => {
      const isActive = idx === realIdx;
      btn.setAttribute("aria-current", String(isActive));
      btn.setAttribute("aria-selected", String(isActive));
      btn.querySelectorAll(".featured__progress").forEach((p) => p.remove());

      if (isActive && count > 1 && !prefersReducedMotion() && !isHovered) {
        const progress = createElement("span", {
          className: "featured__progress",
          attributes: { "aria-hidden": "true" },
        });
        btn.append(progress);
      }
    });

    // Apply strip translation
    const translateX = getBaseTranslateX(currentSlide);
    if (animate) {
      stripEl.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
    } else {
      stripEl.style.transition = "none";
    }
    stripEl.style.transform = `translate3d(${translateX}px, 0, 0)`;

    // Update overlay title
    overlayTitleEl.replaceChildren();
    const shortTitle = shortenTitle(active.title, OVERLAY_TITLE_LENGTH);
    const titleLines = splitIntoLines(shortTitle, 2);
    const maskedSpans = createMaskedLines(titleLines);
    overlayTitleEl.append(...maskedSpans);
    overlayTitleEl.classList.remove("rise-in");
    void overlayTitleEl.offsetWidth;
    overlayTitleEl.classList.add("rise-in");

    // Update details beneath center card
    const facts = [
      active.bedrooms ? `${active.bedrooms} bed` : null,
      formatArea(active.internalAreaSqm),
      active.reference ? `Ref. ${active.reference}` : null,
    ].filter(Boolean);

    const priceText = formatPrice(active.price, active.listingType);

    const detailsGrid = createElement("div", { className: "featured__details fade-in" }, [
      createElement("div", { className: "featured__summary-block" }, [
        createElement("p", {
          className: "featured__desc",
          text:
            active.summary ||
            active.description ||
            "Two-story luxury residence featuring sunlit living spaces, private terraces, and panoramic mountain & sea views.",
        }),
        createElement("div", { className: "featured__meta" }, [
          createElement("span", { className: "featured__price", text: priceText }),
          facts.length > 0
            ? createElement("span", { className: "featured__specs", text: ` · ${facts.join(" · ")}` })
            : null,
        ]),
      ]),
      createElement("div", { className: "featured__cta-wrap" }, [
        createElement(
          "a",
          {
            className: "pill pill--solid featured__cta",
            attributes: { href: active.href || "/properties", "aria-label": `Learn more about ${active.title}` },
          },
          [
            createElement("span", { className: "pill__label" }, [
              createElement("span", { text: "Learn more" }),
              createElement("span", { text: "Learn more", attributes: { "aria-hidden": "true" } }),
            ]),
          ],
        ),
      ]),
    ]);

    detailsEl.replaceChildren(detailsGrid);
  }

  function goToSlide(slideIdx) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentSlide = slideIdx;
    updateView(true);
    resetAutoplay();
  }

  function step(dir) {
    if (isTransitioning) return;
    goToSlide(currentSlide + dir);
  }

  function goToRealIndex(targetRealIdx) {
    if (isTransitioning) return;
    // Find closest slide matching targetRealIdx
    const targetSlide = targetRealIdx + 1; // real 0 -> slide 1, real 1 -> slide 2, etc.
    goToSlide(targetSlide);
  }

  // Handle loop boundary resets on transitionend
  stripEl.addEventListener("transitionend", (e) => {
    if (e.target !== stripEl) return;
    isTransitioning = false;

    // If on cloneLast (index 0), jump seamlessly to real last (index count)
    if (currentSlide === 0) {
      currentSlide = count;
      updateView(false);
    }
    // If on cloneFirst (index count + 1), jump seamlessly to real first (index 1)
    else if (currentSlide === count + 1) {
      currentSlide = 1;
      updateView(false);
    }
  });

  // Controls
  if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => step(1));

  // Autoplay
  function startAutoplay() {
    stopAutoplay();
    if (count > 1 && !prefersReducedMotion() && !isHovered) {
      autoplayTimer = window.setTimeout(() => {
        step(1);
      }, AUTOPLAY_INTERVAL_MS);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Hover detection to pause autoplay
  container.addEventListener("mouseenter", () => {
    isHovered = true;
    stopAutoplay();
  });
  container.addEventListener("mouseleave", () => {
    isHovered = false;
    startAutoplay();
  });

  // Touch / pointer swipe handling with 1:1 finger tracking
  trackEl.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDragging = false;
    dragStartX = e.clientX;
    dragDeltaX = 0;
    stopAutoplay();

    function onPointerMove(moveEvent) {
      dragDeltaX = moveEvent.clientX - dragStartX;
      if (Math.abs(dragDeltaX) > 8) {
        isDragging = true;
        const baseTranslateX = getBaseTranslateX(currentSlide);
        stripEl.style.transition = "none";
        stripEl.style.transform = `translate3d(${baseTranslateX + dragDeltaX}px, 0, 0)`;
      }
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (isDragging) {
        if (Math.abs(dragDeltaX) >= SWIPE_THRESHOLD_PX) {
          step(dragDeltaX < 0 ? 1 : -1);
        } else {
          // Snap back to current
          updateView(true);
        }
        setTimeout(() => {
          isDragging = false;
        }, 50);
      } else {
        startAutoplay();
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
  });

  // Responsive layout recalibration on resize
  window.addEventListener("resize", () => {
    updateView(false);
  });

  // Initial render
  // Ensure layout is measured after DOM attachment
  requestAnimationFrame(() => {
    updateView(false);
    startAutoplay();
  });
}
