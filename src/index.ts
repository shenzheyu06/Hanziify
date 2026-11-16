import { startNowPlayingConversion } from "./now-playing";
import { createPlaylistConverter, startPlaylistConversion } from "./playlist.ts";
import { startNowPlayingSidebarConversion } from "./now-playing-sidebar.ts";
import { startLyricsConversion } from "./lyrics.ts";
import { startAlbumConversion } from "./album.ts";

startNowPlayingConversion(document);
startNowPlayingSidebarConversion(document);
startLyricsConversion(document);
startAlbumConversion(document);
const convertVisiblePlaylist = createPlaylistConverter(document);
startPlaylistConversion(document, convertVisiblePlaylist);
// Keep the manual command available for diagnostics, using the same cache.
Object.assign(window, {
  Hanziify: { convertVisiblePlaylist },
});
console.info("Hanziify loaded successfully!");
