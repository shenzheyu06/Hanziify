import { createTextConverter } from "./text-conversion.ts";
import { observeChanges } from "./observe-changes.ts";

const BAR_SELECTOR = '[data-testid="now-playing-bar"]';
const TEXT_SELECTOR = [
  '[data-testid="context-item-info-title"]',
  '[data-testid="context-item-info-artist"]',
  '[data-testid="nowplaying-track-link"]',
  '[data-testid="nowplaying-artist"]',
  // Some Spotify versions omit those IDs and link the title to its album.
  // These selectors are only queried inside the now-playing bar.
  'a[href^="/album/"]',
  'a[href^="/artist/"]',
].join(",");

export function startNowPlayingConversion(doc: Document): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};

  const convertElementText = createTextConverter(doc);

  function update() {
    for (const bar of doc.querySelectorAll(BAR_SELECTOR)) {
      for (const element of bar.querySelectorAll(TEXT_SELECTOR)) {
        convertElementText(element);
      }
    }
  }

  function affectsBar(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(BAR_SELECTOR)) return true;

    // Also detect a bar mounted after startup or replaced during navigation.
    return Array.from(record.addedNodes).some((node) => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(BAR_SELECTOR) || !!added.querySelector(BAR_SELECTOR);
    });
  }

  return observeChanges(doc, affectsBar, update);
}
