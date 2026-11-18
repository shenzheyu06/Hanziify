import { startScopedConversion } from "./scoped-conversion.ts";

const TITLE_SELECTORS = ["playlist", "album", "artist"].flatMap(type => [
  // List titles are not links; Spotify includes the entity URI in their IDs.
  `[id^="listrow-title-spotify:${type}:"]`,
  // Grid titles are navigable links.
  `a[role="gridcell"][href^="/${type}/"]`,
]);

export function startLibraryConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: ".main-yourLibraryX-libraryItemContainer",
    textSelector: TITLE_SELECTORS.join(","),
    attributeFilter: ["class", "id", "role", "href"],
  });
}
