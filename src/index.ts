import { startNowPlayingConversion } from "./now-playing";
import { createPlaylistConverter, startPlaylistConversion } from "./playlist.ts";
import { startNowPlayingSidebarConversion } from "./now-playing-sidebar.ts";
import { startLyricsConversion } from "./lyrics.ts";
import { startAlbumConversion } from "./album.ts";
import { startArtistConversion } from "./artist.ts";
import { startSearchConversion } from "./search.ts";
import { startSearchPreviewConversion } from "./search-preview.ts";
import { startLibraryConversion } from "./library.ts";
import { startPlaylistSearch } from "./playlist-search.ts";

startNowPlayingConversion(document);
startNowPlayingSidebarConversion(document);
startLyricsConversion(document);
startAlbumConversion(document);
startArtistConversion(document);
startSearchConversion(document);
startSearchPreviewConversion(document);
startLibraryConversion(document);
const convertVisiblePlaylist = createPlaylistConverter(document);
startPlaylistConversion(document, convertVisiblePlaylist);
startPlaylistSearch(document);
// Keep the manual command available for diagnostics, using the same cache.
Object.assign(window, {
  Hanziify: { convertVisiblePlaylist },
});
console.info("Hanziify loaded successfully!");
