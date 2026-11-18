import { startScopedConversion } from "./scoped-conversion.ts";

// Spotify renders two variants of the artist's header title.
const ARTIST_HEADING = '.main-entityHeader-headerText :is([data-testid="entityTitle"], [data-testid="adaptiveEntityTitle"])';
// This wrapper identifies the Popular section in the installed Spotify client.
const POPULAR_TRACK_TITLE = '.AN_Jg5L5weM0cDia6BJV [role="row"] .main-trackList-rowMainContentTitle';

export function startArtistConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: '[data-testid="artist-page"]',
    textSelector: `${ARTIST_HEADING}, ${POPULAR_TRACK_TITLE}`,
    attributeFilter: ["data-testid", "class", "role"],
  });
}
