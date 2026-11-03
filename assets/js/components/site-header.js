/** Scroll distance before the header gains its backdrop. */
const SOLID_AFTER_PX = 48;

/**
 * The header gains a blurred backdrop once the page scrolls and tucks away while scrolling
 * down, so content has the full screen. Keyboard focus always brings it back.
 */
export function initSiteHeader() {
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
