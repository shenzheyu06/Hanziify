import { startScopedConversion } from "./scoped-conversion.ts";

// The full results route owns this container; the typing preview is outside it.
const SEARCH_SELECTOR = "#searchPage";
const TEXT_SELECTOR = [
  'a[href^="/track/"]',
  'a[href^="/artist/"]',
  // Compact and full song lists can put the title in different columns.
  // Find the cell with artist links, rather than relying on its column number.
  '[role="row"] [role="gridcell"]:has(a[href^="/artist/"]) div.standalone-ellipsis-one-line',
].join(",");

export function startSearchConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: SEARCH_SELECTOR,
    textSelector: TEXT_SELECTOR,
    attributeFilter: ["id", "class", "role", "href"],
  });
}
