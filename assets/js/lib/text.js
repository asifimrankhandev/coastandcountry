/**
 * Splits text at word boundaries into at most `count` lines of roughly equal length.
 *
 * @param {string} text
 * @param {number} count
 * @returns {string[]}
 */
export function splitIntoLines(text, count) {
  const words = text.split(/\s+/).filter(Boolean);
  const targetLength = text.length / count;
  /** @type {string[]} */
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > targetLength && lines.length < count - 1) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Keeps whole words from the start of `text` until adding another would exceed `maxLength`.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function shortenTitle(text, maxLength) {
  let result = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > maxLength && result) break;
    result = candidate;
  }
  // Drop a dangling connector such as "with" or "&" left at the cut.
  return result.replace(/\s+(with|and|&|in|of|for|-)$/i, "");
}
