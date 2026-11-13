import { createTextConverter } from "./text-conversion.ts";
import { observeChanges } from "./observe-changes.ts";

// Spotify's sidebar keeps the current title and artists in this container,
// separate from lyrics, credits, recommendations, and playback controls.
const INFO_SELECTOR = ".main-nowPlayingView-contextItemInfo";
const NAME_SELECTOR = ".main-trackInfo-name";

export function startNowPlayingSidebarConversion(doc: Document): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  const convertElementText = createTextConverter(doc);

  function update() {
    for (const info of doc.querySelectorAll(INFO_SELECTOR)) {
      for (const name of info.querySelectorAll(NAME_SELECTOR)) {
        // Includes unlinked titles and artist names as well as normal links.
        convertElementText(name);
      }
    }
  }

  function affectsSidebar(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(INFO_SELECTOR)) return true;

    // Opening the sidebar can add its entire container at once.
    return Array.from(record.addedNodes).some((node) => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(INFO_SELECTOR) || !!added.querySelector(INFO_SELECTOR);
    });
  }

  return observeChanges(doc, affectsSidebar, update, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}
