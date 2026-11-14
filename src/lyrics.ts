import { createTextConverter } from "./text-conversion.ts";
import { observeChanges } from "./observe-changes.ts";

// The installed Spotify lyric-line component has its test ID stripped.
// Its generated class is a version-dependent fallback, not a general text selector.
const LINE_SELECTOR = '[data-testid="lyrics-line"], .J4_kkGYm5hjbZlztykxr';

export function startLyricsConversion(doc: Document): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  const convertElementText = createTextConverter(doc);

  function update() {
    for (const line of doc.querySelectorAll(LINE_SELECTOR)) {
      convertElementText(line);
    }
  }

  function affectsLyrics(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(LINE_SELECTOR)) return true;
    return Array.from(record.addedNodes).some(node => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(LINE_SELECTOR) || !!added.querySelector(LINE_SELECTOR);
    });
  }

  // Text and added nodes matter; playback highlighting changes need no pass.
  return observeChanges(doc, affectsLyrics, update);
}
