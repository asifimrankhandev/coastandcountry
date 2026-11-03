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
const SWIPE_THRESHOLD_PX = 48;
const SLOTS = [-2, -1, 0, 1, 2];

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
  let position = 0;
  let hasKeyboardFocus = false;
  let isInView = false;
  let isHovered = false;
  let swipeStartX = null;
  let didSwipe = false;

  const itemAt = (virtualIndex) => properties[((virtualIndex % count) + count) % count];

  container.innerHTML = `
    <div class="featured__head">
      <h2 id="featured-title" class="label featured__eyebrow">(FEATURED HOMES)</h2>
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
      <h3 class="featured__title" aria-hidden="true"></h3>
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

  // Create pagination buttons: (1) (2) (3)
  const pageButtons = properties.map((property, index) => {
    const btn = createElement("button", {
      className: "featured__page",
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

    // Update details matching reference sec_04.jpg
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
            attributes: { href: active.href, "aria-label": `Learn more about ${active.title}` },
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
