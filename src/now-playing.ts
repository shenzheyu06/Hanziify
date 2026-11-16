import { startScopedConversion } from "./scoped-conversion.ts";

const BAR_SELECTOR = '[data-testid="now-playing-bar"]';
const TEXT_SELECTOR = [
  '[data-testid="context-item-info-title"]',
  '[data-testid="context-item-info-artist"]',
  '[data-testid="nowplaying-track-link"]',
  '[data-testid="nowplaying-artist"]',
  // Some Spotify versions omit those IDs and link the title to its album.
  // These selectors are only queried inside the now-playing bar.
  'a[href^="/album/"]',
  'a[href^="/artist/"]',
].join(",");

export function startNowPlayingConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: BAR_SELECTOR,
    textSelector: TEXT_SELECTOR,
  });
}
