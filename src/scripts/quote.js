// Moves a trailing "—— name" out of a quote's last paragraph into its own line.
// It counts as an attribution only when it follows the end of a sentence, is short, and holds no
// markup or sentence punctuation; a dash inside a sentence stays where it is.
export function splitAttribution(inner) {
  return inner.replace(/(?<=[。！？」』）.!?”"])\s*——\s*([^<>。，！？；,;!?]{1,40}?)\s*<\/p>(\s*)$/, (match, by, tail) => `</p><footer class="quote-by">${by}</footer>${tail}`);
}
