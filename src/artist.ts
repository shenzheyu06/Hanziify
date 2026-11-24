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
const APPEARS_ON_TITLES = [
  // Appears On can have too few releases for a See all link. Identify its album
  // cards by the overview shelf class and exclude the Discography filters.
  '.main-shelf-shelf.p4Oms7ggaeACcjYs6bR3:not(:has(.Uy5TsJiNi39iCvWp83Ws)) a.main-card-cardTitleLink[href^="/album/"]',
  '.main-shelf-shelf.BNtmn81d3eXkOVoIhBmT a.main-card-cardTitleLink[href^="/album/"]',
];
// Both About views use this class for the biography body.
const BIOGRAPHY = '.eZM78YYSOCTE1FTK4tKC';

export function startArtistConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    // Spotify mounts the expanded About dialog outside the artist page.
    rootSelector: '[data-testid="artist-page"], .YH4IQI_NEKM1UEiOOfBi',
    textSelector: [
      ARTIST_HEADING,
      POPULAR_TRACK_TITLE,
      ...DISCOGRAPHY_TITLES,
      ...PLAYLIST_CARD_TEXT,
      ...ARTIST_PICK_TEXT,
      ...APPEARS_ON_TITLES,
      BIOGRAPHY,
    ].join(","),
    attributeFilter: ["data-testid", "class", "role", "href"],
  });
}
