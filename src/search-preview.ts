import { startScopedConversion } from "./scoped-conversion.ts";

const ENTITY_LINKS = ["track", "artist", "album", "playlist"]
  .map(type => `a[href^="/${type}/"]`)
  .join(",");

export function startSearchPreviewConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: "#search-dropdown",
    textSelector: [
      ENTITY_LINKS,
      // Installed Spotify's creator subtitle span (separate from type labels).
      // Only include rows for supported entities, not query suggestions.
      `[role="row"]:has(${ENTITY_LINKS}) .kLNNFB6XpG6NJxfzpgre`,
    ].join(","),
    attributeFilter: ["id", "class", "role", "href"],
  });
}
