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
const PLAYLIST_CARD_TEXT = [
  '.main-shelf-shelf a.main-card-cardTitleLink[href^="/playlist/"]',
  // Spotify uses this subtitle wrapper for playlist cards in artist shelves.
  '.main-shelf-shelf .zCXQkk3QnULi3ECXXoUh > .OyzopagU_GLhvcT1lDa0',
];
const ARTIST_PICK_TEXT = [
  '[data-testid="artist-pick-link"]',
  // Standard and background-image cards use different comment containers.
  '.Ebw_qQ3HNrQQKUcwLtIA .Zzj1XTVI7gvpKjebKqTK .standalone-ellipsis-one-line',
  '[data-testid="artist-pick-with-background-container"] ._ZnH9lmh923t4tl8cMA3 .standalone-ellipsis-one-line',
  '[data-testid="merch-artist-pick-comment"]',
  '[data-testid="artist-pick-merch-container"] h3',
  '.Ebw_qQ3HNrQQKUcwLtIA .SwSeQNOrS9ytJQAvgTK8', // Pinned concert title.
];

export function startArtistConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: '[data-testid="artist-page"]',
    textSelector: [ARTIST_HEADING, POPULAR_TRACK_TITLE, ...DISCOGRAPHY_TITLES, ...PLAYLIST_CARD_TEXT, ...ARTIST_PICK_TEXT].join(","),
    attributeFilter: ["data-testid", "class", "role", "href"],
  });
}
