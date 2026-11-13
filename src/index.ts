import { startNowPlayingConversion } from "./now-playing";
import { createPlaylistConverter, startPlaylistConversion } from "./playlist.ts";

startNowPlayingConversion(document);
const convertVisiblePlaylist = createPlaylistConverter(document);
startPlaylistConversion(document, convertVisiblePlaylist);
// Keep the manual command available for diagnostics, using the same cache.
Object.assign(window, {
  Hanziify: { convertVisiblePlaylist },
});
console.info("Hanziify loaded successfully!");
