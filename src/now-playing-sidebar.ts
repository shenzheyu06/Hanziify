import { startScopedConversion } from "./scoped-conversion.ts";

// Spotify's sidebar keeps the current title and artists in this container,
// separate from lyrics, credits, recommendations, and playback controls.
const INFO_SELECTOR = ".main-nowPlayingView-contextItemInfo";
const NAME_SELECTOR = ".main-trackInfo-name";

export function startNowPlayingSidebarConversion(doc: Document): () => void {
  return startScopedConversion(doc, {
    rootSelector: INFO_SELECTOR,
    textSelector: NAME_SELECTOR,
    attributeFilter: ["class"],
  });
}
