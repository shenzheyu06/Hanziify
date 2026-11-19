import { startScopedConversion } from "./scoped-conversion.ts";

// Spotify renders two variants of the artist's header title.
const ARTIST_HEADING = '.main-entityHeader-headerText :is([data-testid="entityTitle"], [data-testid="adaptiveEntityTitle"])';
// This wrapper identifies the Popular section in the installed Spotify client.
const POPULAR_TRACK_TITLE = '.AN_Jg5L5weM0cDia6BJV [role="row"] .main-trackList-rowMainContentTitle';
const DISCOGRAPHY_TITLES = [
  // The overview shares its shelf class with other sections. Match its release filters.
  '.p4Oms7ggaeACcjYs6bR3:has(.Uy5TsJiNi39iCvWp83Ws) a.main-card-cardTitleLink',
  '.artist-artistDiscography-cardGrid a.main-card-cardTitleLink',
  '.artist-artistDiscography-headerTitle > a',
];
// Spotify uses this subtitle wrapper for playlist cards in artist shelves.
const PLAYLIST_DESCRIPTION = '.main-shelf-shelf .zCXQkk3QnULi3ECXXoUh > .OyzopagU_GLhvcT1lDa0';

export function startArtistConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: '[data-testid="artist-page"]',
    textSelector: [ARTIST_HEADING, POPULAR_TRACK_TITLE, ...DISCOGRAPHY_TITLES, PLAYLIST_DESCRIPTION].join(","),
    attributeFilter: ["data-testid", "class", "role"],
  });
}
