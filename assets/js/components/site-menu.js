import { createCoverImage, createElement } from "../lib/dom.js";
import { formatPrice } from "../properties/format-property.js";
import { FEATURED_HOMES_LIMIT, getFeaturedProperties } from "../properties/property-api.js";

/**
 * Full-screen menu on the native <dialog>, which traps focus and closes on Escape.
 * The newest featured home is added the first time the menu opens.
 */
export function initSiteMenu() {
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

  const { data: properties } = await getFeaturedProperties(FEATURED_HOMES_LIMIT);
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
