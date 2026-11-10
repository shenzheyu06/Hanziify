import { Converter } from "opencc-js/t2cn";

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

  const convert = Converter({ from: "t", to: "cn" });
  // Weak keys let Spotify's discarded nodes be garbage-collected.
  const lastText = new WeakMap<Text, string>();
  let frame: number | undefined;

  function update() {
    frame = undefined;
    for (const bar of doc.querySelectorAll(BAR_SELECTOR)) {
      for (const element of bar.querySelectorAll(TEXT_SELECTOR)) {
        const walker = doc.createTreeWalker(element, win!.NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node as Text;
          if (lastText.get(text) === text.data) continue;

          const converted = convert(text.data);
          // Change only text, preserving links, handlers, and nested markup.
          if (converted !== text.data) text.data = converted;
          lastText.set(text, converted);
        }
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

  const observer = new win.MutationObserver((records) => {
    if (frame === undefined && records.some(affectsBar)) {
      frame = win.requestAnimationFrame(update);
    }
  });

  observer.observe(doc.documentElement, { childList: true, characterData: true, subtree: true });
  update();

  return () => {
    observer.disconnect();
    if (frame !== undefined) win.cancelAnimationFrame(frame);
  };
}
