import { startNowPlayingConversion } from "./now-playing";
import { createPlaylistConverter } from "./playlist.ts";

startNowPlayingConversion(document);
// Run Hanziify.convertVisiblePlaylist() in DevTools after opening a playlist.
Object.assign(window, {
  Hanziify: { convertVisiblePlaylist: createPlaylistConverter(document) },
});
console.info("Hanziify loaded successfully!");
