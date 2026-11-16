import { startScopedConversion } from "./scoped-conversion.ts";

const ALBUM_SELECTOR = '[data-testid="album-page"]';
const TEXT_SELECTOR = [
  "h1",
  'a[href^="/artist/"]',
  '[role="row"] [role="gridcell"][aria-colindex="2"] div.standalone-ellipsis-one-line',
].join(",");

export function startAlbumConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: ALBUM_SELECTOR,
    textSelector: TEXT_SELECTOR,
    attributeFilter: ["data-testid", "class", "role", "aria-colindex", "href"],
  });
}
