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
export function createElement(tag, options = {}, children = []) {
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
export function createMaskedLines(lines) {
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
export function createCoverImage(src, alt, options = {}) {
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
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
