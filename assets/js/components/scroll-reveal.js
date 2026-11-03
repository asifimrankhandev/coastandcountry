/**
 * Marks `[data-reveal]` elements with `data-revealed` the first time they enter the
 * viewport; CSS then plays their entrance once (see base.css).
 */
export function initScrollReveal() {
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
