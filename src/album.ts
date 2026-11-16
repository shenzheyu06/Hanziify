import { createTextConverter } from "./text-conversion.ts";
import { observeChanges } from "./observe-changes.ts";

const ALBUM_SELECTOR = '[data-testid="album-page"]';
const TEXT_SELECTOR = [
  "h1",
  'a[href^="/artist/"]',
  '[role="row"] [role="gridcell"][aria-colindex="2"] div.standalone-ellipsis-one-line',
].join(",");

export function startAlbumConversion(doc: Document): () => void {
  const win = doc.defaultView;
  if (!win) return () => {};
  const convertElementText = createTextConverter(doc);

  function update() {
    for (const album of doc.querySelectorAll(ALBUM_SELECTOR)) {
      for (const element of album.querySelectorAll(TEXT_SELECTOR)) {
        convertElementText(element);
      }
    }
  }

  function affectsAlbum(record: MutationRecord): boolean {
    const element = record.target.nodeType === win!.Node.ELEMENT_NODE
      ? record.target as Element
      : record.target.parentElement;
    if (element?.closest(ALBUM_SELECTOR)) return true;

    // Navigation can add a whole album page inside a new container.
    return Array.from(record.addedNodes).some(node => {
      if (node.nodeType !== win!.Node.ELEMENT_NODE) return false;
      const added = node as Element;
      return added.matches(ALBUM_SELECTOR) || !!added.querySelector(ALBUM_SELECTOR);
    });
  }

  return observeChanges(doc, affectsAlbum, update, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-testid", "class", "role", "aria-colindex", "href"],
  });
}
