/**
 * Marks `[data-reveal]` elements with `data-revealed` while they are in the viewport; CSS
 * then plays their entrance (see base.css). The mark is cleared once an element has fully
 * left the screen, out of sight, so the entrance plays again each time it scrolls back in.
 */
export function initScrollReveal() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (elements.length === 0) return;

  const enter = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.setAttribute("data-revealed", "");
      }
    },
    { rootMargin: "0px 0px -4% 0px" },
  );

  // A separate observer with no margin, so an element only resets when no part of it shows.
  const leave = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) entry.target.removeAttribute("data-revealed");
    }
  });

  for (const element of elements) {
    enter.observe(element);
    leave.observe(element);
  }
}
