import { prefersReducedMotion } from "../lib/dom.js";

const numberFormat = new Intl.NumberFormat("en-GB");
const DURATION_MS = 1800;

/**
 * Counts `output` from zero to `value` the first time it scrolls into view. The final value
 * is exposed as its accessible name, so screen readers never announce an in-between number.
 *
 * @param {HTMLElement} output
 * @param {number} value
 */
export function countUp(output, value) {
  const render = (/** @type {number} */ current) => {
    output.textContent = numberFormat.format(current);
  };
  output.setAttribute("role", "img");
  output.setAttribute("aria-label", numberFormat.format(value));

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
