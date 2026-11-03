import { prefersReducedMotion } from "../lib/dom.js";

/**
 * Drives the scroll stack (`.slide`, see layout.css). Each slide is pinned by its bottom
 * edge so all of its content is seen, and exposes how far the next slide covers it as
 * `--cover`, which shrinks and dims its card.
 *
 * All slides share one animation frame: every position is read first, then every style is
 * written, so scrolling never forces a layout between slides.
 */
export function initStackSections() {
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
